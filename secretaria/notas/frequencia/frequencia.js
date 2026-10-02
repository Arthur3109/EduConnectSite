/**
 * Controla a consulta de frequência da Secretaria usando os mesmos registros acadêmicos locais das notas.
 */
(() => {
    'use strict';

    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) return;

        const filters = [...document.querySelectorAll('.filtros-linha select')];
        const filterButton = document.querySelector('.btn-filtrar');
        const table = document.querySelector('.tabela');
        const body = table?.querySelector('tbody');
        const footer = document.querySelector('.tabela-footer');
        if (filters.length < 3 || !table || !body) return;

        const seedKey = 'secretaria-frequencia-fixture-1';
        backend.migrateStaticTableRows({
            table,
            key: seedKey,
            buildRecord: (row) => {
                const cells = [...row.cells];
                return {
                    id: backend.buildAcademicId({
                        matricula: cells[0]?.textContent?.trim(),
                        turma: '3º Ano A',
                        disciplina: 'Matemática',
                        bimestre: '1º Bimestre'
                    }),
                    matricula: cells[0]?.textContent?.trim() ?? '',
                    alunoNome: cells[1]?.textContent?.trim() ?? '',
                    turma: '3º Ano A',
                    disciplina: 'Matemática',
                    bimestre: '1º Bimestre',
                    aulasDadas: Number(cells[2]?.textContent?.trim()),
                    presencas: Number(cells[3]?.textContent?.trim()),
                    faltas: Number(cells[4]?.textContent?.trim()),
                    frequencia: backend.numberFrom(cells[5]?.textContent),
                    situacao: cells[6]?.textContent?.trim() ?? ''
                };
            }
        });

        const records = backend.getAcademicRecords().filter((record) => record.__seedKey === seedKey);
        function fillSelect(select, values) {
            const current = select.value || '';
            select.replaceChildren(...values.map((value) => new Option(value, value)));
            if (values.includes(current)) select.value = current;
        }

        fillSelect(filters[0], [...new Set(records.map((record) => record.turma).filter(Boolean))]);
        fillSelect(filters[1], [...new Set(records.map((record) => record.disciplina).filter(Boolean))]);
        fillSelect(filters[2], [...new Set(records.map((record) => record.bimestre).filter(Boolean))]);

        function render() {
            const turma = filters[0].value;
            const disciplina = filters[1].value;
            const bimestre = filters[2].value;
            const filtered = backend.getAcademicRecords().filter((record) =>
                backend.normalizeText(record.turma) === backend.normalizeText(turma)
                && backend.normalizeText(record.disciplina) === backend.normalizeText(disciplina)
                && backend.normalizeText(record.bimestre) === backend.normalizeText(bimestre)
                && (record.aulasDadas != null || record.frequencia != null)
            );

            body.replaceChildren();
            filtered.forEach((record) => {
                const row = document.createElement('tr');
                [
                    record.matricula,
                    record.alunoNome,
                    record.aulasDadas,
                    record.presencas,
                    record.faltas,
                    record.frequencia == null ? '—' : `${backend.formatNumber(record.frequencia, 1)}%`,
                    record.situacao || 'Não definida'
                ].forEach((value, index) => {
                    const cell = document.createElement('td');
                    if (index === 0 || index === 2 || index === 3 || index === 4 || index === 5) {
                        const strong = document.createElement('strong');
                        strong.textContent = String(value ?? '—');
                        cell.append(strong);
                    } else {
                        cell.textContent = String(value ?? '—');
                    }
                    row.append(cell);
                });
                body.append(row);
            });

            if (!filtered.length) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.textContent = 'Nenhum registro de frequência encontrado.';
                row.append(cell);
                body.append(row);
            }

            const percentages = filtered.map((record) => record.frequencia).filter(Number.isFinite);
            const average = percentages.length ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length : null;
            const risk = percentages.filter((value) => value < 75).length;
            if (footer) {
                const spans = footer.querySelectorAll('span');
                if (spans[0]) spans[0].innerHTML = `Frequência Média da Turma: <strong>${average == null ? '—' : backend.formatNumber(average, 0)}%</strong>`;
                if (spans[1]) spans[1].innerHTML = `Alunos em Risco (< 75%): <strong>${risk}</strong>`;
            }
        }

        filterButton?.addEventListener('click', render);
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
