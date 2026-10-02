/**
 * Torna o Dashboard da Secretaria dinâmico sem alterar o HTML existente.
 * Os números vêm das coleções locais quando elas existem; os valores do protótipo são mantidos como fallback visual.
 */
(() => {
    'use strict';

    function findCardValue(card) {
        return card?.querySelector('.valor, .numero, strong, h2, h3, p:not(:first-child)');
    }

    function seedActivities(backend, table) {
        const key = 'dashboard-fixture-2026';
        const existing = backend.getAudit();
        if (existing.some((record) => record.__seedKey === key)) return;

        const rows = [...(table?.querySelectorAll('tbody > tr') ?? [])];
        const seed = rows.map((row) => {
            const cells = [...row.cells];
            const status = cells[3]?.textContent?.trim() ?? '';
            return {
                id: backend.createId('dashboard-audit'),
                dataHora: backend.nowIso(),
                usuario: cells[2]?.textContent?.trim() ?? 'Sistema',
                modulo: 'Dashboard',
                acao: status,
                descricao: cells[1]?.textContent?.trim() ?? '',
                ip: 'protótipo',
                __seedKey: key
            };
        });
        if (seed.length) backend.saveAudit([...existing, ...seed]);
    }

    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) return;

        const table = document.querySelector('.tabela');
        seedActivities(backend, table);

        const cards = [...document.querySelectorAll('.cards .card')];
        if (cards.length < 4) return;

        const students = backend.getStudents();
        const teachers = backend.getTeachers().filter((item) => item.status !== 'Inativo');
        const classes = backend.getClasses().filter((item) => item.ativa !== false);
        const pendingOccurrences = backend.getOccurrences().filter((item) => backend.normalizeText(item.status) === 'aberta');

        const staticValues = cards.map((card) => findCardValue(card)?.textContent?.trim() ?? '0');
        const values = [
            students.length ? students.length : staticValues[0],
            teachers.length ? teachers.length : staticValues[1],
            classes.length ? classes.length : staticValues[2],
            backend.getOccurrences().length ? pendingOccurrences.length : staticValues[3]
        ];

        values.forEach((value, index) => {
            const target = findCardValue(cards[index]);
            if (target) target.textContent = String(value);
        });

        const audit = backend.getAudit().slice(0, 5);
        if (table && audit.length) {
            const body = table.querySelector('tbody');
            body?.replaceChildren(...audit.map((entry) => {
                const row = document.createElement('tr');
                const date = new Date(entry.dataHora);
                const dateText = Number.isNaN(date.getTime()) ? entry.dataHora : date.toLocaleString('pt-BR');
                [dateText, entry.descricao, entry.usuario, entry.acao].forEach((text) => {
                    const cell = document.createElement('td');
                    cell.textContent = text;
                    row.append(cell);
                });
                return row;
            }));
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
