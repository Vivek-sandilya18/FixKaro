/* ================= DATA ================= */
const SERVICES = [
  {id:'plumber', name:'Plumber', cat:'Plumbing', icon:'🚰', visit:199, perHour:299, rating:4.8, jobs:5200, info:'Leaks, taps, pipes, tanks'},
  {id:'electrician', name:'Electrician', cat:'Electrical', icon:'💡', visit:199, perHour:349, rating:4.7, jobs:6100, info:'Wiring, fans, switches, MCB'},
  {id:'ac', name:'AC Repair', cat:'Cooling', icon:'❄️', visit:399, perHour:449, rating:4.8, jobs:4300, info:'Service, gas refill, repair'},
  {id:'carpenter', name:'Carpenter', cat:'Carpentry', icon:'🪚', visit:249, perHour:329, rating:4.6, jobs:2900, info:'Furniture, doors, fittings'},
  {id:'cleaning', name:'Home Cleaning', cat:'Cleaning', icon:'🧹', visit:299, perHour:249, rating:4.7, jobs:7800, info:'Deep cleaning, kitchen, bathroom'},
  {id:'painter', name:'Painter', cat:'Painting', icon:'🎨', visit:349, perHour:379, rating:4.5, jobs:1900, info:'Wall painting, touch-ups'},
  {id:'appliance', name:'Appliance Repair', cat:'Cooling', icon:'🧺', visit:299, perHour:399, rating:4.6, jobs:3300, info:'Washing machine, fridge, geyser'},
  {id:'pest', name:'Pest Control', cat:'Cleaning', icon:'🐜', visit:499, perHour:299, rating:4.7, jobs:2500, info:'Cockroach, termite, bed bugs'}
];
const TECHS = [
  {id:'any', name:'Any available', av:'⚡', exp:'Fastest arrival'},
  {id:'t1', name:'Rajesh K.', av:'👨‍🔧', exp:'8 yrs · ★4.9'},
  {id:'t2', name:'Sunil M.', av:'🧑‍🔧', exp:'5 yrs · ★4.7'},
  {id:'t3', name:'Imran S.', av:'👷', exp:'10 yrs · ★4.8'}
];
const STEPS = ['Booked','Confirmed','On the way','Completed'];
const COUPONS = {FIRST10: 0.10, SAVE15: 0.15};
const GST = 0.18, URGENT = 0.25, KEY = 'fixkaro_bookings', THEME = 'fixkaro_theme';

