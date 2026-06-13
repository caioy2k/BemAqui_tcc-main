const API_URL = 'https://bemaqui-tcc-main.onrender.com/api/benefits';

const benefitsContainer = document.getElementById('benefits-container');
const emptyState = document.getElementById('empty-state');
const formModal = document.getElementById('form-modal');
const benefitForm = document.getElementById('benefit-form');

const modalBadge = document.querySelector('.modal-header .section-badge, .modal-header .panel-tag');
const modalTitle = document.querySelector('.modal-header h2');
const submitButton = benefitForm.querySelector('button[type="submit"]');

let editingBenefitId = null;
let benefits = [];

document.addEventListener('DOMContentLoaded', () => {
  loadBenefits();
  setupForm();
});

function getToken() {
  return localStorage.getItem('token');
}

async function parseResponse(response) {
  const rawText = await response.text();

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    if (rawText.trim().startsWith('<')) {
      throw new Error('A rota chamada retornou HTML em vez de JSON. Verifique se a URL da API está correta.');
    }
    throw new Error('A resposta da API não está em JSON válido.');
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Erro na requisição.');
  }

  return data;
}

function setCreateMode() {
  editingBenefitId = null;
  benefitForm.reset();

  if (modalBadge) {
    modalBadge.textContent = 'Novo benefício';
  }

  if (modalTitle) {
    modalTitle.textContent = 'Cadastrar benefício';
  }

  if (submitButton) {
    submitButton.textContent = 'Cadastrar';
  }
}

function setEditMode(benefit) {
  editingBenefitId = benefit._id;

  if (modalBadge) {
    modalBadge.textContent = 'Editar benefício';
  }

  if (modalTitle) {
    modalTitle.textContent = 'Editar benefício';
  }

  document.getElementById('name').value = benefit.name || '';
  document.getElementById('category').value = benefit.category || '';
  document.getElementById('description').value = benefit.description || '';
  document.getElementById('pointsCost').value = Number(benefit.pointsCost || 0);
  document.getElementById('quantity').value = Number(benefit.quantity || 0);

  if (submitButton) {
    submitButton.textContent = 'Salvar alterações';
  }
}

function openFormModal(benefit = null) {
  if (benefit) {
    setEditMode(benefit);
  } else {
    setCreateMode();
  }

  formModal.classList.remove('hidden');
}

function closeFormModal() {
  formModal.classList.add('hidden');
  setCreateMode();
}

function setupForm() {
  benefitForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      alert('Você precisa estar autenticado para realizar esta ação.');
      return;
    }

    const payload = {
      name: document.getElementById('name').value.trim(),
      category: document.getElementById('category').value,
      description: document.getElementById('description').value.trim(),
      pointsCost: Number(document.getElementById('pointsCost').value),
      quantity: Number(document.getElementById('quantity').value)
    };

    const isEditing = Boolean(editingBenefitId);
    const url = isEditing ? `${API_URL}/${editingBenefitId}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await parseResponse(response);

      alert(
        data.message ||
        (isEditing ? 'Benefício atualizado com sucesso.' : 'Benefício cadastrado com sucesso.')
      );

      closeFormModal();
      loadBenefits();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Erro ao salvar benefício.');
    }
  });
}

async function loadBenefits() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await parseResponse(response);

    benefits = data.benefits || data.data || [];
    renderBenefits(benefits);
  } catch (error) {
    console.error(error);
    benefitsContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.innerHTML = `<p>${error.message || 'Erro ao carregar benefícios.'}</p>`;
  }
}

function renderBenefits(benefitsList) {
  benefitsContainer.innerHTML = '';

  if (!benefitsList.length) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  benefitsList.forEach((benefit) => {
    const card = document.createElement('article');
    card.className = 'benefit-card';

    const status = benefit.status || (benefit.quantity > 0 ? 'ativo' : 'inativo');

    card.innerHTML = `
      <div class="benefit-card-header">
        <div>
          <h4 class="benefit-card-title">${benefit.name || '-'}</h4>
          <span class="benefit-badge">${benefit.category || '-'}</span>
        </div>
        <span class="benefit-status ${status === 'ativo' ? 'is-active' : 'is-inactive'}">
          ${status}
        </span>
      </div>

      <p class="benefit-description">${benefit.description || 'Sem descrição.'}</p>

      <div class="benefit-meta">
        <div class="benefit-meta-item">
          <span>Pontos necessários</span>
          <strong>${Number(benefit.pointsCost || 0)} pts</strong>
        </div>
        <div class="benefit-meta-item">
          <span>Quantidade</span>
          <strong>${Number(benefit.quantity || 0)} unidades</strong>
        </div>
      </div>

      <div class="benefit-actions">
        <button class="action-btn-item" data-action="edit" type="button">Editar</button>
        <button class="action-btn-item delete" data-action="delete" type="button">Excluir</button>
      </div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener('click', () => {
      const selectedBenefit = benefits.find((item) => item._id === benefit._id) || benefit;
      openFormModal(selectedBenefit);
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      deleteBenefit(benefit._id, benefit.name);
    });

    benefitsContainer.appendChild(card);
  });
}

async function deleteBenefit(id, name) {
  const confirmed = window.confirm(`Deseja excluir o benefício "${name}"?`);

  if (!confirmed) return;

  const token = getToken();

  if (!token) {
    alert('Você precisa estar autenticado para realizar esta ação.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await parseResponse(response);

    alert(data.message || 'Benefício excluído com sucesso.');
    loadBenefits();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Erro ao excluir benefício.');
  }
}