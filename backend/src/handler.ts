import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  QueryExecutionState,
  Row,
  ColumnInfo,
} from '@aws-sdk/client-athena';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Environment Configuration (using Lambda IAM Execution Role)
const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const ATHENA_DATABASE = process.env.ATHENA_DATABASE || 'student_data_lake_db';
const ATHENA_OUTPUT_LOCATION =
  process.env.ATHENA_OUTPUT_LOCATION ||
  's3://student-data-lake-2026-pujith-958280224194-ap-southeast-2-an/athena-results/';
const ATHENA_WORKGROUP = process.env.ATHENA_WORKGROUP || 'primary';
const STUDENT_DATA_BUCKET =
  process.env.STUDENT_DATA_BUCKET ||
  'student-data-lake-2026-pujith-958280224194-ap-southeast-2-an';

// Max polling timeout configuration
const MAX_POLL_TIMEOUT_MS = 25000;
const INITIAL_POLL_INTERVAL_MS = 400;

// Initialize AWS Clients (Credentials automatically inferred from IAM execution role)
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
 * Read newly added student JSON objects persisted in S3 raw/new_students/
 */
async function getNewStudentsFromS3(): Promise<Record<string, any>[]> {
  try {
    const listCmd = new ListObjectsV2Command({
      Bucket: STUDENT_DATA_BUCKET,
      Prefix: 'raw/new_students/',
    });
    const listRes = await s3Client.send(listCmd);
    const contents = listRes.Contents || [];
    const jsonFiles = contents.filter(
      (obj) => obj.Key && obj.Key.endsWith('.json') && obj.Key !== 'raw/new_students/'
    );
    if (jsonFiles.length === 0) return [];

    const promises = jsonFiles.map(async (file) => {
      try {
        const getCmd = new GetObjectCommand({
          Bucket: STUDENT_DATA_BUCKET,
          Key: file.Key,
        });
        const getRes = await s3Client.send(getCmd);
        const str = await getRes.Body?.transformToString();
        return str ? JSON.parse(str) : null;
      } catch (err) {
        console.error(`Error reading ${file.Key}:`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((s) => s !== null);
  } catch (err) {
    console.error('Error fetching new students from S3:', err);
    return [];
  }
}

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

      const [results, newS3Students] = await Promise.all([
        executeAthenaQuery(sql),
        getNewStudentsFromS3(),
      ]);

      let metrics = results[0] || {
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

      if (newS3Students.length > 0) {
        const athenaCount = Number(metrics.total_students || 0);
        const newCount = newS3Students.length;
        const totalCount = athenaCount + newCount;

        const newG1Sum = newS3Students.reduce((sum, s) => sum + Number(s.G1 || s.g1 || 0), 0);
        const newG2Sum = newS3Students.reduce((sum, s) => sum + Number(s.G2 || s.g2 || 0), 0);
        const newG3Sum = newS3Students.reduce((sum, s) => sum + Number(s.G3 || s.g3 || 0), 0);
        const newAbsSum = newS3Students.reduce((sum, s) => sum + Number(s.absences || 0), 0);
        const newStudySum = newS3Students.reduce((sum, s) => sum + Number(s.studytime || 2), 0);
        const newPass = newS3Students.filter((s) => Number(s.G3 || s.g3 || 0) >= 10).length;
        const newFail = newCount - newPass;
        const newHighRisk = newS3Students.filter((s) => s.risk_level === 'High Risk').length;
        const newModRisk = newS3Students.filter((s) => s.risk_level === 'Moderate Risk').length;
        const newLowRisk = newS3Students.filter((s) => s.risk_level === 'Low Risk').length;

        const avgG1 = Number(((Number(metrics.average_g1 || 0) * athenaCount + newG1Sum) / totalCount).toFixed(2));
        const avgG2 = Number(((Number(metrics.average_g2 || 0) * athenaCount + newG2Sum) / totalCount).toFixed(2));
        const avgG3 = Number(((Number(metrics.average_g3 || 0) * athenaCount + newG3Sum) / totalCount).toFixed(2));
        const avgAbs = Number(((Number(metrics.average_absences || 0) * athenaCount + newAbsSum) / totalCount).toFixed(2));
        const avgStudy = Number(((Number(metrics.average_studytime || 0) * athenaCount + newStudySum) / totalCount).toFixed(2));
        const passStudents = Number(metrics.pass_students || 0) + newPass;
        const failStudents = Number(metrics.fail_students || 0) + newFail;
        const passRate = Number(((passStudents * 100.0) / totalCount).toFixed(2));

        metrics = {
          total_students: totalCount,
          average_g1: avgG1,
          average_g2: avgG2,
          average_g3: avgG3,
          average_absences: avgAbs,
          average_studytime: avgStudy,
          pass_students: passStudents,
          fail_students: failStudents,
          pass_rate: passRate,
          high_risk_students: Number(metrics.high_risk_students || 0) + newHighRisk,
          moderate_risk_students: Number(metrics.moderate_risk_students || 0) + newModRisk,
          low_risk_students: Number(metrics.low_risk_students || 0) + newLowRisk,
        };
      }

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

    // 2. POST /api/students (Enroll / Add New Student)
    if (rawPath.endsWith('/api/students') && httpMethod === 'POST') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'BadRequest',
            message: 'Request body is required.',
          }),
        };
      }

      let payload: any;
      try {
        payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch (parseErr) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'BadRequest',
            message: 'Invalid JSON payload in request body.',
          }),
        };
      }

      // 1. Validate Student ID
      const id = String(payload.id || '').trim().toUpperCase();
      if (!id) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'id' is required and must be a non-empty string.",
          }),
        };
      }

      // 2. Validate School
      const school = String(payload.school || '').toUpperCase();
      if (!['GP', 'MS'].includes(school)) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'school' must be either 'GP' or 'MS'.",
          }),
        };
      }

      // 3. Validate Sex
      const sex = String(payload.sex || '').toUpperCase();
      if (!['F', 'M'].includes(sex)) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'sex' must be either 'F' or 'M'.",
          }),
        };
      }

      // 4. Validate Age (15-25)
      const age = parseInt(payload.age, 10);
      if (isNaN(age) || age < 15 || age > 25) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'age' must be an integer between 15 and 25.",
          }),
        };
      }

      // 5. Validate Studytime (1-4)
      const studytime = parseInt(payload.studytime, 10);
      if (isNaN(studytime) || studytime < 1 || studytime > 4) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'studytime' must be an integer between 1 and 4.",
          }),
        };
      }

      // 6. Validate Failures (0-4)
      const failures = parseInt(payload.failures, 10);
      if (isNaN(failures) || failures < 0 || failures > 4) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'failures' must be an integer between 0 and 4.",
          }),
        };
      }

      // 7. Validate Grades (G1, G2, G3: 0-20)
      const g1 = parseInt(payload.G1 ?? payload.g1, 10);
      if (isNaN(g1) || g1 < 0 || g1 > 20) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'G1' must be an integer between 0 and 20.",
          }),
        };
      }

      const g2 = parseInt(payload.G2 ?? payload.g2, 10);
      if (isNaN(g2) || g2 < 0 || g2 > 20) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'G2' must be an integer between 0 and 20.",
          }),
        };
      }

      const g3 = parseInt(payload.G3 ?? payload.g3, 10);
      if (isNaN(g3) || g3 < 0 || g3 > 20) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'G3' must be an integer between 0 and 20.",
          }),
        };
      }

      // 8. Validate Absences (0-100)
      const absences = parseInt(payload.absences, 10);
      if (isNaN(absences) || absences < 0 || absences > 100) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'ValidationError',
            message: "Field 'absences' must be an integer between 0 and 100.",
          }),
        };
      }

      // 9. Validate Ratings (famrel, freetime, goout, health: 1-5)
      for (const ratingField of ['famrel', 'freetime', 'goout', 'health'] as const) {
        const val = parseInt(payload[ratingField], 10);
        if (isNaN(val) || val < 1 || val > 5) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: 'ValidationError',
              message: `Field '${ratingField}' must be an integer between 1 and 5.`,
            }),
          };
        }
      }

      // 10. Validate Support & Lifestyle Flags (yes/no)
      for (const flagField of [
        'schoolsup',
        'famsup',
        'paid',
        'activities',
        'higher',
        'internet',
      ] as const) {
        const val = String(payload[flagField] || '').toLowerCase();
        if (!['yes', 'no'].includes(val)) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: 'ValidationError',
              message: `Field '${flagField}' must be either 'yes' or 'no'.`,
            }),
          };
        }
      }

      // Server-Side Derived Attribute Computation
      let performance_level = 'Medium';
      if (g3 >= 15) performance_level = 'High';
      else if (g3 < 10) performance_level = 'Low';

      let absence_group = 'Low (0-4)';
      if (absences >= 10) absence_group = 'High (10+)';
      else if (absences >= 5) absence_group = 'Moderate (5-9)';

      let risk_level = 'Moderate Risk';
      if (failures >= 2 || (failures === 1 && (g1 + g2) <= 6)) {
        risk_level = 'High Risk';
      } else if (failures === 0 && g1 >= 11 && g2 >= 10 && absences <= 9) {
        risk_level = 'Low Risk';
      }

      const pass_status = g3 >= 10 ? 'Pass' : 'Fail';

      const newStudent = {
        id,
        school,
        sex,
        age,
        studytime,
        failures,
        schoolsup: payload.schoolsup.toLowerCase(),
        famsup: payload.famsup.toLowerCase(),
        paid: payload.paid.toLowerCase(),
        activities: payload.activities.toLowerCase(),
        higher: payload.higher.toLowerCase(),
        internet: payload.internet.toLowerCase(),
        famrel: parseInt(payload.famrel, 10),
        freetime: parseInt(payload.freetime, 10),
        goout: parseInt(payload.goout, 10),
        health: parseInt(payload.health, 10),
        absences,
        G1: g1,
        G2: g2,
        G3: g3,
        performance_level,
        absence_group,
        risk_level,
        pass_status,
      };

      // Safe S3 Key Construction (prevent path traversal or unexpected characters)
      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const s3Key = `raw/new_students/${safeId}.json`;

      console.log(`[POST /api/students] Initiating S3 write -> Bucket: ${STUDENT_DATA_BUCKET}, Key: ${s3Key}`);

      // Persist to S3 Raw Landing Zone
      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: STUDENT_DATA_BUCKET,
            Key: s3Key,
            Body: JSON.stringify(newStudent),
            ContentType: 'application/json',
          })
        );
        console.log(`[POST /api/students] S3 PutObject completed successfully -> Key: ${s3Key}`);
      } catch (s3Err: any) {
        console.error(`[POST /api/students] S3 PutObject failed -> Bucket: ${STUDENT_DATA_BUCKET}, Key: ${s3Key}, Error:`, s3Err.message || s3Err);
        return {
          statusCode: 500,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: 'StorageError',
            message: 'Failed to persist student record to data lake storage.',
          }),
        };
      }

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          message: 'Student created successfully',
          student: newStudent,
          s3: {
            bucket: STUDENT_DATA_BUCKET,
            key: s3Key,
          },
        }),
      };
    }

    // 3. GET /api/students
    if (rawPath.endsWith('/api/students')) {
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

      const [athenaStudents, newS3Students] = await Promise.all([
        executeAthenaQuery(sql),
        getNewStudentsFromS3(),
      ]);

      // Filter newly added S3 students with the same active query parameters
      let filteredNewStudents = newS3Students;
      if (queryParams.school && ['GP', 'MS'].includes(queryParams.school)) {
        filteredNewStudents = filteredNewStudents.filter((s) => s.school === queryParams.school);
      }
      if (queryParams.sex && ['F', 'M'].includes(queryParams.sex)) {
        filteredNewStudents = filteredNewStudents.filter((s) => s.sex === queryParams.sex);
      }
      if (queryParams.studytime && ['1', '2', '3', '4'].includes(queryParams.studytime)) {
        filteredNewStudents = filteredNewStudents.filter(
          (s) => String(s.studytime) === queryParams.studytime
        );
      }
      if (
        queryParams.performance_level &&
        ['High', 'Medium', 'Low'].includes(queryParams.performance_level)
      ) {
        filteredNewStudents = filteredNewStudents.filter(
          (s) => s.performance_level === queryParams.performance_level
        );
      }
      if (
        queryParams.risk_level &&
        ['Low Risk', 'Moderate Risk', 'High Risk'].includes(queryParams.risk_level)
      ) {
        filteredNewStudents = filteredNewStudents.filter(
          (s) => s.risk_level === queryParams.risk_level
        );
      }
      if (
        queryParams.absence_group &&
        ['Low (0-4)', 'Moderate (5-9)', 'High (10+)'].includes(queryParams.absence_group)
      ) {
        filteredNewStudents = filteredNewStudents.filter(
          (s) => s.absence_group === queryParams.absence_group
        );
      }

      // Prepend newly persisted students to the historical Athena cohort
      const combinedStudents = [...filteredNewStudents, ...athenaStudents];

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          database: ATHENA_DATABASE,
          table: 'student_risk_analysis_new',
          count: combinedStudents.length,
          students: combinedStudents,
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
          'POST /api/students',
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
