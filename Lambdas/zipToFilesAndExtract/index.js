const AWS = require("aws-sdk");
const JSZip = require("jszip");
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
  const bucketName = "term-files-bucket";
  const zipObjectKey = "files.zip";

  try {
    // Download the ZIP file from S3
    const zipFileParams = {
      Bucket: bucketName,
      Key: zipObjectKey,
    };
    const zipFileData = await s3.getObject(zipFileParams).promise();

    // Extract the files from the ZIP file
    const zip = await JSZip.loadAsync(zipFileData.Body);
    const fileNames = Object.keys(zip.files);

    const listObjectsParams = {
      Bucket: "term-files-extracted-bucket",
    };
    const objects = await s3.listObjects(listObjectsParams).promise();

    // Create a delete request for each object
    const deleteRequests = objects.Contents.map((obj) => ({
      Key: obj.Key,
    }));

    // Delete all objects in the bucket
    if (deleteRequests.length > 0) {
      const deleteParams = {
        Bucket: "term-files-extracted-bucket",
        Delete: {
          Objects: deleteRequests,
        },
      };
      await s3.deleteObjects(deleteParams).promise();
    }

    for (const fileName of fileNames) {
      const file = zip.files[fileName];

      // Extract the file content
      const fileContent = await file.async("nodebuffer");

      // Upload the extracted file to another S3 bucket
      const uploadParams = {
        Bucket: "term-files-extracted-bucket",
        Key: fileName,
        Body: fileContent,
      };

      await s3.upload(uploadParams).promise();
    }
    const secondLambdaParams = {
      FunctionName: "textExtract",
      InvocationType: "RequestResponse",
      Payload: null,
    };
    const secondLambdaResponse = await lambda
      .invoke(secondLambdaParams)
      .promise();

    const jsonSecondLambdaResponse = JSON.parse(secondLambdaResponse.Payload);

    if (!jsonSecondLambdaResponse.result) {
      return {
        statusCode: jsonSecondLambdaResponse.statusCode,
        result: false,
        body: jsonSecondLambdaResponse.body,
      };
    }
    return {
      statusCode: 200,
      result: true,
      body: "Success",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      result: false,
      body: "File Extraction failed.",
    };
  }
};
