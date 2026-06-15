const API_URL = "https://bemaqui-tcc-main.onrender.com";

let recyclingChartInstance = null;
let familiesChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
  initHamburger();
  initTestimonialsSlider();
  initContactForm();

  try {
    const dashboardData = await loadDashboardData();
    applyImpactStats(dashboardData.summary);
    initImpactCounters();
    initCharts(dashboardData.charts);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    initImpactCounters();
    initCharts();
  }
});

function initHamburger() {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  if (!hamburger || !navMenu) return;

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    });
  });
}

async function loadDashboardData() {
  const response = await fetch(`${API_URL}/api/dashboard/public`, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  const data = await parseResponse(response);
  return normalizeDashboardData(data);
}

async function parseResponse(response) {
  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    if (text.trim().startsWith("<")) {
      throw new Error("A API retornou HTML em vez de JSON.");
    }
    throw new Error("Resposta inválida do servidor.");
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || "Erro ao buscar dados do dashboard.");
  }

  return data;
}

function normalizeDashboardData(data) {
  return {
    summary: {
      familiesHelped: Number(data.summary?.familiesHelped || 0),
      recycledKg: Number(data.summary?.recycledKg || 0),
      coinsGenerated: Number(data.summary?.coinsGenerated || 0),
      productsDelivered: Number(data.summary?.productsDelivered || 0)
    },
    charts: {
      recyclingByMaterial: Array.isArray(data.charts?.recyclingByMaterial)
        ? data.charts.recyclingByMaterial
        : [],
      familiesMonthly: Array.isArray(data.charts?.familiesMonthly)
        ? data.charts.familiesMonthly
        : []
    }
  };
}

function applyImpactStats(summary) {
  const fields = [
    { id: "familiesHelped", value: summary.familiesHelped },
    { id: "recycledKg", value: summary.recycledKg },
    { id: "coinsGenerated", value: summary.coinsGenerated },
    { id: "productsDelivered", value: summary.productsDelivered }
  ];

  fields.forEach(({ id, value }) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.setAttribute("data-target", String(value));
    element.textContent = "0";
  });

  updateHeroStats(summary);
}

function updateHeroStats(summary) {
  const heroNumbers = document.querySelectorAll(".hero-stats .stat-number");

  if (heroNumbers[0]) {
    heroNumbers[0].textContent = `+${summary.familiesHelped.toLocaleString("pt-BR")}`;
  }

  if (heroNumbers[1]) {
    heroNumbers[1].textContent = `+${summary.recycledKg.toLocaleString("pt-BR")}kg`;
  }
}

function initImpactCounters() {
  const counters = document.querySelectorAll(".impact-number");

  const animateCounter = (counter) => {
    const target = Number(counter.getAttribute("data-target")) || 0;
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);

      counter.textContent = current.toLocaleString("pt-BR");

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = target.toLocaleString("pt-BR");
      }
    }

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(counter => observer.observe(counter));
}

function initTestimonialsSlider() {
  const slider = document.querySelector(".testimonials-slider");
  if (!slider || typeof Swiper === "undefined") return;

  new Swiper(".testimonials-slider", {
    loop: true,
    spaceBetween: 24,
    grabCursor: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    },
    breakpoints: {
      0: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 3 }
    }
  });
}

function initCharts(chartsData = {}) {
  if (typeof Chart === "undefined") {
    console.error("Chart.js não foi carregado.");
    return;
  }

  const recyclingCanvas = document.getElementById("recyclingChart");
  const familiesCanvas = document.getElementById("familiesChart");

  const recyclingData = chartsData.recyclingByMaterial?.length
    ? chartsData.recyclingByMaterial
    : [
        { label: "Plástico", value: 0 },
        { label: "Papel", value: 0 },
        { label: "Vidro", value: 0 },
        { label: "Metal", value: 0 },
        { label: "Óleo", value: 0 },
        { label: "Eletrônicos", value: 0 }
      ];

  const familiesMonthly = chartsData.familiesMonthly?.length
    ? chartsData.familiesMonthly
    : [
        { label: "Jan", value: 0 },
        { label: "Fev", value: 0 },
        { label: "Mar", value: 0 },
        { label: "Abr", value: 0 },
        { label: "Mai", value: 0 },
        { label: "Jun", value: 0 }
      ];

  if (recyclingCanvas) {
    if (recyclingChartInstance) recyclingChartInstance.destroy();

    recyclingChartInstance = new Chart(recyclingCanvas, {
      type: "bar",
      data: {
        labels: recyclingData.map(item => item.label),
        datasets: [{
          label: "Kg arrecadados",
          data: recyclingData.map(item => Number(item.value || 0)),
          backgroundColor: [
            "rgba(34, 197, 94, 0.85)",
            "rgba(16, 185, 129, 0.85)",
            "rgba(132, 204, 22, 0.85)",
            "rgba(74, 222, 128, 0.85)",
            "rgba(250, 204, 21, 0.85)",
            "rgba(45, 212, 191, 0.85)"
          ],
          borderColor: [
            "#22c55e",
            "#10b981",
            "#84cc16",
            "#4ade80",
            "#facc15",
            "#2dd4bf"
          ],
          borderWidth: 1.5,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#f3f4f6",
              font: { family: "Inter", size: 13 }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#e5e7eb" },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#e5e7eb" },
            grid: { color: "rgba(255,255,255,0.08)" }
          }
        }
      }
    });
  }

  if (familiesCanvas) {
    if (familiesChartInstance) familiesChartInstance.destroy();

    familiesChartInstance = new Chart(familiesCanvas, {
      type: "line",
      data: {
        labels: familiesMonthly.map(item => item.label),
        datasets: [{
          label: "Famílias ajudadas",
          data: familiesMonthly.map(item => Number(item.value || 0)),
          fill: true,
          tension: 0.35,
          borderColor: "#86efac",
          backgroundColor: "rgba(34, 197, 94, 0.18)",
          pointBackgroundColor: "#bbf7d0",
          pointBorderColor: "#16a34a",
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#f3f4f6",
              font: { family: "Inter", size: 13 }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#e5e7eb" },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#e5e7eb" },
            grid: { color: "rgba(255,255,255,0.08)" }
          }
        }
      }
    });
  }
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    alert("Mensagem enviada com sucesso!");
    form.reset();
  });
}