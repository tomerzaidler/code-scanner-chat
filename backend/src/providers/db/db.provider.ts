import { Pool, PoolClient, PoolConfig } from "pg";

export class DBProvider {

    // static
    private static _instance: DBProvider;

    public static getInstance() {
        if(!DBProvider._instance) {
            DBProvider._instance = new DBProvider();
        }
        return DBProvider._instance;
    }

    // instance
    private config: PoolConfig;
    private pool: Pool;

    private constructor() {
        this.setConfig();
        this.setPool();
        this.addlisteners();
    }

    private setConfig() {
        this.config = {
            host: "",
            port: 5432,
            user: "postgres",
            password: "",
            database: "postgres",
            min: 5,
            max: 20
        };
    }

    private setPool() {
        this.pool = new Pool(this.config);
    }

    private addlisteners() {
        this.pool.on('error', (err, client) => {
            console.error('DBProvider/error - Unexpected error on idle client', err);
        });
    }

    public async createConnection(): Promise<PoolClient> {
        const connection = await this.pool.connect();
        return connection;
    }

    public async closeConnection(connection: PoolClient): Promise<void> {
        await connection.release();
    }

    public async startTransaction() {
        const connection = await this.createConnection();
        await connection.query('BEGIN');
        return connection;
    }

    public async commitTransaction(connection: PoolClient) {
        await connection.query('COMMIT');
        await this.closeConnection(connection);
    }

    public async rollbackTransaction(connection: PoolClient) {
        await connection.query('ROLLBACK');
        await this.closeConnection(connection);
    }

    public async executeQuery(query: string, params: any[], connection?: PoolClient) {
        let is_outside_conn = true;
        try {
            if (!connection) {
                is_outside_conn = false;
                connection = await this.startTransaction();
            }
            const result = await connection.query(query, params);
            await this.commitTransaction(connection);
            return result;
        } catch (error) {
            if (connection && !is_outside_conn) {
                await this.rollbackTransaction(connection)
            }
            throw error;
        }
    }
}