const socialMenuToggle = document.querySelector('#socialMenuToggle');
const socialMenu = document.querySelector('#socialMenu');

if (socialMenuToggle && socialMenu) {
  const closeSocialMenu = () => {
    socialMenu.hidden = true;
    socialMenuToggle.setAttribute('aria-expanded', 'false');
  };

  socialMenuToggle.addEventListener('click', () => {
    const isOpen = socialMenuToggle.getAttribute('aria-expanded') === 'true';
    socialMenu.hidden = isOpen;
    socialMenuToggle.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.social-menu')) closeSocialMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSocialMenu();
      socialMenuToggle.focus();
    }
  });
}
