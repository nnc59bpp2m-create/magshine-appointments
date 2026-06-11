// Main Application Entry Point
import { initAnimations } from './animations.js';
import { initFluidMesh } from './fluid-mesh.js';
import { initNavigation } from './navigation.js';
import { initBookingForm } from './booking.js';
import { loadComponents } from './components.js';

document.addEventListener('DOMContentLoaded', async () => {
  document.documentElement.classList.add('js-ready');
  document.documentElement.classList.add('render-paint');
  initNavigation();

  // Reveal hero immediately while components load
  requestAnimationFrame(() => {
    const hero = document.getElementById('hero');
    if (hero) hero.classList.add('visible');
  });

  await loadComponents();

  initAnimations();
  initFluidMesh('#fluid-canvas', { particleCount: 90, interactionRadius: 180, connectionDistance: 90 });
  initBookingForm('#bookForm');

  // Initialize owner auth check
  try {
    const res = await fetch('/api/owner-token');
    const data = await res.json();
    const ownerNav = document.getElementById('ownerNav');
    if (ownerNav && data.owner) {
      ownerNav.textContent = 'Owner Logout';
      ownerNav.href = '/logout';
    }
  } catch {}

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  mobileBtn?.addEventListener('click', () => mobileMenu?.classList.toggle('hidden'));

  console.log('Magshine initialized');
});

if (typeof module !== 'undefined') {
  module.exports = { initAnimations, initFluidMesh, initNavigation, initBookingForm };
}