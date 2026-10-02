/**
 * 1. Inicializa a gestão de comunicados e mantém a persistência compatível com o backend.
 */
(() => {
    'use strict';

    const STORAGE_KEY = 'educonnect_comunicados';
    const STATIC_KEY = 'comunicados-fixture-2026';
    const RECIPIENTS = ['Alunos', 'Professores', 'Responsáveis'];
    const TYPES = ['Urgente', 'Evento', 'Informativo'];
    const backend = window.EduConnectBackend;

    /* 2. Centraliza leitura, gravação e operações para suportar backend ou localStorage. */
    const service = {
        nowIso() {
            return backend?.nowIso?.() ?? new Date().toISOString();
        },
        createId() {
            return backend?.createId?.('comunicado') ?? `comunicado-${crypto.randomUUID()}`;
        },
        getAll() {
            if (backend?.getCommunications) return backend.getCommunications();
            try {
                const records = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
                return Array.isArray(records) ? records : [];
            } catch (error) {
                console.error('Não foi possível ler os comunicados armazenados.', error);
                return [];
            }
        },
        saveAll(records) {
            if (backend?.saveCommunications) return backend.saveCommunications(records);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                return true;
            } catch (error) {
                console.error('Não foi possível guardar os comunicados.', error);
                window.alert('Não foi possível guardar os dados neste navegador.');
                return false;
            }
        },
        update(id, patch) {
            if (backend?.updateCommunication) return backend.updateCommunication(id, patch);
            const records = this.getAll();
            const index = records.findIndex((record) => record.id === id);
            if (index < 0) return null;
            records[index] = { ...records[index], ...patch, atualizadoEm: this.nowIso() };
            return this.saveAll(records) ? records[index] : null;
        },
        add(values) {
            const now = this.nowIso();
            const record = {
                id: this.createId(),
                ...values,
                criadoEm: now,
                enviadoEm: values.status === 'Enviado' ? now : null,
                historicoEnvios: values.status === 'Enviado' ? [now] : []
            };
            if (backend?.addCommunication) {
                const saved = backend.addCommunication(values);
                return saved ? this.update(saved.id, { historicoEnvios: record.historicoEnvios }) : null;
            }
            const records = this.getAll();
            records.unshift(record);
            return this.saveAll(records) ? record : null;
        },
        resend(record) {
            const now = this.nowIso();
            const history = [...(record.historicoEnvios ?? []), now];
            if (backend?.resendCommunication) {
                const sent = backend.resendCommunication(record.id);
                return sent ? this.update(record.id, { historicoEnvios: history }) : null;
            }
            return this.update(record.id, { status: 'Enviado', enviadoEm: now, historicoEnvios: history });
        }
    };

    /* 3. Converte as linhas iniciais do HTML em dados apenas na primeira execução. */
    function seed() {
        if (service.getAll().length) return;
        const records = [...document.querySelectorAll('.comunicado-card')].map((card) => {
            const status = card.querySelector('.status-envio')?.textContent?.trim() ?? 'Rascunho';
            const dateText = card.querySelector('.data-envio')?.textContent?.trim() ?? '';
            const match = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+às\s+(\d{2}):(\d{2}))?/);
            const sentAt = match
                ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] ?? 0), Number(match[5] ?? 0)).toISOString()
                : null;
            return {
                id: service.createId(),
                titulo: card.querySelector('h2')?.textContent?.trim() ?? '',
                tipo: card.querySelector('.badge')?.textContent?.trim() ?? 'Informativo',
                destinatarios: card.querySelector('.destinatarios strong')?.textContent?.trim() ?? '',
                texto: card.querySelector('.card-texto')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
                status,
                criadoEm: sentAt ?? service.nowIso(),
                enviadoEm: status === 'Enviado' ? sentAt ?? service.nowIso() : null,
                historicoEnvios: status === 'Enviado' && sentAt ? [sentAt] : [],
                __seedKey: STATIC_KEY
            };
        }).filter((record) => record.titulo);
        if (records.length) service.saveAll(records);
    }

    /* 4. Normaliza destinatários antigos e os valores em formato de lista dos formulários. */
    function recipientList(value) {
        const entries = Array.isArray(value) ? value : String(value ?? '').split(',');
        return [...new Set(entries.map((item) => item.trim()).filter((item) => RECIPIENTS.includes(item)))];
    }

    function recipientsLabel(value) {
        const list = recipientList(value);
        return list.length === RECIPIENTS.length ? 'Todos' : list.join(', ') || String(value || '');
    }

    function matchesRecipient(record, recipient) {
        if (!recipient) return true;
        const raw = String(record.destinatarios ?? '');
        return raw === 'Todos' || recipientList(raw).includes(recipient);
    }

    /* 5. Cria e controla modais acessíveis para ler, criar e editar comunicados. */
    function buildDialog(titleText, className = '') {
        const dialog = document.createElement('dialog');
        dialog.className = `comunicado-dialog ${className}`.trim();
        const form = document.createElement('form');
        form.method = 'dialog';
        form.className = 'comunicado-form';
        const title = document.createElement('h2');
        title.textContent = titleText;
        const actions = document.createElement('div');
        actions.className = 'comunicado-dialog__acoes';
        dialog.append(form);
        form.append(title, actions);
        document.body.append(dialog);
        dialog.addEventListener('close', () => dialog.remove());
        return { dialog, form, actions };
    }

    function addCloseButton(actions) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-secundario';
        button.textContent = 'Fechar';
        button.addEventListener('click', (event) => event.currentTarget.closest('dialog').close());
        actions.append(button);
    }

    function openDetails(record) {
        const { dialog, form, actions } = buildDialog('Visualizar Comunicado', 'comunicado-dialog--leitura');
        const type = document.createElement('span');
        type.className = `badge ${typeClass(record.tipo)}`;
        type.textContent = record.tipo;
        const title = document.createElement('h3');
        title.textContent = record.titulo;
        const recipients = document.createElement('p');
        recipients.textContent = `Destinatários: ${recipientsLabel(record.destinatarios)}`;
        const status = document.createElement('p');
        status.textContent = `Estado: ${record.status}`;
        const message = document.createElement('p');
        message.className = 'comunicado-dialog__mensagem';
        message.textContent = record.texto;
        const historyTitle = document.createElement('h3');
        historyTitle.textContent = 'Histórico de envio';
        const history = document.createElement('ul');
        const historyItems = record.historicoEnvios?.length
            ? record.historicoEnvios
            : record.enviadoEm ? [record.enviadoEm] : [];
        if (!historyItems.length) {
            const item = document.createElement('li');
            item.textContent = 'Ainda não foi enviado.';
            history.append(item);
        } else {
            historyItems.forEach((date) => {
                const item = document.createElement('li');
                item.textContent = formatDate(date);
                history.append(item);
            });
        }
        form.insertBefore(type, actions);
        form.insertBefore(title, actions);
        form.insertBefore(recipients, actions);
        form.insertBefore(status, actions);
        form.insertBefore(message, actions);
        form.insertBefore(historyTitle, actions);
        form.insertBefore(history, actions);
        addCloseButton(actions);
        dialog.showModal();
    }

    function openEditor(record, onSave) {
        const isNew = !record;
        const { dialog, form, actions } = buildDialog(isNew ? 'Novo Comunicado' : 'Editar Comunicado');
        const titleLabel = document.createElement('label');
        titleLabel.textContent = 'Título';
        const titleInput = document.createElement('input');
        titleInput.name = 'titulo';
        titleInput.type = 'text';
        titleInput.required = true;
        titleInput.maxLength = 160;
        titleInput.value = record?.titulo ?? '';
        titleLabel.append(titleInput);

        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Tipo';
        const typeSelect = document.createElement('select');
        typeSelect.name = 'tipo';
        TYPES.forEach((type) => typeSelect.add(new Option(type, type)));
        typeSelect.value = record?.tipo ?? 'Informativo';
        typeLabel.append(typeSelect);

        const recipientGroup = document.createElement('fieldset');
        recipientGroup.className = 'destinatarios-opcoes';
        const legend = document.createElement('legend');
        legend.textContent = 'Destinatários';
        recipientGroup.append(legend);
        const selectedRecipients = recipientList(record?.destinatarios === 'Todos' ? RECIPIENTS : record?.destinatarios);
        RECIPIENTS.forEach((recipient) => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'destinatarios';
            checkbox.value = recipient;
            checkbox.checked = selectedRecipients.includes(recipient);
            label.append(checkbox, document.createTextNode(recipient));
            recipientGroup.append(label);
        });

        const messageLabel = document.createElement('label');
        messageLabel.textContent = 'Conteúdo / Mensagem';
        const messageInput = document.createElement('textarea');
        messageInput.name = 'texto';
        messageInput.rows = 7;
        messageInput.required = true;
        messageInput.value = record?.texto ?? '';
        messageLabel.append(messageInput);
        form.insertBefore(titleLabel, actions);
        form.insertBefore(typeLabel, actions);
        form.insertBefore(recipientGroup, actions);
        form.insertBefore(messageLabel, actions);
        addCloseButton(actions);

        if (isNew) {
            addSubmitButton(actions, 'Salvar Rascunho', 'draft', 'btn-secundario');
            addSubmitButton(actions, 'Enviar Agora', 'send');
        } else {
            addSubmitButton(actions, 'Salvar Alterações', 'save');
            if (record.status === 'Rascunho') addSubmitButton(actions, 'Enviar Agora', 'send');
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const selected = [...form.querySelectorAll('input[name="destinatarios"]:checked')].map((input) => input.value);
            if (!selected.length) {
                window.alert('Selecione pelo menos um destinatário.');
                return;
            }
            if (!form.reportValidity()) return;
            const submitter = event.submitter?.value ?? 'save';
            const now = service.nowIso();
            const values = {
                titulo: titleInput.value.trim(),
                tipo: typeSelect.value,
                destinatarios: selected.join(', '),
                texto: messageInput.value.trim()
            };
            let saved;
            if (isNew) {
                saved = service.add({
                    ...values,
                    status: submitter === 'send' ? 'Enviado' : 'Rascunho'
                });
            } else {
                const patch = { ...values };
                if (submitter === 'send') {
                    patch.status = 'Enviado';
                    patch.enviadoEm = now;
                    patch.historicoEnvios = [...(record.historicoEnvios ?? []), now];
                }
                saved = service.update(record.id, patch);
            }
            if (saved) {
                onSave();
                dialog.close();
            }
        });
        dialog.showModal();
    }

    function addSubmitButton(actions, label, value, className = '') {
        const button = document.createElement('button');
        button.type = 'submit';
        button.value = value;
        button.className = className;
        button.textContent = label;
        actions.append(button);
    }

    /* 6. Constrói cartões a partir dos dados e aplica classes de tipo e estado. */
    function typeClass(type) {
        const normalized = normalizeText(type);
        return TYPES.some((item) => normalizeText(item) === normalized) ? normalized : 'informativo';
    }

    function normalizeText(value) {
        return backend?.normalizeText?.(value) ?? String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLocaleLowerCase('pt-BR');
    }

    function formatDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'Data não disponível' : date.toLocaleString('pt-BR');
    }

    function createAction(actions, action, label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = action;
        button.textContent = label;
        actions.append(button);
    }

    /* 7. Configura filtros fixos e executa pesquisa por destinatário, tipo e período. */
    function configureFilters(filters) {
        const definitions = [
            { label: 'Destinatário: Todos', options: RECIPIENTS },
            { label: 'Tipo: Todos', options: TYPES },
            { label: 'Período: Todos', options: ['Últimos 30 dias', 'Últimos 60 dias', 'Este ano'] }
        ];
        filters.forEach((select, index) => {
            const current = select.value;
            const definition = definitions[index];
            if (!definition) return;
            select.replaceChildren(new Option(definition.label, ''));
            definition.options.forEach((value) => select.add(new Option(value, value)));
            select.value = current;
        });
    }

    function isWithinPeriod(record, period) {
        if (!period) return true;
        const reference = new Date(record.enviadoEm || record.criadoEm || 0);
        if (Number.isNaN(reference.getTime())) return false;
        const now = new Date();
        if (period === 'Este ano') return reference.getFullYear() === now.getFullYear();
        const days = period === 'Últimos 30 dias' ? 30 : 60;
        const elapsed = now.getTime() - reference.getTime();
        return elapsed >= 0 && elapsed <= days * 86400000;
    }

    function init() {
        const list = document.querySelector('.lista-comunicados');
        const filters = [...document.querySelectorAll('.painel-filtros select')];
        const filterButton = document.querySelector('.btn-filtrar');
        const newButton = document.querySelector('.btn-novo');
        if (!list) return;
        seed();
        configureFilters(filters);

        function render() {
            const recipient = filters[0]?.value ?? '';
            const type = filters[1]?.value ?? '';
            const period = filters[2]?.value ?? '';
            const records = service.getAll().filter((record) => (
                matchesRecipient(record, recipient)
                && (!type || normalizeText(record.tipo) === normalizeText(type))
                && isWithinPeriod(record, period)
            ));
            list.replaceChildren();
            if (!records.length) {
                const empty = document.createElement('p');
                empty.className = 'comunicados-vazio';
                empty.textContent = 'Nenhum comunicado encontrado.';
                list.append(empty);
                return;
            }

            records.forEach((record) => {
                const card = document.createElement('article');
                card.className = `comunicado-card${record.status === 'Concluído' ? ' comunicado-card--concluido' : ''}`;
                card.dataset.id = record.id;
                const top = document.createElement('div');
                top.className = 'card-topo';
                const titleArea = document.createElement('div');
                titleArea.className = 'card-titulo-area';
                const badge = document.createElement('span');
                badge.className = `badge ${typeClass(record.tipo)}`;
                badge.textContent = record.tipo;
                const title = document.createElement('h2');
                title.textContent = record.titulo;
                titleArea.append(badge, title);
                const info = document.createElement('div');
                info.className = 'card-info-topo';
                const date = document.createElement('span');
                date.className = 'data-envio';
                date.textContent = record.enviadoEm ? `Enviado em: ${formatDate(record.enviadoEm)}` : 'Enviado em: Pendente';
                const status = document.createElement('span');
                status.className = `status-envio ${normalizeText(record.status).replace(/\s+/g, '-')}`;
                status.textContent = record.status;
                info.append(date, status);
                top.append(titleArea, info);

                const message = document.createElement('p');
                message.className = 'card-texto';
                message.textContent = record.texto;
                const footer = document.createElement('div');
                footer.className = 'card-rodape';
                const recipients = document.createElement('span');
                recipients.className = 'destinatarios';
                recipients.textContent = `Destinatários: ${recipientsLabel(record.destinatarios)}`;
                const actions = document.createElement('div');
                actions.className = 'acoes-card';
                if (record.status === 'Enviado' || record.status === 'Rascunho') createAction(actions, 'edit', 'Editar');
                createAction(actions, 'view', 'Visualizar');
                if (record.status === 'Enviado') {
                    createAction(actions, 'resend', 'Reenviar');
                    createAction(actions, 'complete', 'Concluir');
                }
                footer.append(recipients, actions);
                card.append(top, message, footer);
                list.append(card);
            });
        }

        /* 8. Liga as ações dos cartões e confirma reenvio/conclusão antes de persistir. */
        newButton?.addEventListener('click', () => openEditor(null, render));
        filterButton?.addEventListener('click', render);
        filters.forEach((select) => select.addEventListener('change', render));
        list.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            const id = button.closest('.comunicado-card')?.dataset.id;
            const record = service.getAll().find((item) => item.id === id);
            if (!record) return;
            if (button.dataset.action === 'view') openDetails(record);
            if (button.dataset.action === 'edit' && record.status !== 'Concluído') openEditor(record, render);
            if (button.dataset.action === 'resend' && record.status === 'Enviado') {
                if (service.resend(record)) {
                    render();
                    window.alert('Comunicado reenviado com sucesso.');
                }
            }
            if (button.dataset.action === 'complete' && record.status === 'Enviado') {
                if (window.confirm('Concluir este comunicado? Depois de concluído, não poderá ser editado ou reenviado.')) {
                    if (service.update(record.id, { status: 'Concluído', concluidoEm: service.nowIso() })) render();
                }
            }
        });
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
