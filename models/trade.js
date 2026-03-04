const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // TIPO 1: Reciclagem + Benefício
  recyclablesOffered: [
    {
      recyclableId: { type: mongoose.Schema.Types.ObjectId, ref: "Recyclable" },
      recyclableName: String,
      quantity: { type: Number, required: true, min: 0 },
      pointsPerUnit: Number,
    },
  ],

  benefitsRequested: [
    {
      benefitId: { type: mongoose.Schema.Types.ObjectId, ref: "Benefit" },
      benefitName: String,
      quantity: { type: Number, required: true, min: 0 },
      pointsCost: Number,
    },
  ],

  // 🪙 ECOSSISTEMA DE MOEDAS (CAMPOS PRINCIPAIS)
  coinsOfferedFromWallet: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalRecyclingPoints: {
    type: Number,
    
    min: 0,
  },

  totalBenefitCost: {
    type: Number,
    
    min: 0,
  },

  coinsSurplus: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Configurações da troca
  tradeType: {
    type: String,
    enum: ["with_benefit", "recyclable_only"],
    default: "with_benefit",
  },

  status: {
    type: String,
    enum: ["pendente", "confirmado", "concluido", "cancelado"],
    default: "pendente",
  },

  // Datas
  confirmedAt: Date,
  completedAt: Date,

  // Campos legados (compatibilidade)
  totalPointsOffered: Number,
  totalPointsRequested: Number,
  recyclableOnlyTrade: { type: Boolean, default: false },
}, 
{ 
  timestamps: true 
});

module.exports = mongoose.model("Trade", tradeSchema);
