// Shared auth helpers for the login page and dashboard logout button.
// Uses the server session to keep users authenticated.

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutButton = document.getElementById('logoutButton');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (loginError) loginError.classList.remove('show');

      const formData = new FormData(loginForm);
      const payload = {
        email: formData.get('email'),
        password: formData.get('password')
      };

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message = data?.message || 'Login failed. Please try again.';
          if (loginError) {
            loginError.textContent = message;
            loginError.classList.add('show');
          }
          return;
        }

        window.location.href = '/dashboard.html';
      } catch (error) {
        if (loginError) {
          loginError.textContent = 'Unable to reach the server. Please try again.';
          loginError.classList.add('show');
        }
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await fetch('/api/logout', { method: 'POST' });
      } finally {
        window.location.href = '/';
      }
    });
  }
});
