const API_URL = "https://bemaqui-tcc-main.onrender.com";
const donorName = document.getElementById("donorName");

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function getCurrentUser() {
  try {
    const storedUser = localStorage.getItem("bemaquiUser");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Erro ao ler usuário do localStorage:", error);
    return null;
  }
}

function getCurrentUserId() {
  const user = getCurrentUser();
  return user?._id || user?.id || null;
}

function formatDateBR(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("pt-BR");
}

function formatLastUpdate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  const today = new Date();
  const isSameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isSameDay) return "Hoje";

  return date.toLocaleDateString("pt-BR");
}

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "em análise" || value === "em analise") return "Em análise";
  if (value === "aprovado" || value === "aprovada" || value === "aprovadas") return "Aprovado";
  if (value === "repassado" || value === "encaminhado" || value === "encaminhado para ong") return "Repassado";
  if (value === "recusado" || value === "rejeitado") return "Recusado";

  return status || "Em análise";
}

function getStatusClass(status) {
  const value = normalizeStatus(status).toLowerCase();

  if (value === "em análise") return "status-analise";
  if (value === "aprovado") return "status-aprovado";
  if (value === "repassado") return "status-repassado";
  return "status-recusado";
}

function getDestinationText(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Em análise") return "Em análise para estoque ou repasse";
  if (normalized === "Aprovado") return "Aprovado para estoque";
  if (normalized === "Repassado") return "Encaminhado para ONG parceira";
  if (normalized === "Recusado") return "Não aprovado para entrada no sistema";

  return "Status em atualização";
}

function mapSubmission(item) {
  return {
    id: item._id,
    title: item.itemName || "Item sem nome",
    details: `${item.quantity || 0} ${item.unit || ""} • Enviado em ${formatDateBR(item.createdAt)}`,
    destination: getDestinationText(item.status),
    status: normalizeStatus(item.status),
    createdAt: item.createdAt || null
  };
}

function buildDashboardData(donations) {
  const submissions = (donations || []).map(mapSubmission);

  const totalSubmissions = submissions.length;
  const pendingReview = submissions.filter(item => item.status === "Em análise").length;
  const approvedItems = submissions.filter(item => item.status === "Aprovado").length;

  const lastItem = [...(donations || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

  const lastUpdate = lastItem ? formatLastUpdate(lastItem.createdAt) : "-";

  return {
    totalSubmissions,
    pendingReview,
    approvedItems,
    lastUpdate,
    submissions: submissions.slice(0, 5)
  };
}

function renderDonorDashboard(data) {
  document.getElementById("totalSubmissions").textContent = data.totalSubmissions;
  document.getElementById("pendingReview").textContent = data.pendingReview;
  document.getElementById("approvedItems").textContent = data.approvedItems;
  document.getElementById("lastUpdate").textContent = data.lastUpdate;

  const generalStatus =
    data.pendingReview > 0
      ? `${data.pendingReview} item(ns) aguardando avaliação`
      : "Nenhum item pendente no momento";

  document.getElementById("generalStatus").textContent = generalStatus;

  const list = document.getElementById("recentSubmissions");
  list.innerHTML = "";

  if (!data.submissions || data.submissions.length === 0) {
    list.innerHTML = `
      <div class="submission-item empty">
        <div>
          <strong>Nenhuma submissão recente</strong>
          <p>Quando você cadastrar itens, eles aparecerão aqui para acompanhamento.</p>
        </div>
      </div>
    `;
    return;
  }

  data.submissions.forEach(item => {
    const div = document.createElement("div");
    div.className = "submission-item";
    div.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <p>${item.details}</p>
        <p>${item.destination}</p>
      </div>
      <div class="submission-meta">
        <span class="submission-status ${getStatusClass(item.status)}">${item.status}</span>
      </div>
    `;
    list.appendChild(div);
  });
}

async function loadDonorName() {
  const token = localStorage.getItem("token");

  if (!token) {
    donorName.textContent = "Doador";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível carregar o usuário.");
    }

    const user = data.user || data;
    donorName.textContent = user.name || "Doador";

    try {
      localStorage.setItem("bemaquiUser", JSON.stringify(user));
    } catch (error) {
      console.error("Erro ao atualizar bemaquiUser:", error);
    }
  } catch (error) {
    console.error("Erro ao carregar nome do doador:", error);
    donorName.textContent = "Doador";
  }
}

async function loadDonorDashboard() {
  try {
    const donorId = getCurrentUserId();

    if (!donorId) {
      renderDonorDashboard({
        totalSubmissions: 0,
        pendingReview: 0,
        approvedItems: 0,
        lastUpdate: "-",
        submissions: []
      });
      return;
    }

    const response = await fetch(`${API_URL}/donations?donorId=${encodeURIComponent(donorId)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar dashboard do doador.");
    }

    const donations = Array.isArray(data.donations) ? data.donations : [];
    const dashboardData = buildDashboardData(donations);
    renderDonorDashboard(dashboardData);
  } catch (error) {
    console.error("Erro ao carregar dashboard do doador:", error);

    renderDonorDashboard({
      totalSubmissions: 0,
      pendingReview: 0,
      approvedItems: 0,
      lastUpdate: "-",
      submissions: []
    });
  }
}

function setupNavigationButtons() {
  const buttons = document.querySelectorAll(".topbar-actions .btn");
  const heroButton = document.querySelector(".hero-text .btn.btn-primary");
  const viewAllButton = document.querySelector(".text-link");

  if (buttons[0]) {
    buttons[0].addEventListener("click", () => {
      window.location.href = "tela_doador_submissoes.html";
    });
  }

  if (buttons[1]) {
    buttons[1].addEventListener("click", () => {
      window.location.href = "tela_doacao.html";
    });
  }

  if (heroButton) {
    heroButton.addEventListener("click", () => {
      window.location.href = "tela_doacao.html";
    });
  }

  if (viewAllButton) {
    viewAllButton.addEventListener("click", () => {
      window.location.href = "tela_doador_submissoes.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigationButtons();
  await loadDonorName();
  await loadDonorDashboard();
});