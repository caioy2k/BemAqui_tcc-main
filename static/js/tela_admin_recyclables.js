const API_URL = "http://localhost:3000";
let recyclables = [];

const recyclablesContainer = document.getElementById("recyclables-container");
const emptyState = document.getElementById("empty-state");
const formModal = document.getElementById("form-modal");
const recyclableForm = document.getElementById("recyclable-form");

async function loadRecyclables() {
  try {
    const response = await fetch(`${API_URL}/recyclables`);
    const data = await response.json();

    if (response.ok) {
      recyclables = data.recyclables || [];
      renderRecyclables();
    } else {
      alert("Erro ao carregar recicláveis.");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível conectar ao servidor.");
  }
}

function renderRecyclables() {
  recyclablesContainer.innerHTML = "";

  if (recyclables.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  recyclables.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <div class="item-info">
        <p class="item-name">${item.name}</p>
        <p class="item-type">${item.type}</p>
        <p class="item-details">${item.description}</p>
      </div>
      <div class="item-points">${item.pointsValue} pts</div>
      <div class="item-actions">
        <button class="action-btn" onclick="editRecyclable('${item._id}')">Editar</button>
        <button class="action-btn delete" onclick="deleteRecyclable('${item._id}')">Deletar</button>
      </div>
    `;
    recyclablesContainer.appendChild(row);
  });
}

function openFormModal() {
  formModal.classList.remove("hidden");
  recyclableForm.reset();
}

function closeFormModal() {
  formModal.classList.add("hidden");
  recyclableForm.reset();
}

recyclableForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const type = document.getElementById("type").value;
  const description = document.getElementById("description").value.trim();
  const pointsValue = parseInt(document.getElementById("pointsValue").value);

  const data = { name, type, description, pointsValue };

  try {
    const response = await fetch(`${API_URL}/admin/recyclables`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Reciclável cadastrado com sucesso!");
      closeFormModal();
      loadRecyclables();
    } else {
      alert(result.error || "Erro ao cadastrar.");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível cadastrar.");
  }
});

function editRecyclable(id) {
  alert(`Editar reciclável ${id}. Implementar depois.`);
}

async function deleteRecyclable(id) {
  if (!confirm("Tem certeza que deseja deletar este reciclável?")) {
    return;
  }

  try {
    // Implementar rota DELETE depois
    alert("Funcionalidade de deletar será implementada com rota DELETE");
  } catch (error) {
    console.error("Erro:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadRecyclables);
