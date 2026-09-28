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

// ===== PREMIUM ONLINE APPOINTMENT SYSTEM =====
const schedulerModal = $('.scheduler-modal');
const adminModal = $('.admin-modal');
const schedulerSteps = $$('.scheduler-step', schedulerModal);
const schedulerDots = $$('[data-step-dot]', schedulerModal);
const schedulerBack = $('[data-scheduler-back]', schedulerModal);
const schedulerSuccess = $('#scheduler-success', schedulerModal);
const calendarGrid = $('#calendar-grid', schedulerModal);
const calendarMonth = $('#calendar-month', schedulerModal);
const timeSlots = $('#time-slots', schedulerModal);
const selectedDateLabel = $('#selected-date-label', schedulerModal);
const selectedServiceLabel = $('#selected-service-label', schedulerModal);
const bookingSummary = $('#booking-summary', schedulerModal);

const SERVICE_DURATIONS = {
  'Cilt Bakımı':60,'Vücut Bakımı':60,'Kaş & Kirpik':45,
  'El & Ayak Bakımı':60,'Makyaj & Gelin':90,'Diğer':60
};
const SLOT_TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
const STORAGE_KEY = 'beautylineAppointmentsV1';
let appointmentState = { step:1, service:'', date:null, time:null, month:new Date(new Date().getFullYear(),new Date().getMonth(),1) };

function getAppointments(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch(e){return []}
}
function saveAppointments(items){localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}
function pad(n){return String(n).padStart(2,'0')}
function dateKey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function formatDate(key){
  if(!key)return '';
  const [y,m,d]=key.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(y,m-1,d));
}
function isClosedDate(d){ return d.getDay()===2; } // Demo: Tuesday closed; editable in production admin settings.
function busyForDate(key){
  const real=getAppointments().filter(a=>a.date===key && a.status!=='cancelled').map(a=>a.time);
  const [y,m,d]=key.split('-').map(Number);
  const seed=(y*31+m*17+d*13)%7;
  const demo=['10:30','13:30','15:30'].filter((_,i)=>(seed+i)%2===0);
  return [...new Set([...demo,...real])];
}
function openScheduler(){
  if(!schedulerModal)return;
  appointmentState={step:1,service:'',date:null,time:null,month:new Date(new Date().getFullYear(),new Date().getMonth(),1)};
  schedulerSuccess.classList.remove('open');
  schedulerSuccess.setAttribute('aria-hidden','true');
  schedulerSteps.forEach(s=>s.classList.toggle('active',s.dataset.step==='1'));
  schedulerDots.forEach(d=>d.classList.toggle('active',d.dataset.step==='1'));
  schedulerBack.disabled=true;
  renderCalendar();
  schedulerModal.classList.add('open');
  schedulerModal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeScheduler(){
  schedulerModal?.classList.remove('open');
  schedulerModal?.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
function setSchedulerStep(step){
  appointmentState.step=step;
  schedulerSteps.forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===step));
  schedulerDots.forEach(d=>d.classList.toggle('active',Number(d.dataset.step)<=step));
  schedulerBack.disabled=step===1;
  if(step===2) renderCalendar();
  if(step===3) renderSummary();
}
$$('[data-open-scheduler]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();openScheduler()}));
$$('[data-close-booking]').forEach(el=>el.addEventListener('click',closeScheduler));

$$('.service-card').forEach(card=>card.addEventListener('click',()=>{
  openScheduler();
  window.setTimeout(()=>{
    const choice=$('[data-service-choice="'+CSS.escape(card.dataset.service||'')+'"]',schedulerModal);
    if(choice) choice.click();
  },120);
}));

$$('[data-service-choice]').forEach(btn=>btn.addEventListener('click',()=>{
  appointmentState.service=btn.dataset.serviceChoice;
  selectedServiceLabel.textContent=appointmentState.service;
  $$('[data-service-choice]').forEach(x=>x.classList.remove('selected'));
  btn.classList.add('selected');
  setSchedulerStep(2);
}));

function renderCalendar(){
  if(!calendarGrid)return;
  const y=appointmentState.month.getFullYear(), m=appointmentState.month.getMonth();
  calendarMonth.textContent=new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric'}).format(appointmentState.month);
  calendarGrid.innerHTML='';
  const first=new Date(y,m,1), days=new Date(y,m+1,0).getDate();
  let mondayIndex=(first.getDay()+6)%7;
  for(let i=0;i<mondayIndex;i++) calendarGrid.insertAdjacentHTML('beforeend','<div class="calendar-day empty"></div>');
  const today=new Date(); today.setHours(0,0,0,0);
  for(let day=1;day<=days;day++){
    const d=new Date(y,m,day); d.setHours(0,0,0,0);
    const key=dateKey(d), closed=isClosedDate(d), past=d<today, busy=busyForDate(key);
    const allBusy=busy.length>=12;
    const available=!past&&!closed&&!allBusy;
    const selected=appointmentState.date===key;
    const el=document.createElement('button');
    el.type='button';
    el.className='calendar-day '+(past?'past ':'')+(closed?'closed ':'')+(available?'available ':'')+(allBusy?'full ':'')+(selected?'selected':'');
    el.innerHTML='<span class="day-number">'+day+'</span><span class="day-status">'+(closed?'Kapalı':past?'':' '+(allBusy?'Dolu':'Müsait'))+'</span>';
    if(available){
      el.addEventListener('click',()=>{
        appointmentState.date=key; appointmentState.time=null;
        renderCalendar(); renderTimeSlots();
      });
    }else el.disabled=true;
    calendarGrid.appendChild(el);
  }
  renderTimeSlots();
}
function renderTimeSlots(){
  if(!timeSlots)return;
  timeSlots.innerHTML='';
  if(!appointmentState.date){
    timeSlots.innerHTML='<p class="slot-empty">Önce takvimden bir gün seçin.</p>'; 
    selectedDateLabel.textContent='Bir gün seçin'; return;
  }
  selectedDateLabel.textContent=formatDate(appointmentState.date);
  const busy=busyForDate(appointmentState.date);
  SLOT_TIMES.forEach(time=>{
    const b=document.createElement('button'); b.type='button';
    const isBusy=busy.includes(time);
    b.className='time-slot '+(isBusy?'full ':'')+(appointmentState.time===time?'selected':'');
    b.textContent=time;
    if(!isBusy)b.addEventListener('click',()=>{
      appointmentState.time=time;
      renderTimeSlots();
      window.setTimeout(()=>setSchedulerStep(3),220);
    }); else b.disabled=true;
    timeSlots.appendChild(b);
  });
}
$('[data-calendar-prev]',schedulerModal)?.addEventListener('click',()=>{
  appointmentState.month=new Date(appointmentState.month.getFullYear(),appointmentState.month.getMonth()-1,1); renderCalendar();
});
$('[data-calendar-next]',schedulerModal)?.addEventListener('click',()=>{
  appointmentState.month=new Date(appointmentState.month.getFullYear(),appointmentState.month.getMonth()+1,1); renderCalendar();
});
schedulerBack?.addEventListener('click',()=>setSchedulerStep(Math.max(1,appointmentState.step-1)));

function renderSummary(){
  bookingSummary.innerHTML=[
    ['Hizmet',appointmentState.service],
    ['Tarih',formatDate(appointmentState.date)],
    ['Saat',appointmentState.time]
  ].map(x=>'<div><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join('');
}
$('#scheduler-form')?.addEventListener('submit',e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.currentTarget).entries());
  const appointment={
    id:Date.now().toString(36),name:data.name,phone:data.phone,note:data.note||'',
    service:appointmentState.service,date:appointmentState.date,time:appointmentState.time,
    status:'confirmed',createdAt:new Date().toISOString()
  };
  const items=getAppointments();
  items.push(appointment); saveAppointments(items);
  $('#success-name').textContent=data.name;
  $('#success-card').innerHTML=[
    ['Hizmet',appointment.service],['Tarih',formatDate(appointment.date)],['Saat',appointment.time],
    ['Telefon',appointment.phone]
  ].map(x=>'<div><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>').join('');
  schedulerSteps.forEach(s=>s.classList.remove('active'));
  schedulerSuccess.classList.add('open');
  schedulerSuccess.setAttribute('aria-hidden','false');
  appointmentState.step=4;
  schedulerBack.disabled=true;
});
$('[data-success-whatsapp]',schedulerModal)?.addEventListener('click',()=>{
  const a=getAppointments().slice(-1)[0];
  if(a) openWhatsApp('Merhaba Beautyline Güzellik, online randevumu oluşturdum.\\n\\nHizmet: '+a.service+'\\nTarih: '+formatDate(a.date)+'\\nSaat: '+a.time+'\\nAd Soyad: '+a.name);
});

