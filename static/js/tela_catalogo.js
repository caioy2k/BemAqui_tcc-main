// usuario-catalogo.js

// Dados mockados dos produtos (simulando o que viria do backend)
const produtosMock = [
    {
        id: 1,
        nome: 'Arroz Tipo 1',
        categoria: 'alimentos',
        imagem: 'https://via.placeholder.com/200x150/27ae60/ffffff?text=Arroz',
        fabricacao: '2026-01-10',
        validade: '2027-01-10',
        preco: 45,
        descricao: 'Arroz branco tipo 1 - pacote 5kg',
        estoque: 50
    },
    {
        id: 2,
        nome: 'Feijão Carioca',
        categoria: 'alimentos',
        imagem: 'https://via.placeholder.com/200x150/3498db/ffffff?text=Feijão',
        fabricacao: '2026-02-05',
        validade: '2027-02-05',
        preco: 38,
        descricao: 'Feijão carioca tipo 1 - pacote 1kg',
        estoque: 45
    },
    {
        id: 3,
        nome: 'Kit Higiene Pessoal',
        categoria: 'higiene',
        imagem: 'https://via.placeholder.com/200x150/f1c40f/ffffff?text=Kit+Higiene',
        fabricacao: '2025-12-20',
        validade: '2026-12-20',
        preco: 85,
        descricao: 'Sabonete, creme dental, shampoo e condicionador',
        estoque: 30
    },
    {
        id: 4,
        nome: 'Kit Limpeza Completo',
        categoria: 'limpeza',
        imagem: 'https://via.placeholder.com/200x150/e74c3c/ffffff?text=Kit+Limpeza',
        fabricacao: '2026-01-15',
        validade: '2027-01-15',
        preco: 120,
        descricao: 'Detergente, água sanitária, desinfetante e esponja',
        estoque: 25
    },
    {
        id: 5,
        nome: 'Óleo de Soja',
        categoria: 'alimentos',
        imagem: 'https://via.placeholder.com/200x150/27ae60/ffffff?text=Óleo',
        fabricacao: '2026-02-10',
        validade: '2026-12-10',
        preco: 25,
        descricao: 'Óleo de soja 900ml',
        estoque: 60
    },
    {
        id: 6,
        nome: 'Leite UHT Integral',
        categoria: 'alimentos',
        imagem: 'https://via.placeholder.com/200x150/3498db/ffffff?text=Leite',
        fabricacao: '2026-03-01',
        validade: '2026-06-01',
        preco: 15,
        descricao: 'Leite integral 1L - proximo ao vencimento',
        estoque: 40
    },
    {
        id: 7,
        nome: 'Fraldas Descartáveis',
        categoria: 'higiene',
        imagem: 'https://via.placeholder.com/200x150/f1c40f/ffffff?text=Fraldas',
        fabricacao: '2026-01-05',
        validade: '2027-01-05',
        preco: 65,
        descricao: 'Pacote com 30 fraldas - tamanho M',
        estoque: 20
    },
    {
        id: 8,
        nome: 'Sabão em Pó',
        categoria: 'limpeza',
        imagem: 'https://via.placeholder.com/200x150/e74c3c/ffffff?text=Sabão',
        fabricacao: '2026-02-20',
        validade: '2026-08-20',
        preco: 30,
        descricao: 'Sabão em pó para roupas - 1kg',
        estoque: 35
    }
];

let produtosVisiveis = 8; // Quantos produtos mostrar inicialmente
const produtosPorVez = 4; // Quantos carregar por vez

document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
});

function inicializarPagina() {
    carregarDadosUsuario();
    renderizarProdutos();
    configurarEventos();
    inicializarChatbot();
}

// ===== CARREGAR DADOS DO USUÁRIO =====
function carregarDadosUsuario() {
    // Dados mockados do usuário
    document.querySelector('.usuario-nome').textContent = 'João Silva';
    document.getElementById('saldoMoedas').textContent = '1.250';
}

