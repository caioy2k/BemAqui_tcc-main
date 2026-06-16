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
    console.log("1 - entrou no forgotPassword");

    const { email } = req.body;
    console.log("2 - email recebido:", email);

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    console.log("3 - user encontrado?", !!user);

    if (user) {
      const code = "123456"; // temporário só para teste
      console.log("4 - código gerado");

      await sendEmail({
  to: cleanEmail,
  subject: "Código de redefinição de senha - BemAqui",
  text: `Seu código de recuperação é: ${code}`,
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Código de redefinição</h2>
      <p>Seu código de recuperação é:</p>
      <p style="font-size: 24px; font-weight: bold;">${code}</p>
      <p>Esse código expira em 15 minutos.</p>
    </div>
  `
});

      console.log("5 - email enviado");
    }

    console.log("6 - enviando resposta");
    return res.status(200).json({
      success: true,
      message: "Se o e-mail existir, o código foi enviado."
    });
  } catch (err) {
    console.error("Erro real em forgotPassword:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Erro ao solicitar código de recuperação."
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