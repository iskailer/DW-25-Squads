document.addEventListener('DOMContentLoaded', () => {
    const db = new PouchDB('formularios');
    const listaContainer = document.getElementById('lista-formularios');

    async function carregarFormularios() {
        try {
            const result = await db.allDocs({
                include_docs: true,
                startkey: 'formulario_',
                endkey: 'formulario_\ufff0'
            });

            listaContainer.innerHTML = '';

            if (result.rows.length === 0) {
                listaContainer.innerHTML = '<p class="text-muted">Nenhum formulário encontrado.</p>';
                return;
            }

            result.rows.forEach(item => {
                const doc = item.doc;
                const listItem = document.createElement('div');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                listItem.innerHTML = `
                    <div>
                        <h5 class="mb-1">${doc.titulo}</h5>
                        <p class="mb-1">${doc.descricao}</p>
                        <small>Criado em: ${new Date(doc.dataCriacao).toLocaleString()}</small>
                    </div>
                    <div>
                        <a href="edicao.html?id=${doc._id}" class="btn btn-primary me-2">
                            <i class="bi bi-pencil-square"></i> Editar
                        </a>
                        <button class="btn btn-danger" data-id="${doc._id}" data-rev="${doc._rev}">
                            <i class="bi bi-trash"></i> Excluir
                        </button>
                    </div>
                `;
                listaContainer.appendChild(listItem);
            });

            document.querySelectorAll('.btn-danger').forEach(button => {
                button.addEventListener('click', excluirFormulario);
            });

        } catch (err) {
            console.error("Erro ao carregar formulários:", err);
            listaContainer.innerHTML = '<p class="text-danger">Não foi possível carregar os formulários.</p>';
        }
    }

    async function excluirFormulario(event) {
        const id = event.currentTarget.getAttribute('data-id');
        const rev = event.currentTarget.getAttribute('data-rev');

        if (confirm('Tem certeza que deseja excluir este formulário?')) {
            try {
                await db.remove(id, rev);
                alert('Formulário excluído com sucesso!');
                carregarFormularios();
            } catch (err) {
                console.error("Erro ao excluir formulário:", err);
                alert('Ocorreu um erro ao excluir o formulário.');
            }
        }
    }

    carregarFormularios();
});