const API_URL = "http://localhost:3000";

let allTransactions = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("refreshBtn").addEventListener("click", loadWalletData);
  document.getElementById("novaTrocaBtn").addEventListener("click", novaTroca);
  document.getElementById("searchTransaction").addEventListener("input", filterTransactions);

  loadWalletData();
});

async function loadWalletData() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Faça login primeiro.");
      window.location.href = "tela_login.html";
      return;
    }

    setLoadingState();

    const [walletResponse, transactionsResponse] = await Promise.all([
      fetch(`${API_URL}/api/user/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }),
      fetch(`${API_URL}/api/user/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
    ]);

    const walletData = await walletResponse.json();
    const transactionsData = await transactionsResponse.json();

    if (!walletResponse.ok) {
      console.error("Erro wallet:", walletData);
      throw new Error(walletData.error || "Erro ao carregar carteira.");
    }

    if (!transactionsResponse.ok) {
      console.error("Erro transações:", transactionsData);
      throw new Error(transactionsData.error || "Erro ao carregar transações.");
    }

    const wallet = {
      balance: Number(walletData.wallet?.balance || 0),
      totalSpent: Number(walletData.wallet?.totalSpent || 0),
      totalRecycledPoints: Number(walletData.wallet?.totalRecycledPoints || 0)
    };

    allTransactions = Array.isArray(transactionsData.transactions)
      ? transactionsData.transactions
      : [];

    renderWallet(wallet, allTransactions);
    renderTransactions(allTransactions);

    updateLocalUserWallet(wallet.balance);

  } catch (error) {
    console.error("Erro geral carteira:", error);
    showErrorState("Não foi possível carregar os dados da carteira.");
  }
}

function renderWallet(wallet, transactions) {
  document.getElementById("balance").textContent =
    `${formatNumber(wallet.balance)} moedas`;

  document.getElementById("totalRecycledPoints").textContent =
    formatNumber(wallet.totalRecycledPoints);

  document.getElementById("totalSpent").textContent =
    formatNumber(wallet.totalSpent);

  document.getElementById("totalTransactions").textContent =
    formatNumber(transactions.length);

  document.getElementById("netBalance").textContent =
    formatNumber(wallet.balance);

  const statusText = wallet.balance > 0
    ? "Seu saldo atual está pronto para novas trocas."
    : "Seu saldo está zerado no momento. Recicle para gerar novas moedas.";

  document.getElementById("wallet-status").textContent = statusText;
}

function renderTransactions(transactions) {
  const container = document.getElementById("transactionsList");

  if (!Array.isArray(transactions) || transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        Nenhuma transação encontrada na sua carteira.
      </div>
    `;
    return;
  }

  container.innerHTML = transactions.map((transaction) => {
    const amount = Number(transaction.amount || 0);
    const type = transaction.type || "Movimentação";
    const description = transaction.description || "Sem descrição";
    const date = transaction.date
      ? new Date(transaction.date).toLocaleDateString("pt-BR")
      : "Data indisponível";

    return `
      <div class="transaction-item">
        <div class="transaction-info">
          <h4>${escapeHtml(type)}</h4>
          <p>${escapeHtml(description)}</p>
        </div>

        <div class="transaction-meta">
          <span class="transaction-amount ${amount >= 0 ? "transaction-positive" : "transaction-negative"}">
            ${amount >= 0 ? "+" : ""}${formatNumber(amount)}
          </span>
          <span class="transaction-date">${date}</span>
        </div>
      </div>
    `;
  }).join("");
}

function filterTransactions() {
  const term = document.getElementById("searchTransaction").value.trim().toLowerCase();

  const filtered = allTransactions.filter((transaction) => {
    const type = (transaction.type || "").toLowerCase();
    const description = (transaction.description || "").toLowerCase();
    return type.includes(term) || description.includes(term);
  });

  renderTransactions(filtered);
}

function setLoadingState() {
  document.getElementById("balance").textContent = "Carregando...";
  document.getElementById("totalRecycledPoints").textContent = "...";
  document.getElementById("totalSpent").textContent = "...";
  document.getElementById("totalTransactions").textContent = "...";
  document.getElementById("netBalance").textContent = "...";
  document.getElementById("wallet-status").textContent = "Buscando informações da sua carteira...";
  document.getElementById("transactionsList").innerHTML = `
    <div class="empty-message">Carregando transações...</div>
  `;
}

function showErrorState(message) {
  document.getElementById("wallet-status").textContent = message;
  document.getElementById("transactionsList").innerHTML = `
    <div class="empty-message">${message}</div>
  `;
}

function updateLocalUserWallet(balance) {
  try {
    const storedUser = localStorage.getItem("bemaquiUser");
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    user.wallet = user.wallet || {};
    user.wallet.balance = balance;

    localStorage.setItem("bemaquiUser", JSON.stringify(user));
  } catch (error) {
    console.error("Erro ao atualizar localStorage:", error);
  }
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function novaTroca() {
  window.location.href = "tela_beneficiario_trocar.html";
}