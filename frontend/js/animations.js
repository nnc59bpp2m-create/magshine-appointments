// GSAP Animation Controller
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollToPlugin from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
gsap.defaults({ force3D: true, overwrite: 'auto' });

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DUR = prefersReduced ? 0.01 : 1;

export function initMagneticHover() {
  document.querySelectorAll('.btn-primary, .btn-secondary, .btn-ghost').forEach(btn => {
    btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.03, y: -2, duration: 0.3, ease: 'power2.out' }));
    btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, y: 0, duration: 0.4, ease: 'power2.out' }));
    btn.addEventListener('mousedown', () => gsap.to(btn, { scale: 0.97, duration: 0.1, ease: 'power2.in' }));
    btn.addEventListener('mouseup', () => gsap.to(btn, { scale: 1.03, duration: 0.2, ease: 'power2.out' }));
  });
}

export function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      gsap.to(window, { scrollTo: { y: target, offsetY: 80 }, duration: 1.2, ease: 'expo.out' });
    });
  });
}

export function initHeroReveal() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.fromTo('#hero .reveal-up', { y: 60, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, stagger: 0.12 });
  tl.fromTo('#hero-bg', { scale: 1.15, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: 'power3.out' }, '-=0.6');
  tl.fromTo('.hero-orb', { y: 40, x: -30, scale: 0.8, opacity: 0 }, { y: 0, x: 0, scale: 1, opacity: 1, duration: 1.6, stagger: 0.2, ease: 'power2.out' }, '-=0.8');
  return tl;
}

export function initHeroParallax() {
  const hero = document.querySelector('#hero');
  const bg = document.querySelector('#hero-bg');
  const orbs = document.querySelectorAll('.hero-orb');
  if (!hero || !bg) return;

  gsap.to(bg, { yPercent: -20, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } });
  orbs.forEach((orb, i) => {
    gsap.to(orb, { yPercent: i % 2 ? 25 : -20, xPercent: i % 2 ? 15 : -10, rotation: i % 2 ? 5 : -3, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.7 } });
  });
}

export function initSectionReveal() {
  document.querySelectorAll('.section-reveal').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }),
      onLeaveBack: () => gsap.set(el, { opacity: 0, y: 40 })
    });
  });
}

export function initTextReveal() {
  document.querySelectorAll('.text-reveal').forEach(el => {
    const text = el.textContent;
    el.innerHTML = text.split('').map(c => '<span class="char" style="display:inline-block;opacity:0;transform:translateY(1em);">' + (c === ' ' ? '&nbsp;' : c) + '</span>').join('');
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => gsap.to(el.querySelectorAll('.char'), { opacity: 1, y: 0, duration: 0.6, stagger: 0.02, ease: 'expo.out' }),
      once: true
    });
  });
}

export function initCounters() {
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        gsap.fromTo({ val: 0 }, { val: target, duration: 1.5, ease: 'expo.out', onUpdate: function() { el.textContent = this.targets()[0].val.toFixed(decimals) + suffix; } });
      },
      once: true
    });
  });
}

export function initAnimations() {
  initMagneticHover();
  initSmoothScroll();
  initHeroReveal();
  initHeroParallax();
  initSectionReveal();
  initTextReveal();
  initCounters();
  ScrollTrigger.refresh();
}

if (typeof window !== 'undefined') {
  window.MagshineAnimations = { initAnimations };
}
