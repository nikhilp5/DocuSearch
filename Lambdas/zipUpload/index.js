const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();

exports.handler = async (event, context) => {
  const s3 = new AWS.S3();
  const bucketName = "term-files-bucket";
  const base64ZipFile = event.file;

  try {
    const binaryZipFile = Buffer.from(base64ZipFile, "base64");

    const objectKey = "files.zip";

    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Body: binaryZipFile,
      ContentType: "application/zip",
    };

    await s3.putObject(params).promise();
    const zipToFileLambdaParams = {
      FunctionName: "zipToFilesAndExtract",
      InvocationType: "RequestResponse",
    };

    const zipToFileLambdaParamsResponse = await lambda
      .invoke(zipToFileLambdaParams)
      .promise();

    const jsonZipToFileLambdaParamsResponse = JSON.parse(
      zipToFileLambdaParamsResponse.Payload
    );

    if (!jsonZipToFileLambdaParamsResponse.result) {
      return {
        statusCode: jsonZipToFileLambdaParamsResponse.statusCode,
        result: false,
        body: jsonZipToFileLambdaParamsResponse.body,
      };
    }
    return {
      statusCode: 200,
      body: "Success",
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error uploading file to S3",
        error: error.message,
      }),
    };
  }
};
