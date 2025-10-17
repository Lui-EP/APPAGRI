// ===== LOGIN.JS =====

// ===== MODO OSCURO LOGIN =====
document.addEventListener("DOMContentLoaded", () => {
  const toggleLoginTheme = document.getElementById("login-theme-toggle");
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    body.classList.add("dark-mode");
    toggleLoginTheme.textContent = "🌞 Modo Claro";
  }

  toggleLoginTheme.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    toggleLoginTheme.textContent = isDark ? "🌞 Modo Claro" : "🌓 Modo Oscuro";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});

// ===== AUTENTICACIÓN =====
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "admin123") {
    localStorage.setItem("usuarioActivo", username);
    window.location.href = "principal.html";
  } else {
    alert("Usuario o contraseña incorrectos");
  }
});
