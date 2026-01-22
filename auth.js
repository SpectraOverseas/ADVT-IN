const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");
const loginButton = document.getElementById("loginButton");

const showError = (message) => {
  errorMessage.textContent = message;
};

const clearError = () => {
  errorMessage.textContent = "";
};

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return toHex(hashBuffer);
};

const fetchUsers = async () => {
  const response = await fetch("users.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load user data.");
  }
  return response.json();
};

const validateCredentials = async (email, password) => {
  const { users } = await fetchUsers();
  const hashedPassword = await hashPassword(password);
  const normalizedEmail = email.trim().toLowerCase();

  return users.some(
    (user) =>
      user.email.toLowerCase() === normalizedEmail &&
      user.password === hashedPassword
  );
};

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
      showError("Please enter both email and password.");
      return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    try {
      const isValid = await validateCredentials(email, password);
      if (!isValid) {
        showError("Invalid email or password.");
        return;
      }

      sessionStorage.setItem("authenticated", "true");
      window.location.href = "dashboard.html";
    } catch (error) {
      showError(error.message || "Login failed. Please try again.");
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Sign in";
    }
  });
}
