const API_URL = "http://localhost:3000";
let allTrades = [];
let filteredTrades = [];
let currentTradeId = null;

// ✅ CORRIGIDO: usa tabela do HTML!
const tbody = document.querySelector('#tradesTable tbody');
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const tradeModal = document.getElementById("trade-modal");
const tradeDetailsDiv = document.getElementById("trade-details");
const modalActions = document.getElementById("modal-actions");

function getAuthHeader() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado.");
    throw new Error("Token não encontrado");
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

// ✅ CORRIGIDO: popula TABELA (não cards)
async function displayTrades(data) {
  console.log('✅ Dados recebidos:', data);
  
  const trades = data.trades || data || [];
  
  // ✅ USA tbody da tabela!
  if (!tbody) {
    console.error('❌ Tabela não encontrada');
    return;
  }

  tbody.innerHTML = '';

  if (!Array.isArray(trades) || trades.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4"><em>Nenhuma troca pendente</em></td></tr>';
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  trades.forEach((trade) => {
    const row = tbody.insertRow();
    const beneficiaryName = trade.beneficiaryId?.name || "Desconhecido";
    
    row.innerHTML = `
      <td>${beneficiaryName}</td>
      <td>${trade.recyclablesOffered?.map(r => `${r.quantity}x ${r.recyclableName}`).join(', ') || 'Nenhum'}</td>
      <td>${trade.benefitsRequested?.map(b => `${b.quantity}x ${b.benefitName}`).join(', ') || 'Nenhum'}</td>
      <td>${trade.totalPointsOffered || 0}</td>
      <td>${trade.coinsSurplus || 0}</td>
      <td><span class="badge bg-warning">Pendente</span></td>
      <td>
        <button class="btn btn-sm btn-success me-1" onclick="openTradeModal('${trade._id}')">👁️</button>
        <button class="btn btn-sm btn-outline-success" onclick="approveTrade('${trade._id}')">✅</button>
        <button class="btn btn-sm btn-outline-danger" onclick="rejectTrade('${trade._id}')">❌</button>
      </td>
    `;
  });
}

// REMOVA renderTrades() e applyFilters() - não usa mais!

async function loadTrades() {
  try {
    const response = await fetch(`${API_URL}/trades`, {
      headers: getAuthHeader()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const trades = await response.json();
    displayTrades(trades);
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro: ' + error.message);
  }
}

async function approveTrade(tradeId) {
  try {
    const response = await fetch(`${API_URL}/trades/${tradeId}/approve`, {
      method: "PATCH",
      headers: getAuthHeader(),
    });
    
    if (response.ok) {
      alert("✅ Troca aprovada!");
      loadTrades();
    } else {
      alert("Erro ao aprovar.");
    }
  } catch (error) {
    alert("Erro de conexão.");
  }
}

async function rejectTrade(tradeId) {
  const reason = prompt("Motivo da recusa:");
  try {
    const response = await fetch(`${API_URL}/trades/${tradeId}/reject`, {
      method: "PATCH",
      headers: getAuthHeader(),
      body: JSON.stringify({ reason }),
    });
    
    if (response.ok) {
      alert("❌ Troca recusada.");
      loadTrades();
    } else {
      alert("Erro ao recusar.");
    }
  } catch (error) {
    alert("Erro de conexão.");
  }
}

function openTradeModal(tradeId) {
  alert(`Abrir modal da troca ${tradeId}`); // Temporário
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loadTradesBtn").onclick = loadTrades;
});