const API_URL = "http://localhost:3000";

// Esperar o DOM carregar completamente
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastro-form");

  // Verificar se o form existe
  if (!form) {
    console.error("Formulário não encontrado!");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (!name || !email || !password || !role) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const cadastroData = {
      name,
      email,
      password,
      role,
    };

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cadastroData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Cadastro realizado com sucesso! Faça login agora.");
        window.location.href = "tela_login.html";
      } else {
        alert(data.error || "Erro ao cadastrar.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Não foi possível se conectar ao servidor.");
    }
  });
});
