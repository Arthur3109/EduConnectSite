// Pega o botão do Dark Mode pelo ID
const themeToggle = document.getElementById("themeToggle");


// Adiciona um evento de clique no botão
themeToggle.addEventListener("click", () => {

    // Adiciona ou remove a classe "dark-mode" do body
    // Se não tiver, adiciona
    // Se já tiver, remove
    document.body.classList.toggle("dark-mode");


    // Verifica se o Dark Mode está ativado
    if (document.body.classList.contains("dark-mode")) {

        // Salva "dark" no navegador
        // Assim, a preferência do usuário fica guardada
        localStorage.setItem("theme", "dark");

    } else {

        // Salva "light" no navegador
        // Isso significa que o usuário está usando o modo claro
        localStorage.setItem("theme", "light");
    }
});


// Verifica se existe um tema salvo no navegador
if (localStorage.getItem("theme") === "dark") {

    // Se o tema salvo for "dark",
    // adiciona a classe "dark-mode" ao body
    document.body.classList.add("dark-mode");
}