const express = require("express");
const jwt = require("jsonwebtoken");
const Company = require("../models/company");

const router = express.Router();

function generateToken(company) {
  return jwt.sign(
    {
      id: company._id,
      email: company.email,
      type: "company"
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { name, cnpj, email, phone, password } = req.body;

    if (!name || !cnpj || !email || !phone || !password) {
      return res.status(400).json({
        error: "Preencha nome, CNPJ, e-mail, telefone e senha."
      });
    }

    const cleanedCnpj = String(cnpj).replace(/\D/g, "");
    const cleanedPhone = String(phone).replace(/\D/g, "");
    const cleanedEmail = String(email).trim().toLowerCase();

    const companyWithEmail = await Company.findOne({ email: cleanedEmail });
    if (companyWithEmail) {
      return res.status(400).json({ error: "Já existe uma empresa com este e-mail." });
    }

    const companyWithCnpj = await Company.findOne({ cnpj: cleanedCnpj });
    if (companyWithCnpj) {
      return res.status(400).json({ error: "Já existe uma empresa com este CNPJ." });
    }

    const company = await Company.create({
      name,
      cnpj: cleanedCnpj,
      email: cleanedEmail,
      phone: cleanedPhone,
      password
    });

    return res.status(201).json({
      message: "Empresa cadastrada com sucesso.",
      company: {
        _id: company._id,
        name: company.name,
        cnpj: company.cnpj,
        email: company.email,
        phone: company.phone
      }
    });
  } catch (error) {
    console.error("Erro ao cadastrar empresa:", error);
    return res.status(500).json({ error: "Erro interno ao cadastrar empresa." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Informe e-mail e senha." });
    }

    const cleanedEmail = String(email).trim().toLowerCase();

    const company = await Company.findOne({ email: cleanedEmail });
    if (!company) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const passwordMatch = await company.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const token = generateToken(company);

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      token,
      company: {
        _id: company._id,
        name: company.name,
        cnpj: company.cnpj,
        email: company.email,
        phone: company.phone
      }
    });
  } catch (error) {
    console.error("Erro ao fazer login da empresa:", error);
    return res.status(500).json({ error: "Erro interno ao fazer login." });
  }
});

module.exports = router;