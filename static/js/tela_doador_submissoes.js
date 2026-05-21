const mockSubmissions = [
  {
    id: 1,
    title: "Cestas básicas para triagem",
    category: "Alimentos",
    quantity: "3 unidades",
    status: "em análise",
    description: "Envio de cestas básicas com itens não perecíveis para avaliação da equipe.",
    date: "18/05/2026",
    note: "Sua submissão foi recebida e está aguardando conferência dos itens."
  },
  {
    id: 2,
    title: "Kit de higiene pessoal",
    category: "Higiene",
    quantity: "12 kits",
    status: "aprovada",
    description: "Kits contendo sabonete, escova de dentes, creme dental e papel higiênico.",
    date: "14/05/2026",
    note: "Submissão aprovada. Os itens foram direcionados para atendimento interno."
  },
  {
    id: 3,
    title: "Roupas infantis usadas",
    category: "Vestuário",
    quantity: "18 peças",
    status: "recusada",
    description: "Lote com roupas infantis em estado variado para possível reaproveitamento.",
    date: "09/05/2026",
    note: "Algumas peças não atenderam aos critérios mínimos de conservação."
  },
  {
    id: 4,
    title: "Materiais escolares",
    category: "Educação",
    quantity: "25 itens",
    status: "em análise",
    description: "Cadernos, lápis, borrachas e estojos para avaliação de redistribuição.",
    date: "06/05/2026",
    note: "A equipe está validando a quantidade e o estado dos materiais."
  }
];

const submissionsList = document.getElementById("submissionsList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const resultsInfo = document.getElementById("resultsInfo");

function renderSummary(data) {
  const total = data.length;
  const pending = data.filter(item => item.status === "em análise").length;
  const approved = data.filter(item => item.status === "aprovada").length;
  const last = data.length ? data[0].date : "-";

  document.getElementById("totalSubmissions").textContent = total;
  document.getElementById("pendingSubmissions").textContent = pending;
  document.getElementById("approvedSubmissions").textContent = approved;
  document.getElementById("lastUpdate").textContent = last;
}

function getStatusClass(status) {
  if (status === "em análise") return "status-analise";
  if (status === "aprovada") return "status-aprovada";
  return "status-recusada";
}

function renderSubmissions(data) {
  submissionsList.innerHTML = "";
  resultsInfo.textContent = `${data.length} resultado(s)`;

  if (!data.length) {
    submissionsList.innerHTML = `
      <div class="empty-state">
        <h3>Nenhuma submissão encontrada</h3>
        <p>Tente ajustar a busca ou o filtro para localizar seus envios.</p>
      </div>
    `;
    return;
  }

  data.forEach(item => {
    const card = document.createElement("article");
    card.className = "submission-card";
    card.innerHTML = `
      <div class="submission-top">
        <div>
          <div class="submission-title">${item.title}</div>
          <div class="submission-meta">${item.category} • ${item.quantity}</div>
        </div>
        <span class="status-badge ${getStatusClass(item.status)}">${item.status}</span>
      </div>

      <p class="submission-description">${item.description}</p>

      <div class="submission-footer">
        <span class="submission-date">Enviado em ${item.date}</span>
        <button class="btn-details" onclick="openModal(${item.id})">Ver detalhes</button>
      </div>
    `;
    submissionsList.appendChild(card);
  });
}

function filterSubmissions() {
  const search = searchInput.value.toLowerCase().trim();
  const status = statusFilter.value;

  const filtered = mockSubmissions.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search);

    const matchesStatus = status === "all" || item.status === status;

    return matchesSearch && matchesStatus;
  });

  renderSummary(filtered);
  renderSubmissions(filtered);
}

function openModal(id) {
  const item = mockSubmissions.find(submission => submission.id === id);
  if (!item) return;

  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalStatus").textContent = item.status;
  document.getElementById("modalCategory").textContent = item.category;
  document.getElementById("modalQuantity").textContent = item.quantity;
  document.getElementById("modalDate").textContent = item.date;
  document.getElementById("modalDescription").textContent = item.description;
  document.getElementById("modalNote").textContent = item.note;

  document.getElementById("detailsModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("detailsModal").classList.add("hidden");
}

searchInput.addEventListener("input", filterSubmissions);
statusFilter.addEventListener("change", filterSubmissions);

renderSummary(mockSubmissions);
renderSubmissions(mockSubmissions);