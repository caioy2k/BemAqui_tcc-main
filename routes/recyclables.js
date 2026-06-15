const express = require('express');
const Recyclable = require('../models/recyclable');
const jwt = require('jsonwebtoken');  // ← ADICIONE
const router = express.Router();

// ✅ DEFINIR OS MIDDLEWARES AQUI
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

const isAdminMiddleware = (req, res, next) => {  // ← ADICIONE ISSO
  if (!req.user.isAdmin) return res.status(403).json({ error: "Acesso negado. Apenas admins." });
  next();
};

// GET /recyclables
router.get('/', async (req, res) => {
  try {
    const recyclables = await Recyclable.find({ status: "ativo" });
    res.json({ recyclables });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar recicláveis." });
  }
});

// POST /recyclables (admin)
router.post('/', authMiddleware, isAdminMiddleware, async (req, res) => {
  try {
    const { name, type, description, pointsValue } = req.body;
    if (!name || !type || !description || !pointsValue) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }
    const newRecyclable = await Recyclable.create({
      name, type, description, pointsValue, status: "ativo",
    });
    res.status(201).json({
      message: "Reciclável cadastrado com sucesso.",
      recyclable: newRecyclable,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar reciclável." });
  }
});


// PUT /recyclables/:id (admin)
router.put('/:id', authMiddleware, isAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description, pointsValue } = req.body;

    if (!name || !type || !description || !pointsValue) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const updatedRecyclable = await Recyclable.findByIdAndUpdate(
      id,
      {
        name,
        type,
        description,
        pointsValue,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedRecyclable) {
      return res.status(404).json({ error: "Reciclável não encontrado." });
    }

    res.json({
      message: "Reciclável atualizado com sucesso.",
      recyclable: updatedRecyclable,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar reciclável." });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedRecyclable = await Recyclable.findByIdAndDelete(req.params.id);

    if (!deletedRecyclable) {
      return res.status(404).json({ error: 'Reciclavel não encontrado.' });
    }

    res.json({ message: 'Reciclavel excluído com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir benefício.' });
  }
});

module.exports = router;
