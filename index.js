const path = require("path");

const CppTestGenerator = require("./generators/cppTestGenerator");

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