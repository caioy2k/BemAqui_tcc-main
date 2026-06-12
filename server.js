require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('./models/user');
const Trade = require('./models/trade');
const Recyclable = require('./models/recyclable');
const Benefit = require('./models/benefit');

const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trade');
const authCompanyRoutes = require('./routes/authCompany');
const companyRoutes = require('./routes/company');
const recyclablesRoutes = require('./routes/recyclables');
const benefitRoutes = require('./routes/benefits');


const app = express();

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =========================
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// AUTH MIDDLEWARE
// =========================
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error.message);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// =========================
// ARQUIVOS ESTÁTICOS
// =========================
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'templates')));

// =========================
// PÁGINAS HTML
// =========================
app.get(['/', '/index.html', '/tela_login.html', '/tela_cadastro.html'], (req, res) => {
  const page =
    req.path === '/' || req.path === '/index.html'
      ? 'index.html'
      : req.path.slice(1);

  res.sendFile(path.join(__dirname, 'templates', page));
});

// =========================
// ROTAS DE AUTENTICAÇÃO E TRADE
// =========================
app.use('/auth', authRoutes);
app.use('/trade', tradeRoutes);
app.use('/auth-company', authCompanyRoutes);
app.use('/company', companyRoutes);

// =========================
// AUTH - USUÁRIO LOGADO
// =========================
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário no token é inválido.'
      });
    }

    const user = await User.findById(userId)
      .select('_id name email cpf phone telefone city cidade role tipo status createdAt wallet isAdmin isEmployee')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.'
      });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name || '-',
        email: user.email || '-',
        cpf: user.cpf || '-',
        phone: user.phone || user.telefone || '-',
        city: user.city || user.cidade || '-',
        role: user.role || user.tipo || 'usuário',
        status: user.status || 'ativo',
        createdAt: user.createdAt || null,
        isAdmin: Boolean(user.isAdmin),
        isEmployee: Boolean(user.isEmployee)
      }
    });
  } catch (error) {
    console.error('Erro em /auth/me:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuário autenticado.'
    });
  }
});

// =========================
// ROTAS DE ITENS
// =========================
app.get('/recyclables', async (req, res) => {
  try {
    const recyclables = await Recyclable.find().lean();
    res.json({ success: true, recyclables });
  } catch (error) {
    console.error('Erro recyclables:', error);
    res.status(500).json({ error: 'Erro ao carregar recicláveis' });
  }
});
app.use('/admin/recyclables', recyclablesRoutes);

app.get('/benefits', async (req, res) => {
  try {
    const benefits = await Benefit.find().lean();
    res.json({ success: true, benefits });
  } catch (error) {
    console.error('Erro benefits:', error);
    res.status(500).json({ error: 'Erro ao carregar benefícios' });
  }
});
app.use('/benefits', benefitRoutes);

// =========================
// ROTA DA CARTEIRA
// =========================
app.get('/api/user/wallet', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'ID de usuário inválido.' });
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const wallet = user.wallet || {};

    return res.json({
      success: true,
      wallet: {
        balance: Number(wallet.balance ?? 0),
        totalSpent: Number(wallet.totalSpent ?? 0),
        totalRecycledPoints: Number(wallet.totalRecycledPoints ?? 0),
        totalEarned: Number(wallet.totalEarned ?? 0)
      }
    });
  } catch (error) {
    console.error('Erro wallet:', error);
    return res.status(500).json({ error: 'Erro ao carregar carteira.' });
  }
});

// =========================
// ROTA DE TRANSAÇÕES
// =========================
app.get('/api/user/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    const trades = await Trade.find({ beneficiaryId: userId })
      .sort({ createdAt: -1 })
      .lean();

    const transactions = [];

    trades.forEach((trade) => {
      if (trade.totalRecyclingPoints > 0) {
        transactions.push({
          type: 'Entrada',
          description: trade.coinsSurplus > 0
            ? 'Reciclagem com sobra convertida em moedas'
            : 'Reciclagem utilizada em troca',
          amount: Number(trade.coinsSurplus > 0 ? trade.coinsSurplus : trade.totalRecyclingPoints),
          date: trade.createdAt || new Date()
        });
      }

      if (trade.totalBenefitCost > 0) {
        transactions.push({
          type: 'Saída',
          description: 'Resgate de benefício',
          amount: -Number(trade.totalBenefitCost),
          date: trade.createdAt || new Date()
        });
      }
    });

    return res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Erro transactions:', error);
    return res.status(500).json({ error: 'Erro ao carregar transações.' });
  }
});

// =========================
// LISTAR TRADES PENDENTES
// =========================
app.get('/trades', async (req, res) => {
  try {
    const trades = await Trade.find({ status: 'pendente' })
      .populate('beneficiaryId', 'name email')
      .lean();

    res.json({
      success: true,
      trades,
      count: trades.length
    });
  } catch (error) {
    console.error('Erro trades:', error);
    res.status(500).json({ error: 'Erro ao carregar trades' });
  }
});

