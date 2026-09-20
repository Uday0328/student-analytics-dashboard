# ==============================================================================
# Student Analytics Dashboard - Automated AWS Deployment Script
# ==============================================================================

$ErrorActionPreference = "Stop"

$REGION = "ap-southeast-2"
$ACCOUNT_ID = "958280224194"
$LAMBDA_FUNCTION_NAME = "student-analytics-api"
$FRONTEND_BUCKET_NAME = "student-analytics-dashboard-$ACCOUNT_ID"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " 1. Building Frontend Production Bundle..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
cmd /c npm run build

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " 2. Updating AWS Lambda Function..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
aws lambda update-function-code `
    --function-name $LAMBDA_FUNCTION_NAME `
    --zip-file "fileb://backend/deploy/student-analytics-lambda.zip" `
    --region $REGION

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " 3. Creating / Updating S3 Static Hosting Bucket..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Create bucket if it doesn't exist
try {
    aws s3api create-bucket `
        --bucket $FRONTEND_BUCKET_NAME `
        --region $REGION `
        --create-bucket-configuration LocationConstraint=$REGION
} catch {
    Write-Host "Bucket already exists, proceeding..." -ForegroundColor Yellow
}

# Configure Static Website Hosting
aws s3 website "s3://$FRONTEND_BUCKET_NAME/" `
    --index-document index.html `
    --error-document index.html

# Disable Public Access Block
aws s3api put-public-access-block `
    --bucket $FRONTEND_BUCKET_NAME `
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set Public Read Bucket Policy
$POLICY = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$FRONTEND_BUCKET_NAME/*"
    }
  ]
}
"@
aws s3api put-bucket-policy --bucket $FRONTEND_BUCKET_NAME --policy $POLICY

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " 4. Uploading Frontend Assets (dist/) to S3..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
aws s3 sync dist/ "s3://$FRONTEND_BUCKET_NAME/" --delete

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " SUCCESS! Deployment Complete" -ForegroundColor Green
Write-Host " Live Website URL: http://$FRONTEND_BUCKET_NAME.s3-website-$REGION.amazonaws.com" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
