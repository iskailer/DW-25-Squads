document.addEventListener('DOMContentLoaded', () => {
    const db = new PouchDB('formularios');
    const form = document.getElementById('formFormulario');
    const tituloInput = document.getElementById('titulo');
    const descricaoInput = document.getElementById('descricao');
    const revInput = document.getElementById('formRev');
    const perguntasContainer = document.getElementById('perguntasContainer');
    const addPerguntaBtn = document.getElementById('addPerguntaBtn');

    let formId = null;

    function removerOpcao(botao) {
        botao.closest('.input-group').remove();
    }

    function adicionarOpcao(botao, valor = '') {
        const lista = botao.closest('.opcoes-container').querySelector('.opcoes-list');
        const div = document.createElement('div');
        div.className = 'input-group mb-1';
        div.innerHTML = `
            <input type="text" class="form-control opcao" placeholder="Digite a opção" value="${valor}" />
            <button type="button" class="btn btn-outline-danger btn-sm remover-opcao-btn">Remover</button>
        `;
        lista.appendChild(div);
        div.querySelector('.remover-opcao-btn').addEventListener('click', (e) => removerOpcao(e.currentTarget));
    }

    function toggleOpcoes(select) {
        const container = select.closest('.pergunta');
        const opcoesContainer = container.querySelector('.opcoes-container');
        opcoesContainer.style.display = (select.value === 'multipla' || select.value === 'checkbox') ? 'block' : 'none';
    }

    function removerPergunta(botao) {
        botao.closest('.pergunta').remove();
    }

    function adicionarPergunta(pergunta = null) {
        const div = document.createElement("div");
        div.className = "pergunta mb-3 p-3 border rounded position-relative";

        const perguntaTexto = pergunta ? pergunta.nome : '';
        const tipoResposta = pergunta ? pergunta.tipo : 'texto';
        const isObrigatorio = pergunta ? pergunta.obrigatorio : false;
        
        div.innerHTML = `
            <button type="button" class="btn-close position-absolute top-0 end-0 remover-pergunta-btn"></button>
            <div class="mb-2">
                <label class="form-label">Pergunta</label>
                <input type="text" class="form-control pergunta-texto" required value="${perguntaTexto}" />
            </div>
            <div class="mb-2">
                <label class="form-label">Tipo de Resposta</label>
                <select class="form-select pergunta-tipo">
                    <option value="texto" ${tipoResposta === 'texto' ? 'selected' : ''}>Texto</option>
                    <option value="multipla" ${tipoResposta === 'multipla' ? 'selected' : ''}>Múltipla Escolha</option>
                    <option value="checkbox" ${tipoResposta === 'checkbox' ? 'selected' : ''}>Caixas de Seleção</option>
                </select>
            </div>
            <div class="form-check mb-2">
                <input class="form-check-input pergunta-obrigatoria" type="checkbox" ${isObrigatorio ? 'checked' : ''}>
                <label class="form-check-label">Obrigatório</label>
            </div>
            <div class="opcoes-container" style="display: none;">
                <label class="form-label">Opções</label>
                <div class="opcoes-list mb-2"></div>
                <button type="button" class="btn btn-sm btn-outline-secondary add-opcao-btn">+ Adicionar Opção</button>
            </div>
        `;
        perguntasContainer.appendChild(div);

        div.querySelector('.remover-pergunta-btn').addEventListener('click', (e) => removerPergunta(e.currentTarget));
        div.querySelector('.pergunta-tipo').addEventListener('change', (e) => toggleOpcoes(e.currentTarget));
        div.querySelector('.add-opcao-btn').addEventListener('click', (e) => adicionarOpcao(e.currentTarget));

        const select = div.querySelector('.pergunta-tipo');
        if (pergunta && (pergunta.tipo === 'multipla' || pergunta.tipo === 'checkbox')) {
             const addOpcaoBtnRef = div.querySelector('.add-opcao-btn');
             pergunta.opcoes.forEach(opt => adicionarOpcao(addOpcaoBtnRef, opt));
        }
        toggleOpcoes(select);
    }
    
    async function carregarFormularioParaEdicao() {
        const params = new URLSearchParams(window.location.search);
        formId = params.get('id');

        if (!formId) {
            alert('ID do formulário não encontrado!');
            window.location.href = 'gestao.html';
            return;
        }

        try {
            const doc = await db.get(formId);
            tituloInput.value = doc.titulo;
            descricaoInput.value = doc.descricao;
            revInput.value = doc._rev; 

            perguntasContainer.innerHTML = '';
            
            Object.values(doc.documento).forEach(p => {
                 const [nome, tipo, obrigatorio, opcoesObj] = p;
                 const perguntaData = {
                     nome,
                     tipo,
                     obrigatorio,
                     opcoes: (opcoesObj && opcoesObj.opc) ? opcoesObj.opc : []
                 };
                 adicionarPergunta(perguntaData);
            });

        } catch (err) {
            console.error('Erro ao carregar formulário para edição:', err);
            alert('Não foi possível carregar o formulário.');
        }
    }
    
    addPerguntaBtn.addEventListener('click', () => adicionarPergunta());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const documento = {};
        const perguntasDivs = document.querySelectorAll("#perguntasContainer .pergunta");

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

        const formularioAtualizado = {
            _id: formId,
            _rev: revInput.value,
            tipo: "formulario",
            titulo: tituloInput.value.trim(),
            descricao: descricaoInput.value.trim(),
            dataCriacao: (await db.get(formId)).dataCriacao,
            documento
        };

        try {
            await db.put(formularioAtualizado);
            alert('Formulário atualizado com sucesso!');
            window.location.href = 'gestao.html';
        } catch (err) {
            console.error('Erro ao atualizar o formulário:', err);
            alert('Ocorreu um erro ao salvar as alterações.');
        }
    });

    carregarFormularioParaEdicao();
});