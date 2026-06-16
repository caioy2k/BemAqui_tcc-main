const API_URL = "https://bemaqui-tcc-main.onrender.com";

let recyclables = [];
let benefits = [];
let selectedRecyclables = [];
let selectedBenefits = [];
let currentWalletBalance = 0;

const recyclablesContainer = document.getElementById("recyclables-container");
const benefitsContainer = document.getElementById("benefits-container");
const selectedRecyclablesList = document.getElementById("selected-recyclables");
const selectedBenefitsList = document.getElementById("selected-benefits");
const offeredPointsSpan = document.getElementById("offered-points");
const requestedPointsSpan = document.getElementById("requested-points");
const comparisonOfferedSpan = document.getElementById("comparison-offered");
const comparisonRequestedSpan = document.getElementById("comparison-requested");
const comparisonStatus = document.getElementById("comparison-status");
const confirmBtn = document.getElementById("confirm-trade-btn");
const walletTradeBtn = document.getElementById("wallet-trade-btn");
const walletBalanceDisplay = document.getElementById("wallet-balance-display");

function updateWalletDisplay() {
  if (walletBalanceDisplay) {
    walletBalanceDisplay.textContent = `${currentWalletBalance} moedas`;
  }
}

async function loadUserWallet() {
  try {
    const storedUser = localStorage.getItem("bemaquiUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      currentWalletBalance = user?.wallet?.balance || 0;
    }
  } catch (error) {
    console.error("Erro ao carregar saldo da carteira:", error);
    currentWalletBalance = 0;
  } finally {
    updateWalletDisplay();
  }
}

async function loadItems() {
  try {
    console.log("Carregando itens...");

    const recyclablesRes = await fetch(`${API_URL}/recyclables`);
    const benefitsRes = await fetch(`${API_URL}/benefits`);

    if (!recyclablesRes.ok || !benefitsRes.ok) {
      throw new Error("Erro na resposta do servidor");
    }

    const recyclablesData = await recyclablesRes.json();
    const benefitsData = await benefitsRes.json();

    console.log("Recicláveis:", recyclablesData);
    console.log("Benefícios:", benefitsData);

    recyclables = recyclablesData.recyclables || [];
    benefits = benefitsData.benefits || [];

    renderRecyclables();
    renderBenefits();
    updateUI();
  } catch (error) {
    console.error("Erro ao carregar itens:", error);
    alert("Erro ao carregar itens para troca. Verifique o console.");
  }
}

function getSelectedRecyclablesPoints() {
  return selectedRecyclables.reduce(
    (sum, item) => sum + item.pointsValue * item.quantity,
    0
  );
}

function getSelectedBenefitsPoints() {
  return selectedBenefits.reduce(
    (sum, item) => sum + item.pointsCost * item.quantity,
    0
  );
}

function getFirstSelectedBenefitTotal() {
  if (selectedBenefits.length === 0) return 0;
  return selectedBenefits[0].pointsCost * selectedBenefits[0].quantity;
}

function getWalletCoverage(cost, walletBalance) {
  return {
    walletUsed: Math.min(walletBalance, cost),
    remainingCost: Math.max(0, cost - Math.min(walletBalance, cost)),
  };
}

function renderRecyclables() {
  recyclablesContainer.innerHTML = "";

  if (recyclables.length === 0) {
    recyclablesContainer.innerHTML = "<p>Nenhum reciclável disponível</p>";
    return;
  }

  recyclables.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.id = `recyclable-${item._id}`;
    card.innerHTML = `
      <div class="item-emoji">♻️</div>
      <div class="item-name">${item.name}</div>
      <div class="item-type">${item.type}</div>
      <div class="item-points">${item.pointsValue} pts</div>
    `;
    card.onclick = () => toggleRecyclable(item);
    recyclablesContainer.appendChild(card);
  });
}

function renderBenefits() {
  benefitsContainer.innerHTML = "";

  if (benefits.length === 0) {
    benefitsContainer.innerHTML = "<p>Nenhum benefício disponível</p>";
    return;
  }

  benefits.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.id = `benefit-${item._id}`;
    card.innerHTML = `
      <div class="item-emoji">🎁</div>
      <div class="item-name">${item.name}</div>
      <div class="item-type">${item.category}</div>
      <div class="item-points">${item.pointsCost} pts</div>
    `;
    card.onclick = () => toggleBenefit(item);
    benefitsContainer.appendChild(card);
  });
}

