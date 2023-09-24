import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import { worker } from './constants/bullWorker.js';

worker.run();

process.on('SIGINT', async () => {
  await worker.close();
});

process.on('uncaughtException', function (error) {
  console.log(error.message, 'Uncaught exception');
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at: Promise', { reason, promise });
});

worker.on('error', (error) => {
  console.log(error.message);
});
