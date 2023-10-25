const MODULE_NAME = 'ROUTER.LOGIN';

const crypto = require('node:crypto');
const express = require('express');
const logger = require('../logger');

const router = express.Router();
module.exports = router;

router.get('/', (req, res) => {
  res.render('login.html.njk');
});

router.post('/', express.urlencoded({ extended: false }), (req, res) => {
  if (req.session?.hasValidated) {
    res.redirect('/');
  }

  const password = req.body?.password;

  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  if (passwordHash === res.locals.NERINE_PASSWORD_HASH) {
    logger.info(`${MODULE_NAME} 871B15E6: User login`, {
      ip: req.ip,
    });

    req.session.hasValidated = true;
    res.redirect('/');
    return;
  }

  logger.verbose(`${MODULE_NAME} AA9CD06B: Invalid password`, {
    ip: req.ip,
    password,
    passwordHash,
    expectedHash: res.locals.NERINE_PASSWORD_HASH,
  });

  res.redirect('/login');
});

router.get('/out', (req, res) => {
  // req.session.hasValidated = false;
  req.session.destroy();
  res.redirect('/');
});
