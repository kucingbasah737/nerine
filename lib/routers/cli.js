const MODULE_NAME = 'ROUTERS.CLI';

const os = require('node:os');
const path = require('node:path');
const express = require('express');
const childProcess = require('node:child_process');
const logger = require('../logger');

const router = express.Router();
module.exports = router;

const exec = (command, dirname) => new Promise((resolve) => {
  const child = childProcess.spawn(command, ['2>&1'], { shell: true, cwd: dirname });
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
  const dirname = req.session?.dirname || process.cwd();

  const { cmd: command } = req.body || {};

  let commandResult = '';
  if (command) {
    logger.verbose(`${MODULE_NAME} ED380A60: Executing CLI`, {
      remoteAddress: req.ip,
      cmd: command,
    });

    const [progName, arg] = command.trim().split(/ +/);
    if (progName === 'cd') {
      let newDirname = os.homedir();
      if (arg) {
        if (arg.indexOf('/') === 0) {
          newDirname = arg;
        } else {
          newDirname = path.join(dirname, arg);
        }
      }

      logger.verbose(`${MODULE_NAME} 3FA27EFF: Change working directory`, {
        remoteAddress: req.ip,
        command,
        newDirname,
      });

      req.session.dirname = newDirname;
      res.redirect('/cli/');
      return;
    }

    commandResult = await exec(command, dirname);
  }

  res.render('cli.html.njk', {
    dirname,
    command,
    commandResult,
  });
};

router.get('/', pageMain);
router.post('/', express.urlencoded({ extended: false }), pageMain);
