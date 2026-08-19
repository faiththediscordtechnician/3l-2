const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function uploadPDF(fileBuffer, fileName, courseId) {
  const key = `${courseId}/${Date.now()}-${fileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    });

    await s3Client.send(command);

    return {
      success: true,
      s3_key: key,
      s3_url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`,
      file_size: fileBuffer.length,
    };
  } catch (err) {
    console.error('S3 upload error:', err);
    throw err;
  }
}

async function getPDFUrl(s3Key) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  } catch (err) {
    console.error('S3 URL generation error:', err);
    throw err;
  }
}

async function deletePDF(s3Key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
    });

    await s3Client.send(command);
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
