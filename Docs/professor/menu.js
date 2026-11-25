(() => {
    'use strict';

    const themeToggle = document.getElementById('themeToggle');

    function applyTheme(enabled) {
        document.body.classList.toggle('professor-dark', enabled);
        document.body.classList.toggle('dark-mode', enabled);
        document.documentElement.classList.toggle('professor-dark', enabled);
        if (themeToggle) {
            themeToggle.setAttribute('aria-pressed', String(enabled));
            themeToggle.setAttribute('aria-label', enabled ? 'Ativar modo claro' : 'Ativar modo escuro');
            const icon = themeToggle.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = enabled ? 'light_mode' : 'dark_mode';
        }
    }

    applyTheme(localStorage.getItem('theme') === 'dark');

    themeToggle?.addEventListener('click', () => {
        const enabled = !document.body.classList.contains('professor-dark');
        applyTheme(enabled);
        localStorage.setItem('theme', enabled ? 'dark' : 'light');
    });

    window.addEventListener('storage', (event) => {
        if (event.key === 'theme') applyTheme(event.newValue === 'dark');
    });
})();