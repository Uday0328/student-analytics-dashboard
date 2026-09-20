import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  QueryExecutionState,
  Row,
  ColumnInfo,
} from '@aws-sdk/client-athena';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Environment Configuration (using Lambda IAM Execution Role)
const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const ATHENA_DATABASE = process.env.ATHENA_DATABASE || 'student_data_lake_db';
const ATHENA_OUTPUT_LOCATION =
  process.env.ATHENA_OUTPUT_LOCATION ||
  's3://student-data-lake-2026-pujith-958280224194-ap-southeast-2-an/athena-results/';
const ATHENA_WORKGROUP = process.env.ATHENA_WORKGROUP || 'primary';
const S3_DATA_LAKE_BUCKET =
  process.env.S3_DATA_LAKE_BUCKET ||
  'student-data-lake-2026-pujith-958280224194-ap-southeast-2-an';

// Max polling timeout configuration
const MAX_POLL_TIMEOUT_MS = 25000;
const INITIAL_POLL_INTERVAL_MS = 400;

// Initialize Athena & S3 Clients (Credentials automatically inferred from IAM execution role)
const athenaClient = new AthenaClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

// Common CORS Response Headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json',
};

/**
 * Execute Athena SQL query asynchronously with polling
 */
async function executeAthenaQuery(sqlQuery: string): Promise<Record<string, any>[]> {
  // Step 1: Start Query Execution
  const startCmd = new StartQueryExecutionCommand({
    QueryString: sqlQuery,
    QueryExecutionContext: {
      Database: ATHENA_DATABASE,
    },
    ResultConfiguration: {
      OutputLocation: ATHENA_OUTPUT_LOCATION,
    },
    WorkGroup: ATHENA_WORKGROUP,
  });

  const startRes = await athenaClient.send(startCmd);
  const queryExecutionId = startRes.QueryExecutionId;

  if (!queryExecutionId) {
    throw new Error('Failed to obtain Athena QueryExecutionId');
  }

  // Step 2: Poll query status until SUCCEEDED / FAILED / CANCELLED
  const startTime = Date.now();
  let pollInterval = INITIAL_POLL_INTERVAL_MS;

  while (Date.now() - startTime < MAX_POLL_TIMEOUT_MS) {
    const statusCmd = new GetQueryExecutionCommand({
      QueryExecutionId: queryExecutionId,
    });
    const statusRes = await athenaClient.send(statusCmd);
    const state = statusRes.QueryExecution?.Status?.State;

    if (state === QueryExecutionState.SUCCEEDED) {
      break;
    }

    if (state === QueryExecutionState.FAILED) {
      const reason = statusRes.QueryExecution?.Status?.StateChangeReason || 'Unknown error';
      throw new Error(`Athena query execution failed: ${reason}`);
    }

    if (state === QueryExecutionState.CANCELLED) {
      throw new Error('Athena query was cancelled.');
    }

    // Exponential backoff up to 2 seconds
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    pollInterval = Math.min(pollInterval * 1.5, 2000);
  }

  // Step 3: Fetch Paginated Query Results
  const resultsCmd = new GetQueryResultsCommand({
    QueryExecutionId: queryExecutionId,
  });
  const resultsRes = await athenaClient.send(resultsCmd);

  const columnInfoList: ColumnInfo[] =
    resultsRes.ResultSet?.ResultSetMetadata?.ColumnInfo || [];
  const rows: Row[] = resultsRes.ResultSet?.Rows || [];

  if (rows.length <= 1) {
    // Empty result set (row 0 is header)
    return [];
  }

  // Parse header and data rows
  const columnNames = columnInfoList.map((col) => col.Name || '');
  const dataRows = rows.slice(1);

  return dataRows.map((row) => {
    const record: Record<string, any> = {};
    const rowData = row.Data || [];

    columnNames.forEach((colName, index) => {
      const rawValue = rowData[index]?.VarCharValue;
      const colType = columnInfoList[index]?.Type?.toLowerCase() || '';

      if (rawValue === undefined || rawValue === null) {
        record[colName] = null;
      } else if (
        colType.includes('int') ||
        colType.includes('bigint') ||
        colType.includes('tinyint') ||
        colType.includes('smallint')
      ) {
        record[colName] = parseInt(rawValue, 10);
      } else if (
        colType.includes('double') ||
        colType.includes('float') ||
        colType.includes('decimal')
      ) {
        record[colName] = parseFloat(rawValue);
      } else {
        record[colName] = rawValue;
      }
    });

    return record;
  });
}

