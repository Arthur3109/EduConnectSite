/**
 * Gerencia turmas, atribuição de salas e persistência local da tela Secretaria.
 */
(() => {
    'use strict';

    const TURMAS_KEY = 'educonnect_turmas';
    const SALAS_KEY = 'educonnect_salas';

    // Dados demonstrativos usados somente quando as chaves ainda não existem.
    const initialTurmas = [
        {
            codigo: '3A-EM',
            nome: '3º Ano A - Matutino',
            serie: '3º Ensino Médio',
            turno: 'Matutino',
            salaId: 'sala-101',
            capacidade: 40,
            alunos: 35,
            ativa: true
        },
        {
            codigo: '3B-EM',
            nome: '3º Ano B - Matutino',
            serie: '3º Ensino Médio',
            turno: 'Matutino',
            salaId: 'sala-102',
            capacidade: 40,
            alunos: 38,
            ativa: true
        }
    ];

    const initialSalas = [
        { id: 'sala-101', nome: 'Sala 101', capacidade: 40, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
        { id: 'sala-102', nome: 'Sala 102', capacidade: 40, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
        { id: 'sala-103', nome: 'Sala 103', capacidade: 35, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
        { id: 'sala-104', nome: 'Sala 104', capacidade: 30, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
        { id: 'sala-105', nome: 'Sala 105', capacidade: 30, unidade: 'alunos', tipo: 'Sala de aula', permiteTurma: true },
        { id: 'sala-106', nome: 'Sala 106 (Auditório)', capacidade: 100, unidade: 'pessoas', tipo: 'Auditório', permiteTurma: true },
        { id: 'laboratorio-a', nome: 'Laboratório A', capacidade: 30, unidade: 'computadores', tipo: 'Laboratório', permiteTurma: false }
    ];

    // Centraliza o acesso ao LocalStorage e protege a inicialização contra dados inválidos.
    const storageManager = {
        /**
         * Lê uma lista do LocalStorage ou clona os dados padrão quando a chave não existe.
         * @param {string} key Chave do armazenamento.
         * @param {Array<object>} fallback Registros usados na primeira inicialização.
         * @returns {Array<object>} Registros lidos ou os dados padrão.
         */
        read(key, fallback) {
            try {
                const value = localStorage.getItem(key);
                if (value === null) return fallback.map((item) => ({ ...item }));
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : fallback.map((item) => ({ ...item }));
            } catch (error) {
                console.error(`Não foi possível ler ${key} do armazenamento local.`, error);
                return fallback.map((item) => ({ ...item }));
            }
        },

        /**
         * Persiste um valor serializável e apresenta uma mensagem em caso de falha.
         * @param {string} key Chave do armazenamento.
         * @param {Array<object>} value Dados a persistir.
         * @returns {boolean} Indica se a gravação foi concluída.
         */
        write(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error(`Não foi possível salvar ${key} no armazenamento local.`, error);
                showFormMessage('Não foi possível salvar os dados neste navegador. Verifique o espaço disponível.');
                return false;
            }
            return true;
        }
    };

    let turmas;
    let salas;
    let modal;
    let form;
    let currentCode = null;

    /**
     * Atualiza a mensagem de validação abaixo do formulário.
     * @param {string} [message=''] Texto a apresentar ou string vazia para limpar.
     * @returns {void}
     */
    function showFormMessage(message = '') {
        const messageElement = document.querySelector('#turmaFormMessage');
        if (messageElement) messageElement.textContent = message;
    }

    /**
     * Cria um elemento DOM e aplica opcionalmente classe e texto simples.
     * @param {string} tag Nome da tag HTML.
     * @param {string} [className=''] Classe CSS do elemento.
     * @param {string} [text] Conteúdo textual seguro.
     * @returns {HTMLElement} Elemento criado.
     */
    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    /**
     * Localiza uma sala pelo identificador persistido.
     * @param {string} roomId Identificador da sala.
     * @returns {object|undefined} Sala correspondente, se encontrada.
     */
    function getRoomById(roomId) {
        return salas.find((room) => room.id === roomId);
    }

    /**
     * Verifica conflito de atribuição no mesmo turno, ignorando a turma editada.
     * @param {string} roomId Identificador da sala candidata.
     * @param {string} turno Turno solicitado.
     * @param {string|null} [excludedCode=null] Código da turma que está sendo editada.
     * @returns {boolean} Indica se outra turma ativa já ocupa a sala nesse turno.
     */
    function isRoomUnavailable(roomId, turno, excludedCode = null) {
        return turmas.some((turma) => (
            turma.ativa !== false
            && turma.salaId === roomId
            && turma.turno === turno
            && turma.codigo !== excludedCode
        ));
    }

    /**
     * Recalcula ocupações a partir das turmas ativas, persiste ambos os estados e atualiza os cards.
     * @returns {void}
     */
    function updateRoomStatus() {
        salas = salas.map((room) => {
            const occupiedBy = turmas
                .filter((turma) => turma.ativa !== false && turma.salaId === room.id)
                .map((turma) => ({ codigo: turma.codigo, turno: turma.turno }));
            return { ...room, ocupadaPor: occupiedBy };
        });

        storageManager.write(TURMAS_KEY, turmas);
        storageManager.write(SALAS_KEY, salas);
        renderSalasCards();
    }

    /**
     * Renderiza as turmas ativas e seus contadores de alunos/capacidade.
     * @returns {void}
     */
    function renderTurmasTable() {
        const tableBody = document.querySelector('#turmasTabelaBody');
        if (!tableBody) return;

        tableBody.replaceChildren();
        const activeTurmas = turmas.filter((turma) => turma.ativa !== false);

        if (activeTurmas.length === 0) {
            const row = createElement('tr');
            const cell = createElement('td', 'sem-turmas', 'Nenhuma turma ativa cadastrada.');
            cell.colSpan = 7;
            row.append(cell);
            tableBody.append(row);
            return;
        }

        activeTurmas.forEach((turma) => {
            const room = getRoomById(turma.salaId);
            const row = createElement('tr');
            row.dataset.turmaCode = turma.codigo;

            const code = createElement('td');
            code.append(createElement('strong', '', turma.codigo));
            row.append(code);
            row.append(createElement('td', '', turma.nome));
            row.append(createElement('td', '', turma.serie));
            row.append(createElement('td', '', turma.turno));

            const roomCell = createElement('td');
            roomCell.append(createElement('strong', '', room?.nome ?? 'Sala não encontrada'));
            row.append(roomCell);

            row.append(createElement('td', 'contagem-alunos', `${turma.alunos} / ${turma.capacidade}`));

            const actionsCell = createElement('td');
            const manageButton = createElement('button', 'btn', 'Gerenciar');
            manageButton.type = 'button';
            manageButton.dataset.action = 'manage';
            manageButton.setAttribute('aria-label', `Gerenciar turma ${turma.codigo}`);
            actionsCell.append(manageButton);
            row.append(actionsCell);
            tableBody.append(row);
        });
    }

    /**
     * Renderiza os cards de salas com a ocupação derivada das turmas ativas.
     * @returns {void}
     */
    function renderSalasCards() {
        const cardsContainer = document.querySelector('#salasCards');
        if (!cardsContainer) return;

        cardsContainer.replaceChildren();
        salas.forEach((room) => {
            const card = createElement('div', 'sala-card');
            card.dataset.salaId = room.id;
            const icon = createElement('span', 'material-symbols-outlined sala-icone', 'door_open');
            icon.setAttribute('aria-hidden', 'true');
            const info = createElement('div', 'sala-info');
            info.append(createElement('strong', '', room.nome));
            info.append(createElement('p', '', `Capacidade: ${room.capacidade} ${room.unidade}`));

            if (room.ocupadaPor?.length) {
                const occupancyText = room.ocupadaPor
                    .map((assignment) => `${assignment.codigo} · ${assignment.turno}`)
                    .join(', ');
                info.append(createElement('span', 'status-ocupada', `● Ocupada (${occupancyText})`));
            } else {
                info.append(createElement('span', 'status-livre', '● Livre'));
            }

            card.append(icon, info);
            cardsContainer.append(card);
        });
    }

    /**
     * Cria o diálogo reutilizado para cadastro e gerenciamento de turmas.
     * @returns {HTMLDialogElement} Diálogo configurado com seus eventos de formulário.
     */
    function createModal() {
        const dialog = document.createElement('dialog');
        dialog.className = 'modal-turma';
        dialog.setAttribute('aria-labelledby', 'turmaModalTitle');
        dialog.innerHTML = `
            <div class="turma-modal-content">
                <header class="turma-modal-header">
                    <div>
                        <p class="turma-modal-eyebrow">EduConnect · Secretaria</p>
                        <h2 id="turmaModalTitle">Nova Turma</h2>
                    </div>
                    <button class="turma-modal-close" type="button" aria-label="Fechar janela">
                        <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </header>
                <form id="turmaForm" novalidate>
                    <div class="turma-form-grid">
                        <label class="turma-field">
                            <span>Código</span>
                            <input name="codigo" type="text" maxlength="24" required autocomplete="off">
                        </label>
                        <label class="turma-field">
                            <span>Nome da Turma</span>
                            <input name="nome" type="text" maxlength="80" required autocomplete="off">
                        </label>
                        <label class="turma-field">
                            <span>Série</span>
                            <input name="serie" type="text" maxlength="60" required autocomplete="off">
                        </label>
                        <label class="turma-field">
                            <span>Turno</span>
                            <select name="turno" required>
                                <option value="">Selecione o turno</option>
                                <option>Matutino</option>
                                <option>Vespertino</option>
                                <option>Noturno</option>
                                <option>Integral</option>
                            </select>
                        </label>
                        <label class="turma-field">
                            <span>Sala <small>(inclui capacidade máxima)</small></span>
                            <select name="salaId" required>
                                <option value="">Selecione primeiro o turno</option>
                            </select>
                        </label>
                        <label class="turma-field">
                            <span>Capacidade Máxima</span>
                            <input name="capacidade" type="number" min="1" required readonly>
                        </label>
                        <label class="turma-field">
                            <span>Quantidade de Alunos</span>
                            <input name="alunos" type="number" min="0" value="0" required>
                        </label>
                    </div>
                    <p id="turmaFormMessage" class="turma-form-message" role="alert" aria-live="polite"></p>
                    <footer class="turma-modal-actions">
                        <button class="btn-modal-cancel" type="button">Cancelar</button>
                        <button class="btn-modal-save" type="submit">Salvar Turma</button>
                    </footer>
                </form>
            </div>
        `;
        document.body.append(dialog);

        form = dialog.querySelector('#turmaForm');
        dialog.querySelector('.turma-modal-close').addEventListener('click', () => dialog.close());
        dialog.querySelector('.btn-modal-cancel').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) dialog.close();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && dialog.open) {
                event.preventDefault();
                dialog.close();
            }
        }, true);
        dialog.addEventListener('close', () => {
            form.reset();
            currentCode = null;
            showFormMessage();
        });
        form.elements.turno.addEventListener('change', () => {
            updateRoomOptions(form.elements.turno.value);
            form.elements.capacidade.value = getRoomById(form.elements.salaId.value)?.capacidade ?? '';
        });
        form.elements.salaId.addEventListener('change', () => {
            form.elements.capacidade.value = getRoomById(form.elements.salaId.value)?.capacidade ?? '';
        });
        form.elements.alunos.addEventListener('input', () => {
            const max = Number(form.elements.capacidade.value);
            form.elements.alunos.setCustomValidity(
                max && Number(form.elements.alunos.value) > max
                    ? 'A quantidade de alunos não pode exceder a capacidade da sala.'
                    : ''
            );
        });
        form.addEventListener('submit', handleCreateTurma);
        return dialog;
    }

    /**
     * Atualiza as opções de sala para o turno selecionado e a turma em edição.
     * @param {string} turno Turno escolhido no formulário.
     * @param {string} [selectedRoomId=''] Sala já atribuída, se houver.
     * @param {string|null} [excludedCode=currentCode] Turma excluída da checagem de conflito.
     * @returns {void}
     */
    function updateRoomOptions(turno, selectedRoomId = '', excludedCode = currentCode) {
        const roomSelect = form.elements.salaId;
        roomSelect.replaceChildren(new Option(turno ? 'Selecione uma sala disponível' : 'Selecione primeiro o turno', ''));
        // A disponibilidade é calculada por sala e turno; uma ocupação em outro turno não bloqueia a opção.
        const availableRooms = salas.filter((room) => (
            room.permiteTurma !== false
            && turno
            && (!isRoomUnavailable(room.id, turno, excludedCode) || room.id === selectedRoomId)
        ));

        availableRooms.forEach((room) => {
            const capacityUnit = room.unidade === 'alunos' ? 'alunos' : room.unidade;
            const option = new Option(`${room.nome} · até ${room.capacidade} ${capacityUnit}`, room.id);
            roomSelect.add(option);
        });

        if (turno && availableRooms.length === 0) {
            roomSelect.replaceChildren(new Option('Nenhuma sala disponível neste turno', ''));
        }
        roomSelect.value = selectedRoomId;
        roomSelect.disabled = !turno || availableRooms.length === 0;
    }

    /**
     * Preenche e abre o modal em modo de criação ou edição.
     * @param {object|null} [turma=null] Registro existente para editar.
     * @returns {void}
     */
    function openTurmaModal(turma = null) {
        currentCode = turma?.codigo ?? null;
        form.reset();
        showFormMessage();
        document.querySelector('#turmaModalTitle').textContent = turma ? `Gerenciar Turma ${turma.codigo}` : 'Nova Turma';
        form.elements.codigo.value = turma?.codigo ?? '';
        form.elements.codigo.readOnly = Boolean(turma);
        form.elements.nome.value = turma?.nome ?? '';
        form.elements.serie.value = turma?.serie ?? '';
        form.elements.turno.value = turma?.turno ?? '';
        form.elements.alunos.value = turma?.alunos ?? 0;
        updateRoomOptions(form.elements.turno.value, turma?.salaId ?? '', currentCode);
        form.elements.capacidade.value = turma?.capacidade ?? getRoomById(form.elements.salaId.value)?.capacidade ?? '';
        form.elements.alunos.setCustomValidity('');
        modal.showModal();
        requestAnimationFrame(() => form.elements.codigo.focus());
    }

    /**
     * Valida e persiste uma turma nova ou as alterações da turma atual.
     * @param {SubmitEvent} event Evento de envio do formulário.
     * @returns {void}
     */
    function handleCreateTurma(event) {
        event.preventDefault();
        showFormMessage();
        form.elements.alunos.setCustomValidity('');

        if (!form.reportValidity()) return;

        const formData = new FormData(form);
        const turma = {
            codigo: String(formData.get('codigo')).trim(),
            nome: String(formData.get('nome')).trim(),
            serie: String(formData.get('serie')).trim(),
            turno: String(formData.get('turno')).trim(),
            salaId: String(formData.get('salaId')).trim(),
            capacidade: Number(formData.get('capacidade')),
            alunos: Number(formData.get('alunos')),
            ativa: true
        };

        if (turma.alunos > turma.capacidade) {
            form.elements.alunos.setCustomValidity('A quantidade de alunos não pode exceder a capacidade da sala.');
            form.elements.alunos.reportValidity();
            return;
        }

        // O código é único independentemente de maiúsculas/minúsculas; a própria turma pode manter seu código ao editar.
        const duplicate = turmas.some((item) => (
            item.codigo.toLocaleLowerCase('pt-BR') === turma.codigo.toLocaleLowerCase('pt-BR')
            && item.codigo !== currentCode
        ));
        if (duplicate) {
            showFormMessage('Já existe uma turma com esse código.');
            form.elements.codigo.focus();
            return;
        }

        if (isRoomUnavailable(turma.salaId, turma.turno, currentCode)) {
            showFormMessage('Essa sala já está ocupada por outra turma neste turno. Selecione outra sala ou turno.');
            updateRoomOptions(turma.turno, '', currentCode);
            form.elements.salaId.focus();
            return;
        }

        if (currentCode) {
            const index = turmas.findIndex((item) => item.codigo === currentCode);
            if (index >= 0) turmas[index] = { ...turmas[index], ...turma };
        } else {
            turmas.push(turma);
        }

        if (!storageManager.write(TURMAS_KEY, turmas)) return;
        updateRoomStatus();
        renderTurmasTable();
        modal.close();
    }

    /**
     * Inicializa o estado, associa os eventos e renderiza a tela de turmas e salas.
     * @returns {void}
     */
    function initTurmasSalas() {
        turmas = storageManager.read(TURMAS_KEY, initialTurmas).map((turma) => ({
            ...turma,
            codigo: String(turma.codigo ?? '').trim(),
            ativa: turma.ativa !== false,
            alunos: Number(turma.alunos ?? 0),
            capacidade: Number(turma.capacidade ?? 0)
        }));
        salas = storageManager.read(SALAS_KEY, initialSalas).map((room) => ({
            ...room,
            ocupadaPor: Array.isArray(room.ocupadaPor) ? room.ocupadaPor : []
        }));

        const createButton = document.querySelector('.btn-novo');
        if (createButton) {
            createButton.type = 'button';
            createButton.addEventListener('click', () => openTurmaModal());
        }

        const tableBody = document.querySelector('#turmasTabelaBody');
        tableBody?.addEventListener('click', (event) => {
            const button = event.target.closest('[data-action="manage"]');
            if (!button) return;
            const turma = turmas.find((item) => item.codigo === button.closest('tr')?.dataset.turmaCode);
            if (turma) openTurmaModal(turma);
        });

        modal = createModal();
        updateRoomStatus();
        renderTurmasTable();
    }

    document.addEventListener('DOMContentLoaded', initTurmasSalas);
})();
