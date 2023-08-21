import {
  KendraClient,
  QueryCommand,
  ListDataSourceSyncJobsCommand,
} from "@aws-sdk/client-kendra";

export const handler = async (event) => {
  const client = new KendraClient();

  const syncJobInput = {
    Id: process.env.kendraDataSourceId,
    IndexId: process.env.kendraId,
    StatusFilter: "SYNCING" || "SYNCING_INDEXING",
  };
  const syncCommand = new ListDataSourceSyncJobsCommand(syncJobInput);
  let syncResponse = await client.send(syncCommand);

  while (syncResponse.History.length != 0) {
    const response = [];
    response.push({
      Id: 1,
      Title:
        "Since data is being synced and crawled in kendra,It will take a while,Please check after some time",
      DetectedPart: "",
    });
    return response;
  }

  const input = {
    IndexId: process.env.kendraId,
    QueryText: event.text,
  };

  const command = new QueryCommand(input);

  const response = await client.send(command);

  const responseData = response.ResultItems.map((item) => {
    return {
      Id: item.DocumentId,
      Title: item.DocumentTitle.Text,
      DetectedPart: item.DocumentExcerpt.Text,
    };
  });

  return responseData;
};
