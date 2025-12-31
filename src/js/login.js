// CADASTRO
document.getElementById("registerForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  fetch("http://localhost:3000/users")
    .then((response) => response.json())
    .then((users) => {
      if (users.some((user) => user.email === email)) {
        alert("Usuário já cadastrado!");
        return;
      }

      const newUser = { name, email, password };

      fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })
        .then((response) => response.json())
        .then((data) => {
          alert("Usuário cadastrado com sucesso!");
          document.getElementById("registerForm").reset();
          // Salva o usuário logado no localStorage
          localStorage.setItem("usuarioLogado", JSON.stringify(newUser));
          // Alternar para a aba de login
          document.querySelector('a[href="#loginTab"]').click();
        })
        .catch((error) =>
          console.error("Erro ao cadastrar o usuário:", error)
        );
    })
    .catch((error) => console.error("Erro ao verificar usuários:", error));
});

// LOGIN
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  fetch("http://localhost:3000/users")
    .then((response) => response.json())
    .then((users) => {
      const user = users.find(
        (user) => user.email === email && user.password === password
      );

      if (user) {
        alert("Login realizado com sucesso!");
        // Salva o usuário logado no localStorage
        localStorage.setItem("usuarioLogado", JSON.stringify(user));
        // Redireciona para a home
        window.location.href = "components/home.html";
      } else {
        alert("Email ou senha inválidos!");
      }
    })
    .catch((error) => console.error("Erro ao fazer login:", error));
});
