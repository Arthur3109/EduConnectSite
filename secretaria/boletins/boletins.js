/**
 * Monta boletins usando os registros acadêmicos compartilhados e conserva
 * relatórios gerados na chave já administrada pelo núcleo do EduConnect.
 */
(() => {
    'use strict';

    const STANDARD_TERMS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

    /**
     * Cria conteúdo como texto simples, pois os nomes e observações vêm do
     * localStorage e não devem ser interpretados como HTML.
     */
    function createText(tag, text, className = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = text ?? '';
        return element;
    }

    /**
     * Normaliza os contatos cadastrados historicamente com nomes de campo
     * diferentes, sem alterar os objetos persistidos dos estudantes.
     */
    function getStudentEmail(student) {
        return String(
            student.email
            ?? student.e_mail
            ?? student.emailContato
            ?? student.emailResponsavel
            ?? student.emailResponsavel1
            ?? ''
        ).trim();
    }

    /**
     * Ordena termos por seu ordinal e mantém textos não padronizados ao final.
     */
    function sortTerms(values) {
        return [...new Set(values.filter(Boolean))].sort((first, second) => {
            const firstNumber = Number(first.match(/[1-4]/)?.[0] ?? 9);
            const secondNumber = Number(second.match(/[1-4]/)?.[0] ?? 9);
            return firstNumber - secondNumber || first.localeCompare(second, 'pt-BR');
        });
    }

    /**
     * Calcula uma situação somente quando o registro acadêmico ainda não a
     * possui, preservando assim qualquer classificação salva pelo professor.
     */
    function getGradeStatus(record) {
        if (record.situacao) return record.situacao;
        if (record.media == null) return 'Não definida';
        if (record.media >= 7) return 'Aprovado';
        if (record.media >= 5) return 'Recuperação';
        return 'Reprovado';
    }

    /**
     * Converte os dados acadêmicos em uma linha do boletim sem depender de
     * valores de demonstração do HTML.
     */
    function createGradeRow(backend, record) {
        const row = document.createElement('tr');
        [
            record.disciplina || 'Disciplina não informada',
            record.n1,
            record.n2,
            record.n3,
            record.media,
            getGradeStatus(record)
        ].forEach((value, index) => {
            const cell = document.createElement('td');
            const display = value == null
                ? '—'
                : typeof value === 'number'
                    ? backend.formatNumber(value, 1)
                    : String(value);
            if (index === 0 || index === 4) {
                cell.append(createText('strong', display));
            } else if (index === 5) {
                cell.append(createText('span', display, 'badge-sit'));
            } else {
                cell.textContent = display;
            }
            row.append(cell);
        });
        return row;
    }

    /**
     * Monta a lista de alunos a partir do cadastro e também de registros
     * acadêmicos antigos que ainda não possuem vínculo ao cadastro principal.
     */
    function getStudentsForClass(backend, turma) {
        const students = backend.getStudents()
            .filter((student) => backend.normalizeText(student.turma) === backend.normalizeText(turma))
            .map((student) => ({
                key: student.codigo || student.uid || backend.normalizeText(student.nome),
                codigo: student.codigo,
                uid: student.uid,
                nome: student.nome,
                turma: student.turma,
                serie: student.serie,
                email: getStudentEmail(student)
            }));

        backend.getAcademicRecords()
            .filter((record) => backend.normalizeText(record.turma) === backend.normalizeText(turma))
            .forEach((record) => {
                const code = record.matricula || record.alunoId || '';
                const key = code || backend.normalizeText(record.alunoNome);
                if (!key || students.some((student) => student.key === key
                    || (code && student.codigo === code)
                    || backend.normalizeText(student.nome) === backend.normalizeText(record.alunoNome))) return;
                students.push({
                    key,
                    codigo: record.matricula || '',
                    nome: record.alunoNome || 'Aluno sem identificação',
                    turma: record.turma,
                    serie: record.serie || '',
                    email: ''
                });
            });

        return students.sort((first, second) => first.nome.localeCompare(second.nome, 'pt-BR'));
    }

    /**
     * Inicializa os filtros, a prévia, o histórico e as ações do boletim.
     */
    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) {
            console.error('EduConnect: o núcleo de persistência deve carregar antes de boletins.js.');
            return;
        }

        const turmaSelect = document.getElementById('boletim-turma');
        const serieSelect = document.getElementById('boletim-serie');
        const termSelect = document.getElementById('boletim-bimestre');
        const studentSelect = document.getElementById('boletim-aluno');
        const previewTableBody = document.getElementById('boletim-registros');
        const historyList = document.getElementById('lista-historico');
        const feedback = document.getElementById('boletim-feedback');
        const generateButton = document.querySelector('.btn-gerar');
        const previewHeading = document.querySelector('.subtitulo-secao');
        const previewEnrollment = document.getElementById('preview-matricula');
        const previewClass = document.getElementById('preview-turma');
        const footerAbsences = document.getElementById('preview-faltas');
        const footerFrequency = document.getElementById('preview-frequencia');

        if (!turmaSelect || !serieSelect || !termSelect || !studentSelect
            || !previewTableBody || !historyList) return;

        /**
         * Coloca opções válidas em um filtro e preserva a escolha somente
         * quando o valor ainda pertence às opções atuais.
         */
        function fillSelect(select, label, options, selectedValue = '') {
            select.replaceChildren(new Option(label, ''));
            options.forEach((option) => {
                select.add(new Option(option.label, option.value));
            });
            if (options.some((option) => option.value === selectedValue)) {
                select.value = selectedValue;
            } else if (options.length) {
                select.value = options[0].value;
            }
        }

        /**
         * Traduz turmas para séries quando há cadastro; códigos antigos de
         * turma continuam aceitos sem exigir migração dos registros.
         */
        function getSeriesForClass(turma) {
            const classRecord = backend.getClasses().find((item) =>
                backend.normalizeText(item.nome) === backend.normalizeText(turma)
                || backend.normalizeText(item.codigo) === backend.normalizeText(turma)
            );
            if (classRecord?.serie) return classRecord.serie;
            const student = backend.getStudents().find((item) =>
                backend.normalizeText(item.turma) === backend.normalizeText(turma) && item.serie
            );
            if (student?.serie) return student.serie;
            return turma.match(/^\s*\d+\s*º?\s*Ano/i)?.[0]?.trim() ?? '';
        }

        /**
         * Repovoa turma, série e bimestre a partir das duas fontes existentes,
         * priorizando sempre os registros acadêmicos compartilhados.
         */
        function populateFilters() {
            const records = backend.getAcademicRecords();
            const registeredClasses = backend.getClasses().map((item) => item.nome || item.codigo);
            const studentClasses = backend.getStudents().map((item) => item.turma);
            const classNames = [...new Set([
                ...records.map((record) => record.turma),
                ...registeredClasses,
                ...studentClasses
            ].filter(Boolean))].sort((first, second) => first.localeCompare(second, 'pt-BR'));
            const currentClass = turmaSelect.value;
            const currentSeries = serieSelect.value;
            const seriesNames = [...new Set([
                ...backend.getClasses().map((item) => item.serie),
                ...backend.getStudents().map((item) => item.serie),
                ...classNames.map(getSeriesForClass)
            ].filter(Boolean))].sort((first, second) => first.localeCompare(second, 'pt-BR'));
            const classOptions = classNames
                .filter((name) => !currentSeries || backend.normalizeText(getSeriesForClass(name)) === backend.normalizeText(currentSeries))
                .map((name) => ({ value: name, label: name }));

            fillSelect(serieSelect, 'Todas as séries', seriesNames.map((name) => ({ value: name, label: name })), currentSeries);
            fillSelect(turmaSelect, 'Selecione uma turma', classOptions, currentClass);
            fillSelect(termSelect, 'Selecione um bimestre',
                sortTerms([...STANDARD_TERMS, ...records.map((record) => record.bimestre)])
                    .map((term) => ({ value: term, label: term })),
                termSelect.value || '1º Bimestre');
            populateStudents();
        }

        /**
         * Recalcula a lista de estudantes da turma atual e preserva a seleção
         * enquanto ela continuar válida.
         */
        function populateStudents() {
            const students = getStudentsForClass(backend, turmaSelect.value);
            fillSelect(studentSelect, 'Selecione um aluno',
                students.map((student) => ({
                    value: student.key,
                    label: student.nome
                })),
                studentSelect.value);
        }

        /** Localiza cadastro ou registro acadêmico correspondente ao aluno escolhido. */
        function getSelectedStudent() {
            return getStudentsForClass(backend, turmaSelect.value)
                .find((student) => student.key === studentSelect.value) ?? null;
        }

        /**
         * Atualiza a prévia e os dados de frequência usando somente o aluno,
         * a turma e o bimestre selecionados.
         */
        function renderPreview() {
            const student = getSelectedStudent();
            const records = backend.getAcademicRecords().filter((record) =>
                backend.normalizeText(record.turma) === backend.normalizeText(turmaSelect.value)
                && backend.normalizeText(record.bimestre) === backend.normalizeText(termSelect.value)
                && (
                    (student?.codigo && record.matricula === student.codigo)
                    || (student?.uid && record.alunoId === student.uid)
                    || (student?.key && record.alunoId === student.key)
                    || backend.normalizeText(record.alunoNome) === backend.normalizeText(student?.nome)
                )
            );

            previewTableBody.replaceChildren();
            if (records.length) {
                records.forEach((record) => previewTableBody.append(createGradeRow(backend, record)));
            } else {
                const row = document.createElement('tr');
                const cell = createText('td', 'Nenhum registro acadêmico encontrado para esta seleção.');
                cell.colSpan = 6;
                row.append(cell);
                previewTableBody.append(row);
            }

            if (previewHeading) {
                previewHeading.textContent = `Visualização Prévia${student ? ` (${student.nome})` : ''}`;
            }
            if (previewEnrollment) {
                previewEnrollment.textContent = `Matrícula: ${student?.codigo || '—'}`;
            }
            if (previewClass) {
                const series = serieSelect.value;
                previewClass.textContent = `Turma: ${turmaSelect.value || '—'}${series ? ` - ${series}` : ''}`;
            }

            const absenceRecords = records.filter((record) => Number.isFinite(record.faltas));
            const totalAbsences = absenceRecords.reduce((sum, record) => sum + record.faltas, 0);
            const frequencies = records.map((record) => record.frequencia).filter(Number.isFinite);
            const attendance = frequencies.length
                ? frequencies.reduce((sum, value) => sum + value, 0) / frequencies.length
                : null;
            if (footerAbsences) {
                footerAbsences.replaceChildren(
                    document.createTextNode('Total de Faltas: '),
                    createText('strong', absenceRecords.length ? `${totalAbsences} Faltas` : '—')
                );
            }
            if (footerFrequency) {
                footerFrequency.replaceChildren(
                    document.createTextNode('Frequência: '),
                    createText('strong', attendance == null ? '—' : `${backend.formatNumber(attendance, 1)}%`)
                );
            }
        }

        /**
         * Renderiza o histórico persistido, sem reutilizar cartões estáticos de
         * demonstração como se fossem envios reais.
         */
        function renderHistory() {
            const reports = backend.getGeneratedReports().slice(0, 8);
            historyList.replaceChildren();
            if (!reports.length) {
                historyList.append(createText('p', 'Nenhum lote foi gerado ainda.', 'boletim-vazio'));
                return;
            }

            reports.forEach((report) => {
                const card = document.createElement('article');
                card.className = 'historico-card';
                const heading = document.createElement('div');
                heading.className = 'card-hist-topo';
                heading.append(
                    createText('strong', report.turma || 'Turma não informada'),
                    createText('span', report.status || 'Gerado', 'status-hist gerado')
                );
                const details = createText('p', report.bimestre || 'Bimestre não informado');
                const footer = document.createElement('div');
                footer.className = 'card-hist-rodape';
                footer.append(
                    createText('span', `${Number(report.quantidadeAlunos) || 0} Alunos`),
                    createText('time', `Gerado em: ${formatReportDate(report.criadoEm)}`, 'data-hist')
                );
                card.append(heading, details, footer);
                historyList.append(card);
            });
        }

        /** Exibe a data dos relatórios em formato local, tolerando dados antigos. */
        function formatReportDate(value) {
            if (!value) return 'Data não informada';
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
        }

        /**
         * Cria um lote com snapshots para cada estudante da turma; esse
         * histórico não altera as notas que continuam na coleção acadêmica.
         */
        function generateReports() {
            feedback.textContent = '';
            const turma = turmaSelect.value;
            const bimestre = termSelect.value;
            const students = getStudentsForClass(backend, turma);
            if (!turma || !students.length) {
                feedback.textContent = 'Selecione uma turma com alunos cadastrados ou com registros acadêmicos.';
                return;
            }

            const academic = backend.getAcademicRecords();
            const reportStudents = students.map((student) => ({
                alunoId: student.key,
                matricula: student.codigo,
                alunoNome: student.nome,
                registros: academic.filter((record) =>
                    backend.normalizeText(record.turma) === backend.normalizeText(turma)
                    && backend.normalizeText(record.bimestre) === backend.normalizeText(bimestre)
                    && (
                        (student.codigo && record.matricula === student.codigo)
                        || (student.uid && record.alunoId === student.uid)
                        || (student.key && record.alunoId === student.key)
                        || backend.normalizeText(record.alunoNome) === backend.normalizeText(student.nome)
                    )
                ).map((record) => ({
                    disciplina: record.disciplina,
                    n1: record.n1,
                    n2: record.n2,
                    n3: record.n3,
                    media: record.media,
                    faltas: record.faltas,
                    frequencia: record.frequencia,
                    situacao: getGradeStatus(record),
                    fechado: record.fechado
                }))
            }));
            const saved = backend.addGeneratedReport({
                turma,
                serie: serieSelect.value,
                bimestre,
                quantidadeAlunos: students.length,
                alunos: reportStudents
            });
            if (!saved) {
                feedback.textContent = 'Não foi possível gerar o lote. Verifique o armazenamento local.';
                return;
            }

            feedback.textContent = `Lote gerado para ${students.length} aluno(s).`;
            renderHistory();
        }

        /**
         * Encaminha a prévia do aluno selecionado ao cliente de e-mail padrão
         * com endereço cadastrado ou solicitado à Secretaria.
         */
        function sendByEmail() {
            feedback.textContent = '';
            const student = getSelectedStudent();
            if (!student) {
                feedback.textContent = 'Selecione um aluno antes de preparar o e-mail.';
                return;
            }

            const academic = backend.getAcademicRecords().filter((record) =>
                backend.normalizeText(record.turma) === backend.normalizeText(turmaSelect.value)
                && backend.normalizeText(record.bimestre) === backend.normalizeText(termSelect.value)
                && (
                    (student.codigo && record.matricula === student.codigo)
                    || (student.uid && record.alunoId === student.uid)
                    || (student.key && record.alunoId === student.key)
                    || backend.normalizeText(record.alunoNome) === backend.normalizeText(student.nome)
                )
            );
            if (!academic.length) {
                feedback.textContent = 'Não há dados acadêmicos para incluir no e-mail deste aluno.';
                return;
            }

            let email = student.email;
            if (!email) {
                email = window.prompt(`Informe o endereço de e-mail de ${student.nome}:`)?.trim() ?? '';
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                feedback.textContent = 'Informe um endereço de e-mail válido para preparar o envio.';
                return;
            }

            const lines = academic.map((record) => [
                record.disciplina || 'Disciplina não informada',
                `N1: ${record.n1 ?? '—'}`,
                `N2: ${record.n2 ?? '—'}`,
                `N3: ${record.n3 ?? '—'}`,
                `Média: ${record.media == null ? '—' : backend.formatNumber(record.media, 1)}`,
                `Situação: ${getGradeStatus(record)}`
            ].join(' | '));
            const subject = `Boletim escolar - ${student.nome} - ${termSelect.value}`;
            const body = [
                `Olá, ${student.nome}.`,
                '',
                `Segue a prévia do boletim da turma ${turmaSelect.value}, ${termSelect.value}:`,
                ...lines,
                '',
                'Este e-mail foi preparado pelo sistema EduConnect.'
            ].join('\n');

            backend.addAudit({
                modulo: 'Boletins',
                acao: 'Envio',
                descricao: `Preparou o boletim de ${student.nome} para envio por e-mail.`
            });
            window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }

        // Mudanças nos filtros atualizam tanto a seleção quanto a prévia exibida.
        serieSelect.addEventListener('change', () => {
            const classes = [...turmaSelect.options]
                .map((option) => option.value)
                .filter((name) => name && backend.normalizeText(getSeriesForClass(name)) === backend.normalizeText(serieSelect.value));
            const currentClass = turmaSelect.value;
            const records = backend.getAcademicRecords();
            const registeredClasses = backend.getClasses().map((item) => item.nome || item.codigo);
            const studentClasses = backend.getStudents().map((item) => item.turma);
            const allClasses = [...new Set([
                ...records.map((record) => record.turma),
                ...registeredClasses,
                ...studentClasses
            ].filter(Boolean))];
            const options = allClasses
                .filter((name) => !serieSelect.value || backend.normalizeText(getSeriesForClass(name)) === backend.normalizeText(serieSelect.value))
                .map((name) => ({ value: name, label: name }));
            fillSelect(turmaSelect, 'Selecione uma turma', options, classes.includes(currentClass) ? currentClass : '');
            populateStudents();
            renderPreview();
        });
        turmaSelect.addEventListener('change', () => {
            populateStudents();
            renderPreview();
        });
        termSelect.addEventListener('change', renderPreview);
        studentSelect.addEventListener('change', renderPreview);
        generateButton?.addEventListener('click', generateReports);

        document.querySelectorAll('.btn-acao').forEach((button) => {
            const label = backend.normalizeText(button.textContent);
            button.addEventListener('click', () => {
                if (label.includes('imprimir')) {
                    backend.addAudit({
                        modulo: 'Boletins',
                        acao: 'Impressão',
                        descricao: `Imprimiu o boletim de ${getSelectedStudent()?.nome || 'aluno selecionado'}.`
                    });
                    window.print();
                } else if (label.includes('exportar')) {
                    backend.addAudit({
                        modulo: 'Boletins',
                        acao: 'Exportação',
                        descricao: `Exportou o boletim de ${getSelectedStudent()?.nome || 'aluno selecionado'} para PDF.`
                    });
                    window.print();
                } else if (label.includes('e-mail')) {
                    sendByEmail();
                }
            });
        });

        // Opções dos filtros são reconstruídas a partir dos registros atuais,
        // inclusive quando notas são alteradas em outra página do sistema.
        populateFilters();
        renderPreview();
        renderHistory();
        window.addEventListener(backend.eventName, (event) => {
            if (event.detail?.key === backend.keys.academico) {
                const currentClass = turmaSelect.value;
                const currentTerm = termSelect.value;
                populateFilters();
                if (currentClass) turmaSelect.value = currentClass;
                if (currentTerm) termSelect.value = currentTerm;
                populateStudents();
                renderPreview();
            }
            if (event.detail?.key === backend.keys.boletins) renderHistory();
        });
        window.addEventListener('storage', (event) => {
            if (event.key === backend.keys.academico || event.key === backend.keys.boletins) {
                populateFilters();
                populateStudents();
                renderPreview();
                renderHistory();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
