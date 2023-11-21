# Code Scanner Chat

### Getting Started

```
setx OPENAI_API_KEY "sk-Ume95a13twY0NWWntxLhT8BlbaFJJdq9tT...."
```

### Code Scanner Answer Example:
```
{
  path: '.clones\\filesystem-indexed-stream-fRV7BNWc\\demo\\app.ts',
  answer: 'To use `FileSystemIndexedStream`, you can follow the code example below:\n' +
    '\n' +
    '```\n' +
    'import { FileSystemIndexedStream, FileSystemIndexedStreamOptions } from "filesystem-indexed-stream";\n' +
    '\n' +
    '// Create an async function and invoke it immediately\n' +
    '(async () => {\n' +
    '    // Create options for FileSystemIndexedStream\n' +
    '    const options = new FileSystemIndexedStreamOptions({\n' +
    "        path: 'big_file/file.txt', // Specify the path to your big file\n" +
    "        output: 'output1', // Specify the output folder for the indexed chunks\n" +
    '        size: 3 // Specify the size of each chunk in MB\n' +
    '    });\n' +
    '\n' +
    '    // Create an instance of FileSystemIndexedStream with the options\n' +
    '    const indexedStream = FileSystemIndexedStream.create(options);\n' +
    '\n' +
    '    // Split the big file into chunks\n' +
    '    indexedStream.splitToChunks();\n' +
    '\n' +
    '    // Compress the chunks to the specified output folders\n' +
    "    indexedStream.compressChunks('output1', 'output2');\n" +
    '})();\n' +
    '```\n' +
    '\n' +
    'Make sure you have installed the `filesystem-indexed-stream` package before running this code.'
}
```