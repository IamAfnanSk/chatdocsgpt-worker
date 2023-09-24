import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import { Job, Worker } from 'bullmq';
import {
  REDIS_CONNECTION_PASSWORD,
  REDIS_CONNECTION_USERNAME,
  REDIS_CONNECTION_HOST,
  REDIS_CONNECTION_PORT,
  BULLMQ_DOCS_PROCESSING_QUEUE_NAME,
  __dirname,
} from './global.js';
import { supabase } from './supabaseClient.js';
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';

import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { generateEmbeddings } from '../utils/generate-embeddings.js';

const processGitRepo = async (gitSourceURL: string, trainingGroupId: string, gitSourceDocDirPath?: string) => {
  const repoName = trainingGroupId;

  const repoDir = join(__dirname, '..', '..', 'repos', `${trainingGroupId}---` + Date.now());

  await mkdir(repoDir, { recursive: true });

  const git: SimpleGit = simpleGit(repoDir).clean(CleanOptions.FORCE);

  await git.clone(gitSourceURL, repoName, {
    '--depth': 1,
  });

  const pathToProcess = gitSourceDocDirPath ? join(repoDir, repoName, gitSourceDocDirPath) : join(repoDir, repoName);

  console.log({ repoDir });

  console.log({ gitSourceDocDirPath }, { pathToProcess });

  await generateEmbeddings(pathToProcess, trainingGroupId, repoDir);

  // Cleanup: Delete the cloned repository.
  await rm(repoDir, { recursive: true });
};

const worker = new Worker(
  BULLMQ_DOCS_PROCESSING_QUEUE_NAME,
  async (job: Job) => {
    const { trainingGroupId } = job.data;

    console.log(`Started processing:- ${job.name} : ${job.data}`);

    try {
      if (!trainingGroupId) {
        throw `Invalid request with data: ${job.data}`;
      }

      const { data: trainingGroupData, error: trainingGroupError } = await supabase
        .from('training_groups')
        .select('*')
        .eq('id', trainingGroupId)
        .limit(1)
        .maybeSingle();

      if (trainingGroupError) {
        throw `Training group fetch error for ${job.data}`;
      }

      if (!trainingGroupData) {
        throw `No training group found with provided id. data:- ${job.data}`;
      }

      // Set status to processing
      await supabase.from('training_groups').update({ status: 'processing' }).eq('id', trainingGroupId);

      const { id, created_at, user_id, git_source_url, git_source_doc_dir_path, name, image_url, status } =
        trainingGroupData;

      console.log('Training group data', {
        id,
        created_at,
        user_id,
        git_source_url,
        git_source_doc_dir_path,
        name,
        image_url,
        status,
      });

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user_id)
        .limit(1)
        .maybeSingle();

      if (!userData || userError) {
        throw `Invalid request, user don't exists or problem fetching user: ${user_id} data: ${job.data}`;
      }

      if (userData.credits) {
        const newCredits = userData.credits - 1;

        await supabase
          .from('users')
          .update({
            credits: newCredits,
          })
          .eq('id', user_id);
      } else {
        throw `Error:- user credits not found!!! user: ${user_id} userdata: ${userData} job data: ${job.data}`;
      }

      await processGitRepo(git_source_url, id, git_source_doc_dir_path);

      await supabase.from('training_groups').update({ status: 'ready' }).eq('id', trainingGroupId);
    } catch (error) {
      await supabase.from('training_groups').update({ status: 'errored' }).eq('id', trainingGroupId);
      console.log(error);
    }
  },
  {
    connection: {
      password: REDIS_CONNECTION_PASSWORD,
      username: REDIS_CONNECTION_USERNAME,
      tls: {
        host: REDIS_CONNECTION_HOST,
        port: parseInt(REDIS_CONNECTION_PORT),
      },
    },
    autorun: false,
  },
);

export { worker };
