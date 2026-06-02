const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome da empresa é obrigatório.'],
      trim: true
    },
    cnpj: {
      type: String,
      required: [true, 'CNPJ é obrigatório.'],
      unique: true
    },
    email: {
      type: String,
      required: [true, 'E-mail é obrigatório.'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Telefone é obrigatório.']
    }
  },
  {
    timestamps: true
  }
);

companySchema.pre('save', function (next) {
  if (this.cnpj) {
    this.cnpj = String(this.cnpj).replace(/\D/g, '');
  }

  if (this.phone) {
    this.phone = String(this.phone).replace(/\D/g, '');
  }

  if (this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }

  if (this.name) {
    this.name = String(this.name).trim();
  }

  next();
});

module.exports = mongoose.model('Company', companySchema);