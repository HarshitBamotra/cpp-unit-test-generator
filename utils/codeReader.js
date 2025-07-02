const fs = require("fs").promises;
const path = require("path");

const files = {};

const regex = /\.(c|cpp|h|hpp)$/

async function readRecursively(currPath) {
    try {
        const items = await fs.readdir(currPath, {withFileTypes: true});

        for(const item of items){
            const itemPath = path.join(currPath, item.name);
            
            if(item.isDirectory()){
                await readRecursively(itemPath);
                continue;
            }

            if(!regex.test(item.name)){
                continue;
            }

            const content = await fs.readFile(itemPath, "utf-8");
            // console.log("------------------FILE START------------------")
            // console.log(content);
            // console.log("-------------------FILE END-------------------")
            files[itemPath] = content;
        }
    }
    catch (err) {
        console.log(err);
    }
}

async function codeReader(codeRoot = "../../codebase") {
    
    try {
        const absPath = path.resolve(__dirname, codeRoot);
        await readRecursively(absPath);
        console.log(files);
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = codeReader;