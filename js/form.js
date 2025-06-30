const db = new PouchDB('formularios');

    function atualizarNumeracaoPerguntas() {
      const perguntas = document.querySelectorAll('#perguntasContainer .pergunta');
      perguntas.forEach((div, index) => {
        const label = div.querySelector('label.form-label');
        if (label) label.textContent = `Pergunta ${index + 1}`;
      });
    }

    function adicionarPergunta() {
      const container = document.getElementById("perguntasContainer");

      const div = document.createElement("div");
      div.className = "pergunta mb-3 p-3 border rounded position-relative";

      div.innerHTML = `
        <button type="button" class="btn-close position-absolute top-0 end-0" onclick="removerPergunta(this)"></button>
        <div class="mb-2">
          <label class="form-label">Pergunta</label>
          <input type="text" class="form-control pergunta-texto" required />
        </div>
        <div class="mb-2">
          <label class="form-label">Tipo de Resposta</label>
          <select class="form-select pergunta-tipo" onchange="toggleOpcoes(this)">
            <option value="texto">Texto</option>
            <option value="multipla">Múltipla Escolha</option>
            <option value="checkbox">Caixas de Seleção</option>
          </select>
        </div>
        <div class="form-check mb-2">
          <input class="form-check-input pergunta-obrigatoria" type="checkbox">
          <label class="form-check-label">Obrigatório</label>
        </div>
        <div class="opcoes-container" style="display: none;">
          <label class="form-label">Opções</label>
          <div class="opcoes-list mb-2"></div>
          <button type="button" class="btn btn-sm btn-outline-secondary" onclick="adicionarOpcao(this)">+ Adicionar Opção</button>
        </div>
      `;

      container.appendChild(div);
      atualizarNumeracaoPerguntas();
    }

    function toggleOpcoes(select) {
      const container = select.closest('.pergunta');
      const opcoesContainer = container.querySelector('.opcoes-container');
      opcoesContainer.style.display = (select.value === 'multipla' || select.value === 'checkbox') ? 'block' : 'none';
    }

    function adicionarOpcao(botao) {
      const lista = botao.parentElement.querySelector('.opcoes-list');
      const div = document.createElement('div');
      div.className = 'input-group mb-1';

      div.innerHTML = `
        <input type="text" class="form-control opcao" placeholder="Digite a opção" />
        <button type="button" class="btn btn-outline-danger" onclick="removerOpcao(this)">Remover</button>
      `;

      lista.appendChild(div);
    }

    function removerOpcao(botao) {
      botao.parentElement.remove();
    }

    function removerPergunta(botao) {
      botao.parentElement.remove();
      atualizarNumeracaoPerguntas();
    }

    const form = document.getElementById('formFormulario');
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const titulo = document.getElementById('titulo').value.trim();
      const descricao = document.getElementById('descricao').value.trim();
      const dataCriacao = new Date().toISOString();
      const formularioId = `formulario_${dataCriacao}`;

      const perguntasDivs = document.querySelectorAll("#perguntasContainer .pergunta");
      const documento = {};

      perguntasDivs.forEach((div, index) => {
        const nome = div.querySelector('.pergunta-texto').value.trim();
        const tipo = div.querySelector('.pergunta-tipo').value;
        const obrigatorio = div.querySelector('.pergunta-obrigatoria').checked;
        const opcoes = [...div.querySelectorAll('.opcao')].map(i => i.value.trim()).filter(i => i);

        const perguntaKey = `Pergunta ${index + 1}`;
        documento[perguntaKey] = [nome, tipo, obrigatorio];

        if (tipo === 'multipla' || tipo === 'checkbox') {
          documento[perguntaKey].push({ opc: opcoes });
        }
      });

      const formularioDoc = {
        _id: formularioId,
        tipo: "formulario",
        titulo,
        descricao,
        dataCriacao,
        documento
      };



  

      try {
        await db.put(formularioDoc);
        alert('Formulário salvo com sucesso!');
        form.reset();
        document.getElementById("perguntasContainer").innerHTML = "";
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar o formulário.');
      }
    });