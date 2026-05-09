const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const Trade = require('../models/trade');
const User = require('../models/user');
const Benefit = require('../models/benefit'); // ← ADICIONE este model se não existir
const router = express.Router();



// ✅ 1. MIDDLEWARES (mantidos iguais)
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

const isEmployeeMiddleware = (req, res, next) => {
  console.log('🔍 DEBUG - User completo:', req.user);
  console.log('🔍 Role:', req.user.role, '(tipo:', typeof req.user.role, ')');
  console.log('✅ PASSANDO (debug mode)');
  next();
};

// ✅ 2. ROTAS EXISTENTES (mantidas 100%)
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
    const recyclingPoints = req.body.recyclablesOffered[0].quantity * req.body.recyclablesOffered[0].pointsPerUnit;
    const benefitCost = req.body.benefitsRequested[0].quantity * req.body.benefitsRequested[0].pointsCost;
    const coinsSurplus = recyclingPoints - benefitCost;

    console.log(`📊 CÁLCULO: ${recyclingPoints} pontos - ${benefitCost} custo = ${coinsSurplus} moedas`);

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

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          'wallet.balance': coinsSurplus,
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



router.post('/buy-with-wallet-and-recyclables', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { benefitId, quantity, recyclablesOffered } = req.body;
    const qty = Math.max(1, parseInt(quantity) || 1);

    if (!benefitId) {
      await session.abortTransaction();
      return res.status(400).json({ error: "ID do benefício é obrigatório." });
    }

    if (!Array.isArray(recyclablesOffered) || recyclablesOffered.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Selecione ao menos um reciclável." });
    }

    const benefit = await Benefit.findById(benefitId).session(session);
    if (!benefit) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Benefício não encontrado." });
    }

    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const unitCost = Number(benefit.coinsCost || benefit.pointsCost || 0);
    const totalBenefitCost = unitCost * qty;

    if (unitCost <= 0 || totalBenefitCost <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Preço do benefício inválido." });
    }

    const walletBalance = Number(user.wallet?.balance || 0);
    const walletUsed = Math.min(walletBalance, totalBenefitCost);
    const remainingCost = totalBenefitCost - walletUsed;

    const totalRecyclingPoints = recyclablesOffered.reduce((sum, item) => {
      const recyclableQty = Number(item.quantity) || 0;
      const pointsPerUnit = Number(item.pointsPerUnit) || 0;
      return sum + (recyclableQty * pointsPerUnit);
    }, 0);

    if (totalRecyclingPoints < remainingCost) {
      await session.abortTransaction();
      return res.status(400).json({
        error: `Valor insuficiente. Faltam ${remainingCost - totalRecyclingPoints} moedas em recicláveis para completar a troca.`
      });
    }

    const coinsSurplus = totalRecyclingPoints - remainingCost;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          "wallet.balance": (-walletUsed + coinsSurplus),
          "wallet.totalRecycledPoints": totalRecyclingPoints
        }
      },
      {
        session,
        new: true,
        runValidators: true
      }
    );

    const tradeData = {
      beneficiaryId: req.user._id,
      recyclablesOffered,
      benefitsRequested: [
        {
          benefitId: benefit._id,
          benefitName: benefit.name,
          quantity: qty,
          pointsCost: unitCost
        }
      ],
      totalRecyclingPoints,
      totalBenefitCost,
      coinsSurplus,
      tradeType: "with_benefit",
      status: "pendente"
    };

    const newTrade = new Trade(tradeData);
    await newTrade.save({ session });

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Troca híbrida realizada com sucesso!",
      tradeId: newTrade._id,
      benefit: benefit.name,
      quantity: qty,
      unitCost,
      totalBenefitCost,
      walletUsed,
      remainingCost,
      recyclingPointsUsed: remainingCost,
      recyclingPointsGenerated: totalRecyclingPoints,
      coinsSurplus,
      walletBalanceBefore: walletBalance,
      walletBalanceAfter: updatedUser.wallet.balance
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ ERRO TROCA HÍBRIDA:", error);
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});



// ✅ NOVA ROTA: COMPRA COM SALDO DA CARTEIRA
router.post('/buy-with-wallet', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { benefitId, quantity } = req.body;

    const qty = Math.max(1, parseInt(quantity) || 1);

    if (!benefitId) {
      await session.abortTransaction();
      return res.status(400).json({ error: "ID do benefício é obrigatório." });
    }

    const benefit = await Benefit.findById(benefitId).session(session);
    if (!benefit) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Benefício não encontrado." });
    }

    const pricePerUnit = benefit.coinsCost || benefit.pointsCost || 0;
    if (pricePerUnit <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Preço do benefício inválido." });
    }

    const totalPrice = pricePerUnit * qty;

    console.log(`🛒 COMPRA: Benefício "${benefit.name}" custa ${pricePerUnit} moedas por unidade`);
    console.log(`📦 Quantidade: ${qty} | Total: ${totalPrice} moedas`);

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        "wallet.balance": { $gte: totalPrice }
      },
      {
        $inc: {
          "wallet.balance": -totalPrice
        }
      },
      {
        session,
        new: true,
        runValidators: true
      }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      return res.status(400).json({
        error: "Saldo insuficiente para realizar a troca."
      });
    }

    console.log(`💰 SALDO ATUALIZADO: ${updatedUser.wallet.balance}`);

    const tradeData = {
      beneficiaryId: req.user._id,
      recyclablesOffered: [],
      benefitsRequested: [{
        benefitId: benefit._id,
        benefitName: benefit.name,
        quantity: qty,
        pointsCost: pricePerUnit
      }],
      totalRecyclingPoints: 0,
      totalBenefitCost: totalPrice,
      coinsSurplus: 0,
      tradeType: "with_benefit",
      status: "pendente"
    };

    const newTrade = new Trade(tradeData);
    await newTrade.save({ session });

    await session.commitTransaction();
    console.log('✅ COMPRA COM CARTEIRA CONCLUÍDA!');

    return res.json({
      success: true,
      message: "Troca realizada com sucesso!",
      tradeId: newTrade._id,
      benefit: benefit.name,
      quantity: qty,
      coinsSpent: totalPrice,
      walletBalance: updatedUser.wallet.balance
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ ERRO COMPRA CARTEIRA:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;