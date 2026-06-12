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

  const companyRepresentative =
    companyData.representative ||
    companyData.responsavel ||
    companyData.nomeResponsavel ||
    "Responsável institucional";

  document.querySelectorAll("[data-company-name]").forEach((element) => {
    element.textContent = companyName;
  });

  document.querySelectorAll("[data-company-contact]").forEach((element) => {
    element.textContent = companyEmail;
  });

  document.querySelectorAll("[data-company-phone]").forEach((element) => {
    element.textContent = companyPhone;
  });

  document.querySelectorAll("[data-company-representative]").forEach((element) => {
    element.textContent = companyRepresentative;
  });

  const logoutButton = document.getElementById("btn-logout-company");

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("companyToken");
      localStorage.removeItem("bemaquiCompany");
      window.location.href = "./tela_login_empresa.html";
    });
  }
});