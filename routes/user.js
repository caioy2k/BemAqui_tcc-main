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
router.get("/wallet", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const wallet = {
      balance: Number(user?.wallet?.balance || 0),
      totalEarned: Number(user?.wallet?.totalEarned || 0),
      totalSpent: Number(user?.wallet?.totalSpent || 0),
      totalRecycledPoints: Number(user?.wallet?.totalRecycledPoints || 0)
    };

    return res.json({
      success: true,
      wallet,
      formatted: {
        balance: wallet.balance.toFixed(2),
        totalEarned: wallet.totalEarned.toFixed(2),
        totalSpent: wallet.totalSpent.toFixed(2),
        totalRecycledPoints: wallet.totalRecycledPoints.toFixed(2)
      }
    });
  } catch (error) {
    console.error("Erro ao carregar wallet:", error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/user/transactions
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate("tradeId", "status coinsSurplus")
      .sort({ createdAt: -1 })
      .limit(20);

    const summary = {
      totalEarned: transactions
        .filter((t) => t.type === "earn")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
      totalSpent: transactions
        .filter((t) => t.type === "spend")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    };

    return res.json({
      success: true,
      transactions,
      summary
    });
  } catch (error) {
    console.error("Erro ao carregar transactions:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
