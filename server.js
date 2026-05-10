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

const app = express();


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


// =========================
// ROTAS DE ITENS
// =========================
app.get('/recyclables', async (req, res) => {
  try {
    const recyclables = await Recyclable.find();
    res.json({ success: true, recyclables });
  } catch (error) {
    console.error('Erro recyclables:', error);
    res.status(500).json({ error: 'Erro ao carregar recicláveis' });
  }
});

app.get('/benefits', async (req, res) => {
  try {
    const benefits = await Benefit.find();
    res.json({ success: true, benefits });
  } catch (error) {
    console.error('Erro benefits:', error);
    res.status(500).json({ error: 'Erro ao carregar benefícios' });
  }
});


// =========================
// ROTA DA CARTEIRA
// =========================
app.get('/api/user/wallet', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const wallet = user.wallet || {};

    return res.json({
      success: true,
      wallet: {
        balance: Number(wallet.balance || 0),
        totalSpent: Number(wallet.totalSpent || 0),
        totalRecycledPoints: Number(wallet.totalRecycledPoints || 0),
        totalEarned: Number(wallet.totalEarned || 0)
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
    const userId = req.user.id || req.user._id;

    const trades = await Trade.find({ beneficiaryId: userId }).sort({ createdAt: -1 });

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
    const trades = await Trade.find({ status: 'pendente' }).populate('beneficiaryId', 'name email');

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

    const formatted = monthlyTrades.map(item => ({
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
// CONEXÃO MONGODB
// =========================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ MongoDB:', err));


// =========================
// 404 FINAL
// =========================
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Página não encontrada' });
});


// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 BemAqui: http://localhost:${PORT}`);
  console.log('✅ APIs disponíveis:');
  console.log('   POST   /auth/login');
  console.log('   GET    /recyclables');
  console.log('   GET    /benefits');
  console.log('   POST   /trade/create-trade-type1');
  console.log('   GET    /api/user/wallet');
  console.log('   GET    /api/user/transactions');
});