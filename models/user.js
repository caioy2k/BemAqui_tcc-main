const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["beneficiario", "doador", "parceiro"],
    default: "beneficiario",
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isEmployee: {
    type: Boolean,
    default: false,
  },
  // 🪙 NOVO: Carteira Digital
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware: Criptografar senha ANTES de salvar
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  } catch (err) {
    throw err;
  }
});

// Método: Comparar senha
userSchema.methods.comparePassword = async function (passwordToCompare) {
  return await bcrypt.compare(passwordToCompare, this.password);
};

// Método: Adicionar moedas à carteira
userSchema.methods.addCoins = async function (amount, reason = "trade") {
  this.wallet.balance += amount;
  this.wallet.totalEarned += amount;
  await this.save();
  return this.wallet.balance;
};

// Método: Remover moedas da carteira
userSchema.methods.removeCoins = async function (amount, reason = "trade") {
  if (this.wallet.balance < amount) {
    throw new Error("Saldo insuficiente na carteira");
  }
  this.wallet.balance -= amount;
  this.wallet.totalSpent += amount;
  await this.save();
  return this.wallet.balance;
};

module.exports = mongoose.model("User", userSchema);