// =========================
// APROVAR TRADE
// =========================
app.patch('/trades/:id/approve', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(
      req.params.id,
      { status: 'aprovado' },
      { new: true }
    );

    if (!trade) {
      return res.status(404).json({ error: 'Trade não encontrada' });
    }

    res.json({ success: true, message: 'Aprovada!' });
  } catch (error) {
    console.error('Erro ao aprovar trade:', error);
    res.status(500).json({ error: 'Erro ao aprovar' });
  }
});

// =========================
// RECUSAR TRADE
// =========================
app.patch('/trades/:id/reject', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(
      req.params.id,
      { status: 'recusado' },
      { new: true }
    );

    if (!trade) {
      return res.status(404).json({ error: 'Trade não encontrada' });
    }

    res.json({ success: true, message: 'Recusada!' });
  } catch (error) {
    console.error('Erro ao recusar trade:', error);
    res.status(500).json({ error: 'Erro ao recusar' });
  }
});

// =========================
// DASHBOARD ADMIN
// =========================
app.get('/api/admin/dashboard/summary', async (req, res) => {
  try {
    const [usersCount, tradesCount, pendingTrades, benefitsCount, approvedTrades] = await Promise.all([
      User.countDocuments(),
      Trade.countDocuments(),
      Trade.countDocuments({ status: 'pendente' }),
      Benefit.countDocuments(),
      Trade.countDocuments({ status: 'aprovado' })
    ]);

    res.json({
      success: true,
      summary: {
        usersCount,
        tradesCount,
        pendingTrades,
        benefitsCount,
        approvedTrades
      }
    });
  } catch (error) {
    console.error('Erro dashboard summary:', error);
    res.status(500).json({ error: 'Erro ao carregar resumo do dashboard.' });
  }
});

app.get('/api/admin/dashboard/monthly', async (req, res) => {
  try {
    const monthlyTrades = await Trade.aggregate([
      {
        $match: {
          createdAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalTrades: { $sum: 1 },
          approvedTrades: {
            $sum: {
              $cond: [{ $eq: ['$status', 'aprovado'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const formatted = monthlyTrades.map((item) => ({
      label: `${monthNames[item._id.month - 1]}/${item._id.year}`,
      trades: item.totalTrades,
      approvals: item.approvedTrades
    }));

    res.json({
      success: true,
      monthly: formatted
    });
  } catch (error) {
    console.error('Erro dashboard monthly:', error);
    res.status(500).json({ error: 'Erro ao carregar gráfico mensal.' });
  }
});

// =========================
// DASHBOARD FUNCIONÁRIO
// =========================
app.get('/api/employee/dashboard', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let pendingTrades = 0;
    let todayRescues = 0;
    let servedUsers = 0;

    try {
      pendingTrades = await Trade.countDocuments({ status: 'pendente' });
    } catch (err) {
      console.warn('Não foi possível contar trades pendentes:', err.message);
    }

    try {
      todayRescues = await Trade.countDocuments({
        updatedAt: { $gte: startOfDay }
      });
    } catch (err) {
      console.warn('Não foi possível contar resgates do dia:', err.message);
    }

    try {
      const servedUsersAgg = await Trade.aggregate([
        {
          $match: {
            updatedAt: { $gte: startOfDay },
            beneficiaryId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$beneficiaryId'
          }
        },
        {
          $count: 'total'
        }
      ]);

      servedUsers = servedUsersAgg[0]?.total || 0;
    } catch (err) {
      console.warn('Não foi possível contar usuários atendidos:', err.message);
    }

    const activeBenefits = await Benefit.countDocuments({
      status: 'ativo'
    });

    const latestPendingTrades = await Trade.find({ status: 'pendente' })
      .sort({ createdAt: 1 })
      .limit(5)
      .lean();

    const lowStockList = await Benefit.find({
      quantity: { $lte: 5 },
      status: 'ativo'
    })
      .sort({ quantity: 1 })
      .limit(5)
      .lean();

    const priorities = latestPendingTrades.length
      ? latestPendingTrades.map((trade) => ({
          title: `Trade #${String(trade._id).slice(-6)} aguardando validação`,
          description: `Status atual: ${trade.status}`,
          tag: 'Pendente',
          type: 'warning'
        }))
      : [
          {
            title: 'Sem pendências críticas',
            description: 'Não há trades pendentes aguardando validação.',
            tag: 'OK',
            type: 'info'
          }
        ];

    const alerts = lowStockList.length
      ? lowStockList.map((benefit) => ({
          title: `Estoque baixo: ${benefit.name}`,
          description: `Restam ${benefit.quantity} unidades disponíveis.`,
          tag: 'Estoque',
          type: 'danger'
        }))
      : [
          {
            title: 'Operação estável',
            description: 'Não há benefits com estoque crítico no momento.',
            tag: 'Sistema',
            type: 'info'
          }
        ];

    res.json({
      success: true,
      metrics: {
        pendingTrades,
        todayRescues,
        servedUsers,
        coinsIssued: activeBenefits
      },
      priorities,
      alerts
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard do funcionário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar dashboard do funcionário.'
    });
  }
});

// =========================
// BUSCA DE USUÁRIOS
// =========================
app.get('/api/users/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();

    if (!q) {
      return res.json({
        success: true,
        users: []
      });
    }

    const safeQuery = escapeRegex(q);

    const users = await User.find({
      $or: [
        { name: { $regex: safeQuery, $options: 'i' } },
        { email: { $regex: safeQuery, $options: 'i' } },
        { cpf: { $regex: safeQuery, $options: 'i' } }
      ]
    })
      .select('_id name email cpf status createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuários.'
    });
  }
});

// =========================
// DETALHES DO USUÁRIO
// =========================
app.get('/api/users/:id/details', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuário inválido.'
      });
    }

    const user = await User.findById(id)
      .select('_id name email cpf phone telefone city cidade role tipo status createdAt wallet')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.'
      });
    }

    const trades = await Trade.find({ beneficiaryId: id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const walletBalance = Number(user.wallet?.balance ?? 0);
    const totalTrades = trades.length;
    const totalRescues = trades.filter(trade =>
      ['aprovado', 'concluido', 'concluído', 'finalizado', 'entregue'].includes(
        String(trade.status || '').toLowerCase()
      )
    ).length;

    const lastTrade = trades[0] || null;
    const lastActivity = lastTrade ? (lastTrade.updatedAt || lastTrade.createdAt) : null;

    const history = trades.slice(0, 10).map((trade) => ({
      title: buildHistoryTitle(trade),
      description: buildHistoryDescription(trade),
      date: trade.updatedAt || trade.createdAt || null,
      tag: trade.totalBenefitCost > 0 ? 'Benefício' : 'Trade'
    }));

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name || '-',
        email: user.email || '-',
        cpf: user.cpf || '-',
        phone: user.phone || user.telefone || '-',
        city: user.city || user.cidade || '-',
        role: user.role || user.tipo || 'usuário',
        status: user.status || 'ativo',
        createdAt: user.createdAt || null
      },
      metrics: {
        walletBalance,
        totalTrades,
        totalRescues,
        lastActivity
      },
      history
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar detalhes do usuário.'
    });
  }
});

