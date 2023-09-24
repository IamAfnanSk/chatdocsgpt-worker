declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REDIS_CONNECTION_USERNAME: string;
      REDIS_CONNECTION_PASSWORD: string;
      REDIS_CONNECTION_HOST: string;
      REDIS_CONNECTION_PORT: string;
      SUPABASE_HOST: string;
      SUPABASE_KEY: string;
      OPENAI_KEY: string;
    }
  }
}

export {};
