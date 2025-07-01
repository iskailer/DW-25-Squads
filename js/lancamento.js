document.addEventListener('DOMContentLoaded', () => {
    const db = new PouchDB('formularios');
    const listaFormulariosContainer = document.getElementById('lista-formularios');
    const formularioDinamicoContainer = document.getElementById('formulario-dinamico');
    const formDisplayTitle = document.getElementById('form-display-title');

    async function carregarFormulariosParaLancamento() {
        try {
            const result = await db.allDocs({
                include_docs: true,
                startkey: 'formulario_',
                endkey: 'formulario_\ufff0'
            });

            listaFormulariosContainer.innerHTML = '';
            if (result.rows.length === 0) {
                listaFormulariosContainer.innerHTML = '<p class="text-muted">Nenhum formulário disponível para lançamento.</p>';
                return;
            }

            result.rows.forEach(item => {
                const doc = item.doc;
                const formItem = document.createElement('a');
                formItem.href = '#';
                formItem.classList.add('list-group-item', 'list-group-item-action', 'form-card');
                formItem.dataset.formId = doc._id;

                formItem.innerHTML = `
                    <h5 class="mb-1">${doc.titulo}</h5>
                    <small class="text-muted">${doc.descricao}</small>
                    <p class="mb-1 text-end"><small>Criado em: ${new Date(doc.dataCriacao).toLocaleDateString()}</small></p>
                `;
                formItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    montarFormularioParaPreenchimento(doc._id);
                });
                listaFormulariosContainer.appendChild(formItem);
            });

        } catch (err) {
            console.error("Erro ao carregar formulários para lançamento:", err);
            listaFormulariosContainer.innerHTML = '<p class="text-danger">Não foi possível carregar os formulários.</p>';
        }
    }

    async function montarFormularioParaPreenchimento(formId) {
        try {
            const formulario = await db.get(formId);
            formularioDinamicoContainer.innerHTML = '';

            if (formDisplayTitle) { 
                formDisplayTitle.innerHTML = 'Preencher Formulário';
            }


            const formElement = document.createElement('form');
            formElement.id = 'form-preenchimento-dinamico';
            formElement.dataset.formId = formId;

            formElement.innerHTML += `<h3 class="mb-3">${formulario.titulo}</h3>`;
            formElement.innerHTML += `<p class="text-muted mb-4">${formulario.descricao}</p>`;

            Object.keys(formulario.documento).forEach((perguntaKey, index) => {
                const [nome, tipo, obrigatorio, opcoesObj] = formulario.documento[perguntaKey];
                const opcoes = (opcoesObj && opcoesObj.opc) ? opcoesObj.opc : [];
                const fieldName = `campo_${index}_${perguntaKey.replace(/[^a-zA-Z0-9]/g, '')}`;

                const formGroup = document.createElement('div');
                formGroup.classList.add('mb-3', 'p-3', 'border', 'rounded');
                formGroup.innerHTML += `<label for="${fieldName}" class="form-label"><strong>${nome}</strong>${obrigatorio ? ' <span class="text-danger">*</span>' : ''}</label>`;

                let inputHtml = '';
                switch (tipo) {
                    case 'texto':
                        inputHtml = `<input type="text" class="form-control" id="${fieldName}" name="${fieldName}" ${obrigatorio ? 'required' : ''}>`;
                        break;
                    case 'multipla':
                        inputHtml = `<div class="form-check-group">`;
                        opcoes.forEach((opcao, i) => {
                            const optionId = `${fieldName}_${i}`;
                            inputHtml += `
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${fieldName}" id="${optionId}" value="${opcao}" ${obrigatorio ? 'required' : ''}>
                                    <label class="form-check-label" for="${optionId}">${opcao}</label>
                                </div>
                            `;
                        });
                        inputHtml += `</div>`;
                        break;
                    case 'checkbox':
                        inputHtml = `<div class="form-check-group">`;
                        opcoes.forEach((opcao, i) => {
                            const optionId = `${fieldName}_${i}`;
                            inputHtml += `
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="${fieldName}" id="${optionId}" value="${opcao}">
                                    <label class="form-check-label" for="${optionId}">${opcao}</label>
                                </div>
                            `;
                        });
                        inputHtml += `</div>`;
                        break;
                    default:
                        inputHtml = `<p class="text-danger">Tipo de campo não suportado: ${tipo}</p>`;
                }
                formGroup.innerHTML += inputHtml;
                formElement.appendChild(formGroup);
            });

            formElement.innerHTML += `
                <div class="d-flex justify-content-between mt-4">
                    <button type="submit" class="btn btn-primary">Salvar Resposta</button>
                    <button type="button" class="btn btn-success" id="btn-visualizar-respostas" data-form-id="${formId}">Visualizar Respostas</button>
                </div>
            `;
            formularioDinamicoContainer.appendChild(formElement);

            document.getElementById('btn-visualizar-respostas').addEventListener('click', (e) => {
                const currentFormId = e.target.dataset.formId;
                visualizarRespostasDoFormulario(currentFormId);
            });

            formElement.addEventListener('submit', handleFormSubmit);

        } catch (err) {
            console.error('Erro ao montar formulário:', err);
            formularioDinamicoContainer.innerHTML = '<p class="text-danger">Não foi possível carregar o formulário para preenchimento.</p>';
        }
    }

    async function visualizarRespostasDoFormulario(formId) {
        try {

            if (formDisplayTitle) { 
                formDisplayTitle.innerHTML = 'Respostas Registradas';
            }

            formularioDinamicoContainer.innerHTML = '';
            
            const backButton = document.createElement('button');
            backButton.classList.add('btn', 'btn-secondary', 'mb-3');
            backButton.innerHTML = `<i class="bi bi-arrow-left"></i> Voltar ao Formulário`;
            backButton.addEventListener('click', () => {
                montarFormularioParaPreenchimento(formId);
            });
            formularioDinamicoContainer.appendChild(backButton);

            const result = await db.allDocs({
                include_docs: true,
                startkey: 'resposta_', 
                endkey: 'resposta_\ufff0'
            });

            const respostasFiltradas = result.rows
                .map(row => row.doc)
                .filter(doc => doc.formId === formId);

            if (respostasFiltradas.length === 0) {
                formularioDinamicoContainer.innerHTML += '<p class="text-muted">Nenhuma resposta registrada para este formulário ainda.</p>';
                return;
            }

            const formDoc = await db.get(formId);
            
            respostasFiltradas.forEach((resposta, index) => {
                const respostaCard = document.createElement('div');
                respostaCard.classList.add('card', 'mb-3');
                respostaCard.innerHTML = `
                    <div class="card-header bg-light">
                        <strong>Resposta #${index + 1}</strong> - ${new Date(resposta.dataPreenchimento).toLocaleString()}
                    </div>
                    <ul class="list-group list-group-flush">
                    </ul>
                `;
                const ulElement = respostaCard.querySelector('ul');

                for (const campoNomeTecnico in resposta.respostas) {
                    if (resposta.respostas.hasOwnProperty(campoNomeTecnico)) {
                        const valor = resposta.respostas[campoNomeTecnico];
                        const liElement = document.createElement('li');
                        liElement.classList.add('list-group-item');
                        
                        let labelDoCampo = campoNomeTecnico;
                        
                        if (formDoc && formDoc.documento) {
                            Object.keys(formDoc.documento).forEach((perguntaKey, idx) => {
                                const [nomeOriginalPergunta] = formDoc.documento[perguntaKey];
                                const currentFieldNameGerado = `campo_${idx}_${perguntaKey.replace(/[^a-zA-Z0-9]/g, '')}`;
                                if (currentFieldNameGerado === campoNomeTecnico) {
                                    labelDoCampo = nomeOriginalPergunta;
                                }
                            });
                        }

                        liElement.innerHTML = `<strong>${labelDoCampo}:</strong> ${Array.isArray(valor) ? valor.join(', ') : valor}`;
                        ulElement.appendChild(liElement);
                    }
                }
                formularioDinamicoContainer.appendChild(respostaCard);
            });

        } catch (err) {
            console.error('Erro ao visualizar respostas:', err);
            formularioDinamicoContainer.innerHTML = '<p class="text-danger">Erro ao carregar as respostas.</p>';
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();

        const formElement = event.target;
        const formId = formElement.dataset.formId;
        const respostas = {};
        let isValid = true;

        const formInputs = formElement.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            const fieldName = input.name;
            if (!fieldName) return;

            const fieldType = input.type;
            const fieldValue = input.value.trim();

            if (fieldType === 'radio') {
                if (input.checked) {
                    respostas[fieldName] = fieldValue;
                }
            } else if (fieldType === 'checkbox') {
                if (!respostas[fieldName]) {
                    respostas[fieldName] = [];
                }
                if (input.checked) {
                    respostas[fieldName].push(fieldValue);
                }
            } else {
                respostas[fieldName] = fieldValue;
            }

            if (input.hasAttribute('required') && !fieldValue && fieldType !== 'checkbox' && fieldType !== 'radio') {
                isValid = false;
                alert(`Por favor, preencha o campo obrigatório.`);
                input.focus();
            }
        });

        const originalFormDoc = await db.get(formId);
        Object.keys(originalFormDoc.documento).forEach((perguntaKey, index) => {
            const [nome, tipo, obrigatorio] = originalFormDoc.documento[perguntaKey];
            if (obrigatorio && (tipo === 'multipla' || tipo === 'checkbox')) {
                const fieldName = `campo_${index}_${perguntaKey.replace(/[^a-zA-Z0-9]/g, '')}`;
                if (!respostas[fieldName] || (Array.isArray(respostas[fieldName]) && respostas[fieldName].length === 0)) {
                    isValid = false;
                    alert(`O campo "${nome}" é obrigatório. Por favor, selecione uma opção.`);
                }
            }
        });

        if (!isValid) {
            return;
        }

        const respostaDoc = {
            _id: `resposta_${new Date().getTime()}`,
            formId: formId,
            dataPreenchimento: new Date().toISOString(),
            respostas: respostas
        };

        try {
            await db.put(respostaDoc);
            alert('Resposta do formulário salva com sucesso!');

            if (formDisplayTitle) {
                formDisplayTitle.innerHTML = 'Preencher Formulário';
            }
            formularioDinamicoContainer.innerHTML = '<p class="text-muted">Selecione um formulário na lista ao lado para preencher.</p>';
        } catch (err) {
            console.error('Erro ao salvar resposta:', err);
            alert('Erro ao salvar a resposta do formulário.');
        }
    }

    carregarFormulariosParaLancamento();
});