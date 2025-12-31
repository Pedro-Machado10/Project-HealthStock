const apiUrl = "http://localhost:3000/setores";
const tabela = document.getElementById("tabelaSetores");
const form = document.getElementById("setorForm");
const modal = new bootstrap.Modal(document.getElementById("modalSetor"));

function carregarSetores() {
  fetch(apiUrl)
    .then(res => res.json())
    .then(setores => {
      tabela.innerHTML = "";
      setores.forEach(setor => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${setor.nome}</td>
          <td>${setor.descricao}</td>
          <td>${setor.dataCriacao}</td>
          <td>${setor.status}</td>
          <td>${setor.responsavel}</td>
          <td>${setor.unidade}</td>
          <td>
          <button class="btn btn-sm btn-outline-primary" id="editButton" onclick="editarSetor(\'${setor.id}\')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-outline-danger" onclick="excluirSetor('${setor.id}')"><i class="fas fa-trash"></i></button>
        `;
        tabela.appendChild(row);
      });
    });
}

function editarSetor(id) {
  fetch(`${apiUrl}/${id}`)
    .then(res => res.json())
    .then(setor => {
      document.getElementById("setorId").value = setor.id;
      document.getElementById("nome").value = setor.nome;
      document.getElementById("descricao").value = setor.descricao;
      document.getElementById("dataCriacao").value = setor.dataCriacao;
      document.getElementById("status").value = setor.status;
      document.getElementById("responsavel").value = setor.responsavel;
      document.getElementById("unidade").value = setor.unidade;
      modal.show();
    });
}

function excluirSetor(id) {
  if (confirm("Tem certeza que deseja excluir este setor?")) {
    fetch(`${apiUrl}/${id}`, { method: "DELETE" })
      .then(() => carregarSetores());
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("setorId").value;
  const setor = {
    nome: document.getElementById("nome").value,
    descricao: document.getElementById("descricao").value,
    dataCriacao: document.getElementById("dataCriacao").value,
    status: document.getElementById("status").value,
    responsavel: document.getElementById("responsavel").value,
    unidade: document.getElementById("unidade").value
  };

  const metodo = id ? "PUT" : "POST";
  const url = id ? `${apiUrl}/${id}` : apiUrl;

  fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(setor)
  }).then(() => {
    modal.hide();
    form.reset();
    carregarSetores();
  });
});

carregarSetores();


function carregarUnidades() {
  fetch("http://localhost:3000/unidades")
    .then(res => res.json())
    .then(unidades => {
      const selectUnidade = document.getElementById("unidade");
      selectUnidade.innerHTML = "<option selected disabled value=\"\">Selecione...</option>";
      unidades.forEach(unidade => {
        const option = document.createElement("option");
        option.value = unidade.nome;
        option.textContent = unidade.nome;
        selectUnidade.appendChild(option);
      });
    });
}

// Chamar a função para carregar unidades quando o modal for aberto
document.getElementById('modalSetor').addEventListener('show.bs.modal', function () {
  carregarUnidades();
});



function limparModalSetor() {
  document.getElementById("setorId").value = "";
  document.getElementById("nome").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("dataCriacao").value = "";
  document.getElementById("status").value = "";
  document.getElementById("responsavel").value = "";
  document.getElementById("unidade").value = "";
}

document.getElementById("modalSetor").addEventListener("hidden.bs.modal", function () {
  limparModalSetor();
});

document.getElementById("modalSetor").addEventListener("show.bs.modal", function (event) {
  carregarUnidades();
});

