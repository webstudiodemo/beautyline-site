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


/* ===== NATIVE BEAUTYLINE SERVICE / CORPORATE DETAILS ===== */
const detailModal = $('.detail-modal');
const detailTitle = $('#detail-title');
const detailLead = $('#detail-lead');
const detailCopy = $('#detail-copy');
const detailList = $('#detail-list');
const detailIndex = $('#detail-index');

const serviceDetails = {
  "Cilt Bakımı": {cat:"Cilt & Göz",lead:"Cildiniz için ihtiyaç odaklı profesyonel bakım.",copy:"Eski Beautyline hizmet arşivindeki yaklaşım doğrultusunda bakım öncesinde cilt analizi yapılarak uygun ürün ve cihazların belirlenmesi esas alınır.",list:["Analiz ve ihtiyaç belirleme","Temizleme, canlandırma ve nemlendirme odaklı seçenekler","Bakım planının cilt yapısına göre şekillendirilmesi"]},
  "Özel Bakımlar": {cat:"Cilt & Göz",lead:"Cilt ihtiyacına göre seçilen özel bakım seçenekleri.",copy:"Beautyline arşivinde oksijen bakımı ve farklı kür bakım başlıkları; canlandırma, temizleme, güçlendirme, koruma, dengeleme ve nemlendirme gibi ihtiyaçlarla birlikte sunuluyor.",list:["İhtiyaca göre bakım seçimi","Farklı kür ve bakım seçenekleri","Uzman ekiple ön değerlendirme"]},
  "Havyar Bakımı": {cat:"Cilt & Göz",lead:"Özel bakım ritüellerinden biri.",copy:"Havyar bakımı Beautyline’ın uzun süredir sunduğu cilt bakım seçenekleri arasında yer alıyor. Uygunluk bilgisi için ekibimizle görüşebilirsiniz.",list:["Cilt bakım menüsünün bir parçası","İhtiyaca göre değerlendirme","Randevu öncesi bilgi alma"]},
  "Göz Bakımı": {cat:"Cilt & Göz",lead:"Göz çevresine yönelik bakım seçeneği.",copy:"Göz bakımı, Beautyline’ın cilt bakım menüsünde ayrı bir uygulama olarak yer alıyor. Uygulama içeriği ve uygunluk randevu öncesinde değerlendirilir.",list:["Göz çevresi odaklı bakım","İhtiyaca göre uygulama seçimi","Uzman ekiple görüşme"]},
  "Vücut Bakımı": {cat:"Vücut",lead:"Rahatlama ve bakım odaklı vücut ritüelleri.",copy:"Beautyline’ın arşivinde doğal vücut bakımı; bakım ürünleri, yosun ve aromaterapi yağlarıyla rahatlama ve canlanma odaklı bir yaklaşım olarak anlatılıyor.",list:["Vücut nemlendirme ve bakım","Yosun ve aromaterapi seçenekleri","Uygulamaya göre kişiselleştirme"]},
  "Yosun Bakımı": {cat:"Vücut",lead:"Vücut bakım menüsündeki doğal bakım seçeneklerinden biri.",copy:"Yosun uygulaması Beautyline’ın eski hizmet arşivinde vücut bakımının bir parçası olarak yer alıyor. Uygunluk ve uygulama detayları için ekibimizden bilgi alabilirsiniz.",list:["Vücut bakım ritüeli","Bakım öncesi değerlendirme","Randevu ile detaylı bilgi"]},
  "G5 Uygulaması": {cat:"Vücut",lead:"Beautyline’ın vücut bakım menüsündeki uygulamalardan biri.",copy:"G5 uygulaması Beautyline’ın hizmet seçkisinde yer alan vücut bakım uygulamalarından biridir. Güncel uygulama detayları ve uygunluk için ekibimizle görüşebilirsiniz.",list:["Vücut bakım menüsünde yer alır","Uygunluk değerlendirmesi","WhatsApp üzerinden bilgi"]},
  "Tropikal Bakım": {cat:"Vücut",lead:"Vücut bakım ritüellerinden biri.",copy:"Tropikal bakım Beautyline’ın hizmet arşivindeki vücut bakım seçenekleri arasında bulunuyor.",list:["Vücut bakım seçeneği","İhtiyaca göre değerlendirme","Randevu ile bilgi"]},
  "Green Coffee Bakımı": {cat:"Vücut",lead:"Beautyline vücut bakım menüsündeki uygulamalardan biri.",copy:"Green Coffee bakımı Beautyline’ın eski hizmet menüsünde yer alan uygulamalardan biridir.",list:["Vücut bakım menüsünde yer alır","Uygunluk için ön görüşme","Randevu ile detaylı bilgi"]},
  "Sir Ağda": {cat:"Güzellik",lead:"Klasik güzellik bakımının profesyonel uygulaması.",copy:"Sir ağda Beautyline’ın hizmet menüsünde uzun süredir yer alan uygulamalardan biridir.",list:["Profesyonel uygulama","İhtiyaca göre bölgesel işlem","Randevu ile bilgi"]},
  "Profesyonel Makyaj": {cat:"Güzellik & Makyaj",lead:"Özel günler ve davetler için profesyonel makyaj.",copy:"Beautyline’ın hizmet seçkisinde profesyonel makyaj ayrı bir uygulama olarak sunuluyor.",list:["Profesyonel makyaj","Özel günlere uygun planlama","Randevu öncesi görüşme"]},
  "Gelin Makyajı": {cat:"Güzellik & Makyaj",lead:"Gelin hazırlığının önemli adımlarından biri.",copy:"Gelin makyajı Beautyline’ın güzellik menüsünde ayrı bir hizmet olarak yer alıyor.",list:["Gelin hazırlığı","İhtiyaca göre planlama","Randevu öncesi iletişim"]},
  "Kirpik Ekleme": {cat:"Kaş & Kirpik",lead:"Kirpik görünümünü belirginleştirmeye yönelik uygulama.",copy:"Beautyline’ın eski hizmet arşivinde tek tek uygulanan kirpik ekleme hizmeti yer alıyor.",list:["Doğal görünümlü seçenekler","Detaylı uygulama","Uygunluk için uzman görüşü"]},
  "Kirpik Perması": {cat:"Kaş & Kirpik",lead:"Kirpiklere kıvrım kazandırmaya yönelik uygulama.",copy:"Beautyline arşivinde kirpik permaları, özellikle düz kirpiklerin daha kıvrımlı görünmesine yönelik bir seçenek olarak anlatılıyor.",list:["Kirpiklere kıvrım görünümü","Günlük şekillendirmeye alternatif","Uygunluk değerlendirmesi"]},
  "Kaş Dizaynı": {cat:"Kaş & Kirpik",lead:"Yüz ve göz hatlarına uyumlu kaş tasarımı.",copy:"Beautyline’ın arşivinde kaş dizaynı, yüz ifadesini ve göz hatlarını dikkate alan bir tasarım hizmeti olarak tanımlanıyor.",list:["Yüz ve göz hatlarının değerlendirilmesi","Kişiye göre şekillendirme","Uzman estetisyen uygulaması"]},
  "Kaş Boyama": {cat:"Kaş & Kirpik",lead:"Kaş rengini saçlarla uyumlu hale getirmeye yönelik uygulama.",copy:"Kaş boyama Beautyline’ın kaş tasarımları içinde yer alan uygulamalardan biridir.",list:["Renk uyumu odaklı yaklaşım","Kaş tasarımıyla birlikte planlanabilir","Randevu ile bilgi"]},
  "Kirpik Boyama": {cat:"Kaş & Kirpik",lead:"Kirpik görünümünü belirginleştirmeye yönelik tamamlayıcı işlem.",copy:"Kirpik boyama Beautyline arşivinde kirpik permasının tamamlayıcı işlemlerinden biri olarak yer alıyor.",list:["Kirpik permasıyla birlikte düşünülebilir","Belirgin görünüm","Uygunluk değerlendirmesi"]},
  "Tırnak Bakımı": {cat:"Tırnak & El-Ayak",lead:"El ve tırnak bakımının temel adımı.",copy:"Beautyline’ın tırnak ve el-ayak bakım menüsünde tırnak bakımı ayrı bir uygulama olarak yer alıyor.",list:["Tırnak bakımı","Manikür ve diğer bakımlarla birlikte planlanabilir","Hijyen odaklı uygulama"]},
  "Protez Tırnak": {cat:"Tırnak & El-Ayak",lead:"Tırnak görünümünü şekillendirmeye yönelik uygulama.",copy:"Protez tırnak Beautyline’ın tırnak bakım menüsünde yer alan hizmetlerden biridir.",list:["Tırnak görünümüne yönelik uygulama","Kişisel tercihe göre planlama","Randevu ile detaylı bilgi"]},
  "Manikür": {cat:"Tırnak & El-Ayak",lead:"Bakımlı eller için profesyonel manikür.",copy:"Beautyline’ın eski hizmet arşivinde manikürün hijyenik ortamlarda yapıldığı ve farklı bakım seçenekleri bulunduğu belirtiliyor.",list:["Hijyen odaklı uygulama","Tropikal, lavantalı ve farklı bakım seçenekleri","Tırnak ve el bakımına bütünsel yaklaşım"]},
  "Pedikür": {cat:"Tırnak & El-Ayak",lead:"Ayak ve tırnak bakımını bir araya getiren uygulama.",copy:"Beautyline arşivinde pedikür; ayak bakımının yanı sıra hijyen ve doğal bakım seçenekleriyle birlikte anlatılıyor.",list:["Ayak ve tırnak bakımı","Hijyenik uygulama","Farklı bakım seçenekleri"]},
  "Topuk Bakımı": {cat:"Tırnak & El-Ayak",lead:"Topuk ve ayak bakımına odaklanan uygulama.",copy:"Topuk bakımı Beautyline’ın el ve ayak bakım menüsünde yer alıyor.",list:["Topuk odaklı bakım","Pedikürle birlikte planlanabilir","Randevu ile bilgi"]},
  "Özel Ayak Bakımı": {cat:"Tırnak & El-Ayak",lead:"Ayak bakımına yönelik özel uygulama.",copy:"Özel ayak bakımı Beautyline’ın eski hizmet arşivinde ayrı bir bakım seçeneği olarak bulunuyor.",list:["Ayak bakımına odaklanır","İhtiyaca göre değerlendirme","Uzman ekiple görüşme"]},
  "Spa El-Ayak Bakımı": {cat:"Tırnak & El-Ayak",lead:"El ve ayaklara yönelik rahatlatıcı bakım ritüeli.",copy:"Spa el-ayak bakımı Beautyline’ın bakım menüsünde yer alan seçeneklerden biridir.",list:["El ve ayak bakımı","Rahatlama odaklı yaklaşım","Randevu ile bilgi"]},
  "Parafin Bakımı": {cat:"Tırnak & El-Ayak",lead:"El ve ayak bakımını tamamlayan parafin uygulaması.",copy:"Parafin bakımı Beautyline’ın eski menüsünde el ve ayak bakımının bir parçası olarak yer alıyor.",list:["El ve ayak bakımını destekleyen uygulama","Manikür ve pedikürle birlikte düşünülebilir","Randevu ile detaylı bilgi"]}
};