// ===== RENDERIZAR PRODUTOS =====
function renderizarProdutos() {
    const grid = document.getElementById('produtosGrid');
    if (!grid) return;

    const busca = document.getElementById('buscaProduto')?.value.toLowerCase() || '';
    const categoria = document.getElementById('filtroCategoria')?.value || 'todas';
    const ordenacao = document.getElementById('filtroOrdenacao')?.value || 'recentes';

    // Filtrar produtos
    let produtosFiltrados = produtosMock.filter(produto => {
        if (categoria !== 'todas' && produto.categoria !== categoria) return false;
        if (busca && !produto.nome.toLowerCase().includes(busca) && 
            !produto.descricao.toLowerCase().includes(busca)) return false;
        return true;
    });

    // Ordenar produtos
    switch(ordenacao) {
        case 'menor-preco':
            produtosFiltrados.sort((a, b) => a.preco - b.preco);
            break;
        case 'maior-preco':
            produtosFiltrados.sort((a, b) => b.preco - a.preco);
            break;
        case 'validade':
            produtosFiltrados.sort((a, b) => new Date(a.validade) - new Date(b.validade));
            break;
        default: // 'recentes' - baseado no ID (maior ID = mais recente)
            produtosFiltrados.sort((a, b) => b.id - a.id);
    }

    // Limitar quantidade
    const produtosMostrar = produtosFiltrados.slice(0, produtosVisiveis);

    grid.innerHTML = '';
    produtosMostrar.forEach(produto => {
        grid.appendChild(criarCardProduto(produto));
    });

    // Esconder botão "Carregar mais" se não houver mais produtos
    const btnCarregarMais = document.getElementById('btnCarregarMais');
    if (btnCarregarMais) {
        btnCarregarMais.style.display = produtosFiltrados.length > produtosVisiveis ? 'block' : 'none';
    }
}

function criarCardProduto(produto) {
    const card = document.createElement('div');
    card.className = 'produto-card';
    card.dataset.id = produto.id;

    // Verificar se está próximo do vencimento (menos de 60 dias)
    const hoje = new Date();
    const validade = new Date(produto.validade);
    const diasParaVencer = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));
    const proximoVencimento = diasParaVencer <= 60;
    
    if (proximoVencimento) {
        card.classList.add('alerta-vencimento');
    }

    // Formatar datas
    const fabricacaoFormat = new Date(produto.fabricacao).toLocaleDateString('pt-BR');
    const validadeFormat = new Date(produto.validade).toLocaleDateString('pt-BR');

    card.innerHTML = `
        <div class="produto-imagem">
            <img src="${produto.imagem}" alt="${produto.nome}">
            <span class="produto-tag">${getCategoriaLabel(produto.categoria)}</span>
            ${proximoVencimento ? '<span class="produto-alerta"><i class="fas fa-clock"></i> Próximo ao vencimento</span>' : ''}
        </div>
        <div class="produto-info">
            <h3 class="produto-titulo">${produto.nome}</h3>
            <div class="produto-categoria">${getCategoriaLabel(produto.categoria)}</div>
            <div class="produto-datas">
                <div class="data-linha">
                    <span class="data-label">Fabricação:</span>
                    <span class="data-valor">${fabricacaoFormat}</span>
                </div>
                <div class="data-linha">
                    <span class="data-label">Validade:</span>
                    <span class="data-valor ${proximoVencimento ? 'vencimento-proximo' : ''}">${validadeFormat}</span>
                </div>
            </div>
            <div class="produto-preco">
                <i class="fas fa-coins"></i>
                <span>${produto.preco} moedas</span>
            </div>
            <div class="produto-acoes">
                <button class="btn-outline small btn-detalhes" onclick="verDetalhes(${produto.id})">
                    <i class="fas fa-info-circle"></i> Detalhes
                </button>
                <button class="btn-primary small btn-simular" onclick="abrirSimulacao(${produto.id})">
                    <i class="fas fa-calculator"></i> Simular
                </button>
            </div>
        </div>
    `;

    return card;
}

function getCategoriaLabel(categoria) {
    const labels = {
        'alimentos': 'Alimentos',
        'higiene': 'Higiene',
        'limpeza': 'Limpeza',
        'bebidas': 'Bebidas',
        'outros': 'Outros'
    };
    return labels[categoria] || categoria;
}

