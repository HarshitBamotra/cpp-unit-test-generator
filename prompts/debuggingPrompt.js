function debuggingPrompt(test, errors){
    return `
Fix the compilation errors in the following C++ test file:

Original Source File: ${test.originalFile.name}
Original Source File Path: ${test.originalFile.path}
Test File: ${test.testFile}
Test File Path: ${test.testPath}

Build Errors:
\`\`\`
${errors}
\`\`\`

Current Test Content:
\`\`\`cpp
${test.content}
\`\`\`

Please fix all compilation errors while maintaining the test logic and coverage.
Resolve import errors based on source file path and test file path
Return only the corrected complete C++ test file code.    
Only return the raw code.
Do not wrap the output in triple backticks or Markdown code blocks like \`\`\`cpp.
Just return the code as-is.
`
}

module.exports = debuggingPrompt;