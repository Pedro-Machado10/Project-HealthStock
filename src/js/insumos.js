const apiUrl = 'http://localhost:3000/insumos';
function getUsuarioLogado() {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  return usuarioLogado;
}

const insumosList = document.getElementById('insumosList');
const searchInput = document.getElementById('searchInput');
const form = document.getElementById('insumoForm');

const idInput = document.getElementById('insumoId');
const nomeInput = document.getElementById('nomeInsumo');
const descricaoInput = document.getElementById('descricaoInsumo');
const dataVencimentoInput = document.getElementById('dataVencimentoInsumo');


// Carrega os insumos
function loadInsumos(filtro = '') {
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      insumosList.innerHTML = '';
      data.filter(insumo =>
        insumo.nome.toLowerCase().includes(filtro.toLowerCase())
      ).forEach(renderInsumo);
    });
}

function renderInsumo(insumo) {
  const col = document.createElement('div');
  col.className = 'col-md-4';
  const card = document.createElement('div');
  card.className = 'card card-insumo';
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const title = document.createElement('h5');
  title.className = 'card-title';
  title.textContent = insumo.nome;

  const text = document.createElement('p');
  text.className = 'card-text';
  text.textContent = insumo.descricao;

  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'mt-2 d-flex justify-content-end gap-2';

  const editButton = document.createElement('button');
  editButton.className = 'btn btn-sm btn-outline-primary';
  editButton.onclick = () => editInsumo(insumo);
  editButton.innerHTML = '<i class="fas fa-edit"></i>';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn-sm btn-outline-danger';
  deleteButton.onclick = () => deleteInsumo(insumo.id);
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';

  const vencimento = document.createElement('p');
  vencimento.className = 'card-text text-secondary mb-1';
  vencimento.textContent = `Vence em: ${formatDate(insumo.dataVencimento)}`;

  buttonGroup.append(editButton, deleteButton);
  cardBody.append(title, text, buttonGroup);
  card.appendChild(cardBody);
  col.appendChild(card);
  insumosList.appendChild(col);
}

// Função para abrir o modal
function openInsumoModal() {
  const modalInstance = new bootstrap.Modal(modal); // Inicializa o modal do Bootstrap
  modalInstance.show(); // Exibe o modal
}

// Função para preencher o formulário de edição
function editInsumo(insumo) {
  // Preenche os campos do formulário com os dados do insumo
  document.getElementById('insumoId').value = insumo.id;
  document.getElementById('nomeInsumo').value = insumo.nome;
  document.getElementById('descricaoInsumo').value = insumo.descricao;
  document.getElementById('dataVencimentoInsumo').value = insumo.dataVencimento?.split('T')[0] || '';

  // Preenche os campos de visualização apenas
  document.getElementById('alteradoPorInsumo').value = insumo.alteradoPor?.name || '-';
  // Preenche o campo de data de alteração com a data formatada
  document.getElementById('dataAlteracaoInsumo').value = formatDateToUser(insumo.dataAlteracao);
  
  // Abre o modal
  openInsumoModal();
}

// Excluir
function deleteInsumo(id) {
  if (confirm('Deseja excluir este insumo?')) {
    fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
      .then(() => loadInsumos());
  }
}

// Salvar (create/update)
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const usuario = getUsuarioLogado();

  const insumo = {
    nome: nomeInput.value,
    descricao: descricaoInput.value,
    quantidade: 0,
    dataVencimento: dataVencimentoInput.value,
    alteradoPor: {
      id: usuario.id,
      name: usuario.name
    },
    dataAlteracao: new Date().toISOString()
  };

  const id = idInput.value;

  if (id) {
    fetch(`${apiUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insumo)
    }).then(() => {
      form.reset();
      closeInsumoModal();
      loadInsumos();
    });
  } else {
    insumo.criadoPor = {
      id: usuario.id,
      name: usuario.name
    };
    insumo.dataCriacao = new Date().toISOString();

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(insumo)
    }).then(() => {
      form.reset();
      closeInsumoModal();
      loadInsumos();
    });
  }
});


// Pesquisa
searchInput.addEventListener('input', (e) => {
  loadInsumos(e.target.value);
});

// Inicializa
loadInsumos();

// Função para abrir o modal
function openInsumoModal() {
  const modal = new bootstrap.Modal(document.getElementById('insumoModal'));
  modal.show();
}

function clearModalFields() {
  idInput.value = '';
  nomeInput.value = '';
  descricaoInput.value = '';
  dataVencimentoInput.value = '';
  document.getElementById('alteradoPorInsumo').value = '';
  document.getElementById('dataAlteracaoInsumo').value = '';
}

document.getElementById('insumoModal').addEventListener('hidden.bs.modal', function () {
  clearModalFields();
});

// Função para fechar o modal
function closeInsumoModal() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('insumoModal'));
  modal.hide();
  clearModalFields();
}

// Função para formatar a data
function formatDateToUser(dateString) {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // Para 24 horas
  });
  return formatter.format(date);
}

//

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [ano, mes, dia] = dateStr.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}