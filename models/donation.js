const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    expiryDate: {
      type: String,
      default: ""
    },
    condition: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    pickupInfo: {
      type: String,
      required: true,
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      default: "Em análise"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
