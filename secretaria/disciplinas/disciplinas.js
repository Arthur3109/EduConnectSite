/**
 * Gerencia cadastro, busca, turmas e vínculos docentes das disciplinas da Secretaria.
 */
(() => {
    'use strict';

    const STORAGE_KEY = 'educonnect_disciplinas';
    const TEACHERS_KEY = 'educonnect_usuarios_professores';
    const CLASSES_KEY = 'educonnect_turmas';
    const DEFAULT_CLASSES = ['1º EM', '2º EM', '3º EM', '4º EM', 'Todas'];
    const DEFAULT_TEACHERS = [
        'Carlos Eduardo Souza',
        'Juliana Ribeiro Santos',
        'Roberto Alves de Lima',
        'Mariana Costa Pinto',
        'Silvia Martins Ferreira',
        'Pedro Henrique Almeida'
    ];
    const mockData = [
        {
            codigo: 'MAT-101',
            nome: 'Matemática Aplicada',
            cargaHoraria: 100,
            turmas: ['3º EM', '2º EM'],
            professores: ['Carlos Eduardo Souza', 'Roberto Alves de Lima', 'Silvia Martins Ferreira']
        },
        {
            codigo: 'PORT-202',
            nome: 'Língua Portuguesa e Literatura',
            cargaHoraria: 150,
            turmas: ['Todas'],
            professores: ['Juliana Ribeiro Santos', 'Mariana Costa Pinto', 'Carlos Eduardo Souza', 'Pedro Henrique Almeida']
        }
    ];

    const state = {
        disciplinas: [],
        query: '',
        editingCode: null,
        linkingCode: null
    };

    const elements = {};

    /**
     * Clona disciplinas e suas listas mutáveis para evitar alterar os mocks originais.
     * @param {Array<object>} records Registros a clonar.
     * @returns {Array<object>} Cópias independentes dos registros.
     */
    function cloneRecords(records) {
        return records.map((record) => ({
            ...record,
            turmas: [...(record.turmas ?? [])],
            professores: [...(record.professores ?? [])]
        }));
    }

    /**
     * Lê e valida uma lista JSON do LocalStorage.
     * @param {string} key Chave consultada.
     * @returns {Array<object>|null} Lista válida ou null quando ausente/inválida.
     */
    function readArray(key) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return null;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch (error) {
            console.error(`Não foi possível ler ${key} do armazenamento local.`, error);
            return null;
        }
    }

    /**
     * Salva o estado atual das disciplinas no LocalStorage.
     * @returns {boolean} Indica se a gravação foi concluída.
     */
    function saveDisciplinas() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.disciplinas));
            return true;
        } catch (error) {
            console.error('Não foi possível salvar as disciplinas.', error);
            window.alert('Não foi possível salvar as alterações neste navegador.');
            return false;
        }
    }

    /**
     * Normaliza texto para busca ignorando acentos e diferenças entre maiúsculas/minúsculas.
     * @param {string|number|null|undefined} value Valor a normalizar.
     * @returns {string} Texto normalizado.
     */
    function normalizeText(value) {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .trim();
    }

    /**
     * Converte registros antigos/novos para o formato único da tabela.
     * @param {object} record Registro bruto persistido.
     * @returns {object} Disciplina normalizada.
     */
    function normalizeDiscipline(record) {
        return {
            codigo: String(record.codigo ?? record.id ?? '').trim(),
            nome: String(record.nome ?? record.nomeDisciplina ?? '').trim(),
            cargaHoraria: Number(record.cargaHoraria ?? record.horas ?? 0),
            turmas: Array.isArray(record.turmas) ? record.turmas.map(String) : [],
            professores: Array.isArray(record.professores) ? record.professores.map(String) : []
        };
    }

    /**
     * Combina turmas reais já persistidas com as opções padrão do protótipo.
     * @returns {string[]} Opções disponíveis no formulário.
     */
    function readClasses() {
        const storedClasses = readArray(CLASSES_KEY);
        if (!storedClasses?.length) return [...DEFAULT_CLASSES];

        const normalized = storedClasses.map((turma) => {
            const value = turma.serie || turma.nome || turma.codigo || '';
            return String(value)
                .replace(/\s*Ensino Médio/i, ' EM')
                .replace(/\s*-.*$/, '')
                .trim();
        }).filter(Boolean);

        return [...new Set([...DEFAULT_CLASSES.filter((item) => item !== 'Todas'), ...normalized, 'Todas'])];
    }

    /**
     * Combina docentes cadastrados localmente com os nomes de fallback do protótipo.
     * @returns {string[]} Nomes únicos e ordenados de professores.
     */
    function readTeachers() {
        const storedTeachers = readArray(TEACHERS_KEY) ?? [];
        const names = storedTeachers.map((teacher) => String(teacher.nome ?? teacher.nomeCompleto ?? '').trim()).filter(Boolean);
        return [...new Set([...names, ...DEFAULT_TEACHERS])].sort((first, second) => first.localeCompare(second, 'pt-BR'));
    }

    /**
     * Cria um elemento HTML preenchido com texto via textContent.
     * @param {string} tag Nome da tag.
     * @param {string} [className=''] Classe CSS.
     * @param {string} [text] Conteúdo textual.
     * @returns {HTMLElement} Elemento construído.
     */
    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    /**
     * Renderiza as linhas da tabela para a lista fornecida.
     * @param {object[]} [lista=state.disciplinas] Disciplinas que serão exibidas.
     * @returns {void}
     */
    function renderDisciplinasTable(lista = state.disciplinas) {
        const body = document.querySelector('#disciplinasTabelaBody');
        if (!body) return;
        body.replaceChildren();

        if (lista.length === 0) {
            const row = createElement('tr');
            const cell = createElement('td', 'sem-disciplinas', state.query
                ? 'Nenhuma disciplina corresponde à busca.'
                : 'Nenhuma disciplina cadastrada.');
            cell.colSpan = 6;
            row.append(cell);
            body.append(row);
            return;
        }

        lista.forEach((disciplina) => {
            const row = createElement('tr');
            row.dataset.codigo = disciplina.codigo;

            const codeCell = createElement('td');
            codeCell.append(createElement('strong', '', disciplina.codigo));
            row.append(codeCell);
            row.append(createElement('td', '', disciplina.nome));
            row.append(createElement('td', '', `${disciplina.cargaHoraria} h/a`));

            const teachersCell = createElement('td');
            const teachersLink = createElement('a', 'link-vinculo', `${disciplina.professores.length} professores`);
            teachersLink.href = '#professores';
            teachersLink.dataset.action = 'professores';
            teachersLink.dataset.codigo = disciplina.codigo;
            teachersLink.setAttribute('aria-label', `Gerenciar professores de ${disciplina.nome}`);
            teachersCell.append(teachersLink);
            row.append(teachersCell);
            row.append(createElement('td', '', disciplina.turmas.length ? disciplina.turmas.join(', ') : 'Nenhuma'));

            const actions = createElement('td', 'acoes-disciplina');
            actions.append(
                createActionButton('edit', 'edit', `Editar ${disciplina.nome}`),
                createActionButton('delete', 'delete', `Excluir ${disciplina.nome}`)
            );
            row.append(actions);
            body.append(row);
        });
    }

    /**
     * Cria um botão de ação acessível para uma linha da tabela.
     * @param {string} action Ação identificada por data-action.
     * @param {string} iconName Nome do ícone Material Symbols.
     * @param {string} label Nome acessível da ação.
     * @returns {HTMLButtonElement} Botão configurado.
     */
    function createActionButton(action, iconName, label) {
        const button = createElement('button', 'btn-acao');
        button.type = 'button';
        button.dataset.action = action;
        button.setAttribute('aria-label', label);
        button.title = label;
        const icon = createElement('span', 'material-symbols-outlined', iconName);
        icon.setAttribute('aria-hidden', 'true');
        button.append(icon);
        return button;
    }

    /**
     * Filtra por código, nome e turmas sempre que o campo de busca muda.
     * @returns {void}
     */
    function handleSearch() {
        state.query = normalizeText(elements.search?.value);
        const filtered = state.disciplinas.filter((disciplina) => {
            const searchable = [
                disciplina.codigo,
                disciplina.nome,
                disciplina.turmas.join(' ')
            ].map(normalizeText).join(' ');
            return searchable.includes(state.query);
        });
        renderDisciplinasTable(filtered);
    }

    /**
     * Renderiza um grupo de checkboxes e aplica exclusividade quando necessário.
     * @param {HTMLElement} container Elemento que recebe as opções.
     * @param {string} name Atributo name dos checkboxes.
     * @param {string[]} options Valores disponíveis.
     * @param {string[]} selected Valores inicialmente marcados.
     * @param {{exclusive?: boolean}} [optionsConfig={}] Define a exclusividade entre opções.
     * @returns {void}
     */
    function createCheckboxGroup(container, name, options, selected, { exclusive = false } = {}) {
        container.replaceChildren();
        const selectedValues = new Set(selected);

        options.forEach((option) => {
            const label = createElement('label', 'choice-option');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = name;
            checkbox.value = option;
            checkbox.checked = selectedValues.has(option);
            checkbox.addEventListener('change', () => {
                if (exclusive && option === 'Todas' && checkbox.checked) {
                    container.querySelectorAll('input').forEach((item) => {
                        if (item !== checkbox) item.checked = false;
                    });
                } else if (exclusive && option !== 'Todas' && checkbox.checked) {
                    const allOption = container.querySelector('input[value="Todas"]');
                    if (allOption) allOption.checked = false;
                }
            });
            label.append(checkbox, createElement('span', '', option));
            container.append(label);
        });
    }

    /**
     * Cria o modal de criação/edição e conecta o envio do formulário.
     * @returns {{dialog: HTMLDialogElement, form: HTMLFormElement, fields: HTMLFormControlsCollection, classChoices: HTMLElement, teacherChoices: HTMLElement}} Referências do modal.
     */
    function createDisciplineDialog() {
        const dialog = document.createElement('dialog');
        dialog.id = 'modalDisciplina';
        dialog.className = 'modal-disciplina';
        dialog.setAttribute('aria-labelledby', 'modalDisciplinaTitle');
        dialog.innerHTML = `
            <div class="modal-disciplina-content">
                <header class="modal-disciplina-header">
                    <div>
                        <p class="modal-disciplina-eyebrow">EduConnect · Secretaria</p>
                        <h2 id="modalDisciplinaTitle">Nova Disciplina</h2>
                    </div>
                    <button class="modal-disciplina-close" type="button" aria-label="Fechar modal">
                        <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </header>
                <form id="disciplinaForm" novalidate>
                    <div class="disciplina-fields">
                        <label class="disciplina-field">
                            <span>Código</span>
                            <input name="codigo" type="text" maxlength="24" required autocomplete="off" placeholder="Ex.: MAT-101">
                        </label>
                        <label class="disciplina-field">
                            <span>Nome da Disciplina</span>
                            <input name="nome" type="text" maxlength="100" required autocomplete="off">
                        </label>
                        <label class="disciplina-field">
                            <span>Carga Horária (h/a)</span>
                            <input name="cargaHoraria" type="number" min="1" step="1" required>
                        </label>
                        <fieldset class="choice-fieldset">
                            <legend>Turmas Atribuídas</legend>
                            <div class="choice-list" data-choice-group="turmas"></div>
                        </fieldset>
                        <fieldset class="choice-fieldset">
                            <legend>Professores Vinculados</legend>
                            <div class="choice-list" data-choice-group="professores"></div>
                        </fieldset>
                    </div>
                    <p class="form-disciplina-message" role="alert" aria-live="polite"></p>
                    <footer class="modal-disciplina-actions">
                        <button class="btn-disciplina-cancel" type="button">Cancelar</button>
                        <button class="btn-disciplina-save" type="submit">Salvar Disciplina</button>
                    </footer>
                </form>
            </div>
        `;
        document.body.append(dialog);

        const form = dialog.querySelector('#disciplinaForm');
        const fields = form.elements;
        const classChoices = dialog.querySelector('[data-choice-group="turmas"]');
        const teacherChoices = dialog.querySelector('[data-choice-group="professores"]');

        dialog.querySelector('.modal-disciplina-close').addEventListener('click', () => dialog.close());
        dialog.querySelector('.btn-disciplina-cancel').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) dialog.close();
        });
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            dialog.close();
        });
        dialog.addEventListener('close', () => {
            form.reset();
            state.editingCode = null;
            dialog.querySelector('.form-disciplina-message').textContent = '';
        });
        form.addEventListener('submit', handleSaveDisciplina);

        return { dialog, form, fields, classChoices, teacherChoices };
    }

    /**
     * Atualiza a mensagem de validação do formulário principal.
     * @param {string} message Texto de erro ou string vazia para limpar.
     * @returns {void}
     */
    function setDialogFormMessage(message) {
        elements.disciplineDialog?.dialog.querySelector('.form-disciplina-message')?.replaceChildren(document.createTextNode(message));
    }

    /**
     * Abre o formulário de disciplina preenchido ou pronto para cadastro.
     * @param {object|null} [disciplina=null] Registro a editar, se aplicável.
     * @returns {void}
     */
    function openDisciplinaModal(disciplina = null) {
        state.editingCode = disciplina?.codigo ?? null;
        const { dialog, form, fields, classChoices, teacherChoices } = elements.disciplineDialog;
        form.reset();
        setDialogFormMessage('');
        dialog.querySelector('#modalDisciplinaTitle').textContent = disciplina ? `Editar ${disciplina.codigo}` : 'Nova Disciplina';
        dialog.querySelector('.btn-disciplina-save').textContent = disciplina ? 'Salvar Alterações' : 'Salvar Disciplina';
        fields.codigo.readOnly = Boolean(disciplina);
        fields.codigo.value = disciplina?.codigo ?? '';
        fields.nome.value = disciplina?.nome ?? '';
        fields.cargaHoraria.value = disciplina?.cargaHoraria ?? '';
        createCheckboxGroup(classChoices, 'turmas', readClasses(), disciplina?.turmas ?? [], { exclusive: true });
        createCheckboxGroup(teacherChoices, 'professores', readTeachers(), disciplina?.professores ?? []);
        dialog.showModal();
        requestAnimationFrame(() => fields.codigo.focus());
    }

    /**
     * Retorna os valores atualmente marcados em um grupo de checkboxes.
     * @param {HTMLElement} container Grupo de opções consultado.
     * @returns {string[]} Valores selecionados.
     */
    function getCheckedValues(container) {
        return [...container.querySelectorAll('input[type="checkbox"]:checked')].map((checkbox) => checkbox.value);
    }

    /**
     * Valida e persiste uma disciplina nova ou editada, incluindo seus vínculos.
     * @param {SubmitEvent} event Evento de envio do formulário.
     * @returns {void}
     */
    function handleSaveDisciplina(event) {
        event.preventDefault();
        const { dialog, form, fields, classChoices, teacherChoices } = elements.disciplineDialog;
        setDialogFormMessage('');

        if (!fields.codigo.value.trim() || !fields.nome.value.trim() || !fields.cargaHoraria.value) {
            setDialogFormMessage('Preencha código, nome e carga horária.');
            form.reportValidity();
            return;
        }

        const codigo = fields.codigo.value.trim().toLocaleUpperCase('pt-BR');
        // A comparação normalizada evita códigos duplicados com diferenças apenas de caixa.
        const duplicate = state.disciplinas.some((disciplina) => (
            disciplina.codigo.toLocaleUpperCase('pt-BR') === codigo && disciplina.codigo !== state.editingCode
        ));
        if (duplicate) {
            setDialogFormMessage('Já existe uma disciplina cadastrada com este código.');
            fields.codigo.focus();
            return;
        }

        const turmas = getCheckedValues(classChoices);
        if (turmas.length === 0) {
            setDialogFormMessage('Selecione pelo menos uma turma.');
            classChoices.querySelector('input')?.focus();
            return;
        }

        const disciplina = {
            codigo,
            nome: fields.nome.value.trim(),
            cargaHoraria: Number(fields.cargaHoraria.value),
            turmas,
            professores: getCheckedValues(teacherChoices)
        };

        if (state.editingCode) {
            const index = state.disciplinas.findIndex((item) => item.codigo === state.editingCode);
            if (index >= 0) state.disciplinas[index] = disciplina;
        } else {
            state.disciplinas.unshift(disciplina);
        }

        if (!saveDisciplinas()) return;
        dialog.close();
        handleSearch();
    }

    /**
     * Solicita confirmação e remove a disciplina do estado persistido.
     * @param {string} codigo Código da disciplina a excluir.
     * @returns {void}
     */
    function handleDeleteDisciplina(codigo) {
        const disciplina = state.disciplinas.find((item) => item.codigo === codigo);
        if (!disciplina) return;
        const confirmed = window.confirm(`Excluir a disciplina ${disciplina.codigo} — ${disciplina.nome}? Esta ação não pode ser desfeita.`);
        if (!confirmed) return;

        state.disciplinas = state.disciplinas.filter((item) => item.codigo !== codigo);
        if (saveDisciplinas()) handleSearch();
    }

    /**
     * Cria o diálogo secundário para edição dos professores vinculados.
     * @returns {HTMLDialogElement} Modal de professores configurado.
     */
    function createTeachersDialog() {
        const dialog = document.createElement('dialog');
        dialog.id = 'modalProfessoresDisciplina';
        dialog.className = 'modal-disciplina modal-professores';
        dialog.setAttribute('aria-labelledby', 'modalProfessoresTitle');
        dialog.innerHTML = `
            <div class="modal-disciplina-content">
                <header class="modal-disciplina-header">
                    <div>
                        <p class="modal-disciplina-eyebrow">Equipe docente</p>
                        <h2 id="modalProfessoresTitle">Professores Vinculados</h2>
                        <p class="modal-disciplina-subtitle"></p>
                    </div>
                    <button class="modal-disciplina-close" type="button" aria-label="Fechar modal">
                        <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </header>
                <form class="professores-form">
                    <div class="choice-list professores-choice-list"></div>
                    <footer class="modal-disciplina-actions">
                        <button class="btn-disciplina-cancel" type="button">Cancelar</button>
                        <button class="btn-disciplina-save" type="submit">Salvar Vínculos</button>
                    </footer>
                </form>
            </div>
        `;
        document.body.append(dialog);
        dialog.querySelector('.modal-disciplina-close').addEventListener('click', () => dialog.close());
        dialog.querySelector('.btn-disciplina-cancel').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) dialog.close();
        });
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            dialog.close();
        });
        dialog.querySelector('.professores-form').addEventListener('submit', (event) => {
            event.preventDefault();
            const discipline = state.disciplinas.find((item) => item.codigo === state.linkingCode);
            if (!discipline) return;
            discipline.professores = getCheckedValues(dialog.querySelector('.professores-choice-list'));
            if (!saveDisciplinas()) return;
            dialog.close();
            handleSearch();
        });
        return dialog;
    }

    /**
     * Abre o modal secundário com os vínculos atuais da disciplina selecionada.
     * @param {string} codigo Código da disciplina.
     * @returns {void}
     */
    function openProfessoresVinculadosModal(codigo) {
        const disciplina = state.disciplinas.find((item) => item.codigo === codigo);
        if (!disciplina) return;
        state.linkingCode = codigo;
        const dialog = elements.teachersDialog;
        dialog.querySelector('#modalProfessoresTitle').textContent = `Professores de ${disciplina.codigo}`;
        dialog.querySelector('.modal-disciplina-subtitle').textContent = disciplina.nome;
        createCheckboxGroup(
            dialog.querySelector('.professores-choice-list'),
            'professores',
            readTeachers(),
            disciplina.professores
        );
        dialog.showModal();
    }

    /**
     * Carrega dados, cria diálogos e conecta busca e ações da tabela.
     * @returns {void}
     */
    function initDisciplinas() {
        elements.search = document.querySelector('#searchDisciplina');
        elements.tableBody = document.querySelector('#disciplinasTabelaBody');
        elements.addButton = document.querySelector('#btnNovaDisciplina');

        const stored = readArray(STORAGE_KEY);
        state.disciplinas = (stored ?? cloneRecords(mockData)).map(normalizeDiscipline);
        if (stored === null) saveDisciplinas();

        elements.disciplineDialog = createDisciplineDialog();
        elements.teachersDialog = createTeachersDialog();
        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            const openDialog = [elements.teachersDialog, elements.disciplineDialog.dialog]
                .find((dialog) => dialog.open);
            if (openDialog) {
                event.preventDefault();
                openDialog.close();
            }
        }, true);
        elements.search?.addEventListener('input', handleSearch);
        elements.addButton?.addEventListener('click', () => openDisciplinaModal());

        elements.tableBody?.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;
            event.preventDefault();
            const codigo = target.dataset.codigo || target.closest('tr')?.dataset.codigo;
            if (target.dataset.action === 'edit') {
                const disciplina = state.disciplinas.find((item) => item.codigo === codigo);
                if (disciplina) openDisciplinaModal(disciplina);
            }
            if (target.dataset.action === 'delete') handleDeleteDisciplina(codigo);
            if (target.dataset.action === 'professores') openProfessoresVinculadosModal(codigo);
        });

        handleSearch();
    }

    document.addEventListener('DOMContentLoaded', initDisciplinas);
})();
