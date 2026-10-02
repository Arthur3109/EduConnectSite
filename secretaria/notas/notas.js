/**
 * Controla a consulta de notas da Secretaria a partir dos registros acadêmicos locais.
 */
(() => {
    'use strict';

    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) return;

        const content = document.querySelector('.content');
        const filters = [...document.querySelectorAll('.filtros-linha select')];
        const filterButton = document.querySelector('.btn-filtrar');
        const table = document.querySelector('.tabela');
        const body = table?.querySelector('tbody');
        const footer = document.querySelector('.tabela-footer');
        if (!content || filters.length < 3 || !table || !body) return;

        const seedKey = 'secretaria-notas-fixture-1';
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
                    n1: backend.numberFrom(cells[2]?.textContent),
                    n2: backend.numberFrom(cells[3]?.textContent),
                    n3: backend.numberFrom(cells[4]?.textContent),
                    media: backend.numberFrom(cells[5]?.textContent),
                    situacao: cells[6]?.textContent?.trim() ?? ''
                };
            }
        });

        const seeded = backend.getAcademicRecords().filter((record) => record.__seedKey === seedKey);
        if (!seeded.length) return;

        const options = {
            turma: [...new Set(backend.getAcademicRecords().map((record) => record.turma).filter(Boolean))],
            disciplina: [...new Set(backend.getAcademicRecords().map((record) => record.disciplina).filter(Boolean))],
            bimestre: [...new Set(backend.getAcademicRecords().map((record) => record.bimestre).filter(Boolean))]
        };

        function fillSelect(select, values) {
            const current = select.value || select.options[0]?.value || '';
            select.replaceChildren(...values.map((value) => new Option(`\uFEFF${value}`.replace('\uFEFF', ''), value)));
            if (values.includes(current)) select.value = current;
        }

        fillSelect(filters[0], options.turma);
        fillSelect(filters[1], options.disciplina);
        fillSelect(filters[2], options.bimestre);

        function render() {
            const turma = filters[0].value;
            const disciplina = filters[1].value;
            const bimestre = filters[2].value;
            const records = backend.getAcademicRecords().filter((record) =>
                backend.normalizeText(record.turma) === backend.normalizeText(turma)
                && backend.normalizeText(record.disciplina) === backend.normalizeText(disciplina)
                && backend.normalizeText(record.bimestre) === backend.normalizeText(bimestre)
            );

            body.replaceChildren();
            records.forEach((record) => {
                const row = document.createElement('tr');
                const cells = [record.matricula, record.alunoNome, record.n1, record.n2, record.n3, record.media, record.situacao || 'Não definida'];
                cells.forEach((value, index) => {
                    const cell = document.createElement('td');
                    if (index === 0 || index === 5) {
                        const strong = document.createElement('strong');
                        strong.textContent = index === 5 && value != null ? backend.formatNumber(value, 1) : String(value ?? '—');
                        cell.append(strong);
                    } else {
                        cell.textContent = value == null ? '—' : (typeof value === 'number' ? backend.formatNumber(value, 1) : String(value));
                    }
                    row.append(cell);
                });
                body.append(row);
            });

            if (!records.length) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.textContent = 'Nenhum registro encontrado para os filtros informados.';
                row.append(cell);
                body.append(row);
            }

            const validAverages = records.map((record) => record.media).filter(Number.isFinite);
            const classAverage = validAverages.length
                ? validAverages.reduce((sum, value) => sum + value, 0) / validAverages.length
                : null;
            const approved = records.filter((record) => backend.normalizeText(record.situacao) === 'aprovado').length;
            if (footer) {
                const spans = footer.querySelectorAll('span');
                if (spans[0]) spans[0].innerHTML = `Média da Turma: <strong>${classAverage == null ? '—' : backend.formatNumber(classAverage, 1)}</strong>`;
                if (spans[1]) spans[1].innerHTML = `Taxa de Aprovação: <strong>${records.length ? backend.formatNumber((approved / records.length) * 100, 0) : '—'}%</strong>`;
            }
        }

        filterButton?.addEventListener('click', render);
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
