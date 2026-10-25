/**
 * Compartilha as notificações e preferências visuais em todas as páginas
 * da Secretaria, usando as mesmas coleções locais da dashboard.
 */
(() => {
    'use strict';

    const THEME_KEY = 'educonnect_secretaria_theme';
    const ATESTADOS_KEY = 'educonnect_atestados';

    function createElement(tag, className, text = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function createButton(id, label, icon) {
        const button = createElement('button', 'header-icon-button');
        button.id = id;
        button.type = 'button';
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-haspopup', 'dialog');
        const symbol = createElement('span', 'material-symbols-outlined', icon);
        symbol.setAttribute('aria-hidden', 'true');
        button.append(symbol);
        return button;
    }

    function ensureHeaderControls() {
        const user = document.querySelector('.header .user');
        if (!user) return;

        let notificationsButton = document.getElementById('notifications-button');
        if (!notificationsButton) {
            notificationsButton = createButton('notifications-button', 'Abrir informações importantes', 'notifications');
            const notificationIcon = [...user.querySelectorAll('.material-symbols-outlined')]
                .find((element) => element.textContent.trim() === 'notifications');
            if (notificationIcon) notificationIcon.replaceWith(notificationsButton);
            else user.prepend(notificationsButton);
        }
        if (!notificationsButton.querySelector('.notification-count')) {
            const count = createElement('span', 'notification-count', '0');
            count.id = 'notification-count';
            count.setAttribute('aria-live', 'polite');
            notificationsButton.append(count);
        }

        if (!document.getElementById('settings-button')) {
            const settingsButton = createButton('settings-button', 'Configurações da Secretaria', 'settings');
            const avatar = user.querySelector('.avatar');
            if (avatar) user.insertBefore(settingsButton, avatar);
            else user.append(settingsButton);
        }
    }

    function createDialogHeading(titleId, title, description, closeLabel) {
        const heading = createElement('div', 'dashboard-dialog__heading');
        const text = document.createElement('div');
        text.append(
            createElement('h2', '', title),
            createElement('p', '', description)
        );
        text.querySelector('h2').id = titleId;
        const close = createElement('button', 'dashboard-dialog__close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', closeLabel);
        close.dataset.closeDashboardDialog = '';
        heading.append(text, close);
        return heading;
    }

    function ensureDialogs() {
        if (!document.getElementById('notifications-dialog')) {
            const dialog = createElement('dialog', 'dashboard-dialog');
            dialog.id = 'notifications-dialog';
            dialog.setAttribute('aria-labelledby', 'notifications-title');
            const content = createElement('section', 'dashboard-dialog__content');
            content.append(
                createDialogHeading(
                    'notifications-title',
                    'Informações importantes',
                    'Atestados, ocorrências e comunicados que precisam da atenção da Secretaria.',
                    'Fechar informações'
                )
            );
            const alerts = createElement('div', 'dashboard-alerts');
            alerts.id = 'dashboard-alerts';
            alerts.setAttribute('aria-live', 'polite');
            alerts.append(createElement('p', 'dashboard-empty', 'Carregando informações...'));
            content.append(alerts);
            dialog.append(content);
            document.body.append(dialog);
        }

        if (!document.getElementById('settings-dialog')) {
            const dialog = createElement('dialog', 'dashboard-dialog dashboard-dialog--settings');
            dialog.id = 'settings-dialog';
            dialog.setAttribute('aria-labelledby', 'settings-title');
            const form = createElement('form', 'dashboard-dialog__content');
            form.method = 'dialog';
            form.append(createDialogHeading(
                'settings-title',
                'Personalizar Secretaria',
                'Escolha como deseja visualizar as páginas da Secretaria neste navegador.',
                'Fechar configurações'
            ));
            const setting = createElement('label', 'theme-setting');
            const description = document.createElement('span');
            description.append(
                createElement('strong', '', 'Modo escuro'),
                createElement('span', '', 'Aplica o tema escuro em todas as páginas da Secretaria.')
            );
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.id = 'dashboard-theme-toggle';
            setting.append(description, toggle);
            const actions = createElement('div', 'dashboard-dialog__actions');
            const submit = createElement('button', 'dashboard-dialog__button', 'Concluir');
            submit.type = 'submit';
            actions.append(submit);
            form.append(setting, actions);
            dialog.append(form);
            document.body.append(dialog);
        }
    }

    function createAlert(title, description, date = '') {
        const article = createElement('article', 'dashboard-alert');
        article.append(
            createElement('strong', 'dashboard-alert__title', title),
            createElement('p', 'dashboard-alert__description', description)
        );
        if (date) {
            const timestamp = createElement('time', 'dashboard-alert__date');
            timestamp.dateTime = date;
            const parsedDate = new Date(date);
            timestamp.textContent = Number.isNaN(parsedDate.getTime())
                ? date
                : parsedDate.toLocaleString('pt-BR');
            article.append(timestamp);
        }
        return article;
    }

    function renderAlerts(backend) {
        const list = document.getElementById('dashboard-alerts');
        const count = document.getElementById('notification-count');
        if (!list || !count) return;

        const alerts = [];
        backend.getOccurrences()
            .filter((record) => record && typeof record === 'object'
                && backend.normalizeText(record.status) === 'aberta')
            .slice(0, 5)
            .forEach((record) => alerts.push(createAlert(
                `Ocorrência aberta: ${record.aluno || 'Aluno não identificado'}`,
                [record.tipo, record.gravidade, record.descricao].filter(Boolean).join(' · ')
                    || 'Há uma ocorrência aguardando acompanhamento.',
                record.criadoEm
            )));
        backend.readArray(ATESTADOS_KEY)
            .filter((record) => record && typeof record === 'object'
                && ['enviado', 'pendente', 'em analise'].includes(backend.normalizeText(record.status)))
            .slice(0, 5)
            .forEach((record) => alerts.push(createAlert(
                `Atestado recebido: ${record.professorNome || record.alunoNome || 'Solicitante'}`,
                [record.motivo, record.dataInicio && record.dataFim
                    ? `${record.dataInicio} a ${record.dataFim}`
                    : 'Período não informado'].filter(Boolean).join(' · '),
                record.criadoEm
            )));
        backend.getCommunications()
            .filter((record) => {
                if (!record || typeof record !== 'object'
                    || backend.normalizeText(record.status) !== 'enviado') return false;
                const recipients = Array.isArray(record.destinatarios)
                    ? record.destinatarios
                    : String(record.destinatarios ?? '').split(',');
                return recipients.some((recipient) => {
                    const normalized = backend.normalizeText(recipient);
                    return normalized === 'todos' || normalized === 'secretaria';
                });
            })
            .slice(0, 5)
            .forEach((record) => alerts.push(createAlert(
                record.titulo || 'Comunicado da Secretaria',
                record.texto || 'Comunicado publicado para a Secretaria.',
                record.enviadoEm || record.criadoEm
            )));

        count.textContent = String(alerts.length);
        list.replaceChildren(...alerts);
        if (!alerts.length) {
            list.append(createElement('p', 'dashboard-empty', 'Não há pendências ou avisos importantes no momento.'));
        }
    }

    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) {
            console.error('EduConnect: o núcleo de persistência deve carregar antes dos controles da Secretaria.');
            return;
        }

        ensureHeaderControls();
        ensureDialogs();

        const notificationsButton = document.getElementById('notifications-button');
        const settingsButton = document.getElementById('settings-button');
        const notificationsDialog = document.getElementById('notifications-dialog');
        const settingsDialog = document.getElementById('settings-dialog');
        const themeToggle = document.getElementById('dashboard-theme-toggle');

        function applyTheme(enabled) {
            document.body.classList.toggle('secretaria-dark', enabled);
            if (themeToggle) themeToggle.checked = enabled;
        }

        applyTheme(backend.read(THEME_KEY, false) === true);
        notificationsButton?.addEventListener('click', () => {
            renderAlerts(backend);
            notificationsDialog?.showModal();
        });
        settingsButton?.addEventListener('click', () => settingsDialog?.showModal());
        themeToggle?.addEventListener('change', () => {
            applyTheme(themeToggle.checked);
            backend.write(THEME_KEY, themeToggle.checked);
        });
        document.querySelectorAll('[data-close-dashboard-dialog]').forEach((button) => {
            button.addEventListener('click', () => button.closest('dialog')?.close());
        });

        const notificationKeys = [backend.keys.ocorrencias, backend.keys.comunicados, ATESTADOS_KEY];
        window.addEventListener(backend.eventName, (event) => {
            if (notificationKeys.includes(event.detail?.key)) renderAlerts(backend);
        });
        window.addEventListener('storage', (event) => {
            if (notificationKeys.includes(event.key)) renderAlerts(backend);
        });
        renderAlerts(backend);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
