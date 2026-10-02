/**
 * Conecta a página de boletim do aluno aos registros acadêmicos locais.
 * A estrutura da tabela continua sendo a existente no HTML.
 */
(() => {
    'use strict';

    function seedStaticReport(backend, table, studentName, bimestre, turma) {
        const key = `boletim-fixture|${studentName}|${bimestre}`;
        const existing = backend.getAcademicRecords();
        if (existing.some((record) => record.__seedKey === key)) return;

        const records = [];
        table.querySelectorAll('tbody > tr').forEach((row) => {
            const cells = [...row.cells];
            if (cells.length < 6) return;
            const badge = cells[5].textContent.trim();
            records.push({
                id: backend.buildAcademicId({
                    alunoNome: studentName,
                    turma,
                    disciplina: cells[0].textContent.trim(),
                    bimestre
                }),
                alunoId: `fixture-${backend.normalizeText(studentName).replace(/\s+/g, '-')}`,
                matricula: document.querySelector('.info-header')?.textContent.match(/Matrícula\s*:?\s*(\S+)/i)?.[1] ?? '',
                alunoNome: studentName,
                turma,
                disciplina: cells[0].textContent.trim(),
                bimestre,
                n1: backend.numberFrom(cells[1].textContent),
                n2: backend.numberFrom(cells[2].textContent),
                n3: backend.numberFrom(cells[3].textContent),
                media: backend.numberFrom(cells[4].textContent),
                situacao: badge,
                __seedKey: key,
                criadoEm: backend.nowIso(),
                atualizadoEm: backend.nowIso()
            });
        });

        if (records.length) backend.saveCollection(backend.keys.academico, [...existing, ...records]);
    }

    function render() {
        const backend = window.EduConnectBackend;
        if (!backend) return;
        const table = document.querySelector('.darkTable');
        const header = document.querySelector('.info-header');
        if (!table || !header) return;

        const headerText = header.textContent.replace(/\s+/g, ' ').trim();
        const studentName = headerText.match(/Aluno:\s*([^T]+?)\s+Turma:/i)?.[1]?.trim() ?? '';
        const turma = headerText.match(/Turma:\s*([^\n]+)/i)?.[1]?.trim() ?? '';
        const period = headerText.match(/Período:\s*(\d+[º°]?\s*Bimestre\s+\d{4})/i)?.[1]?.trim() ?? '';
        const bimestre = backend.extractBimestre(period);

        seedStaticReport(backend, table, studentName, bimestre, turma);

        const records = backend.getAcademicRecords().filter((record) =>
            backend.normalizeText(record.alunoNome) === backend.normalizeText(studentName)
            && backend.normalizeText(record.turma) === backend.normalizeText(turma)
        );

        if (!records.length) return;

        const byDiscipline = new Map();
        records.forEach((record) => {
            byDiscipline.set(backend.normalizeText(record.disciplina), record);
        });

        table.querySelectorAll('tbody > tr').forEach((row) => {
            const discipline = row.cells[0]?.textContent?.trim() ?? '';
            const record = byDiscipline.get(backend.normalizeText(discipline));
            if (!record) return;
            const cells = row.cells;
            cells[1].textContent = record.n1 == null ? '—' : backend.formatNumber(record.n1, 1);
            cells[2].textContent = record.n2 == null ? '—' : backend.formatNumber(record.n2, 1);
            cells[3].textContent = record.n3 == null ? '—' : backend.formatNumber(record.n3, 1);
            cells[4].textContent = record.media == null ? '—' : backend.formatNumber(record.media, 1);
            cells[5].textContent = record.situacao || 'Não definida';
        });

        const exportButton = [...document.querySelectorAll('button.btn')].find((item) => /exportar pdf/i.test(item.textContent));
        exportButton?.addEventListener('click', () => {
            backend.addAudit({ modulo: 'Boletins', acao: 'Exportação', descricao: `Solicitou impressão do boletim de ${studentName}.` });
            window.print();
        });
    }

    document.addEventListener('DOMContentLoaded', render);
})();
