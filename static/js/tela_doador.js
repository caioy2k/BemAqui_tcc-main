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
  } catch (error) {
    console.error("Erro ao carregar nome do doador:", error);
    donorName.textContent = "Doador";
  }
}

const donorDashboardData = {
  totalSubmissions: 7,
  pendingReview: 3,
  approvedItems: 2,
  lastUpdate: "Hoje",
  submissions: [
    {
      title: "Cesta com arroz, feijão e macarrão",
      details: "5 itens • Enviado em 18/05/2026",
      destination: "Em análise para estoque ou repasse",
      status: "Em análise"
    },
    {
      title: "Leite em pó e óleo",
      details: "2 itens • Enviado em 15/05/2026",
      destination: "Aprovado para estoque",
      status: "Aprovado"
    },
    {
      title: "Cobertores e roupas infantis",
      details: "8 itens • Enviado em 12/05/2026",
      destination: "Encaminhado para ONG parceira",
      status: "Repassado"
    }
  ]
};

function getStatusClass(status) {
  const value = status.toLowerCase();

  if (value === "em análise") return "status-analise";
  if (value === "aprovado") return "status-aprovado";
  if (value === "repassado") return "status-repassado";
  return "status-recusado";
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

document.addEventListener("DOMContentLoaded", async () => {
  renderDonorDashboard(donorDashboardData);
  await loadDonorName();
});