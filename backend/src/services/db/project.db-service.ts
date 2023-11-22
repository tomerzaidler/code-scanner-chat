import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseFilterRPCCall, SupabaseLibArgs, SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { Document } from "langchain/dist/document";

export class ProjectDBService {
    private client: SupabaseClient<any, "public", any>;
    private vectorStore: SupabaseVectorStore;
    private dbConfig: SupabaseLibArgs;

    constructor() {
        this.initClient();
        this.initDBConfig();
        this.initVectorStore();
    }

    private initDBConfig() {
        this.dbConfig = {
            client: this.client,
            tableName: "documents",
            queryName: "match_documents"
        };
    }

    private initClient() {
        const privateKey = process.env.SUPABASE_PRIVATE_KEY;
        if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);
    
        const url = process.env.SUPABASE_URL;
        if (!url) throw new Error(`Expected env var SUPABASE_URL`);
    
        this.client = createClient(url, privateKey);
    }

    private initVectorStore() {
        this.vectorStore = new SupabaseVectorStore(new OpenAIEmbeddings(), this.dbConfig);
    }

    private createRetriever(userID: string, repository: string) {
        const filterByIdentifiers: SupabaseFilterRPCCall = (rpc) => rpc.filter("metadata->>repositoryURL", "eq", repository)
                                                                       .filter("metadata->>userID", "eq", userID);
        const retriever = this.vectorStore.asRetriever({
            searchType: "mmr", // Use max marginal relevance search
            searchKwargs: { fetchK: 5 },
            filter: filterByIdentifiers
        });
        return retriever;
    }

    public async saveFromDocuments(userID: string, repositoryURL: string, documents: Document<Record<string, any>>[]) {
        const method_name = 'ProjectDBService/saveFromDocuments';
        try {
            // await SupabaseVectorStore.fromDocuments(
            //     documents,
            //     new OpenAIEmbeddings(),
            //     this.dbConfig
            // );
            const openAIEmbedding = new OpenAIEmbeddings()
            const embeddings = await openAIEmbedding.embedDocuments(documents.map(d => d.pageContent));
            let data = documents.map((d, i) => {
                return { 
                    content: d.pageContent, 
                    embedding: embeddings[i], 
                    metadata: d.metadata, 
                    userID: d.metadata.userID,
                    filePath: d.metadata.filePath,
                    repositoryURL: d.metadata.repositoryURL
                };
            })

            await this.client.from(this.dbConfig.tableName).upsert(data, {
                onConflict: 'userID, repositoryURL, filePath'
            })
        } catch (error) {
            console.log(`${method_name} - error`, error);
            throw error;
        }
    }

    public async getRelevantDocuments(userID: string, repository: string, output: string): Promise<Document<Record<string, any>>[]> {
        const method_name = 'ProjectDBService/getRelevantDocuments';
        try {
            const retriever = this.createRetriever(userID, repository);
            const relevantDocs = await retriever.getRelevantDocuments(output);
            return relevantDocs;
        } catch (error) {
            console.log(`${method_name} - error`, error);
            throw error;
        }
    }
}