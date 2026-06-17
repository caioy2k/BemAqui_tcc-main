document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://bemaqui-tcc-main.onrender.com";

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

  let allSubmissions = [];

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

  function normalizeStatus(status) {
    const value = String(status || "").trim().toLowerCase();

    if (value === "em análise" || value === "em analise") return "em análise";
    if (value === "aprovado" || value === "aprovada" || value === "aprovadas") return "aprovado";
    if (value === "repassado" || value === "encaminhado" || value === "encaminhado para ong") return "repassado";
    if (value === "recusado" || value === "rejeitado") return "recusado";

    return "em análise";
  }

  function normalizeType(category) {
    const value = String(category || "").trim().toLowerCase();

    if (
      value.includes("alimento") ||
      value.includes("comida") ||
      value.includes("mantimento")
    ) {
      return "alimento";
    }

    if (
      value.includes("roupa") ||
      value.includes("vestuário") ||
      value.includes("vestuario") ||
      value.includes("agasalho") ||
      value.includes("calçado") ||
      value.includes("calcado")
    ) {
      return "roupa";
    }

    if (
      value.includes("higiene") ||
      value.includes("limpeza") ||
      value.includes("kit higiene")
    ) {
      return "higiene";
    }

    return "outro";
  }

  function getStatusClass(status) {
    const map = {
      "em análise": "status-analise",
      "aprovado": "status-aprovado",
      "repassado": "status-repassado",
      "recusado": "status-recusado"
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

  function formatQuantity(item) {
    const quantity = item.quantity ?? 0;
    const unit = item.unit || "unidades";
    return `${quantity} ${unit}`;
  }

  function formatDateBR(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("pt-BR");
  }

  function mapDonationToSubmission(item) {
    return {
      id: item._id,
      item: item.itemName || "Item sem nome",
      type: normalizeType(item.category),
      quantity: formatQuantity(item),
      status: normalizeStatus(item.status),
      date: formatDateBR(item.createdAt),
      note:
        item.description ||
        item.pickupInfo ||
        "Sem observações adicionais cadastradas."
    };
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
    const selectedStatus = statusFilter.value.trim().toLowerCase();
    const selectedType = typeFilter.value.trim().toLowerCase();
    const searchValue = searchSubmission.value.trim().toLowerCase();

    const filtered = allSubmissions.filter((item) => {
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

  async function loadSubmissions() {
    const token = localStorage.getItem("token");
    const donorId = getCurrentUserId();

    if (!token || !donorId) {
      allSubmissions = [];
      updateSummary(allSubmissions);
      renderSubmissions(allSubmissions);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/donations?donorId=${encodeURIComponent(donorId)}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar as submissões.");
      }

      const donations = Array.isArray(data.donations) ? data.donations : [];

      allSubmissions = donations
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .map(mapDonationToSubmission);

      updateSummary(allSubmissions);
      renderSubmissions(allSubmissions);
    } catch (error) {
      console.error("Erro ao carregar submissões:", error);
      allSubmissions = [];
      updateSummary(allSubmissions);
      renderSubmissions(allSubmissions);
    }
  }

  statusFilter.addEventListener("change", applyFilters);
  typeFilter.addEventListener("change", applyFilters);
  searchSubmission.addEventListener("input", applyFilters);

  loadSubmissions();
});