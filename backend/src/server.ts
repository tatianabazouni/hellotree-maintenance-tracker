import { createApp } from './app.js';
import { config, validateConfig } from './config.js';
import { PrismaRepository, prisma } from './repositories/prisma-repository.js';
validateConfig();
prisma
  .$connect()
  .then(() => {
    createApp(new PrismaRepository()).listen(config.port, () =>
      console.info(`API listening on port ${config.port}`),
    );
  })
  .catch((error) => {
    console.error('Database connection failed', error);
    process.exit(1);
  });
