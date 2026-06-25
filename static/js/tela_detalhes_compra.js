const API_URL = "https://bemaqui-tcc-main.onrender.com";

const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const detailsState = document.getElementById("details-state");

const tradeIdEl = document.getElementById("trade-id");
const tradeStatusEl = document.getElementById("trade-status");
const tradeDateEl = document.getElementById("trade-date");

const benefitsListEl = document.getElementById("benefits-list");
const recyclablesListEl = document.getElementById("recyclables-list");

const totalBenefitCostEl = document.getElementById("total-benefit-cost");
const walletUsedEl = document.getElementById("wallet-used");
const recyclingPointsUsedEl = document.getElementById("recycling-points-used");
const recyclingPointsGeneratedEl = document.getElementById("recycling-points-generated");
const coinsSurplusEl = document.getElementById("coins-surplus");
const walletBalanceEl = document.getElementById("wallet-balance");

function showLoading() {
  if (loadingState) loadingState.style.display = "block";
  if (emptyState) emptyState.style.display = "none";
  if (detailsState) detailsState.style.display = "none";
}

function showEmpty() {
  if (loadingState) loadingState.style.display = "none";
  if (emptyState) emptyState.style.display = "block";
  if (detailsState) detailsState.style.display = "none";
}

function showDetails() {
  if (loadingState) loadingState.style.display = "none";
  if (emptyState) emptyState.style.display = "none";
  if (detailsState) detailsState.style.display = "block";
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("pt-BR");
}

function formatStatus(status) {
  switch (status) {
    case "pendente":
      return "⏳ Pendente";
    case "confirmado":
      return "✅ Confirmado";
    case "concluido":
      return "🎉 Concluído";
    case "cancelado":
      return "❌ Cancelado";
    default:
      return status || "-";
  }
}

function renderBenefits(benefitsRequested = []) {
  if (!benefitsListEl) return;

  if (!Array.isArray(benefitsRequested) || benefitsRequested.length === 0) {
    benefitsListEl.innerHTML = `<p class="placeholder">Nenhum benefício encontrado.</p>`;
    return;
  }

  benefitsListEl.innerHTML = benefitsRequested
    .map((item) => {
      const totalItem = Number(item.pointsCost || 0) * Number(item.quantity || 1);
      return `
        <div class="detail-item">
          <div>
            <strong>${item.benefitEmoji || "🎁"} ${item.benefitName || "Benefício"}</strong>
            <div>${item.pointsCost || 0} pts por unidade</div>
          </div>
          <div>
            <strong>x${item.quantity || 1}</strong>
            <div>Total: ${totalItem}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRecyclables(recyclablesOffered = []) {
  if (!recyclablesListEl) return;

  if (!Array.isArray(recyclablesOffered) || recyclablesOffered.length === 0) {
    recyclablesListEl.innerHTML = `<p class="placeholder">Nenhum reciclável utilizado.</p>`;
    return;
  }

  recyclablesListEl.innerHTML = recyclablesOffered
    .map((item) => {
      const totalItem = Number(item.pointsPerUnit || 0) * Number(item.quantity || 1);
      return `
        <div class="detail-item">
          <div>
            <strong>${item.recyclableEmoji || "♻️"} ${item.recyclableName || "Reciclável"}</strong>
            <div>${item.pointsPerUnit || 0} pts por unidade</div>
          </div>
          <div>
            <strong>x${item.quantity || 1}</strong>
            <div>Total: ${totalItem}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function fillTradeData(trade, walletBalance) {
  if (tradeIdEl) {
    tradeIdEl.textContent = String(trade._id || trade.tradeId || "-").substring(0, 8).toUpperCase();
  }

  if (tradeStatusEl) {
    tradeStatusEl.textContent = formatStatus(trade.status);
  }

  if (tradeDateEl) {
    tradeDateEl.textContent = formatDate(trade.createdAt);
  }

  renderBenefits(trade.benefitsRequested || []);
  renderRecyclables(trade.recyclablesOffered || []);

  if (totalBenefitCostEl) totalBenefitCostEl.textContent = trade.totalBenefitCost || 0;
  if (walletUsedEl) walletUsedEl.textContent = trade.coinsOfferedFromWallet || 0;

  const recyclingPointsUsed = Math.max(
    0,
    Number(trade.totalBenefitCost || 0) - Number(trade.coinsOfferedFromWallet || 0)
  );

  if (recyclingPointsUsedEl) recyclingPointsUsedEl.textContent = recyclingPointsUsed;
  if (recyclingPointsGeneratedEl) recyclingPointsGeneratedEl.textContent = trade.totalRecyclingPoints || 0;
  if (coinsSurplusEl) coinsSurplusEl.textContent = trade.coinsSurplus || 0;
  if (walletBalanceEl) walletBalanceEl.textContent = walletBalance || 0;
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

    const data = await response.json().catch(() => ({}));

    if (response.status === 404) {
      showEmpty();
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar detalhes da troca.");
    }

    if (!data.trade) {
      showEmpty();
      return;
    }

    fillTradeData(data.trade, data.walletBalance || 0);
    showDetails();
  } catch (error) {
    console.error("Erro ao buscar troca pendente:", error);
    showEmpty();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPendingTrade();
});
