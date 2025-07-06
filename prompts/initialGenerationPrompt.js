function initialGenerationPrompt(file, testDir){
    return `
Generate comprehensive unit tests for the following C++ source file:

Source File: ${file.name}
Source File Path: ${file.path}
Test Directory: ${testDir} (All test files will be saved here. Resolve header imports accordingly)

Source Code:
\`\`\`cpp
${file.content}
\`\`\`

Please generate a complete test file with:
1. All necessary include statements
2. Test cases for all public functions
3. Edge cases and boundary conditions
4. Proper test structure using Google Test framework
5. Mock objects where needed for external dependencies
6. Don't import source files. Only import Headers in the source and resolve imports based on source file path and test directory
7. Only return the raw code.
8. Do not wrap the output in triple backticks or Markdown code blocks like \`\`\`cpp.
9. Just return the code as-is.

Return only the complete C++ test file code.`;
}

module.exports = initialGenerationPrompt;