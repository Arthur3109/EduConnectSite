/**
 * Implementa os serviços do painel do aluno sem dependências externas.
 * Os dados compartilhados são lidos pelo núcleo EduConnect; as justificativas
 * ficam em uma coleção própria, compatível com a persistência via localStorage.
 */
(() => {
    'use strict';

    const ATESTADOS_KEY = 'educonnect_atestados';
    const MAX_PDF_SIZE = 2 * 1024 * 1024;
    const backend = window.EduConnectBackend;

    /**
     * Padroniza textos para que acentos e diferenças entre maiúsculas/minúsculas
     * não impeçam a associação de um registro ao aluno correto.
     */
    function normalize(value) {
        return backend.normalizeText(value);
    }

    /**
     * Obtém a identidade mostrada no painel e complementa com o vínculo atual
     * apenas quando o nome persistido corresponde ao nome visível.
     */
    function getStudent() {
        const studentInfo = document.querySelector('.student-info')?.textContent ?? '';
        const [visibleName = '', visibleClass = ''] = studentInfo.split('•').map((part) => part.trim());
        const currentActor = backend.getCurrentActor();
        const actorMatches = normalize(currentActor?.nome) === normalize(visibleName);

        return {
            nome: visibleName,
            turma: visibleClass.replace(/^Turma\s*/i, '').trim(),
            uid: actorMatches ? String(currentActor.uid ?? '') : '',
            codigo: actorMatches ? String(currentActor.codigo ?? '') : ''
        };
    }

    /**
     * Cria elementos de texto sem interpretar conteúdo salvo como HTML.
     * Isso mantém nomes, descrições e mensagens como texto simples e seguro.
     */
    function createTextElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        element.textContent = text || '';
        return element;
    }

    /** Formata datas ISO para leitura em português sem alterar a data armazenada. */
    function formatDate(value) {
        if (!value) return 'Data não informada';
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('pt-BR').format(date);
    }

    /** Formata horários gravados no padrão ISO pelo núcleo compartilhado. */
    function formatDateTime(value) {
        if (!value) return 'Data não informada';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(date);
    }

    /**
     * Atualiza o estado visual do modal de envio e foca o primeiro campo,
     * permitindo que teclado e tecnologias assistivas usem o formulário.
     */
    function openDialog(dialog) {
        if (!dialog?.open) dialog?.showModal();
        dialog?.querySelector('input, textarea, button')?.focus();
    }

    /**
     * Associa os botões de abrir/fechar aos elementos dialog nativos.
     * O navegador mantém o foco dentro do modal e permite fechá-lo com Escape.
     */
    function setupDialogs() {
        document.querySelectorAll('[data-open-dialog]').forEach((button) => {
            button.addEventListener('click', () => {
                const dialog = document.getElementById(button.dataset.openDialog);
                if (dialog?.id === 'ocorrencias-dialog') renderOccurrences();
                openDialog(dialog);
            });
        });

        document.querySelectorAll('[data-close-dialog]').forEach((button) => {
            button.addEventListener('click', () => button.closest('dialog')?.close());
        });
    }

    /**
     * Lê os atestados de sua chave própria. Se a chave ainda não existir,
     * inicia com uma lista vazia sem modificar as demais coleções do sistema.
     */
    function getAtestados() {
        return backend.readArray(ATESTADOS_KEY);
    }

    /**
     * Converte o PDF selecionado para uma URL de dados para que possa ser
     * serializado no mesmo registro do atestado dentro do localStorage.
     */
    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                    return;
                }
                reject(new Error('O navegador não conseguiu converter o arquivo selecionado.'));
            });
            reader.addEventListener('error', () => {
                reject(reader.error || new Error('Não foi possível ler o arquivo selecionado.'));
            });
            reader.addEventListener('abort', () => {
                reject(new Error('A leitura do arquivo foi cancelada.'));
            });
            reader.readAsDataURL(file);
        });
    }

    /**
     * Confere extensão, tipo MIME e assinatura inicial do arquivo; a assinatura
     * reduz o risco de aceitar um arquivo que apenas foi renomeado para .pdf.
     */
    async function validatePdf(file) {
        if (!file) return false;
        const hasPdfExtension = /\.pdf$/i.test(file.name);
        const hasPdfType = !file.type || file.type === 'application/pdf';
        if (!hasPdfExtension || !hasPdfType) return false;

        const signature = await file.slice(0, 5).text();
        return signature === '%PDF-';
    }

    /**
     * Filtra ocorrências usando nome completo ou matrícula/código do aluno.
     * Os dois formatos de nome são considerados para compatibilidade com dados
     * cadastrados pelas telas antigas e pelo núcleo compartilhado.
     */
    function isStudentOccurrence(record, student) {
        const possibleNames = [record.aluno, record.alunoNome, record.nomeAluno];
        const nameMatches = possibleNames.some((name) => normalize(name) === normalize(student.nome));
        const possibleCodes = [record.matricula, record.codigoAluno];
        const codeMatches = student.codigo && possibleCodes.some((code) =>
            String(code ?? '').trim() === student.codigo
        );
        const idMatches = student.uid && String(record.alunoId ?? '').trim() === student.uid;
        return nameMatches || Boolean(codeMatches) || Boolean(idMatches);
    }

    /**
     * Cria um item de ocorrência usando textContent para todo conteúdo
     * proveniente do armazenamento local.
     */
    function createOccurrenceItem(record) {
        const article = document.createElement('article');
        article.className = 'record-card';

        const heading = document.createElement('div');
        heading.className = 'record-card__heading';
        heading.append(
            createTextElement('h3', '', record.tipo || 'Registro escolar'),
            createTextElement('span', 'record-card__date', record.data || formatDateTime(record.criadoEm))
        );

        const details = document.createElement('dl');
        details.className = 'record-card__details';
        [
            ['Gravidade', record.gravidade],
            ['Status', record.status],
            ['Protocolo', record.protocolo]
        ].forEach(([label, value]) => {
            if (!value) return;
            const item = document.createElement('div');
            item.append(createTextElement('dt', '', label), createTextElement('dd', '', value));
            details.append(item);
        });

        article.append(heading, details);
        if (record.descricao) {
            article.append(createTextElement('p', 'record-card__description', record.descricao));
        }
        return article;
    }

    /**
     * Carrega o histórico pela API compartilhada e mostra apenas os registros
     * associados ao aluno identificado no cabeçalho da página.
     */
    function renderOccurrences() {
        const list = document.getElementById('ocorrencias-list');
        if (!list) return;

        const student = getStudent();
        const records = backend.getOccurrences()
            .filter((record) => isStudentOccurrence(record, student))
            .sort((first, second) => String(second.criadoEm ?? '').localeCompare(String(first.criadoEm ?? '')));
        list.replaceChildren();

        if (!records.length) {
            list.append(createTextElement('p', 'empty-state',
                'Não há ocorrências ou advertências vinculadas ao seu cadastro.'));
            return;
        }
        records.forEach((record) => list.append(createOccurrenceItem(record)));
    }

    /**
     * Interpreta os destinatários da Secretaria em formatos antigos (texto)
     * e atuais (lista), aceitando somente comunicados enviados aos alunos.
     */
    function isForStudents(record) {
        const recipients = Array.isArray(record.destinatarios)
            ? record.destinatarios
            : String(record.destinatarios ?? '').split(',');
        return recipients.some((recipient) => {
            const normalized = normalize(recipient);
            return normalized === 'todos' || normalized === 'alunos' || normalized === 'aluno';
        });
    }

    /**
     * Monta um cartão de comunicado a partir de elementos DOM e texto simples,
     * sem inserir diretamente HTML salvo em localStorage.
     */
    function createCommunicationCard(record) {
        const article = document.createElement('article');
        article.className = 'communication-card';

        const metadata = document.createElement('div');
        metadata.className = 'communication-card__metadata';
        metadata.append(
            createTextElement('span', `communication-type communication-type--${normalize(record.tipo) || 'informativo'}`,
                record.tipo || 'Informativo'),
            createTextElement('time', 'communication-date',
                formatDateTime(record.enviadoEm || record.criadoEm))
        );
        article.append(
            metadata,
            createTextElement('h3', 'communication-card__title', record.titulo || 'Comunicado'),
            createTextElement('p', 'communication-card__text', record.texto || '')
        );
        return article;
    }

    /**
     * Exibe comunicados com estado "Enviado" destinados aos alunos, ordenados
     * do mais recente para o mais antigo, e mostra uma mensagem vazia adequada.
     */
    function renderCommunications() {
        const list = document.getElementById('comunicados-list');
        const count = document.getElementById('comunicados-count');
        if (!list || !count) return;

        const records = backend.getCommunications()
            .filter((record) => normalize(record.status) === 'enviado' && isForStudents(record))
            .sort((first, second) => String(second.enviadoEm || second.criadoEm || '')
                .localeCompare(String(first.enviadoEm || first.criadoEm || '')));
        list.replaceChildren();
        count.textContent = `${records.length} ${records.length === 1 ? 'comunicado' : 'comunicados'}`;

        if (!records.length) {
            list.append(createTextElement('p', 'empty-state',
                'Ainda não há comunicados enviados para os alunos.'));
            return;
        }
        records.forEach((record) => list.append(createCommunicationCard(record)));
    }

    /**
     * Valida o intervalo e salva uma justificativa estruturada. O aluno e sua
     * turma são incluídos no registro para que a Secretaria consiga identificá-lo.
     */
    function setupAtestadoForm() {
        const form = document.getElementById('atestado-form');
        const dialog = document.getElementById('atestado-dialog');
        const feedback = document.getElementById('atestado-feedback');
        const fileInput = document.getElementById('atestado-pdf');
        const fileButton = document.getElementById('atestado-pdf-button');
        const fileName = document.getElementById('atestado-file-name');
        if (!form || !dialog || !feedback || !fileInput || !fileButton || !fileName) return;

        let selectedPdf = null;

        // O botão estilizado delega ao seletor nativo de arquivos do navegador.
        fileButton.addEventListener('click', () => fileInput.click());

        // Ao escolher arquivo, verifica tamanho e formato antes de mantê-lo em memória.
        fileInput.addEventListener('change', async () => {
            feedback.textContent = '';
            selectedPdf = null;
            const file = fileInput.files?.[0];
            if (!file) {
                fileName.textContent = 'Nenhum arquivo selecionado.';
                return;
            }
            if (file.size > MAX_PDF_SIZE) {
                fileInput.value = '';
                fileName.textContent = 'Nenhum arquivo selecionado.';
                feedback.textContent = 'O PDF deve ter no máximo 2 MB para ser salvo no navegador.';
                return;
            }

            try {
                if (!(await validatePdf(file))) {
                    fileInput.value = '';
                    fileName.textContent = 'Nenhum arquivo selecionado.';
                    feedback.textContent = 'Selecione um arquivo PDF válido.';
                    return;
                }
                selectedPdf = file;
                fileName.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
            } catch (error) {
                console.error('Não foi possível validar o PDF selecionado.', error);
                fileInput.value = '';
                fileName.textContent = 'Nenhum arquivo selecionado.';
                feedback.textContent = 'Não foi possível verificar o arquivo. Tente selecioná-lo novamente.';
            }
        });

        // A leitura do PDF é assíncrona; o formulário só salva após obter os dados do anexo.
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

            const student = getStudent();
            const timestamp = backend.nowIso();
            const record = {
                id: backend.createId('atestado'),
                alunoId: student.uid || null,
                matricula: student.codigo || '',
                alunoNome: student.nome,
                turma: student.turma,
                motivo: String(values.motivo).trim(),
                dataInicio: values.dataInicio,
                dataFim: values.dataFim,
                observacoes: String(values.observacoes ?? '').trim(),
                status: 'Enviado',
                criadoEm: timestamp
            };

            if (selectedPdf) {
                try {
                    record.anexo = {
                        nome: selectedPdf.name,
                        tipo: 'application/pdf',
                        tamanho: selectedPdf.size,
                        conteudo: await readFileAsDataUrl(selectedPdf)
                    };
                } catch (error) {
                    console.error('Não foi possível preparar o PDF para salvar.', error);
                    feedback.textContent = 'Não foi possível ler o PDF. Tente selecionar o arquivo novamente.';
                    return;
                }
            }

            const records = getAtestados();
            if (!backend.write(ATESTADOS_KEY, [record, ...records])) {
                feedback.textContent = 'Não foi possível salvar. O armazenamento do navegador pode estar cheio.';
                return;
            }

            form.reset();
            selectedPdf = null;
            fileName.textContent = 'Nenhum arquivo selecionado.';
            feedback.textContent = 'Justificativa enviada e salva neste navegador.';
            window.setTimeout(() => {
                if (dialog.open) dialog.close();
                feedback.textContent = '';
            }, 1400);
        });
    }

    /**
     * Atualiza dados quando outro módulo grava no núcleo e quando uma outra
     * aba altera as chaves compartilhadas do localStorage.
     */
    function setupDataRefresh() {
        window.addEventListener(backend.eventName, (event) => {
            if (event.detail?.key === backend.keys.ocorrencias && document.getElementById('ocorrencias-dialog')?.open) {
                renderOccurrences();
            }
            if (event.detail?.key === backend.keys.comunicados) renderCommunications();
        });
        window.addEventListener('storage', (event) => {
            if (event.key === backend.keys.comunicados) renderCommunications();
            if (event.key === backend.keys.ocorrencias
                && document.getElementById('ocorrencias-dialog')?.open) renderOccurrences();
        });
    }

    /** Inicializa os serviços após o HTML e o núcleo compartilhado estarem prontos. */
    function init() {
        if (!backend) {
            console.error('EduConnect: núcleo de persistência não encontrado na área do aluno.');
            return;
        }
        setupDialogs();
        setupAtestadoForm();
        renderCommunications();
        setupDataRefresh();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