const corporateDetails = {
  "Galeri": {cat:"Beautyline dünyası",lead:"Beautyline’ın görsel dünyasını yeni sitenin içinde keşfedin.",copy:"Eski sitedeki galeri alanının yerini artık yeni tasarımın kendi görsel dili alıyor. Böylece ziyaretçi başka bir siteye gönderilmeden Beautyline deneyiminin içinde kalıyor.",list:["Yeni site içinde görsel deneyim","Hizmet ve mekan atmosferi","Randevuya doğrudan geçiş"]},
  "Basında Beautyline": {cat:"Beautyline dünyası",lead:"Markanın basın ve görünürlük arşivi.",copy:"Basında Beautyline bölümü, markanın geçmişteki medya ve basın görünürlüğünü ayrı bir kurumsal alan olarak sunmak üzere konumlandırıldı.",list:["Basın ve marka arşivi","Kurumsal içerik alanı","Yeni site içinde gezinme"]},
  "İnsan Kaynakları": {cat:"Kariyer",lead:"Beautyline ekibinin bir parçası olun.",copy:"İnsan Kaynakları bölümü Beautyline’ın ekip ve kariyer iletişimi için ayrılmış kurumsal alandır. Başvurular için i.k@beautyline.com.tr adresi kullanılabilir.",list:["Kariyer ve ekip iletişimi","Başvuru e-postası: i.k@beautyline.com.tr","Beautyline çalışma kültürü"]},
  "Franchising": {cat:"İş ortaklığı",lead:"Beautyline markasıyla iş ortaklığı.",copy:"Eski kurumsal içerikte franchising için eğitim, açılış hazırlıkları, reklam, ürün satın alma ve uygulama eğitimi, insan kaynakları ve kalite kontrol gibi destekler; yatırım koşullarının lokasyona göre değiştiği belirtiliyor.",list:["Eğitim ve açılış desteği","Reklam, ürün ve operasyon desteği","İnsan kaynakları ve kalite kontrol desteği","Franchising iletişimi: franchising@beautyline.com.tr"]}
};

