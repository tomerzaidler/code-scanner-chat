import DataFrame, { Row } from "dataframe-js";
import { FileScanner } from "./file-scanner";
import { GitProvider } from "./git-provider";
import { OpenAIProvider } from "./openai-provider";
import similarity from "compute-cosine-similarity";

export class CodeScan {
    private openAIProvider: OpenAIProvider;
    private gitProvider: GitProvider;
    private scanRequest: CodeScanRequest;

    constructor(scanRequest: CodeScanRequest) {
        this.scanRequest = scanRequest;
        this.openAIProvider = new OpenAIProvider();
        this.gitProvider = new GitProvider('.clones');
    }

    private async scanRepository(): Promise<DataFrame> {
        const repoLocalPath = await this.gitProvider.clone(this.scanRequest.repository);
        console.log('repoLocalPath: ', repoLocalPath);
        const fileScanner = new FileScanner(['.ts', 'package.json', '.md'], ['node_modules', 'build', 'dist', '.git', 'package-lock.json']);
        let filesDataFrame: DataFrame = await fileScanner.scan(repoLocalPath);
        await this.gitProvider.clean(repoLocalPath);
        return filesDataFrame;
    }

    private async createRepositoryFilesEmbeddings(df: DataFrame): Promise<DataFrame> {
        for (let i = 0; i < df.count(); i++) {
            const row: Row = df.getRow(i);
            const code = row.get('code');
            const embedding = await this.openAIProvider.createEmbedding(code);
            df = df.setRow(i, row => row.set("embedding", embedding));
        }
        return df;
    }

    private async createQuestionsEmbedding(): Promise<number[]> {
        const questionEmbedding = await this.openAIProvider.createEmbedding(this.scanRequest.question);
        return questionEmbedding;
    }

    private calculateCosineSimilarity(df: DataFrame, questionEmbedding: number[]): DataFrame {
        for (let i = 0; i < df.count(); i++) {
            const row: Row = df.getRow(i);
            const embedding = row.get('embedding');
            const cosineSimilarity = similarity(embedding, questionEmbedding);
            df = df.setRow(i, row => row.set("cosine_similarity", cosineSimilarity));
        }
        return df;
    }

    private getSimilarChoice(df: DataFrame): CodeScannerChoice {
        const resultDF = df.sortBy('cosine_similarity', true).head(1);
        const code = resultDF.getRow(0).get('code');
        const path = resultDF.getRow(0).get('path');
        return {path, code};
    }
    
    private async createPrompt(choice: CodeScannerChoice) {
        const prompt = `
        This is a piece of code:\n
        ${choice.code}\n
        I have a question about this code:\n
        ${this.scanRequest.question}\n
        Please answer in concise manner and show code example if needed.
        `;
        const answer = await this.openAIProvider.propmt(prompt);
        return answer;
    }

    public async execute(): Promise<CodeScanResponse> {
        
        let filesDataFrame: DataFrame = await this.scanRepository();
        filesDataFrame = await this.createRepositoryFilesEmbeddings(filesDataFrame);

        const questionEmbedding = await this.createQuestionsEmbedding();
        filesDataFrame = this.calculateCosineSimilarity(filesDataFrame, questionEmbedding);
        const choice = this.getSimilarChoice(filesDataFrame);

        const answer = await this.createPrompt(choice);
        const { path } = choice;
        const { question } = this.scanRequest;
        const result = {path, question, answer};
        return result;
    }
}

export interface CodeScanRequest {
    repository: string;
    question: string;
}

export interface CodeScanResponse {
    path: string;
    question: string;
    answer: string;
}

export interface CodeScannerChoice {
    path: string;
    code: string;
}
