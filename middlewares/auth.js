const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token ausente ou inválido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "sua_chave_secreta_aqui");

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro auth middleware:', error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
