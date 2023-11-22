import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { GitProvider } from "../providers/git.provider";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/dist/document";
import { ProjectDBService } from "./db/project.db-service";
import { StringOutputParser } from "langchain/schema/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";
import { formatDocumentsAsString } from "langchain/util/document";
import { LangChainProvider } from "../providers/langchain-openai-chat.provider";
import path from 'path';

export class ProjectService {
    private gitProvider: GitProvider;
    private langChainProvider: LangChainProvider;
    private projectDBService: ProjectDBService;

    constructor() {
        this.gitProvider = new GitProvider('.clones');
        this.langChainProvider = new LangChainProvider();
        this.projectDBService = new ProjectDBService();
    }

    public async scan(userID: string, repositoryURL: string): Promise<void> {
        const method_name = 'ProjectService/scan';
        try {
            const projectLocalPath = await this.downloadProject(repositoryURL);
            const documents = await this.loadProjectDocuments(projectLocalPath);
            const transformedDocuments = await this.transformProjectDocuments(userID, projectLocalPath, repositoryURL, documents);
            await this.projectDBService.saveFromDocuments(userID, repositoryURL, transformedDocuments);
            await this.gitProvider.clean(projectLocalPath);
        } catch (error) {
            console.log(`${method_name} - error`, error);
            throw error;
        }
    }

    private async downloadProject(repositoryURL: string): Promise<string> {
        const method_name = 'ProjectService/downloadProject';
        try {
            const projectLocalPath = await this.gitProvider.clone(repositoryURL);
            return projectLocalPath;
        } catch (error) {
            console.log(`${method_name} - error`, error);
            throw error;
        }
    }

    private async loadProjectDocuments(repoLocalPath: string): Promise<Document<Record<string, any>>[]> {
        const method_name = 'ProjectService/loadProjectDocuments';
        try {
            const loader = new DirectoryLoader(repoLocalPath, {
                ".ts": (path) => new TextLoader(path)
            });
            const docs = await loader.load();
            return docs;
        } catch (error) {
            console.log(`${method_name} - error`, error);
            throw error;
        }
    }

    private async transformProjectDocuments(userID: string, projectLocalPath: string, repositoryURL: string, docs: Document<Record<string, any>>[]): Promise<Document<Record<string, any>>[]> {
        const method_name = 'ProjectService/transformProjectDocuments';
        try {
            const javascriptSplitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
                chunkSize: 2000,
                chunkOverlap: 200
            });

            const transformedDocuments = await javascriptSplitter.splitDocuments(docs);
            // Inject attributes in each document metadata
            const transformedDocumentsWithDetails = transformedDocuments.map(t => {
                const localProjectDir = path.join(process.cwd(), projectLocalPath);
                const projectRelativePath = t.metadata.source.replace(localProjectDir, '').split(path.sep).join(path.posix.sep);
                const filePath = `${projectRelativePath}_${t.metadata.loc.lines.from}_${t.metadata.loc.lines.to}`
                t.metadata = {...t.metadata, repositoryURL, userID, filePath};
                return t;
            });

            console.log(`${method_name} - end`, {message: `Loaded ${transformedDocumentsWithDetails.length} documents.`});

            return transformedDocumentsWithDetails;
        } catch (error) {
            console.log(`${method_name} - error`, error);
            throw error;
        }
    }

    public createDocumentsChainWithHistory(userID: string, repository: string) {
        const documentsPromptTemplate = this.langChainProvider.createDocumentsPromptTemplate();
        
        const combineDocumentsChain = RunnableSequence.from([
            {
              question: (output: string) => output,
              chat_history: async () => {
                const { chat_history } = await this.langChainProvider.loadMemoryVariables({});
                return chat_history;
              },
              context: async (output: string) => {
                const relevantDocs = await this.projectDBService.getRelevantDocuments(userID, repository, output);
                return formatDocumentsAsString(relevantDocs);
              },
            },
            documentsPromptTemplate,
            this.langChainProvider.getModel(),
            new StringOutputParser()
        ]);

        return combineDocumentsChain;
    }

    public createQAChainWithHistory(userID: string, repository: string) {
        const createDocumentsChainWithHistory = this.createDocumentsChainWithHistory(userID, repository);
        const questionGeneratorPropmtTemplate = this.langChainProvider.createQuestionGeneratorPromptTemplate();
        
        const conversationalQaChainWithHistory = RunnableSequence.from([
            {
              question: (i: { question: string }) => i.question,
              chat_history: async () => {
                const { chat_history } = await this.langChainProvider.loadMemoryVariables({});
                return chat_history;
              }
            },
            questionGeneratorPropmtTemplate,
            this.langChainProvider.getModel(),
            new StringOutputParser(),
            createDocumentsChainWithHistory,
        ]);

        return conversationalQaChainWithHistory;
    }

    public async askAQuestion(userID: string, repository: string, question: string) {
        try {
            const conversationalQaChainWithHistory = this.createQAChainWithHistory(userID, repository);
            const result = await conversationalQaChainWithHistory.invoke({ question });
            await this.langChainProvider.saveHistory(question, result);
            return result;
        } catch (error) {
            throw error;
        }
    }
}