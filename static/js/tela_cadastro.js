const API_URL = "https://bemaqui-tcc-main.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastro-form");

  if (!form) {
    console.error("Formulário não encontrado!");
    return;
  }

  const cpfInput = document.getElementById("cpf");
  const phoneInput = document.getElementById("phone");

  if (cpfInput) {
    cpfInput.addEventListener("input", () => {
      cpfInput.value = formatCPF(cpfInput.value);
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhone(phoneInput.value);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;
    const cpf = document.getElementById("cpf")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const bairro = document.getElementById("bairro")?.value.trim() || "";
    const role = document.getElementById("role")?.value;

    if (!name || !email || !password || !confirmPassword || !cpf || !phone || !role) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      alert("CPF inválido. Digite os 11 números do CPF.");
      return;
    }

    if (cleanPhone.length < 10) {
      alert("Telefone inválido.");
      return;
    }

    const cadastroData = {
      name,
      email,
      password,
      cpf: cleanCpf,
      phone: cleanPhone,
      bairro,
      role
    };

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cadastroData)
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

function formatCPF(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  return numbers
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatPhone(value) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 10) {
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numbers
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}