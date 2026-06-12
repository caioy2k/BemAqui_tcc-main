const API_URL = "https://bemaqui-tcc-main.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");

  if (!form) {
    console.error("Formulário não encontrado.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || data.message || "Erro ao fazer login.");
        return;
      }

      if (!data?.token || !data?.user) {
        alert("Resposta de login inválida.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("bemaquiUser", JSON.stringify(data.user));

      if (data.user.isAdmin) {
        window.location.href = "/tela_admin_dashboard.html";
      } else if (data.user.isEmployee) {
        window.location.href = "/tela_funcionario_dashboard.html";
      } else if (data.user.role === "beneficiario") {
        window.location.href = "/tela_beneficiario.html";
      } else if (data.user.role === "doador") {
        window.location.href = "/tela_doador.html";
      } else if (data.user.role === "parceiro") {
        window.location.href = "/tela_parceiros.html";
      } else {
        window.location.href = "/tela_beneficiario.html";
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Não foi possível se conectar ao servidor.");
    }
  });
});