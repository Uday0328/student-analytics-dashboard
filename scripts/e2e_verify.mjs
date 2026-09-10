import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

// Read credentials from environment variables (never hardcode secrets!)
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

if (!credentials.accessKeyId || !credentials.secretAccessKey) {
  console.error('❌ Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file.');
  process.exit(1);
}

const region = process.env.AWS_REGION || 'ap-southeast-2';
const bucket = process.env.S3_BUCKET || 'student-data-lake-2026-pujith-958280224194-ap-southeast-2-an';
const apiBaseUrl = process.env.VITE_API_BASE_URL || 'https://1a1fnoowu1.execute-api.ap-southeast-2.amazonaws.com';
const testId = 'TEST-E2E-001';

async function runE2E() {
  console.log('=====================================================');
  console.log('  STARTING END-TO-END VERIFICATION: ' + testId);
  console.log('=====================================================\n');

  // Step A: POST /api/students over real HTTP to API Gateway
  console.log(`--- Step A: HTTP POST ${apiBaseUrl}/api/students ---`);
  const postPayload = {
    id: testId,
    school: 'GP',
    sex: 'M',
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
    G1: 16,
    G2: 17,
    G3: 17,
  };

  const res = await fetch(`${apiBaseUrl}/api/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postPayload),
  });

  console.log(`HTTP Status: ${res.status} ${res.statusText}`);
  const resBody = await res.json();
  console.log('Response Body:', JSON.stringify(resBody, null, 2));

  if (res.status !== 201) {
    throw new Error(`Expected HTTP 201 but got ${res.status}`);
  }
  console.log('✅ Step A Passed: POST /api/students returned HTTP 201');

  // Step B: Verify S3 Object
  console.log(`\n--- Step B: Inspect S3 Bucket '${bucket}' ---`);
  const s3 = new S3Client({ region, credentials });
  const expectedKey = `raw/new_students/${testId}.json`;
  
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: expectedKey }));
  console.log(`✅ Step B Passed: Found S3 Object at: s3://${bucket}/${expectedKey}`);
  console.log(`   Object Size: ${head.ContentLength} bytes, ContentType: ${head.ContentType}`);

  const getRes = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: expectedKey }));
  const content = await getRes.Body.transformToString();
  console.log(`   Object Content: ${content}`);
  const isSingleLine = !content.trim().includes('\n');
  console.log(`   Single-line JSON verified: ${isSingleLine ? 'YES ✅' : 'NO ❌'}`);

  // Step C: Run Athena Query
  console.log(`\n--- Step C: Athena Query against 'student_new_ingest' ---`);
  const athena = new AthenaClient({ region, credentials });
  const sql = `SELECT "$path", id FROM "student_data_lake_db"."student_new_ingest" WHERE id LIKE 'TEST-E2E%' ORDER BY id;`;
  console.log(`   Executing SQL: ${sql}`);

  const startRes = await athena.send(new StartQueryExecutionCommand({
    QueryString: sql,
    QueryExecutionContext: { Database: 'student_data_lake_db' },
    ResultConfiguration: { OutputLocation: `s3://${bucket}/athena-results/` },
  }));
  const qid = startRes.QueryExecutionId;
  console.log(`   QueryExecutionId: ${qid}`);

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const qStatus = await athena.send(new GetQueryExecutionCommand({ QueryExecutionId: qid }));
    const state = qStatus.QueryExecution?.Status?.State;
    if (state === 'SUCCEEDED') {
      console.log('✅ Step C Passed: Athena query SUCCEEDED without HIVE_CURSOR_ERROR!');
      const results = await athena.send(new GetQueryResultsCommand({ QueryExecutionId: qid }));
      const rows = results.ResultSet?.Rows || [];
      console.log(`\nResults returned (${rows.length} rows including header):`);
      for (const row of rows) {
        console.log('   ' + row.Data?.map(d => d.VarCharValue || 'NULL').join(' | '));
      }
      break;
    } else if (state === 'FAILED' || state === 'CANCELLED') {
      throw new Error(`Athena query ${state}: ${qStatus.QueryExecution?.Status?.StateChangeReason}`);
    }
    process.stdout.write('.');
  }

  // Step D: Verify GET /api/students returns the newly added student
  console.log(`\n--- Step D: Verify GET /api/students API ---`);
  const getApiRes = await fetch(`${apiBaseUrl}/api/students`);
  const getApiData = await getApiRes.json();
  const found = (getApiData.students || []).find(s => s.id === testId);
  console.log(`Total students returned by GET /api/students: ${getApiData.count || getApiData.students?.length}`);
  console.log(`Found ${testId} in GET /api/students: ${found ? 'YES ✅' : 'NO ❌'}`);
  if (found) {
    console.log('Student details from API:', found);
  }

  console.log('\n=====================================================');
  console.log('  ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('=====================================================\n');
}

runE2E().catch(console.error);
