require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('./db'); // initializes schema + seed data on first run

const trackVisit = require('./middleware/trackVisit');
const contactRoute = require('./routes/contact');
const projectsRoute = require('./routes/projects');
const servicesRoute = require('./routes/services');
const adminRoute = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(trackVisit);

app.use('/api/contact', contactRoute);
app.use('/api/projects', projectsRoute);
app.use('/api/services', servicesRoute);
app.use('/api/admin', adminRoute);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Jayvera Studios running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at        http://localhost:${PORT}/admin`);
});
