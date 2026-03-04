const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  if (!form) {
    console.error("Formulário não encontrado!");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar token e usuário no localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("bemaquiUser", JSON.stringify(data.user));

        // ✅ REDIRECIONAMENTO BASEADO NO ROLE E BOOLEANOS
        if (data.user.isAdmin) {
          window.location.href = "../telas-admin/tela_admin_menu.html";
        } else if (data.user.isEmployee) {
          window.location.href = "../telas-admin/tela_admin_trades.html";
        } else if (data.user.role === "beneficiario") {
          window.location.href = "../telas-beneficiario/tela_beneficiario.html";
        } else if (data.user.role === "doador") {
          window.location.href = "../telas-doador/tela_doador.html";
        } else if (data.user.role === "parceiro") {
          window.location.href = "../telas-parceiro/tela_parceiro.html";
        } else {
          window.location.href = "../telas-beneficiario/tela_beneficiario.html"; // default
        }
      } else {
        alert(data.error || "Erro ao fazer login.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Não foi possível se conectar ao servidor.");
    }
  });
});
