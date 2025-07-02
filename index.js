const express = require("express");

const {PORT} = require("./config/server.config");
const codeReader = require("./utils/codeReader");

const app = express();

app.listen(PORT, ()=>{
    console.log("server listening on port: ", PORT);
    codeReader();
})