/* ================= STATE + HELPERS ================= */
let selected = null, tech = 'any', cat = 'All', query = '';
let bookings = read(KEY, []);
const $ = id => document.getElementById(id);
const money = n => '₹' + Math.round(n).toLocaleString('en-IN');
const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch(e){ return d; } }
function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function toast(m){ const t = $('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400); }

/* ================= SERVICES: filter + search ================= */
function renderChips(){
  const cats = ['All', ...new Set(SERVICES.map(s => s.cat))];
  $('chips').innerHTML = cats.map(c => `<button class="chip ${c===cat?'on':''}" data-cat="${c}">${c}</button>`).join('');
}
function renderServices(){
  const list = SERVICES.filter(s => (cat==='All' || s.cat===cat) &&
    (s.name + ' ' + s.info).toLowerCase().includes(query.toLowerCase()));
  $('serviceGrid').innerHTML = list.length ? list.map(s => `
    <button class="service ${s.id===selected?'active':''}" data-id="${s.id}">
      <div class="ico">${s.icon}</div><h3>${s.name}</h3><small>${s.info}</small>
      <div class="rating">★ ${s.rating} <span class="muted">(${s.jobs.toLocaleString('en-IN')} jobs)</span></div>
      <div class="price">From ${money(s.visit)}</div>
    </button>`).join('') : '<p class="muted">No service found. Try another search.</p>';
}
$('chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if(!b) return; cat = b.dataset.cat; renderChips(); renderServices(); });
$('search').addEventListener('input', e => { query = e.target.value; renderServices(); });
$('serviceGrid').addEventListener('click', e => {
  const c = e.target.closest('.service'); if(!c) return;
  selected = c.dataset.id; renderServices(); updateEstimate(); $('book').scrollIntoView();
});

/* ================= TECHNICIANS ================= */
function renderTechs(){
  $('techs').innerHTML = TECHS.map(t => `<button class="tech ${t.id===tech?'on':''}" data-id="${t.id}">
    <div class="av">${t.av}</div><b>${t.name}</b><span>${t.exp}</span></button>`).join('');
}
$('techs').addEventListener('click', e => { const b = e.target.closest('.tech'); if(!b) return; tech = b.dataset.id; renderTechs(); });

/* ================= PRICE ESTIMATE ================= */
function calc(){
  const s = SERVICES.find(x => x.id === selected); if(!s) return null;
  const hours = +$('hours').value, labour = s.perHour * hours;
  const base = s.visit + labour, urgent = $('urgent').checked ? base * URGENT : 0;
  const rate = COUPONS[$('coupon').value.trim().toUpperCase()] || 0;
  const discount = (base + urgent) * rate, taxable = base + urgent - discount, gst = taxable * GST;
  return {s, hours, labour, urgent, discount, rate, gst, total: taxable + gst};
}
function updateEstimate(){
  const c = calc();
  if(!c){ $('chosen').textContent = 'Select a service first.'; $('est').innerHTML = ''; return; }
  $('chosen').innerHTML = `<b>${c.s.icon} ${c.s.name}</b> · ${c.hours} hr`;
  $('est').innerHTML = `<li><span>Visit charge</span><span>${money(c.s.visit)}</span></li>
    <li><span>Labour (${c.hours} × ${money(c.s.perHour)})</span><span>${money(c.labour)}</span></li>`
    + (c.urgent ? `<li><span>Emergency fee</span><span>${money(c.urgent)}</span></li>` : '')
    + (c.discount ? `<li class="disc"><span>Coupon (${c.rate*100}% off)</span><span>- ${money(c.discount)}</span></li>` : '')
    + `<li><span>GST (18%)</span><span>${money(c.gst)}</span></li><li class="total"><span>Total</span><span>${money(c.total)}</span></li>`;
}
['hours','urgent','coupon'].forEach(id => $(id).addEventListener('input', updateEstimate));

/* ================= VALIDATE + BOOK ================= */
function validate(){
  const v = {name:$('name').value.trim(), phone:$('phone').value.trim(), date:$('date').value, address:$('address').value.trim()};
  const code = $('coupon').value.trim().toUpperCase(), today = new Date().toISOString().slice(0,10);
  const errs = {
    name: v.name.length < 3 ? 'Enter your full name' : '',
    phone: /^[6-9]\d{9}$/.test(v.phone) ? '' : 'Enter a valid 10-digit mobile number',
    date: !v.date ? 'Pick a date' : v.date < today ? 'Date cannot be in the past' : '',
    address: v.address.length < 8 ? 'Enter your full address' : '',
    coupon: code && !COUPONS[code] ? 'Invalid coupon code' : ''
  };
  Object.keys(errs).forEach(k => $('e-' + k).textContent = errs[k]);
  return Object.values(errs).every(e => !e) ? v : null;
}
$('bookBtn').addEventListener('click', () => {
  const c = calc();
  $('formNote').textContent = c ? '' : 'Please select a service from the Services section first.';
  if(!c) return;
  const v = validate(); if(!v) return;
  bookings.unshift({id:'BK' + Date.now().toString().slice(-6), service:c.s.name, icon:c.s.icon, hours:c.hours,
    total:c.total, tech:TECHS.find(t => t.id === tech).name, name:v.name, phone:v.phone, date:v.date,
    time:$('time').value, address:v.address, urgent:$('urgent').checked, status:0, cancelled:false});
  write(KEY, bookings); renderList(); toast('Booking confirmed ✅');
  ['name','phone','date','address','coupon'].forEach(id => $(id).value = ''); $('urgent').checked = false;
  updateEstimate(); $('history').scrollIntoView();
});

/* ================= BOOKING HISTORY + STATUS ================= */
function renderList(){
  if(!bookings.length){ $('list').innerHTML = '<div class="box empty">No bookings yet. Book your first service above 👆</div>'; return; }
  $('list').innerHTML = bookings.map(b => `<div class="item">
    <div class="item-head"><h3>${b.icon} ${b.service} <small class="muted">#${b.id}</small></h3>
      <span class="badge ${b.cancelled?'cancelled':''}">${b.cancelled ? 'Cancelled' : STEPS[b.status]}</span></div>
    <div class="meta">📅 ${b.date}, ${b.time} · ⏱ ${b.hours} hr${b.urgent?' · 🚨 Emergency':''} · 🧑‍🔧 ${esc(b.tech)}<br>
      👤 ${esc(b.name)} · 📞 ${esc(b.phone)}<br>📍 ${esc(b.address)}<br><b>Estimated total: ${money(b.total)}</b></div>
    ${b.cancelled ? '' : `<div class="steps">${STEPS.map((s,i) => `<div class="step ${i<=b.status?'done':''}"><i></i>${s}</div>`).join('')}</div>`}
    <div class="actions">${(!b.cancelled && b.status < 3) ? `<button class="btn small ghost" data-act="next" data-id="${b.id}">Demo: advance status</button>
      <button class="btn small danger" data-act="cancel" data-id="${b.id}">Cancel</button>` : ''}
      <button class="btn small ghost" data-act="del" data-id="${b.id}">Remove</button></div></div>`).join('');
}
$('list').addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]'); if(!btn) return;
  const b = bookings.find(x => x.id === btn.dataset.id); if(!b) return;
  if(btn.dataset.act === 'next') b.status++;       // simulates technician updating status
  if(btn.dataset.act === 'cancel') b.cancelled = true;
  if(btn.dataset.act === 'del') bookings = bookings.filter(x => x !== b);
  write(KEY, bookings); renderList();
});
$('clearAll').addEventListener('click', () => { if(bookings.length && confirm('Delete all bookings?')){ bookings = []; write(KEY, bookings); renderList(); } });

/* ================= THEME + MOBILE MENU ================= */
function setTheme(t){ document.documentElement.dataset.theme = t; $('themeBtn').textContent = t === 'dark' ? '☀️' : '🌙'; write(THEME, t); }
$('themeBtn').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
$('burger').addEventListener('click', () => $('menu').classList.toggle('open'));
$('menu').addEventListener('click', () => $('menu').classList.remove('open'));

/* ================= INIT ================= */
setTheme(read(THEME, matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
$('date').min = new Date().toISOString().slice(0,10);
renderChips(); renderServices(); renderTechs(); updateEstimate(); renderList();
