require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trade');

// ✅ IMPORT MODELS AQUI (TOPO!)
const Recyclable = require('./models/recyclable');
const Benefit = require('./models/benefit');
// ✅ IMPORT TRADE MODEL (topo com outros)
const Trade = require('./models/trade');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Arquivos estáticos
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'templates')));

// ✅ Páginas HTML (fallback)
app.get(['/', '/index.html', '/tela_login.html', '/tela_cadastro.html'], (req, res) => {
  const page = req.path === '/' || req.path === '/index.html' ? 'index.html' : `${req.path.slice(1)}.html`;
  res.sendFile(path.join(__dirname, 'templates', page));
});

// ✅ APIs (SEM DUPLICAÇÃO!)
app.use('/auth', authRoutes);           
app.use('/trade', tradeRoutes);         

// ✅ ROTAS ITENS (DO BANCO!)
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


// ✅ LISTAR TRADES (Admin chama isso!)
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


// ✅ ROTAS ADMIN (aprovar/recusar)
app.patch('/trades/:id/approve', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(req.params.id, { 
      status: 'aprovado' 
    }, { new: true });
    if (!trade) return res.status(404).json({ error: 'Trade não encontrada' });
    res.json({ success: true, message: 'Aprovada!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aprovar' });
  }
});

app.patch('/trades/:id/reject', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(req.params.id, { 
      status: 'recusado' 
    }, { new: true });
    if (!trade) return res.status(404).json({ error: 'Trade não encontrada' });
    res.json({ success: true, message: 'Recusada!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recusar' });
  }
});


// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB:', err));

// 404 (DEPOIS de todas rotas!)
app.use('*', (req, res) => res.status(404).json({ error: 'Página não encontrada' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BemAqui: http://localhost:${PORT}`);
  console.log('✅ APIs: /auth/login, /recyclables, /benefits, /trade/create-trade-type1');
});