// ===== CONFIGURAR EVENTOS =====
function configurarEventos() {
    // Menu dropdown do usuário
    const usuarioBtn = document.getElementById('usuarioMenuBtn');
    const usuarioDropdown = document.getElementById('usuarioDropdown');
    
    if (usuarioBtn && usuarioDropdown) {
        usuarioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            usuarioDropdown.classList.toggle('show');
        });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
        if (usuarioDropdown) usuarioDropdown.classList.remove('show');
    });

    // Busca e filtros
    document.getElementById('buscaProduto')?.addEventListener('input', () => {
        produtosVisiveis = 8; // Reset
        renderizarProdutos();
    });

    document.getElementById('filtroCategoria')?.addEventListener('change', () => {
        produtosVisiveis = 8; // Reset
        renderizarProdutos();
    });

    document.getElementById('filtroOrdenacao')?.addEventListener('change', () => {
        produtosVisiveis = 8; // Reset
        renderizarProdutos();
    });

    // Botão carregar mais
    document.getElementById('btnCarregarMais')?.addEventListener('click', () => {
        produtosVisiveis += produtosPorVez;
        renderizarProdutos();
    });

    // Botão simular compra (header)
    document.getElementById('btnSimularCompra')?.addEventListener('click', () => {
        mostrarNotificacao('Selecione um produto para simular a compra', 'info');
    });

    // Fechar modais
    document.getElementById('fecharModalSimulacao')?.addEventListener('click', fecharModais);
    document.getElementById('cancelarSimulacao')?.addEventListener('click', fecharModais);
    document.getElementById('fecharModalBoleto')?.addEventListener('click', fecharModais);

    // Gerar boleto
    document.getElementById('gerarBoletoBtn')?.addEventListener('click', gerarBoleto);

    // Confirmar simulação
    document.getElementById('confirmarSimulacao')?.addEventListener('click', confirmarCompra);

    // Inputs de recicláveis
    document.querySelectorAll('.reciclavel-qtd').forEach(input => {
        input.addEventListener('input', atualizarSimulacao);
    });

    // Notificações
    document.getElementById('notificacoesBtn')?.addEventListener('click', () => {
        mostrarNotificacao('Você tem 3 novas notificações', 'info');
    });
}

// ===== FUNÇÕES DE SIMULAÇÃO =====
let produtoSelecionado = null;

window.verDetalhes = function(id) {
    const produto = produtosMock.find(p => p.id === id);
    if (!produto) return;

    mostrarNotificacao(`Visualizando detalhes de: ${produto.nome}`, 'info');
};

window.abrirSimulacao = function(id) {
    produtoSelecionado = produtosMock.find(p => p.id === id);
    if (!produtoSelecionado) return;

    const modal = document.getElementById('modalSimulacao');
    const produtoDiv = document.getElementById('simulacaoProduto');
    
    // Preencher informações do produto
    produtoDiv.innerHTML = `
        <h4>${produtoSelecionado.nome}</h4>
        <p>${produtoSelecionado.descricao}</p>
        <p><strong>Preço:</strong> ${produtoSelecionado.preco} moedas</p>
    `;

    // Resetar inputs
    document.querySelectorAll('.reciclavel-qtd').forEach(input => input.value = 0);
    document.getElementById('valorProduto').textContent = `${produtoSelecionado.preco} moedas`;
    document.getElementById('saldoAtual').textContent = '1.250 moedas';
    
    atualizarSimulacao();
    modal.classList.add('show');
};

