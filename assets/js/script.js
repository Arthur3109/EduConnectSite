document.getElementById('loginForm').addEventListener('submit', function(event) {

    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('password').value.trim();

    if (email === "professor@gmail.com" && senha === "123") {
        alert("Login de Professor realizado com sucesso!");
        window.location.href = "professor/menu.html";
    } 
    
    else if (email === "secretaria@gmail.com" && senha === "123") {
        alert("Login da Secretaria realizado com sucesso!");
        window.location.href = "secretaria/index.html";
    } 
    
    else if (email === "aluno@gmail.com" && senha === "123") {
        alert("Login de Aluno realizado com sucesso!");
        window.location.href = "alunos/index.html";
    } 
    
    else {
        alert("E-mail ou senha incorretos. Verifique seus dados.");
    }
});