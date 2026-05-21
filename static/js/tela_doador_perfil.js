const donorProfile = {
  name: "Caio Henrique",
  email: "caio@email.com",
  phone: "(11) 99999-0000",
  city: "São Paulo - SP",
  subtitle: "Participando ativamente das ações solidárias e ambientais do BemAqui.",
  stats: {
    submissions: 12,
    approved: 7,
    pending: 3,
    lastActivity: "Hoje"
  },
  activities: [
    {
      title: "Nova submissão enviada",
      description: "Você cadastrou uma nova doação de materiais escolares para análise.",
      date: "Hoje, 18:40"
    },
    {
      title: "Submissão aprovada",
      description: "Seu kit de higiene foi aceito e direcionado para atendimento interno.",
      date: "Ontem, 16:15"
    },
    {
      title: "Perfil atualizado",
      description: "As informações de contato da sua conta foram ajustadas com sucesso.",
      date: "16/05/2026"
    },
    {
      title: "Submissão em análise",
      description: "A equipe iniciou a avaliação de uma nova remessa de alimentos.",
      date: "15/05/2026"
    }
  ]
};

const profileName = document.getElementById("profileName");
const profileSubtitle = document.getElementById("profileSubtitle");
const infoName = document.getElementById("infoName");
const infoEmail = document.getElementById("infoEmail");
const infoPhone = document.getElementById("infoPhone");
const infoCity = document.getElementById("infoCity");

function renderProfile() {
  profileName.textContent = donorProfile.name;
  profileSubtitle.textContent = donorProfile.subtitle;
  infoName.textContent = donorProfile.name;
  infoEmail.textContent = donorProfile.email;
  infoPhone.textContent = donorProfile.phone;
  infoCity.textContent = donorProfile.city;

  document.getElementById("profileAvatar")?.remove();
  const avatar = document.querySelector(".profile-avatar");
  avatar.textContent = donorProfile.name.charAt(0).toUpperCase();

  document.getElementById("statSubmissions").textContent = donorProfile.stats.submissions;
  document.getElementById("statApproved").textContent = donorProfile.stats.approved;
  document.getElementById("statPending").textContent = donorProfile.stats.pending;
  document.getElementById("statLastActivity").textContent = donorProfile.stats.lastActivity;

  renderActivities();
}

function renderActivities() {
  const activityList = document.getElementById("activityList");
  activityList.innerHTML = "";

  donorProfile.activities.forEach(activity => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `
      <div class="activity-left">
        <strong>${activity.title}</strong>
        <p>${activity.description}</p>
      </div>
      <span class="activity-date">${activity.date}</span>
    `;
    activityList.appendChild(item);
  });
}

function openEditModal() {
  document.getElementById("editName").value = donorProfile.name;
  document.getElementById("editEmail").value = donorProfile.email;
  document.getElementById("editPhone").value = donorProfile.phone;
  document.getElementById("editCity").value = donorProfile.city;
  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
}

document.getElementById("editProfileBtn").addEventListener("click", openEditModal);

document.getElementById("editProfileForm").addEventListener("submit", function (event) {
  event.preventDefault();

  donorProfile.name = document.getElementById("editName").value;
  donorProfile.email = document.getElementById("editEmail").value;
  donorProfile.phone = document.getElementById("editPhone").value;
  donorProfile.city = document.getElementById("editCity").value;

  renderProfile();
  closeEditModal();

  alert("Perfil atualizado com sucesso!");
});

renderProfile();