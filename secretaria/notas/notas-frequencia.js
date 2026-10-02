/**
 * 1. Controla as consultas de notas e frequência com dados acadêmicos locais.
 */
(() => {
    'use strict';

    const STORAGE_KEY = 'educonnect_notas_frequencia';
    const backend = window.EduConnectBackend;
    const STUDENTS = [
        { matricula: '20240001', alunoNome: 'Amanda Costa Nogueira', n1: 8.5, n2: 7.0, n3: 9.0, aulasDadas: 40, presencas: 38 },
        { matricula: '20240002', alunoNome: 'Bruno Fernandes de Souza', n1: 5.5, n2: 6.0, n3: 4.5, aulasDadas: 40, presencas: 32 },
        { matricula: '20230142', alunoNome: 'Camila Rodrigues Pinheiro', n1: 9.0, n2: 9.5, n3: 10.0, aulasDadas: 40, presencas: 40 },
        { matricula: '20240003', alunoNome: 'Daniel Alves Mendes', n1: 4.0, n2: 3.5, n3: 5.0, aulasDadas: 40, presencas: 28 },
        { matricula: '20220311', alunoNome: 'Eduardo Silva Pereira', n1: 7.0, n2: 6.5, n3: 7.5, aulasDadas: 40, presencas: 36 },
        { matricula: '20240004', alunoNome: 'Fernanda Lima de Souza', n1: 6.0, n2: 5.0, n3: 6.5, aulasDadas: 40, presencas: 30 }
    ];

    /* 2. Mantém a chave exigida como fonte local e sincroniza com o backend, se disponível. */
    function readStoredRecords() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
            return Array.isArray(stored) ? stored : null;
        } catch (error) {
            console.error('Não foi possível ler os dados de notas e frequência.', error);
            return null;
        }
    }

    function saveRecords(records) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        } catch (error) {
            console.error('Não foi possível guardar os dados de notas e frequência.', error);
            window.alert('Não foi possível guardar os dados neste navegador.');
            return false;
        }

        records.forEach((record) => {
            backend?.upsertAcademicRecord?.({ ...record, situacao: record.situacaoNotas });
        });
        return true;
    }

    /* 3. Aplica médias e situações de acordo com as regras de cada fluxo. */
    function average(n1, n2, n3) {
        if (backend?.calculateAverage) return backend.calculateAverage(n1, n2, n3);
        const values = [n1, n2, n3].map(Number);
        if (values.some((value) => !Number.isFinite(value))) return null;
        return Math.round((values.reduce((sum, value) => sum + value, 0) / 3) * 10) / 10;
    }

    function gradeStatus(value) {
        if (value == null) return 'Não definida';
        if (value >= 7) return 'Aprovado';
        if (value >= 5) return 'Recuperação';
        return 'Reprovado';
    }

    function attendanceValues(classes, presences) {
        if (backend?.calculateFrequency) return backend.calculateFrequency(classes, presences);
        const aulasDadas = Number(classes);
        const presencas = Number(presences);
        if (!Number.isFinite(aulasDadas) || aulasDadas <= 0 || !Number.isFinite(presencas)) {
            return { aulasDadas, presencas, faltas: null, frequencia: null };
        }
        return {
            aulasDadas,
            presencas,
            faltas: Math.max(0, aulasDadas - presencas),
            frequencia: (presencas / aulasDadas) * 100
        };
    }

    function attendanceStatus(value) {
        if (value == null) return 'Não definida';
        if (value >= 85) return 'Regular';
        if (value >= 75) return 'Atenção';
        return 'Risco';
    }

    function calculateRecord(record) {
        const gradeAverage = average(record.n1, record.n2, record.n3);
        const attendance = attendanceValues(record.aulasDadas, record.presencas);
        return {
            ...record,
            media: gradeAverage,
            situacaoNotas: gradeStatus(gradeAverage),
            ...attendance,
            situacaoFrequencia: attendanceStatus(attendance.frequencia)
        };
    }

    /* 4. Cria os seis registros iniciais e reaproveita dados acadêmicos já existentes. */
    function createMockRecords() {
        const existing = backend?.getAcademicRecords?.() ?? [];
        const mockRecords = STUDENTS.map((student) => {
            const imported = existing.find((record) => record.matricula === student.matricula
                && record.turma === '3º Ano A'
                && record.disciplina === 'Matemática'
                && record.bimestre === '1º Bimestre');
            const record = {
                ...(imported ?? {}),
                ...student,
                id: backend?.buildAcademicId?.({
                    matricula: student.matricula,
                    turma: '3º Ano A',
                    disciplina: 'Matemática',
                    bimestre: '1º Bimestre'
                }) ?? `3-ano-a|${student.matricula}|matematica|1-bimestre`,
                turma: '3º Ano A',
                disciplina: 'Matemática',
                bimestre: '1º Bimestre'
            };
            return calculateRecord(record);
        });
        const existingRecords = existing
            .filter((record) => !(STUDENTS.some((student) => student.matricula === record.matricula)
                && record.turma === '3º Ano A'
                && record.disciplina === 'Matemática'
                && record.bimestre === '1º Bimestre'))
            .map((record) => calculateRecord(record));
        return [...mockRecords, ...existingRecords];
    }

    function loadRecords() {
        const stored = readStoredRecords();
        if (!stored?.length) {
            const records = createMockRecords();
            saveRecords(records);
            return records;
        }

        const records = stored.map(calculateRecord);
        const storedIds = new Set(records.map((record) => record.id));
        const newBackendRecords = (backend?.getAcademicRecords?.() ?? [])
            .filter((record) => !storedIds.has(record.id))
            .map((record) => calculateRecord(record));
        if (newBackendRecords.length) {
            records.push(...newBackendRecords);
            saveRecords(records);
        }
        return records;
    }

    /* 5. Prepara opções de filtros a partir dos registros persistidos. */
    function populateFilter(select, label, values) {
        if (!select) return;
        const current = select.value;
        select.replaceChildren(new Option(label, ''));
        [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
            .forEach((value) => select.add(new Option(value, value)));
        if (values.includes(current)) select.value = current;
        else select.value = values[0] ?? '';
    }

    /* 6. Formata exibição, cria badges e atualiza o resumo da turma. */
    function formatNumber(value, digits = 1) {
        if (!Number.isFinite(value)) return '—';
        return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }

    function statusClass(status) {
        if (status === 'Aprovado' || status === 'Regular') return 'aprovado';
        if (status === 'Recuperação' || status === 'Atenção') return 'recuperacao';
        if (status === 'Reprovado' || status === 'Risco') return 'reprovado';
        return '';
    }

    function setSummary(footer, labels, values) {
        if (!footer) return;
        const spans = footer.querySelectorAll('span');
        labels.forEach((label, index) => {
            const span = spans[index];
            if (!span) return;
            span.replaceChildren(document.createTextNode(`${label}: `));
            const strong = document.createElement('strong');
            strong.textContent = values[index];
            span.append(strong);
        });
    }

    /* 7. Renderiza a tabela ativa e recalcula os indicadores conforme os filtros. */
    function init() {
        const filters = [...document.querySelectorAll('.filtros-linha select')];
        const filterButton = document.querySelector('.btn-filtrar');
        const table = document.querySelector('.tabela');
        const body = table?.querySelector('tbody');
        const head = table?.querySelector('thead');
        const footer = document.querySelector('.tabela-footer');
        const tabs = [...document.querySelectorAll('.abas .aba')];
        if (filters.length < 3 || !table || !body || !head || tabs.length < 2) return;

        let records = loadRecords();
        const labels = ['Matrícula', 'Nome do Aluno', 'N1', 'N2', 'N3', 'Média', 'Situação'];
        populateFilter(filters[0], 'Turma: Todas', records.map((record) => record.turma));
        populateFilter(filters[1], 'Disciplina: Todas', records.map((record) => record.disciplina));
        populateFilter(filters[2], 'Bimestre: Todos', records.map((record) => record.bimestre));

        function activeFilters() {
            return records.filter((record) => (!filters[0].value || record.turma === filters[0].value)
                && (!filters[1].value || record.disciplina === filters[1].value)
                && (!filters[2].value || record.bimestre === filters[2].value));
        }

        function render(activeTab) {
            const filtered = activeFilters();
            const frequencyTab = activeTab === 'frequencia';
            const columns = frequencyTab
                ? ['Matrícula', 'Nome do Aluno', 'Aulas Dadas', 'Presenças', 'Faltas', '% Frequência', 'Situação']
                : labels;
            head.replaceChildren();
            const headerRow = document.createElement('tr');
            columns.forEach((label) => {
                const cell = document.createElement('th');
                cell.textContent = label;
                headerRow.append(cell);
            });
            head.append(headerRow);
            body.replaceChildren();

            filtered.forEach((record) => {
                const row = document.createElement('tr');
                const status = frequencyTab ? record.situacaoFrequencia : record.situacaoNotas;
                const values = frequencyTab
                    ? [record.matricula, record.alunoNome, record.aulasDadas, record.presencas, record.faltas, `${formatNumber(record.frequencia)}%`, status]
                    : [record.matricula, record.alunoNome, record.n1, record.n2, record.n3, formatNumber(record.media), status];
                values.forEach((value, index) => {
                    const cell = document.createElement('td');
                    if (index === 0 || (frequencyTab && index >= 2 && index <= 5) || (!frequencyTab && index === 5)) {
                        const strong = document.createElement('strong');
                        strong.textContent = String(value ?? '—');
                        cell.append(strong);
                    } else if (index === 6) {
                        const badge = document.createElement('span');
                        badge.className = `situacao ${statusClass(status)}`.trim();
                        badge.textContent = status;
                        cell.append(badge);
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
                cell.textContent = 'Nenhum registro encontrado para os filtros informados.';
                row.append(cell);
                body.append(row);
            }

            if (frequencyTab) {
                const valid = filtered.map((record) => record.frequencia).filter(Number.isFinite);
                const averageAttendance = valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
                const risks = filtered.filter((record) => record.situacaoFrequencia === 'Risco').length;
                setSummary(footer, ['Frequência Média da Turma', 'Alunos em Risco (< 75%)'], [averageAttendance == null ? '—' : `${formatNumber(averageAttendance)}%`, String(risks)]);
            } else {
                const valid = filtered.map((record) => record.media).filter(Number.isFinite);
                const classAverage = valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
                const approved = filtered.filter((record) => record.situacaoNotas === 'Aprovado').length;
                const rate = filtered.length ? (approved / filtered.length) * 100 : null;
                setSummary(footer, ['Média da Turma', 'Taxa de Aprovação'], [classAverage == null ? '—' : formatNumber(classAverage), rate == null ? '—' : `${formatNumber(rate, 0)}%`]);
            }
        }

        /* 8. Alterna abas sem recarregar e mantém os links como fallback de navegação. */
        let activeTab = window.location.pathname.includes('/frequencia/') ? 'frequencia' : 'notas';
        function setActiveTab(tab) {
            activeTab = tab;
            tabs.forEach((button) => {
                const active = button.dataset.tab === activeTab;
                button.classList.toggle('ativa', active);
                button.setAttribute('aria-selected', String(active));
                button.setAttribute('tabindex', active ? '0' : '-1');
            });
            render(activeTab);
        }

        tabs.forEach((tab) => {
            tab.setAttribute('role', 'tab');
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                setActiveTab(tab.dataset.tab);
            });
        });
        filterButton?.addEventListener('click', () => render(activeTab));
        filters.forEach((select) => select.addEventListener('change', () => render(activeTab)));
        setActiveTab(activeTab);
    }

    document.addEventListener('DOMContentLoaded', init);
})();