const API_URL = "https://bemaqui-tcc-main.onrender.com";

const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const detailsContent = document.getElementById("details-content");

const currentStatusLabel = document.getElementById("current-status-label");
const currentStatusDescription = document.getElementById("current-status-description");

const orderCode = document.getElementById("order-code");
const purchaseTimeline = document.getElementById("purchaseTimeline");

const summaryTradeId = document.getElementById("summary-trade-id");
const summaryDate = document.getElementById("summary-date");
const summaryTotalCost = document.getElementById("summary-total-cost");
const summaryWalletUsed = document.getElementById("summary-wallet-used");
const summaryWalletBalance = document.getElementById("summary-wallet-balance");

const pickupName = document.getElementById("pickup-name");
const pickupAddress = document.getElementById("pickup-address");
const pickupNote = document.getElementById("pickup-note");

const recyclablesList = document.getElementById("recyclables-list");
const benefitsList = document.getElementById("benefits-list");
const recyclablesTotalPoints = document.getElementById("recyclables-total-points");
const benefitsTotalPoints = document.getElementById("benefits-total-points");

const financialWalletUsed = document.getElementById("financial-wallet-used");
const financialRecyclingUsed = document.getElementById("financial-recycling-used");
const financialSurplus = document.getElementById("financial-surplus");
const financialWalletBalance = document.getElementById("financial-wallet-balance");

const STATUS_FLOW = [
  {
    key: "requested",
    title: "Troca solicitada",
    description: "Seu pedido foi criado com sucesso no sistema."
  },
  {
    key: "analyzing",
    title: "Em análise",
    description: "A equipe está conferindo os itens e a disponibilidade para retirada."
  },
  {
    key: "separating",
    title: "Separando itens",
    description: "Os benefícios estão sendo preparados para retirada."
  },
  {
    key: "ready",
    title: "Pronto para retirada",
    description: "Sua troca já pode ser retirada no ponto informado."
  },
  {
    key: "picked_up",
    title: "Retirado",
    description: "Etapa final após a retirada dos itens pelo beneficiário."
  }
];

function showLoading() {
  loadingState.classList.remove("hidden");
  emptyState.classList.add("hidden");
  detailsContent.classList.add("hidden");
}

function showEmpty() {
  loadingState.classList.add("hidden");
  emptyState.classList.remove("hidden");
  detailsContent.classList.add("hidden");
}

function showDetails() {
  loadingState.classList.add("hidden");
  emptyState.classList.add("hidden");
  detailsContent.classList.remove("hidden");
}

