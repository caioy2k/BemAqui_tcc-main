const API_URL = "http://localhost:3000";
const BENEFITS_BASES = [
  `${API_URL}/benefits`,
  `${API_URL}/api/benefits`,
  `${API_URL}/admin/benefits`,
  `${API_URL}/api/admin/benefits`
];

let benefits = [];
let editingBenefitId = null;
let activeBenefitsBase = null;

const benefitsContainer = document.getElementById("benefits-container");
const emptyState = document.getElementById("empty-state");
const formModal = document.getElementById("form-modal");
const benefitForm = document.getElementById("benefit-form");

const modalTitle = document.querySelector(".modal-header h2");
const submitButton = benefitForm?.querySelector('button[type="submit"]');

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function detectBenefitsBase() {
  if (activeBenefitsBase) return activeBenefitsBase;

  for (const base of BENEFITS_BASES) {
    try {
      const { response, data } = await requestJson(base);

      if (response.ok) {
        activeBenefitsBase = base;
        benefits = Array.isArray(data.benefits) ? data.benefits : [];
        return base;
      }
    } catch (error) {
      console.warn(`Falha ao testar rota ${base}`, error);
    }
  }

  throw new Error("Nenhuma rota de benefits foi encontrada no backend.");
}

async function loadBenefits() {
  try {
    const base = await detectBenefitsBase();
    const { response, data } = await requestJson(base);

    if (!response.ok) {
      alert(data.error || "Erro ao carregar benefícios.");
      return;
    }

    benefits = Array.isArray(data.benefits) ? data.benefits : [];
    renderBenefits();
  } catch (error) {
    console.error("Erro ao carregar benefícios:", error);
    alert("Não foi possível localizar a rota de benefícios no servidor.");
  }
}

