import { CodeScan } from "./models/code-scanner";

async function main() {
    try {
        const codeScan = new CodeScan({
            question: 'How can I use FileSystemIndexedStream? please show example',
            repository: 'https://github.com/tomerzaidler/filesystem-indexed-stream.git'
        });
        const result = await codeScan.execute();
        console.log(result);
    } catch (error) {
        console.log(error);
    }
}

main();