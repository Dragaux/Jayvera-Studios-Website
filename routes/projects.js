const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT slug, name, summary, problem, solution, results, status, stack, year, url FROM projects WHERE visible = 1 ORDER BY sort_order ASC, id ASC')
    .all()
    .map((p) => ({ ...p, stack: p.stack ? p.stack.split(',') : [] }));
  res.json(rows);
});

module.exports = router;
