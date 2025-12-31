// URLs da API
const API_URL = 'http://localhost:3000';
const INSUMOS_URL = `${API_URL}/insumos`;
const MOVIMENTACOES_URL = `${API_URL}/movimentacao`;
const COMPRAS_URL = `${API_URL}/compras`;
const USERS_URL = `${API_URL}/users`;

// Cache simples
let cache = {
  insumos: null,
  movimentacoes: null,
  compras: null,
  users: null
};

// Função para obter o usuário logado
function getUsuarioLogado() {
  return JSON.parse(localStorage.getItem("usuarioLogado")) || {};
}

// Formata data para exibição
function formatDate(dateString) {
  if (!dateString) return '';
  const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
}

// =============================================
// 2. Funcionalidades Avançadas - Sistema de Alertas
// =============================================

function checkAlertas(insumos) {
  const alertas = [];
  
  // Itens com baixo estoque
  const baixoEstoque = insumos.filter(i => i.quantidade < 10);
  if (baixoEstoque.length > 0) {
    alertas.push({
      tipo: 'warning',
      mensagem: `${baixoEstoque.length} itens com estoque baixo`,
      detalhes: `Itens: ${baixoEstoque.slice(0, 3).map(i => i.nome).join(', ')}${baixoEstoque.length > 3 ? '...' : ''}`
    });
  }
  
  // Itens próximos do vencimento
  const hoje = new Date();
  const proximosVencimentos = insumos.filter(i => {
    if (!i.dataVencimento) return false;
    const vencimento = new Date(i.dataVencimento);
    const diff = Math.floor((vencimento - hoje) / (1000 * 60 * 60 * 24));
    return diff <= 30 && diff > 0;
  });
  
  if (proximosVencimentos.length > 0) {
    alertas.push({
      tipo: 'danger',
      mensagem: `${proximosVencimentos.length} itens próximos do vencimento`,
      detalhes: `Verifique a data de vencimento`
    });
  }
  
  // Exibe alertas
  showAlertas(alertas);
}

