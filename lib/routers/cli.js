const MODULE_NAME = 'ROUTERS.CLI';

const express = require('express');
const childProcess = require('node:child_process');
const logger = require('../logger');

const router = express.Router();
module.exports = router;

const exec = (command) => new Promise((resolve) => {
  const child = childProcess.spawn(command, ['2>&1'], { shell: true });
  let result = '';

  child.stdout.on('data', (chunk) => {
    result += chunk;
  });

  child.stderr.on('data', (chunk) => {
    result += chunk;
  });

  child.on('close', () => {
    resolve(result.toString());
  });
});

const pageMain = async (req, res) => {
  const { cmd: command, pwd: password } = req.body || {};

  let commandResult = '';
  if (command) {
    if (res.locals.NERINE_PASSWORD && (password !== res.locals.NERINE_PASSWORD)) {
      logger.verbose(`${MODULE_NAME} 655695EE: Invalid password`, {
        remoteAddress: req.ip,
        cmd: command,
      });

      commandResult = 'INVALID PASSWORD';
    } else {
      logger.verbose(`${MODULE_NAME} ED380A60: Executing CLI`, {
        remoteAddress: req.ip,
        cmd: command,
      });
      commandResult = await exec(command);
    }
  }

  res.render('cli.html.njk', {
    dirname: __dirname,
    password: password || '',
    command,
    commandResult,
  });
};

router.get('/', pageMain);
router.post('/', express.urlencoded({ extended: false }), pageMain);