const apiUrl = 'http://localhost:3000/compras';
const insumosUrl = 'http://localhost:3000/insumos';
const usersUrl = 'http://localhost:3000/users';

function getUsuarioLogado() {
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  return usuarioLogado;
}

const comprasList = document.getElementById('comprasList');
const searchInput = document.getElementById('searchInput');
const form = document.getElementById('compraForm');
const itensContainer = document.getElementById('itensContainer');
const addItemBtn = document.getElementById('addItemBtn');
const filterButtons = document.querySelectorAll('.filter-btn');

let insumosDisponiveis = [];
let usuarios = [];
let compraSelecionada = null;

// Carrega os dados iniciais
function loadInitialData() {
  Promise.all([
    fetch(insumosUrl).then(res => res.json()),
    fetch(usersUrl).then(res => res.json())
  ]).then(([insumos, users]) => {
    insumosDisponiveis = insumos;
    usuarios = users;
    loadCompras();
  });
}

// Carrega as compras
function loadCompras(filtro = '', status = 'all') {
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      comprasList.innerHTML = '';
      data
        .filter(compra => 
          (compra.idSolicitacao.toString().includes(filtro) || 
           compra.solicitante.nome.toLowerCase().includes(filtro.toLowerCase())) &&
          (status === 'all' || compra.status === status)
        )
        .forEach(renderCompra);
    });
}

// Renderiza uma compra na lista
function renderCompra(compra) {
  const col = document.createElement('div');
  col.className = 'col-md-6';
  
  const card = document.createElement('div');
  card.className = 'card card-compra mb-3';
  card.onclick = () => showDetalhes(compra);

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body position-relative';

  // Badge de status
  const statusBadge = document.createElement('span');
  statusBadge.className = `status-badge status-${compra.status.toLowerCase()}`;
  statusBadge.textContent = compra.status;

  const title = document.createElement('h5');
  title.className = 'card-title';
  title.textContent = `Solicitação #${compra.idSolicitacao}`;

  const solicitante = document.createElement('p');
  solicitante.className = 'card-text';
  solicitante.innerHTML = `<strong>Solicitante:</strong> ${compra.solicitante.nome}`;

  const dataSolicitacao = document.createElement('p');
  dataSolicitacao.className = 'card-text';
  dataSolicitacao.innerHTML = `<strong>Data:</strong> ${formatDate(compra.dataSolicitacao)}`;

  const qtdItens = document.createElement('p');
  qtdItens.className = 'card-text';
  qtdItens.innerHTML = `<strong>Itens:</strong> ${compra.itensSolicitados.length}`;

  const dataNecessidade = document.createElement('p');
  dataNecessidade.className = 'card-text';
  dataNecessidade.innerHTML = `<strong>Necessário para:</strong> ${formatDate(compra.dataNecessidade)}`;

  // Botões de ação
  const actionButtons = document.createElement('div');
  actionButtons.className = 'action-buttons';
  
  const editButton = document.createElement('button');
  editButton.className = 'action-btn btn btn-primary';
  editButton.innerHTML = '<i class="fas fa-edit"></i>';
  editButton.onclick = (e) => {
    e.stopPropagation();
    openEditarModal(compra);
  };
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'action-btn btn btn-danger';
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
  deleteButton.onclick = (e) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
      deleteCompra(compra.id);
    }
  };
  
  actionButtons.append(editButton, deleteButton);

  cardBody.append(statusBadge, title, solicitante, dataSolicitacao, qtdItens, dataNecessidade, actionButtons);
  card.appendChild(cardBody);
  col.appendChild(card);
  comprasList.appendChild(col);
}

