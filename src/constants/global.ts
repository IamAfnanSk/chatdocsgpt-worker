import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  REDIS_CONNECTION_USERNAME,
  REDIS_CONNECTION_PASSWORD,
  REDIS_CONNECTION_PORT,
  REDIS_CONNECTION_HOST,
  SUPABASE_HOST,
  SUPABASE_KEY,
  OPENAI_KEY,
} = process.env;

if (!REDIS_CONNECTION_USERNAME || !REDIS_CONNECTION_PASSWORD || !REDIS_CONNECTION_HOST || !REDIS_CONNECTION_PORT) {
  throw 'Redis connection details is not (completly or partially) present in env, please add and run again';
}

if (!SUPABASE_HOST || !SUPABASE_KEY) {
  throw 'Supabase creds missing';
}

if (!OPENAI_KEY) {
  throw 'OpenAI Api key is required';
}

const BULLMQ_DOCS_PROCESSING_QUEUE_NAME = 'chatdocsgpt-docs-processing-queue';

export {
  REDIS_CONNECTION_USERNAME,
  REDIS_CONNECTION_PASSWORD,
  REDIS_CONNECTION_PORT,
  REDIS_CONNECTION_HOST,
  BULLMQ_DOCS_PROCESSING_QUEUE_NAME,
  SUPABASE_HOST,
  SUPABASE_KEY,
  OPENAI_KEY,
  __dirname,
};
