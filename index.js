// const express = require("express");
const path = require("path");

// const {PORT} = require("./config/server.config");
const CppTestGenerator = require("./generators/cppTestGenerator");

// const app = express();

// app.listen(PORT, async ()=>{
//     console.log("server listening on port: ", PORT);
//     // codeReader();
//     const testGenerator = new CppTestGenerator({root:__dirname});
//     testGenerator.initialize();

//     const cppFiles = await testGenerator.scanCppProject(path.resolve(__dirname, "../codebase"));

//     const initialTests = await testGenerator.generateInitialTests(cppFiles);

//     const refinedTests = await testGenerator.refineTests(initialTests);

//     const buildResult = await testGenerator.buildAndDebugTests(path.resolve(__dirname, "../codebase"), refinedTests);

//     const finalTests = testGenerator.finalTests;
    
//     const report = testGenerator.generateReport(finalTests, buildResult.coverage);
    
//     console.log(report);
    
//     // const buildResult = await testGenerator.runTestsAndCalculateCoverage();
//     // testGenerator.buildProject();
// })

async function main(){
    const generator = new CppTestGenerator({root: __dirname});

    const projectPath = path.resolve(__dirname, "../codebase");

    const result = await generator.generateTestsForProject(projectPath);
    
    if (result.success) {
        console.log('🎉 Test generation completed successfully!');
        console.log('Generated tests:', result.tests.length);
        console.log('Average coverage:', result.report.summary.averageCoverage + '%');
    } else {
        console.error('❌ Test generation failed:', result.error);
    }

}

if (require.main === module) {
    main().catch(console.error);
}