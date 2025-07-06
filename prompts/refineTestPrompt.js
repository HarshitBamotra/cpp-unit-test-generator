function refineTestPrompt(test){
    return `
Review and improve the following generated unit test:

Original Source File: ${test.originalFile.name}
Original Source File Path: ${test.originalFile.path}
Test File: ${test.testFile}
Test File Path: ${test.testPath}

Current Test Content:
\`\`\`cpp
${test.content}
\`\`\`

Please refine this test by:
1. Removing any duplicate test cases
2. Adding missing include statements
3. Improving test organization and structure
4. Ensuring comprehensive coverage
5. Adding better test documentation
6. Optimizing mock usage
7. Don't import source files. Only import Headers in the source and resolve imports based on source file path and test file path
8. Only return the raw code.
9. Do not wrap the output in triple backticks or Markdown code blocks like \`\`\`cpp.
10. Just return the code as-is.

Return only the refined complete C++ test file code.`;
}

module.exports = refineTestPrompt;