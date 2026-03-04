const API_URL = "http://localhost:3000";
let benefits = [];

const benefitsContainer = document.getElementById("benefits-container");
const emptyState = document.getElementById("empty-state");
const formModal = document.getElementById("form-modal");
const benefitForm = document.getElementById("benefit-form");

async function loadBenefits() {
  try {
    const response = await fetch(`${API_URL}/benefits`);
    const data = await response.json();

    if (response.ok) {
      benefits = data.benefits || [];
      renderBenefits();
    } else {
      alert("Erro ao carregar benefícios.");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível conectar ao servidor.");
  }
}

function renderBenefits() {
  benefitsContainer.innerHTML = "";

  if (benefits.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  benefits.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <div class="item-info">
        <p class="item-name">${item.name}</p>
        <p class="item-type">${item.category}</p>
        <p class="item-details">${item.description} | ${item.quantity} disponíveis</p>
      </div>
      <div class="item-points">${item.pointsCost} pts</div>
      <div class="item-actions">
        <button class="action-btn" onclick="editBenefit('${item._id}')">Editar</button>
        <button class="action-btn delete" onclick="deleteBenefit('${item._id}')">Deletar</button>
      </div>
    `;
    benefitsContainer.appendChild(row);
  });
}

function openFormModal() {
  formModal.classList.remove("hidden");
  benefitForm.reset();
}

function closeFormModal() {
  formModal.classList.add("hidden");
  benefitForm.reset();
}

benefitForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();
  const pointsCost = parseInt(document.getElementById("pointsCost").value);
  const quantity = parseInt(document.getElementById("quantity").value);

  const data = { name, category, description, pointsCost, quantity };

  try {
    const response = await fetch(`${API_URL}/admin/benefits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Benefício cadastrado com sucesso!");
      closeFormModal();
      loadBenefits();
    } else {
      alert(result.error || "Erro ao cadastrar.");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível cadastrar.");
  }
});

function editBenefit(id) {
  alert(`Editar benefício ${id}. Implementar depois.`);
}

async function deleteBenefit(id) {
  if (!confirm("Tem certeza que deseja deletar este benefício?")) {
    return;
  }

  try {
    // Implementar rota DELETE depois
    alert("Funcionalidade de deletar será implementada com rota DELETE");
  } catch (error) {
    console.error("Erro:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadBenefits);
