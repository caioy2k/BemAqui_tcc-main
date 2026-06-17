const API_URL = "https://bemaqui-tcc-main.onrender.com";
const CLOUD_NAME = "dkcfcrcyi";
const UPLOAD_PRESET = "bemaqui_unsigned";

const donationForm = document.getElementById("donationForm");
const previewBtn = document.getElementById("previewBtn");
const summaryBox = document.getElementById("summaryBox");
const previewContainer = document.getElementById("previewContainer");
const recentList = document.getElementById("recentList");
const alertBox = document.getElementById("alertBox");
const photoInput = document.getElementById("photos");

let sessionDonations = [];
let currentImages = [];

function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert ${type === "success" ? "alert-success" : "alert-error"}`;
  alertBox.classList.remove("hidden");

  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 4000);
}

function clearErrors() {
  const fields = donationForm.querySelectorAll("input, select, textarea");
  const messages = donationForm.querySelectorAll(".error-message");

  fields.forEach(field => field.classList.remove("input-error"));
  messages.forEach(msg => msg.textContent = "");
}

function setError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = field.parentElement.querySelector(".error-message");
  field.classList.add("input-error");
  if (error) error.textContent = message;
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

function getFormData() {
  return {
    itemName: document.getElementById("itemName").value.trim(),
    category: document.getElementById("category").value,
    quantity: document.getElementById("quantity").value,
    unit: document.getElementById("unit").value,
    expiryDate: document.getElementById("expiryDate").value,
    condition: document.getElementById("condition").value,
    description: document.getElementById("description").value.trim(),
    pickupInfo: document.getElementById("pickupInfo").value.trim()
  };
}

function validateForm() {
  clearErrors();
  const data = getFormData();
  let isValid = true;

  if (!data.itemName) {
    setError("itemName", "Informe o nome do item.");
    isValid = false;
  }

  if (!data.category) {
    setError("category", "Selecione a categoria.");
    isValid = false;
  }

  if (!data.quantity || Number(data.quantity) < 1) {
    setError("quantity", "Informe uma quantidade válida.");
    isValid = false;
  }

  if (!data.unit) {
    setError("unit", "Selecione a unidade.");
    isValid = false;
  }

  if (!data.condition) {
    setError("condition", "Informe o estado do item.");
    isValid = false;
  }

  if (!data.description || data.description.length < 15) {
    setError("description", "Descreva o item com pelo menos 15 caracteres.");
    isValid = false;
  }

  if (!data.pickupInfo) {
    setError("pickupInfo", "Informe como a entrega ou retirada será feita.");
    isValid = false;
  }

  if (currentImages.length === 0) {
    setError("photos", "Envie pelo menos uma foto do item.");
    isValid = false;
  }

  return isValid;
}

function buildSummary(data) {
  const validade = data.expiryDate ? formatDate(data.expiryDate) : "Não informada";

  summaryBox.classList.remove("empty-summary");
  summaryBox.innerHTML = `
    <p><strong>Item:</strong> ${data.itemName}</p>
    <p><strong>Categoria:</strong> ${data.category}</p>
    <p><strong>Quantidade:</strong> ${data.quantity} ${data.unit}</p>
    <p><strong>Validade:</strong> ${validade}</p>
    <p><strong>Estado:</strong> ${data.condition}</p>
    <p><strong>Entrega/retirada:</strong> ${data.pickupInfo}</p>
    <p><strong>Descrição:</strong> ${data.description}</p>
    <p><strong>Fotos enviadas:</strong> ${currentImages.length}</p>
    <span class="status-pill">Pronto para análise</span>
  `;
}

function formatDate(dateString) {
  if (!dateString) return "Data não informada";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    const parts = String(dateString).split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return String(dateString);
  }

  return date.toLocaleDateString("pt-BR");
}

function mapDonationFromApi(item) {
  return {
    _id: item._id,
    itemName: item.itemName,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expiryDate,
    condition: item.condition,
    description: item.description,
    pickupInfo: item.pickupInfo,
    images: item.images || [],
    status: item.status || "Em análise",
    dateLabel: `Enviado em ${formatDate(item.createdAt || item.updatedAt || new Date())}`
  };
}

function renderRecentList() {
  if (sessionDonations.length === 0) {
    recentList.innerHTML = `
      <div class="recent-item empty-item">
        <strong>Nenhum envio ainda</strong>
        <p>As submissões realizadas aparecerão aqui.</p>
      </div>
    `;
    return;
  }

  recentList.innerHTML = "";

  sessionDonations.slice().reverse().forEach(item => {
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;

    const div = document.createElement("div");
    div.className = "recent-item";
    div.innerHTML = `
      ${firstImage ? `<img src="${firstImage}" alt="Foto da doação ${item.itemName}" class="recent-item-image">` : ""}
      <strong>${item.itemName}</strong>
      <p>${item.quantity} ${item.unit} • ${item.category}</p>
      <p>${item.dateLabel}</p>
      <span class="status-pill">${item.status || "Em análise"}</span>
    `;
    recentList.appendChild(div);
  });
}

function resetFormUI() {
  donationForm.reset();
  previewContainer.innerHTML = "";
  currentImages = [];
  summaryBox.className = "summary-box empty-summary";
  summaryBox.innerHTML = `<p>Preencha o formulário e clique em “Visualizar resumo”.</p>`;
  clearErrors();
}

photoInput.addEventListener("change", event => {
  const files = Array.from(event.target.files).slice(0, 4);
  currentImages = files;
  previewContainer.innerHTML = "";

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement("div");
      div.className = "preview-item";
      div.innerHTML = `<img src="${e.target.result}" alt="Pré-visualização da foto do item">`;
      previewContainer.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
});

previewBtn.addEventListener("click", () => {
  if (!validateForm()) {
    showAlert("Revise os campos obrigatórios antes de visualizar o resumo.", "error");
    return;
  }

  const data = getFormData();
  buildSummary(data);
  showAlert("Resumo gerado com sucesso.", "success");
});

async function uploadImagesToCloudinary(files) {
  const uploadedUrls = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Erro ao enviar imagem.");
    }

    uploadedUrls.push(data.secure_url);
  }

  return uploadedUrls;
}

async function loadRecentDonations() {
  try {
    const donorId = getCurrentUserId();

    if (!donorId) {
      renderRecentList();
      return;
    }

    const response = await fetch(`${API_URL}/donations?donorId=${encodeURIComponent(donorId)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar doações.");
    }

    sessionDonations = (data.donations || []).map(mapDonationFromApi);
    renderRecentList();
  } catch (error) {
    console.error("Erro ao carregar envios recentes:", error);
    renderRecentList();
  }
}

donationForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!validateForm()) {
    showAlert("Preencha corretamente os campos obrigatórios.", "error");
    return;
  }

  const data = getFormData();
  buildSummary(data);

  try {
    showAlert("Enviando imagens...", "success");

    const imageUrls = await uploadImagesToCloudinary(currentImages);

    const user = getCurrentUser();

    const payload = {
      donorId: user?._id || user?.id || null,
      itemName: data.itemName,
      category: data.category,
      quantity: Number(data.quantity),
      unit: data.unit,
      expiryDate: data.expiryDate,
      condition: data.condition,
      description: data.description,
      pickupInfo: data.pickupInfo,
      images: imageUrls
    };

    const response = await fetch(`${API_URL}/donations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erro ao salvar doação.");
    }

    const savedDonation = result.donation
      ? mapDonationFromApi(result.donation)
      : {
          ...payload,
          status: "Em análise",
          dateLabel: `Enviado em ${new Date().toLocaleDateString("pt-BR")}`
        };

    sessionDonations.push(savedDonation);
    renderRecentList();
    resetFormUI();
    showAlert("Doação enviada para análise com sucesso.", "success");
  } catch (error) {
    console.error("Erro ao enviar doação:", error);
    showAlert(error.message || "Erro ao enviar doação.", "error");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadRecentDonations();
});