// Mostra detalhes da compra
function showDetalhes(compra) {
  compraSelecionada = compra;
  const detalhesContent = document.getElementById('detalhesContent');
  detalhesContent.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'mb-4 position-relative';

  const title = document.createElement('h4');
  title.textContent = `Solicitação #${compra.idSolicitacao}`;
  
  const statusBadge = document.createElement('span');
  statusBadge.className = `badge ${getStatusClass(compra.status)} ms-2`;
  statusBadge.textContent = compra.status;

  title.appendChild(statusBadge);
  header.appendChild(title);

  const solicitanteInfo = document.createElement('p');
  solicitanteInfo.innerHTML = `<strong>Solicitante:</strong> ${compra.solicitante.nome} (${compra.solicitante.departamento})`;
  header.appendChild(solicitanteInfo);

  const dataInfo = document.createElement('p');
  dataInfo.innerHTML = `<strong>Data da Solicitação:</strong> ${formatDateTime(compra.dataSolicitacao)}`;
  header.appendChild(dataInfo);

  const necessidadeInfo = document.createElement('p');
  necessidadeInfo.innerHTML = `<strong>Data de Necessidade:</strong> ${formatDate(compra.dataNecessidade)}`;
  header.appendChild(necessidadeInfo);

  const justificativaCard = document.createElement('div');
  justificativaCard.className = 'card mb-3';
  const justificativaBody = document.createElement('div');
  justificativaBody.className = 'card-body';
  justificativaBody.innerHTML = `<h5 class="card-title">Justificativa</h5><p>${compra.justificativa}</p>`;
  justificativaCard.appendChild(justificativaBody);

  const itensCard = document.createElement('div');
  itensCard.className = 'card';
  const itensBody = document.createElement('div');
  itensBody.className = 'card-body';
  
  const itensTitle = document.createElement('h5');
  itensTitle.className = 'card-title mb-3';
  itensTitle.textContent = 'Itens Solicitados';
  itensBody.appendChild(itensTitle);

  const table = document.createElement('table');
  table.className = 'table table-striped';
  
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Item</th>
      <th>Quantidade</th>
      <th>Unidade de Medida</th>
      <th>Observações</th>
    </tr>
  `;
  
  const tbody = document.createElement('tbody');
  compra.itensSolicitados.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.nomeItem}</td>
      <td>${item.quantidade}</td>
      <td>${item.unidadeMedida}</td>
      <td>${item.observacoes || '-'}</td>
    `;
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  itensBody.appendChild(table);
  itensCard.appendChild(itensBody);

  // Se aprovada/rejeitada, mostrar informações de aprovação
  if (compra.status !== 'PENDENTE') {
    const aprovacaoCard = document.createElement('div');
    aprovacaoCard.className = 'card mt-3';
    const aprovacaoBody = document.createElement('div');
    aprovacaoBody.className = 'card-body';
    
    const aprovacaoTitle = document.createElement('h5');
    aprovacaoTitle.className = 'card-title';
    aprovacaoTitle.textContent = compra.status === 'APROVADA' ? 'Aprovação' : 'Rejeição';
    
    const aprovadoPor = document.createElement('p');
    aprovadoPor.innerHTML = `<strong>${compra.status === 'APROVADA' ? 'Aprovado por:' : 'Rejeitado por:'}</strong> ${compra.aprovadoPor?.nome || 'N/A'}`;
    
    const dataAprovacao = document.createElement('p');
    dataAprovacao.innerHTML = `<strong>Data:</strong> ${formatDateTime(compra.dataAprovacao)}`;
    
    aprovacaoBody.append(aprovacaoTitle, aprovadoPor, dataAprovacao);
    aprovacaoCard.appendChild(aprovacaoBody);
    detalhesContent.appendChild(aprovacaoCard);
  }

  // Botões de ação
  const actionButtons = document.createElement('div');
  actionButtons.className = 'd-flex justify-content-end gap-2 mt-3';
  
  const editButton = document.createElement('button');
  editButton.className = 'btn btn-primary';
  editButton.innerHTML = '<i class="fas fa-edit me-2"></i>Editar';
  editButton.onclick = () => openEditarModal(compra);
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn-danger';
  deleteButton.innerHTML = '<i class="fas fa-trash me-2"></i>Excluir';
  deleteButton.onclick = () => {
    if (confirm('Tem certeza que deseja excluir esta solicitação?')) {
      deleteCompra(compra.id);
      const modal = bootstrap.Modal.getInstance(document.getElementById('detalhesModal'));
      modal.hide();
    }
  };
  
  actionButtons.append(editButton, deleteButton);

  detalhesContent.append(header, justificativaCard, itensCard, actionButtons);

  const modal = new bootstrap.Modal(document.getElementById('detalhesModal'));
  modal.show();
}

// Abre modal de edição
function openEditarModal(compra) {
  compraSelecionada = compra;
  document.getElementById('editarId').value = compra.id;
  document.getElementById('editarStatus').value = compra.status;
  document.getElementById('editarJustificativa').value = compra.justificativa;
  document.getElementById('editarDataNecessidade').value = compra.dataNecessidade.split('T')[0];
  
  const modal = new bootstrap.Modal(document.getElementById('editarModal'));
  modal.show();
}

