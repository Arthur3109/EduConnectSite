/**
 * Gera a visualização de boletins a partir dos registros acadêmicos locais e controla as ações de impressão/exportação.
 */
(() => {
    'use strict';

    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) return;

        const selects = [...document.querySelectorAll('.painel-filtros select')];
        const generateButton = document.querySelector('.btn-gerar');
        const preview = document.querySelector('.boletim-preview');
        const previewTable = document.querySelector('.tabela-preview');
        const history = document.querySelectorAll('.historico-card');
        if (selects.length < 3 || !preview || !previewTable) return;

        function getFixture() {
            const rows = [...previewTable.querySelectorAll('tbody > tr')];
            const header = preview.querySelector('.preview-info-aluno')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
            const heading = document.querySelector('.subtitulo-secao');
            const studentName = heading?.textContent?.match(/Visualização Prévia\s*\(([^)]+)\)/i)?.[1]?.trim() ?? '';
            const turma = header.match(/Turma:\s*(.+)$/i)?.[1]?.trim() ?? '';
            return { rows, studentName, turma };
        }

        function render() {
            const turma = selects[0].value;
            const bimestre = backend.extractBimestre(selects[2].value);
            const fixture = getFixture();
            const studentName = fixture.studentName;
            const records = backend.getAcademicRecords().filter((record) =>
                backend.normalizeText(record.alunoNome) === backend.normalizeText(studentName)
                && backend.normalizeText(record.turma) === backend.normalizeText(turma)
            );

            const body = previewTable.querySelector('tbody');
            if (!body) return;
            body.replaceChildren();

            if (!records.length && fixture.rows.length) {
                fixture.rows.forEach((row) => body.append(row.cloneNode(true)));
            } else {
                records.forEach((record) => {
                    const row = document.createElement('tr');
                    [record.disciplina, record.n1, record.n2, record.n3, record.media, record.situacao || 'Não definida'].forEach((value, index) => {
                        const cell = document.createElement('td');
                        cell.textContent = value == null ? '—' : (typeof value === 'number' ? backend.formatNumber(value, 1) : String(value));
                        if ([0, 4].includes(index)) {
                            const strong = document.createElement('strong');
                            strong.textContent = cell.textContent;
                            cell.replaceChildren(strong);
                        }
                        row.append(cell);
                    });
                    body.append(row);
                });
            }

            const visibleRecords = backend.getAcademicRecords().filter((record) =>
                backend.normalizeText(record.alunoNome) === backend.normalizeText(studentName)
                && backend.normalizeText(record.turma) === backend.normalizeText(turma)
                && (!bimestre || backend.normalizeText(record.bimestre) === backend.normalizeText(bimestre))
            );
            const totalFaltas = visibleRecords.reduce((sum, record) => sum + (Number(record.faltas) || 0), 0);
            const freqs = visibleRecords.map((record) => record.frequencia).filter(Number.isFinite);
            const frequency = freqs.length ? freqs.reduce((sum, value) => sum + value, 0) / freqs.length : null;
            const footer = preview.querySelector('.preview-rodape');
            if (footer) {
                const spans = footer.querySelectorAll('span');
                if (spans[0]) spans[0].innerHTML = `Total de Faltas: <strong>${totalFaltas}</strong> Faltas`;
                if (spans[1]) spans[1].innerHTML = `Frequência Acumulada: <strong>${frequency == null ? '—' : backend.formatNumber(frequency, 1)}%</strong>`;
            }
        }

        generateButton?.addEventListener('click', () => {
            const turma = selects[0].value;
            const bimestre = backend.extractBimestre(selects[2].value);
            backend.addGeneratedReport({
                turma,
                serie: selects[1].value,
                bimestre,
                quantidadeAlunos: backend.getStudents().filter((student) => backend.normalizeText(student.turma) === backend.normalizeText(turma)).length
            });
            render();
        });

        const actionButtons = [...document.querySelectorAll('.btn-acao')];
        actionButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const label = backend.normalizeText(button.textContent);
                if (label.includes('imprimir')) {
                    backend.addAudit({ modulo: 'Boletins', acao: 'Impressão', descricao: 'Imprimiu lote de boletins.' });
                    window.print();
                } else if (label.includes('exportar')) {
                    backend.addAudit({ modulo: 'Boletins', acao: 'Exportação', descricao: 'Abriu impressão para salvar o boletim em PDF.' });
                    window.print();
                } else if (label.includes('e-mail')) {
                    backend.addAudit({ modulo: 'Boletins', acao: 'Envio', descricao: 'Solicitou envio de boletins por e-mail.' });
                    window.location.href = 'mailto:?subject=Boletim Escolar EduConnect';
                }
            });
        });

        history.forEach((card) => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const text = card.textContent.replace(/\s+/g, ' ').trim();
                const turma = text.match(/^(\S[^0-9]+?)\s+Gerado|^(\S[^0-9]+?)\s+Pendente/)?.[1]?.trim();
                const option = [...selects[0].options].find((item) => backend.normalizeText(item.value) === backend.normalizeText(turma ?? ''));
                if (option) selects[0].value = option.value;
                render();
            });
        });

        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
