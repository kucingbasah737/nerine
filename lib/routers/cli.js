// const MODULE_NAME = 'ROUTERS.CLI';

const express = require('express');
const childProcess = require('node:child_process');

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
  const { cmd: command } = req.body || {};

  let commandResult = '';
  if (command) {
    // commandResult = childProcess.execSync(command).toString();
    commandResult = await exec(command);
  }

  res.render('cli.html.njk', {
    dirname: __dirname,
    command,
    commandResult,
  });
};

router.get('/', pageMain);
router.post('/', express.urlencoded({ extended: false }), pageMain);
