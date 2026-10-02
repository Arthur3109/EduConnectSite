/* =========================================================
 * 1. ELEMENTO DO CONTROLE DE TEMA
 * ========================================================= */
// const mantém a referência ao elemento sem permitir que a variável seja
// apontada para outro nó; o script espera encontrar esse botão no HTML.
const themeToggle = document.getElementById("themeToggle");


/* =========================================================
 * 2. ALTERAÇÃO E PERSISTÊNCIA DO TEMA
 * ========================================================= */
// addEventListener registra uma reação ao clique sem substituir outros
// possíveis manipuladores associados ao mesmo botão.
themeToggle.addEventListener("click", () => {

    // classList.toggle alterna a classe em uma única operação: adiciona se
    // estiver ausente e remove se já existir, deixando o CSS controlar o visual.
    document.body.classList.toggle("dark-mode");


    // A classe aplicada ao body é a fonte de verdade para saber qual opção está
    // ativa; assim, o valor salvo acompanha o estado efetivamente exibido.
    if (document.body.classList.contains("dark-mode")) {

        // Web Storage guarda uma string entre navegações no mesmo navegador,
        // evitando que a preferência seja perdida ao recarregar a página.
        localStorage.setItem("theme", "dark");

    } else {

        // Mantém o mesmo contrato de armazenamento para a opção alternativa;
        // a aparência concreta de cada valor é definida pelas regras CSS.
        localStorage.setItem("theme", "light");
    }
});


/* =========================================================
 * 3. RESTAURAÇÃO DA PREFERÊNCIA SALVA
 * ========================================================= */
// A leitura síncrona de localStorage restaura a classe antes de o usuário
// interagir, evitando que a página ignore uma escolha feita anteriormente.
if (localStorage.getItem("theme") === "dark") {

    // add aplica a classe sem alterná-la; ao contrário de toggle, a operação é
    // idempotente e não desfaz a preferência que acabou de ser lida.
    document.body.classList.add("dark-mode");
}