// =========================
// ATUALIZAR PERFIL DO USUÁRIO
// =========================
app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const loggedUserId = req.user.id || req.user._id || req.user.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido.'
      });
    }

    if (String(loggedUserId) !== String(id)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para editar este perfil.'
      });
    }

    const { name, email, phone, city } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          email,
          phone,
          city
        }
      },
      { new: true, runValidators: true }
    )
      .select('_id name email cpf phone telefone city cidade role tipo status createdAt wallet')
      .lean();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado.'
      });
    }

    return res.json({
      success: true,
      message: 'Perfil atualizado com sucesso.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar usuário.'
    });
  }
});

function buildHistoryTitle(trade) {
  const status = String(trade.status || '').toLowerCase();

  if (['aprovado', 'concluido', 'concluído', 'finalizado', 'entregue'].includes(status)) {
    return 'Resgate concluído';
  }

  if (['pendente', 'aguardando'].includes(status)) {
    return 'Solicitação pendente';
  }

  if (['recusado', 'cancelado', 'negado'].includes(status)) {
    return 'Solicitação recusada';
  }

  return 'Movimentação registrada';
}

function buildHistoryDescription(trade) {
  const recyclableCount = Array.isArray(trade.recyclablesOffered) ? trade.recyclablesOffered.length : 0;
  const benefitCount = Array.isArray(trade.benefitsRequested) ? trade.benefitsRequested.length : 0;

  if (benefitCount > 0) {
    const names = trade.benefitsRequested
      .map(item => item.benefitName || 'Benefício')
      .join(', ');
    return `Benefícios solicitados: ${names}`;
  }

  if (recyclableCount > 0) {
    const names = trade.recyclablesOffered
      .map(item => item.recyclableName || 'Reciclável')
      .join(', ');
    return `Materiais enviados: ${names}`;
  }

  return 'Movimentação sem descrição detalhada.';
}

// =========================
// CONEXÃO MONGODB
// =========================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 BemAqui: https://bemaqui-tcc-main.onrender.com`);
      console.log('✅ APIs disponíveis:');
      console.log('   POST   /auth/login');
      console.log('   GET    /auth/me');
      console.log('   POST   /auth-company/register');
      console.log('   POST   /auth-company/login');
      console.log('   GET    /company/me');
      console.log('   PUT    /company/me');
      console.log('   GET    /recyclables');
      console.log('   POST   /recyclables');
      console.log('   PUT    /recyclables');
      console.log('   DELETE /recyclables');
      console.log('   GET    /benefits');
      console.log('   POST   /benefits');
      console.log('   PUT    /benefits');
      console.log('   DELETE /benefits');
      console.log('   POST   /trade/create-trade-type1');
      console.log('   GET    /api/user/wallet');
      console.log('   GET    /api/user/transactions');
      console.log('   GET    /api/users/search?q=joao');
      console.log('   GET    /api/users/:id/details');
      console.log('   PUT    /api/users/:id');
      console.log('✅ MongoDB conectado');
    });
  })
  .catch((err) => console.error('❌ MongoDB:', err));

// =========================
// 404 FINAL
// =========================
app.use((req, res) => {
  res.status(404).json({ error: 'Página não encontrada' });
});