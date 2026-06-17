const API_URL = "https://bemaqui-tcc-main.onrender.com";

const donationList = document.getElementById("donationList");
const listInfo = document.getElementById("listInfo");
const refreshBtn = document.getElementById("refreshBtn");
const reloadHeroBtn = document.getElementById("reloadHeroBtn");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");

const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const transferredCount = document.getElementById("transferredCount");
const rejectedCount = document.getElementById("rejectedCount");

const detailsEmpty = document.getElementById("detailsEmpty");
const donationDetails = document.getElementById("donationDetails");
const detailImage = document.getElementById("detailImage");
const detailItem = document.getElementById("detailItem");
const detailCategory = document.getElementById("detailCategory");
const detailQuantity = document.getElementById("detailQuantity");
const detailStatus = document.getElementById("detailStatus");
const detailDonor = document.getElementById("detailDonor");
const detailContact = document.getElementById("detailContact");
const detailDescription = document.getElementById("detailDescription");
const detailPickup = document.getElementById("detailPickup");
const reviewNote = document.getElementById("reviewNote");
const approveBtn = document.getElementById("approveBtn");
const transferBtn = document.getElementById("transferBtn");
const rejectBtn = document.getElementById("rejectBtn");
const actionFeedback = document.getElementById("actionFeedback");

let allDonations = [];
let selectedDonationId = null;

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "em análise" || value === "em analise") return "Em análise";
  if (value === "aprovado" || value === "aprovada") return "Aprovado";
  if (value === "repassado" || value === "encaminhado") return "Repassado";
  if (value === "recusado" || value === "rejeitado") return "Recusado";

  return "Em análise";
}

function getStatusTagClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Em análise") return "warning";
  if (normalized === "Aprovado") return "success";
  if (normalized === "Repassado") return "info";
  return "danger";
}

