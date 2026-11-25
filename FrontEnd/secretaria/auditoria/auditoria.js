/**
 * Implementa consulta, paginação e exportação CSV do log de auditoria local.
 * Endereços IP criados no cliente são identificados como "cliente" para não simular uma origem de rede real.
 */
(() => {
    'use strict';

    const PAGE_SIZE = 8;

    function seed(backend, table) {
        if (backend.getAudit().length) return;
        const rows = [...(table?.querySelectorAll('tbody > tr') ?? [])];
        const records = rows.map((row) => {
            const cells = [...row.cells];
            return {
                id: backend.createId('audit-seed'),
                dataHora: cells[0]?.textContent?.trim() ?? '',
                usuario: cells[1]?.textContent?.trim() ?? '',
                modulo: cells[2]?.textContent?.trim() ?? '',
                acao: cells[3]?.textContent?.trim() ?? '',
                descricao: cells[4]?.textContent?.trim() ?? '',
                ip: cells[5]?.textContent?.trim() ?? '',
                __seedKey: 'auditoria-fixture-2026'
            };
        }).filter((record) => record.usuario);
        if (records.length) backend.saveAudit(records);
    }

    function csvEscape(value) {
        const text = String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    }

    function downloadCsv(rows) {
        const header = ['Data / Hora', 'Usuário', 'Módulo', 'Ação', 'Descrição', 'IP'];
        const data = rows.map((record) => [record.dataHora, record.usuario, record.modulo, record.acao, record.descricao, record.ip]);
        const csv = [header, ...data].map((line) => line.map(csvEscape).join(';')).join('\r\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `educonnect-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) return;
        const table = document.querySelector('.tabela');
        const body = table?.querySelector('tbody');
        const filters = [...document.querySelectorAll('.painel-filtros select, .filtros-linha select')];
        const filterButton = document.querySelector('.btn-filtrar');
        const exportButton = document.querySelector('.btn-novo');
        const pagination = document.querySelector('.paginacao');
        if (!table || !body || !pagination) return;

        seed(backend, table);
        let page = 1;

        function setupFilter(index, label, values) {
            const select = filters[index];
            if (!select) return;
            const current = select.value;
            select.replaceChildren(new Option(label, ''));
            [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach((value) => select.add(new Option(value, value)));
            select.value = current;
        }

        setupFilter(0, 'Usuário: Todos', backend.getAudit().map((item) => item.usuario));
        setupFilter(1, 'Módulo: Todos', backend.getAudit().map((item) => item.modulo));
        setupFilter(2, 'Ação: Todas', backend.getAudit().map((item) => item.acao));

        function filtered() {
            const all = backend.getAudit();
            const user = filters[0]?.value || '';
            const module = filters[1]?.value || '';
            const action = filters[2]?.value || '';
            return all.filter((record) =>
                (!user || record.usuario === user)
                && (!module || record.modulo === module)
                && (!action || record.acao === action)
            );
        }

        function renderPagination(totalPages) {
            pagination.replaceChildren();
            const makeButton = (label, target, active = false, disabled = false) => {
                const button = document.createElement('button');
                button.className = `page-btn${active ? ' ativo' : ''}`;
                button.type = 'button';
                button.textContent = String(label);
                button.dataset.page = String(target);
                button.disabled = disabled;
                return button;
            };
            pagination.append(makeButton('<', Math.max(1, page - 1), false, page === 1));
            const pages = totalPages <= 7 ? Array.from({ length: totalPages }, (_, index) => index + 1) : [1, 2, 3, '...', totalPages];
            pages.forEach((item) => {
                if (item === '...') {
                    const dots = document.createElement('span');
                    dots.className = 'page-dots';
                    dots.textContent = '...';
                    pagination.append(dots);
                    return;
                }
                pagination.append(makeButton(item, item, item === page));
            });
            pagination.append(makeButton('>', Math.min(totalPages, page + 1), false, page === totalPages));
        }

        function render() {
            const records = filtered();
            const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
            page = Math.min(page, totalPages);
            const slice = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
            body.replaceChildren();
            slice.forEach((record) => {
                const row = document.createElement('tr');
                [record.dataHora, record.usuario, record.modulo, record.acao, record.descricao, record.ip].forEach((value) => {
                    const cell = document.createElement('td');
                    cell.textContent = value || '—';
                    row.append(cell);
                });
                body.append(row);
            });
            if (!slice.length) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 6;
                cell.textContent = 'Nenhum registro encontrado.';
                row.append(cell);
                body.append(row);
            }
            renderPagination(totalPages);
        }

        filterButton?.addEventListener('click', () => {
            page = 1;
            render();
        });
        filters.forEach((select) => select.addEventListener('change', () => {
            page = 1;
            render();
        }));
        pagination.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-page]');
            if (!button || button.disabled) return;
            page = Number(button.dataset.page);
            render();
        });
        exportButton?.addEventListener('click', () => {
            downloadCsv(filtered());
            backend.addAudit({ modulo: 'Auditoria', acao: 'Exportação', descricao: 'Exportou o relatório de auditoria.' });
        });

        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
