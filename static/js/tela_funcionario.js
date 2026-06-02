const API_URL = "http://localhost:3000";

let allTrades = [];
let filteredTrades = [];
let currentTradeId = null;
let currentTradeData = null;

const tbody = document.querySelector("#tradesTable tbody");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const tradeModal = document.getElementById("trade-modal");
const tradeDetailsDiv = document.getElementById("trade-details");
const modalActions = document.getElementById("modal-actions");

function getAuthHeader() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    throw new Error("Token não encontrado");
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getStatusClass(status) {
  const normalized = normalizeText(status || "pendente");

  if (normalized === "aprovado") return "status-aprovado";
  if (normalized === "concluido") return "status-concluido";
  if (normalized === "recusado") return "status-recusado";
  return "status-pendente";
}

function getStatusLabel(status) {
  const normalized = normalizeText(status || "pendente");

  if (normalized === "aprovado") return "Aprovado";
  if (normalized === "concluido") return "Concluído";
  if (normalized === "recusado") return "Recusado";
  return "Pendente";
}

function formatList(items, nameKey) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Nenhum";
  }

  return items
    .map((item) => `${item.quantity || 0}x ${item[nameKey] || "Item"}`)
    .join(", ");
}

function formatDate(dateValue) {
  if (!dateValue) return "Não informado";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Não informado";

  return date.toLocaleString("pt-BR");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderEmptyState(show) {
  if (!emptyState) return;
  emptyState.classList.toggle("hidden", !show);
}

function renderTradesTable(trades) {
  if (!tbody) {
    console.error("Tabela não encontrada.");
    return;
  }

  tbody.innerHTML = "";

  if (!Array.isArray(trades) || trades.length === 0) {
    renderEmptyState(true);
    return;
  }

  renderEmptyState(false);

  trades.forEach((trade) => {
    const row = tbody.insertRow();

    const beneficiaryName = trade.beneficiaryId?.name || "Desconhecido";
    const tradeId = trade._id || "";
    const offered = formatList(trade.recyclablesOffered, "recyclableName");
    const requested = formatList(trade.benefitsRequested, "benefitName");
    const points = trade.totalPointsOffered || 0;
    const surplus = trade.coinsSurplus || 0;
    const status = trade.status || "pendente";

    row.innerHTML = `
      <td>
        <div class="cell-strong">${escapeHtml(beneficiaryName)}</div>
        <div class="cell-muted">${escapeHtml(tradeId)}</div>
      </td>
      <td>
        <div class="cell-muted">${escapeHtml(offered)}</div>
      </td>
      <td>
        <div class="cell-muted">${escapeHtml(requested)}</div>
      </td>
      <td>
        <div class="cell-strong">${escapeHtml(points)}</div>
      </td>
      <td>
        <div class="cell-strong">${escapeHtml(surplus)}</div>
      </td>
      <td>
        <span class="status-badge ${getStatusClass(status)}">${getStatusLabel(status)}</span>
      </td>
      <td class="actions-cell">
  <div class="table-actions">
    

    <button
      class="icon-btn approve"
      type="button"
      title="Aprovar troca"
      aria-label="Aprovar troca"
      onclick="approveTrade('${escapeHtml(tradeId)}')"
    >
      <span class="btn-icon">✓</span>
      <span class="btn-label">Aprovar</span>
    </button>

    <button
      class="icon-btn reject"
      type="button"
      title="Recusar troca"
      aria-label="Recusar troca"
      onclick="rejectTrade('${escapeHtml(tradeId)}')"
    >
      <span class="btn-icon">✕</span>
      <span class="btn-label">Recusar</span>
    </button>
  </div>
</td>
    `;
  });
}

function applyFilters() {
  const searchTerm = normalizeText(searchInput?.value || "");
  const selectedStatus = normalizeText(statusFilter?.value || "");

  filteredTrades = allTrades.filter((trade) => {
    const beneficiaryName = normalizeText(trade.beneficiaryId?.name || "");
    const tradeId = normalizeText(trade._id || "");
    const offered = normalizeText(formatList(trade.recyclablesOffered, "recyclableName"));
    const requested = normalizeText(formatList(trade.benefitsRequested, "benefitName"));
    const status = normalizeText(trade.status || "pendente");

    const matchesSearch =
      !searchTerm ||
      beneficiaryName.includes(searchTerm) ||
      tradeId.includes(searchTerm) ||
      offered.includes(searchTerm) ||
      requested.includes(searchTerm);

    const matchesStatus = !selectedStatus || status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  renderTradesTable(filteredTrades);
}

async function loadTrades() {
  try {
    const response = await fetch(`${API_URL}/trades`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    allTrades = Array.isArray(data?.trades) ? data.trades : Array.isArray(data) ? data : [];
    filteredTrades = [...allTrades];
    applyFilters();
  } catch (error) {
    console.error("Erro ao carregar trades:", error);
    alert("Erro ao carregar trocas: " + error.message);
  }
}

function buildDetailItems(items, labelKey) {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="detail-item"><span>Itens</span><span>Nenhum item informado</span></div>`;
  }

  return items
    .map((item) => {
      const itemName = item[labelKey] || "Item";
      const quantity = item.quantity || 0;
      return `
        <div class="detail-item">
          <span>${escapeHtml(itemName)}</span>
          <span>${escapeHtml(quantity)}x</span>
        </div>
      `;
    })
    .join("");
}

function renderTradeModal(trade) {
  const beneficiaryName = trade.beneficiaryId?.name || "Desconhecido";
  const beneficiaryEmail = trade.beneficiaryId?.email || "Não informado";
  const beneficiaryCpf = trade.beneficiaryId?.cpf || "Não informado";
  const status = trade.status || "pendente";
  const offeredPoints = trade.totalPointsOffered || 0;
  const coinsSurplus = trade.coinsSurplus || 0;
  const createdAt = formatDate(trade.createdAt);
  const updatedAt = formatDate(trade.updatedAt);

  tradeDetailsDiv.innerHTML = `
    <div class="detail-section">
      <h3>Informações da troca</h3>
      <div class="detail-row">
        <div class="detail-row-item">
          <span>ID da troca</span>
          <strong>${escapeHtml(trade._id || "Não informado")}</strong>
        </div>
        <div class="detail-row-item">
          <span>Status</span>
          <strong>
            <span class="status-badge ${getStatusClass(status)}">${getStatusLabel(status)}</span>
          </strong>
        </div>
        <div class="detail-row-item">
          <span>Pontos recicláveis</span>
          <strong>${escapeHtml(offeredPoints)}</strong>
        </div>
        <div class="detail-row-item">
          <span>Moedas sobra</span>
          <strong>${escapeHtml(coinsSurplus)}</strong>
        </div>
        <div class="detail-row-item">
          <span>Criada em</span>
          <strong>${escapeHtml(createdAt)}</strong>
        </div>
        <div class="detail-row-item">
          <span>Atualizada em</span>
          <strong>${escapeHtml(updatedAt)}</strong>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Beneficiário</h3>
      <div class="detail-row">
        <div class="detail-row-item">
          <span>Nome</span>
          <strong>${escapeHtml(beneficiaryName)}</strong>
        </div>
        <div class="detail-row-item">
          <span>E-mail</span>
          <strong>${escapeHtml(beneficiaryEmail)}</strong>
        </div>
        <div class="detail-row-item">
          <span>CPF</span>
          <strong>${escapeHtml(beneficiaryCpf)}</strong>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Recicláveis oferecidos</h3>
      ${buildDetailItems(trade.recyclablesOffered, "recyclableName")}
    </div>

    <div class="detail-section">
      <h3>Benefícios pedidos</h3>
      ${buildDetailItems(trade.benefitsRequested, "benefitName")}
    </div>
  `;
}

function showModal() {
  if (!tradeModal) return;
  tradeModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeTradeModal() {
  if (!tradeModal) return;
  tradeModal.classList.add("hidden");
  document.body.style.overflow = "";
  currentTradeId = null;
  currentTradeData = null;
}

function findTradeById(tradeId) {
  return allTrades.find((trade) => String(trade._id) === String(tradeId));
}

function openTradeModal(tradeId) {
  const trade = findTradeById(tradeId);

  if (!trade) {
    alert("Não foi possível localizar os dados da troca.");
    return;
  }

  currentTradeId = tradeId;
  currentTradeData = trade;

  renderTradeModal(trade);

  if (modalActions) {
    const normalizedStatus = normalizeText(trade.status || "pendente");
    const showDecisionButtons = normalizedStatus === "pendente";
    modalActions.classList.toggle("hidden", !showDecisionButtons);
  }

  showModal();
}

async function approveTrade(tradeIdParam) {
  const tradeId = tradeIdParam || currentTradeId;

  if (!tradeId) {
    alert("Troca não identificada.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/trades/${tradeId}/approve`, {
      method: "PATCH",
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Erro ao aprovar troca.");
    }

    alert("✅ Troca aprovada com sucesso!");
    closeTradeModal();
    await loadTrades();
  } catch (error) {
    console.error("Erro ao aprovar:", error);
    alert(error.message || "Erro de conexão ao aprovar.");
  }
}

async function rejectTrade(tradeIdParam) {
  const tradeId = tradeIdParam || currentTradeId;

  if (!tradeId) {
    alert("Troca não identificada.");
    return;
  }

  const reason = prompt("Motivo da recusa:") || "";

  try {
    const response = await fetch(`${API_URL}/trades/${tradeId}/reject`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error("Erro ao recusar troca.");
    }

    alert("❌ Troca recusada.");
    closeTradeModal();
    await loadTrades();
  } catch (error) {
    console.error("Erro ao recusar:", error);
    alert(error.message || "Erro de conexão ao recusar.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loadBtn = document.getElementById("loadTradesBtn");
  const loadBtnSecondary = document.getElementById("loadTradesBtnSecondary");

  if (loadBtn) {
    loadBtn.addEventListener("click", loadTrades);
  }

  if (loadBtnSecondary) {
    loadBtnSecondary.addEventListener("click", loadTrades);
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }

  if (tradeModal) {
    tradeModal.addEventListener("click", (event) => {
      if (event.target === tradeModal) {
        closeTradeModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tradeModal && !tradeModal.classList.contains("hidden")) {
      closeTradeModal();
    }
  });

  loadTrades();
});

window.openTradeModal = openTradeModal;
window.closeTradeModal = closeTradeModal;
window.approveTrade = approveTrade;
window.rejectTrade = rejectTrade;