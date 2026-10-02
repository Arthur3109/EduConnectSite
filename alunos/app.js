/**
 * Alimenta o painel do aluno com dados persistidos quando disponíveis.
 * Quando o protótipo ainda não possui vínculo acadêmico, preserva os valores presentes no HTML como referência inicial.
 */
(() => {
    'use strict';

    function readStaticStudent(elements) {
        const name = elements.card?.textContent?.match(/^([^•]+)•/)?.[1]?.trim() ?? '';
        const turma = elements.card?.textContent?.match(/Turma\s*([^\n]+)/i)?.[1]?.trim() ?? '';
        const values = [...document.querySelectorAll('.stat-value')].map((item) => item.textContent.trim());
        return {
            uid: `fixture-${window.EduConnectBackend.normalizeText(name).replace(/\s+/g, '-')}`,
            codigo: '',
            nome: name,
            turma,
            serie: '',
            status: 'Ativo',
            __fixture: true,
            __static: {
                maiorNota: window.EduConnectBackend.numberFrom(values[0]),
                faltas: window.EduConnectBackend.numberFrom(values[1]),
                disciplinas: window.EduConnectBackend.numberFrom(values[2])
            }
        };
    }

    function update() {
        const backend = window.EduConnectBackend;
        if (!backend) return;
        const card = document.querySelector('.student-card');
        const stats = [...document.querySelectorAll('.stat-box')];
        if (!card || stats.length < 3) return;

        const studentFromStore = backend.getStudents().find((student) =>
            backend.normalizeText(card.textContent).includes(backend.normalizeText(student.nome))
        );
        const fixture = readStaticStudent({ card });
        const student = studentFromStore || fixture;

        if (!studentFromStore) backend.setCurrentStudent(student);

        const academic = backend.getAcademicRecords().filter((record) =>
            (student.codigo && record.matricula === student.codigo) ||
            (student.uid && record.alunoId === student.uid) ||
            backend.normalizeText(record.alunoNome) === backend.normalizeText(student.nome)
        );

        const grades = academic.map((record) => record.media).filter(Number.isFinite);
        const absences = academic.reduce((sum, record) => sum + (Number(record.faltas) || 0), 0);
        const disciplines = new Set(academic.map((record) => record.disciplina).filter(Boolean));

        const maiorNota = grades.length ? Math.max(...grades) : fixture.__static.maiorNota;
        const faltas = academic.length ? absences : fixture.__static.faltas;
        const quantidadeDisciplinas = disciplines.size || fixture.__static.disciplinas;

        stats[0].querySelector('.stat-value').textContent = backend.formatNumber(maiorNota, 1);
        stats[1].querySelector('.stat-value').textContent = Number.isFinite(faltas) ? String(faltas) : '—';
        stats[2].querySelector('.stat-value').textContent = Number.isFinite(quantidadeDisciplinas)
            ? String(quantidadeDisciplinas)
            : '—';

        const button = [...document.querySelectorAll('button.btn')]
            .find((item) => /boletim completo/i.test(item.textContent));
        button?.addEventListener('click', () => {
            window.location.href = 'boletim/index.html';
        }, { once: true });
    }

    document.addEventListener('DOMContentLoaded', update);
})();
