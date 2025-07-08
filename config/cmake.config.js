function cmakeFileContent(testFiles){

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

module.exports = cmakeFileContent;