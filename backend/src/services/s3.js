const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

async function uploadPDF(fileBuffer, fileName, courseId) {
  const key = `${courseId}/${Date.now()}-${fileName}`;

  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    };

    const result = await s3.upload(params).promise();

    return {
      success: true,
      s3_key: key,
      s3_url: result.Location,
      file_size: fileBuffer.length,
    };
  } catch (err) {
    console.error('S3 upload error:', err);
    throw err;
  }
}

async function getPDFUrl(s3Key) {
  try {
    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Expires: 3600, // 1 hour
    });
    return url;
  } catch (err) {
    console.error('S3 URL generation error:', err);
    throw err;
  }
}

async function deletePDF(s3Key) {
  try {
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
    }).promise();
    return { success: true };
  } catch (err) {
    console.error('S3 delete error:', err);
    throw err;
  }
}

module.exports = {
  uploadPDF,
  getPDFUrl,
  deletePDF,
};
