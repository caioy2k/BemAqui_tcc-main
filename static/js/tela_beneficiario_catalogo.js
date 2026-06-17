const API_URL = "https://bemaqui-tcc-main.onrender.com";

let allBenefits = [];
let filteredBenefits = [];

const catalogGrid = document.getElementById("catalog-grid");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const resultsCount = document.getElementById("results-count");
const emptyState = document.getElementById("empty-state");
const walletBalance = document.getElementById("wallet-balance");

document.addEventListener("DOMContentLoaded", async () => {
  loadWallet();
  await loadBenefits();

  searchInput.addEventListener("input", applyFilters);
  categoryFilter.addEventListener("change", applyFilters);
});

function loadWallet() {
  try {
    const storedUser = localStorage.getItem("bemaquiUser");
    if (!storedUser) {
      walletBalance.textContent = "0 moedas";
      return;
    }

    const user = JSON.parse(storedUser);
    const balance = user?.wallet?.balance || 0;
    walletBalance.textContent = `${balance} moedas`;
  } catch (error) {
    console.error("Erro ao carregar carteira:", error);
    walletBalance.textContent = "0 moedas";
  }
}

async function loadBenefits() {
  try {
    catalogGrid.innerHTML = `<div class="loading">Carregando catálogo...</div>`;

    const response = await fetch(`${API_URL}/benefits`);
    if (!response.ok) {
      throw new Error("Erro ao buscar benefícios");
    }

    const data = await response.json();
    allBenefits = data.benefits || [];
    filteredBenefits = [...allBenefits];

    populateCategories(allBenefits);
    renderCatalog(filteredBenefits);
  } catch (error) {
    console.error("Erro ao carregar catálogo:", error);
    catalogGrid.innerHTML = `<div class="error-message">Erro ao carregar os itens do catálogo.</div>`;
    resultsCount.textContent = "Falha ao carregar itens";
  }
}

function populateCategories(items) {
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

  categoryFilter.innerHTML = `<option value="todos">Todas</option>`;

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  filteredBenefits = allBenefits.filter(item => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "todos" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  renderCatalog(filteredBenefits);
}

function renderCatalog(items) {
  catalogGrid.innerHTML = "";

  resultsCount.textContent = `${items.length} item(ns) encontrado(s)`;

  if (items.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "catalog-card";

    const imageEmoji = item.emoji || "🎁";

    card.innerHTML = `
      <div class="card-image">${imageEmoji}</div>

      <div class="card-content">
        <span class="card-category">${item.category || "Sem categoria"}</span>
        <h3 class="card-title">${item.name || "Item sem nome"}</h3>
        <p class="card-description">
          ${item.description || "Item disponível para troca no catálogo BemAqui."}
        </p>

        <div class="card-footer">
          <span class="card-price">${item.pointsCost || item.coinsCost || 0} moedas</span>
          <button class="card-button" onclick="selectBenefit('${item._id}')">
            Ver item
          </button>
        </div>
      </div>
    `;

    catalogGrid.appendChild(card);
  });
}

function selectBenefit(id) {
  const selectedItem = allBenefits.find(item => item._id === id);

  if (!selectedItem) {
    alert("Item não encontrado.");
    return;
  }

  localStorage.setItem("selectedBenefit", JSON.stringify(selectedItem));

  alert(`Item selecionado: ${selectedItem.name}`);
  // depois você pode trocar isso por:
  // window.location.href = "tela_beneficiario_trocar.html";
}