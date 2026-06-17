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
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
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
    const div = document.createElement("div");
    div.className = "recent-item";
    div.innerHTML = `
      <strong>${item.itemName}</strong>
      <p>${item.quantity} ${item.unit} • ${item.category}</p>
      <p>${item.dateLabel}</p>
      <span class="status-pill">Em análise</span>
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

    const storedUser = localStorage.getItem("bemaquiUser");
    const user = storedUser ? JSON.parse(storedUser) : null;

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

    const newDonation = {
      ...payload,
      status: "Em análise",
      dateLabel: `Enviado em ${new Date().toLocaleDateString("pt-BR")}`
    };

    sessionDonations.push(newDonation);
    renderRecentList();
    resetFormUI();
    showAlert("Doação enviada para análise com sucesso.", "success");
  } catch (error) {
    console.error("Erro ao enviar doação:", error);
    showAlert(error.message || "Erro ao enviar doação.", "error");
  }
});

renderRecentList();