function formatDate(dateValue) {
  if (!dateValue) return "---";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "---";
  return date.toLocaleDateString("pt-BR") + " - " + date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(dateValue) {
  if (!dateValue) return "---";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "---";
  return date.toLocaleDateString("pt-BR");
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase().trim();

  if (["solicitada", "requested", "pending", "pendente"].includes(value)) return "requested";
  if (["em análise", "em analise", "analyzing", "analysis"].includes(value)) return "analyzing";
  if (["separando", "separating", "preparing"].includes(value)) return "separating";
  if (["pronto", "ready", "ready_for_pickup", "pronto para retirada"].includes(value)) return "ready";
  if (["retirado", "picked_up", "pickedup", "completed", "concluida", "concluída"].includes(value)) return "picked_up";

  return "requested";
}

function getStatusText(statusKey) {
  const statusMap = {
    requested: "Troca solicitada",
    analyzing: "Em análise",
    separating: "Separando itens",
    ready: "Pronto para retirada",
    picked_up: "Retirado",
  };

  return statusMap[statusKey] || "Troca solicitada";
}

function getStatusDescription(statusKey) {
  const item = STATUS_FLOW.find((step) => step.key === statusKey);
  return item?.description || "Acompanhe os detalhes da sua troca.";
}

function renderTimeline(trade) {
  const currentStatus = normalizeStatus(trade.status);
  const currentIndex = STATUS_FLOW.findIndex((step) => step.key === currentStatus);

  purchaseTimeline.innerHTML = STATUS_FLOW.map((step, index) => {
    let className = "timeline-item";

    if (index < currentIndex) className += " completed";
    if (index === currentIndex) className += " active";

    let stepDate = "Aguardando atualização";

    if (index === 0 && trade.createdAt) {
      stepDate = formatDate(trade.createdAt);
    }

    if (trade.statusHistory && Array.isArray(trade.statusHistory)) {
      const historyItem = trade.statusHistory.find(
        (entry) => normalizeStatus(entry.status) === step.key
      );
      if (historyItem?.date) {
        stepDate = formatDate(historyItem.date);
      }
    }

    return `
      <div class="${className}">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <h3>${step.title}</h3>
          <p>${step.description}</p>
          <span>${stepDate}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderBenefits(benefits) {
  if (!benefits || benefits.length === 0) {
    benefitsList.innerHTML = '<p class="placeholder">Nenhum benefício informado.</p>';
    return;
  }

  benefitsList.innerHTML = benefits.map((item) => {
    const emoji = item.benefitEmoji || item.emoji || "🎁";
    const name = item.benefitName || item.name || "Benefício";
    const quantity = item.benefitQuantity || item.quantity || 1;
    const totalPoints = item.totalPoints ?? ((item.pointsCost || 0) * quantity);

    return `
      <div class="item-line">
        <strong>${emoji} ${name}</strong>
        <span>${quantity} un • ${totalPoints} pts</span>
      </div>
    `;
  }).join("");
}

function renderRecyclables(recyclables) {
  if (!recyclables || recyclables.length === 0) {
    recyclablesList.innerHTML = '<p class="placeholder">Nenhum reciclável foi necessário nesta troca.</p>';
    return;
  }

  recyclablesList.innerHTML = recyclables.map((item) => {
    const emoji = item.recyclableEmoji || item.emoji || "♻️";
    const name = item.recyclableName || item.name || "Reciclável";
    const quantity = item.quantity || 1;
    const totalPoints = item.totalPoints ?? ((item.pointsPerUnit || item.pointsValue || 0) * quantity);

    return `
      <div class="item-line">
        <strong>${emoji} ${name}</strong>
        <span>${quantity} un • ${totalPoints} pts</span>
      </div>
    `;
  }).join("");
}

function fillTradeData(trade) {
  const normalizedStatus = normalizeStatus(trade.status);
  const tradeId = trade.tradeId || trade._id || "---";
  const totalCost = trade.totalCost ?? trade.totalBenefitsCost ?? 0;
  const walletUsed = trade.walletUsed ?? 0;
  const recyclingPointsUsed = trade.recyclingPointsUsed ?? 0;
  const coinsSurplus = trade.coinsSurplus ?? 0;
  const walletBalance = trade.walletBalanceAfter ?? trade.walletBalance ?? 0;

  currentStatusLabel.textContent = getStatusText(normalizedStatus);
  currentStatusDescription.textContent = getStatusDescription(normalizedStatus);

  orderCode.textContent = `Pedido #${String(tradeId).substring(0, 8).toUpperCase()}`;

  summaryTradeId.textContent = String(tradeId).substring(0, 8).toUpperCase();
  summaryDate.textContent = formatShortDate(trade.createdAt);
  summaryTotalCost.textContent = `${totalCost} moedas`;
  summaryWalletUsed.textContent = `${walletUsed} moedas`;
  summaryWalletBalance.textContent = `${walletBalance} moedas`;

  pickupName.textContent = trade.pickupPoint?.name || trade.pickupLocation?.name || "Ponto não informado";
  pickupAddress.textContent =
    trade.pickupPoint?.address ||
    trade.pickupLocation?.address ||
    "Endereço não informado";

  pickupNote.textContent =
    normalizedStatus === "ready"
      ? "Sua troca já está liberada para retirada no ponto informado."
      : "Retirada liberada somente quando o status mudar para “Pronto para retirada”.";

  renderTimeline(trade);
  renderBenefits(trade.benefitsReceived || trade.benefits || []);
  renderRecyclables(trade.recyclablesOffered || []);

  recyclablesTotalPoints.textContent = `${trade.totalPointsOffered ?? trade.recyclingPointsGenerated ?? 0} pontos`;
  benefitsTotalPoints.textContent = `${totalCost} pontos`;

  financialWalletUsed.textContent = walletUsed;
  financialRecyclingUsed.textContent = recyclingPointsUsed;
  financialSurplus.textContent = coinsSurplus;
  financialWalletBalance.textContent = walletBalance;
}

async function loadPendingTrade() {
  showLoading();

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      showEmpty();
      return;
    }

    const response = await fetch(`${API_URL}/trade/my-pending-trade`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      showEmpty();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar a troca pendente.");
    }

    const trade = data.trade || data.pendingTrade || data;

    if (!trade || Object.keys(trade).length === 0) {
      showEmpty();
      return;
    }

    fillTradeData(trade);
    showDetails();
  } catch (error) {
    console.error("Erro ao buscar troca pendente:", error);
    showEmpty();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPendingTrade();
});