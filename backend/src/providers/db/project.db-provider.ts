import { PoolClient } from "pg";
import { DBProvider } from "./db.provider";

export class ProjectDBProvider {
    private provider: DBProvider;

    constructor() {
        this.provider = DBProvider.getInstance();
    }

    public async upsertProjectDocuments(documentList) {
        const method_name = 'ProjectDBProvider/upsertProjectDocuments';
        let connection: PoolClient;
        try {
            connection = await this.provider.startTransaction();
            const params = [documentList];
            const query = `INSERT INTO documents(content, embedding, metadata) VALUES ($1, $2, $3)`;
            const query2 = `
            INSERT INTO documents(content, embedding, metadata)
            select
            (v ->> 'content')::int,
            (v ->> 'embedding')::vector(),
            (v ->> 'metadata')::jsonb 
            from jsonb_array_elements($1::jsonb) as t(v);
            `;
  

            const res = await this.provider.executeQuery(query2, params, connection);
            console.log(res);
        } catch (error) {
            if (connection) {
                this.provider.rollbackTransaction(connection);
            }
            console.log(`${method_name} - error`, error);
            throw error;
        }
    }
}