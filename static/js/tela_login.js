const API_URL = "https://bemaqui-tcc-main.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form =
    document.getElementById("login-form") ||
    document.getElementById("loginForm") ||
    document.querySelector("form");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const submitButton =
    document.querySelector(".login-btn") ||
    document.querySelector(".btn-login") ||
    form?.querySelector('button[type="submit"]');

  if (!form) {
    console.error("Formulário não encontrado!");
    return;
  }

  if (!emailInput || !passwordInput) {
    console.error("Campos de e-mail ou senha não encontrados!");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    let originalButtonHTML = "";

    try {
      if (submitButton) {
        originalButtonHTML = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Entrando...`;
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("bemaquiUser", JSON.stringify(data.user));

        if (data.user.isAdmin) {
          window.location.href = "tela_admin_menu.html";
        } else if (data.user.isEmployee) {
          window.location.href = "tela_admin_trades.html";
        } else if (data.user.role === "beneficiario") {
          window.location.href = "../templates/tela_beneficiario.html";
        } else if (data.user.role === "doador") {
          window.location.href = "tela_doador.html";
        } else if (data.user.role === "parceiro") {
          window.location.href = "../telas-parceiro/tela_parceiro.html";
        } else {
          window.location.href = "../telas-beneficiario/tela_beneficiario.html";
        }
      } else {
        alert(data.error || data.message || "Erro ao fazer login.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Não foi possível se conectar ao servidor.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonHTML || "Entrar";
      }
    }
  });
});