/**
 * Route Handler mapping API paths to predefined SQL queries
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  _context?: Context
): Promise<APIGatewayProxyResult> => {
  // Handle HTTP OPTIONS for preflight CORS
  const httpMethod = event.httpMethod || (event.requestContext as any)?.http?.method || 'GET';
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  // Extract Path
  const rawPath = event.path || (event.requestContext as any)?.http?.path || '/api/metrics';
  const queryParams = event.queryStringParameters || {};

  try {
    // 1. GET /api/metrics
    if (rawPath.endsWith('/api/metrics')) {
      const sql = `
        SELECT 
  COUNT(*) AS total_students,
  ROUND(AVG(g1), 2) AS average_g1,
  ROUND(AVG(g2), 2) AS average_g2,
  ROUND(AVG(g3), 2) AS average_g3,
  ROUND(AVG(absences), 2) AS average_absences,
  ROUND(AVG(studytime), 2) AS average_studytime,
  COUNT(CASE WHEN g3 >= 10 THEN 1 END) AS pass_students,
  COUNT(CASE WHEN g3 < 10 THEN 1 END) AS fail_students,
  ROUND(
    COUNT(CASE WHEN g3 >= 10 THEN 1 END) * 100.0 / COUNT(*),
    2
  ) AS pass_rate,
  COUNT(CASE WHEN risk_level = 'High Risk' THEN 1 END) AS high_risk_students,
  COUNT(CASE WHEN risk_level = 'Moderate Risk' THEN 1 END) AS moderate_risk_students,
  COUNT(CASE WHEN risk_level = 'Low Risk' THEN 1 END) AS low_risk_students
FROM "${ATHENA_DATABASE}"."student_risk_analysis_new";
      `;

      const results = await executeAthenaQuery(sql);
      const metrics = results[0] || {
        total_students: 0,
        average_g1: 0,
        average_g2: 0,
        average_g3: 0,
        average_absences: 0,
        average_studytime: 0,
        pass_students: 0,
        fail_students: 0,
        pass_rate: 0,
        high_risk_students: 0,
        moderate_risk_students: 0,
        low_risk_students: 0,
      };

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          database: ATHENA_DATABASE,
          table: 'student_risk_analysis_new',
          metrics,
        }),
      };
    }

    // 2. GET /api/students
    if (httpMethod === 'GET' && rawPath.endsWith('/api/students')) {
      const whereConditions: string[] = [];

      // Safe parameter sanitization using strict whitelists
      if (queryParams.school && ['GP', 'MS'].includes(queryParams.school)) {
        whereConditions.push(`school = '${queryParams.school}'`);
      }
      if (queryParams.sex && ['F', 'M'].includes(queryParams.sex)) {
        whereConditions.push(`sex = '${queryParams.sex}'`);
      }
      if (queryParams.studytime && ['1', '2', '3', '4'].includes(queryParams.studytime)) {
        whereConditions.push(`studytime = ${parseInt(queryParams.studytime, 10)}`);
      }
      if (
        queryParams.performance_level &&
        ['High', 'Medium', 'Low'].includes(queryParams.performance_level)
      ) {
        whereConditions.push(`performance_level = '${queryParams.performance_level}'`);
      }
      if (
        queryParams.risk_level &&
        ['Low Risk', 'Moderate Risk', 'High Risk'].includes(queryParams.risk_level)
      ) {
        whereConditions.push(`risk_level = '${queryParams.risk_level}'`);
      }
      if (
        queryParams.absence_group &&
        ['Low (0-4)', 'Moderate (5-9)', 'High (10+)'].includes(queryParams.absence_group)
      ) {
        whereConditions.push(`absence_group = '${queryParams.absence_group}'`);
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const limit = Math.min(
        parseInt(queryParams.limit || '1500', 10) || 1500,
        2000
      );

      const sql = `
        SELECT 
          school,
          sex,
          age,
          studytime,
          absences,
          g1,
          g2,
          g3,
          performance_level,
          absence_group,
          risk_score,
          risk_level
        FROM "${ATHENA_DATABASE}"."student_risk_analysis_new"
        ${whereClause}
        LIMIT ${limit};
      `;

      const students = await executeAthenaQuery(sql);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          database: ATHENA_DATABASE,
          table: 'student_risk_analysis_new',
          count: students.length,
          students,
        }),
      };
    }

    // 2.5. POST /api/students
    if (httpMethod === 'POST' && (rawPath.endsWith('/api/students') || rawPath.endsWith('/api/students/'))) {
      let body: any = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch (e) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'InvalidJSON', message: 'Invalid JSON body provided.' }),
        };
      }

      const studentId = (body.id || body.student_id || '').trim();
      if (!studentId) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'ValidationError', message: 'Student ID is required.' }),
        };
      }

      // Check duplicate Student ID in Athena database
      try {
        const checkSql = `SELECT student_id FROM "${ATHENA_DATABASE}"."student_risk_analysis_new" WHERE student_id = '${studentId.replace(/'/g, "''")}' LIMIT 1;`;
        const existing = await executeAthenaQuery(checkSql);
        if (existing && existing.length > 0) {
          return {
            statusCode: 409,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: 'DuplicateStudentId',
              message: `Student ID '${studentId}' already exists. Please enter a unique Student ID.`,
            }),
          };
        }
      } catch (err: any) {
        console.warn('Duplicate check query warning:', err.message);
      }

      // Calculate derived fields using exact project rules
      const g3 = Number(body.G3 ?? body.g3 ?? 0);
      const g1 = Number(body.G1 ?? body.g1 ?? 0);
      const g2 = Number(body.G2 ?? body.g2 ?? 0);
      const absences = Number(body.absences ?? 0);
      const studytime = Number(body.studytime ?? 2);
      const failures = Number(body.failures ?? 0);

      let absence_group = 'Low (0-4)';
      if (absences >= 10) absence_group = 'High (10+)';
      else if (absences >= 5) absence_group = 'Moderate (5-9)';

      let performance_level = 'Medium';
      if (g3 >= 15) performance_level = 'High';
      else if (g3 < 10) performance_level = 'Low';

      let risk_level = 'Low Risk';
      if (g3 < 10 || absences >= 10) {
        risk_level = 'High Risk';
      } else if (g3 < 12 || absences >= 5) {
        risk_level = 'Moderate Risk';
      }

      const pass_status = g3 >= 10 ? 'Pass' : 'Fail';

      const studentRecord = {
        id: studentId,
        school: body.school || 'GP',
        sex: body.sex || 'F',
        age: Number(body.age || 17),
        studytime,
        failures,
        schoolsup: body.schoolsup || 'no',
        famsup: body.famsup || 'yes',
        paid: body.paid || 'no',
        activities: body.activities || 'yes',
        higher: body.higher || 'yes',
        internet: body.internet || 'yes',
        famrel: Number(body.famrel || 4),
        freetime: Number(body.freetime || 3),
        goout: Number(body.goout || 3),
        health: Number(body.health || 4),
        absences,
        G1: g1,
        G2: g2,
        G3: g3,
        performance_level,
        absence_group,
        risk_level,
        pass_status,
      };

      const s3Key = `raw/new_students/${studentId}.json`;
      const putCmd = new PutObjectCommand({
        Bucket: S3_DATA_LAKE_BUCKET,
        Key: s3Key,
        Body: JSON.stringify(studentRecord),
        ContentType: 'application/json',
      });

      await s3Client.send(putCmd);

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: true,
          message: 'Student record created successfully and stored in AWS Data Lake',
          student_id: studentId,
          s3_key: s3Key,
          student: studentRecord,
        }),
      };
    }

    // 3. GET /api/schools
    if (rawPath.endsWith('/api/schools')) {
      const sql = `
        SELECT 
          school,
          COUNT(*) AS student_count,
          ROUND(AVG(g3), 2) AS average_g3
        FROM "${ATHENA_DATABASE}"."student_risk_analysis_new"
        GROUP BY school
        ORDER BY school ASC;
      `;
      const data = await executeAthenaQuery(sql);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ data }),
      };
    }

    // 4. GET /api/performance
    if (rawPath.endsWith('/api/performance')) {
      const sql = `
        SELECT 
          performance_level,
          COUNT(*) AS student_count,
          ROUND(AVG(g3), 2) AS average_g3
        FROM "${ATHENA_DATABASE}"."student_risk_analysis_new"
        GROUP BY performance_level
        ORDER BY average_g3 DESC;
      `;
      const data = await executeAthenaQuery(sql);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ data }),
      };
    }

    // 5. GET /api/risk
    if (rawPath.endsWith('/api/risk')) {
      const sql = `
        SELECT 
          risk_level,
          COUNT(*) AS student_count,
          ROUND(AVG(g3), 2) AS average_g3
        FROM "${ATHENA_DATABASE}"."student_risk_analysis_new"
        GROUP BY risk_level;
      `;
      const data = await executeAthenaQuery(sql);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ data }),
      };
    }

    // 6. GET /api/absence-analysis
    if (rawPath.endsWith('/api/absence-analysis')) {
      const sql = `
        SELECT 
          absence_group,
          COUNT(*) AS student_count,
          ROUND(AVG(g3), 2) AS average_g3
        FROM "${ATHENA_DATABASE}"."student_risk_analysis_new"
        GROUP BY absence_group;
      `;
      const data = await executeAthenaQuery(sql);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ data }),
      };
    }

    // 7. GET /api/studytime-analysis
    if (rawPath.endsWith('/api/studytime-analysis')) {
      const sql = `
        SELECT 
          studytime,
          COUNT(*) AS student_count,
          ROUND(AVG(g3), 2) AS average_g3
        FROM "${ATHENA_DATABASE}"."student_risk_analysis_new"
        GROUP BY studytime
        ORDER BY studytime ASC;
      `;
      const data = await executeAthenaQuery(sql);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ data }),
      };
    }

    // 404 Route Not Found
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Not Found',
        message: `Endpoint ${rawPath} is not recognized.`,
        availableEndpoints: [
          'GET /api/metrics',
          'GET /api/students',
          'GET /api/schools',
          'GET /api/performance',
          'GET /api/risk',
          'GET /api/absence-analysis',
          'GET /api/studytime-analysis',
        ],
      }),
    };
  } catch (error: any) {
    console.error('Lambda Athena execution error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'AthenaExecutionError',
        message: error.message || 'An error occurred during Athena execution',
      }),
    };
  }
};
