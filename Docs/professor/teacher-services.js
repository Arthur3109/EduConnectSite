/**
 * Reúne os serviços específicos do Professor: formulários, navegação por abas
 * e leitura dos comunicados publicados pela Secretaria.
 */
(() => {
    'use strict';

    const ATESTADOS_KEY = 'educonnect_atestados';
    const MAX_PDF_SIZE = 2 * 1024 * 1024;
    const backend = window.EduConnectBackend;

    /**
     * Cria elementos de texto com textContent para que registros armazenados
     * nunca sejam interpretados como HTML.
     */
    function textElement(tag, className, value) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = value ?? '';
        return element;
    }

    /**
     * Usa o nome do ator somente quando a identidade armazenada é de Professor;
     * assim, uma sessão previamente usada como aluno não aparece como docente.
     */
    function getProfessor() {
        const actor = backend.getCurrentActor();
        const isTeacher = backend.normalizeText(actor?.tipo).includes('professor');
        return {
            uid: isTeacher ? String(actor.uid ?? '') : '',
            nome: isTeacher && actor.nome ? String(actor.nome).trim() : 'Professor'
        };
    }

    /**
     * Exibe datas ISO ou textos antigos sem alterar o formato persistido.
     */
    function formatDate(value) {
        if (!value) return 'Data não informada';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(date);
    }

    /**
     * Trata "Todos" e listas antigas em texto, mantendo apenas avisos enviados
     * explicitamente aos professores ou a toda a comunidade escolar.
     */
    function isForTeachers(record) {
        const recipients = Array.isArray(record.destinatarios)
            ? record.destinatarios
            : String(record.destinatarios ?? '').split(',');
        return recipients.some((recipient) => {
            const normalized = backend.normalizeText(recipient);
            return normalized === 'todos' || normalized === 'professores' || normalized === 'professor';
        });
    }

    /**
     * Renderiza somente comunicados enviados, em ordem cronológica decrescente,
     * e informa claramente quando a Secretaria ainda não publicou avisos.
     */
    function renderCommunications() {
        const list = document.getElementById('comunicados-list');
        const count = document.getElementById('comunicados-count');
        if (!list || !count) return;

        const records = backend.getCommunications()
            .filter((record) =>
                record
                && typeof record === 'object'
                && backend.normalizeText(record.status) === 'enviado'
                && isForTeachers(record)
            )
            .sort((first, second) =>
                String(second.enviadoEm || second.criadoEm || '')
                    .localeCompare(String(first.enviadoEm || first.criadoEm || ''))
            );

        list.replaceChildren();
        count.textContent = `${records.length} ${records.length === 1 ? 'comunicado' : 'comunicados'}`;
        if (!records.length) {
            list.append(textElement('p', 'empty-state',
                'Ainda não há comunicados enviados para os professores.'));
            return;
        }

        records.forEach((record) => {
            const article = document.createElement('article');
            article.className = 'teacher-communication';

            const metadata = document.createElement('div');
            metadata.className = 'teacher-communication__meta';
            metadata.append(
                textElement('span', 'teacher-communication__type', record.tipo || 'Informativo'),
                textElement('time', '', formatDate(record.enviadoEm || record.criadoEm))
            );
            article.append(
                metadata,
                textElement('h2', '', record.titulo || 'Comunicado'),
                textElement('p', '', record.texto || '')
            );
            list.append(article);
        });
    }

    /**
     * Mantém as páginas das abas exclusivas e sincroniza o item ativo do menu
     * com o fragmento da URL, permitindo também compartilhar links da aba.
     */
    function setupViews() {
        const links = [...document.querySelectorAll('[data-view]')];
        const panels = [...document.querySelectorAll('[data-view-panel]')];

        function showView(viewName) {
            const view = panels.some((panel) => panel.dataset.viewPanel === viewName)
                ? viewName
                : 'dashboard';
            panels.forEach((panel) => {
                panel.hidden = panel.dataset.viewPanel !== view;
            });
            links.forEach((link) => {
                const active = link.dataset.view === view;
                link.closest('li')?.classList.toggle('ativo', active);
                if (active) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
            if (view === 'comunicados') renderCommunications();
        }

        links.forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const view = link.dataset.view;
                history.replaceState(null, '', `#${view}`);
                showView(view);
            });
        });

        window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
        const initialView = location.hash.slice(1);
        showView(initialView);
    }

    /**
     * Preenche a seleção com as turmas que aparecem na tabela, mantendo os
     * rótulos e a sequência já apresentada ao professor no painel.
     */
    function populateClasses() {
        const select = document.getElementById('ocorrencia-turma');
        const rows = [...document.querySelectorAll('.darkTable tbody tr')];
        if (!select) return;

        const classes = [...new Set(rows.map((row) => row.cells[0]?.textContent.trim()).filter(Boolean))];
        classes.forEach((className) => select.add(new Option(className, className)));
    }

    /**
     * Liga os controles de abertura e fechamento aos diálogos nativos. O
     * navegador conserva o gerenciamento de foco e o fechamento com Escape.
     */
    function setupDialogs() {
        document.querySelectorAll('[data-open-dialog]').forEach((button) => {
            button.addEventListener('click', () => {
                const dialog = document.getElementById(button.dataset.openDialog);
                if (!dialog) return;

                if (dialog.id === 'ocorrencia-dialog') {
                    const row = button.closest('tr');
                    const className = row?.cells[0]?.textContent.trim() ?? '';
                    const classSelect = document.getElementById('ocorrencia-turma');
                    if (classSelect) classSelect.value = className;
                    const feedback = document.getElementById('ocorrencia-feedback');
                    if (feedback) feedback.textContent = '';
                }
                if (dialog.id === 'atestado-dialog') {
                    const feedback = document.getElementById('atestado-feedback');
                    if (feedback) feedback.textContent = '';
                }

                dialog.showModal();
                dialog.querySelector('input, select, textarea')?.focus();
            });
        });

        document.querySelectorAll('[data-close-dialog]').forEach((button) => {
            button.addEventListener('click', () => button.closest('dialog')?.close());
        });
    }

    /**
     * Lê o arquivo selecionado para serialização em localStorage, rejeitando
     * anexos que excedem o limite de tamanho do formulário.
     */
    function readPdf(file) {
        if (file.size > MAX_PDF_SIZE) {
            return Promise.reject(new Error('O arquivo PDF deve ter no máximo 2 MB.'));
        }
        if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) {
            return Promise.reject(new Error('Selecione um arquivo PDF válido.'));
        }

        return file.slice(0, 5).text().then((signature) => {
            if (signature !== '%PDF-') {
                throw new Error('O arquivo selecionado não possui uma assinatura PDF válida.');
            }
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    if (typeof reader.result === 'string') resolve(reader.result);
                    else reject(new Error('O navegador não conseguiu preparar o PDF.'));
                });
                reader.addEventListener('error', () => {
                    reject(reader.error || new Error('Não foi possível ler o PDF.'));
                });
                reader.addEventListener('abort', () => reject(new Error('A leitura do PDF foi cancelada.')));
                reader.readAsDataURL(file);
            });
        });
    }

    /**
     * Salva a justificativa na chave de atestados já utilizada pelo painel do
     * aluno, sem substituir registros existentes nem modificar outras chaves.
     */
    function setupAtestadoForm() {
        const form = document.getElementById('atestado-form');
        const feedback = document.getElementById('atestado-feedback');
        if (!form || !feedback) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            feedback.textContent = '';
            const values = Object.fromEntries(new FormData(form).entries());
            if (values.dataFim < values.dataInicio) {
                feedback.textContent = 'A data de término não pode ser anterior à data de início.';
                form.elements.dataFim.focus();
                return;
            }

            const professor = getProfessor();
            const record = {
                id: backend.createId('atestado'),
                tipo: 'professor',
                professorId: professor.uid || null,
                professorNome: professor.nome,
                motivo: String(values.motivo).trim(),
                dataInicio: String(values.dataInicio),
                dataFim: String(values.dataFim),
                observacoes: String(values.observacoes ?? '').trim(),
                status: 'Enviado',
                criadoEm: backend.nowIso()
            };

            const file = form.elements.atestadoPdf.files?.[0];
            if (file) {
                try {
                    record.anexo = {
                        nome: file.name,
                        tipo: 'application/pdf',
                        tamanho: file.size,
                        conteudo: await readPdf(file)
                    };
                } catch (error) {
                    console.error('Não foi possível validar ou ler o PDF do atestado.', error);
                    feedback.textContent = error.message;
                    return;
                }
            }

            const existing = backend.readArray(ATESTADOS_KEY);
            if (!backend.write(ATESTADOS_KEY, [record, ...existing])) {
                feedback.textContent = 'Não foi possível salvar o atestado neste navegador.';
                return;
            }

            form.reset();
            document.getElementById('atestado-dialog')?.close();
        });
    }

    /**
     * Confere o aluno cadastrado para associar matrícula e identificador, se
     * disponíveis, antes de gravar a ocorrência pelo núcleo compartilhado.
     */
    function setupOccurrenceForm() {
        const form = document.getElementById('ocorrencia-form');
        const feedback = document.getElementById('ocorrencia-feedback');
        if (!form || !feedback) return;

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            const values = Object.fromEntries(new FormData(form).entries());
            const studentName = String(values.aluno).trim();
            const student = backend.getStudents().find((item) =>
                backend.normalizeText(item.nome) === backend.normalizeText(studentName)
            );
            const professor = getProfessor();
            const record = backend.addOccurrence({
                aluno: studentName,
                alunoId: student?.uid ?? '',
                matricula: student?.codigo ?? '',
                turma: String(values.turma ?? '').trim(),
                tipo: String(values.tipo),
                gravidade: String(values.gravidade),
                descricao: String(values.descricao).trim(),
                autor: professor.nome,
                status: 'Aberta'
            });

            if (!record) {
                feedback.textContent = 'A ocorrência não foi salva. Verifique o armazenamento e tente novamente.';
                return;
            }

            form.reset();
            document.getElementById('ocorrencia-dialog')?.close();
            renderOccurrenceCount();
        });
    }

    /** Atualiza o indicador da dashboard com o total da coleção compartilhada. */
    function renderOccurrenceCount() {
        const target = document.getElementById('occurrences-total');
        if (target) target.textContent = String(backend.getOccurrences().length);
    }

    /**
     * Atualiza comunicados e ocorrências após alterações do núcleo na mesma aba
     * ou em outra janela do navegador.
     */
    function setupStorageUpdates() {
        window.addEventListener(backend.eventName, (event) => {
            if (event.detail?.key === backend.keys.comunicados) renderCommunications();
            if (event.detail?.key === backend.keys.ocorrencias) renderOccurrenceCount();
        });
        window.addEventListener('storage', (event) => {
            if (event.key === backend.keys.comunicados) renderCommunications();
            if (event.key === backend.keys.ocorrencias) renderOccurrenceCount();
        });
    }

    /** Inicializa cada serviço somente depois que os elementos da página existem. */
    function init() {
        if (!backend) {
            console.error('EduConnect: o núcleo de persistência não foi carregado para a área do Professor.');
            return;
        }

        const professor = getProfessor();
        const name = document.getElementById('professor-name');
        if (name) name.textContent = professor.nome;

        populateClasses();
        setupViews();
        setupDialogs();
        setupAtestadoForm();
        setupOccurrenceForm();
        setupStorageUpdates();
        renderOccurrenceCount();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