function toggleRecyclable(item) {
  const index = selectedRecyclables.findIndex((r) => r._id === item._id);

  if (index > -1) {
    selectedRecyclables.splice(index, 1);
  } else {
    selectedRecyclables.push({
      _id: item._id,
      name: item.name,
      pointsValue: item.pointsValue,
      quantity: 1,
    });
  }

  updateRecyclablesDisplay();
  updateUI();
}

function toggleBenefit(item) {
  const index = selectedBenefits.findIndex((b) => b._id === item._id);

  if (index > -1) {
    selectedBenefits.splice(index, 1);
  } else {
    selectedBenefits.push({
      _id: item._id,
      name: item.name,
      pointsCost: item.pointsCost,
      quantity: 1,
    });
  }

  updateBenefitsDisplay();
  updateUI();
}

function updateRecyclablesDisplay() {
  document.querySelectorAll('[id^="recyclable-"]').forEach((c) => c.classList.remove("selected"));
  selectedRecyclables.forEach((item) => {
    const c = document.getElementById(`recyclable-${item._id}`);
    if (c) c.classList.add("selected");
  });

  selectedRecyclablesList.innerHTML = "";

  if (selectedRecyclables.length === 0) {
    selectedRecyclablesList.innerHTML = '<p class="placeholder">Nenhum item selecionado</p>';
    return;
  }

  selectedRecyclables.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "selected-item";
    row.innerHTML = `
      <span class="selected-item-name">${item.name}</span>
      <div class="selected-item-qty">
        <button class="qty-btn" onclick="changeQty('recyclable', ${index}, -1)">−</button>
        <input type="number" class="qty-input" value="${item.quantity}" min="1" onchange="setQty('recyclable', ${index}, this.value)" />
        <button class="qty-btn" onclick="changeQty('recyclable', ${index}, 1)">+</button>
        <button class="remove-btn" onclick="removeItem('recyclable', ${index})">✕</button>
      </div>
    `;
    selectedRecyclablesList.appendChild(row);
  });
}

function updateBenefitsDisplay() {
  document.querySelectorAll('[id^="benefit-"]').forEach((c) => c.classList.remove("selected"));
  selectedBenefits.forEach((item) => {
    const c = document.getElementById(`benefit-${item._id}`);
    if (c) c.classList.add("selected");
  });

  selectedBenefitsList.innerHTML = "";

  if (selectedBenefits.length === 0) {
    selectedBenefitsList.innerHTML = '<p class="placeholder">Nenhum item selecionado</p>';
    return;
  }

  selectedBenefits.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "selected-item";
    row.innerHTML = `
      <span class="selected-item-name">${item.name}</span>
      <div class="selected-item-qty">
        <button class="qty-btn" onclick="changeQty('benefit', ${index}, -1)">−</button>
        <input type="number" class="qty-input" value="${item.quantity}" min="1" onchange="setQty('benefit', ${index}, this.value)" />
        <button class="qty-btn" onclick="changeQty('benefit', ${index}, 1)">+</button>
        <button class="remove-btn" onclick="removeItem('benefit', ${index})">✕</button>
      </div>
    `;
    selectedBenefitsList.appendChild(row);
  });
}

function changeQty(type, index, change) {
  const array = type === "recyclable" ? selectedRecyclables : selectedBenefits;
  array[index].quantity = Math.max(1, array[index].quantity + change);

  if (type === "recyclable") {
    updateRecyclablesDisplay();
  } else {
    updateBenefitsDisplay();
  }

  updateUI();
}

function setQty(type, index, value) {
  const qty = Math.max(1, parseInt(value) || 1);
  const array = type === "recyclable" ? selectedRecyclables : selectedBenefits;
  array[index].quantity = qty;

  if (type === "recyclable") {
    updateRecyclablesDisplay();
  } else {
    updateBenefitsDisplay();
  }

  updateUI();
}

