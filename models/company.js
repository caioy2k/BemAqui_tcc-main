const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome da empresa é obrigatório."],
      trim: true
    },
    cnpj: {
      type: String,
      required: [true, "CNPJ é obrigatório."],
      unique: true
    },
    email: {
      type: String,
      required: [true, "E-mail é obrigatório."],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, "Telefone é obrigatório."]
    },
    password: {
      type: String,
      required: [true, "Senha é obrigatória."],
      minlength: 6
    }
  },
  {
    timestamps: true
  }
);

companySchema.pre("save", async function (next) {
  if (this.cnpj) {
    this.cnpj = String(this.cnpj).replace(/\D/g, "");
  }

  if (this.phone) {
    this.phone = String(this.phone).replace(/\D/g, "");
  }

  if (this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }

  if (this.name) {
    this.name = String(this.name).trim();
  }

  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

companySchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Company", companySchema);