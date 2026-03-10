const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const Trade = require('../models/trade');  // ← ADICIONE no topo!
const User = require('../models/user');  // ← ADICIONE!
const router = express.Router();

// ✅ 1. PRIMEIRO DEFINE MIDDLEWARES
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token necessário' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta_aqui');
    console.log('✅ USER AUTENTICADO:', req.user.email);
    next();
  } catch (error) {
    console.error('❌ ERRO JWT:', error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// ✅ VERSÃO DEBUG - SEMPRE PASSA (TEMPORÁRIO)
const isEmployeeMiddleware = (req, res, next) => {
  console.log('🔍 DEBUG - User completo:', req.user);
  console.log('🔍 Role:', req.user.role, '(tipo:', typeof req.user.role, ')');
  
  // TEMPORÁRIO - DEIXA QUALQUER USUÁRIO PASSAR
  console.log('✅ PASSANDO (debug mode)');
  next();
};



// ✅ 2. DEPOIS as ROTAS (ORDEM IMPORTANTE!)
router.get('/', authMiddleware, isEmployeeMiddleware, async (req, res) => {
  console.log('🔍 GET /trades chamado!');
  res.json({ 
    success: true,
    message: '✅ Trades carregados!',
    trades: [], 
    count: 0,
    user: req.user
  });
});

router.get('/trades', authMiddleware, isEmployeeMiddleware, async (req, res) => {
  res.json({ 
    success: true,
    message: '✅ Trades carregados!',
    trades: [], 
    count: 0,
    user: req.user
  });
});


router.post('/create-trade-type1', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Calcula pontos
    const recyclingPoints = req.body.recyclablesOffered[0].quantity * req.body.recyclablesOffered[0].pointsPerUnit;
    const benefitCost = req.body.benefitsRequested[0].quantity * req.body.benefitsRequested[0].pointsCost;
    const coinsSurplus = recyclingPoints - benefitCost;
    
    console.log(`📊 CÁLCULO: ${recyclingPoints} pontos - ${benefitCost} custo = ${coinsSurplus} moedas`);

    // 1. CRIAR TRADE
    const tradeData = {
      beneficiaryId: req.user._id,
      recyclablesOffered: req.body.recyclablesOffered,
      benefitsRequested: req.body.benefitsRequested,
      totalRecyclingPoints: recyclingPoints,
      totalBenefitCost: benefitCost,
      coinsSurplus: coinsSurplus,
      tradeType: "with_benefit",
      status: "pendente"
    };

    const newTrade = new Trade(tradeData);
    await newTrade.save({ session });

    // 2. ATUALIZAR CARTEIRA DO USUÁRIO
    await User.findByIdAndUpdate(
      req.user._id,
      { 
        $inc: { 
          'wallet.balance': coinsSurplus,  // +5 moedas (ou negativo se débito)
          'wallet.totalRecycledPoints': recyclingPoints 
        }
      },
      { session, new: true }
    );

    await session.commitTransaction();
    console.log('✅ TRADE + CARTEIRA ATUALIZADA!');
    
    res.json({ 
      success: true, 
      message: 'Troca criada e carteira atualizada!',
      tradeId: newTrade._id,
      coinsEarned: coinsSurplus 
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ ERRO TRADE:', error);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});



module.exports = router;
