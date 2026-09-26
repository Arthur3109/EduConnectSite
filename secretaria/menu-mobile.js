document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const container = document.querySelector('.container');
    const sidebar = document.querySelector('.sidebar');
    const logo = header?.querySelector('.logo');

    if (!header || !container || !sidebar || !logo) return;

    const toggle = document.createElement('button');
    const icon = document.createElement('span');

    toggle.type = 'button';
    toggle.className = 'menu-toggle';
    toggle.setAttribute('aria-label', 'Abrir menu');
    toggle.setAttribute('aria-expanded', 'false');
    icon.className = 'material-symbols-outlined';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'menu';
    toggle.append(icon);
    logo.after(toggle);

    const setMenuOpen = (open) => {
        container.classList.toggle('menu-aberto', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        icon.textContent = open ? 'close' : 'menu';
    };

    toggle.addEventListener('click', () => {
        setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    sidebar.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setMenuOpen(false);
    });

    window.matchMedia('(min-width: 601px)').addEventListener('change', () => setMenuOpen(false));
});