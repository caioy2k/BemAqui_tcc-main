const API_URL = "http://localhost:3000";

const loginTab = document.getElementById("tab-login");
const registerTab = document.getElementById("tab-register");

const loginForm = document.getElementById("company-login-form");
const registerForm = document.getElementById("company-register-form");

const formMessage = document.getElementById("form-message");

const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");

const companyNameInput = document.getElementById("company-name");
const companyCnpjInput = document.getElementById("company-cnpj");
const companyPhoneInput = document.getElementById("company-phone");
const companyEmailInput = document.getElementById("company-email");
const companyPasswordInput = document.getElementById("company-password");
const companyConfirmPasswordInput = document.getElementById("company-confirm-password");

function showMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function hideMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message hidden";
}

function switchToLogin() {
  loginTab.classList.add("active");
  loginTab.setAttribute("aria-selected", "true");

  registerTab.classList.remove("active");
  registerTab.setAttribute("aria-selected", "false");

  loginForm.classList.add("active");
  loginForm.classList.remove("hidden");

  registerForm.classList.remove("active");
  registerForm.classList.add("hidden");

  hideMessage();
}

function switchToRegister() {
  registerTab.classList.add("active");
  registerTab.setAttribute("aria-selected", "true");

  loginTab.classList.remove("active");
  loginTab.setAttribute("aria-selected", "false");

  registerForm.classList.add("active");
  registerForm.classList.remove("hidden");

  loginForm.classList.remove("active");
  loginForm.classList.add("hidden");

  hideMessage();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCNPJ(value) {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function setLoading(button, isLoading, loadingText, defaultText) {
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : defaultText;
}

async function handleLogin(event) {
  event.preventDefault();
  hideMessage();

  const submitButton = loginForm.querySelector('button[type="submit"]');

  const email = loginEmailInput.value.trim().toLowerCase();
  const password = loginPasswordInput.value.trim();

  if (!email || !password) {
    showMessage("Preencha e-mail e senha.");
    return;
  }

  if (!validateEmail(email)) {
    showMessage("Digite um e-mail válido.");
    return;
  }

  try {
    setLoading(submitButton, true, "Entrando...", "Entrar");

    const response = await fetch(`${API_URL}/auth-company/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || data.message || "Não foi possível realizar o login.");
      return;
    }

    if (data.token) {
      localStorage.setItem("companyToken", data.token);
    }

    const companyData = data.company || data.user || data.companyData || { email };

    localStorage.setItem("bemaquiCompany", JSON.stringify(companyData));

    showMessage("Login realizado com sucesso!", "success");

    setTimeout(() => {
      window.location.href = "tela_parceiros_dashboard.html";
    }, 800);
  } catch (error) {
    console.error("Erro no login da empresa:", error);
    showMessage("Erro de conexão com o servidor.");
  } finally {
    setLoading(submitButton, false, "Entrando...", "Entrar");
  }
}

async function handleRegister(event) {
  event.preventDefault();
  hideMessage();

  const submitButton = registerForm.querySelector('button[type="submit"]');

  const name = companyNameInput.value.trim();
  const cnpj = onlyDigits(companyCnpjInput.value);
  const phone = onlyDigits(companyPhoneInput.value);
  const email = companyEmailInput.value.trim().toLowerCase();
  const password = companyPasswordInput.value.trim();
  const confirmPassword = companyConfirmPasswordInput.value.trim();

  if (!name || !cnpj || !phone || !email || !password || !confirmPassword) {
    showMessage("Preencha todos os campos obrigatórios.");
    return;
  }

  if (cnpj.length !== 14) {
    showMessage("Digite um CNPJ válido.");
    return;
  }

  if (phone.length < 10 || phone.length > 11) {
    showMessage("Digite um telefone válido.");
    return;
  }

  if (!validateEmail(email)) {
    showMessage("Digite um e-mail válido.");
    return;
  }

  if (password.length < 6) {
    showMessage("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("As senhas não coincidem.");
    return;
  }

  try {
    setLoading(submitButton, true, "Cadastrando...", "Cadastrar empresa");

    const response = await fetch(`${API_URL}/auth-company/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        cnpj,
        phone,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || data.message || "Não foi possível cadastrar a empresa.");
      return;
    }

    showMessage("Empresa cadastrada com sucesso! Faça login para continuar.", "success");
    registerForm.reset();
    switchToLogin();
  } catch (error) {
    console.error("Erro no cadastro da empresa:", error);
    showMessage("Erro de conexão com o servidor.");
  } finally {
    setLoading(submitButton, false, "Cadastrando...", "Cadastrar empresa");
  }
}

if (loginTab && registerTab) {
  loginTab.addEventListener("click", switchToLogin);
  registerTab.addEventListener("click", switchToRegister);
}

if (companyCnpjInput) {
  companyCnpjInput.addEventListener("input", (e) => {
    e.target.value = formatCNPJ(e.target.value);
  });
}

if (companyPhoneInput) {
  companyPhoneInput.addEventListener("input", (e) => {
    e.target.value = formatPhone(e.target.value);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
}

if (registerForm) {
  registerForm.addEventListener("submit", handleRegister);
}