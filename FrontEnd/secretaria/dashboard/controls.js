/**
 * Compartilha as notificações e preferências visuais em todas as páginas
 * da Secretaria, usando as mesmas coleções locais da dashboard.
 */
(() => {
    'use strict';

    const THEME_KEY = 'educonnect_secretaria_theme';
    const ATESTADOS_KEY = 'educonnect_atestados';
    const NOTIFICATIONS_SEEN_KEY = 'educonnect_notificacoes_vistas';
    const APP_STORAGE_PREFIX = 'educonnect_';
    const GLOBAL_THEME_KEY = 'theme';

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
            const backup = createElement('section', 'backup-setting');
            backup.setAttribute('aria-labelledby', 'backup-title');
            const backupDescription = document.createElement('div');
            backupDescription.append(
                createElement('strong', '', 'Backup dos dados'),
                createElement('p', '', 'Baixe os dados salvos neste navegador em um arquivo JSON. O arquivo pode conter dados pessoais; armazene-o com segurança.')
            );
            backupDescription.querySelector('strong').id = 'backup-title';
            const download = createElement('button', 'dashboard-dialog__button', 'Baixar backup JSON');
            download.id = 'download-backup-button';
            download.type = 'button';
            const status = createElement('p', 'backup-status');
            status.id = 'backup-status';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
            backup.append(backupDescription, download, status);
            actions.append(submit);
            form.append(setting, backup, actions);
            dialog.append(form);
            document.body.append(dialog);
        }
    }

    function downloadBackup() {
        const status = document.getElementById('backup-status');
        try {
            const data = {};
            const invalidJsonValues = {};
            for (let index = 0; index < localStorage.length; index += 1) {
                const key = localStorage.key(index);
                if (!key || (!key.startsWith(APP_STORAGE_PREFIX) && key !== GLOBAL_THEME_KEY)) continue;

                const rawValue = localStorage.getItem(key);
                try {
                    data[key] = JSON.parse(rawValue);
                } catch {
                    invalidJsonValues[key] = rawValue;
                }
            }

            const backup = {
                application: 'EduConnect',
                backupVersion: 1,
                createdAt: new Date().toISOString(),
                data
            };
            if (Object.keys(invalidJsonValues).length) {
                backup.invalidJsonValues = invalidJsonValues;
            }

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = backup.createdAt.replace(/[:.]/g, '-');
            link.href = url;
            link.download = `educonnect-backup-${timestamp}.json`;
            document.body.append(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);

            if (status) {
                status.textContent = Object.keys(invalidJsonValues).length
                    ? 'Backup baixado. Alguns valores foram preservados como texto por não serem JSON válido.'
                    : 'Backup baixado com sucesso.';
            }
        } catch (error) {
            console.error('EduConnect: não foi possível gerar o backup dos dados.', error);
            if (status) status.textContent = 'Não foi possível gerar o backup. Tente novamente.';
        }
    }

    function createAlert(id, title, description, date = '', isSeen = false) {
        const article = createElement('article', 'dashboard-alert');
        article.dataset.notificationId = id;
        article.classList.toggle('dashboard-alert--seen', isSeen);
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
        const markSeen = createElement('button', 'dashboard-alert__mark-seen', isSeen ? 'Vista' : 'Marcar como vista');
        markSeen.type = 'button';
        markSeen.dataset.markNotificationSeen = '';
        markSeen.disabled = isSeen;
        article.append(markSeen);
        return article;
    }

    function renderAlerts(backend) {
        const list = document.getElementById('dashboard-alerts');
        const count = document.getElementById('notification-count');
        if (!list || !count) return;

        const seenValue = backend.read(NOTIFICATIONS_SEEN_KEY, []);
        const seen = new Set(Array.isArray(seenValue) ? seenValue.filter((id) => typeof id === 'string') : []);
        const alerts = [];
        const pushAlert = (record, type, title, description, date) => {
            const stablePart = record.id || record.protocolo || record.titulo || record.aluno || title;
            const id = `${type}:${stablePart}:${date || ''}`;
            alerts.push({
                id,
                element: createAlert(id, title, description, date, seen.has(id))
            });
        };
        backend.getOccurrences()
            .filter((record) => record && typeof record === 'object'
                && ['aberta', 'pendente'].includes(backend.normalizeText(record.status)))
            .slice(0, 5)
            .forEach((record) => pushAlert(
                record,
                'ocorrencia',
                `Ocorrência pendente: ${record.aluno || 'Aluno não identificado'}`,
                [record.tipo, record.gravidade, record.descricao].filter(Boolean).join(' · ')
                    || 'Há uma ocorrência aguardando acompanhamento.',
                record.criadoEm
            ));
        backend.readArray(ATESTADOS_KEY)
            .filter((record) => record && typeof record === 'object'
                && ['enviado', 'pendente', 'em analise', 'recebido'].includes(backend.normalizeText(record.status)))
            .slice(0, 5)
            .forEach((record) => pushAlert(
                record,
                'atestado',
                `Atestado recebido: ${record.professorNome || record.alunoNome || 'Solicitante'}`,
                [record.motivo, record.dataInicio && record.dataFim
                    ? `${record.dataInicio} a ${record.dataFim}`
                    : 'Período não informado'].filter(Boolean).join(' · '),
                record.criadoEm
            ));
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
            .forEach((record) => pushAlert(
                record,
                'comunicado',
                record.titulo || 'Comunicado da Secretaria',
                record.texto || 'Comunicado publicado para a Secretaria.',
                record.enviadoEm || record.criadoEm
            ));

        const unreadAlerts = alerts.filter((alert) => !seen.has(alert.id));
        count.textContent = String(unreadAlerts.length);
        count.hidden = unreadAlerts.length === 0;
        const notificationsButton = document.getElementById('notifications-button');
        notificationsButton?.setAttribute(
            'aria-label',
            `Abrir informações importantes, ${unreadAlerts.length} não lidas`
        );
        const children = [];
        if (unreadAlerts.length) {
            const markAll = createElement('button', 'dashboard-alerts__mark-all', 'Marcar todas como vistas');
            markAll.type = 'button';
            markAll.dataset.markAllNotificationsSeen = '';
            children.push(markAll);
        }
        children.push(...alerts.map((alert) => alert.element));
        list.replaceChildren(...children);
        if (!alerts.length) {
            list.append(createElement('p', 'dashboard-empty', 'Não há pendências ou avisos importantes no momento.'));
        } else if (!unreadAlerts.length) {
            list.prepend(createElement('p', 'dashboard-empty', 'Todas as notificações foram vistas.'));
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
        const downloadBackupButton = document.getElementById('download-backup-button');

        function applyTheme(enabled) {
            document.body.classList.toggle('secretaria-dark', enabled);
            document.documentElement.classList.toggle('secretaria-dark', enabled);
            document.documentElement.dataset.secretariaTheme = enabled ? 'dark' : 'light';
            if (themeToggle) themeToggle.checked = enabled;
        }

        applyTheme(backend.read(THEME_KEY, false) === true);
        notificationsButton?.addEventListener('click', () => {
            renderAlerts(backend);
            notificationsDialog?.showModal();
        });
        document.getElementById('dashboard-alerts')?.addEventListener('click', (event) => {
            const target = event.target;
            const markAll = target.closest('[data-mark-all-notifications-seen]');
            const markOne = target.closest('[data-mark-notification-seen]');
            if (!markAll && !markOne) return;
            const current = backend.read(NOTIFICATIONS_SEEN_KEY, []);
            const seen = new Set(Array.isArray(current) ? current.filter((id) => typeof id === 'string') : []);
            if (markAll) {
                document.querySelectorAll('#dashboard-alerts [data-notification-id]')
                    .forEach((alert) => seen.add(alert.dataset.notificationId));
            } else {
                const alert = markOne.closest('[data-notification-id]');
                if (alert) seen.add(alert.dataset.notificationId);
            }
            if (backend.write(NOTIFICATIONS_SEEN_KEY, [...seen])) {
                renderAlerts(backend);
            } else {
                const feedback = createElement('p', 'dashboard-empty', 'Não foi possível registrar que a notificação foi vista.');
                feedback.setAttribute('role', 'status');
                document.getElementById('dashboard-alerts')?.prepend(feedback);
            }
        });
        settingsButton?.addEventListener('click', () => settingsDialog?.showModal());
        downloadBackupButton?.addEventListener('click', downloadBackup);
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
