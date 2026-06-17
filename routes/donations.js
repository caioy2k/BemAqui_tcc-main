const express = require("express");
const router = express.Router();
const Donation = require("../models/donation");

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
    const { donorId } = req.query;

    const filter = {};
    if (donorId) {
      filter.donorId = donorId;
    }

    const donations = await Donation.find(filter)
      .populate("donorId", "name email phone")
      .sort({ createdAt: -1 });

    return res.json({ donations });
  } catch (error) {
    console.error("Erro ao listar doações:", error);
    return res.status(500).json({ error: "Erro ao listar doações." });
  }
});



router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    const allowedStatus = ["Em análise", "Aprovado", "Repassado", "Recusado"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      {
        status,
        reviewNote: reviewNote || "",
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!updatedDonation) {
      return res.status(404).json({ error: "Doação não encontrada." });
    }

    return res.json({
      message: "Status atualizado com sucesso.",
      donation: updatedDonation
    });
  } catch (error) {
    console.error("Erro ao atualizar status da doação:", error);
    return res.status(500).json({ error: "Erro interno ao atualizar a doação." });
  }
});


module.exports = router;
