const express = require('express');
const Benefit = require('../models/benefit');
const jwt = require('jsonwebtoken');  // ← FALTAVA ISSO!
const router = express.Router();

// ✅ MIDDLEWARES DEFINIDOS AQUI
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

const isAdminMiddleware = (req, res, next) => {  // ← FALTAVA ISSO!
  if (!req.user.isAdmin) return res.status(403).json({ error: "Acesso negado. Apenas admins." });
  next();
};

// GET /benefits (público)
router.get('/', async (req, res) => {
  try {
    const benefits = await Benefit.find({ status: "ativo" });
    res.json({ benefits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar benefícios." });
  }
});

// POST /benefits (apenas admin)
router.post('/', authMiddleware, isAdminMiddleware, async (req, res) => {
  try {
    const { name, category, description, pointsCost, quantity } = req.body;

    if (!name || !category || !description || !pointsCost) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const newBenefit = await Benefit.create({
      name,
      category,
      description,
      pointsCost,
      quantity,
      status: "ativo",
    });

    res.status(201).json({
      message: "Benefício cadastrado com sucesso.",
      benefit: newBenefit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar benefício." });
  }
});

module.exports = router;
