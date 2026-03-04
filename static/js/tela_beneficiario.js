// No futuro você pode carregar dados reais do usuário e pontos.
// Por enquanto, só deixamos pronto para isso.

document.addEventListener("DOMContentLoaded", () => {
  // Exemplo: ler dados salvos no login (localStorage) e mostrar o nome
  const storedUser = localStorage.getItem("bemaquiUser");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    const title = document.querySelector(".beneficiary-hero h1");
    if (user.name && title) {
      title.textContent = `Olá, ${user.name}!`;
    }
  }
});
