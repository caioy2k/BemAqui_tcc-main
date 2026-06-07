document.addEventListener("DOMContentLoaded", () => {
  const companyData = JSON.parse(localStorage.getItem("bemaquiCompany") || "{}");
  const companyName =
    companyData.name ||
    companyData.companyName ||
    companyData.razaoSocial ||
    "Empresa Parceira";

  document.querySelectorAll("[data-company-name]").forEach((element) => {
    element.textContent = companyName;
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