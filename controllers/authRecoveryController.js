const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');

function generateNumericCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Informe o e-mail.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (user) {
      const code = generateNumericCode(6);
      const codeHash = await bcrypt.hash(code, 10);

      user.resetPasswordCodeHash = codeHash;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.resetPasswordUsed = false;
      user.resetPasswordAttempts = 0;

      await user.save();

      await sendEmail({
        to: cleanEmail,
        subject: 'Código de redefinição de senha - BemAqui',
        text: `Seu código de redefinição é: ${code}. Ele expira em 15 minutos.`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #222;">
            <h2>BemAqui - Redefinição de senha</h2>
            <p>Seu código de redefinição é:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a;">
              ${code}
            </div>
            <p>Esse código expira em 15 minutos.</p>
          </div>
        `
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Se o e-mail existir em nossa base, um código de recuperação foi enviado.'
    });
  } catch (err) {
    console.error('Erro em forgotPassword:', err);
    return res.status(500).json({
      success: false,
      error: 'Erro ao solicitar código de recuperação.'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Preencha todos os campos.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'As senhas não coincidem.'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A nova senha deve ter pelo menos 6 caracteres.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        error: 'Código inválido ou expirado.'
      });
    }

    if (user.resetPasswordUsed) {
      return res.status(400).json({
        success: false,
        error: 'Esse código já foi utilizado.'
      });
    }

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        error: 'Código expirado. Solicite um novo.'
      });
    }

    const isCodeValid = await bcrypt.compare(cleanCode, user.resetPasswordCodeHash);

    if (!isCodeValid) {
      user.resetPasswordAttempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        error: 'Código inválido ou expirado.'
      });
    }

    user.password = newPassword;
    user.resetPasswordCodeHash = null;
    user.resetPasswordExpires = null;
    user.resetPasswordUsed = true;
    user.resetPasswordAttempts = 0;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso.'
    });
  } catch (err) {
    console.error('Erro em resetPassword:', err);
    return res.status(500).json({
      success: false,
      error: 'Erro ao redefinir senha.'
    });
  }
};