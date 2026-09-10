import fs from 'fs';
import readline from 'readline';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { CloudWatchLogsClient, DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { ApiGatewayV2Client, GetApisCommand } from '@aws-sdk/client-apigatewayv2';

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const LAMBDA_FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME || 'student-analytics-api';
const DEFAULT_BUCKET = 'student-data-lake-2026-pujith-958280224194-ap-southeast-2-an';
const ATHENA_DATABASE = process.env.ATHENA_DATABASE || 'student_data_lake_db';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

async function main() {
  console.log('====================================================');
  console.log('  AWS Student Data Lake: Complete Diagnostic & Verifier');
  console.log('====================================================\n');

  let accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  let sessionToken = process.env.AWS_SESSION_TOKEN;

  if (!accessKeyId) accessKeyId = await ask('Enter AWS_ACCESS_KEY_ID: ');
  if (!secretAccessKey) secretAccessKey = await ask('Enter AWS_SECRET_ACCESS_KEY: ');

  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ Credentials are required.');
    process.exit(1);
  }

  const credentials = { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) };
  const lambdaClient = new LambdaClient({ region: REGION, credentials });
  const s3Client = new S3Client({ region: REGION, credentials });
  const athenaClient = new AthenaClient({ region: REGION, credentials });
  const logsClient = new CloudWatchLogsClient({ region: REGION, credentials });
  const apiGwClient = new ApiGatewayV2Client({ region: REGION, credentials });

  // 1. Inspect Lambda Configuration & Environment Variables
  console.log(`\n🔍 1. Inspecting Lambda function '${LAMBDA_FUNCTION_NAME}'...`);
  let activeBucket = DEFAULT_BUCKET;
  try {
    const fn = await lambdaClient.send(new GetFunctionCommand({ FunctionName: LAMBDA_FUNCTION_NAME }));
    console.log(`   Handler:          ${fn.Configuration?.Handler}`);
    console.log(`   Runtime:          ${fn.Configuration?.Runtime}`);
    console.log(`   LastModified:     ${fn.Configuration?.LastModified}`);
    console.log(`   LastUpdateStatus: ${fn.Configuration?.LastUpdateStatus}`);
    console.log(`   CodeSha256:       ${fn.Configuration?.CodeSha256}`);
    
    const envVars = fn.Configuration?.Environment?.Variables || {};
    console.log(`   Environment Variables:`);
    if (Object.keys(envVars).length === 0) {
      console.log(`     (No custom environment variables set - using handler defaults)`);
    } else {
      for (const [k, v] of Object.entries(envVars)) {
        console.log(`     ${k} = ${v}`);
      }
    }
    if (envVars.STUDENT_DATA_BUCKET) {
      activeBucket = envVars.STUDENT_DATA_BUCKET;
      console.log(`   ⚡ NOTE: Lambda is configured to write to: ${activeBucket}`);
    } else {
      console.log(`   ⚡ Using default bucket: ${activeBucket}`);
    }
  } catch (err) {
    console.error(`   ❌ Failed to inspect Lambda: ${err.message}`);
    process.exit(1);
  }

  // 2. Inspect CloudWatch Logs for S3 Write Activity
  console.log(`\n📜 2. Checking recent CloudWatch logs for '${LAMBDA_FUNCTION_NAME}'...`);
  const logGroupName = `/aws/lambda/${LAMBDA_FUNCTION_NAME}`;
  try {
    const streamsRes = await logsClient.send(
      new DescribeLogStreamsCommand({
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 3,
      })
    );
    const streams = streamsRes.logStreams || [];
    if (streams.length === 0) {
      console.log('   (No log streams found)');
    } else {
      for (const stream of streams) {
        const eventsRes = await logsClient.send(
          new GetLogEventsCommand({
            logGroupName,
            logStreamName: stream.logStreamName,
            limit: 30,
          })
        );
        const events = eventsRes.events || [];
        for (const ev of events) {
          const msg = ev.message || '';
          if (msg.includes('POST /api/students') || msg.includes('S3 write') || msg.includes('PutObject') || msg.includes('Bucket:')) {
            console.log(`   [CloudWatch Log] ${msg.trim()}`);
          }
        }
      }
    }
  } catch (err) {
    console.log(`   ℹ️ CloudWatch Logs note: ${err.message}`);
  }

  // 3. Inspect API Gateway
  console.log(`\n🌐 3. Inspecting AWS API Gateway...`);
  try {
    const apisRes = await apiGwClient.send(new GetApisCommand({}));
    const apis = apisRes.Items || [];
    console.log(`   Found ${apis.length} HTTP APIs in ${REGION}:`);
    for (const api of apis) {
      console.log(`   - API: ${api.Name} (ID: ${api.ApiId}) -> ${api.ApiEndpoint}`);
    }
    if (apis.length > 0) {
      console.log(`\n   💡 To connect the frontend to API Gateway, add this to .env:`);
      console.log(`      VITE_API_BASE_URL=${apis[0].ApiEndpoint}`);
    }
  } catch (err) {
    console.log(`   ℹ️ API Gateway note: ${err.message}`);
  }

  // 4. Invoke POST /api/students with test student TEST-S3-VERIFY
  const testStudentId = `TEST-S3-${Date.now().toString().slice(-4)}`;
  console.log(`\n🚀 4. Invoking Lambda with test student: ${testStudentId}...`);
  const postPayload = {
    httpMethod: 'POST',
    path: '/api/students',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testStudentId,
      school: 'GP',
      sex: 'F',
      age: 18,
      studytime: 3,
      failures: 0,
      schoolsup: 'no',
      famsup: 'yes',
      paid: 'no',
      activities: 'yes',
      higher: 'yes',
      internet: 'yes',
      famrel: 4,
      freetime: 3,
      goout: 2,
      health: 4,
      absences: 2,
      G1: 15,
      G2: 16,
      G3: 16,
    }),
  };

  try {
    const invokeRes = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: Buffer.from(JSON.stringify(postPayload)),
      })
    );

    const responseStr = Buffer.from(invokeRes.Payload).toString('utf-8');
    const responseJson = JSON.parse(responseStr);
    console.log(`   Status Code: ${responseJson.statusCode}`);
    console.log(`   Response Body: ${responseJson.body}`);

    if (responseJson.statusCode !== 201) {
      console.error('❌ Expected HTTP 201 response from POST /api/students.');
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Invoke failed: ${err.message}`);
    process.exit(1);
  }

  // 5. Verify S3 Object Location in activeBucket
  console.log(`\n🪣 5. Checking S3 object location in bucket '${activeBucket}'...`);
  const expectedKey = `raw/new_students/${testStudentId}.json`;
  const wrongKey = `raw/${testStudentId}.json`;

  try {
    const headRes = await s3Client.send(
      new HeadObjectCommand({
        Bucket: activeBucket,
        Key: expectedKey,
      })
    );
    console.log(`   ✅ S3 Object confirmed at: s3://${activeBucket}/${expectedKey}`);
    console.log(`   Object Size: ${headRes.ContentLength} bytes`);
  } catch (err) {
    console.error(`   ❌ S3 object NOT found at expected key: ${expectedKey}`);
    console.error(`   ${err.message}`);
  }

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: activeBucket,
        Key: wrongKey,
      })
    );
    console.warn(`   ⚠️ WARNING: Object was also found at incorrect key: ${wrongKey}`);
  } catch (err) {
    console.log(`   ✅ Correct: Object does NOT exist under raw/ root (${wrongKey})`);
  }

  // 6. Verify Single-Line JSON Format
  console.log(`\n📄 6. Verifying JSON format in S3...`);
  try {
    const getRes = await s3Client.send(
      new GetObjectCommand({
        Bucket: activeBucket,
        Key: expectedKey,
      })
    );
    const bodyStr = await getRes.Body.transformToString();
    const isSingleLine = !bodyStr.trim().includes('\n');
    console.log(`   Content: ${bodyStr.slice(0, 120)}...`);
    console.log(`   Single-line JSON: ${isSingleLine ? 'YES ✅' : 'NO ❌ (Multi-line causes Hive SerDe error)'}`);
  } catch (err) {
    console.error(`   ❌ Failed to read object: ${err.message}`);
  }

  // 7. Test Athena Query Execution
  console.log(`\n🏛️ 7. Testing Athena query against 'student_new_ingest'...`);
  const athenaOutputLocation = `s3://${activeBucket}/athena-results/`;
  const query = `SELECT "$path", id FROM "${ATHENA_DATABASE}"."student_new_ingest" WHERE id LIKE 'TEST-S3%' ORDER BY id;`;
  try {
    const startRes = await athenaClient.send(
      new StartQueryExecutionCommand({
        QueryString: query,
        QueryExecutionContext: { Database: ATHENA_DATABASE },
        ResultConfiguration: { OutputLocation: athenaOutputLocation },
      })
    );
    const queryExecutionId = startRes.QueryExecutionId;
    console.log(`   QueryExecutionId: ${queryExecutionId}`);

    // Poll query
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await athenaClient.send(
        new GetQueryExecutionCommand({ QueryExecutionId: queryExecutionId })
      );
      const state = statusRes.QueryExecution?.Status?.State;
      if (state === 'SUCCEEDED') {
        console.log('   ✅ Athena query SUCCEEDED!');
        const results = await athenaClient.send(
          new GetQueryResultsCommand({ QueryExecutionId: queryExecutionId })
        );
        const rows = results.ResultSet?.Rows || [];
        console.log(`   Rows returned: ${rows.length > 1 ? rows.length - 1 : 0}`);
        for (const row of rows.slice(0, 5)) {
          console.log(`   - ${row.Data?.map((d) => d.VarCharValue).join(' | ')}`);
        }
        break;
      } else if (state === 'FAILED' || state === 'CANCELLED') {
        console.error(`   ❌ Athena query ${state}: ${statusRes.QueryExecution?.Status?.StateChangeReason}`);
        break;
      }
      process.stdout.write('.');
    }
  } catch (err) {
    console.error(`   ❌ Athena execution error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log('  Complete Diagnostic & Verification Finished');
  console.log('====================================================\n');
}

main().catch(console.error);
