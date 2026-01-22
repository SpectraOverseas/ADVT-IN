/*
  auth.js
  Shared authentication helpers for login and dashboard pages.
*/

const AUTH_ROUTES = {
  login: '/api/login',
  logout: '/api/logout',
  session: '/api/session'
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login.html') {
    window.location.replace('/login.html');
  }
};

const redirectToDashboard = () => {
  window.location.replace('/dashboard.html');
};

const showError = (message) => {
  const errorEl = document.getElementById('loginError');
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.style.display = 'block';
};

const clearError = () => {
  const errorEl = document.getElementById('loginError');
  if (!errorEl) return;
  errorEl.textContent = '';
  errorEl.style.display = 'none';
};

const handleLogin = () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value ?? '';

    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    try {
      const response = await fetch(AUTH_ROUTES.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        showError(result.message || 'Invalid email or password.');
        return;
      }

      redirectToDashboard();
    } catch (error) {
      console.error('Login failed', error);
      showError('Unable to sign in right now. Please try again.');
    }
  });
};

const handleLogout = () => {
  const button = document.getElementById('logoutBtn');
  if (!button) return;

  button.addEventListener('click', async () => {
    try {
      await fetch(AUTH_ROUTES.logout, { method: 'POST' });
    } catch (error) {
      console.error('Logout failed', error);
    }

    redirectToLogin();
  });
};

const enforceSession = async () => {
  try {
    const response = await fetch(AUTH_ROUTES.session, { cache: 'no-store' });
    if (!response.ok) {
      redirectToLogin();
      return;
    }

    const session = await response.json();
    if (!session?.authenticated) {
      redirectToLogin();
    }
  } catch (error) {
    console.error('Session check failed', error);
    redirectToLogin();
  }
};

const pageType = document.body?.dataset?.page;

if (pageType === 'login') {
  handleLogin();
} else if (pageType === 'dashboard') {
  enforceSession();
  handleLogout();
}
