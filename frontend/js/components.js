// Component Loader & Data
const STUDIO_SERVICES = [
  { id: 'paint-correction', title: 'Paint Correction', subtitle: 'Multi-Stage Machine Polishing', description: 'Eliminate swirls, holograms, oxidation & RIDS. Rupes BigFoot system + Ceramic Pro compounds. Paint depth measured pre/post.', specs: ['1-3 stage correction', 'Ultrasonic paint gauge', 'Hologram-free finish', 'LED inspection booth'], priceFrom: 450, duration: '1-3 days', icon: 'polish', image: '/assets/scrape_013.jpg' },
  { id: 'ceramic-coating', title: 'Ceramic Coating', subtitle: 'Ceramic Pro 9H / ION', description: 'Nano-ceramic glass shield. 9H hardness, hydrophobic, UV/chemical resistance. Lifetime warranty on ION packages.', specs: ['9H pencil hardness', '5+ year durability', 'Self-cleaning effect', 'Warranty registered'], priceFrom: 1800, duration: '2-3 days', icon: 'shield', image: '/assets/scrape_008.jpg' },
  { id: 'ppf', title: 'Paint Protection Film', subtitle: 'XPEL Ultimate Plus / Stealth', description: 'Self-healing TPU film. Invisible chip & scratch protection. Stealth matte finish available. 10-year warranty.', specs: ['Self-healing top coat', 'Edge-wrap installation', 'Matte/satin option', '10-year warranty'], priceFrom: 3500, duration: '2-5 days', icon: 'film', image: '/assets/scrape_003.jpg' }
];

const STREET_FEATURES = [
  { title: 'Monthly Meets', desc: 'First Saturday. Coffee, cars, zero pressure. All makes welcome.', cta: 'Next: Jun 7', icon: 'calendar' },
  { title: 'Build Features', desc: 'Deep dives on member builds. Specs, stories, studio sessions.', cta: 'View features', icon: 'camera' },
  { title: 'Track Days', desc: 'Sepang & parties. Pre-event prep, post-track decon packages.', cta: 'Schedule', icon: 'flag' },
  { title: 'Media Archive', desc: 'Cinematic reels, before/after galleries, process documentaries.', cta: 'Watch now', icon: 'play' }
];

const GALLERY_ITEMS = [
  { src: '/assets/scrape_008.jpg', alt: 'Ceramic Pro 9H on Midnight Black', category: 'Coating' },
  { src: '/assets/scrape_013.jpg', alt: 'Paint Correction - Swirl Removal', category: 'Correction' },
  { src: '/assets/scrape_003.jpg', alt: 'XPEL PPF Full Wrap', category: 'PPF' },
  { src: '/assets/scrape_004.jpg', alt: 'Interior Revival - Alcantara', category: 'Interior' },
  { src: '/assets/scrape_005.jpg', alt: 'Engine Bay Dress', category: 'Detail' },
  { src: '/assets/scrape_006.jpg', alt: 'Wheel Ceramic Coating', category: 'Wheels' }
];

export async function loadComponents() {
  const responses = await Promise.all([
    fetch('/components/hero.html'),
    fetch('/components/studio.html'),
    fetch('/components/street.html'),
    fetch('/components/booking.html')
  ]);
  const [hero, studio, street, booking] = await Promise.all(responses.map(r => r.text()));
  document.getElementById('hero-container').innerHTML = hero;
  document.getElementById('studio-container').innerHTML = studio;
  document.getElementById('street-container').innerHTML = street;
  document.getElementById('booking-container').innerHTML = booking;
  renderStudioServices();
  renderStreetFeatures();
  renderGallery();
}

function renderStudioServices() {
  const container = document.getElementById('studio-services');
  if (!container) return;
  container.innerHTML = STUDIO_SERVICES.map((s, i) => `
    <article class="card group section-reveal" style="transition-delay: ${i * 100}ms">
      <div class="relative h-56 md:h-64 overflow-hidden">
        <img src="${s.image}" alt="${s.title}" class="w-full h-full object-cover transition-transform duration-700 ease-expo-out group-hover:scale-105" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-brand-bg/60 via-brand-bg/20 to-transparent"></div>
        <div class="absolute top-4 left-4 flex gap-2"><span class="px-3 py-1 rounded-full text-xs font-semibold bg-brand-accent/20 text-brand-accent border border-brand-accent/30">${s.duration}</span></div>
        <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between"><span class="font-display text-2xl font-bold text-white">${s.title}</span><span class="font-display font-bold text-brand-accent">RM${s.priceFrom.toLocaleString()}+</span></div>
      </div>
      <div class="p-6 space-y-4">
        <p class="text-sm text-brand-textDim leading-relaxed">${s.description}</p>
        <ul class="space-y-2 text-sm text-brand-textDim/80">${s.specs.map(spec => `<li class="flex items-center gap-2"><svg class="h-4 w-4 text-brand-accent/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>${spec}</li>`).join('')}</ul>
        <a href="#booking" class="btn-secondary w-full text-center py-3 rounded-xl text-sm font-medium group-hover:bg-brand-accent/10 group-hover:border-brand-accent group-hover:text-brand-accent transition-all">Select This Service</a>
      </div>
    </article>
  `).join('');
}

function renderStreetFeatures() {
  const container = document.getElementById('street-features');
  if (!container) return;
  container.innerHTML = STREET_FEATURES.map((f, i) => `
    <article class="card section-reveal p-6" style="transition-delay: ${i * 100}ms">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center"><svg class="h-6 w-6 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v4M16 2v4M3 8h18M8 14v4M16 14v4M3 20h18"/></svg></div>
        <div><h4 class="font-semibold text-white">${f.title}</h4><p class="text-sm text-brand-textDim mt-1">${f.desc}</p><a href="#" class="inline-flex items-center gap-1 text-xs font-medium text-brand-accent hover:text-brand-accentStrong mt-2">${f.cta} <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a></div>
      </div>
    </article>
  `).join('');
}

function renderGallery() {
  const container = document.getElementById('street-gallery');
  if (!container) return;
  container.innerHTML = GALLERY_ITEMS.map((g, i) => `
    <article class="card overflow-hidden section-reveal group" style="transition-delay: ${i * 80}ms">
      <div class="relative h-56 overflow-hidden"><img src="${g.src}" alt="${g.alt}" class="w-full h-full object-cover transition-transform duration-700 ease-expo-out group-hover:scale-110" loading="lazy" /><div class="absolute inset-0 bg-gradient-to-t from-brand-bg/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div><div class="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0"><span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-brand-accent/90 text-bg">${g.category}</span></div></div>
      <div class="p-4"><p class="text-sm text-brand-textDim">${g.alt}</p></div>
    </article>
  `).join('');
}
