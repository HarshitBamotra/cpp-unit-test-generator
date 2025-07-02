const {default: ModelClient, isUnexpected} = require("@azure-rest/ai-inference")
const {AzureKeyCredential} = require("@azure/core-auth");

const { ENDPOINT } = require("./server.config");

const client = ModelClient(
    ENDPOINT,
    new AzureKeyCredential(process.env.GITHUB_TOKEN)
);

module.exports = client;