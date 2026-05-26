const API_URL = "http://localhost:3000";

let selectedUserId = null;

document.addEventListener("DOMContentLoaded", () => {
  bindActions();
});

function bindActions() {
  const searchBtn = document.getElementById("searchBtn");
  const clearBtn = document.getElementById("clearBtn");
  const refreshUserBtn = document.getElementById("refreshUserBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearSearch);
  }

  if (refreshUserBtn) {
    refreshUserBtn.addEventListener("click", refreshSelectedUser);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSearch();
      }
    });
  }
}

function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken")
  );
}

function getAuthHeaders() {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

async function handleSearch() {
  const searchInput = document.getElementById("searchInput");
  const term = searchInput?.value.trim();

  if (!term) {
    renderResults([]);
    resetUserDetails();
    return;
  }

  try {
    setResultsLoading();

    const response = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(term)}`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Erro ao buscar usuários.");
    }

    const users = data.users || [];
    renderResults(users);

    if (users.length > 0) {
      loadUserDetails(users[0]._id);
    } else {
      resetUserDetails();
    }
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    renderResultsError(error.message);
    resetUserDetails();
  }
}

async function loadUserDetails(userId) {
  if (!userId) return;

  selectedUserId = userId;

  try {
    setProfileLoading();

    const response = await fetch(`${API_URL}/api/users/${userId}/details`, {
      method: "GET",
      headers: getAuthHeaders()
    });

    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Erro ao carregar detalhes do usuário.");
    }

    renderUserProfile(data.user || {});
    renderUserBalance(data.metrics || {});
    highlightSelectedUser(userId);
  } catch (error) {
    console.error("Erro ao carregar detalhes:", error);
    showDetailsError(error.message);
  }
}

function renderResults(users) {
  const resultsList = document.getElementById("resultsList");
  const resultsCount = document.getElementById("resultsCount");

  if (!resultsList || !resultsCount) return;

  resultsList.innerHTML = "";
  resultsCount.textContent = `${users.length} encontrado(s)`;

  if (!Array.isArray(users) || users.length === 0) {
    resultsList.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum usuário encontrado</h3>
        <p>Refine o termo pesquisado para localizar um cadastro.</p>
      </div>
    `;
    return;
  }

  users.forEach((user) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "result-item";
    button.dataset.id = user._id;

    button.innerHTML = `
      <div class="result-meta">
        <h3>${user.name || "Usuário sem nome"}</h3>
        <p>${user.email || "Email não informado"}</p>
        <p>${user.cpf || "CPF não informado"}</p>
      </div>
      <span class="badge ${normalizeBadge(user.status)}">${user.status || "Sem status"}</span>
    `;

    button.addEventListener("click", () => loadUserDetails(user._id));
    resultsList.appendChild(button);
  });
}

function renderUserProfile(user) {
  const profileContent = document.getElementById("profileContent");
  const profileStatus = document.getElementById("profileStatus");

  if (!profileContent || !profileStatus) return;

  profileStatus.className = `badge ${normalizeBadge(user.status)}`;
  profileStatus.textContent = user.status || "Sem status";

  profileContent.innerHTML = `
    <div class="profile-grid">
      <div class="info-box">
        <span>Nome</span>
        <strong>${user.name || "-"}</strong>
      </div>
      <div class="info-box">
        <span>Email</span>
        <strong>${user.email || "-"}</strong>
      </div>
      <div class="info-box">
        <span>CPF</span>
        <strong>${user.cpf || "-"}</strong>
      </div>
      <div class="info-box">
        <span>Telefone</span>
        <strong>${user.phone || "-"}</strong>
      </div>
      <div class="info-box">
        <span>Tipo</span>
        <strong>${user.role || "Usuário"}</strong>
      </div>
      <div class="info-box">
        <span>Cadastro</span>
        <strong>${formatDate(user.createdAt)}</strong>
      </div>
    </div>
  `;
}

function renderUserBalance(metrics) {
  setText("walletBalance", metrics.walletBalance ?? 0);
}

function highlightSelectedUser(userId) {
  const items = document.querySelectorAll(".result-item");
  items.forEach((item) => {
    item.classList.toggle("active", item.dataset.id === userId);
  });
}

function clearSearch() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.value = "";
  }

  selectedUserId = null;

  const resultsCount = document.getElementById("resultsCount");
  if (resultsCount) {
    resultsCount.textContent = "0 encontrados";
  }

  const resultsList = document.getElementById("resultsList");
  if (resultsList) {
    resultsList.innerHTML = `
      <div class="empty-state">
        <h3>Nenhuma busca realizada</h3>
        <p>Digite um nome, email ou CPF para localizar um usuário.</p>
      </div>
    `;
  }

  resetUserDetails();
}

function refreshSelectedUser() {
  if (selectedUserId) {
    loadUserDetails(selectedUserId);
  }
}

function resetUserDetails() {
  const profileContent = document.getElementById("profileContent");
  const profileStatus = document.getElementById("profileStatus");

  if (profileContent) {
    profileContent.innerHTML = `
      <div class="empty-state">
        <h3>Selecione um usuário</h3>
        <p>Os dados do perfil aparecerão aqui após a busca.</p>
      </div>
    `;
  }

  if (profileStatus) {
    profileStatus.className = "badge neutral";
    profileStatus.textContent = "Sem seleção";
  }

  setText("walletBalance", 0);
}

function setResultsLoading() {
  const resultsList = document.getElementById("resultsList");
  const resultsCount = document.getElementById("resultsCount");

  if (resultsList) {
    resultsList.innerHTML = `
      <div class="empty-state">
        <h3>Buscando usuários...</h3>
        <p>Aguarde enquanto os dados são carregados.</p>
      </div>
    `;
  }

  if (resultsCount) {
    resultsCount.textContent = "Buscando...";
  }
}

function setProfileLoading() {
  const profileContent = document.getElementById("profileContent");

  if (profileContent) {
    profileContent.innerHTML = `
      <div class="empty-state">
        <h3>Carregando perfil...</h3>
        <p>Os dados do usuário estão sendo consultados no banco.</p>
      </div>
    `;
  }

  setText("walletBalance", "...");
}

function renderResultsError(message) {
  const resultsList = document.getElementById("resultsList");
  const resultsCount = document.getElementById("resultsCount");

  if (resultsList) {
    resultsList.innerHTML = `
      <div class="empty-state">
        <h3>Erro na busca</h3>
        <p>${message || "Não foi possível consultar os usuários."}</p>
      </div>
    `;
  }

  if (resultsCount) {
    resultsCount.textContent = "Erro";
  }
}

function showDetailsError(message) {
  const profileContent = document.getElementById("profileContent");
  const profileStatus = document.getElementById("profileStatus");

  if (profileContent) {
    profileContent.innerHTML = `
      <div class="empty-state">
        <h3>Falha ao carregar perfil</h3>
        <p>${message || "Não foi possível consultar os dados do usuário."}</p>
      </div>
    `;
  }

  if (profileStatus) {
    profileStatus.className = "badge danger";
    profileStatus.textContent = "Erro";
  }

  setText("walletBalance", "Erro");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function normalizeBadge(status) {
  if (!status) return "neutral";

  const value = String(status).toLowerCase();

  if (["ativo", "active", "concluido", "concluído", "success"].includes(value)) {
    return "success";
  }

  if (["pendente", "warning"].includes(value)) {
    return "warning";
  }

  if (["bloqueado", "erro", "error", "cancelado", "danger"].includes(value)) {
    return "danger";
  }

  return "info";
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}