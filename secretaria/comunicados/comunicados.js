/**
 * Implementa cadastro, edição, visualização, reenvio e filtros da tela de Comunicados.
 */
(() => {
    'use strict';

    const STATIC_KEY = 'comunicados-fixture-2026';

    function seed(backend) {
        if (backend.getCommunications().length) return;
        const cards = [...document.querySelectorAll('.comunicado-card')];
        const records = cards.map((card) => ({
            id: backend.createId('comunicado'),
            titulo: card.querySelector('h2')?.textContent?.trim() ?? '',
            tipo: card.querySelector('.badge')?.textContent?.trim() ?? 'Informativo',
            destinatarios: card.querySelector('.destinatarios strong')?.textContent?.trim() ?? 'Todos',
            texto: card.querySelector('.card-texto')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
            status: card.querySelector('.status-envio')?.textContent?.trim() ?? 'Rascunho',
            criadoEm: backend.nowIso(),
            enviadoEm: card.querySelector('.data-envio')?.textContent?.includes('Pendente') ? null : backend.nowIso(),
            __seedKey: STATIC_KEY
        }));
        if (records.length) backend.saveCommunications(records);
    }

    function dialogFor(backend, mode, record, refresh) {
        const dialog = document.createElement('dialog');
        const isView = mode === 'view';
        dialog.innerHTML = `
            <form style="display:grid;gap:14px;min-width:min(650px,92vw);padding:24px">
                <h2>${mode === 'create' ? 'Novo Comunicado' : mode === 'edit' ? 'Editar Comunicado' : 'Visualizar Comunicado'}</h2>
                <label>Título<input name="titulo" value="${escapeAttribute(record?.titulo ?? '')}" required ${isView ? 'disabled' : ''}></label>
                <label>Tipo<select name="tipo" ${isView ? 'disabled' : ''}>
                    ${['Informativo', 'Evento', 'Urgente'].map((value) => `<option ${value === (record?.tipo ?? '') ? 'selected' : ''}>${value}</option>`).join('')}
                </select></label>
                <label>Destinatários<input name="destinatarios" value="${escapeAttribute(record?.destinatarios ?? 'Todos')}" required ${isView ? 'disabled' : ''}></label>
                <label>Texto<textarea name="texto" rows="7" required ${isView ? 'disabled' : ''}>${escapeText(record?.texto ?? '')}</textarea></label>
                <label>Status<select name="status" ${isView ? 'disabled' : ''}>
                    <option ${record?.status === 'Rascunho' || !record ? 'selected' : ''}>Rascunho</option>
                    <option ${record?.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                </select></label>
                <div style="display:flex;justify-content:flex-end;gap:10px">
                    <button type="button" data-close>Fechar</button>
                    ${isView ? '' : '<button type="submit">Salvar</button>'}
                </div>
            </form>`;
        document.body.append(dialog);
        dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
        dialog.addEventListener('submit', (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget).entries());
            let saved;
            if (mode === 'create') saved = backend.addCommunication(values);
            else saved = backend.updateCommunication(record.id, values);
            if (saved) {
                refresh();
                dialog.close();
            }
        });
        return dialog;
    }

    function escapeAttribute(value) {
        return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escapeText(value) {
        return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function init() {
        const backend = window.EduConnectBackend;
        if (!backend) return;
        const list = document.querySelector('.lista-comunicados');
        const filters = [...document.querySelectorAll('.painel-filtros select')];
        const filterButton = document.querySelector('.btn-filtrar');
        const newButton = document.querySelector('.btn-novo');
        if (!list) return;

        seed(backend);

        function render() {
            const records = backend.getCommunications().filter((record) => {
                const recipient = filters[0]?.value || '';
                const type = filters[1]?.value || '';
                const period = filters[2]?.value || '';
                const withinPeriod = !period || period.includes('Todos') || (() => {
                    const days = Number(period.match(/(\d+)/)?.[1]);
                    if (!Number.isFinite(days)) return true;
                    const date = new Date(record.enviadoEm || record.criadoEm);
                    return (Date.now() - date.getTime()) <= days * 86400000;
                })();
                return (!recipient || record.destinatarios === recipient)
                    && (!type || backend.normalizeText(record.tipo) === backend.normalizeText(type))
                    && withinPeriod;
            });

            list.replaceChildren();
            records.forEach((record) => {
                const card = document.createElement('div');
                card.className = 'comunicado-card';
                card.dataset.id = record.id;
                const topo = document.createElement('div'); topo.className = 'card-topo';
                const titleArea = document.createElement('div'); titleArea.className = 'card-titulo-area';
                const badge = document.createElement('span'); badge.className = `badge ${backend.normalizeText(record.tipo).replace(/\s+/g, '-')}`; badge.textContent = record.tipo;
                const title = document.createElement('h2'); title.textContent = record.titulo;
                titleArea.append(badge, title);
                const info = document.createElement('div'); info.className = 'card-info-topo';
                const date = document.createElement('span'); date.className = 'data-envio'; date.textContent = record.enviadoEm ? `Enviado em: ${new Date(record.enviadoEm).toLocaleString('pt-BR')}` : 'Enviado em: Pendente';
                const status = document.createElement('span'); status.className = `status-envio ${record.status === 'Enviado' ? 'enviado' : 'rascunho'}`; status.textContent = record.status;
                info.append(date, status); topo.append(titleArea, info);
                const text = document.createElement('p'); text.className = 'card-texto'; text.textContent = record.texto;
                const footer = document.createElement('div'); footer.className = 'card-rodape';
                const recipients = document.createElement('span'); recipients.className = 'destinatarios'; recipients.textContent = 'Destinatários: ';
                const strong = document.createElement('strong'); strong.textContent = record.destinatarios; recipients.append(strong);
                const actions = document.createElement('div'); actions.className = 'acoes-card';
                [['edit', 'Editar'], ['view', 'Visualizar'], ['resend', 'Reenviar']].forEach(([action, label]) => {
                    const link = document.createElement('a'); link.href = '#'; link.dataset.action = action; link.textContent = label; actions.append(link);
                });
                footer.append(recipients, actions); card.append(topo, text, footer); list.append(card);
            });
        }

        newButton?.addEventListener('click', () => dialogFor(backend, 'create', null, render).showModal());
        filterButton?.addEventListener('click', render);
        filters.forEach((select) => select.addEventListener('change', render));
        list.addEventListener('click', (event) => {
            const link = event.target.closest('a[data-action]');
            if (!link) return;
            event.preventDefault();
            const card = link.closest('.comunicado-card');
            const record = backend.getCommunications().find((item) => item.id === card?.dataset.id);
            if (!record) return;
            if (link.dataset.action === 'view') dialogFor(backend, 'view', record, render).showModal();
            if (link.dataset.action === 'edit') dialogFor(backend, 'edit', record, render).showModal();
            if (link.dataset.action === 'resend' && backend.resendCommunication(record.id)) render();
        });

        const recipientValues = [...new Set(backend.getCommunications().map((item) => item.destinatarios).filter(Boolean))];
        if (filters[0]) {
            const current = filters[0].value;
            filters[0].replaceChildren(new Option('Destinatário: Todos', ''));
            recipientValues.forEach((value) => filters[0].add(new Option(value, value)));
            filters[0].value = current;
        }
        if (filters[1]) {
            const current = filters[1].value;
            const types = [...new Set(backend.getCommunications().map((item) => item.tipo).filter(Boolean))];
            filters[1].replaceChildren(new Option('Tipo: Todos', ''));
            types.forEach((value) => filters[1].add(new Option(value, value)));
            filters[1].value = current;
        }
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
