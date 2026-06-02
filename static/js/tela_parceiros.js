const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("company-login-form");
const registerForm = document.getElementById("company-register-form");
const messageBox = document.getElementById("form-message");

tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));

function switchTab(type) {
  hideMessage();

  const isLogin = type === "login";

  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);

  tabLogin.setAttribute("aria-selected", isLogin);
  tabRegister.setAttribute("aria-selected", !isLogin);

  loginForm.classList.toggle("hidden", !isLogin);
  loginForm.classList.toggle("active", isLogin);

  registerForm.classList.toggle("hidden", isLogin);
  registerForm.classList.toggle("active", !isLogin);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showMessage("Preencha e-mail e senha.", "error");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/auth/company/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível realizar o login.");
    }

    showMessage("Login realizado com sucesso.", "success");

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    setTimeout(() => {
      window.location.href = "./tela_empresa_menu.html";
    }, 1200);
  } catch (error) {
    showMessage(error.message || "Erro ao fazer login.", "error");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage();

  const name = document.getElementById("company-name").value.trim();
  const cnpj = document.getElementById("company-cnpj").value.trim();
  const email = document.getElementById("company-email").value.trim();
  const password = document.getElementById("company-password").value;
  const confirmPassword = document.getElementById("company-confirm-password").value;

  if (!name || !cnpj || !email || !password || !confirmPassword) {
    showMessage("Preencha todos os campos do cadastro.", "error");
    return;
  }

  if (password.length < 6) {
    showMessage("A senha deve ter pelo menos 6 caracteres.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("As senhas não coincidem.", "error");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/auth/company/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        cnpj,
        email,
        password,
        role: "empresa"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível cadastrar a empresa.");
    }

    showMessage("Empresa cadastrada com sucesso. Agora faça login.", "success");
    registerForm.reset();

    setTimeout(() => {
      switchTab("login");
    }, 1000);
  } catch (error) {
    showMessage(error.message || "Erro ao cadastrar empresa.", "error");
  }
});

function showMessage(message, type) {
  messageBox.textContent = message;
  messageBox.className = `form-message ${type}`;
}

function hideMessage() {
  messageBox.textContent = "";
  messageBox.className = "form-message hidden";
}