const express = require('express');
const User = require('../models/user.js');
const jwt = require('jsonwebtoken');  // ← FALTAVA ISSO!
const router = express.Router();

// POST /auth/register (copie TODO seu código atual do server.js)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
    }

    if (!role || !["beneficiario", "doador", "parceiro"].includes(role)) {
      return res.status(400).json({ error: "Tipo de usuário inválido." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email já cadastrado." });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      isAdmin: false,
      isEmployee: false,
    });

    res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isAdmin: newUser.isAdmin,
        isEmployee: newUser.isEmployee,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

// POST /auth/login (copie TODO seu código atual do server.js)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Informe e-mail e senha." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        isEmployee: user.isEmployee,
      },
      process.env.JWT_SECRET || "sua_chave_secreta_aqui",
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({
      message: "Login realizado com sucesso.",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor ao fazer login." });
  }
});

module.exports = router;
