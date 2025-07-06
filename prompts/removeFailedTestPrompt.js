function removeFailedTestPrompt(file, testLog){
    return `
Remove the failing testcase from the following C++ test file if it exists. Don't change anything else:

Test File: ${file.testFile}
Test File Path: ${file.testPath}

Test Logs:
\`\`\`
${testLog}
\`\`\`

Current Test Content:
\`\`\`cpp
${file.content}
\`\`\`

Please remove all the failing testcases if they exist in this file
Return only the corrected complete C++ test file code.   
Only return the raw code.
Do not wrap the output in triple backticks or Markdown code blocks like \`\`\`cpp.
Just return the code as-is. 
`
}

module.exports = removeFailedTestPrompt;