// Adiciona um novo item à solicitação
function addItem() {
  const itemRow = document.createElement('div');
  itemRow.className = 'item-row';

  const insumoSelect = document.createElement('select');
  insumoSelect.className = 'form-select';
  insumoSelect.required = true;
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Selecione um insumo';
  insumoSelect.appendChild(defaultOption);

  insumosDisponiveis.forEach(insumo => {
    const option = document.createElement('option');
    option.value = insumo.id;
    option.textContent = insumo.nome;
    insumoSelect.appendChild(option);
  });

  const quantidadeInput = document.createElement('input');
  quantidadeInput.type = 'number';
  quantidadeInput.className = 'form-control';
  quantidadeInput.placeholder = 'Qtd';
  quantidadeInput.min = '1';
  quantidadeInput.required = true;

  const unidadeInput = document.createElement('input');
  unidadeInput.type = 'text';
  unidadeInput.className = 'form-control';
  unidadeInput.placeholder = 'Unidade (ex: unidades)';
  unidadeInput.required = true;

  const obsInput = document.createElement('input');
  obsInput.type = 'text';
  obsInput.className = 'form-control';
  obsInput.placeholder = 'Observações';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-item-btn';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.onclick = () => itemRow.remove();

  itemRow.append(insumoSelect, quantidadeInput, unidadeInput, obsInput, removeBtn);
  itensContainer.appendChild(itemRow);
}

// Envia a solicitação
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const usuario = getUsuarioLogado();

  const itensRows = itensContainer.querySelectorAll('.item-row');
  if (itensRows.length === 0) {
    alert('Adicione pelo menos um item à solicitação');
    return;
  }

  const itensSolicitados = Array.from(itensRows).map(row => {
    const select = row.querySelector('select');
    const selectedInsumo = insumosDisponiveis.find(i => i.id === select.value);
    
    return {
      idItem: selectedInsumo.id,
      nomeItem: selectedInsumo.nome,
      quantidade: row.querySelector('input[type="number"]').value,
      unidadeMedida: row.querySelectorAll('input[type="text"]')[0].value,
      observacoes: row.querySelectorAll('input[type="text"]')[1].value || null
    };
  });

  const solicitacao = {
    idSolicitacao: Math.floor(Math.random() * 10000),
    dataSolicitacao: new Date().toISOString(),
    status: 'PENDENTE',
    solicitante: {
      idUsuario: usuario.id,
      nome: usuario.name,
      departamento: usuario.departamento || 'Não informado'
    },
    itensSolicitados,
    justificativa: document.getElementById('justificativa').value,
    dataNecessidade: document.getElementById('dataNecessidade').value,
    aprovadoPor: null,
    dataAprovacao: null
  };

  fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(solicitacao)
  }).then(() => {
    form.reset();
    itensContainer.innerHTML = '';
    const modal = bootstrap.Modal.getInstance(document.getElementById('compraModal'));
    modal.hide();
    loadCompras();
  });
});

// Formulário de edição
document.getElementById('editarForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const usuario = getUsuarioLogado();
  
  const updatedCompra = {
    ...compraSelecionada,
    status: document.getElementById('editarStatus').value,
    justificativa: document.getElementById('editarJustificativa').value,
    dataNecessidade: document.getElementById('editarDataNecessidade').value,
  };

  if (compraSelecionada.status !== updatedCompra.status) {
    updatedCompra.aprovadoPor = {
      idUsuario: usuario.id,
      nome: usuario.name,
      departamento: usuario.departamento || 'Não informado'
    };
    updatedCompra.dataAprovacao = new Date().toISOString();
  }

  fetch(`${apiUrl}/${updatedCompra.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedCompra)
  }).then(() => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('editarModal'));
    modal.hide();
    loadCompras();
    const detalhesModal = bootstrap.Modal.getInstance(document.getElementById('detalhesModal'));
    if (detalhesModal) detalhesModal.hide();
  });
});

// Botão de deletar no modal de edição
document.getElementById('deleteCompraBtn').addEventListener('click', () => {
  if (compraSelecionada && confirm('Tem certeza que deseja excluir esta solicitação?')) {
    deleteCompra(compraSelecionada.id);
  }
});

function deleteCompra(id) {
  fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
    .then(() => {
      const editarModal = bootstrap.Modal.getInstance(document.getElementById('editarModal'));
      if (editarModal) editarModal.hide();
      
      const detalhesModal = bootstrap.Modal.getInstance(document.getElementById('detalhesModal'));
      if (detalhesModal) detalhesModal.hide();
      
      loadCompras();
    });
}

// Filtra por status
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadCompras(searchInput.value, btn.dataset.status);
  });
});

// Pesquisa
searchInput.addEventListener('input', (e) => {
  const activeFilter = document.querySelector('.filter-btn.active');
  loadCompras(e.target.value, activeFilter.dataset.status);
});

// Adiciona o primeiro item ao carregar o modal
document.getElementById('compraModal').addEventListener('shown.bs.modal', addItem);
addItemBtn.addEventListener('click', addItem);

// Funções auxiliares
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR');
}

function getStatusClass(status) {
  switch(status) {
    case 'PENDENTE': return 'bg-warning text-dark';
    case 'APROVADA': return 'bg-success text-white';
    case 'REJEITADA': return 'bg-danger text-white';
    default: return 'bg-secondary text-white';
  }
}

// Inicializa
loadInitialData();