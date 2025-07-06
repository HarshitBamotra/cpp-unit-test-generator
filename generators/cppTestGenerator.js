const yaml = require('js-yaml');
const fs = require("fs");
const path = require('path');
const { execSync } = require('child_process');
const glob = require("glob");

const client = require('../config/model.config');
const { MODEL_NAME } = require('../config/server.config');
const initialGenerationPrompt = require('../prompts/initialGenerationPrompt');
const refineTestPrompt = require('../prompts/refineTestPrompt');
const removeFailedTestPrompt = require('../prompts/removeFailedTestPrompt');
const debuggingPrompt = require('../prompts/debuggingPrompt');

class CppTestGenerator {
    constructor(config = {}) {
        this.config = {
            root: config.root,
            testFramework: config.testFramework || 'googletest',
            outputDir: config.outputDir || path.resolve(config.root, "../tests"),
            buildDir: config.buildDir || path.resolve(config.root, "../build"),
            coverageThreshold: config.coverageThreshold || 80,
            ...config
        };

        this.yamlConfig = {
            initial_generation: fs.readFileSync(path.join(this.config.root, '/yamlInstructions/initialGeneration.yaml'), 'utf8'),
            refinement: fs.readFileSync(path.join(this.config.root, '/yamlInstructions/refinement.yaml'), 'utf8'),
            debugging: fs.readFileSync(path.join(this.config.root, '/yamlInstructions/debugging.yaml'), 'utf8'),
            removeFailedTests: fs.readFileSync(path.join(this.config.root, "/yamlInstructions/removeFailedTests.yaml"), 'utf8'),
        };
    }

    async initialize() {
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }

        if (!fs.existsSync(this.config.buildDir)) {
            fs.mkdirSync(this.config.buildDir, { recursive: true });
        }

