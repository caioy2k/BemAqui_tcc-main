const API_BASE = 'http://localhost:3000/api';  // Ajuste para produção
let token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';  // Redireciona se sem token
}

const headers = { 'Authorization': `Bearer ${token}` };

// Carrega dados da carteira ao iniciar
document.addEventListener('DOMContentLoaded', loadWallet);

async function loadWallet() {
  try {
    const walletRes = await fetch(`${API_BASE}/user/wallet`, { headers });
    const walletData = await walletRes.json();
    if (walletData.success) {
      document.getElementById('balance').textContent = walletData.wallet.balance;
      document.getElementById('totalEarned').textContent = walletData.wallet.totalEarned;
      document.getElementById('totalSpent').textContent = walletData.wallet.totalSpent;
    }

    const transRes = await fetch(`${API_BASE}/user/transactions`, { headers });
    const transData = await transRes.json();
    if (transData.success) {
      displayTransactions(transData.transactions);
    }
  } catch (error) {
    console.error('Erro ao carregar carteira:', error);
    document.getElementById('transactionsList').innerHTML = 'Erro ao carregar dados.';
  }
}

function displayTransactions(transactions) {
  const list = document.getElementById('transactionsList');
  if (!transactions || transactions.length === 0) {
    list.innerHTML = '<p>Nenhuma transação ainda.</p>';
    return;
  }
  // Na função displayTransactions, adicione botão confirmar:
list.innerHTML = transactions.slice(0, 5).map(t => `
  <div class="transaction">
    <div class="trans-details">
      <div>${t.status === 'pendente' ? '⏳ Pendente' : '✅ Confirmado'}</div>
      <small>${new Date(t.date).toLocaleDateString('pt-BR')}</small>
    </div>
    ${t.status === 'pendente' ? 
      `<button onclick="confirmTrade('${t._id}')" class="btn-confirm">Confirmar</button>` : 
      `<div class="trans-amount">±${t.totalRecyclingPoints - t.totalBenefitCost}</div>`
    }
  </div>
`).join('');
}

function novaTroca() {
  window.location.href = 'tela_beneficiario_trocar.html';
}

function verCatalogo() {
  window.location.href = 'catalogo.html';  // Ajuste para sua tela de catálogo
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}


async function confirmTrade(tradeId) {
  if (!confirm('Confirmar troca e receber moedas?')) return;
  
  try {
    const res = await fetch(`${API_BASE}/trade/confirm-trade/${tradeId}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
    
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      loadWallet();  // Recarrega carteira
    }
  } catch (error) {
    alert('Erro ao confirmar');
  }
}
