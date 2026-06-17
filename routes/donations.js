const express = require("express");
const router = express.Router();
const Donation = require("../models/Donation");

router.post("/", async (req, res) => {
  try {
    const {
      donorId,
      itemName,
      category,
      quantity,
      unit,
      expiryDate,
      condition,
      description,
      pickupInfo,
      images
    } = req.body;

    const donation = new Donation({
      donorId,
      itemName,
      category,
      quantity,
      unit,
      expiryDate,
      condition,
      description,
      pickupInfo,
      images
    });

    await donation.save();

    return res.status(201).json({
      message: "Doação enviada com sucesso.",
      donation
    });
  } catch (error) {
    console.error("Erro ao salvar doação:", error);
    return res.status(500).json({
      error: "Erro ao salvar doação."
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    return res.json({ donations });
  } catch (error) {
    console.error("Erro ao listar doações:", error);
    return res.status(500).json({ error: "Erro ao listar doações." });
  }
});

module.exports = router;
