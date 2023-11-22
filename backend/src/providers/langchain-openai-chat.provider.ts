import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseLanguageModelInput } from "langchain/dist/base_language";
import { BufferMemory, InputValues } from "langchain/memory";
import { AIMessagePromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";

export class LangChainProvider {
    private model: RunnableSequence<BaseLanguageModelInput, string>;
    private memory: BufferMemory;
    
    constructor() {
        this.initModel();
        this.initMemory();
    }

    private initModel() {
        this.model = new ChatOpenAI({ modelName: "gpt-4" }).pipe(
            new StringOutputParser()
        );
    }

    private initMemory() {
        this.memory = new BufferMemory({
            returnMessages: true, // Return stored messages as instances of `BaseMessage`
            memoryKey: "chat_history", // This must match up with our prompt template input variable.
        });
    }

    public async loadMemoryVariables(values: InputValues) {
        return await this.memory.loadMemoryVariables(values);
    }

    public getModel() {
        return this.model;
    }

    public createDocumentsPromptTemplate() {
        const documentsPromptTemplate = ChatPromptTemplate.fromMessages([
            AIMessagePromptTemplate.fromTemplate(
              "Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.\n\n{context}\n\n"
            ),
            new MessagesPlaceholder("chat_history"),
            HumanMessagePromptTemplate.fromTemplate("Question: {question}")
        ]);

        return documentsPromptTemplate;
    }

    public createQuestionGeneratorPromptTemplate() {
        const questionGeneratorPropmtTemplate = ChatPromptTemplate.fromMessages([
            AIMessagePromptTemplate.fromTemplate(
              "Given the following conversation about a codebase and a follow up question, rephrase the follow up question to be a standalone question."
            ),
            new MessagesPlaceholder("chat_history"),
            AIMessagePromptTemplate.fromTemplate(`Follow Up Input: {question}
          Standalone question:`)
        ]);

        return questionGeneratorPropmtTemplate;
    }

    public async saveHistory(input: string, output: string) {
        try {
            await this.memory.saveContext({ input }, { output });
        } catch (error) {
            throw error;
        }
    }
}