function formatDateBR(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function buildImageUrl(path) {
  if (!path) return "https://via.placeholder.com/600x400?text=Sem+Imagem";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path}`;
}

function getDonorName(donation) {
  if (donation.donorId && typeof donation.donorId === "object") {
    return donation.donorId.name || "Doador não identificado";
  }
  return "Doador não identificado";
}

function getDonorContact(donation) {
  if (donation.donorId && typeof donation.donorId === "object") {
    return donation.donorId.email || donation.donorId.phone || "-";
  }
  return "-";
}

function formatCategory(category) {
  return category || "Não informada";
}

function formatQuantity(item) {
  return `${item.quantity ?? 0} ${item.unit || "unidades"}`;
}

function updateMetrics() {
  pendingCount.textContent = allDonations.filter(item => normalizeStatus(item.status) === "Em análise").length;
  approvedCount.textContent = allDonations.filter(item => normalizeStatus(item.status) === "Aprovado").length;
  transferredCount.textContent = allDonations.filter(item => normalizeStatus(item.status) === "Repassado").length;
  rejectedCount.textContent = allDonations.filter(item => normalizeStatus(item.status) === "Recusado").length;
}

function getFilteredDonations() {
  const statusValue = statusFilter.value.trim().toLowerCase();
  const searchValue = searchInput.value.trim().toLowerCase();

  return allDonations.filter(item => {
    const normalizedStatus = normalizeStatus(item.status).toLowerCase();
    const donorName = getDonorName(item).toLowerCase();
    const itemName = String(item.itemName || "").toLowerCase();
    const category = String(item.category || "").toLowerCase();
    const description = String(item.description || "").toLowerCase();

    const matchesStatus =
      statusValue === "todos"
        ? true
        : statusValue === "pendentes"
        ? normalizedStatus === "em análise"
        : normalizedStatus === statusValue;

    const matchesSearch =
      itemName.includes(searchValue) ||
      donorName.includes(searchValue) ||
      category.includes(searchValue) ||
      description.includes(searchValue);

    return matchesStatus && matchesSearch;
  });
}

function renderDonationList() {
  const filtered = getFilteredDonations();
  donationList.innerHTML = "";

  if (!filtered.length) {
    listInfo.textContent = "Nenhuma doação encontrada para os filtros selecionados.";
    donationList.innerHTML = `
      <div class="empty-state">
        <strong>Nenhuma doação encontrada</strong>
        <p>Não há itens compatíveis com os filtros atuais.</p>
      </div>
    `;
    return;
  }

  listInfo.textContent = `${filtered.length} doação(ões) exibida(s) para análise`;

  filtered.forEach(item => {
    const article = document.createElement("article");
    article.className = `donation-card ${selectedDonationId === item._id ? "active" : ""}`;
    article.dataset.id = item._id;

    const firstImage = Array.isArray(item.images) && item.images.length ? item.images[0] : "";

    article.innerHTML = `
      <img
        class="donation-thumb"
        src="${buildImageUrl(firstImage)}"
        alt="Imagem da doação ${item.itemName || "sem nome"}"
      />

      <div class="donation-content">
        <div class="donation-top">
          <div>
            <h4 class="donation-title">${item.itemName || "Item sem nome"}</h4>
            <p class="donation-subtitle">
              ${getDonorName(item)} • ${formatDateBR(item.createdAt)}
            </p>
          </div>

          <span class="tag ${getStatusTagClass(item.status)}">${normalizeStatus(item.status)}</span>
        </div>

        <p class="donation-subtitle">
          ${item.description || "Sem descrição cadastrada."}
        </p>

        <div class="donation-tags">
          <span class="tag info">${formatCategory(item.category)}</span>
          <span class="tag warning">${formatQuantity(item)}</span>
        </div>
      </div>
    `;

    article.addEventListener("click", () => {
      selectedDonationId = item._id;
      fillDetails(item);
      renderDonationList();
    });

    donationList.appendChild(article);
  });
}

function fillDetails(item) {
  detailsEmpty.classList.add("hidden");
  donationDetails.classList.remove("hidden");

  const firstImage = Array.isArray(item.images) && item.images.length ? item.images[0] : "";

  detailImage.src = buildImageUrl(firstImage);
  detailItem.textContent = item.itemName || "-";
  detailCategory.textContent = formatCategory(item.category);
  detailQuantity.textContent = formatQuantity(item);
  detailStatus.textContent = normalizeStatus(item.status);
  detailDonor.textContent = getDonorName(item);
  detailContact.textContent = getDonorContact(item);
  detailDescription.textContent = item.description || "Sem descrição cadastrada.";
  detailPickup.textContent = item.pickupInfo || "Sem informações de retirada.";
  reviewNote.value = item.reviewNote || "";
  actionFeedback.textContent = "";
}

async function loadDonations() {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/donations`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível carregar as doações.");
    }

    const donations = Array.isArray(data.donations) ? data.donations : [];

    allDonations = donations.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    updateMetrics();

    if (selectedDonationId) {
      const selected = allDonations.find(item => item._id === selectedDonationId);
      if (selected) {
        fillDetails(selected);
      } else {
        selectedDonationId = null;
        donationDetails.classList.add("hidden");
        detailsEmpty.classList.remove("hidden");
      }
    }

    renderDonationList();
  } catch (error) {
    console.error("Erro ao carregar doações:", error);
    donationList.innerHTML = `
      <div class="empty-state">
        <strong>Erro ao carregar doações</strong>
        <p>Verifique a conexão com a API e as permissões da rota.</p>
      </div>
    `;
    listInfo.textContent = "Falha no carregamento da fila";
  }
}

async function updateDonationStatus(status) {
  if (!selectedDonationId) {
    actionFeedback.textContent = "Selecione uma doação antes de validar.";
    return;
  }

  const token = localStorage.getItem("token");
  actionFeedback.textContent = "Atualizando status...";

  try {
    const response = await fetch(`${API_URL}/donations/${selectedDonationId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        status,
        reviewNote: reviewNote.value.trim()
      })
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível atualizar a doação.");
    }

    actionFeedback.textContent = `Doação atualizada para "${status}" com sucesso.`;
    await loadDonations();
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    actionFeedback.textContent = error.message || "Erro ao atualizar a doação.";
  }
}

refreshBtn.addEventListener("click", loadDonations);
reloadHeroBtn.addEventListener("click", loadDonations);
statusFilter.addEventListener("change", renderDonationList);
searchInput.addEventListener("input", renderDonationList);

approveBtn.addEventListener("click", () => updateDonationStatus("Aprovado"));
transferBtn.addEventListener("click", () => updateDonationStatus("Repassado"));
rejectBtn.addEventListener("click", () => updateDonationStatus("Recusado"));

document.addEventListener("DOMContentLoaded", loadDonations);