function showAlertas(alertas) {
  const container = document.createElement('div');
  container.className = 'alert-container';
  
  alertas.forEach((alerta, index) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alerta.tipo} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
      <strong>${alerta.mensagem}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      <div class="small mt-1">${alerta.detalhes}</div>
    `;
    
    // Fecha automaticamente após 10 segundos
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }, 10000);
    
    container.appendChild(alertDiv);
  });
  
  document.body.appendChild(container);
}

// =============================================
// 3. Melhorias de UI/UX - Skeleton Loading
// =============================================

function initSkeletonLoading() {
  // Cards de resumo
  document.querySelectorAll('.card-text').forEach(el => {
    if (el.textContent === 'Carregando...') {
      el.innerHTML = '<div class="skeleton-loader" style="height: 100%; width: 100%;"></div>';
    }
  });
  
  // Tabela de movimentações
  const tabela = document.getElementById('ultimasMovimentacoes');
  if (tabela) {
    tabela.innerHTML = `
      <tr>
        <td><div class="skeleton-loader" style="height: 20px; width: 100%;"></div></td>
        <td><div class="skeleton-loader" style="height: 20px; width: 100%;"></div></td>
        <td><div class="skeleton-loader" style="height: 20px; width: 100%;"></div></td>
        <td><div class="skeleton-loader" style="height: 20px; width: 100%;"></div></td>
        <td><div class="skeleton-loader" style="height: 20px; width: 100%;"></div></td>
        <td><div class="skeleton-loader" style="height: 20px; width: 100%;"></div></td>
      </tr>
      `.repeat(5);
  }
  
  // Lista de solicitações
  const solicitacoes = document.getElementById('ultimasSolicitacoes');
  if (solicitacoes) {
    solicitacoes.innerHTML = `
      <li class="list-group-item">
        <div class="skeleton-loader" style="height: 20px; width: 100%;"></div>
      </li>
      `.repeat(3);
  }
}

// =============================================
// Carregamento principal
// =============================================

async function loadDashboardData() {
  try {
    const usuario = getUsuarioLogado();
    if (usuario.name) {
      document.getElementById("userEmail").innerHTML = 
        `Bem-vindo, <strong>${usuario.name}</strong> ao sistema de controle de estoque hospitalar <strong>HealthStock</strong>.`;
    }
    
    initSkeletonLoading();
    
    // Carrega dados em paralelo
    const [insumos, movimentacoes, compras, users] = await Promise.all([
      fetch(INSUMOS_URL).then(res => res.json()),
      fetch(MOVIMENTACOES_URL).then(res => res.json()),
      fetch(COMPRAS_URL).then(res => res.json()),
      fetch(USERS_URL).then(res => res.json())
    ]);
    
    // Atualiza cache
    cache = { insumos, movimentacoes, compras, users };
    
    // Atualiza os cards principais
    document.getElementById('totalInsumos').textContent = insumos.length;
    document.getElementById('baixoEstoque').textContent = insumos.filter(i => i.quantidade < 10).length;
    document.getElementById('movimentacoesHoje').textContent = contarMovimentacoesHoje(movimentacoes);  
    document.getElementById('ultimasEntradas').textContent = compras.length;
    
    // Verifica alertas
    checkAlertas(insumos);
    
    // Atualiza listas com mais informações
    updateUltimasMovimentacoes(movimentacoes, insumos, users);
    updateUltimasSolicitacoes(compras);
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showAlertas([{
      tipo: 'danger',
      mensagem: 'Erro ao carregar dados',
      detalhes: 'Não foi possível conectar ao servidor'
    }]);
  }
}

// Substitua a linha problemática por esta função:
function contarMovimentacoesHoje(movimentacoes) {
  const hoje = new Date();
  const dataHoje = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
  return movimentacoes.filter(m => {
    if (!m.data_M) return false;
    
    // Extrai a parte da data (ignorando o horário)
    const dataMov = m.data_M.split('T')[0];
    return dataMov === dataHoje;
  }).length;
}


// Atualiza a tabela de movimentações com mais detalhes
function updateUltimasMovimentacoes(movimentacoes, insumos, users) {
  const container = document.getElementById('ultimasMovimentacoes');
  container.innerHTML = '';
  
  // Ordena por data mais recente e pega as últimas 10
  const ultimas = movimentacoes
    .sort((a, b) => new Date(b.data_M) - new Date(a.data_M))
    .slice(0, 10);
  
  if (ultimas.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">
          Nenhuma movimentação registrada recentemente
        </td>
      </tr>
    `;
    return;
  }
  
  ultimas.forEach(mov => {
    const insumo = insumos.find(i => i.id === mov.insumoId) || { nome: 'Insumo não encontrado' };
    const user = users.find(u => u.id === mov.userId) || { name: 'Usuário desconhecido' };
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${insumo.nome}</strong>
        ${insumo.descricao ? `<div class="small text-muted">${insumo.descricao}</div>` : ''}
      </td>
      <td>
        <span class="badge ${mov.quantidade_da_M > 0 ? 'bg-success' : 'bg-danger'}">
          ${mov.quantidade_da_M > 0 ? 'Entrada' : 'Saída'}
        </span>
      </td>
      <td class="fw-bold ${mov.quantidade_da_M > 0 ? 'text-success' : 'text-danger'}">
        ${mov.quantidade_da_M > 0 ? '+' : ''}${mov.quantidade_da_M}
      </td>
      <td>
        <div>${mov.origem || 'N/A'}</div>
        <div class="small text-muted">${mov.destino || 'N/A'}</div>
      </td>
      <td>${formatDate(mov.data_M)}</td>
    `;
    container.appendChild(tr);
  });
}

function updateUltimasSolicitacoes(compras) {
  const container = document.getElementById('ultimasSolicitacoes');
  container.innerHTML = '';
  
  compras
    .sort((a, b) => new Date(b.dataSolicitacao) - new Date(a.dataSolicitacao))
    .slice(0, 5)
    .forEach(comp => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-center w-100">
          <div>
            <strong>#${comp.idSolicitacao}</strong> - ${comp.solicitante.nome}
            <div class="text-muted small">${formatDate(comp.dataSolicitacao)}</div>
          </div>
          <span class="badge ${getStatusClass(comp.status)}">${comp.status}</span>
        </div>
      `;
      container.appendChild(li);
    });
}

function getStatusClass(status) {
  switch(status) {
    case 'PENDENTE': return 'bg-warning text-dark';
    case 'APROVADA': return 'bg-success text-white';
    case 'REJEITADA': return 'bg-danger text-white';
    default: return 'bg-secondary text-white';
  }
}

// Inicializa o dashboard quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
  if (!getUsuarioLogado()) {
    window.location.href = '../login.html';
  } else {
    loadDashboardData();
    
    // Atualiza a cada 5 minutos
    setInterval(loadDashboardData, 300000);
  }
});