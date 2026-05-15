const API_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  loadEmployeeDashboard();
  bindActions();
});

async function loadEmployeeDashboard() {
  try {
    setLoadingState();

    const response = await fetch(`${API_URL}/api/employee/dashboard`);
    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Erro ao carregar dashboard.");
    }

    renderMetrics(data.metrics || {});
    renderPriorities(data.priorities || []);
    renderAlerts(data.alerts || []);
  } catch (error) {
    console.error("Erro ao carregar dashboard do funcionário:", error);
    showErrorState(error.message);
  }
}

function setLoadingState() {
  setText("pendingTrades", "...");
  setText("todayRescues", "...");
  setText("servedUsers", "...");
  setText("coinsIssued", "...");
}

function renderMetrics(metrics) {
  setText("pendingTrades", metrics.pendingTrades ?? 0);
  setText("todayRescues", metrics.todayRescues ?? 0);
  setText("servedUsers", metrics.servedUsers ?? 0);
  setText("coinsIssued", metrics.coinsIssued ?? 0);
}

function renderPriorities(priorities) {
  const priorityList = document.getElementById("priorityList");
  if (!priorityList) return;

  priorityList.innerHTML = "";

  if (!Array.isArray(priorities) || priorities.length === 0) {
    priorityList.innerHTML = `
      <div class="priority-item">
        <div class="priority-meta">
          <h4>Sem pendências críticas</h4>
          <p>Não há trades urgentes aguardando ação no momento.</p>
        </div>
        <span class="tag info">OK</span>
      </div>
    `;
    return;
  }

  priorities.forEach(item => {
    const div = document.createElement("div");
    div.className = "priority-item";
    div.innerHTML = `
      <div class="priority-meta">
        <h4>${item.title || "Pendência operacional"}</h4>
        <p>${item.description || "Sem descrição disponível."}</p>
      </div>
      <span class="tag ${item.type || "info"}">${item.tag || "Info"}</span>
    `;
    priorityList.appendChild(div);
  });
}

function renderAlerts(alerts) {
  const alertsList = document.getElementById("alertsList");
  if (!alertsList) return;

  alertsList.innerHTML = "";

  if (!Array.isArray(alerts) || alerts.length === 0) {
    alertsList.innerHTML = `
      <div class="alert-item">
        <div class="alert-meta">
          <h4>Sem alertas</h4>
          <p>Não há avisos operacionais no momento.</p>
        </div>
        <span class="tag info">OK</span>
      </div>
    `;
    return;
  }

  alerts.forEach(item => {
    const div = document.createElement("div");
    div.className = "alert-item";
    div.innerHTML = `
      <div class="alert-meta">
        <h4>${item.title || "Aviso operacional"}</h4>
        <p>${item.description || "Sem descrição disponível."}</p>
      </div>
      <span class="tag ${item.type || "info"}">${item.tag || "Info"}</span>
    `;
    alertsList.appendChild(div);
  });
}

function bindActions() {
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadEmployeeDashboard);
  }

  const simulateBtn = document.getElementById("simulateBtn");
  if (simulateBtn) {
    simulateBtn.addEventListener("click", loadEmployeeDashboard);
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function showErrorState(message) {
  setText("pendingTrades", "Erro");
  setText("todayRescues", "Erro");
  setText("servedUsers", "Erro");
  setText("coinsIssued", "Erro");

  const priorityList = document.getElementById("priorityList");
  if (priorityList) {
    priorityList.innerHTML = `
      <div class="priority-item">
        <div class="priority-meta">
          <h4>Falha ao carregar prioridades</h4>
          <p>${message || "Verifique a conexão com o servidor."}</p>
        </div>
        <span class="tag danger">Erro</span>
      </div>
    `;
  }

  const alertsList = document.getElementById("alertsList");
  if (alertsList) {
    alertsList.innerHTML = `
      <div class="alert-item">
        <div class="alert-meta">
          <h4>Falha ao carregar alertas</h4>
          <p>Não foi possível buscar os dados reais do banco.</p>
        </div>
        <span class="tag danger">Erro</span>
      </div>
    `;
  }
}