const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];

apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Variáveis BREVO_API_KEY ou EMAIL_FROM não configuradas.");
  }

  const receivers = Array.isArray(to)
    ? to.map(email => ({ email }))
    : [{ email: to }];

  const result = await emailApi.sendTransacEmail({
    sender: {
      email: process.env.EMAIL_FROM,
      name: process.env.EMAIL_FROM_NAME || "BemAqui"
    },
    to: receivers,
    subject,
    htmlContent: html || undefined,
    textContent: text || undefined
  });

  return result;
}

module.exports = sendEmail;