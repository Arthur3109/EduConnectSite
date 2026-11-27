(() => {
    'use strict';

    const backend = window.EduConnectBackend;
    const MAX_PDF_SIZE = 2 * 1024 * 1024;
    const normalize = (value) => backend.normalizeText(value);

    function showFeedback(element, message, isError = false) {
        element.textContent = message;
        element.classList.toggle('form-feedback--error', isError);
    }

    function readPdf(file) {
        if (file.size > MAX_PDF_SIZE) {
            return Promise.reject(new Error('O PDF deve ter no máximo 2 MB.'));
        }
        if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) {
            return Promise.reject(new Error('Selecione um arquivo PDF válido.'));
        }
        return file.slice(0, 5).text().then((signature) => {
            if (signature !== '%PDF-') throw new Error('O arquivo não possui uma assinatura PDF válida.');
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    if (typeof reader.result === 'string') resolve(reader.result);
                    else reject(new Error('Não foi possível ler o PDF.'));
                });
                reader.addEventListener('error', () => reject(reader.error || new Error('Não foi possível ler o PDF.')));
                reader.readAsDataURL(file);
            });
        });
    }

    function init() {
        if (!backend) {
            console.error('EduConnect: o núcleo de persistência não foi carregado para a área do Professor.');
            return;
        }

        const actor = backend.getCurrentActor();
        const professorName = actor.tipo === 'professor' ? actor.nome : 'Caio Silva';
        const name = document.getElementById('professor-name');
        if (name) name.textContent = professorName;

        const classSelect = document.getElementById('ocorrencia-turma');
        const studentSelect = document.getElementById('ocorrencia-aluno');
        const occurrenceForm = document.getElementById('ocorrencia-form');
        const occurrenceFeedback = document.getElementById('ocorrencia-feedback');
        const attestationForm = document.getElementById('atestado-form');
        const attestationFeedback = document.getElementById('atestado-feedback');
        const pdfInput = document.getElementById('atestado-pdf');
        const pdfName = document.getElementById('atestado-file-name');
        const occurrenceTotal = document.getElementById('occurrences-total');

        const classes = [...new Set(backend.getStudents().map((student) => student.turma).filter(Boolean))];
        classes.forEach((className) => classSelect?.add(new Option(className, className)));

        function populateStudents() {
            if (!studentSelect) return;
            const selectedClass = classSelect?.value ?? '';
            const students = backend.getStudents().filter((student) =>
                !selectedClass || normalize(student.turma) === normalize(selectedClass)
            );
            const currentValue = studentSelect.value;
            studentSelect.replaceChildren(new Option('Selecione um aluno', ''));
            students.forEach((student) => {
                const option = new Option(`${student.nome} — ${student.codigo}`, student.codigo);
                studentSelect.add(option);
            });
            if (students.some((student) => student.codigo === currentValue)) studentSelect.value = currentValue;
        }

        classSelect?.addEventListener('change', populateStudents);
        populateStudents();

        function updateOccurrenceTotal() {
            if (occurrenceTotal) occurrenceTotal.textContent = String(backend.getOccurrences().length);
        }

        document.querySelectorAll('[data-open-dialog="ocorrencia-dialog"]').forEach((button) => {
            button.addEventListener('click', () => {
                const row = button.closest('tr');
                const className = row?.cells[0]?.textContent.trim() ?? '';
                if (classSelect && classes.includes(className)) classSelect.value = className;
                populateStudents();
                if (occurrenceFeedback) showFeedback(occurrenceFeedback, '');
                document.getElementById('ocorrencia-dialog')?.showModal();
            });
        });

        document.querySelectorAll('[data-open-dialog="atestado-dialog"]').forEach((button) => {
            button.addEventListener('click', () => {
                if (attestationFeedback) showFeedback(attestationFeedback, '');
                document.getElementById('atestado-dialog')?.showModal();
            });
        });

        let selectedPdf = null;
        pdfInput?.addEventListener('change', async () => {
            selectedPdf = null;
            if (pdfName) pdfName.textContent = 'Nenhum arquivo selecionado.';
            const file = pdfInput.files?.[0];
            if (!file) return;
            try {
                await readPdf(file);
                selectedPdf = file;
                if (pdfName) pdfName.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
            } catch (error) {
                pdfInput.value = '';
                if (attestationFeedback) showFeedback(attestationFeedback, error.message, true);
            }
        });

        attestationForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!attestationForm.reportValidity()) return;
            const values = Object.fromEntries(new FormData(attestationForm).entries());
            if (values.dataFim < values.dataInicio) {
                showFeedback(attestationFeedback, 'A data de término não pode ser anterior à data de início.', true);
                attestationForm.elements.dataFim.focus();
                return;
            }
            const record = {
                id: backend.createId('atestado'),
                tipo: 'professor',
                professorId: actor.tipo === 'professor' ? actor.uid : '',
                professorNome: professorName,
                motivo: String(values.motivo).trim(),
                dataInicio: String(values.dataInicio),
                dataFim: String(values.dataFim),
                observacoes: String(values.observacoes ?? '').trim(),
                status: 'Enviado',
                criadoEm: backend.nowIso()
            };
            if (selectedPdf) {
                try {
                    record.anexo = {
                        nome: selectedPdf.name,
                        tipo: 'application/pdf',
                        tamanho: selectedPdf.size,
                        conteudo: await readPdf(selectedPdf)
                    };
                } catch (error) {
                    showFeedback(attestationFeedback, error.message, true);
                    return;
                }
            }
            const saved = backend.write('educonnect_atestados', [
                record,
                ...backend.readArray('educonnect_atestados')
            ]);
            if (!saved) {
                showFeedback(attestationFeedback, 'Não foi possível salvar neste navegador.', true);
                return;
            }
            backend.addAudit({
                modulo: 'Atestados',
                acao: 'Envio',
                descricao: `O professor ${professorName} enviou um atestado.`
            });
            attestationForm.reset();
            selectedPdf = null;
            if (pdfName) pdfName.textContent = 'Nenhum arquivo selecionado.';
            showFeedback(attestationFeedback, 'Atestado enviado e salvo neste navegador.');
            window.setTimeout(() => document.getElementById('atestado-dialog')?.close(), 1200);
        });

        occurrenceForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!occurrenceForm.reportValidity()) return;
            const values = Object.fromEntries(new FormData(occurrenceForm).entries());
            const student = backend.getStudents().find((item) => item.codigo === values.aluno);
            if (!student) {
                showFeedback(occurrenceFeedback, 'Selecione um aluno cadastrado.', true);
                return;
            }
            const record = backend.addOccurrence({
                aluno: student.nome,
                alunoId: `aluno-${student.codigo}`,
                matricula: student.codigo,
                turma: student.turma || values.turma,
                tipo: values.tipo,
                gravidade: values.gravidade,
                descricao: String(values.descricao).trim(),
                autor: professorName,
                status: 'Aberta'
            });
            if (!record) {
                showFeedback(occurrenceFeedback, 'Não foi possível salvar a ocorrência.', true);
                return;
            }
            occurrenceForm.reset();
            populateStudents();
            updateOccurrenceTotal();
            showFeedback(occurrenceFeedback, `Ocorrência ${record.protocolo} registrada.`);
            window.setTimeout(() => document.getElementById('ocorrencia-dialog')?.close(), 1200);
        });

        window.addEventListener(backend.eventName, (event) => {
            if (event.detail?.key === backend.keys.ocorrencias) updateOccurrenceTotal();
        });
        window.addEventListener('storage', (event) => {
            if (event.key === backend.keys.ocorrencias) updateOccurrenceTotal();
        });
        updateOccurrenceTotal();

        const panels = [...document.querySelectorAll('[data-view-panel]')];
        const links = [...document.querySelectorAll('[data-view]')];
        function showView(name) {
            const view = panels.some((panel) => panel.dataset.viewPanel === name) ? name : 'dashboard';
            panels.forEach((panel) => { panel.hidden = panel.dataset.viewPanel !== view; });
            links.forEach((link) => {
                const active = link.dataset.view === view;
                link.closest('li')?.classList.toggle('ativo', active);
                if (active) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
            if (view === 'comunicados') renderCommunications();
        }
        links.forEach((link) => link.addEventListener('click', (event) => {
            event.preventDefault();
            const view = link.dataset.view;
            history.replaceState(null, '', `#${view}`);
            showView(view);
        }));
        window.addEventListener('hashchange', () => showView(location.hash.slice(1)));

        const communicationList = document.getElementById('comunicados-list');
        const communicationCount = document.getElementById('comunicados-count');
        function renderCommunications() {
            if (!communicationList || !communicationCount) return;
            const records = backend.getCommunications()
                .filter((record) => record && normalize(record.status) === 'enviado')
                .filter((record) => {
                    const recipients = Array.isArray(record.destinatarios)
                        ? record.destinatarios : String(record.destinatarios ?? '').split(',');
                    return recipients.some((recipient) => ['todos', 'professores', 'professor']
                        .includes(normalize(recipient)));
                })
                .sort((a, b) => String(b.enviadoEm || b.criadoEm || '').localeCompare(String(a.enviadoEm || a.criadoEm || '')));
            communicationList.replaceChildren();
            communicationCount.textContent = `${records.length} ${records.length === 1 ? 'comunicado' : 'comunicados'}`;
            if (!records.length) {
                const empty = document.createElement('p');
                empty.className = 'empty-state';
                empty.textContent = 'Ainda não há comunicados enviados para os professores.';
                communicationList.append(empty);
                return;
            }
            records.forEach((record) => {
                const article = document.createElement('article');
                article.className = 'teacher-communication';
                const heading = document.createElement('h2');
                heading.textContent = record.titulo || 'Comunicado';
                const message = document.createElement('p');
                message.textContent = record.texto || '';
                const time = document.createElement('time');
                const date = record.enviadoEm || record.criadoEm;
                time.textContent = date ? new Date(date).toLocaleString('pt-BR') : 'Data não informada';
                article.append(heading, message, time);
                communicationList.append(article);
            });
        }
        showView(location.hash.slice(1));
        window.addEventListener(backend.eventName, (event) => {
            if (event.detail?.key === backend.keys.comunicados) renderCommunications();
        });
        window.addEventListener('storage', (event) => {
            if (event.key === backend.keys.comunicados) renderCommunications();
        });

        document.querySelectorAll('[data-close-dialog]').forEach((button) => {
            button.addEventListener('click', () => button.closest('dialog')?.close());
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
