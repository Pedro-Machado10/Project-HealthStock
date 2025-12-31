// Variáveis de controle
let modoEdicao = false;
let idEmEdicao = null;
const apiUrl = 'http://localhost:3000/movimentacao';

// Elementos do DOM
const modalEl = document.getElementById('movimentacaoModal');
const form = document.getElementById('movimentacaoForm');
const modal = new bootstrap.Modal(modalEl);
const modalTitle = document.getElementById('movimentacaoModalLabel');
const modalFooter = document.querySelector('.modal-footer');

// Botões reutilizáveis
const salvarBtn = `<button type="submit" class="btn btn-primary">Salvar</button>`;
const editarBtn = `<button type="submit" class="btn btn-warning">Editar</button>`;
const deletarBtn = `<button type="button" class="btn btn-danger" id="btnDeletar">Deletar</button>`;
const cancelarBtn = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>`;

// Limpar o modal ao fechar
modalEl.addEventListener('hidden.bs.modal', () => {
  form.reset();
  $('#insumo, #origem, #destino').val(null).trigger('change');
});

// Evento botão "Adicionar"
document.querySelector('.btn-success').addEventListener('click', () => {
  modoEdicao = false;
  idEmEdicao = null;

  modalTitle.textContent = 'Adicionar Movimentação';
  modalFooter.innerHTML = salvarBtn + cancelarBtn;
  form.reset();
  document.getElementById('dataVencimentoMovimentacao').valueAsDate = new Date();

  $('#insumo, #origem, #destino').select2({
    theme: 'bootstrap-5',
    dropdownParent: $('#movimentacaoModal'),
    width: '100%',
    placeholder: 'Selecione um item',
    allowClear: true
  });
});

// Evento de clique em linha da tabela

// Seleciona uma linha e carrega os dados no modal

document.querySelector("tbody").addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;

  $('#insumo, #origem, #destino').select2({
    theme: 'bootstrap-5',
    dropdownParent: $('#movimentacaoModal'),
    width: '100%',
  });

  // Extrair dados da linha
  const [insumoCell, quantidade, data, origemCell, destinoCell] = row.cells;

  document.getElementById('quantidadeMovimentacao').value = quantidade.textContent;
  document.getElementById('dataVencimentoMovimentacao').value = data.textContent.split("/").reverse().join("-");

  // Preencher selects com os IDs
  $('#insumo').val(insumoCell.id).trigger('change');
  $('#origem').val(origemCell.id).trigger('change');
  $('#destino').val(destinoCell.id).trigger('change');

  // Configura modal para edição
  idEmEdicao = row.id.replace('mov-', '');
  modoEdicao = true;
  modalTitle.textContent = 'Editar Movimentação';
  modalFooter.innerHTML = editarBtn + deletarBtn + cancelarBtn;

  // Adicionar evento ao botão de deletar após renderizar
  setTimeout(() => {
    const btnDeletar = document.getElementById('btnDeletar');
    if (btnDeletar) {
      btnDeletar.addEventListener('click', async () => {
        const confirmacao = confirm('Tem certeza que deseja deletar esta movimentação?');
        if (!confirmacao) return;

        try {
          await fetch(`${apiUrl}/${idEmEdicao}`, { method: 'DELETE' });
          location.reload();
        } catch (error) {
          console.error('Erro ao deletar movimentação:', error);
          alert('Erro ao deletar movimentação.');
        }
      });
    }
  }, 0);

  modal.show();
});

// Carrega opções dos selects
fetch('http://localhost:3000/insumos')
  .then(res => res.json())
  .then(insumos => {
    const selectInsumo = document.getElementById('insumo');
    insumos.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.nome;
      selectInsumo.appendChild(option);
    });
    $('#insumo').trigger('change');
  });

fetch('http://localhost:3000/setores')
  .then(res => res.json())
  .then(setores => {
    const selectOrigem = document.getElementById('origem');
    const selectDestino = document.getElementById('destino');

    setores.forEach(setor => {
      const option1 = new Option(setor.nome, setor.id);
      const option2 = new Option(setor.nome, setor.id);
      selectOrigem.appendChild(option1);
      selectDestino.appendChild(option2);
    });

    $('#origem').trigger('change');
    $('#destino').trigger('change');
  });

// Envio do formulário (criação ou edição)
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dados = {
    insumoId: document.getElementById('insumo').value,
    quantidade_da_M: parseInt(document.getElementById('quantidadeMovimentacao').value),
    data_M: document.getElementById('dataVencimentoMovimentacao').value,
    origem: document.getElementById('origem').value,
    destino: document.getElementById('destino').value
  };

  try {
    const res = await fetch(`http://localhost:3000/insumos/${dados.insumoId}`);
    const insumo = await res.json();

    if (dados.quantidade_da_M > insumo.quantidade) {
      alert(`Quantidade indisponível! Máximo: ${insumo.quantidade}`);
      return;
    }

    if (dados.origem == dados.destino) {
      alert(`Movimentação não pode ocorrer no mesmo setor`);
      return;
    }

    if (modoEdicao) {
      dados.id_M = parseInt(idEmEdicao);
      await fetch(`${apiUrl}/${idEmEdicao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
    } else {
      dados.id_M = Date.now();
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
    }

    location.reload();
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro ao processar a movimentação.');
  }
});

// Carregar movimentações existentes

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(apiUrl);
    const movimentacoes = await res.json();
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

for (const mov of movimentacoes) {
  const [insumo, origem, destino] = await Promise.all([
    fetch(`http://localhost:3000/insumos/${mov.insumoId}`).then(r => r.json()),
    
    mov.origem === "Estoque"
      ? Promise.resolve({ id: "Estoque", nome: "Estoque" })
      : fetch(`http://localhost:3000/setores/${mov.origem}`).then(r => r.json()),
    mov.destino === "Estoque"
      ? Promise.resolve({ id: "Estoque", nome: "Estoque" })
      : fetch(`http://localhost:3000/setores/${mov.destino}`).then(r => r.json())
  ]);

  const formatarDataBR = (dataISO) => {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const row = `
    <tr id="mov-${mov.id}">
      <td id="${insumo.id}">${insumo.nome}</td>
      <td>${mov.quantidade_da_M}</td>
      <td>${formatarDataBR(mov.data_M)}</td>
      <td id="${origem.id}">${origem.nome}</td>
      <td id="${destino.id}">${destino.nome}</td>
    </tr>`;

  tbody.insertAdjacentHTML("beforeend", row);
}
  } catch (error) {
    console.error("Erro ao carregar movimentações:", error);
  }
});