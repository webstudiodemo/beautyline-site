/* Beautyline — static GitHub Pages implementation */
// IMPORTANT: Replace this with the salon's real WhatsApp-enabled number.
// Format: country code + number, digits only. Example: 905XXXXXXXXX
const WHATSAPP_NUMBER = '905XXXXXXXXX';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

// Reveal-on-scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
}, { threshold: .14 });
$$('.reveal').forEach(el => observer.observe(el));

// Mouse-follow glow + subtle parallax
const glow = $('.cursor-glow');
let mx = innerWidth/2, my = innerHeight/2, gx = mx, gy = my;
window.addEventListener('pointermove', e => { mx=e.clientX; my=e.clientY; glow.style.opacity='1'; });
function glowLoop(){ gx += (mx-gx)*.08; gy += (my-gy)*.08; glow.style.left=gx+'px'; glow.style.top=gy+'px'; requestAnimationFrame(glowLoop); }
glowLoop();

// Hero cinematic movement
const heroImg = $('.hero-media img');
window.addEventListener('scroll', () => {
  const y = Math.min(scrollY, innerHeight);
  if (heroImg) heroImg.style.transform = `scale(${1.08 + y*.000045}) translateY(${y*.035}px)`;
}, {passive:true});

// Magnetic buttons
$$('.magnetic').forEach(btn => {
  btn.addEventListener('pointermove', e => {
    const r=btn.getBoundingClientRect(), x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2;
    btn.style.transform=`translate(${x*.12}px,${y*.12}px)`;
  });
  btn.addEventListener('pointerleave', ()=>btn.style.transform='');
});

// Mobile menu
const menuToggle = $('.menu-toggle');
const nav = $('.nav');
menuToggle?.addEventListener('click', () => {
  nav.classList.toggle('mobile-open');
});
$$('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('mobile-open')));

// Booking modal
const modal = $('.booking-modal');
const openModal = () => { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setTimeout(()=>$('.modal-panel input',modal)?.focus(),80); };
const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };
$$('[data-open-booking]').forEach(el=>el.addEventListener('click',openModal));
$$('[data-close-booking]').forEach(el=>el.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal()});

// WhatsApp randevu flow
$('#booking-form').addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget).entries());
  if (WHATSAPP_NUMBER.includes('X')) {
    alert('WhatsApp bağlantısını aktif etmek için script.js içindeki WHATSAPP_NUMBER alanına işletmenin WhatsApp numarasını ekleyin.');
    return;
  }
  const msg = [
    'Merhaba Beautyline Güzellik, randevu talebinde bulunmak istiyorum.',
    '', `Ad Soyad: ${data.name}`, `Telefon: ${data.phone}`, `Hizmet: ${data.service}`,
    `Tercih edilen tarih: ${data.date}`, `Tercih edilen saat: ${data.time}`,
    data.note ? `Not: ${data.note}` : ''
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
});

// Service cards open booking with the selected service pre-filled
$$('.service-card').forEach(card=>card.addEventListener('click',()=>{
  openModal();
  setTimeout(()=>{
    const select=$('select[name="service"]');
    if(select) select.value=card.dataset.service || '';
  },80);
}));

// Set minimum date to today
const dateInput = $('input[type="date"]');
if(dateInput) dateInput.min = new Date().toISOString().split('T')[0];
