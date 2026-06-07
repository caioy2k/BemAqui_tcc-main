const express = require("express");
const Company = require("../models/company");
const authCompany = require("../middlewares/authCompany");

const router = express.Router();

router.get("/me", authCompany, async (req, res) => {
  try {
    const company = await Company.findById(req.companyId).select("-password");

    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada." });
    }

    return res.status(200).json(company);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return res.status(500).json({ error: "Erro interno ao buscar empresa." });
  }
});

router.put("/me", authCompany, async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const company = await Company.findById(req.companyId);

    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada." });
    }

    if (name) company.name = String(name).trim();
    if (phone) company.phone = String(phone).replace(/\D/g, "");
    if (email) company.email = String(email).trim().toLowerCase();

    await company.save();

    return res.status(200).json({
      message: "Dados da empresa atualizados com sucesso.",
      company: {
        _id: company._id,
        name: company.name,
        cnpj: company.cnpj,
        email: company.email,
        phone: company.phone
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return res.status(500).json({ error: "Erro interno ao atualizar empresa." });
  }
});

module.exports = router;