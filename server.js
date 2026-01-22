const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-prod';
const USERS_PATH = path.join(__dirname, 'users.json');

app.use(express.json());

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

const hashPassword = (password, salt) =>
  crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');

const loadUsers = () => {
  const raw = fs.readFileSync(USERS_PATH, 'utf-8');
  return JSON.parse(raw);
};

const validateUser = (email, password) => {
  const users = loadUsers();
  const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return false;
  }

  const candidate = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.passwordHash, 'hex'));
};

const requireAuth = (req, res, next) => {
  if (req.session?.authenticated) {
    return next();
  }
  return res.redirect('/login.html');
};

app.get('/', (req, res) => {
  if (req.session?.authenticated) {
    return res.redirect('/dashboard.html');
  }
  return res.redirect('/login.html');
});

app.get('/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/index.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/users.json', (_req, res) => {
  res.status(403).json({ message: 'Forbidden' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (!validateUser(email, password)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  req.session.authenticated = true;
  req.session.email = email;
  return res.json({ authenticated: true });
});

app.get('/api/session', (req, res) => {
  res.json({
    authenticated: !!req.session?.authenticated,
    email: req.session?.email || null
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ loggedOut: true });
  });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
