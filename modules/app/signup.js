/**
 * requires
 */
const fs = require('fs');
const crypto = require('crypto');
const lib = require(__dirname + '/../../lib/lib.js');
const express = require('express');
const router = express.Router();

router.get('/signup', (req, res) => {
    res.end('Signup');
});

module.exports = router;
