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
    const { name, category, description, pointsCost, quantity, emoji } = req.body;

    if (!name || !category || !description || !pointsCost || !emoji) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const newBenefit = await Benefit.create({
      name,
      category,
      description,
      pointsCost,
      quantity,
      emoji,
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

router.put('/:id', async (req, res) => {
  try {
    const updatedBenefit = await Benefit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBenefit) {
      return res.status(404).json({ error: 'Benefício não encontrado.' });
    }

    res.json({
      message: 'Benefício atualizado com sucesso.',
      benefit: updatedBenefit
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar benefício.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedBenefit = await Benefit.findByIdAndDelete(req.params.id);

    if (!deletedBenefit) {
      return res.status(404).json({ error: 'Benefício não encontrado.' });
    }

    res.json({ message: 'Benefício excluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir benefício.' });
  }
});

module.exports = router;
