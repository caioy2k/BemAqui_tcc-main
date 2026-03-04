const mongoose = require("mongoose");

const recyclableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["plastico", "papel", "vidro", "metal", "organico"],
    },
    description: {
      type: String,
      required: true,
    },
    pointsValue: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["ativo", "inativo"],
      default: "ativo",
    },
  },
  { timestamps: true }
);

const Recyclable = mongoose.model("Recyclable", recyclableSchema);

module.exports = Recyclable;
