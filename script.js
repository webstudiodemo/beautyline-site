/* Beautyline — cinematic, scroll-reactive GitHub Pages implementation */
const WHATSAPP_NUMBER = '905467249922';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

// Cinematic opening: dark frame -> logo reveal -> site reveal.
window.addEventListener('load', () => {
  document.body.classList.add('page-ready');
  window.setTimeout(() => document.body.classList.add('intro-complete'), 1850);
});

// Reveal elements every time they enter the viewport. Scrolling up/down replays the motion.
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle('visible', entry.isIntersecting);
  });
}, { threshold: 0.12, rootMargin: '-5% 0px -8% 0px' });
$$('.reveal').forEach(el => observer.observe(el));

// Mouse-follow glow.
const glow = $('.cursor-glow');
let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my;
window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, {passive:true});
function glowLoop(){
  gx += (mx-gx)*.075;
  gy += (my-gy)*.075;
  if (glow) { glow.style.left = gx+'px'; glow.style.top = gy+'px'; }
  requestAnimationFrame(glowLoop);
}
glowLoop();

// Continuous scroll choreography. Every frame is calculated from live viewport position,
// so visual elements remain alive when the visitor scrolls both down and back up.
const scrollItems = $$('.scroll-card, .scroll-media, .hero-media, .statement-copy, .review-card, .contact-grid > div');
let ticking = false;
function updateScrollMotion(){
  ticking = false;
  const vh = innerHeight;
  const center = vh * .5;

  scrollItems.forEach(el => {
    const r = el.getBoundingClientRect();
    const progress = (r.top + r.height/2 - center) / (vh + r.height);
    const bounded = Math.max(-1, Math.min(1, progress));
    const depth = 1 - Math.abs(bounded);
    const drift = bounded * -26;
    const tilt = bounded * (el.classList.contains('scroll-card') ? 1.6 : .8);
    const scale = el.classList.contains('scroll-card') ? 1 + depth * .012 : 1;

    el.style.setProperty('--scroll-y', `${drift}px`);
    el.style.setProperty('--scroll-tilt', `${tilt}deg`);
    el.style.setProperty('--scroll-scale', scale);
    el.style.setProperty('--scroll-progress', bounded.toFixed(3));

    if (el.classList.contains('scroll-card')) {
      const img = $('img', el);
      if (img) img.style.transform = `scale(1.09) translate3d(0, ${bounded * -22}px, 0)`;
    }
  });

  const hero = $('.hero-media img');
  if (hero) {
    const y = Math.min(scrollY, innerHeight * 1.1);
    hero.style.transform = `scale(${1.08 + y*.000065}) translate3d(0, ${y*.055}px, 0)`;
  }
}
function requestScrollMotion(){
  if(!ticking){
    ticking=true;
    requestAnimationFrame(updateScrollMotion);
  }
}
window.addEventListener('scroll', requestScrollMotion, {passive:true});
window.addEventListener('resize', requestScrollMotion, {passive:true});
updateScrollMotion();

// Magnetic controls.
$$('.magnetic').forEach(btn => {
  btn.addEventListener('pointermove', e => {
    const r=btn.getBoundingClientRect();
    const x=e.clientX-r.left-r.width/2;
    const y=e.clientY-r.top-r.height/2;
    btn.style.setProperty('--mx', `${x*.13}px`);
    btn.style.setProperty('--my', `${y*.13}px`);
  });
  btn.addEventListener('pointerleave', ()=>{
    btn.style.setProperty('--mx','0px');
    btn.style.setProperty('--my','0px');
  });
});

// Mobile menu.
const menuToggle = $('.menu-toggle'), nav = $('.nav');
menuToggle?.addEventListener('click', () => nav.classList.toggle('mobile-open'));
$$('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('mobile-open')));

// Direct WhatsApp CTA — primary appointment buttons open WhatsApp immediately.
function openWhatsApp(message = 'Merhaba Beautyline Güzellik, randevu almak istiyorum. Uygun gün ve saat seçeneklerini paylaşabilir misiniz?') {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
$$('[data-direct-whatsapp]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  openWhatsApp();
}));

// Detailed appointment modal remains available from service cards.
const modal = $('.booking-modal');
const openModal = () => {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  setTimeout(()=>$('.modal-panel input',modal)?.focus(),80);
};
const closeModal = () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
};
$$('[data-open-booking]').forEach(el=>el.addEventListener('click',openModal));
$$('[data-close-booking]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal()});

$('#booking-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget).entries());
  const msg = [
    'Merhaba Beautyline Güzellik, randevu talebinde bulunmak istiyorum.', '',
    `Ad Soyad: ${data.name}`,
    `Telefon: ${data.phone}`,
    `Hizmet: ${data.service}`,
    `Tercih edilen tarih: ${data.date}`,
    `Tercih edilen saat: ${data.time}`,
    data.note ? `Not: ${data.note}` : ''
  ].filter(Boolean).join('\n');
  openWhatsApp(msg);
});

$$('.service-card').forEach(card=>card.addEventListener('click',()=>{
  openModal();
  setTimeout(()=>{
    const select=$('select[name="service"]');
    if(select) select.value=card.dataset.service || '';
  },80);
}));

const dateInput = $('input[type="date"]');
if(dateInput) dateInput.min = new Date().toISOString().split('T')[0];

// Respect reduced-motion preferences.
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.body.classList.add('reduced-motion');
}
