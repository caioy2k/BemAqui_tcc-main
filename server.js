require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');


const authRoutes = require('./routes/auth');  // ← ESSA LINHA FALTAVA!
const tradeRoutes = require('./routes/trade');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ STATIC FILES
app.use('/static', express.static(path.join(__dirname, 'static')));

// ✅ PÁGINAS HTML (qualquer URL → HTML)
app.get(['/', '/tela_admin_trades', '/tela_beneficiario_trocar', '/login'], (req, res) => {
  const page = req.path === '/' ? 'index.html' : `${req.path.slice(1)}.html`;
  res.sendFile(path.join(__dirname, `templates/${page}`));
});

// ✅ APIs (SEMPRE funcionam)
app.use('/api/auth', require('./routes/auth'));
app.use('/auth', authRoutes);
app.use('/api/trade', require('./routes/trade'));
app.use('/api/user', require('./routes/user'));
app.use('/trades', require('./routes/trade'));  // ❌ COMENTADO!
app.use('/recyclables', require('./routes/recyclables'));
app.use('/benefits', require('./routes/benefits'));


// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Página não encontrada' }));

// MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bemaqui")
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BemAqui: http://localhost:${PORT}`);
  console.log('✅ Páginas: /, /tela_admin_trades, /tela_beneficiario_troca');
  console.log('✅ APIs: /api/auth/login, /trades, /api/trade/create-trade-type1');
});
