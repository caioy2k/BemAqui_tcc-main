const API_BASE = "https://bemaqui-tcc-main.onrender.com/auth/me";
const token = localStorage.getItem("token");

let currentUserId = null;
let currentProfileData = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    alert("Você precisa estar logado para acessar o perfil.");
    window.location.href = "../login.html";
    return;
  }

  setupEvents();
  loadBeneficiaryProfile();
});

function setupEvents() {
  document.getElementById("editProfileBtn").addEventListener("click", openEditModal);
  document.getElementById("refreshProfileBtn").addEventListener("click", loadBeneficiaryProfile);
  document.getElementById("editProfileForm").addEventListener("submit", submitProfileUpdate);
}

async function loadBeneficiaryProfile() {
  try {
    setLoadingState();

    const userData = await fetchCurrentUser();
    currentUserId = userData._id || userData.id;

    if (!currentUserId) {
      throw new Error("ID do usuário não encontrado.");
    }

    const profileData = await fetchProfileDetails(currentUserId);
    currentProfileData = profileData;

    renderProfile(profileData);
  } catch (error) {
    console.error("Erro ao carregar perfil do beneficiário:", error);
    renderErrorState(error.message || "Erro ao carregar os dados do perfil.");
  }
}

async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Não foi possível identificar o usuário logado.");
  }

  const data = await response.json();
  return data.user || data;
}

async function fetchProfileDetails(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/details`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await safeJson(response);
    throw new Error(errorData.error || "Não foi possível carregar os detalhes do perfil.");
  }

  return response.json();
}

function renderProfile(data) {
  const user = data.user || {};
  const metrics = data.metrics || {};
  const history = Array.isArray(data.history) ? data.history : [];

  const displayName = user.name || "Usuário";
  const displayEmail = user.email || "-";
  const displayCpf = user.cpf || "-";
  const displayPhone = user.phone || "-";
  const displayRole = normalizeRole(user.role || "beneficiario");
  const displayStatus = normalizeStatus(user.status || "ativo");
  const displayCity = user.city || user.cidade || "Cidade não informada";

  document.getElementById("profileName").textContent = displayName;
  document.getElementById("profileSubtitle").textContent =
    "Acompanhe suas informações pessoais, saldo de moedas e histórico recente.";
  document.getElementById("profileAvatar").textContent = displayName.charAt(0).toUpperCase();
  document.getElementById("tagRole").textContent = displayRole;
  document.getElementById("tagStatus").textContent = displayStatus;
  document.getElementById("tagCity").textContent = displayCity;

  document.getElementById("infoName").textContent = displayName;
  document.getElementById("infoEmail").textContent = displayEmail;
  document.getElementById("infoCpf").textContent = displayCpf;
  document.getElementById("infoPhone").textContent = displayPhone;
  document.getElementById("infoCity").textContent = displayCity;
  document.getElementById("infoRole").textContent = displayRole;
  document.getElementById("infoCreatedAt").textContent = formatDate(user.createdAt);

  document.getElementById("accountStatus").textContent = displayStatus;
  document.getElementById("accountStatusText").textContent =
    displayStatus.toLowerCase() === "ativa"
      ? "Sua conta está apta para utilizar os recursos do sistema."
      : "Sua conta possui restrições ou está em revisão.";

  const balance = Number(metrics.walletBalance || 0);
  const totalTrades = Number(metrics.totalTrades || 0);
  const totalRescues = Number(metrics.totalRescues || 0);
  const lastActivity = metrics.lastActivity ? formatDateTime(metrics.lastActivity) : "-";

  document.getElementById("statBalance").textContent = balance;
  document.getElementById("statTrades").textContent = totalTrades;
  document.getElementById("statRescues").textContent = totalRescues;
  document.getElementById("statLastActivity").textContent = lastActivity;

  document.getElementById("walletSummary").textContent = `${balance} moedas`;
  document.getElementById("activitySummary").textContent =
    history.length > 0 ? `${history.length} movimentações encontradas` : "Sem movimentações recentes";

  renderHistory(history);
}

function renderHistory(history) {
  const activityList = document.getElementById("activityList");
  activityList.innerHTML = "";

  if (!history.length) {
    activityList.innerHTML = `
      <div class="empty-state">
        <h3>Sem histórico recente</h3>
        <p>Não foram encontradas movimentações para este usuário.</p>
      </div>
    `;
    return;
  }

  history.forEach(item => {
    const activity = document.createElement("div");
    activity.className = "activity-item";

    activity.innerHTML = `
      <div class="activity-left">
        <strong>${escapeHtml(item.title || "Movimentação registrada")}</strong>
        <p>${escapeHtml(item.description || "Sem descrição disponível.")}</p>
      </div>
      <div class="activity-meta">
        <span class="activity-date">${formatDateTime(item.date)}</span>
        <span class="activity-tag">${escapeHtml(item.tag || "Histórico")}</span>
      </div>
    `;

    activityList.appendChild(activity);
  });
}

function setLoadingState() {
  document.getElementById("profileName").textContent = "Carregando...";
  document.getElementById("activityList").innerHTML = `
    <div class="empty-state">
      <h3>Carregando histórico...</h3>
      <p>Aguarde enquanto buscamos as movimentações mais recentes.</p>
    </div>
  `;
}

function renderErrorState(message) {
  document.getElementById("profileName").textContent = "Erro ao carregar";
  document.getElementById("activityList").innerHTML = `
    <div class="empty-state">
      <h3>Não foi possível carregar o perfil</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function openEditModal() {
  if (!currentProfileData || !currentProfileData.user) {
    alert("Os dados do perfil ainda não foram carregados.");
    return;
  }

  const user = currentProfileData.user;

  document.getElementById("editName").value = user.name || "";
  document.getElementById("editEmail").value = user.email || "";
  document.getElementById("editPhone").value = user.phone || "";
  document.getElementById("editCity").value = user.city || user.cidade || "";

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
}

async function submitProfileUpdate(event) {
  event.preventDefault();

  if (!currentUserId) {
    alert("Usuário não identificado.");
    return;
  }

  const payload = {
    name: document.getElementById("editName").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    phone: document.getElementById("editPhone").value.trim(),
    city: document.getElementById("editCity").value.trim()
  };

  try {
    const response = await fetch(`${API_BASE}/api/users/${currentUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw new Error(data.error || "Erro ao atualizar perfil.");
    }

    closeEditModal();
    await loadBeneficiaryProfile();
    alert("Perfil atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    alert(error.message || "Erro ao atualizar perfil.");
  }
}

function normalizeRole(role) {
  const value = String(role).toLowerCase();

  if (value === "beneficiario" || value === "beneficiário") return "Beneficiário";
  if (value === "doador") return "Doador";
  if (value === "parceiro") return "Parceiro";
  if (value === "admin") return "Administrador";

  return role;
}

function normalizeStatus(status) {
  const value = String(status).toLowerCase();

  if (["ativo", "active", "ativa"].includes(value)) return "Ativa";
  if (["inativo", "inactive"].includes(value)) return "Inativa";
  if (["pendente", "pending"].includes(value)) return "Pendente";

  return status;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR") + " às " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}