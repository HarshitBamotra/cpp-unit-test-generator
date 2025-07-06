# C++ Unit Test Generator

## Overview

Automatically generate, run, and evaluate Google Test unit tests for your C++ codebase using Github Models

Use these models for best results
- https://github.com/marketplace/models/azure-openai/gpt-4-1
- https://github.com/marketplace/models/azure-openai/gpt-4-1-mini
- https://github.com/marketplace/models/azure-openai/gpt-4-1-nano

---

## Features

- Scans and parses your C++ codebase
- Uses a Github Hosted LLM to generate unit tests
- Builds the project using `CMake`
- Resolves build issues using LLM
- Compiles and runs Google Test test cases
- Measures test coverage with `gcov`
- Removes failing test cases automatically via LLM feedback

---

## Project Structure
```
unit-test-generator
├── codebase    => C++ source files to test
├── tests       => Generated test files (Automatically generated)
├── build       => CMake build output (Automatically Generated)
├── src         => Node.js test generator logic

```
---
## Requirements

### C++ & Build
- g++
- CMake >= 3.10
- Google Test `gtest`

### Node.js
- Node.js >= 16
- `js-yaml`, `glob`, `dotenv`, etc. (run `npm install`)

---

## Installation and Setup

### 1. Create a folder and go inside it
```bash
mkdir unit-test-generator
cd unit-test-generator
```
### 2. Make codebase directory
```bash
mkdir codebase
```
### 3. Copy your C++ project into codebase folder
```bash
mv <path to your c++ project> ./codebase
```
### 4. Clone the repository as src:
```bash
git clone https://github.com/HarshitBamotra/cpp-unit-test-generator.git src
```
### 5. Change directory
```bash
cd src
```
### 6. Install Dependencies
```bash
npm install
```
### 7. Set up environment variables

**Sample `.env` file**
```env
ENDPOINT = "https://models.github.ai/inference"
MODEL_NAME = "openai/gpt-4.1-mini"
LLM_ACCESS_TOKEN = <your github PAT token> (make sure to provide read access to models while generating PAT token)
```
### 8. Start the Application
```bash
npm start
```
---

## Screenshots

### Test Generation
![Test Generation](https://github.com/HarshitBamotra/cpp-unit-test-generator/blob/master/assets/test-generation.png?raw=true)

### Building Project And Fixing Build Errors
![Building image and fixing build errors](https://github.com/HarshitBamotra/cpp-unit-test-generator/blob/master/assets/building-and-fixing-build-errors.png?raw=true)

### Removing Failing Test Cases
![Removing failing testcases](https://github.com/HarshitBamotra/cpp-unit-test-generator/blob/master/assets/removing-failing-testcases.png?raw=true)

### Test Results
![Test results](https://github.com/HarshitBamotra/cpp-unit-test-generator/blob/master/assets/test-result.png?raw=true)

### Test Report
![Test report](https://github.com/HarshitBamotra/cpp-unit-test-generator/blob/master/assets/test-report.png?raw=true)