function removeItem(type, index) {
  if (type === "recyclable") {
    selectedRecyclables.splice(index, 1);
    updateRecyclablesDisplay();
  } else {
    selectedBenefits.splice(index, 1);
    updateBenefitsDisplay();
  }
  updateUI();
}

function updateUI() {
  const offeredPoints = getSelectedRecyclablesPoints();
  const requestedPoints = getSelectedBenefitsPoints();

  updateWalletDisplay();

  offeredPointsSpan.textContent = offeredPoints;
  requestedPointsSpan.textContent = requestedPoints;
  comparisonOfferedSpan.textContent = offeredPoints;
  comparisonRequestedSpan.textContent = requestedPoints;

  if (selectedBenefits.length === 0) {
    comparisonStatus.textContent = "Selecione um benefício";
    comparisonStatus.className = "status-warning";
    confirmBtn.disabled = true;
    walletTradeBtn.style.display = "none";
    return;
  }

  walletTradeBtn.style.display = "block";

  const totalCost = getSelectedBenefitsPoints();
  const { walletUsed, remainingCost } = getWalletCoverage(totalCost, currentWalletBalance);

  if (selectedRecyclables.length > 0 && offeredPoints >= requestedPoints) {
    comparisonStatus.textContent = "✓ Troca tradicional possível!";
    comparisonStatus.className = "status-ok";
    confirmBtn.disabled = false;
  } else {
    confirmBtn.disabled = true;
  }

  if (currentWalletBalance >= totalCost) {
    comparisonStatus.textContent = `✓ Sua carteira cobre o valor total (${walletUsed} moedas).`;
    comparisonStatus.className = "status-ok";
    walletTradeBtn.disabled = false;
    walletTradeBtn.textContent = "Realizar Troca";
    return;
  }

  if (selectedRecyclables.length === 0) {
    comparisonStatus.textContent = `Sua carteira cobre ${walletUsed} e faltam ${remainingCost} moedas em recicláveis.`;
    comparisonStatus.className = "status-warning";
    walletTradeBtn.disabled = false;
    walletTradeBtn.textContent = "Realizar Troca";
    return;
  }

  if (offeredPoints >= remainingCost) {
    comparisonStatus.textContent = `✓ Carteira cobre ${walletUsed} e recicláveis completam o restante (${remainingCost}).`;
    comparisonStatus.className = "status-ok";
    walletTradeBtn.disabled = false;
    walletTradeBtn.textContent = "Realizar troca";
  } else {
    comparisonStatus.textContent = `✗ Faltam ${remainingCost - offeredPoints} moedas em recicláveis para completar a troca.`;
    comparisonStatus.className = "status-warning";
    walletTradeBtn.disabled = false;
    walletTradeBtn.textContent = "Realizar Troca";
  }
}

