const API_URL = "https://bemaqui-tcc-main.onrender.com";

async function loadWallet() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Faça login primeiro!');
      window.location.href = 'tela_login.html';
      return;
    }

    // Carrega wallet
    const response = await fetch(`${API_URL}/api/user/wallet`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Erro ao carregar carteira');

    const data = await response.json();
    const wallet = data.wallet;

    // Atualiza saldos
    document.getElementById('balance').textContent = `R$ ${wallet.balance.toFixed(2)}`;
    document.getElementById('totalEarned').textContent = wallet.totalEarned.toLocaleString();
    document.getElementById('totalSpent').textContent = wallet.totalSpent.toLocaleString();
    document.getElementById('totalRecycledPoints').textContent = wallet.totalRecycledPoints.toLocaleString();
    document.getElementById('netBalance').textContent = (wallet.balance + wallet.totalRecycledPoints).toLocaleString();

    // Carrega transações
    loadTransactions(token);

  } catch (error) {
    console.error('Erro wallet:', error);
    alert('Erro ao carregar carteira');
  }
}

async function loadTransactions(token) {
  try {
    const response = await fetch(`${API_URL}/api/user/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    renderTransactions(data.transactions || []);

  } catch (error) {
    console.error('Erro transações:', error);
  }
}

function renderTransactions(transactions) {
  const container = document.getElementById('transactionsList');
  
  if (transactions.length === 0) {
    container.innerHTML = '<div class="list-group-item text-center py-4 text-muted">Nenhuma transação</div>';
    return;
  }

  container.innerHTML = transactions.map(t => `
    <div class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <strong>${t.type}</strong> - ${t.description}
        <br><small class="text-muted">${new Date(t.date).toLocaleDateString('pt-BR')}</small>
      </div>
      <span class="${t.amount > 0 ? 'transaction-positive' : 'transaction-negative'} fw-bold">
        ${t.amount > 0 ? '+' : ''}${t.amount}
      </span>
    </div>
  `).join('');
}

function novaTroca() {
  window.location.href = 'tela_beneficiario_trocar.html';
}

// Event listeners
document.getElementById('refreshBtn').onclick = loadWallet;
document.addEventListener('DOMContentLoaded', loadWallet);