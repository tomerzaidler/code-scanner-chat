import OpenAI from "openai";
import { ChatCompletion, Completion, CreateEmbeddingResponse } from "openai/resources";

export class OpenAIProvider {
    private client: OpenAI;
    constructor() {
        this.client = new OpenAI();
    }

    public async createEmbedding(text: string): Promise<number[]> {
        try {
            const result: CreateEmbeddingResponse = await this.client.embeddings.create({
                model: "text-embedding-ada-002",
                input: text
            });
            const embedding = result.data[0].embedding;
            return embedding;
        } catch (error) {
            throw error;
        }
    }

    public async createEmbeddings(text: string[]): Promise<number[][]> {
        try {
            const result: CreateEmbeddingResponse = await this.client.embeddings.create({
                model: "text-embedding-ada-002",
                input: text
            });
            result.data.sort((a, b) => {
                return a.index - b.index;
            });
            const embedding = result.data.map(embd => embd.embedding);
            return embedding;
        } catch (error) {
            throw error;
        }
    }

    public async propmt(text: string): Promise<string> {
        try {
            const result: ChatCompletion = await this.client.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are an AI code analysis tool specialized in answering questions about scanned code from repositories.' },
                    { role: 'user', content: text },
                ],
            });
            const answer = result.choices[0].message.content;
            return answer;
        } catch (error) {
            throw error;
        }
    }
}