const SibApiV3Sdk = require("sib-api-v3-sdk");

async function sendEmail({ to, subject, html, text }) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;
  const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "BemAqui";

  console.log("=== DEBUG BREVO ===");
  console.log("BREVO_API_KEY exists?", !!BREVO_API_KEY);
  console.log("EMAIL_FROM exists?", !!EMAIL_FROM);
  console.log("EMAIL_FROM_NAME:", EMAIL_FROM_NAME);
  console.log(
    "BREVO_API_KEY preview:",
    BREVO_API_KEY ? `${BREVO_API_KEY.slice(0, 8)}...${BREVO_API_KEY.slice(-4)}` : "undefined"
  );
  console.log("to recebido:", to);
  console.log("subject recebido:", subject);

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

  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = BREVO_API_KEY;

  const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  const receivers = Array.isArray(to)
    ? to.map(item => {
        if (typeof item === "string") return { email: item };
        return { email: item.email, name: item.name };
      })
    : [
        typeof to === "string"
          ? { email: to }
          : { email: to.email, name: to.name }
      ];

  const payload = {
    sender: {
      email: EMAIL_FROM,
      name: EMAIL_FROM_NAME
    },
    to: receivers,
    subject,
    htmlContent: html || undefined,
    textContent: text || undefined
  };

  console.log("Payload final Brevo:", JSON.stringify(payload, null, 2));

  try {
    const result = await emailApi.sendTransacEmail(payload);
    console.log("Brevo envio OK:", result);
    return result;
  } catch (err) {
    console.error("=== ERRO BREVO COMPLETO ===");
    console.error("err.message:", err?.message);
    console.error("err.response?.statusCode:", err?.response?.statusCode);
    console.error("err.response?.body:", err?.response?.body);
    console.error("err:", err);

    const apiMessage =
      err?.response?.body?.message ||
      err?.response?.body?.code ||
      err?.message ||
      "Erro ao enviar e-mail pelo Brevo.";

    throw new Error(apiMessage);
  }
}

module.exports = sendEmail;