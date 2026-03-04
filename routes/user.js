const express = require('express');
const User = require('../models/user.js');  // ← FALTAVA PRA WALLET
const Transaction = require('../models/transaction');
const jwt = require('jsonwebtoken');  // ← FALTAVA ISSO!
const router = express.Router();

// ✅ MIDDLEWARE CORRIGIDO
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token não fornecido." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "sua_chave_secreta_aqui");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};

// GET /api/user/wallet
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      wallet: user.wallet,
      formatted: {
        balance: user.wallet.balance.toFixed(2),
        totalEarned: user.wallet.totalEarned.toFixed(2),
        totalSpent: user.wallet.totalSpent.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/transactions
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('tradeId', 'status coinsSurplus')
      .sort({ createdAt: -1 })
      .limit(20);

    const summary = {
      totalEarned: transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0),
      totalSpent: transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0)
    };

    res.json({ success: true, transactions, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