// Admin panel — available via ?admin=1 or Alt+A on desktop.
function renderAdmin(){
  const list=$('#admin-list',adminModal), count=$('#admin-count',adminModal);
  if(!list)return;
  const items=getAppointments().filter(a=>a.status!=='cancelled').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  count.textContent=items.length;
  if(!items.length){list.innerHTML='<div class="slot-empty">Henüz randevu bulunmuyor.</div>';return;}
  list.innerHTML=items.map(a=>'<div class="admin-row">'+
    '<div><small>'+a.date+'</small><strong>'+a.time+'</strong></div>'+
    '<div><small>Müşteri</small><strong>'+a.name+'</strong></div>'+
    '<div><small>Hizmet</small><strong>'+a.service+'</strong></div>'+
    '<div><small>Telefon</small><strong>'+a.phone+'</strong></div>'+
    '<div><button data-cancel-admin="'+a.id+'">İptal et</button></div>'+
    '</div>').join('');
  $$('[data-cancel-admin]',adminModal).forEach(btn=>btn.addEventListener('click',()=>{
    const updated=getAppointments().map(a=>a.id===btn.dataset.cancelAdmin?{...a,status:'cancelled'}:a);
    saveAppointments(updated); renderAdmin();
  }));
}
function openAdmin(){
  renderAdmin(); adminModal.classList.add('open'); adminModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
}
function closeAdmin(){adminModal?.classList.remove('open');adminModal?.setAttribute('aria-hidden','true');document.body.style.overflow='';}
$$('[data-close-admin]').forEach(el=>el.addEventListener('click',closeAdmin));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(schedulerModal?.classList.contains('open'))closeScheduler(); if(adminModal?.classList.contains('open'))closeAdmin()}
  if(e.altKey&&e.key.toLowerCase()==='a')openAdmin();
});
if(new URLSearchParams(location.search).get('admin')==='1') window.setTimeout(openAdmin,700);


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
const detailKicker = $('#detail-kicker');

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
