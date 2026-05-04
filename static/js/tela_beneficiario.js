// usuario-home.js

document.addEventListener('DOMContentLoaded', function() {
    inicializarPagina();
});

function inicializarPagina() {
    atualizarDataHora();
    setInterval(atualizarDataHora, 1000);
    carregarDadosUsuario();
    configurarEventos();
    inicializarChatbot();
}

// ===== DATA E HORA (para o header) =====
function atualizarDataHora() {
    const agora = new Date();
    const dataEl = document.getElementById('currentDate');
    const horaEl = document.getElementById('currentTime');
    if (dataEl) dataEl.textContent = agora.toLocaleDateString('pt-BR');
    if (horaEl) horaEl.textContent = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ===== CARREGAR DADOS DO USUÁRIO (simulado) =====
function carregarDadosUsuario() {
    // Dados mockados para demonstração
    const usuario = {
        nome: 'João Silva',
        saldo: 1250,
        pedidosAtivos: 3,
        doacoesRealizadas: 8,
        familiasAjudadas: 12,
        ultimasAtividades: [
            { tipo: 'compra', descricao: 'Compra de 2 kits de higiene', valor: -150, data: '2026-03-17T10:30:00' },
            { tipo: 'conversao', descricao: '5 kg papelão + 3 kg plástico', valor: 320, data: '2026-03-16T14:20:00' },
            { tipo: 'doacao', descricao: '3 itens doados', valor: 0, data: '2026-03-15T09:15:00' },
            { tipo: 'gratuito', descricao: '1 cesta básica', valor: 0, data: '2026-03-14T11:45:00' }
        ]
    };

    // Atualizar elementos na página
    document.querySelector('.usuario-nome').textContent = usuario.nome;
    document.getElementById('saldoMoedas').textContent = usuario.saldo;
    document.getElementById('statSaldo').textContent = usuario.saldo;
    document.getElementById('statPedidos').textContent = usuario.pedidosAtivos;
    document.getElementById('statDoacoes').textContent = usuario.doacoesRealizadas;
    document.getElementById('statFamilias').textContent = usuario.familiasAjudadas;

    // Atualizar estatísticas do gráfico
    document.querySelector('.stat-number:first-child').textContent = '8 famílias';
    document.querySelector('.stat-number:last-child').textContent = `${usuario.familiasAjudadas} famílias`;
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

    // Botão de notificações
    const notificacoesBtn = document.getElementById('notificacoesBtn');
    if (notificacoesBtn) {
        notificacoesBtn.addEventListener('click', () => {
            mostrarNotificacao('Você tem 3 novas notificações', 'info');
        });
    }

    // Botões de ação
    document.getElementById('btnConverter').addEventListener('click', () => {
        window.location.href = 'usuario-converter.html';
    });

    document.getElementById('btnVerCatalogo').addEventListener('click', () => {
        window.location.href = 'usuario-catalogo.html';
    });

    // Botões de simulação de compra
    document.querySelectorAll('.produto-card .btn-primary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const produto = this.closest('.produto-card').querySelector('.produto-titulo').textContent;
            mostrarNotificacao(`Simulando compra de: ${produto}`, 'info');
            // Aqui você redirecionaria para a página de simulação
            // window.location.href = 'usuario-simulacao.html?produto=' + encodeURIComponent(produto);
        });
    });

    // Botões de itens gratuitos
    document.querySelectorAll('.gratuito-card .btn-outline').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.gratuito-card').querySelector('h4').textContent;
            if (confirm(`Deseja selecionar "${item}" para retirada?`)) {
                mostrarNotificacao('Item selecionado! Dirija-se ao ponto de coleta.', 'success');
            }
        });
    });

    // Gráfico - mudança de período
    const graficoSelect = document.getElementById('graficoPeriodo');
    if (graficoSelect) {
        graficoSelect.addEventListener('change', function() {
            mostrarNotificacao(`Atualizando gráfico para: ${this.options[this.selectedIndex].text}`, 'info');
            // Aqui você atualizaria o gráfico com dados reais
        });
    }
}

// ===== CHATBOT =====
function inicializarChatbot() {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotJanela = document.getElementById('chatbotJanela');
    const chatbotFechar = document.getElementById('chatbotFechar');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotEnviar = document.getElementById('chatbotEnviar');
    const chatbotMensagens = document.getElementById('chatbotMensagens');

    // Abrir chatbot
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', () => {
            chatbotJanela.classList.toggle('show');
        });
    }

    // Fechar chatbot
    if (chatbotFechar) {
        chatbotFechar.addEventListener('click', () => {
            chatbotJanela.classList.remove('show');
        });
    }

    // Enviar mensagem
    function enviarMensagem() {
        const texto = chatbotInput.value.trim();
        if (!texto) return;

        // Adicionar mensagem do usuário
        const mensagemUsuario = document.createElement('div');
        mensagemUsuario.className = 'mensagem usuario';
        mensagemUsuario.innerHTML = `
            <div class="mensagem-conteudo">${texto}</div>
            <span class="mensagem-horario">Agora</span>
        `;
        chatbotMensagens.appendChild(mensagemUsuario);

        // Limpar input
        chatbotInput.value = '';

        // Simular resposta do bot
        setTimeout(() => {
            const respostas = [
                "Entendi! Como posso ajudar?",
                "Ótima pergunta! Deixa eu verificar...",
                "Você pode encontrar essas informações no catálogo.",
                "Posso te ajudar com conversão de recicláveis?",
                "Temos várias opções disponíveis!"
            ];
            const resposta = respostas[Math.floor(Math.random() * respostas.length)];
            
            const mensagemBot = document.createElement('div');
            mensagemBot.className = 'mensagem bot';
            mensagemBot.innerHTML = `
                <div class="mensagem-conteudo">${resposta}</div>
                <span class="mensagem-horario">Agora</span>
            `;
            chatbotMensagens.appendChild(mensagemBot);
            
            // Rolar para o final
            chatbotMensagens.scrollTop = chatbotMensagens.scrollHeight;
        }, 1000);
    }

    if (chatbotEnviar) {
        chatbotEnviar.addEventListener('click', enviarMensagem);
    }

    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                enviarMensagem();
            }
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

// ===== ESTILOS DAS NOTIFICAÇÕES (se não existirem) =====
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