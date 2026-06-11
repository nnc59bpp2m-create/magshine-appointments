// Full-Screen Minimalist Navigation
class FullScreenNav {
  constructor() {
    this.isOpen = false;
    this.navOverlay = null;
    this.links = [
      { href: '#hero', label: 'HOME', delay: 0 },
      { href: '#studio', label: 'IN THE STUDIO', delay: 0.08 },
      { href: '#street', label: 'ON THE STREET', delay: 0.16 },
      { href: '#gallery', label: 'GALLERY', delay: 0.24 },
      { href: '#booking', label: 'BOOK NOW', delay: 0.32 },
    ];
    this.init();
  }

  init() {
    this.createOverlay();
    this.bindEvents();
  }

  createOverlay() {
    this.navOverlay = document.createElement('div');
    this.navOverlay.className = 'fixed inset-0 z-[100] opacity-0 pointer-events-none transition-opacity duration-400';
    this.navOverlay.innerHTML = `
      <div class="absolute inset-0 bg-black/95 backdrop-blur-sm"></div>
      <div class="relative z-10 h-full flex items-center justify-center px-8">
        <nav class="text-center">
          <ul class="space-y-6" id="nav-links"></ul>
        </nav>
      </div>
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-sm text-white/50" id="nav-social"></div>
    `;
    document.body.appendChild(this.navOverlay);
    this.renderLinks();
    this.renderSocial();
  }

  renderLinks() {
    const list = this.navOverlay.querySelector('#nav-links');
    list.innerHTML = this.links.map((link, i) => `
      <li style="--delay: ${link.delay}s">
        <a href="${link.href}" class="nav-link block text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-white/0 hover:text-white transition-all duration-700 ease-expo-out transform translate-y-20 opacity-0"
           style="transition-delay: calc(var(--delay) * 1000ms + ${i * 80}ms)">
          ${link.label}
        </a>
      </li>
    `).join('');
  }

  renderSocial() {
    const social = this.navOverlay.querySelector('#nav-social');
    social.innerHTML = `
      <a href="https://instagram.com" target="_blank" rel="noopener" class="nav-social-link hover:text-[var(--accent)] transition-colors">IG</a>
      <span class="w-1 h-1 rounded-full bg-white/20"></span>
      <a href="https://youtube.com" target="_blank" rel="noopener" class="nav-social-link hover:text-[var(--accent)] transition-colors">YT</a>
      <span class="w-1 h-1 rounded-full bg-white/20"></span>
      <a href="https://tiktok.com" target="_blank" rel="noopener" class="nav-social-link hover:text-[var(--accent)] transition-colors">TT</a>
    `;
  }

  bindEvents() {
    const toggle = document.querySelector('[data-nav-toggle]');
    if (toggle) {
      toggle.addEventListener('click', () => this.toggle());
    }

    this.navOverlay.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => this.close());
      link.addEventListener('mouseenter', () => {
        link.style.textShadow = '0 0 40px var(--accent-glow), 0 0 80px var(--accent-glow)';
      });
      link.addEventListener('mouseleave', () => {
        link.style.textShadow = 'none';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    this.navOverlay.classList.remove('opacity-0', 'pointer-events-none');

    this.navOverlay.querySelectorAll('.nav-link').forEach((link, i) => {
      setTimeout(() => {
        link.style.transitionDelay = `${(link.style.getPropertyValue('--delay') || 0) * 1000 + i * 80}ms`;
        link.classList.remove('translate-y-20', 'opacity-0', 'text-white/0');
        link.classList.add('translate-y-0', 'opacity-100', 'text-white');
      }, 50);
    });
  }

  close() {
    this.isOpen = false;
    document.body.style.overflow = '';
    this.navOverlay.classList.add('opacity-0', 'pointer-events-none');

    this.navOverlay.querySelectorAll('.nav-link').forEach(link => {
      link.classList.add('translate-y-20', 'opacity-0', 'text-white/0');
      link.classList.remove('translate-y-0', 'opacity-100', 'text-white');
    });
  }
}

export function initNavigation() {
  return new FullScreenNav();
}

if (typeof window !== 'undefined') {
  window.FullScreenNav = FullScreenNav;
  window.initNavigation = initNavigation;
}
