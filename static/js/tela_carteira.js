const API_URL = "https://bemaqui-tcc-main.onrender.com";

async function loadWallet() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Faça login primeiro!');
      window.location.href = 'tela_login.html';
      return;
    }

    const response = await fetch(`${API_URL}/api/user/wallet`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resposta da API:', data);
      throw new Error(data.error || 'Erro ao carregar carteira');
    }

    const wallet = {
      balance: data.wallet?.balance || 0,
      totalEarned: data.wallet?.totalEarned || 0,
      totalSpent: data.wallet?.totalSpent || 0,
      totalRecycledPoints: data.wallet?.totalRecycledPoints || 0,
      transactions: data.wallet?.transactions || []
    };

    document.getElementById('balance').textContent = `R$ ${wallet.balance.toFixed(2)}`;
    document.getElementById('totalEarned').textContent = wallet.totalEarned.toLocaleString('pt-BR');
    document.getElementById('totalSpent').textContent = wallet.totalSpent.toLocaleString('pt-BR');
    document.getElementById('totalRecycledPoints').textContent = wallet.totalRecycledPoints.toLocaleString('pt-BR');
    document.getElementById('netBalance').textContent = (wallet.balance + wallet.totalRecycledPoints).toLocaleString('pt-BR');

    renderTransactions(wallet.transactions);
    await loadTransactions(token);

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