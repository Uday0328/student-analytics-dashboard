import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';
import { LambdaClient, UpdateFunctionCodeCommand, GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import {
  S3Client,
  CreateBucketCommand,
  PutBucketWebsiteCommand,
  PutPublicAccessBlockCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const ACCOUNT_ID = '958280224194';
const LAMBDA_FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME || 'student-analytics-api';
const FRONTEND_BUCKET_NAME = process.env.FRONTEND_BUCKET_NAME || `student-analytics-dashboard-${ACCOUNT_ID}`;
const ZIP_PATH = path.join(__dirname, 'backend', 'deploy', 'student-analytics-lambda.zip');
const DIST_DIR = path.join(__dirname, 'dist');

// Readline prompt helper
function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

// MIME types for S3 static website upload
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

async function main() {
  console.log('\n============================================================');
  console.log(' 🚀 Student Analytics Dashboard - Node.js AWS Deployer');
  console.log('============================================================\n');

  // 1. Check or Prompt for AWS Credentials
  let accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  let sessionToken = process.env.AWS_SESSION_TOKEN;

  if (!accessKeyId) {
    accessKeyId = await ask('Enter your AWS_ACCESS_KEY_ID: ');
  }
  if (!secretAccessKey) {
    secretAccessKey = await ask('Enter your AWS_SECRET_ACCESS_KEY: ');
  }
  if (!accessKeyId || !secretAccessKey) {
    console.error('\n❌ Error: AWS credentials are required for deployment.\n');
    process.exit(1);
  }

  const credentials = {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  };

  const lambdaClient = new LambdaClient({ region: REGION, credentials });
  const s3Client = new S3Client({ region: REGION, credentials });

  // 2. Build Backend TypeScript
  console.log('\n⚙️ Step 1A: Compiling backend TypeScript (backend/src/handler.ts)...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    execSync(`${npmCmd} run build`, { stdio: 'inherit', cwd: path.join(__dirname, 'backend') });
    console.log('✅ Backend build succeeded.');
  } catch (err) {
    console.error('❌ Backend build failed.');
    process.exit(1);
  }

  // Package Lambda Archive Cleanly
  console.log('\n📦 Step 1B: Packaging Lambda distribution archive...');
  const deployDir = path.join(__dirname, 'backend', 'deploy');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }
  try {
    if (process.platform === 'win32') {
      if (fs.existsSync(ZIP_PATH)) {
        fs.unlinkSync(ZIP_PATH);
      }
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path 'backend/dist', 'backend/package.json', 'backend/node_modules' -DestinationPath '${ZIP_PATH}' -Force"`,
        { stdio: 'inherit', cwd: __dirname }
      );
    }
    console.log(`✅ Lambda archive created at: ${ZIP_PATH}`);
  } catch (zipErr) {
    console.warn(`⚠️ Archiving note: ${zipErr.message}. Using existing ${ZIP_PATH}`);
  }

  // 3. Build Frontend
  console.log('\n📦 Step 1C: Building production frontend bundle (npm run build)...');
  try {
    execSync(`${npmCmd} run build`, { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Frontend build succeeded.');
  } catch (err) {
    console.error('❌ Frontend build failed.');
    process.exit(1);
  }

  // 4. Update Lambda Code
  console.log(`\n⚡ Step 2: Updating Lambda function '${LAMBDA_FUNCTION_NAME}'...`);
  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`❌ ZIP package not found at: ${ZIP_PATH}`);
    process.exit(1);
  }

  try {
    const zipBytes = fs.readFileSync(ZIP_PATH);
    const updateRes = await lambdaClient.send(
      new UpdateFunctionCodeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        ZipFile: zipBytes,
      })
    );
    console.log(`✅ Lambda update initiated! Version: ${updateRes.Version}, LastModified: ${updateRes.LastModified}`);

    // Wait for Lambda update to complete
    process.stdout.write('   Waiting for Lambda update to complete');
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const config = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: LAMBDA_FUNCTION_NAME })
      );
      if (config.LastUpdateStatus === 'Successful') {
        console.log('\n✅ Lambda function update status: Successful');
        break;
      } else if (config.LastUpdateStatus === 'Failed') {
        throw new Error(`Lambda update failed: ${config.LastUpdateStatusReason}`);
      }
      process.stdout.write('.');
    }
  } catch (err) {
    console.error(`\n❌ Lambda update failed: ${err.message}`);
    console.log('Tip: Check function name and IAM permissions for lambda:UpdateFunctionCode');
    process.exit(1);
  }

  // 4. Provision S3 Static Hosting Bucket & Upload
  console.log(`\n🪣 Step 3: Configuring S3 bucket '${FRONTEND_BUCKET_NAME}'...`);
  try {
    try {
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: FRONTEND_BUCKET_NAME,
          CreateBucketConfiguration: { LocationConstraint: REGION },
        })
      );
      console.log(`   Created bucket: ${FRONTEND_BUCKET_NAME}`);
    } catch (e) {
      if (e.name === 'BucketAlreadyOwnedByYou' || e.name === 'BucketAlreadyExists') {
        console.log(`   Bucket already exists: ${FRONTEND_BUCKET_NAME}`);
      } else {
        throw e;
      }
    }

    // Static website config
    await s3Client.send(
      new PutBucketWebsiteCommand({
        Bucket: FRONTEND_BUCKET_NAME,
        WebsiteConfiguration: {
          IndexDocument: { Suffix: 'index.html' },
          ErrorDocument: { Key: 'index.html' },
        },
      })
    );

    // Public access block
    await s3Client.send(
      new PutPublicAccessBlockCommand({
        Bucket: FRONTEND_BUCKET_NAME,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: false,
          IgnorePublicAcls: false,
          BlockPublicPolicy: false,
          RestrictPublicBuckets: false,
        },
      })
    );

    // Bucket policy
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${FRONTEND_BUCKET_NAME}/*`,
        },
      ],
    });
    await s3Client.send(new PutBucketPolicyCommand({ Bucket: FRONTEND_BUCKET_NAME, Policy: policy }));

    // Upload dist files
    console.log('\n📤 Step 4: Uploading static assets to S3...');
    function getAllFiles(dir, fileList = []) {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          getAllFiles(filePath, fileList);
        } else {
          fileList.push(filePath);
        }
      });
      return fileList;
    }

    const distFiles = getAllFiles(DIST_DIR);
    for (const filePath of distFiles) {
      const relKey = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileBody = fs.readFileSync(filePath);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: FRONTEND_BUCKET_NAME,
          Key: relKey,
          Body: fileBody,
          ContentType: contentType,
        })
      );
      console.log(`   Uploaded: ${relKey} (${contentType})`);
    }

    console.log('\n============================================================');
    console.log(' 🎉 DEPLOYMENT SUCCESSFUL!');
    console.log('============================================================');
    console.log(` 🌐 Live Dashboard URL: http://${FRONTEND_BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    console.log('============================================================\n');
  } catch (err) {
    console.error(`❌ S3 Deployment error: ${err.message}`);
  }
}

main().catch(console.error);
