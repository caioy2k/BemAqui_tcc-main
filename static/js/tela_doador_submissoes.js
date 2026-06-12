document.addEventListener("DOMContentLoaded", () => {
  const submissionList = document.getElementById("submissionList");
  const statusFilter = document.getElementById("statusFilter");
  const typeFilter = document.getElementById("typeFilter");
  const searchSubmission = document.getElementById("searchSubmission");
  const submissionListInfo = document.getElementById("submissionListInfo");

  const totalEl = document.getElementById("submissionTotal");
  const pendingEl = document.getElementById("submissionPending");
  const approvedEl = document.getElementById("submissionApproved");
  const transferredEl = document.getElementById("submissionTransferred");
  const overallStatusEl = document.getElementById("overallSubmissionStatus");

  const mockSubmissions = [
    {
      id: 1,
      item: "Cesta com alimentos não perecíveis",
      type: "alimento",
      quantity: "12 unidades",
      status: "em análise",
      date: "10/06/2026",
      note: "Produtos dentro do prazo de validade e bem armazenados."
    },
    {
      id: 2,
      item: "Jaquetas e agasalhos",
      type: "roupa",
      quantity: "8 peças",
      status: "aprovado",
      date: "08/06/2026",
      note: "Itens aprovados para entrada no fluxo da plataforma."
    },
    {
      id: 3,
      item: "Kits de higiene pessoal",
      type: "higiene",
      quantity: "15 kits",
      status: "repassado",
      date: "05/06/2026",
      note: "Materiais direcionados para repasse a ONG parceira."
    },
    {
      id: 4,
      item: "Itens variados sem descrição completa",
      type: "outro",
      quantity: "4 volumes",
      status: "recusado",
      date: "02/06/2026",
      note: "Necessário informar melhor o estado e a categoria dos itens."
    }
  ];

  const savedSubmissions =
    JSON.parse(localStorage.getItem("bemaquiSubmissions")) || mockSubmissions;

  function getStatusClass(status) {
    const map = {
      "em análise": "status-analise",
      aprovado: "status-aprovado",
      repassado: "status-repassado",
      recusado: "status-recusado"
    };

    return map[status] || "status-analise";
  }

  function formatType(type) {
    const map = {
      alimento: "Alimento",
      roupa: "Roupa",
      higiene: "Higiene",
      outro: "Outro"
    };

    return map[type] || "Outro";
  }

  function updateSummary(items) {
    const total = items.length;
    const pending = items.filter((item) => item.status === "em análise").length;
    const approved = items.filter((item) => item.status === "aprovado").length;
    const transferred = items.filter((item) => item.status === "repassado").length;

    totalEl.textContent = total;
    pendingEl.textContent = pending;
    approvedEl.textContent = approved;
    transferredEl.textContent = transferred;

    if (pending > 0) {
      overallStatusEl.textContent = "Há itens em análise";
    } else if (approved > 0) {
      overallStatusEl.textContent = "Itens aprovados recentemente";
    } else if (transferred > 0) {
      overallStatusEl.textContent = "Doações com repasse social";
    } else {
      overallStatusEl.textContent = "Sem movimentações recentes";
    }
  }

  function renderSubmissions(items) {
    submissionList.innerHTML = "";

    if (!items.length) {
      submissionList.innerHTML = `
        <div class="empty-state">
          <strong>Nenhuma submissão encontrada</strong>
          <p>Não há itens compatíveis com os filtros selecionados no momento.</p>
        </div>
      `;
      submissionListInfo.textContent = "Nenhum item corresponde aos filtros atuais";
      return;
    }

    submissionListInfo.textContent = `${items.length} item(ns) exibido(s) no histórico`;

    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "submission-item";

      article.innerHTML = `
        <div class="submission-main">
          <strong>${item.item}</strong>
          <p>${item.note}</p>
          <div class="submission-tags">
            <span class="submission-tag">${formatType(item.type)}</span>
            <span class="submission-tag">${item.quantity}</span>
          </div>
        </div>

        <div class="submission-meta">
          <span class="submission-date">${item.date}</span>
          <span class="submission-status ${getStatusClass(item.status)}">${item.status}</span>
        </div>
      `;

      submissionList.appendChild(article);
    });
  }

  function applyFilters() {
    const selectedStatus = statusFilter.value.toLowerCase();
    const selectedType = typeFilter.value.toLowerCase();
    const searchValue = searchSubmission.value.trim().toLowerCase();

    const filtered = savedSubmissions.filter((item) => {
      const matchesStatus =
        selectedStatus === "todos" || item.status.toLowerCase() === selectedStatus;

      const matchesType =
        selectedType === "todos" || item.type.toLowerCase() === selectedType;

      const matchesSearch =
        item.item.toLowerCase().includes(searchValue) ||
        item.note.toLowerCase().includes(searchValue);

      return matchesStatus && matchesType && matchesSearch;
    });

    updateSummary(filtered);
    renderSubmissions(filtered);
  }

  statusFilter.addEventListener("change", applyFilters);
  typeFilter.addEventListener("change", applyFilters);
  searchSubmission.addEventListener("input", applyFilters);

  updateSummary(savedSubmissions);
  renderSubmissions(savedSubmissions);
});