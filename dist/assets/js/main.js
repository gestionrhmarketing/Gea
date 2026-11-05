// Manejo de navegación interactiva, menú móvil, accesibilidad y encabezado dinámico
(function() {
  'use strict';

  // 1. Detección de scroll para sombra en cabecera
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 2. Menú de navegación móvil accesible
  const navToggle = document.querySelector('[data-nav-toggle]');
  const primaryNav = document.querySelector('[data-nav]');

  if (navToggle && primaryNav) {
    const updateNavTop = () => {
      if (header) {
        const rect = header.getBoundingClientRect();
        document.documentElement.style.setProperty('--nav-top', `${rect.bottom}px`);
      }
    };

    const toggleNav = (open) => {
      const willOpen = open !== undefined ? open : !primaryNav.classList.contains('is-open');
      primaryNav.classList.toggle('is-open', willOpen);
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      document.body.classList.toggle('nav-open', willOpen);
      if (willOpen) updateNavTop();
    };

    navToggle.addEventListener('click', () => toggleNav());

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && primaryNav.classList.contains('is-open')) {
        toggleNav(false);
      }
    }, { passive: true });

    // Cerrar menú móvil al presionar Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && primaryNav.classList.contains('is-open')) {
        toggleNav(false);
        navToggle.focus();
      }
    });
  }

  // 3. Submenú desplegable de servicios (accesibilidad teclado y touch)
  const subItems = document.querySelectorAll('[data-sub]');
  subItems.forEach((sub) => {
    const toggleBtn = sub.querySelector('[data-sub-toggle]');
    const subMenu = sub.querySelector('.sub-menu');

    if (toggleBtn && subMenu) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = sub.classList.contains('is-open');
        sub.classList.toggle('is-open', !isOpen);
        toggleBtn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      });

      // Cerrar al salir con tabulador
      sub.addEventListener('focusout', (e) => {
        if (!sub.contains(e.relatedTarget)) {
          sub.classList.remove('is-open');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  });

})();
