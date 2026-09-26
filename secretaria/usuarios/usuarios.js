/**
 * Controla a gestão local de alunos, professores e profissionais da Secretaria.
 */
(() => {
    'use strict';

    const PAGE_SIZE = 5;
    const STORAGE_PREFIX = 'educonnect_usuarios_';

    const CATEGORIES = {
        alunos: {
            name: 'Aluno',
            plural: 'Alunos',
            pageTitle: 'Gestão de Alunos',
            searchPlaceholder: 'Buscar aluno por nome, matrícula ou CPF...',
            codeLabel: 'Matrícula',
            /** @returns {string} Prefixo anual usado na matrícula do aluno. */
            codePrefix: () => String(new Date().getFullYear()),
            codeDigits: 4,
            columns: [
                { label: 'Matrícula', key: 'codigo' },
                { label: 'Nome Completo', key: 'nome' },
                { label: 'Turma', key: 'turma' },
                { label: 'Série', key: 'serie' },
                { label: 'Status', key: 'status' },
                { label: 'Ações', key: 'acoes' }
            ],
            fields: [
                { key: 'nome', label: 'Nome Completo', required: true },
                { key: 'cpf', label: 'CPF', required: false },
                { key: 'turma', label: 'Turma', required: true },
                { key: 'serie', label: 'Série', required: true },
                { key: 'status', label: 'Status', type: 'status', required: true }
            ],
            filters: [
                { key: 'turma', label: 'Turma', allLabel: 'Todas' },
                { key: 'serie', label: 'Série', allLabel: 'Todas' },
                { key: 'status', label: 'Status', allLabel: 'Todos' }
            ],
            mockData: [
                { codigo: '20240001', nome: 'Amanda Costa Nogueira', cpf: '000.000.000-01', turma: '3º Ano A', serie: 'Ensino Médio', status: 'Ativo' },
                { codigo: '20240002', nome: 'Bruno Fernandes de Souza', cpf: '000.000.000-02', turma: '3º Ano B', serie: 'Ensino Médio', status: 'Ativo' },
                { codigo: '20230142', nome: 'Camila Rodrigues Pinheiro', cpf: '000.000.000-03', turma: '2º Ano A', serie: 'Ensino Médio', status: 'Inativo' },
                { codigo: '20240003', nome: 'Daniel Alves Mendes', cpf: '000.000.000-04', turma: '1º Ano B', serie: 'Ensino Médio', status: 'Ativo' },
                { codigo: '20220311', nome: 'Eduardo Silva Pereira', cpf: '000.000.000-05', turma: '3º Ano A', serie: 'Ensino Médio', status: 'Ativo' },
                { codigo: '20240004', nome: 'Fernanda Lima de Souza', cpf: '000.000.000-06', turma: '2º Ano C', serie: 'Ensino Médio', status: 'Inativo' },
                { codigo: '20260005', nome: 'Gustavo Henrique Martins', cpf: '000.000.000-07', turma: '1º Ano A', serie: 'Ensino Médio', status: 'Ativo' }
            ]
        },
        professores: {
            name: 'Professor',
            plural: 'Professores',
            pageTitle: 'Gestão de Professores',
            searchPlaceholder: 'Buscar professor por nome, ID, disciplina ou CPF...',
            codeLabel: 'ID / Registro',
            /** @returns {string} Prefixo anual usado no registro do professor. */
            codePrefix: () => `PROF${new Date().getFullYear()}`,
            codeDigits: 3,
            columns: [
                { label: 'ID / Registro', key: 'codigo' },
                { label: 'Nome Completo', key: 'nome' },
                { label: 'Disciplina', key: 'disciplina' },
                { label: 'Turmas Atribuídas', key: 'turmas' },
                { label: 'Status', key: 'status' },
                { label: 'Ações', key: 'acoes' }
            ],
            fields: [
                { key: 'nome', label: 'Nome Completo', required: true },
                { key: 'cpf', label: 'CPF', required: false },
                { key: 'disciplina', label: 'Disciplina', required: true },
                { key: 'turmas', label: 'Turmas Atribuídas', required: true, wide: true },
                { key: 'status', label: 'Status', type: 'status', required: true }
            ],
            filters: [
                { key: 'disciplina', label: 'Disciplina', allLabel: 'Todas' },
                { key: 'turma', label: 'Turma', allLabel: 'Todas' },
                { key: 'status', label: 'Status', allLabel: 'Todos' }
            ],
            mockData: [
                { codigo: 'PROF202101', nome: 'Carlos Eduardo Souza', cpf: '000.000.000-11', disciplina: 'Matemática', turmas: '1º Ano A, 2º Ano B', status: 'Ativo' },
                { codigo: 'PROF201915', nome: 'Juliana Ribeiro Santos', cpf: '000.000.000-12', disciplina: 'Português', turmas: '3º Ano A, 3º Ano B', status: 'Ativo' },
                { codigo: 'PROF202208', nome: 'Roberto Alves de Lima', cpf: '000.000.000-13', disciplina: 'História', turmas: '1º Ano B, 2º Ano C', status: 'Ativo' },
                { codigo: 'PROF201804', nome: 'Mariana Costa Pinto', cpf: '000.000.000-14', disciplina: 'Biologia', turmas: '2º Ano A, 3º Ano A', status: 'Inativo' },
                { codigo: 'PROF202302', nome: 'Silvia Martins Ferreira', cpf: '000.000.000-15', disciplina: 'Química', turmas: '1º Ano A, 3º Ano B', status: 'Ativo' },
                { codigo: 'PROF202117', nome: 'Pedro Henrique Almeida', cpf: '000.000.000-16', disciplina: 'Física', turmas: '2º Ano B, 3º Ano C', status: 'Ativo' }
            ]
        },
        profissionais: {
            name: 'Profissional',
            plural: 'Profissionais',
            pageTitle: 'Gestão de Profissionais',
            searchPlaceholder: 'Buscar profissional por nome, ID, cargo ou CPF...',
            codeLabel: 'ID / Registro',
            /** @returns {string} Prefixo anual usado no registro profissional. */
            codePrefix: () => `EMP${new Date().getFullYear()}`,
            codeDigits: 3,
            columns: [
                { label: 'ID / Registro', key: 'codigo' },
                { label: 'Nome Completo', key: 'nome' },
                { label: 'Cargo', key: 'cargo' },
                { label: 'Departamento', key: 'departamento' },
                { label: 'Status', key: 'status' },
                { label: 'Ações', key: 'acoes' }
            ],
            fields: [
                { key: 'nome', label: 'Nome Completo', required: true },
                { key: 'cpf', label: 'CPF', required: false },
                { key: 'cargo', label: 'Cargo', required: true },
                { key: 'departamento', label: 'Departamento', required: true, wide: true },
                { key: 'status', label: 'Status', type: 'status', required: true }
            ],
            filters: [
                { key: 'cargo', label: 'Cargo', allLabel: 'Todos' },
                { key: 'departamento', label: 'Departamento', allLabel: 'Todos' },
                { key: 'status', label: 'Status', allLabel: 'Todos' }
            ],
            mockData: [
                { codigo: 'EMP202005', nome: 'Patricia Oliveira Martins', cpf: '000.000.000-21', cargo: 'Coordenadora Pedagógica', departamento: 'Coordenação', status: 'Ativo' },
                { codigo: 'EMP202112', nome: 'Marcos Vinicius Rocha', cpf: '000.000.000-22', cargo: 'Orientador Educacional', departamento: 'Orientação', status: 'Ativo' },
                { codigo: 'EMP201903', nome: 'Ana Beatriz Souza', cpf: '000.000.000-23', cargo: 'Secretária Escolar', departamento: 'Administrativo', status: 'Ativo' },
                { codigo: 'EMP202245', nome: 'Lucas Gabriel Mendes', cpf: '000.000.000-24', cargo: 'Psicólogo Escolar', departamento: 'Atendimento Psico-pedagógico', status: 'Inativo' },
                { codigo: 'EMP202011', nome: 'Renata Alves Costa', cpf: '000.000.000-25', cargo: 'Bibliotecária', departamento: 'Biblioteca', status: 'Ativo' },
                { codigo: 'EMP202310', nome: 'Sergio Batista Lima', cpf: '000.000.000-26', cargo: 'Inspetor Escolar', departamento: 'Inspeção', status: 'Ativo' }
            ]
        }
    };

    /**
     * Normaliza texto para busca sem diferenciar acentos, caixa ou espaços externos.
     * @param {string|number|null|undefined} value Valor recebido.
     * @returns {string} Texto normalizado para comparação.
     */
    const normalizeText = (value) => String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLocaleLowerCase('pt-BR');

    /**
     * Cria uma chave interna estável a partir da categoria e do código público.
     * @param {string} type Categoria do registro.
     * @param {string} codigo Matrícula ou identificador.
     * @returns {string} Identificador único local.
     */
    const makeUid = (type, codigo) => `${type}-${codigo}`;

    /**
     * Converte registros legados para o formato comum usado pelas três categorias.
     * @param {string} type Categoria do registro.
     * @param {object} record Registro bruto ou legado.
     * @returns {object} Registro normalizado.
     */
    const normalizeRecord = (type, record) => {
        const normalized = { ...record };
        normalized.codigo = String(record.codigo ?? record.matricula ?? record.id ?? '');
        normalized.nome = String(record.nome ?? record.nomeCompleto ?? '');
        normalized.cpf = String(record.cpf ?? '');
        normalized.status = record.status === 'Inativo' ? 'Inativo' : 'Ativo';
        normalized.uid = String(record.uid ?? makeUid(type, normalized.codigo));
        return normalized;
    };

    const storageManager = {
        /**
         * Carrega uma categoria e inicializa seus mocks se a chave ainda não existir.
         * @param {'alunos'|'professores'|'profissionais'} type Categoria consultada.
         * @returns {object[]} Registros normalizados da categoria.
         */
        get(type) {
            const key = `${STORAGE_PREFIX}${type}`;
            try {
                const stored = localStorage.getItem(key);
                if (stored !== null) {
                    const records = JSON.parse(stored);
                    return Array.isArray(records) ? records.map((record) => normalizeRecord(type, record)) : [];
                }

                let records = CATEGORIES[type].mockData.map((record) => normalizeRecord(type, record));
                // Migra os cadastros do script antigo de alunos sem duplicar matrículas já presentes nos mocks.
                if (type === 'alunos') records = this.mergeLegacyStudents(records);
                this.set(type, records);
                return records;
            } catch (error) {
                console.error(`Não foi possível carregar ${type} do LocalStorage.`, error);
                return CATEGORIES[type].mockData.map((record) => normalizeRecord(type, record));
            }
        },

        /**
         * Persiste os registros normalizados de uma categoria.
         * @param {'alunos'|'professores'|'profissionais'} type Categoria gravada.
         * @param {object[]} records Registros atualizados.
         * @returns {void}
         */
        set(type, records) {
            try {
                localStorage.setItem(`${STORAGE_PREFIX}${type}`, JSON.stringify(records));
            } catch (error) {
                console.error(`Não foi possível salvar ${type} no LocalStorage.`, error);
            }
        },

        /**
         * Mescla dados da chave legada de alunos aos mocks, preservando registros únicos.
         * @param {object[]} mockData Dados iniciais da categoria.
         * @returns {object[]} Mocks combinados com registros legados não duplicados.
         */
        mergeLegacyStudents(mockData) {
            try {
                const legacy = JSON.parse(localStorage.getItem('educonnect_alunos') || '[]');
                if (!Array.isArray(legacy) || legacy.length === 0) return mockData;
                const combined = [...mockData];
                // Usa o código normalizado como chave de deduplicação para não perder cadastros anteriores.
                legacy.map((record) => normalizeRecord('alunos', record)).forEach((record) => {
                    if (!combined.some((item) => item.codigo === record.codigo)) combined.push(record);
                });
                return combined;
            } catch {
                return mockData;
            }
        }
    };

    Object.keys(CATEGORIES).forEach((category) => storageManager.get(category));

    /**
     * Determina qual categoria está ativa pela aba marcada ou pela rota aberta.
     * @returns {'alunos'|'professores'|'profissionais'} Categoria atual.
     */
    const getPageType = () => {
        const activeTab = document.querySelector('.aba.ativa[data-category]');
        if (activeTab && CATEGORIES[activeTab.dataset.category]) return activeTab.dataset.category;
        if (window.location.pathname.includes('/professor/')) return 'professores';
        if (window.location.pathname.includes('/profissionais/')) return 'profissionais';
        return 'alunos';
    };

    const type = getPageType();
    const config = CATEGORIES[type];
    const records = storageManager.get(type);
    const state = { query: '', filters: {}, page: 1 };

    const elements = {
        title: document.querySelector('.cabecalho-pagina h1'),
        createButton: document.querySelector('.btn-novo'),
        search: document.querySelector('.barra-busca input'),
        searchButton: document.querySelector('.btn-buscar'),
        selectors: [...document.querySelectorAll('.seletores select')],
        table: document.querySelector('.tabela'),
        tableHead: document.querySelector('.tabela thead tr'),
        tableBody: document.querySelector('.tabela tbody'),
        pagination: document.querySelector('.paginacao')
    };

    /**
     * Sincroniza estado visual das abas e os textos específicos da categoria.
     * @returns {void}
     */
    function initTabs() {
        document.querySelectorAll('.aba').forEach((tab) => {
            const isActive = tab.dataset.category === type || tab.classList.contains('ativa');
            tab.classList.toggle('ativa', isActive);
            if (isActive) tab.setAttribute('aria-current', 'page');
            else tab.removeAttribute('aria-current');
        });

        if (elements.title) elements.title.textContent = config.pageTitle;
        if (elements.createButton) elements.createButton.textContent = `+ Novo ${config.name}`;
        if (elements.search) elements.search.placeholder = config.searchPlaceholder;
    }

    /**
     * Extrai valores únicos dos registros para popular um filtro.
     * @param {{key: string}} filter Definição do filtro da categoria atual.
     * @returns {string[]} Opções classificadas para o select.
     */
    function getFilterOptions(filter) {
        const values = new Set();
        records.forEach((record) => {
            const value = record[filter.key];
            if (filter.key === 'turma' && type === 'professores') {
                String(record.turmas || '').split(',').forEach((item) => {
                    if (item.trim()) values.add(item.trim());
                });
            } else if (value) {
                values.add(String(value));
            }
        });
        return [...values].sort((first, second) => first.localeCompare(second, 'pt-BR'));
    }

    /**
     * Atualiza opções dos selects e remove seleções que deixaram de existir nos dados.
     * @returns {void}
     */
    function refreshFilterOptions() {
        elements.selectors.forEach((select, index) => {
            const filter = config.filters[index];
            if (!filter) return;

            const selectedValue = state.filters[filter.key] || '';
            const options = getFilterOptions(filter);
            // Mantém a seleção válida após mudanças nos registros e limpa filtros obsoletos.
            if (selectedValue && !options.includes(selectedValue)) state.filters[filter.key] = '';

            select.replaceChildren(new Option(`${filter.label}: ${filter.allLabel}`, ''));
            options.forEach((optionValue) => select.add(new Option(optionValue, optionValue)));
            select.value = state.filters[filter.key] || '';
        });
    }

    /**
     * Conecta busca em tempo real e filtros combináveis da categoria atual.
     * @returns {void}
     */
    function initSearchFilters() {
        if (elements.search) {
            elements.search.id = 'busca-usuarios';
            elements.search.setAttribute('aria-label', `Buscar ${config.plural.toLocaleLowerCase('pt-BR')}`);
            elements.search.addEventListener('input', () => {
                state.query = normalizeText(elements.search.value);
                state.page = 1;
                renderTable();
            });
        }

        if (elements.searchButton && elements.search) {
            elements.searchButton.type = 'button';
            elements.searchButton.addEventListener('click', () => {
                state.query = normalizeText(elements.search.value);
                state.page = 1;
                renderTable();
            });
        }

        elements.selectors.forEach((select, index) => {
            const filter = config.filters[index];
            if (!filter) return;

            select.id = `filtro-${filter.key}`;
            select.dataset.filterKey = filter.key;
            select.setAttribute('aria-label', `${filter.label}: ${filter.allLabel}`);
            select.addEventListener('change', () => {
                state.filters[filter.key] = select.value;
                state.page = 1;
                renderTable();
            });
        });
        refreshFilterOptions();
    }

    /**
     * Aplica a busca textual e todos os filtros selecionados aos registros.
     * @returns {object[]} Registros que satisfazem simultaneamente os critérios ativos.
     */
    function getFilteredRecords() {
        return records.filter((record) => {
            const matchesQuery = !state.query || Object.entries(record)
                .filter(([key]) => key !== 'uid')
                .some(([, value]) => normalizeText(value).includes(state.query));
            if (!matchesQuery) return false;

            // Todos os selects são combinados com AND; turmas de professores são valores separados por vírgula.
            return config.filters.every((filter) => {
                const selected = state.filters[filter.key];
                if (!selected) return true;
                if (filter.key === 'turma' && type === 'professores') {
                    return String(record.turmas || '').split(',').some((item) => normalizeText(item) === normalizeText(selected));
                }
                return normalizeText(record[filter.key]) === normalizeText(selected);
            });
        });
    }

    /**
     * Cria um botão de ação com rótulo acessível e ícone decorativo.
     * @param {string} action Identificador da ação.
     * @param {string} icon Nome do ícone Material Symbols.
     * @param {string} label Texto acessível e tooltip.
     * @returns {HTMLButtonElement} Botão criado.
     */
    function createActionButton(action, icon, label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-acao';
        button.dataset.action = action;
        button.title = label;
        button.setAttribute('aria-label', label);
        const symbol = document.createElement('span');
        symbol.className = 'material-symbols-outlined';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.textContent = icon;
        button.append(symbol);
        return button;
    }

    /**
     * Cria as ações de edição, visualização e alternância de status de uma linha.
     * @param {object} record Registro associado às ações.
     * @returns {HTMLTableCellElement} Célula contendo os botões.
     */
    function renderActions(record) {
        const cell = document.createElement('td');
        cell.className = 'acoes';
        cell.append(
            createActionButton('edit', 'edit', `Editar ${config.name.toLocaleLowerCase('pt-BR')}`),
            createActionButton('view', 'visibility', `Visualizar ${config.name.toLocaleLowerCase('pt-BR')}`),
            createActionButton('toggle-status', 'sync_alt', `Alterar status de ${record.nome}`)
        );
        return cell;
    }

    /**
     * Renderiza uma célula segundo a coluna configurada para a categoria.
     * @param {object} record Registro da linha.
     * @param {{key: string}} column Definição da coluna.
     * @returns {HTMLTableCellElement} Célula renderizada.
     */
    function renderCell(record, column) {
        if (column.key === 'acoes') return renderActions(record);
        const cell = document.createElement('td');
        if (column.key === 'status') {
            const status = document.createElement('span');
            status.className = record.status === 'Ativo' ? 'status-ativo' : 'status-inativo';
            status.textContent = record.status;
            cell.append(status);
        } else {
            const value = record[column.key] ?? '';
            if (column.key === 'codigo') {
                const strong = document.createElement('strong');
                strong.textContent = value;
                cell.append(strong);
            } else {
                cell.textContent = value;
            }
        }
        return cell;
    }

    /**
     * Renderiza navegação limitada à página atual e até quatro vizinhas.
     * @param {number} totalPages Quantidade total de páginas filtradas.
     * @returns {void}
     */
    function renderPagination(totalPages) {
        if (!elements.pagination) return;
        elements.pagination.replaceChildren();

        /**
         * Acrescenta um botão de página acessível à faixa de navegação.
         * @param {string} label Texto visível do botão.
         * @param {number} page Página de destino.
         * @param {{active?: boolean, disabled?: boolean, label?: string}} [options={}] Estado visual e acessível.
         * @returns {void}
         */
        const addPageButton = (label, page, options = {}) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `btn-pag${options.active ? ' ativa' : ''}`;
            button.textContent = label;
            button.dataset.page = String(page);
            button.disabled = options.disabled === true;
            if (options.active) button.setAttribute('aria-current', 'page');
            button.setAttribute('aria-label', options.label || `Página ${page}`);
            elements.pagination.append(button);
        };

        addPageButton('‹', Math.max(1, state.page - 1), { disabled: state.page === 1, label: 'Página anterior' });
        // Mantém no máximo cinco números visíveis e desloca a janela perto do início/fim da lista.
        const start = Math.max(1, Math.min(state.page - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        for (let page = start; page <= end; page += 1) {
            addPageButton(String(page), page, { active: page === state.page });
        }
        addPageButton('›', Math.min(totalPages, state.page + 1), { disabled: state.page === totalPages, label: 'Próxima página' });
    }

    /**
     * Renderiza cabeçalho, página atual dos resultados e navegação correspondente.
     * @returns {void}
     */
    function renderTable() {
        if (!elements.tableHead || !elements.tableBody) return;
        refreshFilterOptions();
        const filteredRecords = getFilteredRecords();
        const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
        // Após filtros/exclusões, impede que o índice atual aponte para uma página inexistente.
        state.page = Math.min(state.page, totalPages);
        const startIndex = (state.page - 1) * PAGE_SIZE;
        const pageRecords = filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);

        elements.tableHead.replaceChildren();
        config.columns.forEach((column) => {
            const heading = document.createElement('th');
            heading.scope = 'col';
            heading.textContent = column.label;
            elements.tableHead.append(heading);
        });

        elements.tableBody.replaceChildren();
        if (pageRecords.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = config.columns.length;
            cell.className = 'sem-resultados';
            cell.textContent = 'Nenhum usuário encontrado com os filtros informados.';
            row.append(cell);
            elements.tableBody.append(row);
        } else {
            pageRecords.forEach((record) => {
                const row = document.createElement('tr');
                row.dataset.id = record.uid;
                row.dataset.codigo = record.codigo;
                config.columns.forEach((column) => row.append(renderCell(record, column)));
                elements.tableBody.append(row);
            });
        }

        renderPagination(totalPages);
    }

    /**
     * Cria o modal reutilizável para cadastro, edição e visualização de registros.
     * @returns {{open: (mode: string, record?: object|null) => void, dialog: HTMLDialogElement}} Controlador do modal.
     */
    function createModal() {
        const dialog = document.createElement('dialog');
        dialog.className = 'modal-usuario';
        dialog.setAttribute('aria-labelledby', 'titulo-modal-usuario');
        dialog.innerHTML = `
            <div class="modal-conteudo">
                <div class="modal-cabecalho">
                    <div>
                        <p class="modal-tipo"></p>
                        <h2 id="titulo-modal-usuario"></h2>
                        <p class="modal-identificador"></p>
                    </div>
                    <button class="modal-fechar" type="button" aria-label="Fechar modal">
                        <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </div>
                <form class="form-usuario">
                    <div class="modal-campos"></div>
                    <div class="modal-acoes">
                        <button class="btn-cancelar" type="button">Cancelar</button>
                        <button class="btn-salvar" type="submit">Salvar</button>
                    </div>
                </form>
            </div>
        `;
        document.body.append(dialog);

        const form = dialog.querySelector('.form-usuario');
        const fieldsContainer = dialog.querySelector('.modal-campos');
        let currentMode = 'create';
        let currentRecord = null;

        /**
         * Prepara e abre o modal no modo solicitado.
         * @param {'create'|'edit'|'view'} mode Operação desejada.
         * @param {object|null} [record=null] Registro selecionado para edição/visualização.
         * @returns {void}
         */
        function open(mode, record = null) {
            currentMode = mode;
            currentRecord = record;
            const isView = mode === 'view';
            dialog.querySelector('.modal-tipo').textContent = config.plural;
            dialog.querySelector('#titulo-modal-usuario').textContent = mode === 'create'
                ? `Novo ${config.name}`
                : mode === 'edit' ? `Editar ${config.name}` : `Dados do ${config.name}`;
            dialog.querySelector('.modal-identificador').textContent = record
                ? `${config.codeLabel}: ${record.codigo}`
                : `${config.codeLabel} gerado automaticamente ao salvar`;
            dialog.querySelector('.btn-cancelar').textContent = isView ? 'Fechar' : 'Cancelar';
            dialog.querySelector('.btn-salvar').hidden = isView;
            fieldsContainer.replaceChildren();

            config.fields.forEach((field, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = `campo-modal${field.wide ? ' campo-modal-largo' : ''}`;
                const label = document.createElement('label');
                const control = field.type === 'status'
                    ? document.createElement('select')
                    : document.createElement('input');
                control.id = `campo-usuario-${field.key}`;
                control.name = field.key;
                if (field.type === 'status') {
                    control.add(new Option('Ativo', 'Ativo'));
                    control.add(new Option('Inativo', 'Inativo'));
                } else {
                    control.type = field.key === 'cpf' ? 'text' : 'text';
                    control.autocomplete = field.key === 'nome' ? 'name' : 'off';
                }
                control.required = field.required;
                control.value = record?.[field.key] ?? (field.key === 'status' ? 'Ativo' : '');
                control.disabled = isView;
                label.htmlFor = control.id;
                label.textContent = field.label;
                wrapper.append(label, control);
                fieldsContainer.append(wrapper);
                if (index === 0 && !isView) requestAnimationFrame(() => control.focus());
            });

            if (!dialog.open) dialog.showModal();
        }

        dialog.querySelector('.modal-fechar').addEventListener('click', () => dialog.close());
        dialog.querySelector('.btn-cancelar').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) dialog.close();
        });
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (currentMode === 'view') return;

            const values = Object.fromEntries(new FormData(form).entries());
            const codigo = currentRecord?.codigo ?? createCode();
            const updatedRecord = {
                ...currentRecord,
                ...values,
                codigo,
                uid: currentRecord?.uid ?? makeUid(type, codigo),
                status: values.status || 'Ativo',
                atualizadoEm: new Date().toISOString()
            };

            if (currentMode === 'edit') {
                const index = records.findIndex((record) => record.uid === currentRecord.uid);
                if (index >= 0) records[index] = updatedRecord;
            } else {
                updatedRecord.criadoEm = new Date().toISOString();
                records.unshift(updatedRecord);
            }

            storageManager.set(type, records);
            state.page = 1;
            renderTable();
            dialog.close();
        });

        dialog.addEventListener('close', () => form.reset());
        return { open, dialog };
    }

    /**
     * Gera o próximo código usando o maior sufixo já registrado no ano atual.
     * @returns {string} Código novo da categoria ativa.
     */
    function createCode() {
        const prefix = config.codePrefix();
        // Usa o maior sufixo existente, evitando colisões após exclusões ou recargas.
        const maxSuffix = records.reduce((maximum, record) => {
            if (!record.codigo.startsWith(prefix)) return maximum;
            const suffix = Number(record.codigo.slice(prefix.length));
            return Number.isFinite(suffix) ? Math.max(maximum, suffix) : maximum;
        }, 0);
        return `${prefix}${String(maxSuffix + 1).padStart(config.codeDigits, '0')}`;
    }

    /**
     * Conecta o botão principal e a delegação das ações da tabela ao modal.
     * @returns {void}
     */
    function initModals() {
        const modal = createModal();
        elements.createButton?.addEventListener('click', () => modal.open('create'));
        elements.tableBody?.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            const row = button.closest('tr[data-id]');
            const record = records.find((item) => item.uid === row?.dataset.id);
            if (!record) return;

            if (button.dataset.action === 'edit') modal.open('edit', record);
            if (button.dataset.action === 'view') modal.open('view', record);
            if (button.dataset.action === 'toggle-status') {
                // Atualiza estado e LocalStorage antes de redesenhar a linha visível.
                record.status = record.status === 'Ativo' ? 'Inativo' : 'Ativo';
                record.atualizadoEm = new Date().toISOString();
                storageManager.set(type, records);
                renderTable();
            }
        });
    }

    /**
     * Conecta a navegação da paginação gerada dinamicamente.
     * @returns {void}
     */
    function initPagination() {
        elements.pagination?.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-page]');
            if (!button || button.disabled) return;
            state.page = Number(button.dataset.page);
            renderTable();
        });
    }

    /**
     * Inicializa abas, filtros, modais, paginação e primeira renderização.
     * @returns {void}
     */
    function init() {
        if (!elements.table || !elements.tableBody) return;
        initTabs();
        initSearchFilters();
        initModals();
        initPagination();
        renderTable();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
