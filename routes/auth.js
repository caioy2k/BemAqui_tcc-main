const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.js');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, cpf, phone, city } = req.body;

    if (!name || !email || !password || !role || !cpf || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Nome, e-mail, senha, tipo de usuário, CPF e telefone são obrigatórios.'
      });
    }

    if (!['beneficiario', 'doador', 'parceiro'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de usuário inválido.'
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCpf = String(cpf).replace(/\D/g, '');
    const cleanPhone = String(phone).replace(/\D/g, '');
    const cleanCity = String(city || '').trim();
    const cleanPassword = String(password);

    if (cleanCpf.length !== 11) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido.'
      });
    }

    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Telefone inválido.'
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A senha deve ter pelo menos 6 caracteres.'
      });
    }

    const existingUserByEmail = await User.findOne({ email: cleanEmail });
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email já cadastrado.'
      });
    }

    const existingUserByCpf = await User.findOne({ cpf: cleanCpf });
    if (existingUserByCpf) {
      return res.status(409).json({
        success: false,
        error: 'CPF já cadastrado.'
      });
    }

    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role,
      cpf: cleanCpf,
      phone: cleanPhone,
      city: cleanCity,
      isAdmin: false,
      isEmployee: false
    });

    const token = jwt.sign(
      {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isAdmin: newUser.isAdmin,
        isEmployee: newUser.isEmployee
      },
      process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
      { expiresIn: '7d' }
    );

    const userObject = newUser.toObject();
    delete userObject.password;

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso.',
      token,
      user: userObject
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({
      success: false,
      error: 'Erro ao cadastrar usuário.'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Informe e-mail e senha.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'E-mail ou senha inválidos.'
      });
    }

    const isPasswordValid =
      typeof user.comparePassword === 'function'
        ? await user.comparePassword(password)
        : await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'E-mail ou senha inválidos.'
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        isEmployee: user.isEmployee
      },
      process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
      { expiresIn: '7d' }
    );

    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso.',
      token,
      user: userObject
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor ao fazer login.'
    });
  }
});

module.exports = router;