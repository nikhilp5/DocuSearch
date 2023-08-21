import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";
import {
  KendraClient,
  QueryCommand,
  StartDataSourceSyncJobCommand,
} from "@aws-sdk/client-kendra";

export const handler = async (event) => {
  try {
    const s3client = new S3Client();
    //empty textracted s3
    const s3EmptyInput = {
      Bucket: "term-files-textracted-bucket",
    };
    const s3EmptyCommand = new ListObjectsCommand(s3EmptyInput);
    const s3Emptyresponse = await s3client.send(s3EmptyCommand);
    if (s3Emptyresponse.Contents) {
      const deleteRequests = s3Emptyresponse.Contents.map((obj) => ({
        Key: obj.Key,
      }));
      if (deleteRequests.length > 0) {
        const deleteParams = {
          Bucket: "term-files-textracted-bucket",
          Delete: {
            Objects: deleteRequests,
          },
        };
        const command = new DeleteObjectsCommand(deleteParams);
        const deleteResponse = await s3client.send(command);
      }
    }

    //empty textracted s3
    const s3input = {
      Bucket: "term-files-extracted-bucket",
    };
    const s3Command = new ListObjectsCommand(s3input);
    const s3response = await s3client.send(s3Command);

    const textractClient = new TextractClient();
    for (const object of s3response.Contents) {
      const texttractInput = {
        Document: {
          S3Object: {
            Bucket: "term-files-extracted-bucket",
            Name: object.Key,
          },
        },
      };
      const textractCommand = new DetectDocumentTextCommand(texttractInput);
      const textractResponse = await textractClient.send(textractCommand);
      const extractedText = textractResponse.Blocks.filter(
        (block) => block.BlockType === "LINE"
      )
        .map((block) => block.Text)
        .join(" ");

      let keyName =
        object.Key.substring(0, object.Key.lastIndexOf(".")) + ".txt";
      const uploadParams = {
        Bucket: "term-files-textracted-bucket",
        Key: keyName,
        Body: extractedText,
      };
      const putcommand = new PutObjectCommand(uploadParams);
      const response = await s3client.send(putcommand);
    }
    const client = new KendraClient();
    const input = {
      Id: process.env.kendraDataSourceId,
      IndexId: process.env.kendraId,
    };
    const command = new StartDataSourceSyncJobCommand(input);

    const response = await client.send(command);

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
      body: "Text Extraction failed.",
    };
  }
};
