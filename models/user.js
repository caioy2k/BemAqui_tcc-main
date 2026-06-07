const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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

    cpf: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    bairro: {
      type: String,
      default: "",
      trim: true,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    isEmployee: {
      type: Boolean,
      default: false,
    },

    totalRecycledPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    wallet: {
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalEarned: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addCoins = async function (amount, reason = "trade") {
  if (amount < 0) {
    throw new Error("O valor para adicionar moedas deve ser positivo");
  }

  this.wallet.balance += amount;
  this.wallet.totalEarned += amount;
  await this.save();

  return this.wallet.balance;
};

userSchema.methods.removeCoins = async function (amount, reason = "trade") {
  if (amount < 0) {
    throw new Error("O valor para remover moedas deve ser positivo");
  }

  if (this.wallet.balance < amount) {
    throw new Error("Saldo insuficiente na carteira");
  }

  this.wallet.balance -= amount;
  this.wallet.totalSpent += amount;
  await this.save();

  return this.wallet.balance;
};

module.exports = mongoose.model("User", userSchema);