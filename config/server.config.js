require("dotenv").config();
module.exports = {
    LLM_ACCESS_TOKEN: process.env.LLM_ACCESS_TOKEN,
    ENDPOINT: process.env.ENDPOINT,
    MODEL_NAME: process.env.MODEL_NAME
}