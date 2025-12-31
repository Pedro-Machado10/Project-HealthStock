const apiUrl = 'http://localhost:3000/fornecedores';

const fornecedoresList = document.getElementById('fornecedoresList');
const searchInput = document.getElementById('searchInput');
const form = document.getElementById('fornecedorForm');

const idInput = document.getElementById('fornecedorId');
const nomeInput = document.getElementById('nomeFornecedor');
const cnpjInput = document.getElementById('cnpjFornecedor');
const emailInput = document.getElementById('emailFornecedor');
const telefoneInput = document.getElementById('telefoneFornecedor');
const insumosInput = document.getElementById('insumosFornecedor'); 
const cepInput = document.getElementById('cepFornecedor');
const ruaInput = document.getElementById('ruaFornecedor');
const numeroInput = document.getElementById('numeroFornecedor');
const bairroInput = document.getElementById('bairroFornecedor');
const cidadeInput = document.getElementById('cidadeFornecedor');
const estadoInput = document.getElementById('estadoFornecedor');

//Busca informações no ViaCEP
cepInput.addEventListener('blur', () => { 
  const cep = cepInput.value.replace(/\D/g, ''); 
  if (cep.length === 8) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(response => {
        if (!response.ok) throw new Error('Erro na requisição ViaCEP');
        return response.json();
      })
      .then(data => {
        if (data.erro) {
          alert('CEP não encontrado.');
          limparEndereco();
          return;
        }
        // Preenche os campos com os dados do ViaCEP
        ruaInput.value = data.logradouro || '';
        bairroInput.value = data.bairro || '';
        cidadeInput.value = data.localidade || '';
        numeroInput.value = '';
        estadoInput.value = data.uf || '';
      })
      .catch(() => {
        alert('Erro ao buscar CEP.');
        limparEndereco();
      });
  } else {
    alert('CEP inválido. Digite 8 números.');
    limparEndereco();
  }
});

function limparEndereco() {
  ruaInput.value = '';
  numeroInput.value = '';
  bairroInput.value = '';
  cidadeInput.value = '';
  estadoInput.value = '';
}

function getUsuarioLogado() {
  return JSON.parse(localStorage.getItem("usuarioLogado"));
}

function getInsumosPorFornecedor(fornecedor, listaInsumos) {
  return listaInsumos.filter(insumo => fornecedor.insumosFornecidos?.includes(insumo.id));
}


function renderInsumosCheckboxes(insumos) {
  const container = document.getElementById('insumosCheckboxList');
  container.innerHTML = ''; // Limpa o conteúdo anterior

  insumos.forEach(insumo => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input';
    checkbox.value = insumo.id;
    checkbox.id = `insumo-${insumo.id}`;
    checkbox.name = 'insumos';

    const label = document.createElement('label');
    label.className = 'form-check-label';
    label.htmlFor = checkbox.id;
    label.textContent = insumo.nome;

    const div = document.createElement('div');
    div.className = 'form-check col';

    div.appendChild(checkbox);
    div.appendChild(label);
    container.appendChild(div);
  });
}
function toggleInsumos() {
  const container = document.getElementById('insumosContainer');
  container.style.display = container.style.display === 'none' ? 'block' : 'none';
}

// Carrega fornecedores e seus insumos para exibição, aplicando filtro de nome
function loadFornecedores(filtro = '') {
  fetch('http://localhost:3000/insumos')
    .then(response => response.json())
    .then(insumos => {
      localStorage.setItem('todosInsumos', JSON.stringify(insumos)); 
      renderInsumosCheckboxes(insumos); //Gera os checkboxes com os insumos

      fetch(apiUrl)
        .then(response => response.json())
        .then(fornecedores => {
          fornecedoresList.innerHTML = '';

          fornecedores
            .filter(f => f.nome.toLowerCase().includes(filtro.toLowerCase()))
            .forEach(fornecedor => {
              const insumosDoFornecedor = getInsumosPorFornecedor(fornecedor, insumos);
              fornecedor.insumos = insumosDoFornecedor.map(i => i.nome); 
              renderFornecedor(fornecedor);
            });
        });
    });
}