function openDetail(title, type='service'){
  const item=(type==='corporate'?corporateDetails:serviceDetails)[title];
  if(!item || !detailModal) return;
  detailTitle.textContent=title;
  detailKicker.textContent='';
  detailKicker.appendChild(document.createElement('span'));
  detailKicker.append(document.createTextNode(' '+item.cat));
  detailLead.textContent=item.lead;
  detailCopy.textContent=item.copy;
  detailList.innerHTML=item.list.map(x=>'<li>'+x+'</li>').join('');
  const keys=Object.keys(type==='corporate'?corporateDetails:serviceDetails);
  detailIndex.textContent=String(keys.indexOf(title)+1).padStart(2,'0')+' / BEAUTYLINE';
  detailModal.classList.add('open');
  detailModal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeDetail(){
  detailModal?.classList.remove('open');
  detailModal?.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
$$('[data-detail]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openDetail(a.dataset.detail,'service')}));
$$('[data-corporate]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openDetail(a.dataset.corporate,'corporate')}));
$$('[data-close-detail]').forEach(a=>a.addEventListener('click',closeDetail));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detailModal?.classList.contains('open'))closeDetail()});
$$('[data-detail-whatsapp]').forEach(a=>a.addEventListener('click',()=>openWhatsApp('Merhaba Beautyline Güzellik, '+detailTitle.textContent+' hakkında bilgi ve uygun randevu saatlerini öğrenmek istiyorum.')));
