import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const ACCOUNT_ID = '958280224194';
const FRONTEND_BUCKET_NAME = process.env.FRONTEND_BUCKET_NAME || `student-analytics-dashboard-${ACCOUNT_ID}`;
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
  console.log(' 🚀 Student Analytics Dashboard - Frontend S3 Deployer');
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

  const s3Client = new S3Client({ region: REGION, credentials });

  // 2. Build Frontend
  console.log('\n📦 Step 1: Building production frontend bundle (npm run build)...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('❌ Frontend build failed.');
    process.exit(1);
  }

  // 3. Upload dist files to existing S3 bucket
  console.log(`\n📤 Step 2: Uploading static frontend assets to S3 bucket '${FRONTEND_BUCKET_NAME}'...`);
  try {
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
      const cacheControl =
        relKey === 'index.html'
          ? 'no-cache, no-store, must-revalidate, max-age=0'
          : 'public, max-age=31536000, immutable';

      await s3Client.send(
        new PutObjectCommand({
          Bucket: FRONTEND_BUCKET_NAME,
          Key: relKey,
          Body: fileBody,
          ContentType: contentType,
          CacheControl: cacheControl,
        })
      );
      console.log(`   Uploaded: ${relKey} (${contentType}) [${cacheControl}]`);
    }

    console.log('\n============================================================');
    console.log(' 🎉 FRONTEND DEPLOYMENT SUCCESSFUL!');
    console.log('============================================================');
    console.log(` 🌐 Live Dashboard URL: http://${FRONTEND_BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    console.log('============================================================\n');
  } catch (err) {
    console.error(`❌ S3 Deployment error: ${err.message}`);
  }
}

main().catch(console.error);
