const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

function generateNumericCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Informe o e-mail."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const code = generateNumericCode(6);
      const codeHash = await bcrypt.hash(code, 10);

      user.resetPasswordCodeHash = codeHash;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.resetPasswordUsed = false;

      await user.save();

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2>Recuperação de senha - BemAqui</h2>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p>Seu código é:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #16a34a;">
            ${code}
          </div>
          <p>Esse código expira em 15 minutos e só pode ser usado uma vez.</p>
          <p>Se você não solicitou a redefinição, ignore este e-mail.</p>
        </div>
      `;

      const text = `Recuperação de senha - BemAqui\n\nSeu código é: ${code}\n\nEsse código expira em 15 minutos.`;

      await sendEmail({
        to: normalizedEmail,
        subject: "Código de redefinição de senha - BemAqui",
        html,
        text
      });
    }

    return res.status(200).json({
      message: "Se o e-mail existir em nossa base, um código de recuperação foi enviado."
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      error: "Erro ao solicitar código de recuperação."
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Preencha todos os campos."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "As senhas não coincidem."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "A nova senha deve ter pelo menos 6 caracteres."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpires) {
      return res.status(400).json({
        error: "Código inválido ou expirado."
      });
    }

    if (user.resetPasswordUsed) {
      return res.status(400).json({
        error: "Esse código já foi utilizado."
      });
    }

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        error: "Código expirado. Solicite um novo."
      });
    }

    const isCodeValid = await bcrypt.compare(code.trim(), user.resetPasswordCodeHash);

    if (!isCodeValid) {
      return res.status(400).json({
        error: "Código inválido ou expirado."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.senha = hashedPassword;
    user.resetPasswordCodeHash = null;
    user.resetPasswordExpires = null;
    user.resetPasswordUsed = true;

    await user.save();

    return res.status(200).json({
      message: "Senha redefinida com sucesso."
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      error: "Erro ao redefinir senha."
    });
  }
};