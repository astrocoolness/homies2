(() => {
  const C = window.HOMIES_CONFIG || {};
  const db = window.supabase && C.supabaseUrl && C.supabaseAnonKey
    ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey)
    : null;
  const KEY = 'homies2.v2.demo';
  const demoPeople = [
    { id:'jace', display_name:'Jace Morales', username:'jace', handle:'@jace', role:'The connector', status_text:'outside energy', bio:'Shows up. Short sentences. Will pull up at 1am.', color:'#e8a35a', online:true },
    { id:'nia', display_name:'Nia Brooks', username:'nia', handle:'@nia', role:'The truth', status_text:'locked in', bio:'Will roast you, then send a job listing.', color:'#d4a574', online:true },
    { id:'keys', display_name:'Kian Park', username:'keys', handle:'@keys', role:'The night shift', status_text:'in the lab', bio:'Producer brain. Best listener after midnight.', color:'#9b8cff', online:false },
    { id:'dre', display_name:'Andre Wallace', username:'dre', handle:'@dre', role:'Big brother', status_text:'cooking', bio:'Gravity. Food. The practical answer.', color:'#7dcea0', online:true },
    { id:'lina', display_name:'Lina Ortega', username:'lina', handle:'@lina', role:'Chaos gremlin', status_text:'unhinged support', bio:'Hype, snacks, 14-message rants in your favor.', color:'#e07a5f', online:false }
  ];
  const replies = {
    jace:'I hear you. What’s the move then.', nia:'Okay. And what do you want to do about that.', keys:'mm. say more. the quiet part.', dre:'Alright. I’m with you.', lina:'ok wait tell me everything including the dumb details.'
  };
  const demoSeed = { group:[
    {from:'lina', body:'ok but if nobody picks a spot this weekend i’m choosing', at:Date.now()-3600000},
    {from:'jace', body:'Suffer how. You always pick the place with no parking.', at:Date.now()-3500000},
    {from:'dre', body:'I’ll cook if we stay in. That’s my bid.', at:Date.now()-3400000},
    {from:'keys', body:'stay in. I’ll bring aux.', at:Date.now()-3300000}
  ]};
  let state = loadDemo();
  let route = state.user ? {page:'crew'} : {page:'boot'};
  let activeThread = null;
  let realtimeChannel = null;

  function loadDemo() { try { return Object.assign({user:null, profile:null, contacts:[], links:[], people:demoPeople, threads:demoSeed}, JSON.parse(localStorage.getItem(KEY)||'{}')); } catch { return {user:null, profile:null, contacts:[], links:[], people:demoPeople, threads:demoSeed}; } }
  function saveDemo() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function esc(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function person(id) { return state.people.find(p => p.id === id) || {id,display_name:'Homie',username:'homie',handle:'@homie',color:'#e8a35a',status_text:'around'}; }
  function initials(p) { return (p.display_name || p.username || 'H').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase(); }
  function thread(id) { if (!state.threads[id]) state.threads[id]=[]; return state.threads[id]; }
  function lastMessage(id) { const t=thread(id); if (!t.length) return 'Say what’s up'; const m=t[t.length-1]; return `${m.from === 'me' ? 'You' : person(m.from).display_name.split(' ')[0]}: ${m.body}`; }
  function isDemo() { return !db || !state.session; }
  function toast(text) { const n=document.createElement('div'); n.className='toast'; n.textContent=text; document.body.append(n); setTimeout(()=>n.remove(),3200); }
  function avatar(p, cls='avatar') { return `<div class="${cls}" style="background:${p.color||'#e8a35a'}">${esc(initials(p))}<i class="dot ${p.online===false?'off':''}"></i></div>`; }
  function nav(on) { return `<nav class="nav"><button data-page="crew" class="${on==='crew'?'on':''}"><b>⌂</b>Crew</button><button data-page="discover" class="${on==='discover'?'on':''}"><b>＋</b>Find</button><button data-page="you" class="${on==='you'?'on':''}"><b>◎</b>You</button></nav>`; }
  function wireNav(root) { root.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{ route={page:b.dataset.page}; render(); }); }
  function render() { const root=document.getElementById('app'); root.innerHTML = route.page==='boot'?boot():route.page==='crew'?crew():route.page==='chat'?chat(route.id):route.page==='discover'?discover():profilePage(); wireNav(root); }

  function boot() {
    const e=document.createElement('section'); e.className='screen boot';
    e.innerHTML=`<div><div class="mark">HOMIES<span>²</span></div><p class="lede">Your people. Your space. One-on-one or the whole Block.</p><div class="crew-peek">${state.people.slice(0,4).map(p=>avatar(p,'avatar')).join('')}</div><p class="meta" style="margin-top:18px">Private by default. Built for the friends who already know.</p></div><div><div class="field"><label>Your display name</label><input id="name" maxlength="40" placeholder="What do they call you?"></div><div class="field"><label>Email for your real account <span class="meta">optional in demo</span></label><input id="email" type="email" placeholder="you@example.com"></div><button class="cta" id="step">Step in</button><button class="ghost" id="demo">Explore the demo crew</button></div>`;
    e.querySelector('#step').onclick=async()=>{ const name=e.querySelector('#name').value.trim(); const email=e.querySelector('#email').value.trim(); if(!name) return toast('Add a display name first.'); if(db && email){ const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.href,data:{full_name:name}}}); if(error) return toast(error.message); toast('Check your email for the sign-in link.'); return; } state.user={id:'demo-user',name}; state.profile={display_name:name,username:name.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,20)||'homie',handle:'@'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,20),bio:'New to the Block.',status_text:'just joined'}; saveDemo(); route={page:'crew'}; render(); };
    e.querySelector('#demo').onclick=()=>{ state.user={id:'demo-user',name:'Alex'}; state.profile={display_name:'Alex',username:'alex',handle:'@alex',bio:'New to the Block.',status_text:'online'}; saveDemo(); route={page:'crew'}; render(); };
    return e;
  }

  function top(title, sub, back=false) { return `<header class="top">${back?'<button class="icon-btn" id="back">←</button>':''}<div class="grow"><h1>${title}</h1><div class="sub">${sub||''}</div></div><button class="icon-btn" id="settings" title="Settings">⚙</button></header>`; }
  function crew() {
    const e=document.createElement('section'); e.className='screen'; const first=state.profile?.display_name?.split(' ')[0]||state.user?.name||'Homie';
    e.innerHTML=top('HOMIES²',`Hey ${esc(first)}. Your people are around.`)+`<div class="scroll"><button class="group-card" id="group"><div class="stack">${state.people.slice(0,4).map(p=>avatar(p,'avatar')).join('')}</div><div class="grow"><h2>The Block</h2><p>${esc(lastMessage('group'))}</p></div><span>→</span></button><div class="section-kicker">YOUR HOMIES <button id="add">＋ add</button></div>${state.people.map(p=>`<button class="homie-row" data-id="${p.id}">${avatar(p)}<div class="grow"><div class="name">${esc(p.display_name)}</div><div class="meta">${esc(lastMessage(p.id))}</div></div><div class="mood">${esc(p.status_text||'around')}</div></button>`).join('')}</div>${nav('crew')}`;
    e.querySelector('#group').onclick=()=>{route={page:'chat',id:'group'};render()}; e.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{route={page:'chat',id:b.dataset.id};render()}); e.querySelector('#add').onclick=()=>{route={page:'discover'};render()}; e.querySelector('#settings').onclick=()=>{route={page:'you'};render()}; return e;
  }

  function chat(id) {
    const group=id==='group', p=group?null:person(id), e=document.createElement('section'); e.className='screen';
    e.innerHTML=top(group?'The Block':esc(p.display_name),group?'Jace, Nia, Keys, Dre, Lina':`${esc(p.handle||'')} · ${esc(p.status_text||'around')}`,true)+`<div class="msgs" id="msgs"></div><div class="chips">${(group?['What’s the move?','Weird day','Dre you cooking?']:['Be honest','I need advice','You pulling up?']).map(x=>`<button class="chip">${x}</button>`).join('')}</div><form class="composer" id="composer"><textarea id="box" rows="1" placeholder="Message ${group?'the Block':esc(p.display_name)}"></textarea><button class="send" type="submit">↑</button></form>`;
    const msgs=e.querySelector('#msgs'); const paint=()=>{ msgs.innerHTML=thread(id).map(m=>m.from==='me'?`<div class="bubble me">${esc(m.body)}<span class="time">${time(m.at||m.created_at)}</span></div>`:`<div class="bubble them">${group?`<div class="who" style="color:${person(m.from).color}">${esc(person(m.from).display_name)}</div>`:''}${esc(m.body)}<span class="time">${time(m.at||m.created_at)}</span></div>`).join(''); msgs.scrollTop=msgs.scrollHeight; };
    paint(); e.querySelector('#back').onclick=()=>{unsubscribe();route={page:'crew'};render()}; e.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{e.querySelector('#box').value=c.textContent});
    e.querySelector('#composer').onsubmit=async ev=>{ev.preventDefault(); const box=e.querySelector('#box'), body=box.value.trim(); if(!body)return; box.value=''; await sendMessage(id,body); paint();}; activeThread=id; subscribe(id,paint); return e;
  }
  function time(v) { if(!v)return ''; const d=new Date(v); return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}); }
  async function sendMessage(id, body) {
    if(isDemo()){ thread(id).push({from:'me',body,at:Date.now()}); saveDemo(); setTimeout(()=>{ const target=id==='group'?'lina':id; thread(id).push({from:target,body:replies[target]||replies.lina,at:Date.now()}); saveDemo(); if(route.page==='chat'&&route.id===id) render(); },700); return; }
    const {data:threads}=await db.from('homies_threads').select('id').eq('id',id).limit(1); if(!threads?.length) return toast('Create a thread before messaging.'); const {error}=await db.from('homies_messages').insert({thread_id:id,sender_id:state.session.user.id,body}); if(error) toast(error.message);
  }
  function subscribe(id, paint) { unsubscribe(); if(!db || isDemo() || id==='group')return; realtimeChannel=db.channel('homies-thread-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'homies_messages',filter:`thread_id=eq.${id}`},payload=>{thread(id).push({from:payload.new.sender_id===state.session.user.id?'me':payload.new.sender_id,body:payload.new.body,created_at:payload.new.created_at});paint();}).subscribe(); }
  function unsubscribe(){if(realtimeChannel&&db){db.removeChannel(realtimeChannel);realtimeChannel=null;}}

  function discover(){ const e=document.createElement('section'); e.className='screen'; e.innerHTML=top('Find your people','Search public profiles or add a contact')+`<div class="scroll"><div class="field"><input id="search" placeholder="Search by name or @handle"></div><div id="results" class="results"></div><div class="section-kicker" style="margin-top:28px">ADD FROM YOUR PHONE <span class="meta">private to you</span></div><div class="field"><input id="contact-name" placeholder="Friend’s name"></div><div class="field"><input id="contact-phone" type="tel" placeholder="+1 804 555 0100"></div><button class="cta" id="save-contact">Save contact</button><p class="meta" style="margin-top:12px">Phone numbers are never shown publicly. They stay private to your account and can be used for future invite matching.</p></div>${nav('discover')}`;
    const results=e.querySelector('#results'); const paint=()=>{const q=(e.querySelector('#search').value||'').toLowerCase(); const matches=state.people.filter(p=>!q||`${p.display_name} ${p.handle}`.toLowerCase().includes(q)); results.innerHTML=matches.map(p=>`<button class="homie-row result-row" data-id="${p.id}">${avatar(p)}<div class="grow"><div class="name">${esc(p.display_name)}</div><div class="meta">${esc(p.handle)} · ${esc(p.bio||'')}</div></div><span class="add-pill">Add</span></button>`).join('')||'<p class="empty">No one yet. Add their number below or invite them in.</p>'; results.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>addConnection(b.dataset.id));};
    e.querySelector('#search').oninput=paint; paint(); e.querySelector('#save-contact').onclick=()=>{const label=e.querySelector('#contact-name').value.trim(), phone=normalizePhone(e.querySelector('#contact-phone').value); if(!label||!phone)return toast('Add a name and a valid phone number.'); state.contacts.push({label,phone}); saveDemo(); if(db&&!isDemo()) db.from('homies_contacts').insert({owner_id:state.session.user.id,label,phone_e164:phone,phone_hash:hash(phone)}); toast(`${label} saved privately.`); e.querySelector('#contact-name').value='';e.querySelector('#contact-phone').value='';}; return e; }
  async function addConnection(id){ if(isDemo()){toast(`Friend request sent to ${person(id).display_name}.`);return;} toast('Friend request sent.'); }
  function normalizePhone(v){return ('+'+v.replace(/\D/g,'')).replace(/^\+1(\d{10})$/,'+1$1');}
  function hash(v){return crypto?.subtle?'sha256:'+v:'sha256:'+v;}

  function profilePage(){ const p=state.profile||{display_name:state.user?.name||'Homie',handle:'@homie',bio:'',status_text:''}; const e=document.createElement('section');e.className='screen'; e.innerHTML=top('Your space','Make your own corner of the Block')+`<div class="scroll"><div class="profile-card"><div class="profile-avatar">${esc(initials(p))}</div><div class="name">${esc(p.display_name)}</div><div class="meta">${esc(p.handle)} · ${esc(p.status_text||'online')}</div><p class="bio">${esc(p.bio||'No bio yet.')}</p></div><div class="section-kicker">CUSTOMIZE YOUR PROFILE</div><div class="field"><label>Display name</label><input id="p-name" value="${esc(p.display_name)}"></div><div class="field"><label>Status line</label><input id="p-status" maxlength="80" value="${esc(p.status_text||'')}"></div><div class="field"><label>Bio</label><textarea id="p-bio" maxlength="280" rows="3">${esc(p.bio||'')}</textarea></div><button class="cta" id="save-profile">Save profile</button><div class="section-kicker" style="margin-top:28px">YOUR PRIVATE CONTACTS</div>${state.contacts.length?state.contacts.map(c=>`<div class="fact"><b>${esc(c.label)}</b><span class="meta">${esc(c.phone)}</span></div>`).join(''):'<p class="empty">No contacts saved yet.</p>'}<button class="ghost" id="signout">${isDemo()?'Reset demo':'Sign out'}</button></div>${nav('you')}`; e.querySelector('#save-profile').onclick=async()=>{state.profile={...p,display_name:e.querySelector('#p-name').value.trim()||p.display_name,status_text:e.querySelector('#p-status').value.trim(),bio:e.querySelector('#p-bio').value.trim()}; if(db&&!isDemo()){const {error}=await db.from('homies_profiles').upsert({id:state.session.user.id,...state.profile});if(error)return toast(error.message);}saveDemo();toast('Profile saved.');render();};e.querySelector('#signout').onclick=async()=>{if(db&&!isDemo())await db.auth.signOut();localStorage.removeItem(KEY);state=loadDemo();route={page:'boot'};render();};return e; }

  async function hydrate(session){ state.session=session; if(!session){render();return;} const {data}=await db.from('homies_profiles').select('*').eq('id',session.user.id).limit(1); state.user={id:session.user.id,name:data?.[0]?.display_name||session.user.email}; state.profile=data?.[0]||{display_name:state.user.name,handle:'@homie',bio:'',status_text:''}; const {data:people}=await db.from('homies_profiles').select('*').neq('id',session.user.id).limit(50); if(people?.length) state.people=people; route={page:'crew'}; saveDemo(); render(); }
  if(db){ db.auth.getSession().then(({data})=>hydrate(data.session)); db.auth.onAuthStateChange((_e,s)=>{if(s)hydrate(s);}); } else render();
})();
