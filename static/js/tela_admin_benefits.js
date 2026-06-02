const API_URL = 'http://localhost:3000/benefits';

const benefitsContainer = document.getElementById('benefits-container');
const emptyState = document.getElementById('empty-state');
const formModal = document.getElementById('form-modal');
const benefitForm = document.getElementById('benefit-form');

let editingBenefitId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadBenefits();
  setupForm();
});

function openFormModal(benefit = null) {
  formModal.classList.remove('hidden');

  if (benefit) {
    editingBenefitId = benefit._id;
    document.querySelector('.modal-header .section-badge').textContent = 'Editar benefício';
    document.querySelector('.modal-header h2').textContent = 'Editar benefício';

    document.getElementById('name').value = benefit.name || '';
    document.getElementById('category').value = benefit.category || '';
    document.getElementById('description').value = benefit.description || '';
    document.getElementById('pointsCost').value = benefit.pointsCost || 0;
    document.getElementById('quantity').value = benefit.quantity || 0;
    benefitForm.querySelector('button[type="submit"]').textContent = 'Salvar alterações';
  } else {
    editingBenefitId = null;
    benefitForm.reset();
    document.querySelector('.modal-header .section-badge').textContent = 'Novo benefício';
    document.querySelector('.modal-header h2').textContent = 'Cadastrar benefício';
    benefitForm.querySelector('button[type="submit"]').textContent = 'Cadastrar';
  }
}

function closeFormModal() {
  formModal.classList.add('hidden');
  benefitForm.reset();
  editingBenefitId = null;
}

function setupForm() {
  benefitForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      name: document.getElementById('name').value.trim(),
      category: document.getElementById('category').value,
      description: document.getElementById('description').value.trim(),
      pointsCost: Number(document.getElementById('pointsCost').value),
      quantity: Number(document.getElementById('quantity').value)
    };

    try {
      const url = editingBenefitId ? `${API_URL}/${editingBenefitId}` : API_URL;
      const method = editingBenefitId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar benefício.');
      }

      alert(data.message || 'Operação realizada com sucesso.');
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
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar benefícios.');
    }

    const benefits = data.benefits || [];
    renderBenefits(benefits);
  } catch (error) {
    console.error(error);
    benefitsContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.innerHTML = `<p>${error.message || 'Erro ao carregar benefícios.'}</p>`;
  }
}

function renderBenefits(benefits) {
  benefitsContainer.innerHTML = '';

  if (!benefits.length) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  benefits.forEach((benefit) => {
    const card = document.createElement('article');
    card.className = 'benefit-card';

    const status = benefit.status || (benefit.quantity > 0 ? 'ativo' : 'inativo');

    card.innerHTML = `
      <div class="benefit-card-header">
        <div>
          <h4>${benefit.name || '-'}</h4>
          <p class="benefit-category">${benefit.category || '-'}</p>
        </div>
        <span class="benefit-status ${status === 'ativo' ? 'is-active' : 'is-inactive'}">
          ${status}
        </span>
      </div>

      <p class="benefit-description">${benefit.description || 'Sem descrição.'}</p>

      <div class="benefit-meta">
        <span><strong>${Number(benefit.pointsCost || 0)}</strong> pontos</span>
        <span><strong>${Number(benefit.quantity || 0)}</strong> unidades</span>
      </div>

      <div class="benefit-actions">
        <button class="btn-secondary" data-action="edit">Editar</button>
        <button class="btn-danger" data-action="delete">Excluir</button>
      </div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener('click', () => {
      openFormModal(benefit);
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

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao excluir benefício.');
    }

    alert(data.message || 'Benefício excluído com sucesso.');
    loadBenefits();
  } catch (error) {
    console.error(error);
    alert(error.message || 'Erro ao excluir benefício.');
  }
}