require("dotenv").config();
module.exports = {
    PORT: process.env.PORT,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    ENDPOINT: process.env.ENDPOINT,
    MODEL_NAME: process.env.MODEL_NAME
}