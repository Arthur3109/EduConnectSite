/**
 * Torna o Dashboard da Secretaria dinâmico sem alterar o HTML existente.
 * Os números vêm das coleções locais quando elas existem; os valores do protótipo são mantidos como fallback visual.
 */
(() => {
    'use strict';

    function findCardValue(card) {
        return card?.querySelector('.valor, .numero, strong, h1, h3, p:not(:first-child)');
    }

    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) return;

        const table = document.querySelector('.tabela');

        const cards = [...document.querySelectorAll('.cards .card')];
        if (cards.length < 4) return;

        const students = backend.getStudents();
        const teachers = backend.getTeachers().filter((item) => item.status !== 'Inativo');
        const classes = backend.getClasses().filter((item) => item.ativa !== false);
        const pendingOccurrences = backend.getOccurrences().filter((item) =>
            ['aberta', 'pendente'].includes(backend.normalizeText(item.status))
        );

        const values = [
            students.length,
            teachers.length,
            classes.length,
            pendingOccurrences.length
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
