const mongoose = require("mongoose");

const benefitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["alimentos", "roupas", "utensilio", "higiene", "outro"],
    },
    description: {
      type: String,
      required: true,
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 1,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ativo", "inativo"],
      default: "ativo",
    },
  },
  { timestamps: true }
);

const Benefit = mongoose.model("Benefit", benefitSchema);

module.exports = Benefit;