function atualizarSimulacao() {
    if (!produtoSelecionado) return;

    // Valores dos recicláveis (em moedas)
    const valores = {
        papelao: 2.5,   // moedas por kg
        vidro: 1.8,
        plastico: 3.2,
        metal: 4.0
    };

    const qtdPapelao = parseFloat(document.getElementById('qtdPapelao')?.value) || 0;
    const qtdVidro = parseFloat(document.getElementById('qtdVidro')?.value) || 0;
    const qtdPlastico = parseFloat(document.getElementById('qtdPlastico')?.value) || 0;
    const qtdMetal = parseFloat(document.getElementById('qtdMetal')?.value) || 0;

    const valorPapelao = qtdPapelao * valores.papelao;
    const valorVidro = qtdVidro * valores.vidro;
    const valorPlastico = qtdPlastico * valores.plastico;
    const valorMetal = qtdMetal * valores.metal;

    const totalReciclaveis = valorPapelao + valorVidro + valorPlastico + valorMetal;

    // Atualizar valores na tela
    document.getElementById('valorPapelao').textContent = `${valorPapelao.toFixed(2)} moedas`;
    document.getElementById('valorVidro').textContent = `${valorVidro.toFixed(2)} moedas`;
    document.getElementById('valorPlastico').textContent = `${valorPlastico.toFixed(2)} moedas`;
    document.getElementById('valorMetal').textContent = `${valorMetal.toFixed(2)} moedas`;
    document.getElementById('valorReciclaveis').textContent = `${totalReciclaveis.toFixed(2)} moedas`;

    const saldoNecessario = produtoSelecionado.preco - totalReciclaveis;
    document.getElementById('saldoNecessario').textContent = `${saldoNecessario.toFixed(2)} moedas`;

    const statusEl = document.getElementById('statusSimulacao');
    if (saldoNecessario <= 0) {
        statusEl.innerHTML = `
            <span>Status:</span>
            <span class="status-ok">Saldo suficiente ✓</span>
        `;
    } else {
        statusEl.innerHTML = `
            <span>Status:</span>
            <span class="status-falta">Faltam ${saldoNecessario.toFixed(2)} moedas</span>
        `;
    }
}

function confirmarCompra() {
    if (!produtoSelecionado) return;

    const qtdPapelao = parseFloat(document.getElementById('qtdPapelao')?.value) || 0;
    const qtdVidro = parseFloat(document.getElementById('qtdVidro')?.value) || 0;
    const qtdPlastico = parseFloat(document.getElementById('qtdPlastico')?.value) || 0;
    const qtdMetal = parseFloat(document.getElementById('qtdMetal')?.value) || 0;

    const valores = {
        papelao: 2.5,
        vidro: 1.8,
        plastico: 3.2,
        metal: 4.0
    };

    const totalReciclaveis = (qtdPapelao * valores.papelao) + 
                             (qtdVidro * valores.vidro) + 
                             (qtdPlastico * valores.plastico) + 
                             (qtdMetal * valores.metal);

    const saldoNecessario = produtoSelecionado.preco - totalReciclaveis;

    if (saldoNecessario <= 0) {
        // Saldo suficiente
        fecharModais();
        mostrarNotificacao('Compra realizada com sucesso! Apresente o QR Code no ponto de coleta.', 'success');
        // Gerar QR Code aqui...
    } else {
        // Abrir modal de boleto
        fecharModais();
        const modalBoleto = document.getElementById('modalBoleto');
        
        document.getElementById('boletoValorProduto').textContent = `${produtoSelecionado.preco} moedas`;
        document.getElementById('boletoValorReciclaveis').textContent = `${totalReciclaveis.toFixed(2)} moedas`;
        document.getElementById('boletoDiferenca').textContent = `R$ ${(saldoNecessario * 0.5).toFixed(2)}`; // Convertendo moedas para reais (simulação)
        
        modalBoleto.classList.add('show');
    }
}

function gerarBoleto() {
    document.getElementById('boletoGerado').style.display = 'block';
    document.getElementById('gerarBoletoBtn').style.display = 'none';
    mostrarNotificacao('Boleto gerado com sucesso!', 'success');
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
                "Você pode encontrar produtos no catálogo acima!",
                "Para simular uma compra, clique em 'Simular' no produto desejado.",
                "Lembre-se: você pode pagar com recicláveis ou boleto.",
                "Qual produto você está procurando?",
                "Os itens gratuitos estão na seção 'Itens Gratuitos'."
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

// ===== UTILITÁRIOS =====
function fecharModais() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    document.getElementById('boletoGerado').style.display = 'none';
    document.getElementById('gerarBoletoBtn').style.display = 'block';
}

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