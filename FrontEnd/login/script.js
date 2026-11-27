document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('password').value.trim();
    const accounts = [
        {
            email: 'professor@gmail.com',
            senha: '123',
            tipo: 'professor',
            uid: 'professor-PROF2026001',
            nome: 'Caio Silva',
            destino: '../professor/menu.html'
        },
        {
            email: 'secretaria@gmail.com',
            senha: '123',
            tipo: 'secretaria',
            uid: 'secretaria-EMP2026001',
            nome: 'Clara Dias',
            destino: '../secretaria/index.html'
        },
        {
            email: 'aluno@gmail.com',
            senha: '123',
            tipo: 'aluno',
            uid: 'aluno-20260001',
            nome: 'Ana Lima',
            codigo: '20260001',
            turma: '3º Ano A',
            destino: '../alunos/index.html'
        }
    ];
    const account = accounts.find((item) => item.email === email && item.senha === senha);

    if (!account) {
        alert('E-mail ou senha incorretos. Verifique seus dados.');
        return;
    }

    const backend = window.EduConnectBackend;
    if (!backend) {
        console.error('EduConnect: o núcleo de persistência não foi carregado.');
        alert('Não foi possível iniciar a sessão local. Atualize a página e tente novamente.');
        return;
    }

    const saved = backend.setCurrentActor({
        tipo: account.tipo,
        uid: account.uid,
        nome: account.nome,
        identificador: account.email,
        codigo: account.codigo,
        turma: account.turma
    });
    if (!saved) return;

    const roleLabel = account.tipo === 'secretaria'
        ? 'da Secretaria'
        : account.tipo === 'aluno' ? 'de Aluno' : 'de Professor';
    alert(`Login ${roleLabel} realizado com sucesso!`);
    window.location.href = account.destino;
});

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