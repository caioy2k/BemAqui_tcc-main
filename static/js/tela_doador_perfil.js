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

  const form = document.getElementById("profileForm");
  const feedback = document.getElementById("profileFeedback");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const cpfInput = document.getElementById("cpf");
  const bairroInput = document.getElementById("bairro");
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
  const summaryBairro = document.getElementById("summaryBairro");
  const profileMainContact = document.getElementById("profileMainContact");
  const profileSubmissionCount = document.getElementById("profileSubmissionCount");
  const profileLastActivity = document.getElementById("profileLastActivity");
  const accountStatus = document.getElementById("accountStatus");
  const saveProfileBtn = document.getElementById("saveProfileBtn");

  let donorSubmissions = [];

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

  function getCurrentUser() {
    try {
      const storedUser = localStorage.getItem("bemaquiUser");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Erro ao ler usuário salvo:", error);
      return null;
    }
  }

  function getCurrentUserId() {
    const user = getCurrentUser();
    return user?._id || user?.id || null;
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

  function formatDateBR(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("pt-BR");
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
    const bairro = user.bairro || user.city || "";

    fullNameInput.value = fullName;
    emailInput.value = email;
    phoneInput.value = phone;
    cpfInput.value = cpf;
    bairroInput.value = bairro;

    profileDisplayName.textContent = fullName || "Doador";
    profileDisplayEmail.textContent = email || "email@exemplo.com";
    profileAvatar.textContent = getInitials(fullName);

    summaryName.textContent = fullName || "-";
    summaryEmail.textContent = email || "-";
    summaryPhone.textContent = phone || "-";
    summaryCpf.textContent = cpf || "-";
    summaryBairro.textContent = bairro || "Não informado";

    profileMainContact.textContent = phone || email || "-";
  }

  function updateStats(submissions) {
    profileSubmissionCount.textContent = submissions.length;

    if (submissions.length > 0) {
      const sorted = [...submissions].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      const latest = sorted[0];
      profileLastActivity.textContent = formatDateBR(latest.createdAt);

      const hasPending = submissions.some((item) => {
        const status = String(item.status || "").trim().toLowerCase();
        return status === "em análise" || status === "em analise";
      });

      if (hasPending) {
        accountStatus.textContent = "Perfil com doações em análise";
      } else {
        accountStatus.textContent = "Perfil vinculado a submissões";
      }
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
    const user = data.user || data;

    try {
      localStorage.setItem("bemaquiUser", JSON.stringify(user));
    } catch (error) {
      console.error("Erro ao salvar usuário no localStorage:", error);
    }

    return user;
  }

  async function loadDonorSubmissions() {
    const token = getToken();
    const donorId = getCurrentUserId();

    if (!token || !donorId) {
      donorSubmissions = [];
      updateStats(donorSubmissions);
      return;
    }

    const response = await fetch(`${API_URL}/donations?donorId=${encodeURIComponent(donorId)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await parseResponse(response);
    donorSubmissions = Array.isArray(data.donations) ? data.donations : [];
    updateStats(donorSubmissions);
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
    accountStatus.textContent = donorSubmissions.length
      ? "Perfil vinculado a submissões"
      : "Dados visuais atualizados";

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

  try {
    const user = await loadUserProfile();
    fillRealUserData(user);
    await loadDonorSubmissions();
  } catch (error) {
    console.error("Erro ao carregar perfil do doador:", error);

    profileDisplayName.textContent = "Doador";
    profileDisplayEmail.textContent = "Não foi possível carregar";
    profileAvatar.textContent = "D";
    summaryName.textContent = "-";
    summaryEmail.textContent = "-";
    summaryPhone.textContent = "-";
    summaryCpf.textContent = "-";
    summaryBairro.textContent = "Não informado";
    profileMainContact.textContent = "-";
    profileSubmissionCount.textContent = "0";
    profileLastActivity.textContent = "-";
    accountStatus.textContent = "Perfil indisponível";
    feedback.textContent = "Não foi possível carregar os dados do perfil.";
  }
});