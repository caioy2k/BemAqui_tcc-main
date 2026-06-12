document.addEventListener("DOMContentLoaded", () => {
  const companyData = JSON.parse(localStorage.getItem("bemaquiCompany") || "{}");

  const companyName =
    companyData.name ||
    companyData.companyName ||
    companyData.razaoSocial ||
    "Empresa Parceira";

  const companyEmail =
    companyData.email ||
    companyData.companyEmail ||
    "contato@empresa.com";

  const companyPhone =
    companyData.phone ||
    companyData.telefone ||
    "(11) 99999-9999";

  document.querySelectorAll("[data-company-name]").forEach((element) => {
    element.textContent = companyName;
  });

  document.querySelectorAll("[data-company-email]").forEach((element) => {
    element.textContent = companyEmail;
  });

  document.querySelectorAll("[data-company-phone]").forEach((element) => {
    element.textContent = companyPhone;
  });

  const companyNameInput = document.querySelector("[data-company-input]");
  const companyEmailInput = document.querySelector("[data-company-email-input]");
  const companyPhoneInput = document.querySelector("[data-company-phone-input]");

  if (companyNameInput) companyNameInput.value = companyName;
  if (companyEmailInput) companyEmailInput.value = companyEmail;
  if (companyPhoneInput) companyPhoneInput.value = companyPhone;

  const form = document.getElementById("partner-contact-form");
  const feedback = document.getElementById("contact-feedback");
  const logoutButton = document.getElementById("btn-logout-company");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const subject = document.getElementById("subject")?.value.trim();
      const message = document.getElementById("message")?.value.trim();

      if (!subject || !message) {
        feedback.textContent = "Preencha o assunto e a mensagem para continuar.";
        return;
      }

      feedback.textContent = "Mensagem enviada com sucesso no ambiente demonstrativo.";
      form.reset();

      if (companyNameInput) companyNameInput.value = companyName;
      if (companyEmailInput) companyEmailInput.value = companyEmail;
      if (companyPhoneInput) companyPhoneInput.value = companyPhone;
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("companyToken");
      localStorage.removeItem("bemaquiCompany");
      window.location.href = "./tela_login_empresa.html";
    });
  }
});