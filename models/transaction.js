const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["earn", "spend"], required: true },
  reason: { 
    type: String, 
    enum: ["recyclable_donation", "benefit_purchase", "wallet_transfer"],
    required: true 
  },
  amount: { type: Number, required: true, min: 0 },
  description: String,
  tradeId: { type: mongoose.Schema.Types.ObjectId, ref: "Trade" },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", transactionSchema);
