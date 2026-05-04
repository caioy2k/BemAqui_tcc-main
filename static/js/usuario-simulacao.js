// usuario-simulacao.js

// Dados mockados dos produtos disponíveis
const produtosDisponiveis = [
    { id: 1, nome: 'Arroz Tipo 1', preco: 45, imagem: 'https://via.placeholder.com/60x60/27ae60/ffffff?text=Arroz', categoria: 'Alimentos' },
    { id: 2, nome: 'Feijão Carioca', preco: 38, imagem: 'https://via.placeholder.com/60x60/3498db/ffffff?text=Feijão', categoria: 'Alimentos' },
    { id: 3, nome: 'Kit Higiene Pessoal', preco: 85, imagem: 'https://via.placeholder.com/60x60/f1c40f/ffffff?text=Higiene', categoria: 'Higiene' },
    { id: 4, nome: 'Kit Limpeza Completo', preco: 120, imagem: 'https://via.placeholder.com/60x60/e74c3c/ffffff?text=Limpeza', categoria: 'Limpeza' },
    { id: 5, nome: 'Óleo de Soja', preco: 25, imagem: 'https://via.placeholder.com/60x60/27ae60/ffffff?text=Óleo', categoria: 'Alimentos' },
    { id: 6, nome: 'Leite UHT', preco: 15, imagem: 'https://via.placeholder.com/60x60/3498db/ffffff?text=Leite', categoria: 'Alimentos' },
    { id: 7, nome: 'Fraldas Descartáveis', preco: 65, imagem: 'https://via.placeholder.com/60x60/f1c40f/ffffff?text=Fraldas', categoria: 'Higiene' },
    { id: 8, nome: 'Sabão em Pó', preco: 30, imagem: 'https://via.placeholder.com/60x60/e74c3c/ffffff?text=Sabão', categoria: 'Limpeza' }
];

// Estado da aplicação
let produtosSelecionados = [
    { id: 1, nome: 'Arroz Tipo 1', preco: 45, quantidade: 1 },
    { id: 2, nome: 'Feijão Carioca', preco: 38, quantidade: 2 }
];
let reciclaveis = {
    papelao: 0,
    vidro: 0,
    plastico: 0,
    metal: 0
};

// Valores por unidade
const valoresReciclaveis = {
    papelao: 2,
    vidro: 1,
    plastico: 3,
    metal: 4
};

document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
});

function inicializarPagina() {
    carregarDadosUsuario();
    renderizarProdutosSelecionados();
    calcularTotais();
    configurarEventos();
    inicializarChatbot();
}

// ===== CARREGAR DADOS DO USUÁRIO =====
function carregarDadosUsuario() {
    document.querySelector('.usuario-nome').textContent = 'João Silva';
    document.getElementById('saldoMoedas').textContent = '1.250';
    document.getElementById('resumoSaldoAtual').textContent = '1.250 moedas';
}

