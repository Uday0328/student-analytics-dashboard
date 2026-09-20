import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LambdaClient, UpdateFunctionCodeCommand } from '@aws-sdk/client-lambda';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const LAMBDA_FUNCTION_NAME = 'student-analytics-api';
const HANDLER_PATH = path.join(__dirname, 'backend', 'dist', 'handler.js');

// PKZip builder for multiple files
function createZipWithFiles(files) {
  const localHeaders = [];
  const centralDirs = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf8');
    const contentBuffer = file.buffer;
    const crc = calculateCrc32(contentBuffer);
    const size = contentBuffer.length;

    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(size, 18);
    localHeader.writeUInt32LE(size, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuffer.copy(localHeader, 30);

    const centralDir = Buffer.alloc(46 + nameBuffer.length);
    centralDir.writeUInt32LE(0x02014b50, 0);
    centralDir.writeUInt16LE(20, 4);
    centralDir.writeUInt16LE(20, 6);
    centralDir.writeUInt16LE(0, 8);
    centralDir.writeUInt16LE(0, 10);
    centralDir.writeUInt16LE(0, 12);
    centralDir.writeUInt16LE(0, 14);
    centralDir.writeUInt32LE(crc, 16);
    centralDir.writeUInt32LE(size, 20);
    centralDir.writeUInt32LE(size, 24);
    centralDir.writeUInt16LE(nameBuffer.length, 28);
    centralDir.writeUInt16LE(0, 30);
    centralDir.writeUInt16LE(0, 32);
    centralDir.writeUInt16LE(0, 34);
    centralDir.writeUInt16LE(0, 36);
    centralDir.writeUInt32LE(0, 38);
    centralDir.writeUInt32LE(offset, 42);
    nameBuffer.copy(centralDir, 46);

    localHeaders.push(localHeader, contentBuffer);
    centralDirs.push(centralDir);

    offset += localHeader.length + contentBuffer.length;
  }

  const centralDirLength = centralDirs.reduce((acc, c) => acc + c.length, 0);

  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirLength, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralDirs, endRecord]);
}

function calculateCrc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

async function updateLambda() {
  console.log('📦 Reading backend/dist/handler.js...');
  const handlerCode = fs.readFileSync(HANDLER_PATH);

  console.log('⚡ Creating zip package...');
  const zipBuffer = createZipWithFiles([
    { name: 'handler.js', buffer: handlerCode },
  ]);

  const deployDir = path.join(__dirname, 'backend', 'deploy');
  if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir, { recursive: true });
  fs.writeFileSync(path.join(deployDir, 'student-analytics-lambda.zip'), zipBuffer);
  console.log(`✅ Created zip package (${zipBuffer.length} bytes)`);

  const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };

  const lambdaClient = new LambdaClient({ region: REGION, credentials });

  console.log(`🚀 Updating AWS Lambda function '${LAMBDA_FUNCTION_NAME}'...`);
  const updateRes = await lambdaClient.send(
    new UpdateFunctionCodeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      ZipFile: zipBuffer,
    })
  );

  console.log(`🎉 AWS Lambda Code Updated Successfully! Version: ${updateRes.Version}, LastModified: ${updateRes.LastModified}`);
}

updateLambda().catch((err) => {
  console.error('❌ Failed to update Lambda:', err);
  process.exit(1);
});