// Cria e insere um card HTML para exibir os dados de um fornecedor
function renderFornecedor(fornecedor) {
  const col = document.createElement('div');
  col.className = 'col-md-6'; // dois por linha

  const card = document.createElement('div');
  card.className = 'card shadow-sm h-100';

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const insumos = fornecedor.insumos && fornecedor.insumos.length > 0
    ? fornecedor.insumos.join(', ')
    : 'Nenhum insumo';

  cardBody.innerHTML = `
    <h5 class="card-title">${fornecedor.nome}</h5>
    <p class="card-text">
      <strong>CNPJ:</strong> ${fornecedor.cnpj}<br>
      <strong>Email:</strong> ${fornecedor.email}<br>
      <strong>Telefone:</strong> ${fornecedor.telefone}<br>
      <strong>Insumos:</strong> ${insumos}<br>
      <small class="text-muted">
        Alterado por: ${fornecedor.alteradoPor?.name || '-'}<br>
        ${formatDateToUser(fornecedor.dataAlteracao)}
      </small>
    </p>
  `;

  const actions = document.createElement('div');
  actions.className = 'd-flex justify-content-end gap-2';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn-sm btn-outline-primary';
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.onclick = () => editFornecedor(fornecedor);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-outline-danger';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.onclick = () => deleteFornecedor(fornecedor.id);

  actions.append(editBtn, deleteBtn);
  cardBody.appendChild(actions);
  card.appendChild(cardBody);
  col.appendChild(card);

  fornecedoresList.appendChild(col);
}

// Preenche o formulário com os dados do fornecedor para edição e abre o modal
function editFornecedor(fornecedor) {
  const checkboxes = document.querySelectorAll('input[name="insumos"]');
  checkboxes.forEach(cb => {
    cb.checked = fornecedor.insumosFornecidos?.includes(cb.value);
  });
  idInput.value = fornecedor.id;
  nomeInput.value = fornecedor.nome;
  cnpjInput.value = fornecedor.cnpj;
  emailInput.value = fornecedor.email;
  telefoneInput.value = fornecedor.telefone;
  cepInput.value = fornecedor.cep || '';
  ruaInput.value = fornecedor.rua || '';
  numeroInput.value = fornecedor.numero || '';
  bairroInput.value = fornecedor.bairro || '';
  cidadeInput.value = fornecedor.cidade || '';
  estadoInput.value = fornecedor.estado || '';
  

  document.getElementById('alteradoPorFornecedor').value = fornecedor.alteradoPor?.name || '-';
  document.getElementById('dataAlteracaoFornecedor').value = formatDateToUser(fornecedor.dataAlteracao);

  openFornecedorModal();
}

// Exclui um fornecedor após confirmação e recarrega a lista
function deleteFornecedor(id) {
  if (confirm('Deseja excluir este fornecedor?')) {
    fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
      .then(() => loadFornecedores());
  }
}

function openFornecedorModal() {
  const modal = new bootstrap.Modal(document.getElementById('fornecedorModal'));
  modal.show();
}

function closeFornecedorModal() {
  const modal = bootstrap.Modal.getInstance(document.getElementById('fornecedorModal'));
  modal.hide();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const usuario = getUsuarioLogado();

  const todosInsumos = JSON.parse(localStorage.getItem('todosInsumos')) || [];

  const insumosArray = Array.from(document.querySelectorAll('input[name="insumos"]:checked'))
  .map(cb => cb.value);

    const fornecedor = {
      nome: nomeInput.value,
      cnpj: cnpjInput.value,
      email: emailInput.value,
      telefone: telefoneInput.value,
      cep: cepInput.value,
      rua: ruaInput.value,
      numero: numeroInput.value,
      bairro: bairroInput.value,
      cidade: cidadeInput.value,
      estado: estadoInput.value,
      insumosFornecidos: insumosArray,
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
      body: JSON.stringify(fornecedor)
    }).then(() => {
      form.reset();
      closeFornecedorModal();
      loadFornecedores();
    });
  } else {
    fornecedor.criadoPor = {
      id: usuario.id,
      name: usuario.name
    };
    fornecedor.dataCriacao = new Date().toISOString();

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fornecedor)
    }).then(() => {
      form.reset();
      closeFornecedorModal();
      loadFornecedores();
    });
  }
});

// Limpa formulário e campos extras ao fechar o modal
function limparModal() {
  form.reset();
  idInput.value = '';
  document.getElementById('alteradoPorFornecedor').value = '';
  document.getElementById('dataAlteracaoFornecedor').value = '';
  insumosInput.value = '';
  const checkboxes = document.querySelectorAll('input[name="insumos"]');
  checkboxes.forEach(cb => cb.checked = false);
}

document.getElementById('fornecedorModal').addEventListener('hidden.bs.modal', limparModal);

searchInput.addEventListener('input', (e) => {
  loadFornecedores(e.target.value);
});

function formatDateToUser(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

loadFornecedores();
