/**
 * Gerencia cadastro e filtros das ocorrências da Secretaria.
 */
(() => {
    'use strict';

    const STATIC_KEY = 'ocorrencias-fixture-2026';

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

    function createModal(backend, refresh) {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
            <form method="dialog" style="display:grid;gap:14px;min-width:min(560px,90vw);padding:24px">
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
            const options = values(field);
            filters[index].replaceChildren(new Option(label, ''));
            options.forEach((value) => filters[index].add(new Option(value, value)));
            filters[index].value = current;
        });

        function render() {
            const records = backend.getOccurrences().filter((record) =>
                (!filters[0]?.value || record.tipo === filters[0].value)
                && (!filters[1]?.value || record.gravidade === filters[1].value)
                && (!filters[2]?.value || record.status === filters[2].value)
            );
            body.replaceChildren();
            records.forEach((record) => {
                const row = document.createElement('tr');
                [record.protocolo, record.data, record.aluno, record.tipo, record.gravidade, record.descricao, record.status].forEach((value, index) => {
                    const cell = document.createElement('td');
                    if (index === 0 || index === 4) {
                        const strong = document.createElement('strong');
                        strong.textContent = value;
                        cell.append(strong);
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
        newButton?.addEventListener('click', () => dialog.showModal());
        filters.forEach((select) => select.addEventListener('change', render));
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
