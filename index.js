#!/usr/bin/env node

const MODULE_NAME = 'NERINE';

const DEFAULT_PORT = 8080;
// const NUNJUCKS_NO_CACHE = true;

require('dotenv').config();
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const nunjucks = require('nunjucks');
const express = require('express');
const session = require('express-session');
const compression = require('compression');
const uniqid = require('uniqid');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const logger = require('./lib/logger');
const vars = require('./vars');
const pjson = require('./package.json');

const routerCli = require('./lib/routers/cli');
const routerLogin = require('./lib/routers/login');

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
  .options('password-hash', {
    type: 'string',
    default: process.env.NERINE_PASSWORD_HASH || '',
    describe: 'also obey NERINE_PASSWORD_HASH env',
  })
  .options('session-name', {
    type: 'string',
    default: process.env.NERINE_SESSION_NAME || 'NERINE',
    describe: 'also obey NERINE_SESSION_NAME',
  })
  .options('session-secret', {
    type: 'string',
    default: process.env.NERINE_SESSION_SECRET || uniqid(),
    describe: 'also obey NERINE_SESSION_SECRET',
  })
  .options('cache', {
    type: 'boolean',
    default: true,
  })
  .options('pidfile', {
    type: 'string',
  })
  .strict();

// console.log(argv); process.exit(0);

const {
  port,
  pidfile,
  password,
  passwordHash: passwordHashFromArg,
  cache,
  sessionName,
  sessionSecret,
} = argv;

const passwordHash = password ? crypto.createHash('sha256').update(password).digest('hex')
  : passwordHashFromArg;

const app = express();
app.use(compression());

const validateSession = (req, res, next) => {
  if (!passwordHash) {
    next();
    return;
  }

  if (req.session?.hasValidated) {
    next();
    return;
  }

  logger.verbose(`${MODULE_NAME} E14162EE: Redirecting to login`, {
    ip: req.ip,
  });

  res.redirect('/login');
};

app.use(session({
  secret: sessionSecret,
  resave: true,
  saveUninitialized: false,
  name: sessionName,
}));

nunjucks.configure(
  path.join(__dirname, 'views'),
  // 'views',
  {
    autoescape: true,
    express: app,
    noCache: cache === false,
  },
);

app.use((req, res, next) => {
  res.locals.NERINE_VERSION = pjson.version;
  res.locals.NERINE_PASSWORD = password;
  res.locals.NERINE_PASSWORD_HASH = passwordHash;

  next();
});

app.use('/login', routerLogin);
app.use('/cli', validateSession, routerCli);

app.all('/', validateSession, (req, res) => {
  res.redirect(vars.defaultPath);
});

app.listen(port, async () => {
  logger.info('Listening', {
    port,
    version: pjson.version,
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
