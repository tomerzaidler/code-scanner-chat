import { CodeScan } from "./models/code-scanner";
import { ProjectService } from "./services/project.service";

async function main_old() {
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
// main_old();


/**
 * Docs:
 * https://js.langchain.com/docs/integrations/vectorstores/supabase/ 
 */
const main = async () => {
    const projectService = new ProjectService();
    const userID = 'tomerzaidler@gmail.com';
    const repository = 'https://github.com/tomerzaidler/filesystem-indexed-stream.git';
    // await projectService.scan(userID, repository);
    const question = 'How can I use FileSystemIndexedStream? please show example';
    const result = await projectService.askAQuestion(userID, repository, question);
    console.log({question, result});
}

main();
