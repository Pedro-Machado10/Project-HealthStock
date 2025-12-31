const apiUrl = 'http://localhost:3000/unidades';

const form = document.getElementById('unidadeForm');
const list = document.getElementById('unidadeList');
const search = document.getElementById('searchUnidade');

const idInput = document.getElementById('unidadeId');
const nomeInput = document.getElementById('nomeUnidade');
const tipoInput = document.getElementById('tipoUnidade');
const cnpjInput = document.getElementById('cnpjUnidade');
const telefoneInput = document.getElementById('telefoneUnidade');
const cepInput = document.getElementById('cepUnidade');
const numeroInput = document.getElementById('numeroUnidade');
const enderecoInput = document.getElementById('enderecoUnidade');
const dataCadastroInput = document.getElementById('dataCadastroUnidade');
const dataAtualizacaoInput = document.getElementById('dataAtualizacaoUnidade');

let unidades = [];

function getUsuarioLogado() {
  return JSON.parse(localStorage.getItem("usuarioLogado")) || { id: "0", name: "Desconhecido" };
}

function loadUnidades(filtro = '') {
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      unidades = data;
      renderUnidades(filtro);
    })
    .catch(() => alert('Erro ao carregar unidades do servidor'));
}

function renderUnidades(filtro = '') {
  list.innerHTML = '';
  unidades
    .filter(u => u.nome.toLowerCase().includes(filtro.toLowerCase()))
    .forEach(unidade => {
      const col = document.createElement('div');
      col.className = 'col-md-4';

      const card = document.createElement('div');
      card.className = 'card card-unidade';

      const body = document.createElement('div');
      body.className = 'card-body';

      body.innerHTML = `
        <h5 class="card-title">${unidade.nome}</h5>
        <p class="card-text">Tipo: ${unidade.tipo}</p>
        <p class="card-text">CNPJ: ${unidade.cnpj}</p>
        <p class="card-text">Telefone: ${unidade.telefone}</p>
        <p class="card-text">${unidade.endereco}, Nº ${unidade.numero}</p>
        <small class="text-muted">Atualizado em: ${formatDateToUser(unidade.data_atualizacao)}<br>Por: ${unidade.responsavel}</small>
        <div class="d-flex justify-content-end gap-2 mt-2">
          <button class="btn btn-sm btn-outline-primary" onclick='editUnidade(${JSON.stringify(unidade)})'><i class="fas fa-edit"></i></button>          
          <button class="btn btn-sm btn-outline-danger" onclick='deleteUnidade("${unidade.id}")'><i class="fas fa-trash"></i></button>        
        </div>
      `;

      card.appendChild(body);
      col.appendChild(card);
      list.appendChild(col);
    });
}

function editUnidade(unidade) {
  idInput.value = unidade.id;
  nomeInput.value = unidade.nome;
  tipoInput.value = unidade.tipo;
  cnpjInput.value = unidade.cnpj;
  telefoneInput.value = unidade.telefone;
  cepInput.value = unidade.cep;
  numeroInput.value = unidade.numero;
  enderecoInput.value = unidade.endereco;
  dataCadastroInput.value = formatDateToUser(unidade.data_cadastro);
  dataAtualizacaoInput.value = formatDateToUser(unidade.data_atualizacao);

  openModal();
}

function deleteUnidade(id) {
  if (confirm("Deseja excluir esta unidade?")) {
    fetch(`${apiUrl}/${id}`, {
      method: 'DELETE'
    })
    .then(() => loadUnidades())
    .catch(() => alert("Erro ao deletar unidade."));
  }
}

form.addEventListener('submit', e => {
  e.preventDefault();

  const usuario = getUsuarioLogado();
  const id = idInput.value;
  const nowISO = new Date().toISOString();
  const metodo = id ? 'PATCH' : 'POST';

  const unidadeExistente = getUnidadeById(id);

  const nova = {
    id: id || crypto.randomUUID(),
    nome: nomeInput.value,
    tipo: tipoInput.value,
    cnpj: cnpjInput.value,
    telefone: telefoneInput.value,
    cep: cepInput.value,
    numero: numeroInput.value,
    endereco: enderecoInput.value,
    data_cadastro: id ? unidadeExistente?.data_cadastro : nowISO,
    data_atualizacao: nowISO,
    responsavel: usuario.name
  };

  const url = id ? `${apiUrl}/${id}` : apiUrl;

  fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nova)
  })
  .then(() => {
    closeModal();
    form.reset();
    loadUnidades();
  })
  .catch(() => alert("Erro ao salvar unidade."));
});

function getUnidadeById(id) {
  return unidades.find(u => u.id === id);
}

search.addEventListener('input', e => loadUnidades(e.target.value));

cepInput.addEventListener('blur', async () => {
  const cep = cepInput.value.replace(/\D/g, '');
  if (cep.length !== 8) return;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (!data.erro) {
      enderecoInput.value = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
    } else {
      alert('CEP não encontrado!');
    }
  } catch {
    alert('Erro ao buscar CEP!');
  }
});

function openModal() {
  const modal = new bootstrap.Modal(document.getElementById('unidadeModal'));
  modal.show();
}

function closeModal() {
  const modalInstance = bootstrap.Modal.getInstance(document.getElementById('unidadeModal'));
  if (modalInstance) modalInstance.hide();
}

//  Nova função para limpar o modal
function limparModal() {
  form.reset();
  idInput.value = '';
  dataCadastroInput.value = '';
  dataAtualizacaoInput.value = '';
  enderecoInput.value = '';
}

//  Limpa o modal ao abrir para novo cadastro
document.querySelector('[data-bs-target="#unidadeModal"]').addEventListener('click', limparModal);

//  Limpa o modal ao fechar também
document.getElementById('unidadeModal').addEventListener('hidden.bs.modal', limparModal);

function formatDateToUser(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
}

// Inicializa a lista ao carregar a página
loadUnidades();
