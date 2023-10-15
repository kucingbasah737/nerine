const DEFAULT_PORT = 8080;
const NUNJUCKS_NO_CACHE = true;

require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const nunjucks = require('nunjucks');
const express = require('express');
const compression = require('compression');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const logger = require('./lib/logger');
const pjson = require('./package.json');

const routerCli = require('./lib/routers/cli');

const { argv } = yargs(hideBin(process.argv))
  .version(pjson.version)
  .options('port', {
    type: 'number',
    default: Number(process.env.NERINE_PORT) || DEFAULT_PORT,
    describe: 'also obey NERINE_PORT env',
  })
  .options('password', {
    type: 'string',
    default: process.env.NERINE_PASSWORD || '',
    describe: 'also obey NERINE_PASSWORD env',
  })
  .options('pidfile', {
    type: 'string',
  })
  .strict();

const {
  port,
  pidfile,
  password,
} = argv;

(async () => {
  const app = express();
  app.use(compression());

  nunjucks.configure(
    path.join(__dirname, 'views'),
    {
      autoescape: true,
      express: app,
      noCache: NUNJUCKS_NO_CACHE,
    },
  );

  app.use((req, res, next) => {
    res.locals.NERINE_VERSION = pjson.version;
    res.locals.NERINE_PASSWORD = password;

    next();
  });

  app.use('/cli', routerCli);

  app.listen(port, async () => {
    logger.info('Listening', {
      port,
      workDir: process.cwd(),
    });

    if (pidfile) {
      await fs.writeFile(pidfile, process.pid.toString());
    }
  })
    .on('error', (e) => {
      logger.warn('Error listening', {
        port,
        eCode: e.code,
        eMessage: e.message || e.toString(),
      });

      process.exit(1);
    });
})();
