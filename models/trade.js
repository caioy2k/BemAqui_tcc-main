const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  recyclablesOffered: [
    {
      recyclableId: { type: mongoose.Schema.Types.ObjectId, ref: "Recyclable" },
      recyclableName: String,
      recyclableEmoji: String,
      quantity: { type: Number, required: true, min: 1 },
      pointsPerUnit: { type: Number, default: 0, min: 0 },
    },
  ],

  benefitsRequested: [
    {
      benefitId: { type: mongoose.Schema.Types.ObjectId, ref: "Benefit" },
      benefitName: String,
      benefitEmoji: String,
      quantity: { type: Number, required: true, min: 1 },
      pointsCost: { type: Number, default: 0, min: 0 },
    },
  ],

  coinsOfferedFromWallet: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalRecyclingPoints: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalBenefitCost: {
    type: Number,
    default: 0,
    min: 0,
  },

  coinsSurplus: {
    type: Number,
    default: 0,
    min: 0,
  },

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

  confirmedAt: Date,
  completedAt: Date,

  totalPointsOffered: Number,
  totalPointsRequested: Number,
  recyclableOnlyTrade: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Trade", tradeSchema);
