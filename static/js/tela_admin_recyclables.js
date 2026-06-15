const API_URL = "https://bemaqui-tcc-main.onrender.com";
let recyclables = [];
let editingRecyclableId = null;

const recyclablesContainer = document.getElementById("recyclables-container");
const emptyState = document.getElementById("empty-state");
const formModal = document.getElementById("form-modal");
const recyclableForm = document.getElementById("recyclable-form");

const modalTitle = document.querySelector(".modal-header h2");
const submitButton = recyclableForm.querySelector('button[type="submit"]');

async function parseResponse(response) {
  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    if (text.trim().startsWith("<")) {
      throw new Error("A API retornou HTML em vez de JSON. Verifique a rota no backend.");
    }
    throw new Error("Resposta inválida do servidor.");
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || "Erro na requisição.");
  }

  return data;
}

async function loadRecyclables() {
  try {
    const response = await fetch(`${API_URL}/recyclables`, {
      headers: {
        "Accept": "application/json"
      }
    });

    const data = await parseResponse(response);
    recyclables = data.recyclables || [];
    renderRecyclables();
  } catch (error) {
    console.error("Erro:", error);
    recyclablesContainer.innerHTML = "";
    emptyState.classList.remove("hidden");
    emptyState.innerHTML = `<p>${error.message || "Não foi possível conectar ao servidor."}</p>`;
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
        <button class="action-btn-item" onclick="editRecyclable('${item._id}')">Editar</button>
        <button class="action-btn-item delete" onclick="deleteRecyclable('${item._id}', '${String(item.name).replace(/'/g, "\\'")}')">Deletar</button>
      </div>
    `;
    recyclablesContainer.appendChild(row);
  });
}

function setCreateMode() {
  editingRecyclableId = null;
  recyclableForm.reset();

  if (modalTitle) {
    modalTitle.textContent = "Cadastrar Reciclável";
  }

  if (submitButton) {
    submitButton.textContent = "Cadastrar";
  }
}

function setEditMode(item) {
  editingRecyclableId = item._id;

  document.getElementById("name").value = item.name || "";
  document.getElementById("type").value = item.type || "";
  document.getElementById("description").value = item.description || "";
  document.getElementById("pointsValue").value = item.pointsValue ?? "";

  if (modalTitle) {
    modalTitle.textContent = "Editar Reciclável";
  }

  if (submitButton) {
    submitButton.textContent = "Salvar alterações";
  }
}

function openFormModal() {
  setCreateMode();
  formModal.classList.remove("hidden");
}

function closeFormModal() {
  formModal.classList.add("hidden");
  setCreateMode();
}

recyclableForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar autenticado para realizar esta ação.");
    return;
  }

  const name = document.getElementById("name").value.trim();
  const type = document.getElementById("type").value;
  const description = document.getElementById("description").value.trim();
  const pointsValue = parseInt(document.getElementById("pointsValue").value, 10);

  const data = { name, type, description, pointsValue };

  const isEditing = Boolean(editingRecyclableId);
  const url = isEditing
    ? `${API_URL}/admin/recyclables/${editingRecyclableId}`
    : `${API_URL}/admin/recyclables`;
  const method = isEditing ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    await parseResponse(response);

    alert(
      isEditing
        ? "Reciclável atualizado com sucesso!"
        : "Reciclável cadastrado com sucesso!"
    );

    closeFormModal();
    loadRecyclables();
  } catch (error) {
    console.error("Erro:", error);
    alert(error.message || "Não foi possível salvar o reciclável.");
  }
});

function editRecyclable(id) {
  const item = recyclables.find((recyclable) => recyclable._id === id);

  if (!item) {
    alert("Reciclável não encontrado.");
    return;
  }

  setEditMode(item);
  formModal.classList.remove("hidden");
}

async function deleteRecyclable(id, name = "este reciclável") {
  const confirmed = window.confirm(`Tem certeza que deseja deletar "${name}"?`);

  if (!confirmed) return;

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Você precisa estar autenticado para realizar esta ação.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/recyclables/${id}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await parseResponse(response);

    alert(result.message || "Reciclável deletado com sucesso!");
    loadRecyclables();
  } catch (error) {
    console.error("Erro:", error);
    alert(error.message || "Não foi possível deletar o reciclável.");
  }
}

document.addEventListener("DOMContentLoaded", loadRecyclables);