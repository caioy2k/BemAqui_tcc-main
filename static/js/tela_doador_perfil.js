document.addEventListener("DOMContentLoaded", () => {
  const defaultProfile = {
    fullName: "Caio",
    email: "caio@email.com",
    phone: "(11) 99999-9999",
    city: "São Paulo",
    bio: "Doador cadastrado na plataforma BemAqui.",
    preferences: {
      emailUpdates: true,
      statusAlerts: true,
      news: false
    }
  };

  const savedProfile =
    JSON.parse(localStorage.getItem("bemaquiDonorProfile")) || defaultProfile;

  const savedSubmissions =
    JSON.parse(localStorage.getItem("bemaquiSubmissions")) || [];

  const form = document.getElementById("profileForm");
  const feedback = document.getElementById("profileFeedback");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const cityInput = document.getElementById("city");
  const bioInput = document.getElementById("bio");

  const prefEmail = document.getElementById("prefEmail");
  const prefStatus = document.getElementById("prefStatus");
  const prefNews = document.getElementById("prefNews");

  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileDisplayEmail = document.getElementById("profileDisplayEmail");
  const profileAvatar = document.getElementById("profileAvatar");
  const summaryName = document.getElementById("summaryName");
  const summaryEmail = document.getElementById("summaryEmail");
  const summaryPhone = document.getElementById("summaryPhone");
  const summaryCity = document.getElementById("summaryCity");
  const profileMainContact = document.getElementById("profileMainContact");
  const profileSubmissionCount = document.getElementById("profileSubmissionCount");
  const profileLastActivity = document.getElementById("profileLastActivity");
  const accountStatus = document.getElementById("accountStatus");
  const saveProfileBtn = document.getElementById("saveProfileBtn");

  function getInitials(name) {
    if (!name) return "D";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  function fillForm(profile) {
    fullNameInput.value = profile.fullName || "";
    emailInput.value = profile.email || "";
    phoneInput.value = profile.phone || "";
    cityInput.value = profile.city || "";
    bioInput.value = profile.bio || "";

    prefEmail.checked = !!profile.preferences?.emailUpdates;
    prefStatus.checked = !!profile.preferences?.statusAlerts;
    prefNews.checked = !!profile.preferences?.news;
  }

  function updateProfileView(profile) {
    profileDisplayName.textContent = profile.fullName || "Doador";
    profileDisplayEmail.textContent = profile.email || "email@exemplo.com";
    profileAvatar.textContent = getInitials(profile.fullName);

    summaryName.textContent = profile.fullName || "-";
    summaryEmail.textContent = profile.email || "-";
    summaryPhone.textContent = profile.phone || "-";
    summaryCity.textContent = profile.city || "Não informada";

    profileMainContact.textContent = profile.phone || "-";
  }

  function updateStats() {
    profileSubmissionCount.textContent = savedSubmissions.length;

    if (savedSubmissions.length > 0) {
      profileLastActivity.textContent = savedSubmissions[0].date || "Recente";
      accountStatus.textContent = "Perfil vinculado a submissões";
    } else {
      profileLastActivity.textContent = "Sem envios";
      accountStatus.textContent = "Perfil atualizado";
    }
  }

  function saveProfile() {
    const newProfile = {
      fullName: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      city: cityInput.value.trim(),
      bio: bioInput.value.trim(),
      preferences: {
        emailUpdates: prefEmail.checked,
        statusAlerts: prefStatus.checked,
        news: prefNews.checked
      }
    };

    localStorage.setItem("bemaquiDonorProfile", JSON.stringify(newProfile));
    updateProfileView(newProfile);
    feedback.textContent = "Perfil salvo com sucesso.";
    accountStatus.textContent = "Dados atualizados recentemente";

    setTimeout(() => {
      feedback.textContent = "";
    }, 2500);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveProfile();
  });

  saveProfileBtn.addEventListener("click", saveProfile);

  fillForm(savedProfile);
  updateProfileView(savedProfile);
  updateStats();
});