// ===== RENDERIZAR PRODUTOS SELECIONADOS =====
function renderizarProdutosSelecionados() {
    const lista = document.getElementById('produtosLista');
    if (!lista) return;

    lista.innerHTML = '';
    produtosSelecionados.forEach(produto => {
        const item = document.createElement('div');
        item.className = 'produto-item';
        item.dataset.id = produto.id;
        item.dataset.preco = produto.preco;

        item.innerHTML = `
            <div class="produto-info">
                <img src="${produtosDisponiveis.find(p => p.id === produto.id)?.imagem || 'https://via.placeholder.com/60x60'}" 
                     alt="${produto.nome}" class="produto-img">
                <div class="produto-detalhes">
                    <h4>${produto.nome}</h4>
                    <p class="produto-preco">${produto.preco} moedas</p>
                </div>
            </div>
            <div class="produto-quantidade">
                <button class="qtd-btn" onclick="alterarQuantidade(this, ${produto.id}, -1)">-</button>
                <input type="number" class="qtd-input" value="${produto.quantidade}" min="1" max="10" readonly>
                <button class="qtd-btn" onclick="alterarQuantidade(this, ${produto.id}, 1)">+</button>
                <button class="remover-btn" onclick="removerProduto(${produto.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        lista.appendChild(item);
    });

    calcularTotalProdutos();
}

// ===== FUNÇÕES DOS PRODUTOS =====
window.alterarQuantidade = function(btn, produtoId, delta) {
    const produto = produtosSelecionados.find(p => p.id === produtoId);
    if (!produto) return;

    const novaQuantidade = produto.quantidade + delta;
    if (novaQuantidade < 1 || novaQuantidade > 10) return;

    produto.quantidade = novaQuantidade;
    
    const item = btn.closest('.produto-item');
    const input = item.querySelector('.qtd-input');
    input.value = novaQuantidade;

    calcularTotalProdutos();
    calcularTotais();
};

window.removerProduto = function(produtoId) {
    produtosSelecionados = produtosSelecionados.filter(p => p.id !== produtoId);
    renderizarProdutosSelecionados();
    calcularTotais();
};

function calcularTotalProdutos() {
    const total = produtosSelecionados.reduce((acc, p) => acc + (p.preco * p.quantidade), 0);
    document.getElementById('totalProdutos').textContent = total;
    document.getElementById('resumoTotalProdutos').textContent = total + ' moedas';
}

// ===== FUNÇÕES DOS RECICLÁVEIS =====
window.alterarReciclavel = function(tipo, delta) {
    const input = document.getElementById(`qtd${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    if (!input) return;

    let novoValor = reciclaveis[tipo] + delta;
    if (novoValor < 0) novoValor = 0;

    reciclaveis[tipo] = novoValor;
    input.value = novoValor;

    const subtotal = novoValor * valoresReciclaveis[tipo];
    document.getElementById(`subtotal${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).textContent = subtotal + ' moedas';

    calcularTotais();
};

function calcularTotais() {
    // Calcular total dos recicláveis
    const totalReciclaveis = Object.keys(reciclaveis).reduce((acc, tipo) => {
        return acc + (reciclaveis[tipo] * valoresReciclaveis[tipo]);
    }, 0);

    const totalProdutos = produtosSelecionados.reduce((acc, p) => acc + (p.preco * p.quantidade), 0);
    const saldoNecessario = totalProdutos - totalReciclaveis;

    document.getElementById('resumoTotalReciclaveis').textContent = totalReciclaveis + ' moedas';
    document.getElementById('resumoSaldoNecessario').textContent = saldoNecessario + ' moedas';

    // Atualizar status
    const statusEl = document.getElementById('statusSimulacao');
    if (saldoNecessario <= 0) {
        statusEl.innerHTML = `
            <i class="fas fa-check-circle" style="color: #27ae60;"></i>
            <span style="color: #27ae60;">Saldo suficiente! Você pode finalizar a compra.</span>
        `;
        statusEl.style.background = 'rgba(39, 174, 96, 0.1)';
    } else if (saldoNecessario <= 1250) { // Saldo do usuário
        statusEl.innerHTML = `
            <i class="fas fa-info-circle" style="color: #3498db;"></i>
            <span>Faltam ${saldoNecessario} moedas. Use seu saldo ou boleto.</span>
        `;
        statusEl.style.background = 'rgba(52, 152, 219, 0.1)';
    } else {
        statusEl.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #f1c40f;"></i>
            <span>Faltam ${saldoNecessario} moedas. Complete com boleto.</span>
        `;
        statusEl.style.background = 'rgba(241, 196, 15, 0.1)';
    }
}

// ===== CONFIGURAR EVENTOS =====
function configurarEventos() {
    // Menu dropdown
    const usuarioBtn = document.getElementById('usuarioMenuBtn');
    const usuarioDropdown = document.getElementById('usuarioDropdown');
    
    if (usuarioBtn && usuarioDropdown) {
        usuarioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            usuarioDropdown.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => {
        if (usuarioDropdown) usuarioDropdown.classList.remove('show');
    });

    // Botões principais
    document.getElementById('btnAdicionarProdutos')?.addEventListener('click', abrirSelecaoProdutos);
    document.getElementById('btnLimpar')?.addEventListener('click', limparSimulacao);
    document.getElementById('btnFinalizar')?.addEventListener('click', finalizarSimulacao);

    // Modais - fechar
    document.getElementById('fecharModalConfirmacao')?.addEventListener('click', fecharModais);
    document.getElementById('btnOkConfirmacao')?.addEventListener('click', () => {
        fecharModais();
        window.location.href = 'usuario-pedidos.html';
    });
    document.getElementById('fecharModalBoleto')?.addEventListener('click', fecharModais);
    document.getElementById('fecharModalSelecao')?.addEventListener('click', fecharModais);

    // Boleto
    document.getElementById('gerarBoletoBtn')?.addEventListener('click', gerarBoleto);

    // Busca de produtos
    document.getElementById('buscaProduto')?.addEventListener('input', function() {
        renderizarSelecaoProdutos(this.value);
    });

    // Notificações
    document.getElementById('notificacoesBtn')?.addEventListener('click', () => {
        mostrarNotificacao('Você tem 3 novas notificações', 'info');
    });
}

// ===== SELEÇÃO DE PRODUTOS =====
function abrirSelecaoProdutos() {
    const modal = document.getElementById('modalSelecaoProdutos');
    renderizarSelecaoProdutos();
    modal.classList.add('show');
}

function renderizarSelecaoProdutos(busca = '') {
    const grid = document.getElementById('produtosSelecaoGrid');
    if (!grid) return;

    const produtosFiltrados = produtosDisponiveis.filter(p => 
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.categoria.toLowerCase().includes(busca.toLowerCase())
    );

    grid.innerHTML = '';
    produtosFiltrados.forEach(produto => {
        const jaSelecionado = produtosSelecionados.some(p => p.id === produto.id);
        
        const card = document.createElement('div');
        card.className = `produto-selecao-card ${jaSelecionado ? 'selecionado' : ''}`;
        card.dataset.id = produto.id;

        card.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}">
            <div class="produto-selecao-info">
                <h4>${produto.nome}</h4>
                <p>${produto.preco} moedas</p>
                <small>${produto.categoria}</small>
            </div>
        `;

        card.addEventListener('click', () => toggleProduto(produto.id));
        grid.appendChild(card);
    });
}

function toggleProduto(produtoId) {
    const index = produtosSelecionados.findIndex(p => p.id === produtoId);
    
    if (index === -1) {
        // Adicionar produto
        const produto = produtosDisponiveis.find(p => p.id === produtoId);
        produtosSelecionados.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1
        });
    } else {
        // Remover produto
        produtosSelecionados.splice(index, 1);
    }

    renderizarProdutosSelecionados();
    renderizarSelecaoProdutos(document.getElementById('buscaProduto')?.value || '');
    calcularTotais();
}

// ===== FINALIZAR SIMULAÇÃO =====
function finalizarSimulacao() {
    const pagamento = document.querySelector('input[name="pagamento"]:checked')?.value;
    const totalProdutos = produtosSelecionados.reduce((acc, p) => acc + (p.preco * p.quantidade), 0);
    const totalReciclaveis = Object.keys(reciclaveis).reduce((acc, tipo) => {
        return acc + (reciclaveis[tipo] * valoresReciclaveis[tipo]);
    }, 0);
    const saldoNecessario = totalProdutos - totalReciclaveis;
    const saldoUsuario = 1250; // Saldo mockado

    if (produtosSelecionados.length === 0) {
        mostrarNotificacao('Selecione pelo menos um produto', 'error');
        return;
    }

    if (pagamento === 'reciclaveis' && saldoNecessario > 0) {
        mostrarNotificacao('Os recicláveis não são suficientes. Escolha outra opção de pagamento.', 'error');
        return;
    }

    if (pagamento === 'saldo' && totalProdutos > saldoUsuario) {
        mostrarNotificacao('Saldo insuficiente. Escolha outra opção de pagamento.', 'error');
        return;
    }

    if (pagamento === 'misto' && saldoNecessario > saldoUsuario) {
        // Abrir modal de boleto
        const modalBoleto = document.getElementById('modalBoleto');
        const valorReais = ((saldoNecessario - saldoUsuario) * 0.5).toFixed(2); // Conversão simulada
        
        document.getElementById('boletoValorTotal').textContent = `R$ ${(totalProdutos * 0.5).toFixed(2)}`;
        document.getElementById('boletoValorPagar').textContent = `R$ ${valorReais}`;
        
        modalBoleto.classList.add('show');
        return;
    }

    // Sucesso - mostrar QR Code
    const modal = document.getElementById('modalConfirmacao');
    const detalhesPag = document.getElementById('detalhesPagamento');
    
    let pagamentoTexto = '';
    if (pagamento === 'reciclaveis') {
        pagamentoTexto = 'Pagamento realizado com recicláveis';
    } else if (pagamento === 'saldo') {
        pagamentoTexto = 'Pagamento realizado com saldo da carteira';
    } else {
        pagamentoTexto = 'Pagamento misto (recicláveis + saldo)';
    }

    detalhesPag.innerHTML = `
        <p><strong>${pagamentoTexto}</strong></p>
        <p>Total: ${totalProdutos} moedas</p>
        <p>Recicláveis: ${totalReciclaveis} moedas</p>
        <p>Saldo utilizado: ${totalProdutos - totalReciclaveis} moedas</p>
    `;

    modal.classList.add('show');
}

// ===== UTILITÁRIOS =====
function limparSimulacao() {
    if (confirm('Deseja limpar todos os produtos e recicláveis?')) {
        produtosSelecionados = [];
        reciclaveis = { papelao: 0, vidro: 0, plastico: 0, metal: 0 };
        
        // Resetar inputs
        Object.keys(reciclaveis).forEach(tipo => {
            const input = document.getElementById(`qtd${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
            if (input) input.value = 0;
            document.getElementById(`subtotal${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).textContent = '0 moedas';
        });

        renderizarProdutosSelecionados();
        calcularTotais();
        mostrarNotificacao('Simulação reiniciada', 'info');
    }
}

function gerarBoleto() {
    document.getElementById('boletoGerado').style.display = 'block';
    document.getElementById('gerarBoletoBtn').style.display = 'none';
    mostrarNotificacao('Boleto gerado com sucesso!', 'success');
}

function fecharModais() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    document.getElementById('boletoGerado').style.display = 'none';
    document.getElementById('gerarBoletoBtn').style.display = 'block';
}

// ===== CHATBOT =====
function inicializarChatbot() {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotJanela = document.getElementById('chatbotJanela');
    const chatbotFechar = document.getElementById('chatbotFechar');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotEnviar = document.getElementById('chatbotEnviar');
    const chatbotMensagens = document.getElementById('chatbotMensagens');

    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', () => {
            chatbotJanela.classList.toggle('show');
        });
    }

    if (chatbotFechar) {
        chatbotFechar.addEventListener('click', () => {
            chatbotJanela.classList.remove('show');
        });
    }

    function enviarMensagem() {
        const texto = chatbotInput.value.trim();
        if (!texto) return;

        const mensagemUsuario = document.createElement('div');
        mensagemUsuario.className = 'mensagem usuario';
        mensagemUsuario.innerHTML = `
            <div class="mensagem-conteudo">${texto}</div>
            <span class="mensagem-horario">Agora</span>
        `;
        chatbotMensagens.appendChild(mensagemUsuario);
        chatbotInput.value = '';

        setTimeout(() => {
            const respostas = [
                "Você pode ajustar as quantidades de recicláveis nos botões + e -",
                "Para adicionar mais produtos, clique no botão abaixo da lista",
                "O valor dos recicláveis é por unidade: Papelão 2, Vidro 1, Plástico 3, Metal 4",
                "Você pode pagar com recicláveis, saldo ou boleto",
                "Após finalizar, um QR Code será gerado para retirada"
            ];
            const resposta = respostas[Math.floor(Math.random() * respostas.length)];
            
            const mensagemBot = document.createElement('div');
            mensagemBot.className = 'mensagem bot';
            mensagemBot.innerHTML = `
                <div class="mensagem-conteudo">${resposta}</div>
                <span class="mensagem-horario">Agora</span>
            `;
            chatbotMensagens.appendChild(mensagemBot);
            chatbotMensagens.scrollTop = chatbotMensagens.scrollHeight;
        }, 1000);
    }

    if (chatbotEnviar) {
        chatbotEnviar.addEventListener('click', enviarMensagem);
    }

    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') enviarMensagem();
        });
    }
}

// ===== SISTEMA DE NOTIFICAÇÕES =====
function mostrarNotificacao(mensagem, tipo = 'info') {
    const existente = document.querySelector('.custom-notification');
    if (existente) existente.remove();

    const notificacao = document.createElement('div');
    notificacao.className = `custom-notification ${tipo}`;

    const icones = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    notificacao.innerHTML = `
        <i class="fas ${icones[tipo]}"></i>
        <span>${mensagem}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    document.body.appendChild(notificacao);

    notificacao.querySelector('.notification-close').addEventListener('click', () => {
        notificacao.remove();
    });

    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notificacao.remove(), 300);
        }
    }, 3000);
}

// ===== ESTILOS DAS NOTIFICAÇÕES =====
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .custom-notification {
            position: fixed;
            top: 24px;
            right: 24px;
            background: white;
            color: #1e293b;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            border-left: 4px solid;
            font-weight: 500;
        }
        .custom-notification.success { border-left-color: #27ae60; }
        .custom-notification.success i { color: #27ae60; }
        .custom-notification.error { border-left-color: #ef4444; }
        .custom-notification.error i { color: #ef4444; }
        .custom-notification.info { border-left-color: #3498db; }
        .custom-notification.info i { color: #3498db; }
        .custom-notification.warning { border-left-color: #f1c40f; }
        .custom-notification.warning i { color: #f1c40f; }
        .notification-close {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            margin-left: auto;
            padding: 4px;
        }
        .notification-close:hover { color: #1e293b; }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0%); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0%); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}