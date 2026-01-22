const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Load allowed users once at boot; each user has an email, salt, and passwordHash.
const usersPath = path.join(__dirname, 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

const requireAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.redirect('/');
};

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard.html');
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard.html');
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

// Protect dashboard access so direct URL hits require an authenticated session.
app.get('/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = users.find(
    (entry) => entry.email.toLowerCase() === String(email).toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const hash = crypto
    .createHash('sha256')
    .update(user.salt + password)
    .digest('hex');

  if (hash !== user.passwordHash) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  req.session.user = { email: user.email };
  return res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// Serve other static assets (e.g., auth.js) after the protected routes.
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
