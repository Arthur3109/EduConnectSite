/**
 * Gerencia cadastro e filtros das ocorrências da Secretaria.
 */
(() => {
    'use strict';

    const STATIC_KEY = 'ocorrencias-fixture-2026';
    const GRAVIDADES = new Map([
        ['leve', { label: 'Leve', classe: 'badge-leve' }],
        ['media', { label: 'Média', classe: 'badge-media' }],
        ['grave', { label: 'Grave', classe: 'badge-grave' }]
    ]);

    /* 1. Mantém os dados iniciais da tabela disponíveis para o backend. */
    function seed(backend, table) {
        if (backend.getOccurrences().length) return;
        const records = [...(table?.querySelectorAll('tbody > tr') ?? [])].map((row) => {
            const cells = [...row.cells];
            return {
                id: backend.createId('ocorrencia'),
                protocolo: cells[0]?.textContent?.trim() ?? '',
                data: cells[1]?.textContent?.trim() ?? '',
                aluno: cells[2]?.textContent?.trim() ?? '',
                tipo: cells[3]?.textContent?.trim() ?? '',
                gravidade: cells[4]?.textContent?.trim() ?? '',
                descricao: cells[5]?.textContent?.trim() ?? '',
                status: cells[6]?.textContent?.trim() ?? '',
                __seedKey: STATIC_KEY,
                criadoEm: backend.nowIso()
            };
        }).filter((item) => item.protocolo);
        if (records.length) backend.saveOccurrences(records);
    }

    /* 2. Padroniza a gravidade sem alterar o valor persistido no backend. */
    function padronizarGravidade(value) {
        const chave = String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLocaleLowerCase('pt-BR');
        return GRAVIDADES.get(chave) ?? { label: String(value ?? '').trim(), classe: 'badge-outro' };
    }

    /* 3. Preserva o fluxo de cadastro de novas ocorrências. */
    function createModal(backend, refresh) {
        const dialog = document.createElement('dialog');
        dialog.className = 'ocorrencia-dialog';
        dialog.innerHTML = `
            <form method="dialog" class="nova-ocorrencia-form">
                <h2>Nova Ocorrência</h2>
                <label>Aluno<input name="aluno" required></label>
                <label>Tipo<select name="tipo" required>
                    <option value="">Selecione</option>
                    <option>Disciplinar</option>
                    <option>Pedagógica</option>
                    <option>Administrativa</option>
                </select></label>
                <label>Gravidade<select name="gravidade" required>
                    <option value="">Selecione</option>
                    <option>Leve</option>
                    <option>Média</option>
                    <option>Grave</option>
                </select></label>
                <label>Descrição<textarea name="descricao" rows="5" required></textarea></label>
                <div style="display:flex;justify-content:flex-end;gap:10px">
                    <button type="button" data-cancel>Cancelar</button>
                    <button type="submit">Salvar ocorrência</button>
                </div>
            </form>`;
        document.body.append(dialog);

        dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
        dialog.addEventListener('submit', (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget).entries());
            const record = backend.addOccurrence(values);
            if (record) {
                refresh();
                dialog.close();
            }
        });
        return dialog;
    }

    /* 4. Exibe os campos completos do registro selecionado com conteúdo seguro. */
    function createDetailModal() {
        const dialog = document.createElement('dialog');
        dialog.className = 'ocorrencia-dialog detalhe-dialog';
        dialog.setAttribute('aria-labelledby', 'titulo-detalhes-ocorrencia');

        const form = document.createElement('form');
        form.method = 'dialog';
        form.className = 'detalhes-ocorrencia';

        const heading = document.createElement('h2');
        heading.id = 'titulo-detalhes-ocorrencia';
        heading.textContent = 'Detalhes da ocorrência';
        form.append(heading);

        const fields = document.createElement('dl');
        fields.className = 'detalhes-ocorrencia__campos';
        const values = new Map();
        ['Protocolo', 'Data', 'Aluno', 'Tipo', 'Gravidade', 'Status'].forEach((label) => {
            const term = document.createElement('dt');
            term.textContent = label;
            const description = document.createElement('dd');
            values.set(label, description);
            fields.append(term, description);
        });

        const descriptionHeading = document.createElement('h3');
        descriptionHeading.textContent = 'Descrição completa';
        const description = document.createElement('p');
        description.className = 'detalhes-ocorrencia__descricao';
        values.set('Descrição', description);

        const actions = document.createElement('div');
        actions.className = 'detalhes-ocorrencia__acoes';
        const closeButton = document.createElement('button');
        closeButton.type = 'submit';
        closeButton.textContent = 'Fechar';
        actions.append(closeButton);
        form.append(fields, descriptionHeading, description, actions);
        dialog.append(form);
        document.body.append(dialog);

        return {
            dialog,
            open(record) {
                const gravity = padronizarGravidade(record.gravidade).label;
                const content = {
                    Protocolo: record.protocolo,
                    Data: record.data,
                    Aluno: record.aluno,
                    Tipo: record.tipo,
                    Gravidade: gravity,
                    Status: record.status,
                    Descrição: record.descricao
                };
                values.forEach((element, label) => {
                    element.textContent = content[label] || '—';
                });
                dialog.showModal();
            }
        };
    }

    /* 5. Inicializa filtros, tabela, cadastro e inspeção dos registros. */
    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) return;
        const table = document.querySelector('.tabela');
        const body = table?.querySelector('tbody');
        const filters = [...document.querySelectorAll('.filtros-linha select')];
        const newButton = document.querySelector('.btn-novo');
        if (!table || !body) return;

        seed(backend, table);

        function values(field) {
            return [...new Set(backend.getOccurrences().map((record) => record[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        }

        ['tipo', 'gravidade', 'status'].forEach((field, index) => {
            if (!filters[index]) return;
            const current = filters[index].value;
            const label = index === 0 ? 'Tipo: Todos' : index === 1 ? 'Gravidade: Todas' : 'Status: Todos';
            const options = values(field).map((value) => field === 'gravidade' ? padronizarGravidade(value).label : value);
            filters[index].replaceChildren(new Option(label, ''));
            [...new Set(options)].forEach((value) => filters[index].add(new Option(value, value)));
            filters[index].value = current;
        });

        function render() {
            const records = backend.getOccurrences().filter((record) =>
                (!filters[0]?.value || record.tipo === filters[0].value)
                && (!filters[1]?.value || padronizarGravidade(record.gravidade).label === filters[1].value)
                && (!filters[2]?.value || record.status === filters[2].value)
            );
            body.replaceChildren();
            records.forEach((record) => {
                const row = document.createElement('tr');
                [record.protocolo, record.data, record.aluno, record.tipo, record.gravidade, record.descricao, record.status].forEach((value, index) => {
                    const cell = document.createElement('td');
                    if (index === 0) {
                        const strong = document.createElement('strong');
                        strong.textContent = value;
                        cell.append(strong);
                    } else if (index === 4) {
                        const gravity = padronizarGravidade(value);
                        const badge = document.createElement('span');
                        badge.className = `badge ${gravity.classe}`;
                        badge.textContent = gravity.label || '—';
                        cell.append(badge);
                    } else if (index === 5) {
                        const inspectButton = document.createElement('button');
                        inspectButton.type = 'button';
                        inspectButton.className = 'btn-inspecionar';
                        inspectButton.dataset.occurrenceId = record.id;
                        inspectButton.textContent = 'Inspecionar';
                        inspectButton.setAttribute('aria-label', `Inspecionar ocorrência ${record.protocolo}`);
                        cell.append(inspectButton);
                    } else cell.textContent = value || '—';
                    row.append(cell);
                });
                body.append(row);
            });
            if (!records.length) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.textContent = 'Nenhuma ocorrência encontrada.';
                row.append(cell);
                body.append(row);
            }
        }

        const dialog = createModal(backend, render);
        const detailModal = createDetailModal();
        newButton?.addEventListener('click', () => dialog.showModal());
        filters.forEach((select) => select.addEventListener('change', render));
        body.addEventListener('click', (event) => {
            const button = event.target.closest('[data-occurrence-id]');
            if (!button) return;
            const record = backend.getOccurrences().find((item) => item.id === button.dataset.occurrenceId);
            if (record) detailModal.open(record);
        });
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
