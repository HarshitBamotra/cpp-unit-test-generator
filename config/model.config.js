const {default: ModelClient, isUnexpected} = require("@azure-rest/ai-inference")
const {AzureKeyCredential} = require("@azure/core-auth");

const { ENDPOINT, LLM_ACCESS_TOKEN } = require("./server.config");

const client = ModelClient(
    ENDPOINT,
    new AzureKeyCredential(LLM_ACCESS_TOKEN)
);

module.exports = client;