const API_URL = "https://bemaqui-tcc-main.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const defaultProfileExtras = {
    bio: "Doador cadastrado na plataforma BemAqui.",
    preferences: {
      emailUpdates: true,
      statusAlerts: true,
      news: false
    }
  };

  const savedExtras =
    JSON.parse(localStorage.getItem("bemaquiDonorProfileExtras")) || defaultProfileExtras;

  const savedSubmissions =
    JSON.parse(localStorage.getItem("bemaquiSubmissions")) || [];

  const form = document.getElementById("profileForm");
  const feedback = document.getElementById("profileFeedback");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const cpfInput = document.getElementById("cpf");
  const cityInput = document.getElementById("city");
  const bioInput = document.getElementById("bio");

  const prefEmail = document.getElementById("prefEmail");
  const prefStatus = document.getElementById("prefStatus");
  const prefNews = document.getElementById("prefNews");

  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileDisplayEmail = document.getElementById("profileDisplayEmail");
  const profileAvatar = document.getElementById("profileAvatar");
  const summaryName = document.getElementById("summaryName");
  const summaryEmail = document.getElementById("summaryEmail");
  const summaryPhone = document.getElementById("summaryPhone");
  const summaryCpf = document.getElementById("summaryCpf");
  const summaryCity = document.getElementById("summaryCity");
  const profileMainContact = document.getElementById("profileMainContact");
  const profileSubmissionCount = document.getElementById("profileSubmissionCount");
  const profileLastActivity = document.getElementById("profileLastActivity");
  const accountStatus = document.getElementById("accountStatus");
  const saveProfileBtn = document.getElementById("saveProfileBtn");

  function getInitials(name) {
    if (!name) return "D";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  function formatCPF(cpf) {
    const numbers = String(cpf || "").replace(/\D/g, "").slice(0, 11);

    return numbers
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  function formatPhone(phone) {
    const numbers = String(phone || "").replace(/\D/g, "").slice(0, 11);

    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  async function parseResponse(response) {
    const text = await response.text();

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      if (text.trim().startsWith("<")) {
        throw new Error("A API retornou HTML em vez de JSON. Verifique a rota do perfil no backend.");
      }
      throw new Error("Resposta inválida do servidor.");
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || "Erro na requisição.");
    }

    return data;
  }

  function fillExtras(extras) {
    bioInput.value = extras.bio || "";
    prefEmail.checked = !!extras.preferences?.emailUpdates;
    prefStatus.checked = !!extras.preferences?.statusAlerts;
    prefNews.checked = !!extras.preferences?.news;
  }

  function fillRealUserData(user) {
    const fullName = user.name || "";
    const email = user.email || "";
    const phone = formatPhone(user.phone || "");
    const cpf = formatCPF(user.cpf || "");
    const city = user.city || user.bairro || "";

    fullNameInput.value = fullName;
    emailInput.value = email;
    phoneInput.value = phone;
    cpfInput.value = cpf;
    cityInput.value = city;

    profileDisplayName.textContent = fullName || "Doador";
    profileDisplayEmail.textContent = email || "email@exemplo.com";
    profileAvatar.textContent = getInitials(fullName);

    summaryName.textContent = fullName || "-";
    summaryEmail.textContent = email || "-";
    summaryPhone.textContent = phone || "-";
    summaryCpf.textContent = cpf || "-";
    summaryCity.textContent = city || "Não informada";

    profileMainContact.textContent = phone || "-";
  }

  function updateStats() {
    profileSubmissionCount.textContent = savedSubmissions.length;

    if (savedSubmissions.length > 0) {
      profileLastActivity.textContent = savedSubmissions[0].date || "Recente";
      accountStatus.textContent = "Perfil vinculado a submissões";
    } else {
      profileLastActivity.textContent = "Sem envios";
      accountStatus.textContent = "Perfil atualizado";
    }
  }

  async function loadUserProfile() {
    const token = getToken();

    if (!token) {
      throw new Error("Usuário não autenticado.");
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await parseResponse(response);
    return data.user || data;
  }

  function saveExtrasOnly() {
    const extras = {
      bio: bioInput.value.trim(),
      preferences: {
        emailUpdates: prefEmail.checked,
        statusAlerts: prefStatus.checked,
        news: prefNews.checked
      }
    };

    localStorage.setItem("bemaquiDonorProfileExtras", JSON.stringify(extras));
    feedback.textContent = "Preferências e observação salvas localmente.";
    accountStatus.textContent = "Dados visuais atualizados";

    setTimeout(() => {
      feedback.textContent = "";
    }, 2500);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveExtrasOnly();
  });

  saveProfileBtn.addEventListener("click", (event) => {
    event.preventDefault();
    saveExtrasOnly();
  });

  fillExtras(savedExtras);
  updateStats();

  try {
    const user = await loadUserProfile();
    fillRealUserData(user);
  } catch (error) {
    console.error("Erro ao carregar perfil do doador:", error);

    profileDisplayName.textContent = "Doador";
    profileDisplayEmail.textContent = "Não foi possível carregar";
    profileAvatar.textContent = "D";
    summaryName.textContent = "-";
    summaryEmail.textContent = "-";
    summaryPhone.textContent = "-";
    summaryCpf.textContent = "-";
    summaryCity.textContent = "Não informada";
    profileMainContact.textContent = "-";
    accountStatus.textContent = "Perfil indisponível";
    feedback.textContent = "Não foi possível carregar os dados do perfil.";
  }
});