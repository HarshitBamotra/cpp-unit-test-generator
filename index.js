const express = require("express");
const path = require("path");

const {PORT} = require("./config/server.config");
const CppTestGenerator = require("./generators/cppTestGenerator");

const app = express();

app.listen(PORT, async ()=>{
    console.log("server listening on port: ", PORT);
    // codeReader();
    const testGenerator = new CppTestGenerator({root:__dirname});
    testGenerator.initialize();

    const cppFiles = await testGenerator.scanCppProject(path.resolve(__dirname, "../codebase"));

    const initialTests = await testGenerator.generateInitialTests(cppFiles);

    const refinedTests = await testGenerator.refineTests(initialTests);

    const buildResult = await testGenerator.buildAndDebugTests(path.resolve(__dirname, "../codebase"), refinedTests);

    const finalTests = testGenerator.finalTests;
    
    const report = testGenerator.generateReport(finalTests, buildResult.coverage);
    
    console.log(report);
    
    // const buildResult = await testGenerator.runTestsAndCalculateCoverage();
    // testGenerator.buildProject();
})

