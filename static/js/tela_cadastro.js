const API_URL = "https://bemaqui-tcc-main.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastro-form");

  if (!form) {
    console.error("Formulário não encontrado!");
    return;
  }

  const cpfInput = document.getElementById("cpf");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");

  // if (cpfInput) {
  //   cpfInput.addEventListener("input", () => {
  //     cpfInput.value = formatCPF(cpfInput.value);
  //   });
  // }

  // if (phoneInput) {
  //   phoneInput.addEventListener("input", () => {
  //     phoneInput.value = formatPhone(phoneInput.value);
  //   });
  // }

  // if (emailInput) {
  //   emailInput.addEventListener("blur", async () => {
  //     const email = emailInput.value.trim();
  //     const cpf = document.getElementById("cpf")?.value.trim().replace(/\D/g, "") || "";

  //     if (!email) return;

  //     try {
  //       const result = await checkUserExists(email, cpf);

  //       if (result.emailExists) {
  //         alert("Este e-mail já está cadastrado.");
  //         emailInput.focus();
  //       }
  //     } catch (error) {
  //       console.error("Erro ao verificar e-mail:", error);
  //     }
  //   });
  // }

  // if (cpfInput) {
  //   cpfInput.addEventListener("blur", async () => {
  //     const email = document.getElementById("email")?.value.trim() || "";
  //     const cpf = cpfInput.value.trim().replace(/\D/g, "");

  //     if (!cpf) return;

  //     if (!isValidCPF(cpf)) {
  //       alert("CPF inválido.");
  //       cpfInput.focus();
  //       return;
  //     }

  //     try {
  //       const result = await checkUserExists(email, cpf);

  //       if (result.cpfExists) {
  //         alert("Este CPF já está cadastrado.");
  //         cpfInput.focus();
  //       }
  //     } catch (error) {
  //       console.error("Erro ao verificar CPF:", error);
  //     }
  //   });
  // }

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

    if (!isValidCPF(cleanCpf)) {
      alert("CPF inválido.");
      return;
    }

    if (cleanPhone.length < 10) {
      alert("Telefone inválido.");
      return;
    }

    try {
      const existsResult = await checkUserExists(email, cleanCpf);

      if (existsResult.emailExists) {
        alert("Este e-mail já está cadastrado.");
        return;
      }

      if (existsResult.cpfExists) {
        alert("Este CPF já está cadastrado.");
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar duplicidade:", error);
      alert("Não foi possível validar e-mail e CPF antes do cadastro.");
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
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(cadastroData)
      });

      const data = await parseResponse(response);

      alert(data.message || "Cadastro realizado com sucesso! Faça login agora.");
      window.location.href = "tela_login.html";
    } catch (error) {
      console.error("Erro:", error);
      alert(error.message || "Não foi possível se conectar ao servidor.");
    }
  });
});

async function checkUserExists(email, cpf) {
  const response = await fetch(`${API_URL}/auth/check-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ email, cpf })
  });

  return await parseResponse(response);
}

async function parseResponse(response) {
  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    if (text.trim().startsWith("<")) {
      throw new Error("A API retornou HTML em vez de JSON. Verifique a rota no backend.");
    }
    throw new Error("Resposta inválida do servidor.");
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || "Erro na requisição.");
  }

  return data;
}

function isValidCPF(cpf) {
  const cleanCpf = String(cpf).replace(/\D/g, "");

  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cleanCpf.charAt(i)) * (10 - i);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;

  if (firstDigit !== Number(cleanCpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cleanCpf.charAt(i)) * (11 - i);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  if (secondDigit !== Number(cleanCpf.charAt(10))) return false;

  return true;
}

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