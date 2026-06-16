const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();


console.log("BREVO_API_KEY exists?", !!process.env.BREVO_API_KEY);
console.log("EMAIL_FROM exists?", !!process.env.EMAIL_FROM);
console.log("EMAIL_FROM_NAME:", process.env.EMAIL_FROM_NAME);





async function sendEmail({ to, subject, html, text }) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;
  const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "BemAqui";


  

  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY não configurada.");
  }

  if (!EMAIL_FROM) {
    throw new Error("EMAIL_FROM não configurado.");
  }

  if (!to) {
    throw new Error("Destinatário 'to' não informado.");
  }

  if (!subject) {
    throw new Error("Assunto 'subject' não informado.");
  }

  if (!html && !text) {
    throw new Error("Informe 'html' ou 'text' para o corpo do e-mail.");
  }

  const receivers = Array.isArray(to)
    ? to.map(item => {
        if (typeof item === "string") {
          return { email: item };
        }

        return {
          email: item.email,
          name: item.name
        };
      })
    : [
        typeof to === "string"
          ? { email: to }
          : { email: to.email, name: to.name }
      ];

  try {
    const result = await emailApi.sendTransacEmail({
      sender: {
        email: EMAIL_FROM,
        name: EMAIL_FROM_NAME
      },
      to: receivers,
      subject,
      htmlContent: html || undefined,
      textContent: text || undefined
    });

    return result;
  } catch (err) {
    const apiMessage =
      err?.response?.body?.message ||
      err?.response?.body?.code ||
      err?.message ||
      "Erro ao enviar e-mail pelo Brevo.";

    console.error("Erro sendEmail Brevo:", err?.response?.body || err);
    throw new Error(apiMessage);
  }
}

module.exports = sendEmail;