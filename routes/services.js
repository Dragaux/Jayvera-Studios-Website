const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, title, description FROM services WHERE visible = 1 ORDER BY sort_order ASC, id ASC')
    .all();
  res.json(rows);
});

module.exports = router;