walletTradeBtn.addEventListener("click", async () => {
  if (selectedBenefits.length === 0) {
    alert("Selecione um benefício primeiro!");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  const selectedBenefit = selectedBenefits[0];
  const totalCost = getSelectedBenefitsPoints();
  const offeredPoints = getSelectedRecyclablesPoints();
  const balanceBeforePurchase = currentWalletBalance;
  const { remainingCost } = getWalletCoverage(totalCost, currentWalletBalance);

  try {
    walletTradeBtn.disabled = true;
    walletTradeBtn.textContent = "Processando...";

    let response;

    if (currentWalletBalance >= totalCost) {
      response = await fetch(`${API_URL}/trade/buy-with-wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          benefitId: selectedBenefit._id,
          quantity: selectedBenefit.quantity,
        }),
      });
    } else {
      if (selectedRecyclables.length === 0) {
        alert("Selecione recicláveis para completar o valor restante.");
        return;
      }

      if (offeredPoints < remainingCost) {
        alert(`Faltam ${remainingCost - offeredPoints} moedas em recicláveis para completar a troca.`);
        return;
      }

      response = await fetch(`${API_URL}/trade/buy-with-wallet-and-recyclables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          benefitId: selectedBenefit._id,
          quantity: selectedBenefit.quantity,
          recyclablesOffered: selectedRecyclables.map((item) => ({
            recyclableId: item._id,
            recyclableName: item.name,
            quantity: item.quantity,
            pointsPerUnit: item.pointsValue,
          })),
        }),
      });
    }

    const data = await response.json();

    if (response.ok) {
      currentWalletBalance = data.walletBalanceAfter ?? data.walletBalance ?? currentWalletBalance;
      updateWalletDisplay();

      try {
        const storedUser = localStorage.getItem("bemaquiUser");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.wallet = user.wallet || {};
          user.wallet.balance = currentWalletBalance;
          localStorage.setItem("bemaquiUser", JSON.stringify(user));
        }
      } catch (error) {
        console.error("Erro ao atualizar usuário no localStorage:", error);
      }

      showWalletPurchaseModal({
        benefitName: selectedBenefit.name,
        quantity: selectedBenefit.quantity,
        totalCost,
        walletUsed: data.walletUsed ?? Math.min(balanceBeforePurchase, totalCost),
        recyclingPointsUsed: data.recyclingPointsUsed ?? (balanceBeforePurchase >= totalCost ? 0 : remainingCost),
        recyclingPointsGenerated: data.recyclingPointsGenerated ?? offeredPoints,
        coinsSurplus: data.coinsSurplus ?? 0,
        walletBalance: currentWalletBalance,
        tradeId: data.tradeId,
        isHybrid: balanceBeforePurchase < totalCost || selectedRecyclables.length > 0,
      });

      selectedBenefits = [];
      selectedRecyclables = [];
      updateBenefitsDisplay();
      updateRecyclablesDisplay();
      updateUI();
    } else {
      alert(data.error || "Erro ao realizar compra.");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível realizar a compra.");
  } finally {
    walletTradeBtn.disabled = false;
    updateUI();
  }
});

function showWalletPurchaseModal(trade) {
  const modal = document.createElement("div");
  modal.className = "confirmation-modal";

  const walletInfo = trade.isHybrid
    ? `
      <p class="points-info">
        💳 Usado da carteira: <strong>${trade.walletUsed}</strong><br>
        ♻️ Usado em recicláveis: <strong>${trade.recyclingPointsUsed}</strong><br>
        🎯 Total do benefício: <strong>${trade.totalCost}</strong><br>
        ${trade.coinsSurplus > 0 ? `🪙 Sobra creditada: <strong>${trade.coinsSurplus}</strong><br>` : ""}
        💰 Novo saldo: <strong>${trade.walletBalance}</strong>
      </p>
    `
    : `
      <p class="points-info">
        💰 Moedas gastas: <strong>${trade.totalCost}</strong><br>
        💳 Novo saldo: <strong>${trade.walletBalance}</strong>
      </p>
    `;

  modal.innerHTML = `
    <div class="confirmation-card">
      <div class="confirmation-header">
        <div class="success-icon">✓</div>
        <h2>${trade.isHybrid ? "Troca Híbrida Realizada!" : "Compra Realizada com Sucesso!"}</h2>
      </div>

      <div class="confirmation-body">
        <div class="trade-info">
          <div class="info-section">
            <h3>🎁 Você recebeu:</h3>
            <div class="items-list">
              <div class="item">
                <span>${trade.benefitName}</span>
                <span class="qty">x${trade.quantity}</span>
              </div>
            </div>
            ${walletInfo}
          </div>
        </div>

        <div class="confirmation-details">
          <div class="detail">
            <span>ID da Troca:</span>
            <strong>${trade.tradeId?.substring(0, 8).toUpperCase() || "IMEDIATO"}</strong>
          </div>
          <div class="detail">
            <span>Status:</span>
            <strong class="status-completed">✅ Concluída</strong>
          </div>
        </div>

        <div class="next-steps">
          <h4>✅ O que fazer agora:</h4>
          <ul>
            <li>Procure um ponto de coleta parceiro</li>
            <li>Apresente o ID da troca</li>
            <li>Retire seu benefício</li>
          </ul>
        </div>
      </div>

      <div class="confirmation-footer">
        <button onclick="closeConfirmationModal()" class="btn-close">OK, Entendi!</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeConfirmationModal();
    }
  });
}

confirmBtn.addEventListener("click", async () => {
  const storedUser = localStorage.getItem("bemaquiUser");
  const token = localStorage.getItem("token");

  if (!storedUser || !token) {
    alert("Você precisa estar logado.");
    return;
  }

  const tradeData = {
    recyclablesOffered: selectedRecyclables.map((item) => ({
      recyclableId: item._id,
      recyclableName: item.name,
      quantity: item.quantity,
      pointsPerUnit: item.pointsValue,
    })),
    benefitsRequested: selectedBenefits.map((item) => ({
      benefitId: item._id,
      benefitName: item.name,
      quantity: item.quantity,
      pointsCost: item.pointsCost,
    })),
  };

  try {
    const response = await fetch(`${API_URL}/trade/create-trade-type1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(tradeData),
    });

    const data = await response.json();

    if (response.ok) {
      showConfirmationModal({
        recyclablesOffered: selectedRecyclables.map((r) => ({
          recyclableName: r.name,
          quantity: r.quantity,
        })),
        benefitsRequested: selectedBenefits.map((b) => ({
          benefitName: b.name,
          quantity: b.quantity,
        })),
        totalPointsOffered: getSelectedRecyclablesPoints(),
        totalPointsRequested: getSelectedBenefitsPoints(),
        _id: data.tradeId || data._id || "SUCESSO_" + Date.now(),
      });

      selectedRecyclables = [];
      selectedBenefits = [];
      updateRecyclablesDisplay();
      updateBenefitsDisplay();
      updateUI();
    } else {
      alert(data.error || "Erro ao realizar troca.");
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Não foi possível realizar a troca.");
  }
});

