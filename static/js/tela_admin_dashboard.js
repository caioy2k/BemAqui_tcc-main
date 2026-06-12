const API_URL = "https://bemaqui-tcc-main.onrender.com";
let adminChartInstance = null;
let dashboardInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  setupNavigationButtons();
  loadDashboardData();
  startAutoRefresh();
});

function getEl(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = getEl(id);
  if (element) {
    element.textContent = value;
  } else {
    console.warn(`Elemento não encontrado: #${id}`);
  }
}

function setupNavigationButtons() {
  const recyclablesUrl = "tela_admin_recyclables.html";
  const benefitsUrl = "tela_admin_benefits.html";
  const tradesUrl = "tela_admin_trades.html";

  const goRecyclablesBtn = getEl("goRecyclablesBtn");
  const goBenefitsBtn = getEl("goBenefitsBtn");
  const goTradesBtn = getEl("goTradesBtn");
  const quickRecyclables = getEl("quickRecyclables");
  const quickBenefits = getEl("quickBenefits");
  const quickTrades = getEl("quickTrades");
  const refreshDashboardBtn = getEl("refreshDashboardBtn");

  if (goRecyclablesBtn) {
    goRecyclablesBtn.addEventListener("click", () => {
      window.location.href = recyclablesUrl;
    });
  }

  if (goBenefitsBtn) {
    goBenefitsBtn.addEventListener("click", () => {
      window.location.href = benefitsUrl;
    });
  }

  if (goTradesBtn) {
    goTradesBtn.addEventListener("click", () => {
      window.location.href = tradesUrl;
    });
  }

  if (quickRecyclables) {
    quickRecyclables.addEventListener("click", () => {
      window.location.href = recyclablesUrl;
    });
  }

  if (quickBenefits) {
    quickBenefits.addEventListener("click", () => {
      window.location.href = benefitsUrl;
    });
  }

  if (quickTrades) {
    quickTrades.addEventListener("click", () => {
      window.location.href = tradesUrl;
    });
  }

  if (refreshDashboardBtn) {
    refreshDashboardBtn.addEventListener("click", loadDashboardData);
  }
}

async function loadDashboardData() {
  try {
    setLoadingState();

    const [summaryResponse, monthlyResponse] = await Promise.all([
      fetch(`${API_URL}/api/admin/dashboard/summary`),
      fetch(`${API_URL}/api/admin/dashboard/monthly`)
    ]);

    const summaryData = await summaryResponse.json();
    const monthlyData = await monthlyResponse.json();

    if (!summaryResponse.ok) {
      throw new Error(summaryData.error || "Erro ao carregar resumo.");
    }

    if (!monthlyResponse.ok) {
      throw new Error(monthlyData.error || "Erro ao carregar gráfico.");
    }

    renderKpis(summaryData.summary);
    renderInsights(summaryData.summary);
    renderChart(monthlyData.monthly);

    setText("dashboardStatus", "online");
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    showDashboardError(error.message);
  }
}

function setLoadingState() {
  setText("usersCount", "...");
  setText("tradesCount", "...");
  setText("pendingTrades", "...");
  setText("benefitsCount", "...");
  setText("insightBenefits", "...");
  setText("insightPending", "...");
  setText("dashboardStatus", "atualizando...");
}

function renderKpis(data) {
  setText("usersCount", data?.usersCount ?? 0);
  setText("tradesCount", data?.tradesCount ?? 0);
  setText("pendingTrades", data?.pendingTrades ?? 0);
  setText("benefitsCount", data?.benefitsCount ?? 0);
}

function renderInsights(data) {
  setText("insightBenefits", data?.benefitsCount ?? 0);
  setText("insightPending", data?.pendingTrades ?? 0);
}

function renderChart(monthlyData) {
  const canvas = getEl("adminChart");
  if (!canvas) {
    console.warn("Canvas #adminChart não encontrado.");
    return;
  }

  const ctx = canvas.getContext("2d");

  const labels = Array.isArray(monthlyData) ? monthlyData.map(item => item.label) : [];
  const trades = Array.isArray(monthlyData) ? monthlyData.map(item => item.trades) : [];
  const approvals = Array.isArray(monthlyData) ? monthlyData.map(item => item.approvals) : [];

  if (adminChartInstance) {
    adminChartInstance.destroy();
  }

  adminChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Trades criadas",
          data: trades,
          backgroundColor: "#1f7a4f",
          borderRadius: 8
        },
        {
          label: "Trades aprovadas",
          data: approvals,
          backgroundColor: "#9bd8b4",
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

function showDashboardError(message) {
  setText("usersCount", "Erro");
  setText("tradesCount", "Erro");
  setText("pendingTrades", "Erro");
  setText("benefitsCount", "Erro");
  setText("insightBenefits", "Erro");
  setText("insightPending", "Erro");
  setText("dashboardStatus", "offline");
  console.error("Dashboard:", message);
}

function startAutoRefresh() {
  if (dashboardInterval) {
    clearInterval(dashboardInterval);
  }

  dashboardInterval = setInterval(() => {
    loadDashboardData();
  }, 15000);
}