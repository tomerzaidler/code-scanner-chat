# Code Scanner Chat

### Getting Started
Set the following environment variables:
- OPENAI_API_KEY
- SUPABASE_PRIVATE_KEY
- SUPABASE_URL
----
### Usage:
```typescript
const projectService = new ProjectService();
const userID = 'user@gmail.com';
const repository = 'https://github.com/tomerzaidler/filesystem-indexed-stream.git';
// await projectService.scan(userID, repository);
const question = 'How can I use FileSystemIndexedStream? please show example';
const result = await projectService.askAQuestion(userID, repository, question);
```


### Code Scanner Answer Example:
----
#### Question: 

- How can I use FileSystemIndexedStream? please show 

#### Answer:

Yes, here is an example of how to use the `FileSystemIndexedStream` in the codebase:

```javascript
import { FileSystemIndexedStream, FileSystemIndexedStreamOptions } from "filesystem-indexed-stream";

(async() => {
    const options = new FileSystemIndexedStreamOptions({
        path: 'big_file/file.text',  // The path to the file
        output: 'output1',  // The output directory
        size: 3  // The size of every chunk
    });
    const indexed_stream = FileSystemIndexedStream.create(options);  // Create a new IndexedStream with the given options
    indexed_stream.splitToChunks();  // Split the stream into chunks
    indexed_stream.compressChunks('output1', 'output2');  // Compress the chunks
})();
```
In this example, a `FileSystemIndexedStreamOptions` object is created which specifies the size of each chunk, the path to the file, and the output directory. A `FileSystemIndexedStream` is then created from these options, the stream is split into chunks and the chunks are compressed.

----