        console.log('✅ Environment initialized successfully\n');
    }

    async scanCppProject(projectPath) {
        const cppFiles = [];
        console.log("Scanning for C++ source files...")
        const scanDirectory = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory() && !entry.name.startsWith('.') &&
                    !['build', 'tests', 'node_modules'].includes(entry.name)) {
                    scanDirectory(fullPath);
                } else if (entry.isFile() &&
                    (entry.name.endsWith('.cpp') || entry.name.endsWith('.cc') ||
                        entry.name.endsWith('.cxx') || entry.name.endsWith('.c'))) {
                    cppFiles.push({
                        path: fullPath,
                        name: entry.name,
                        content: fs.readFileSync(fullPath, 'utf8')
                    });
                }
            }
        };

        scanDirectory(projectPath);
        console.log(`📁 Found ${cppFiles.length} C++ source files\n`);
        return cppFiles;
    }

    async callLLM(prompt, systemPrompt = '') {
        try {
            const response = await client.path("/chat/completions").post({
                body: {
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    model: MODEL_NAME
                }
            });
            return response.body.choices[0].message.content

        } catch (error) {
            console.error('LLM API call failed:', error.message);
            throw error;
        }
    }

    async generateInitialTests(cppFiles) {
        console.log('🔄 Generating initial unit tests...');

        const generatedTests = [];

        for (const file of cppFiles) {
            const yamlInstructions = this.yamlConfig.initial_generation;

            const systemPrompt = `You are an expert C++ unit test generator. Follow these YAML instructions strictly:\n\n${yamlInstructions}`;

            const prompt = initialGenerationPrompt(file, this.config.outputDir);

            try {
                const testContent = await this.callLLM(prompt, systemPrompt);

                const testFileName = `test_${file.name.replace(/\.(cpp|cc|cxx|c)$/, '.cpp')}`;
                const testPath = path.join(this.config.outputDir, testFileName);

                fs.writeFileSync(testPath, testContent);

                generatedTests.push({
                    originalFile: file,
                    testFile: testFileName,
                    testPath: testPath,
                    content: testContent
                });

                console.log(`✅ Generated test for ${file.name} -> ${testFileName}`);
            } catch (error) {
                console.error(`❌ Failed to generate test for ${file.name}:`, error.message);
            }
        }

        console.log("\n")
        return generatedTests;
    }

    async refineTests(generatedTests) {
        console.log('🔄 Refining generated tests...');

        const refinedTests = [];

        for (const test of generatedTests) {
            const yamlInstructions = this.yamlConfig.refinement;

            const systemPrompt = `You are an expert C++ code reviewer. Follow these YAML instructions strictly:\n\n${yamlInstructions}`;

            const prompt = refineTestPrompt(test);

            try {
                const refinedContent = await this.callLLM(prompt, systemPrompt);

                fs.writeFileSync(test.testPath, refinedContent);

                refinedTests.push({
                    ...test,
                    content: refinedContent
                });

                console.log(`✅ Refined test ${test.testFile}`);
            } catch (error) {
                console.error(`❌ Failed to refine test ${test.testFile}:`, error.message);
                refinedTests.push(test);
            }
        }
        console.log("\n")
        return refinedTests;
    }

    async buildAndDebugTests(projectPath, tests) {
        console.log('🔄 Building project with generated tests...');

        try {
            const cmakeContent = this.generateCMakeLists(projectPath, tests);
            fs.writeFileSync(path.join(this.config.buildDir, 'CMakeLists.txt'), cmakeContent);

            const buildResult = this.buildProject();

            if (buildResult.success) {
                console.log('✅ Build successful\n');
                return await this.runTestsAndCalculateCoverage(projectPath, tests);
            } else {
                for (let i = 1; i <= 5; i++) {
                    console.log(buildResult.errors);
                    console.log('❌ Build failed, attempting to fix... Attempt ', i, " of 5");
                    
                    const res = await this.fixBuildErrors(buildResult.errors, tests);

                    if (res.success) {
                        console.log('✅ Build successful\n');
                        return await this.runTestsAndCalculateCoverage(projectPath, tests);
                    }

                    buildResult.errors = res.errors;
                }
                console.log(buildResult.errors);
                console.error('❌ Build process failed... Terminating');
                return;
            }
        } catch (error) {
            console.error('❌ Build process failed:', error.message);
            throw error;
        }
    }

    generateCMakeLists(projectPath, tests) {
        const testFiles = tests.map((t) => {
            // console.log(t.testPath);
            return `${path.relative(this.config.buildDir, t.testPath)}`
        }).join('\n');



        return `cmake_minimum_required(VERSION 3.10)
project(CppCoverageTest)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(GTest REQUIRED)
find_package(Threads REQUIRED)

# Source and test files
file(GLOB SRC_FILES "../codebase/*.cpp")
file(GLOB TEST_FILES ${testFiles})

add_executable(test_runner \${SRC_FILES} \${TEST_FILES})

target_include_directories(test_runner PRIVATE \${PROJECT_SOURCE_DIR}/codebase)

target_link_libraries(test_runner 
    GTest::GTest 
    GTest::Main 
    Threads::Threads
)

# Coverage flags
target_compile_options(test_runner PRIVATE --coverage)
target_link_options(test_runner PRIVATE --coverage)

enable_testing()
add_test(NAME unit_tests COMMAND test_runner)`;
    }


    buildProject() {
        try {
            const buildOutput = execSync(`cd ${this.config.buildDir} && cmake . && make`, { encoding: 'utf8', stdio: 'pipe' });
            // console.log(buildOutput);
            return { success: true, output: buildOutput };
        } catch (error) {
            return {
                success: false,
                errors: error.stdout + '\n' + error.stderr,
                output: error.stdout
            };
        }
    }

    async fixBuildErrors(errors, tests) {
        // console.log('🔄 Attempting to fix build errors...');

        const yamlInstructions = yaml.dump(this.yamlConfig.debugging);

        const systemPrompt = `You are an expert C++ developer. Follow these YAML instructions strictly:\n\n${yamlInstructions}`;

        for (const test of tests) {
            const prompt = debuggingPrompt(test, errors);

            try {
                const fixedContent = await this.callLLM(prompt, systemPrompt);
                fs.writeFileSync(test.testPath, fixedContent);
                test.content = fixedContent;

                console.log(`✅ Fixed errors in ${test.testFile}`);
            } catch (error) {
                console.error(`❌ Failed to fix errors in ${test.testFile}:`, error.message);
            }
        }

        console.log("\n");

        return this.buildProject();
    }

    async runTestsAndCalculateCoverage(projectPath, tests) {
        console.log('🔄 Running tests and calculating coverage...');

        try {
            const testOutput = execSync(`cd ${this.config.buildDir} && ./test_runner`,
                { encoding: 'utf8' });

            console.log('\n ✴️ Test Results:');
            console.log(testOutput);
            // console.log("All tests passed");
            try {
                const gcovDir = path.join(this.config.root, "../codebase");

                const gcnoFiles = glob.sync(
                    path.join(this.config.buildDir, 'CMakeFiles/test_runner.dir', gcovDir, '**/*.gcno')
                );

                let coverageOutput = '';
                for (const file of gcnoFiles) {
                    const relativePath = path.relative(this.config.buildDir, file);
                    coverageOutput += execSync(`cd ${this.config.buildDir} && gcov -pb ${relativePath}`, {
                        encoding: 'utf8'
                    });
                }

                const coverageData = this.parseCoverageOutput(coverageOutput);
                console.log("\n ✴️ Coverage Data")
                console.log(coverageData);

                return {
                    success: true,
                    testOutput: testOutput,
                    coverage: coverageData
                };
            } catch (coverageError) {
                console.log('⚠️  Coverage calculation not available (gcov not found)');
                console.log(coverageError);
                return {
                    success: true,
                    testOutput: testOutput,
                    coverage: null
                };
            }

        } catch (error) {
            // console.error('❌ Test execution failed:', error.message);
            // console.log(error.output[1]);
            console.log("\n🔄 Some Testcases failed. Attempting to fix...")

            // const testFiles = await this.scanCppProject(path.join(this.config.root, "../tests"));
            // console.log(testFiles);
            await this.removeFailedTests(error.output[1], tests);

            console.log("✅ Test Cases Fixed. Building Project Again...\n")

            return this.buildAndDebugTests(projectPath, tests);
        }
    }

    async removeFailedTests(testLog, testFiles) {
        const yamlInstructions = yaml.dump(this.yamlConfig.removeFailedTests);
        const systemPrompt = `You are an expert C++ developer. Follow these YAML instructions strictly:\n\n${yamlInstructions}`;

        for (const file of testFiles) {
            const prompt = removeFailedTestPrompt(file, testLog);
            try {
                const fixedContent = await this.callLLM(prompt, systemPrompt);
                fs.writeFileSync(file.testPath, fixedContent);
                file.content = fixedContent;
                
                console.log(`✅ Removed failed tests in ${file.testFile}`);
            } catch (error) {
                console.error(`❌ Failed to fix errors in ${file.testFile}:`, error.message);
            }
        }
        console.log("\n")
    }

    parseCoverageOutput(output) {
        const lines = output.split('\n');
        const coverage = {};
        const projectPath = path.resolve(this.config.root, '../codebase');

        let currentFile = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const fileMatch = line.match(/^File '(.+)'$/);
            if (fileMatch) {
                currentFile = path.resolve(fileMatch[1]);
                continue;
            }

            const coverageMatch = line.match(/^Lines executed:(\d+\.\d+)% of (\d+)/);
            if (coverageMatch && currentFile && currentFile.startsWith(projectPath)) {
                coverage[currentFile] = {
                    percentage: parseFloat(coverageMatch[1]),
                    totalLines: parseInt(coverageMatch[2])
                };
                currentFile = null;
            }
        }

        return coverage;
    }

    generateReport(tests, coverage) {

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: tests.length,
                totalTestCases: 0,
                averageCoverage: 0,
                filesProcessed: tests.map(t => t.originalFile.name)
            },
            details: []
        };

        let totalCoverage = 0;
        let coverageCount = 0;

        for (const test of tests) {
            const testCaseCount = (test.content.match(/TEST(?:_F|_P)?\s*\(/g) || []).length;
            report.summary.totalTestCases += testCaseCount;

            const fileCoverage = coverage ? coverage[test.originalFile.path] : null;
            const coveragePercent = fileCoverage ? fileCoverage.percentage : 0;

            if (fileCoverage) {
                totalCoverage += coveragePercent;
                coverageCount++;
            }

            report.details.push({
                originalFile: test.originalFile.name,
                testFile: test.testFile,
                testCases: testCaseCount,
                coverage: coveragePercent,
            });
        }

        report.summary.averageCoverage = coverageCount > 0 ? (totalCoverage / coverageCount).toFixed(2) : 0;

        const reportPath = path.join(this.config.outputDir, 'test_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('\n📊 Test Generation Report:');
        console.log(`Total C++ files processed: ${report.summary.filesProcessed.length}`);
        console.log(`Total test files generated: ${report.summary.totalTests}`);
        console.log(`Total test cases: ${report.summary.totalTestCases}`);
        console.log(`Average coverage: ${report.summary.averageCoverage}%`);
        console.log(`Report saved to: ${reportPath}`);

        return report;
    }


    async generateTestsForProject(projectPath) {
        console.log('🚀 Starting C++ Unit Test Generation...');
        
        try {
            await this.initialize();
            
            const cppFiles = await this.scanCppProject(projectPath);
            
            if (cppFiles.length === 0) {
                throw new Error('No C++ source files found in the project');
            }
            
            const initialTests = await this.generateInitialTests(cppFiles);
            
            const refinedTests = await this.refineTests(initialTests);
            
            const buildResult = await this.buildAndDebugTests(projectPath, refinedTests);
            
            let coverage = null;
            
            if (!buildResult.success) {
                console.log('⚠️  Final build failed, but tests are generated');
                return;
            }
            
            coverage = buildResult.coverage;
            
            const report = this.generateReport(refinedTests, coverage);
            
            console.log('\n✅ C++ Unit Test Generation Complete!');
            console.log(`📁 Tests generated in: ${this.config.outputDir}`);
            
            return {
                success: true,
                tests: refinedTests,
                report: report,
                coverage: coverage
            };
            
        } catch (error) {
            console.error('❌ Test generation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = CppTestGenerator;