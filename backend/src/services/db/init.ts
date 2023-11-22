
export class InitDBQueries {
    constructor() {

    }

    createPGExtensionVector() {
        const query = `
        create extension vector;
        `; 
        return query;
    }

    createUpdatedAtFunction () {
        const query = `
            CREATE OR REPLACE FUNCTION update_modified_column()   
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;   
            END;
            $$ language 'plpgsql';
        `;
        return query;
    }

    createDocumentsTable() {
        const query = `
        create table
        public.documents (
            id bigserial,
            content text null,
            metadata jsonb null,
            embedding vector(1536) not null,
            "repositoryURL" text not null,
            "userID" text not null,
            "filePath" text not null,
            created_at timestamp without time zone null default now(),
            updated_at timestamp without time zone null default now(),
            constraint documents_pkey primary key (id),
            constraint userid_repositoryurl_filepath_unique unique ("userID", "repositoryURL", "filePath")
        ) tablespace pg_default;

        create trigger update_customer_modtime before
        update on documents for each row
        execute function update_modified_column ();
        `; 
        return query;
    }

    createMatchDocumentsFunction() {
        const query = `
        create function match_documents (
            query_embedding vector(1536),
            match_count int DEFAULT null,
            filter jsonb DEFAULT '{}'
          ) returns table (
            id bigint,
            content text,
            metadata jsonb,
            embedding jsonb,
            similarity float
          )
          language plpgsql
          as $$
          #variable_conflict use_column
          begin
            return query
            select
              id,
              content,
              metadata,
              (embedding::text)::jsonb as embedding,
              1 - (documents.embedding <=> query_embedding) as similarity
            from documents
            where metadata @> filter
            order by documents.embedding <=> query_embedding
            limit match_count;
          end;
          $$;
        `;
        return query;
    }
}