function showConfirmationModal(trade) {
  console.log("🔍 DEBUG trade:", trade);

  if (!trade) {
    alert("Erro: Dados da troca não encontrados!");
    return;
  }

  const modal = document.createElement("div");
  modal.className = "confirmation-modal";
  modal.innerHTML = `
    <div class="confirmation-card">
      <div class="confirmation-header">
        <div class="success-icon">✓</div>
        <h2>Troca Registrada com Sucesso!</h2>
      </div>

      <div class="confirmation-body">
        <div class="trade-info">
          <div class="info-section">
            <h3>📦 Você está ofertando:</h3>
            <div class="items-list">
              ${trade.recyclablesOffered
                .map(
                  (item) =>
                    `<div class="item"><span>${item.recyclableName}</span><span class="qty">x${item.quantity}</span></div>`
                )
                .join("")}
            </div>
            <p class="points-info">Total: <strong>${trade.totalPointsOffered} pontos</strong></p>
          </div>

          <div class="exchange-arrow">↓ TROCA POR ↓</div>

          <div class="info-section">
            <h3>🎁 Você vai receber:</h3>
            <div class="items-list">
              ${trade.benefitsRequested
                .map(
                  (item) =>
                    `<div class="item"><span>${item.benefitName}</span><span class="qty">x${item.quantity}</span></div>`
                )
                .join("")}
            </div>
            <p class="points-info">Total: <strong>${trade.totalPointsRequested} pontos</strong></p>
          </div>
        </div>

        <div class="confirmation-details">
          <div class="detail">
            <span>ID da Troca:</span>
            <strong>${trade._id.substring(0, 8).toUpperCase()}</strong>
          </div>
          <div class="detail">
            <span>Status:</span>
            <strong class="status-pending">Aguardando Aprovação</strong>
          </div>
        </div>

        <div class="next-steps">
          <h4>Próximos passos:</h4>
          <ol>
            <li>Aguarde a aprovação do administrador</li>
            <li>Compareça a um de nossos pontos de coleta</li>
            <li>Apresente o ID da troca ao funcionário</li>
            <li>Realize a troca pessoalmente</li>
          </ol>
        </div>
      </div>

      <div class="confirmation-footer">
        <button onclick="closeConfirmationModal()" class="btn-close">
          OK, Entendi!
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeConfirmationModal();
    }
  });
}

function closeConfirmationModal() {
  const modal = document.querySelector(".confirmation-modal");
  if (modal) {
    modal.remove();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadUserWallet();
  await loadItems();
});