function renderBenefits() {
  if (!benefitsContainer || !emptyState) return;

  benefitsContainer.innerHTML = "";

  if (!benefits.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  benefits.forEach((item) => {
    const id = item._id || item.id || "";
    const name = item.name || "Benefício sem nome";
    const category = item.category || "Sem categoria";
    const description = item.description || "Sem descrição cadastrada.";
    const quantity = Number(item.quantity ?? 0);
    const pointsCost = Number(item.pointsCost ?? 0);

    const card = document.createElement("article");
    card.className = "benefit-card";

    card.innerHTML = `
      <div class="benefit-card-header">
        <h4 class="benefit-card-title">${escapeHtml(name)}</h4>
        <span class="benefit-badge">${escapeHtml(formatCategory(category))}</span>
      </div>

      <p>${escapeHtml(description)}</p>

      <div class="benefit-meta">
        <div class="benefit-meta-item">
          <span>Disponíveis</span>
          <strong>${quantity}</strong>
        </div>
        <div class="benefit-meta-item">
          <span>Pontos</span>
          <strong>${pointsCost} pts</strong>
        </div>
      </div>

      <div class="benefit-actions">
        <button type="button" class="btn-secondary" onclick="editBenefit('${id}')">
          Editar
        </button>
        <button type="button" class="btn-primary" onclick="deleteBenefit('${id}')">
          Deletar
        </button>
      </div>
    `;

    benefitsContainer.appendChild(card);
  });
}

function openFormModal() {
  if (!formModal || !benefitForm) return;

  editingBenefitId = null;
  benefitForm.reset();

  if (modalTitle) modalTitle.textContent = "Cadastrar benefício";
  if (submitButton) submitButton.textContent = "Cadastrar";

  formModal.classList.remove("hidden");
}

function closeFormModal() {
  if (!formModal || !benefitForm) return;

  formModal.classList.add("hidden");
  benefitForm.reset();
  editingBenefitId = null;

  if (modalTitle) modalTitle.textContent = "Cadastrar benefício";
  if (submitButton) submitButton.textContent = "Cadastrar";
}

function getFormData() {
  const name = document.getElementById("name")?.value.trim() || "";
  const category = document.getElementById("category")?.value || "";
  const description = document.getElementById("description")?.value.trim() || "";
  const pointsCost = parseInt(document.getElementById("pointsCost")?.value, 10);
  const quantity = parseInt(document.getElementById("quantity")?.value, 10);

  return {
    name,
    category,
    description,
    pointsCost: Number.isNaN(pointsCost) ? 0 : pointsCost,
    quantity: Number.isNaN(quantity) ? 0 : quantity,
  };
}

function validateFormData(data) {
  if (!data.name) {
    alert("Informe o nome do benefício.");
    return false;
  }
  if (!data.category) {
    alert("Selecione a categoria.");
    return false;
  }
  if (!data.description) {
    alert("Informe a descrição do benefício.");
    return false;
  }
  if (data.pointsCost < 1) {
    alert("Os pontos devem ser maiores que zero.");
    return false;
  }
  if (data.quantity < 0) {
    alert("A quantidade não pode ser negativa.");
    return false;
  }

  return true;
}

async function createBenefit(payload) {
  const base = await detectBenefitsBase();
  return requestJson(base, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function updateBenefit(id, payload) {
  const base = await detectBenefitsBase();
  return requestJson(`${base}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function removeBenefitRequest(id) {
  const base = await detectBenefitsBase();
  return requestJson(`${base}/${id}`, {
    method: "DELETE",
  });
}

if (benefitForm) {
  benefitForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = getFormData();

    if (!validateFormData(payload)) return;

    try {
      let result;

      if (editingBenefitId) {
        result = await updateBenefit(editingBenefitId, payload);

        if (!result.response.ok) {
          alert(result.data.error || "Erro ao atualizar benefício.");
          return;
        }

        alert(result.data.message || "Benefício atualizado com sucesso!");
      } else {
        result = await createBenefit(payload);

        if (!result.response.ok) {
          alert(result.data.error || "Erro ao cadastrar benefício.");
          return;
        }

        alert(result.data.message || "Benefício cadastrado com sucesso!");
      }

      closeFormModal();
      await loadBenefits();
    } catch (error) {
      console.error("Erro ao salvar benefício:", error);
      alert("Não foi possível salvar o benefício.");
    }
  });
}

function editBenefit(id) {
  const benefit = benefits.find((item) => (item._id || item.id) === id);

  if (!benefit) {
    alert("Benefício não encontrado.");
    return;
  }

  editingBenefitId = id;

  document.getElementById("name").value = benefit.name || "";
  document.getElementById("category").value = benefit.category || "";
  document.getElementById("description").value = benefit.description || "";
  document.getElementById("pointsCost").value = benefit.pointsCost ?? 0;
  document.getElementById("quantity").value = benefit.quantity ?? 0;

  if (modalTitle) modalTitle.textContent = "Editar benefício";
  if (submitButton) submitButton.textContent = "Salvar alterações";

  formModal.classList.remove("hidden");
}

async function deleteBenefit(id) {
  const benefit = benefits.find((item) => (item._id || item.id) === id);
  const benefitName = benefit?.name || "este benefício";

  if (!confirm(`Tem certeza que deseja deletar ${benefitName}?`)) return;

  try {
    const result = await removeBenefitRequest(id);

    if (!result.response.ok) {
      alert(result.data.error || "Erro ao deletar benefício.");
      return;
    }

    alert(result.data.message || "Benefício deletado com sucesso!");
    await loadBenefits();
  } catch (error) {
    console.error("Erro ao deletar benefício:", error);
    alert("Não foi possível deletar o benefício.");
  }
}

function formatCategory(category) {
  const categories = {
    alimentos: "Alimentos",
    roupas: "Roupas",
    utensilio: "Utensílio",
    higiene: "Higiene",
    outro: "Outro",
  };

  return categories[category] || category;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", loadBenefits);