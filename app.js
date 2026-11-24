/* Scadenze Bra 008 · interfaccia (estratta dalla Dashboard MAIN, senza chat WhatsApp) */
"use strict";
const $=i=>document.getElementById(i),DBK="scadenze_db";
const oggi=()=>{const t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate())};
let db=(()=>{try{const d=JSON.parse(localStorage.getItem(DBK));if(d&&Array.isArray(d.pol))return Object.assign(nuovoDb(),d)}catch(e){}return nuovoDb()})();
db.nc=db.nc||{};
let page="scad",sk="sortScad",sd=1,CUR=[],LAST=null,UNDO=null;const FLT={scad:"",urg:"",arch:""},IDX=new Map(),OPEN=new Set();
let VIEW=(()=>{try{return localStorage.getItem("vista")||"cards"}catch(e){return"cards"}})();
const saveLocal=()=>{try{localStorage.setItem(DBK,JSON.stringify(db))}catch(e){alert("Impossibile salvare nel browser (spazio pieno). Scarica subito un backup.")}};
const save=()=>{SY.stamp(db);saveLocal();SY.later();DR.dopo()};
const CAN={whatsapp:["WhatsApp","#0FA45A"],email:["Email","#2F6BFF"],sms:["SMS","#A33CF0"]};
const nCli=a=>new Set(a.map(x=>x.cod)).size;
const fdt=ts=>{const d=new Date(ts);return d.toLocaleDateString("it-IT")+" alle "+d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"})};
const gtxt=x=>x.g<0?"scaduta da "+(-x.g)+" gg":x.g===0?"scade oggi":"tra "+x.g+" gg";
/* ===== tema (auto: segue il chiaro/scuro dell'iPhone o del Mac; su iPhone «Automatico» = alba/tramonto) ===== */
const MQ=matchMedia("(prefers-color-scheme: dark)");
const themeMode=()=>{try{const t=localStorage.getItem("scad_tema");return t==="light"||t==="dark"?t:"auto"}catch(e){return"auto"}};
function applyTheme(){const m=themeMode(),t=m==="auto"?(MQ.matches?"dark":"light"):m;document.documentElement.dataset.theme=t;document.documentElement.dataset.mode=m}
function toggleTheme(){const m=themeMode(),nx=m==="auto"?"light":m==="light"?"dark":"auto";try{nx==="auto"?localStorage.removeItem("scad_tema"):localStorage.setItem("scad_tema",nx)}catch(e){}applyTheme();render();
toast(nx==="auto"?"Tema automatico: segue l'iPhone/Mac (chiaro o scuro)":"Tema "+(nx==="light"?"chiaro":"scuro")+" fisso")}
applyTheme();
/* ===== icone ===== */
const sv=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I={
list:sv('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".8"/><circle cx="3.5" cy="12" r=".8"/><circle cx="3.5" cy="18" r=".8"/>'),
bolt:sv('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
arch:sv('<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4"/>'),
paid:sv('<path d="M5 12.5l4.5 4.5L19 7"/>'),
ban:sv('<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>'),
userx:sv('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
chat:sv('<path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z"/>'),
search:sv('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
moon:sv('<path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/>'),
sun:sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
menu:sv('<path d="M4 6h16M4 12h16M4 18h16"/>'),
check:sv('<path d="M5 13l4 4L19 7"/>'),
mail:sv('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
more:sv('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'),
grid:sv('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
rows:sv('<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/>'),
play:sv('<path d="M6 4l14 8-14 8z"/>'),
cal:sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 16l2 2 4-4"/>'),
euro:sv('<path d="M18 6.5A7 7 0 107 17.5M4 10h9M4 14h9"/>'),
user:sv('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'),
box:sv('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.5-6.9A2 2 0 0016.8 4H7.2a2 2 0 00-1.7 1.1z"/>'),
sms:sv('<path d="M4 4h16v12H8l-4 4z"/>')};
/* ===== stati ===== */
const SC={"Doppio Quietanzamento":"#7C3AED","In Vigore":"#10B866","Scadenza a Breve":"#FFB400","In Tolleranza":"#FF7A1A","Fuori Copertura":"#F43F5E"};
const accOf=x=>SC[x.st]||"#8895AA";
const pill=x=>`<span class="pill" style="background:${accOf(x)};color:${x.st==="Scadenza a Breve"?"#1B1300":"#fff"}">${esc(x.st)}</span>`;
function tolBar(x){if(x.g>=0)return"";const u=-x.g;
if(u>15)return `<div class="tol"><div class="tl2"><i style="width:100%"></i></div><span>Tolleranza finita da ${u-15} gg</span></div>`;
return `<div class="tol"><div class="tl2"><i style="width:${Math.round(u/15*100)}%"></i></div><span>Tolleranza: giorno ${u} di 15</span></div>`}
/* ===== bottoni contatto ===== */
const bWA=(x,c)=>x.wa?`<a class="b c-wa" href="${esc(x.wa)}" data-ch="whatsapp" ${c?'title="WhatsApp"':""}>${I.chat}${c?"":"WhatsApp"}</a>`:`<button class="b c-add" data-act="ct" data-id="${esc(x.id)}">${c?"+ Tel":"+ Telefono"}</button>`;
const bEM=(x,c)=>x.mail?`<a class="b c-em" href="${esc(x.mail)}" data-ch="email" ${c?'title="Email"':""}>${I.mail}${c?"":"Email"}</a>`:`<button class="b c-add" data-act="ct" data-id="${esc(x.id)}">+ Email</button>`;
const bMore=x=>`<button class="b c-gry ic2" title="Altre azioni" data-act="more" data-id="${esc(x.id)}">${I.more}</button>`;
const ricB=x=>x.ric?`<button class="ric" data-act="ric" data-id="${esc(x.id)}">📞 Ricontattare (2ª volta)</button>`:"";
const chk=(x,a,on)=>`<label class="chk" title="${on?"Togli la spunta per riportare da avvisare":"Segna come avvisato"}"><input type="checkbox" data-act="${a}" data-id="${esc(x.id)}" ${on?"checked":""}><span class="bx">${I.check}</span></label>`;
function msgText(x){try{if(x.wa){const i=x.wa.indexOf("&text=");return decodeURIComponent(x.wa.slice(i+6))}if(x.mail){const i=x.mail.indexOf("&body=");return decodeURIComponent(x.mail.slice(i+6))}}catch(e){}return""}
function multi(x,sel){if(!x.multi||!x.details)return"";
return `<details class="multi"><summary><span>📑 ${x.details.length} polizze</span><b>€ ${x.impf}</b></summary><div class="pl">${x.details.map((p,j)=>`<div class="pi"><div><div class="pn">${esc(p.nome)}</div><div class="pm">n. ${esc(p.num)} · scade ${esc(p.scad)}</div>${sel&&p.solo?`<label class="solo"><input type="checkbox" data-act="one" data-id="${esc(x.id)}" data-j="${j}"><span>Avvisa solo questa polizza</span></label>`:""}</div><div class="pp">€ ${eurF(p.imp)}</div></div>`).join("")}</div></details>`}
/* ===== schede ===== */
function card(x){const acc=accOf(x),sub=x.multi?`📑 Polizze multiple · ${x.details.length}`:esc(x.tip);
return `<article class="card" style="--acc:${acc}"><div class="c-top">${chk(x,"chk",false)}<div class="av" style="background:${acc}">${esc(ini(x.cli))}</div><div class="c-id"><h3>${esc(x.cli)}</h3><p>${sub}</p></div><div class="c-amt">€ ${x.impf}</div></div>
${x.dq?'<div class="dq">DOPPIO QUIETANZAMENTO</div>'+(x.dqRole?`<div class="dqrole">💶 ${x.dqRole} · inviandone una, l'altra va in archivio</div>`:""):""}
<div class="c-meta">${pill(x)}<span class="m">📅 ${x.scad}</span><span class="m g">${gtxt(x)}</span>${x.urg&&page==="scad"?'<span class="urgb">❗ Urgente</span>':""}</div>${tolBar(x)}
${x.multi?multi(x,true):`<div class="c-pol">Polizza n. ${esc(x.num)}${x.dq?" · "+esc(x.stReal):""}</div>`}${ricB(x)}
<div class="c-act">${bWA(x)}${bEM(x)}${bPag(x)}${bMore(x)}</div></article>`}
const bPag=x=>`<button class="b c-pag" title="Il cliente ha già pagato: esce dalle scadenze e va in Già pagati" data-act="pag" data-id="${esc(x.id)}">✅ Pagato</button>`;
const dqArchB=x=>{if(!x.dqPair)return"";const r=x.aum===true?"📈 POLIZZA IN AUMENTO":x.aum===false?"POLIZZA PRECEDENTE":"POLIZZA";return `<div class="dq" style="background:${x.inviata?"#00695C":"#B71C1C"}">⚠️ DOPPIO QUIETANZAMENTO · ${r} · ${x.inviata?"✅ INVIATA":"❌ NON INVIATA"}</div>`};
function archCard(x){const c=CAN[x.canale]||[x.canale,"#555"],acc=x.dqPair?(x.inviata?"#00695C":"#B71C1C"):"#10B866";
const extra=x.volti>1?`<div class="c-pol">Contattato ${x.volti} volte<br>${x.ultimi}</div>`:"";
const quando=x.assoc?`<div class="c-pol">Archiviata insieme all'altra scheda · <b>nessun avviso inviato per questa polizza</b></div>`:`<div class="c-meta"><span class="pill" style="background:${c[1]};color:#fff">via ${esc(c[0])}</span><span class="m">🕒 ${fdt(x.ts)}</span></div>${extra}`;
return `<article class="card" style="--acc:${acc}"><div class="c-top">${chk(x,"undo2",true)}<div class="av" style="background:${acc}">${esc(ini(x.cli))}</div><div class="c-id"><h3>${esc(x.cli)}</h3><p>${x.multi?"📑 Polizze multiple":esc(x.tip)} · scad. ${x.scad}</p></div><div class="c-amt">€ ${x.impf}</div></div>
${dqArchB(x)}${quando}${x.multi?multi(x,false):""}<div class="c-act"><button class="b c-or" data-act="undo" data-id="${esc(x.id)}">↩ Ripristina</button>${bPag(x)}${chBtn(x)}</div></article>`}
function ncCard(x){return `<article class="card" style="--acc:#263644"><div class="ban-nc">🚷 NON CONTATTARE</div><div class="c-top"><div class="av" style="background:#263644">${esc(ini(x.cli))}</div><div class="c-id"><h3>${esc(x.cli)}</h3><p>${x.multi?"📑 Polizze multiple":esc(x.tip)} · scad. ${x.scad} (${gtxt(x)})</p></div><div class="c-amt">€ ${x.impf}</div></div>${x.multi?multi(x,false):""}<div class="c-pol">${x.tel?"+39 "+esc(x.tel)+" · ":""}${esc(x.email)}</div><div class="c-act"><button class="b c-grn" data-act="ncoff" data-id="${esc(x.id)}">↩ Riabilita contatto</button></div></article>`}
function pagCard(p){const c=db.contacts[p.cod]||{};return `<article class="card"><div class="c-top"><div class="av" style="background:#16A34A">✅</div><div class="c-id"><h3>${esc(p.cli)}</h3><p>${esc(p.nome)} · n. ${esc(p.num)}</p></div><div class="c-amt">€ ${eurF(p.imp)}</div></div><div class="c-meta"><span class="pill" style="background:#16A34A;color:#fff">Già pagato</span><span class="m">📅 scadenza ${fd(fromISO(p.scad))}</span><span class="m">${p.notif?"📣 avvisato":"non avvisato"} · ${p.pag.man?"segnato pagato a mano":"non più nell'elenco"} il ${fd(new Date(p.pag.ts))}</span></div><div class="c-pol">${esc(c.tel?"+39 "+c.tel:p.tel?"+39 "+p.tel:"")} ${esc(c.email||p.email)}</div><div class="c-act"><button class="b c-or" data-act="unpag" data-k="${esc(p.key)}">↩ Non pagato</button></div></article>`}
function archvCard(p){const c=db.contacts[p.cod]||{},g=Math.round((fromISO(p.scad)-oggi())/864e5);return `<article class="card" style="--acc:#64748B"><div class="c-top"><div class="av" style="background:#64748B">🗄</div><div class="c-id"><h3>${esc(p.cli)}</h3><p>${esc(p.nome)} · n. ${esc(p.num)}</p></div><div class="c-amt">€ ${eurF(p.imp)}</div></div><div class="c-meta"><span class="pill" style="background:#64748B;color:#fff">Archiviata</span><span class="m">📅 scadenza ${fd(fromISO(p.scad))} · ${gtxt({g})}</span><span class="m">archiviata il ${fd(new Date(p.arch.ts))}</span></div><div class="c-pol">${esc(c.tel?"+39 "+c.tel:p.tel?"+39 "+p.tel:"")} ${esc(c.email||p.email)}</div><div class="c-act"><button class="b c-or" data-act="unarch" data-k="${esc(p.key)}">↩ Riporta in Da avvisare</button></div></article>`}
function disCard(p){const c=db.contacts[p.cod]||{};return `<article class="card dis"><div class="c-top"><div class="av" style="background:#7A8798">🚫</div><div class="c-id"><h3>${esc(p.cli)}</h3><p>${esc(p.nome)} · n. ${esc(p.num)}</p></div><div class="c-amt">€ ${eurF(p.imp)}</div></div><div class="c-meta"><span class="pill" style="background:#7A8798;color:#fff">Disdettata / Stornata</span><span class="m">📅 ${fd(fromISO(p.scad))}</span></div><div class="c-pol">${esc(c.tel?"+39 "+c.tel:p.tel?"+39 "+p.tel:"")} ${esc(c.email||p.email)}</div></article>`}
/* ===== elenco (tabella) ===== */
const th=(l,k,cls)=>`<th ${cls?`class="${cls}"`:""}><button data-act="sort" data-k="${k}">${l}${sk===k?(sd>0?" ▲":" ▼"):""}</button></th>`;
function trow(x){const acc=accOf(x),op=OPEN.has(x.id),sub=x.multi?`📑 Polizze multiple · ${x.details.length}`:`${esc(x.tip)} · n. ${esc(x.num)}`;
return `<tr class="tr" style="--acc:${acc}"><td style="width:62px">${chk(x,"chk",false)}</td><td><div class="tn" data-act="tg" data-id="${esc(x.id)}">${esc(x.cli)}</div><div class="ts2">${sub}</div>${x.dq?'<span class="pill" style="background:#6D28D9;color:#fff;margin-top:4px">DOPPIO QUIET.'+(x.dqRole?" · "+x.dqRole:"")+"</span>":""}</td>
<td><b>${x.scad}</b><small>${gtxt(x)}</small></td><td>${pill(x)}</td><td class="ta">€ ${x.impf}</td><td><div class="tact">${ricB(x)?`<button class="b c-or" data-act="ric" data-id="${esc(x.id)}">📞 2ª volta</button>`:""}${bWA(x,1)}${bEM(x,1)}${bPag(x).replace('class="b c-pag"','class="b c-pag sm"')}${bMore(x).replace("ic2","sm")}</div></td></tr>`+
(op?`<tr class="det"><td></td><td colspan="5">${x.multi?multi(x,true).replace("<details",'<details open'):`<div class="ts2">Polizza n. ${esc(x.num)} · 📞 ${x.tel?"+39 "+esc(x.tel):"—"} · ✉️ ${esc(x.email)||"—"}</div>`}${tolBar(x)}</td></tr>`:"")}
function archRow(x){const c=CAN[x.canale]||[x.canale,"#555"],acc=x.dqPair?(x.inviata?"#00695C":"#B71C1C"):"#10B866";
return `<tr class="tr" style="--acc:${acc}"><td style="width:62px">${chk(x,"undo2",true)}</td><td><div class="tn">${esc(x.cli)}</div><div class="ts2">${x.multi?"📑 Polizze multiple · "+x.details.length:esc(x.tip)+" · n. "+esc(x.num)}</div>${dqArchB(x)}</td><td><b>${x.scad}</b></td>
<td>${x.assoc?'<span class="pill" style="background:#7A8798;color:#fff">Archiviata · non inviata</span>':`<span class="pill" style="background:${c[1]};color:#fff">${esc(c[0])}</span><small>${fdt(x.ts)}${x.volti>1?" · "+x.volti+" contatti":""}</small>`}</td><td class="ta">€ ${x.impf}</td><td><div class="tact"><button class="b c-or" data-act="undo" data-id="${esc(x.id)}">↩ Ripristina</button>${chBtn(x)}</div></td></tr>`}
function tabella(secs,ar){const head=ar?th("Cliente","cli")+th("Scadenza","sortScad")+th("Avviso","ts")+th("Importo","imp","ta"):th("Cliente","cli")+th("Scadenza","sortScad")+th("Stato","st")+th("Importo","imp","ta");
return `<div class="tw"><table><thead><tr><th></th>${head}<th></th></tr></thead><tbody>`+secs.map(s=>(s.t?`<tr class="srow"><td colspan="7"><span style="color:${s.c}">■</span> ${esc(s.t)} · ${s.items.length}</td></tr>`:"")+s.items.map(ar?archRow:trow).join("")).join("")+`</tbody></table></div>`}
function schede(secs,fn){return secs.map(s=>(s.t?`<div class="sec" style="--c:${s.c}"><i></i>${esc(s.t)}<em>${s.items.length}${s.sum!=null?" · € "+eurF(s.sum):""}</em></div>`:"")+`<div class="cards">${s.items.map(fn).join("")}</div>`).join("")}
/* ===== sezioni ===== */
function secScad(L){const def=[["dq","Doppio quietanzamento","#7C3AED"],["Fuori Copertura","Fuori copertura","#F43F5E"],["In Tolleranza","In tolleranza","#FF7A1A"],["Scadenza a Breve","Scadenza entro 7 giorni","#FFB400"],["In Vigore","Più avanti","#10B866"]],m={};
L.forEach(x=>{const k=x.dq?"dq":x.stReal;(m[k]=m[k]||[]).push(x)});return def.filter(d=>m[d[0]]).map(d=>({t:d[1],c:d[2],items:m[d[0]],sum:m[d[0]].reduce((s,x)=>s+x.imp,0)}))}
function secArch(L){const o=oggi(),ie=addD(o,-1),m=new Map();L.forEach(x=>{const d=new Date(x.ts),dd=new Date(d.getFullYear(),d.getMonth(),d.getDate()),k=isoD(dd);if(!m.has(k))m.set(k,{t:dd.getTime()===o.getTime()?"Oggi":dd.getTime()===ie.getTime()?"Ieri":dataLunga(k),c:"#10B866",items:[]});m.get(k).items.push(x)});return [...m.values()]}
function raggruppaDQ(L){const out=[],done=new Set();L.forEach(x=>{if(done.has(x))return;if(!x.dq){done.add(x);out.push(x);return}
L.filter(y=>!done.has(y)&&y.dq&&y.cod===x.cod).sort((a,b)=>a.imp-b.imp).forEach(y=>{done.add(y);out.push(y)})});return out}
/* ===== dati ===== */
function compute(){const o=oggi(),G=costruisciGruppi(db,o),NC=costruisciGruppi(db,o,true),nc=db.nc||{};
const rec=costruisciGruppi({...db,pol:db.pol.filter(p=>{if(!p.notif||p.notif.assoc||p.dis||p.pag||p.arch||nc[p.cod])return false;const g=Math.round((fromISO(p.scad)-o)/864e5);return g<=-10&&(p.storia&&p.storia.length?p.storia:[p.notif]).length<2}).map(p=>({...p,notif:null}))},o).map(x=>({...x,ric:true}));
const U=G.filter(x=>x.urg).concat(rec),G2=G.concat(rec),A=costruisciArchivio(db).map(x=>({...x,id:x.keys.join("~")})),Ds=db.pol.filter(p=>p.dis),Pg=db.pol.filter(p=>p.pag&&!p.dis);
const ann=a=>a.forEach(x=>{if(!x.dq)return;const grp=G.filter(y=>y.dq&&y.cod===x.cod);if(grp.length<2)return;const im=grp.map(y=>y.imp),mx=Math.max(...im),mn=Math.min(...im);x.dqRole=mx===mn?"":x.imp===mx?"PREMIO PIÙ ALTO":x.imp===mn?"PREMIO PIÙ BASSO":"PREMIO INTERMEDIO"});ann(G);ann(U);
/* «Da avvisare» comprende anche gli urgenti da ricontattare (2ª volta) */
const Ar=db.pol.filter(p=>p.arch&&!p.pag&&!p.dis);
return{o,G:G2,NC,U,A,Ds,Pg,Ar}}
const lv=x=>x.g+15<=5?"r":x.g<0?"o":"y";
const sorter=(a,b)=>((a[sk]>b[sk]?1:a[sk]<b[sk]?-1:0)*sd)||a.cli.localeCompare(b.cli)||a.imp-b.imp;
const PAGES={scad:["Da avvisare","Clienti con una scadenza ancora da comunicare"],urg:["Promemoria urgenti","Scadenze fino a domenica, già passate o con la tolleranza che sta per finire"],arch:["Archivio avvisati","Chi è stato avvisato, quando e con quale canale"],archv:["Archiviati","Scadenze messe da parte e clienti da non contattare: puoi riportarli in Da avvisare quando vuoi"],pag:["Già pagati","Polizze che non sono più nell'elenco scadenze: a ogni nuovo elenco caricato, chi non c'è più risulta pagato"],dis:["Disdettati","Polizze disdettate o stornate, non vengono avvisate"],nc:["Non contattare","Clienti esclusi da ogni avviso"]};
const SORTS={scad:[["sortScad:1","Scadenza ↑ (più vicine)"],["sortScad:-1","Scadenza ↓ (più lontane)"],["imp:-1","Importo più alto"],["cli:1","Nome A–Z"]],arch:[["ts:-1","Più recenti"],["ts:1","Meno recenti"],["sortScad:1","Scadenza ↑"],["imp:-1","Importo più alto"],["cli:1","Nome A–Z"]]};
/* ===== render ===== */
function render(){if(SY.locked())return SY.lockScreen();const D=compute();LAST=D;const{o,G,NC,U,A,Ds,Pg,Ar}=D;
const T=[["scad","Da avvisare",nCli(G),I.list,"Avvisare","#2F6BFF"],["urg","Urgenti",nCli(U),I.bolt,"Urgenti","#FF5A36"],["arch","Archivio avvisati",A.length,I.arch,"Avvisati","#10B866"],["pag","Già pagati",nCli(Pg),I.paid,"Pagati","#16A34A"],["archv","Archiviati",nCli(Ar)+nCli(NC),I.box,"Archiviati","#64748B"],["dis","Disdettati",nCli(Ds),I.ban,"Disdette","#8B7CF6"]];if(page==="nc")page="archv";
const navB=(t,mob)=>{const n=t[2];return `<button class="${mob?"":"nv "}${page===t[0]?"on":""}" data-act="page" data-p="${t[0]}" style="--nc:${t[5]}">${t[3]}<span>${mob?t[4]:t[1]}</span>${n?`<span class="n ${t[0]==="urg"?"hot":""}">${n}</span>`:(mob?"":'<span class="n z">0</span>')}</button>`};
$("nav").innerHTML=T.map(t=>navB(t,false)).join("");$("bnav").innerHTML=T.map(t=>navB(t,true)).join("");
SY.chip();
$("th").innerHTML=document.documentElement.dataset.theme==="dark"?I.sun:I.moon;
$("q").placeholder=innerWidth<520?"Cerca cliente o polizza":"Cerca cliente, polizza o telefono";
const q=$("q").value.trim().toLowerCase(),m=$("m"),pg=PAGES[page];IDX.clear();
let h="";
const vw=`<div class="seg"><button class="${VIEW==="cards"?"on":""}" data-act="view" data-v="cards" title="Schede">${I.grid}</button><button class="${VIEW==="table"?"on":""}" data-act="view" data-v="table" title="Elenco">${I.rows}</button></div>`;
const sortSel=ls=>`<select class="sel" id="so" data-act="sortsel">${ls.map(s=>`<option value="${s[0]}" ${s[0]===sk+":"+sd?"selected":""}>${s[1]}</option>`).join("")}</select>`;
const head=(extra)=>`<div class="ph"><div><h1>${pg[0]}</h1><p>${pg[1]}</p></div><div class="tools">${extra||""}</div></div>`;
const match=x=>(x.cli+" "+x.num+" "+x.tip+" "+(x.tel||"")).toLowerCase().includes(q);
const empty=(ic,t,s)=>`<div class="empty"><div class="hi">${ic}</div><h3>${t}</h3><div>${s||""}</div></div>`;
if(!db.pol.length){m.innerHTML=`<div class="hero"><div class="hi"><img src="icone/icon-192.png" alt=""></div><h2>Benvenuto in Scadenze</h2><p>Carica l'Excel grezzo delle scadenze (anche più file insieme) oppure un backup. Se hai già i dati su un altro dispositivo, collegalo con la sincronizzazione.</p><div class="hb"><button class="b c-ind" data-act="tool" data-t="upl">📥 Carica Excel scadenze</button><button class="b c-gry" data-act="tool" data-t="imp">♻️ Importa backup</button><button class="b c-gry" data-act="tool" data-t="sync">☁️ Collega Mac ↔ iPhone</button></div></div>`;return}
if(page==="scad"||page==="urg"){const urg=page==="urg",base=urg?U:G,f=FLT[page];
const base2=base.filter(x=>match(x)),counts={};
const chips=urg?[["","Tutti","#475569"],["r","🔴 Urgentissimi","#D6001C"],["o","🟠 Via di mezzo","#E65100"],["y","🟡 Meno urgenti","#E0A800"]]:[["","Tutti","#475569"],...Object.keys(SC).filter(s=>base.some(x=>x.st===s||x.stReal===s)).map(s=>[s,s,SC[s]])];
const cnt=k=>base2.filter(x=>!k||(urg?lv(x)===k:(x.st===k||x.stReal===k))).length;
CUR=base2.filter(x=>!f||(urg?lv(x)===f:(x.st===f||x.stReal===f))).sort(sorter);CUR=raggruppaDQ(CUR);CUR.forEach(x=>IDX.set(x.id,x));
if(page==="scad"){const done=A.filter(a=>!a.assoc&&isoD(new Date(a.ts))===isoD(o)).length,pc=done+nCli(G)?Math.round(done/(done+nCli(G))*100):0,C=2*Math.PI*21;
h+=`<div class="kpis"><div class="kpi"><div class="ic" style="background:linear-gradient(135deg,#2F6BFF,#22C7FF)">${I.user}</div><div><b>${nCli(G)}</b><span>clienti da avvisare</span></div></div>
<button class="kpi kpi-cta" data-act="focus" ${CUR.length?"":"disabled"}><div class="ic">${I.play}</div><div><b>Avvia coda</b><span>${CUR.length} da gestire uno per uno</span></div></button>
<div class="kpi"><div class="ic" style="background:linear-gradient(135deg,#FF5A36,#FFB400)">${I.bolt}</div><div><b>${nCli(U)}</b><span>urgenti</span></div></div>
<div class="kpi"><div class="ring"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="21" fill="none" stroke="var(--sf2)" stroke-width="7"/><circle cx="26" cy="26" r="21" fill="none" stroke="#00834B" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(C*pc/100).toFixed(1)} ${C.toFixed(1)}"/></svg><i>${pc}%</i></div><div><b>${done}</b><span>avvisati oggi</span></div></div></div>`;
const r=db.lastReport;if(r)h+=`<div class="rep"><button class="x" data-act="chiudiRep" title="Chiudi">✕</button><b>Ultimo caricamento</b> · ${esc(r.files.join(", "))}<br>Righe lette: ${r.letti} · escluse (pagamento): ${r.escluse} · <b>nuove polizze: ${r.aggiunte}</b> · già presenti: ${r.duplicate}${r.aggDis?" · passate a disdettate: "+r.aggDis:""}${r.pagate?" · <b>già pagate (non più nell'Excel): "+r.pagate+"</b>":""}${r.errori.length?`<br><b style="color:#D32F45">Errore:</b> ${r.errori.map(esc).join("<br>")}`:""}${r.anom.length?`<details><summary>Anomalie (${r.anom.length})</summary><div class="an">${r.anom.map(esc).join("<br>")}</div></details>`:""}<div class="ts" style="font-weight:500;font-size:13px;margin-top:6px">GDPR: dati personali, usa canali protetti e cancella i dati dopo l'uso.</div></div>`}
h=head(`${urg&&CUR.length?`<button class="cta" data-act="focus">${I.play}Avvia coda</button>`:""}${urg?"":sortSel(SORTS.scad)}${vw}`)+h;
if(urg)h+=`<div class="intro">Scadenze fino a domenica ${fd(addD(o,6-((o.getDay()+6)%7)))}, già scadute e clienti con la tolleranza che finisce entro 5 giorni. Restano anche in "Da avvisare" finché non li segni come avvisati.</div>`;
h+=`<div class="chips">${chips.map(c=>`<button class="chip ${f===c[0]?"on":""}" style="--c:${c[2]};--ct:${c[2]==="#FFB400"||c[2]==="#E0A800"?"#1B1300":"#fff"}" data-act="chip" data-k="${esc(c[0])}"><i></i>${c[1]}<em>${cnt(c[0])}</em></button>`).join("")}</div>`;
if(!CUR.length)h+=empty("🎉","Nessun cliente da mostrare",q||f?"Prova a togliere filtri o ricerca.":"Tutto in ordine: niente da avvisare.");
else{const flat=sk==="sortScad"&&sd===1&&!urg?secScad(CUR):[{items:CUR}];h+=VIEW==="table"?tabella(flat,false):schede(flat,card)}}
else if(page==="arch"){CUR=A.filter(match);const f=FLT.arch;const chips=[["","Tutti","#475569"],["whatsapp","WhatsApp","#0FA45A"],["email","Email","#2F6BFF"],["sms","SMS","#A33CF0"]];
if(f)CUR=CUR.filter(x=>x.canale===f);CUR.sort(sorter);CUR=raggruppaDQ(CUR);CUR.forEach(x=>IDX.set(x.id,x));
const cnt=k=>A.filter(x=>match(x)&&(!k||x.canale===k)).length;
h+=head(sortSel(SORTS.arch)+vw)+`<div class="chips">${chips.map(c=>`<button class="chip ${f===c[0]?"on":""}" style="--c:${c[2]};--ct:${c[2]==="#FFB400"||c[2]==="#E0A800"?"#1B1300":"#fff"}" data-act="chip" data-k="${c[0]}"><i></i>${c[1]}<em>${cnt(c[0])}</em></button>`).join("")}</div>`;
if(!CUR.length)h+=empty("🗂️","Nessun cliente avvisato","Quando segni un cliente come avvisato compare qui.");
else{const flat=sk==="ts"&&sd===-1?secArch(CUR):[{items:CUR}];h+=VIEW==="table"?tabella(flat,true):schede(flat,archCard)}}
else if(page==="nc"){CUR=NC.filter(match).sort(sorter);CUR.forEach(x=>IDX.set(x.id,x));h+=head("")+(CUR.length?`<div class="cards">${CUR.map(ncCard).join("")}</div>`:empty("🚷","Nessun cliente escluso","Dal menu ⋯ di una scheda puoi escludere un cliente dagli avvisi."))}
else if(page==="pag"){const L=Pg.filter(p=>(p.cli+" "+p.num+" "+p.nome).toLowerCase().includes(q)).sort((a,b)=>(b.pag.ts-a.pag.ts)||(a.cli.localeCompare(b.cli)));CUR=[];h+=head("");
if(!L.length)h+=empty("✅","Nessuna polizza pagata","Quando carichi il nuovo elenco scadenze, chi non c'è più finisce qui.");
else{const S=new Map();L.forEach(p=>{const k=(p.pag.man?"m":"x")+fd(new Date(p.pag.ts));if(!S.has(k))S.set(k,[]);S.get(k).push(p)});
S.forEach((v,k)=>{h+=`<div class="sec" style="--c:#16A34A"><i></i>${k[0]==="m"?"Segnati pagati a mano il ":"Non più nell'elenco del "}${k.slice(1)}<em>${nCli(v)===1?"1 cliente":nCli(v)+" clienti"}</em></div><div class="cards">${v.map(pagCard).join("")}</div>`})}}
else if(page==="archv"){const L=Ar.filter(p=>(p.cli+" "+p.num+" "+p.nome).toLowerCase().includes(q)).sort((a,b)=>(a.scad<b.scad?-1:a.scad>b.scad?1:0)),N=NC.filter(match).sort(sorter);CUR=N;N.forEach(x=>IDX.set(x.id,x));h+=head("");
if(!L.length&&!N.length)h+=empty("🗄️","Nessuna scadenza archiviata","Dal menu ⋯ di una scheda puoi archiviarla senza avvisare il cliente, oppure mettere il cliente tra quelli da non contattare.");
if(L.length)h+=`<div class="sec" style="--c:#64748B"><i></i>Scadenze archiviate<em>${nCli(L)===1?"1 cliente":nCli(L)+" clienti"}</em></div><div class="cards">${L.map(archvCard).join("")}</div>`;
if(N.length)h+=`<div class="sec" style="--c:#EC4899"><i></i>Clienti da non contattare<em>${N.length}</em></div><div class="cards">${N.map(ncCard).join("")}</div>`}
else{const L=Ds.filter(p=>(p.cli+" "+p.num+" "+p.nome).toLowerCase().includes(q)).sort((a,b)=>(a.scad<b.scad?-1:a.scad>b.scad?1:0));CUR=[];h+=head("")+(L.length?`<div class="cards">${L.map(disCard).join("")}</div>`:empty("✅","Nessuna polizza disdettata"))}
m.innerHTML=h}
/* ===== modali ===== */
function modal(h,cls){const e=$("mod");e.className=cls||"";e.innerHTML='<div class="box">'+h+'</div>';e.style.display="flex"}
window.chiudi=()=>{const e=$("mod");e.style.display="none";e.className="";render()};
function toast(t,undo){const e=$("toast");e.innerHTML=esc(t)+(undo?' <button data-act="toastundo">Annulla</button>':"");e.classList.add("on");UNDO=undo||null;clearTimeout(toast.t);toast.t=setTimeout(()=>{e.classList.remove("on");UNDO=null},undo?7000:2600)}
/* helper (prima stavano nella parte chat, tolta) */
const MLUN=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
const dataLunga=d=>{const[a,b,c]=d.split("-");return +c+" "+MLUN[+b-1]+" "+a};
const ini=n=>n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"#";
const chBtn=()=>"";

/* ===== azioni ===== */
function setPage(p){page=p;sk=p==="arch"?"ts":"sortScad";sd=p==="arch"?-1:1;$("q").value="";OPEN.clear();render();scrollTo({top:0})}
function finX(X,can,quiet){segna(db,X.keys,can);
if(X.dq){const pp=db.pol.find(p=>p.key===X.keys[0]);if(pp&&pp.notif)db.pol.forEach(p=>{if(p.dq&&!p.dis&&!p.notif&&p.cod===X.cod&&!X.keys.includes(p.key)&&!(db.nc||{})[p.cod])p.notif={ts:pp.notif.ts,canale:can,assoc:true}})}
save();render();if(!quiet)toast("Archiviato: "+X.cli+" ("+CAN[can][0]+")",()=>{ripristina(db,X.keys);save();render()})}
function fin(id,can){const X=IDX.get(id);if(!X)return;$("mod").style.display="none";$("mod").className="";finX(X,can)}
function fin1(id,j,can){const X=IDX.get(id),p=X&&X.details&&X.details[j];if(!p||!p.key)return;segna(db,[p.key],can);save();$("mod").style.display="none";$("mod").className="";render();toast("Archiviata solo la polizza n. "+p.num+" ("+CAN[can][0]+")",()=>{ripristina(db,[p.key]);save();render()})}
function copia(t){try{if(navigator.clipboard)return navigator.clipboard.writeText(t).then(()=>toast("Messaggio copiato"))}catch(e){}
const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy");toast("Messaggio copiato")}catch(e){toast("Copia non riuscita")}a.remove()}
const btnCh=(x,j)=>{const p=j==null?x:x.details[j];return `${p.wa?`<a class="b c-wa" href="${esc(p.wa)}">Apri WhatsApp</a>`:`<button class="b c-add" data-act="ct" data-id="${esc(x.id)}">Aggiungi telefono</button>`}${p.mail?`<a class="b c-em" href="${esc(p.mail)}">Apri Email</a>`:`<button class="b c-add" data-act="ct" data-id="${esc(x.id)}">Aggiungi email</button>`}`};
/* coda guidata */
let FQ=[],FI=0,FCH="",FID="",FSEL=null,FDQ=0;
/* gruppo ricostruito su un sottoinsieme di polizze dello stesso cliente (messaggio solo per quelle) */
function subGroup(keys){const o=oggi(),finoDom=6-((o.getDay()+6)%7);
const L=db.pol.filter(p=>keys.includes(p.key)).map(p=>{const sc=fromISO(p.scad),g=Math.round((sc-o)/864e5);return{...p,sc,g,tol:addD(sc,15),st:stato(g)}});
return L.length?creaGruppo(L,db.contacts||{},finoDom):null}
/* doppio quietanzamento: tutte le schede DQ dello stesso cliente ancora in coda (dalla posizione attuale) */
const dqSib=x=>x&&x.dq?FQ.slice(FI).filter(y=>y.dq&&y.cod===x.cod).sort((a,b)=>a.imp-b.imp):[];
function focusTarget(){const x=FQ[FI];if(!x)return null;const sib=dqSib(x);let T=sib.length>1?sib[Math.min(FDQ,sib.length-1)]:x;
if(T.multi&&FSEL&&FSEL.size<T.keys.length)T=FSEL.size?subGroup([...FSEL]):null;return{x,sib,T}}
function focusShow(){if(FI>=FQ.length){modal(`<div class="done"><div class="big">🎉</div><h3>Coda completata</h3><p>Hai gestito tutti i clienti della lista.</p><button class="b c-gry" data-act="close">Chiudi</button></div>`);return}
const x0=FQ[FI];if(x0.id!==FID){FID=x0.id;FSEL=null;FDQ=0}
const{x,sib,T}=focusTarget(),B=T||x,acc=accOf(B);FCH="";
const full=sib.length>1?sib[Math.min(FDQ,sib.length-1)]:x;
if(full.multi&&!FSEL)FSEL=new Set(full.keys);
const dqBox=sib.length>1?`<div class="fq-dqw"><b>⚠️ DOPPIO QUIETANZAMENTO</b><span>Ci sono ${sib.length} quietanze per lo stesso cliente: scegli quale avviso mandare. Le altre vanno in archivio senza avviso.</span>
<div class="fq-dqs">${sib.map((y,i)=>`<button class="fq-dq ${i===Math.min(FDQ,sib.length-1)?"on":""}" data-act="fdq" data-i="${i}"><i></i><span><b>€ ${y.impf}</b>${y.dqRole?`<em>${esc(y.dqRole)}</em>`:""}<small>${esc(y.tip)} · n. ${esc(y.num)} · scade ${esc(y.scad)}</small></span></button>`).join("")}</div></div>`:"";
const polBox=full.multi?`<div class="fq-pols"><div class="fq-pt"><b>📑 ${full.details.length} polizze</b><span>Togli la spunta a quelle da non avvisare adesso</span></div>${full.details.map(p=>`<label class="fq-pol"><input type="checkbox" data-act="fsel" data-k="${esc(p.key)}" ${FSEL.has(p.key)?"checked":""}><span class="bx">${I.check}</span><span class="t"><b>${esc(p.nome)}</b><small>n. ${esc(p.num)} · scade ${esc(p.scad)}</small></span><span class="a">€ ${eurF(p.imp)}</span></label>`).join("")}</div>`:"";
const nSel=full.multi?FSEL.size:0,parz=full.multi&&nSel<full.details.length;
modal(`<div class="fq-h"><span>${FI+1} / ${FQ.length}</span><div class="pb"><i style="width:${Math.round(FI/FQ.length*100)}%"></i></div><button class="x" data-act="close" title="Esci">✕</button></div>
<div class="fq-b" style="--acc:${acc}"><div class="av" style="background:${acc}">${esc(ini(x.cli))}</div><h2>${esc(x.cli)}</h2><div class="am">€ ${T?T.impf:"0,00"}</div><div>${pill(B)}</div>
<p>${full.multi?(parz?`📑 Avviso solo per ${nSel} di ${full.details.length} polizze`:"📑 Polizze multiple · "+full.details.length):esc(B.tip)}</p><p>📅 ${B.scad} · <b>${gtxt(B)}</b></p>${tolBar(B)}</div>
${dqBox}${polBox}
${T?`<div class="fq-a">${T.wa?`<a class="b c-wa" href="${esc(T.wa)}" data-ch="whatsapp">${I.chat}WhatsApp</a>`:`<span class="b off">WhatsApp</span>`}${T.mail?`<a class="b c-em" href="${esc(T.mail)}" data-ch="email">${I.mail}Email</a>`:`<span class="b off">Email</span>`}${T.sms?`<a class="b c-sms" href="${esc(T.sms)}" data-ch="sms">${I.sms}SMS</a>`:`<span class="b off">SMS</span>`}</div>
<button class="b c-grn" id="fdone" data-act="fdone" style="opacity:.55">✅ Fatto (apri prima un canale)</button>`:`<p class="fq-none">Seleziona almeno una polizza da avvisare.</p>`}
<div class="fq-2"><button class="b c-gry" data-act="farch">🗄 Archivia${parz?" selezionate":""}</button><button class="b c-gry" data-act="fskip">Salta →</button></div>`,"focus")}
/* dopo aver gestito una parte delle polizze, il cliente resta in coda con quelle rimaste */
function focusNext(T,x,sib){
if(sib.length>1){const ids=new Set(sib.map(y=>y.id));FQ=FQ.filter((y,i)=>i<FI||!ids.has(y.id));return focusShow()}
const rest=(x.keys||[]).filter(k=>!T.keys.includes(k)),R=rest.length?subGroup(rest):null;
if(R){FQ[FI]=R;FID=R.id;FSEL=new Set(R.keys);return focusShow()}
FI++;return focusShow()}
/* azioni a click */
function act(t,id,j,el){const x=id?IDX.get(id):null;
switch(t){
case"page":return setPage(el.dataset.p);
case"view":VIEW=el.dataset.v;try{localStorage.setItem("vista",VIEW)}catch(e){}return render();
case"chip":FLT[page]=el.dataset.k;return render();
case"sort":{const k=el.dataset.k;sd=sk===k?-sd:(k==="ts"||k==="imp"?-1:1);sk=k;return render()}
case"sortsel":{const[k,d]=el.value.split(":");sk=k;sd=+d;return render()}
case"tg":OPEN.has(id)?OPEN.delete(id):OPEN.add(id);return render();
case"close":return chiudi();
case"chiudiRep":db.lastReport=null;save();return render();
case"toastundo":if(UNDO){const u=UNDO;UNDO=null;$("toast").classList.remove("on");u()}return;
case"tool":return tool(el.dataset.t);
case"focus":FQ=CUR.slice();FI=0;if(!FQ.length)return toast("Nessun cliente in coda");return focusShow();
case"fdone":if(!FCH)return toast("Apri prima WhatsApp, Email o SMS");{const F=focusTarget();if(!F||!F.T)return;const c=FCH;finX(F.T,c,true);toast("Avvisato: "+F.T.cli+(F.T.keys.length<(F.x.keys||[]).length&&!F.T.dq?" ("+F.T.keys.length+" polizze)":"")+" via "+CAN[c][0]);return focusNext(F.T,F.x,F.sib)}
case"fsel":{const k=el.dataset.k;if(!FSEL)return;el.checked?FSEL.add(k):FSEL.delete(k);return focusShow()}
case"fdq":FDQ=+el.dataset.i;FSEL=null;return focusShow();
case"fskip":{const F=focusTarget();if(F&&F.sib.length>1){const ids=new Set(F.sib.map(y=>y.id));FQ=FQ.filter((y,i)=>i<FI||!ids.has(y.id))}else FI++;return focusShow()}
case"farch":{const F=focusTarget();if(!F)return;const X=F.sib.length>1?{keys:F.sib.flatMap(y=>y.keys),cli:F.x.cli}:(F.T||F.x);const ks=new Set(X.keys||[]),L=db.pol.filter(p=>ks.has(p.key)&&!p.arch),ts=Date.now();L.forEach(p=>p.arch={ts});save();render();
toast("🗄 "+X.cli+" archiviato (lo trovi in Archiviati)",()=>{L.forEach(p=>delete p.arch);save();render()});return focusNext({keys:X.keys},F.x,F.sib)}
case"unarch":{const p=db.pol.find(q=>q.key===el.dataset.k);if(!p)return;const old=p.arch;delete p.arch;save();render();return toast("Riportata in Da avvisare: "+p.cli,()=>{p.arch=old;save();render()})}
case"unpag":{const p=db.pol.find(q=>q.key===el.dataset.k);if(!p)return;const old=p.pag;delete p.pag;save();render();return toast("Riportato tra le scadenze: "+p.cli,()=>{p.pag=old;save();render()})}
}
if(!x&&t!=="undo2")return;
switch(t){
case"archx":{const ks=new Set(x.keys||[]),L=db.pol.filter(p=>ks.has(p.key)&&!p.arch),ts=Date.now();if(!L.length)return;
L.forEach(p=>p.arch={ts});save();$("mod").style.display="none";$("mod").className="";render();
return toast("🗄 "+x.cli+" archiviato (lo trovi in Archiviati)",()=>{L.forEach(p=>delete p.arch);save();render()})}
case"pag":{const ks=new Set(x.keys||[]),L=db.pol.filter(p=>ks.has(p.key)&&!p.pag),ts=Date.now();if(!L.length)return;
L.forEach(p=>p.pag={ts,man:true});save();$("mod").style.display="none";$("mod").className="";render();
return toast("✅ "+x.cli+" segnato come pagato",()=>{L.forEach(p=>delete p.pag);save();render()})}
case"more":{const pv=msgText(x),ck=chBtn(x);
return modal(`<h3>${esc(x.cli)}</h3><p>${x.multi?"Polizze multiple":esc(x.tip)} · € ${x.impf}</p>${pv?`<div class="pv">${esc(pv)}</div><button class="b c-grn" data-act="copy" data-id="${esc(id)}">📋 Copia messaggio</button>`:""}${x.sms?`<a class="b c-sms" href="${esc(x.sms)}">${I.sms}Invia SMS</a>`:""}<button class="b c-ind" data-act="ct" data-id="${esc(id)}">✏️ Modifica contatti</button>${ck}<button class="b c-pag" data-act="pag" data-id="${esc(id)}">✅ Segna come pagato</button><button class="b c-gry" data-act="archx" data-id="${esc(id)}">🗄 Archivia senza avvisare</button><button class="b c-nc" data-act="nc" data-id="${esc(id)}">🚷 Non contattare</button><button class="b c-gry" data-act="close">Chiudi</button>`)}
case"copy":return copia(msgText(x));
case"chk":return modal(`<h3>Come hai avvisato<br>${esc(x.cli)}?</h3><button class="b c-wa" data-act="fin" data-id="${esc(id)}" data-c="whatsapp">${I.chat}WhatsApp</button><button class="b c-em" data-act="fin" data-id="${esc(id)}" data-c="email">${I.mail}Email</button><button class="b c-sms" data-act="fin" data-id="${esc(id)}" data-c="sms">${I.sms}SMS</button><button class="b c-gry" data-act="close">Annulla</button>`);
case"fin":return fin(id,el.dataset.c);
case"ric":return modal(`<h3>Ricontatta ${esc(x.cli)}</h3><p>Scegli come aprire il messaggio precompilato.</p>${btnCh(x)}<p>Dopo aver inviato, registra il ricontatto:</p>${x.wa?`<button class="b c-grn" data-act="fin" data-id="${esc(id)}" data-c="whatsapp">✅ Inviato tramite WhatsApp</button>`:""}${x.mail?`<button class="b c-grn" data-act="fin" data-id="${esc(id)}" data-c="email">✅ Inviato tramite Email</button>`:""}<button class="b c-gry" data-act="close">Chiudi senza registrare</button>`);
case"ct":{const c=db.contacts[x.cod]||{};return modal(`<h3>Contatti di ${esc(x.cli)}</h3><label>Telefono (con o senza +39)<input id="ctel" type="tel" value="${esc(c.tel||x.tel)}" placeholder="3331234567"></label><label>Email<input id="cmail" type="email" value="${esc(c.email||x.email)}" placeholder="nome@dominio.it"></label><button class="b c-grn" data-act="salvact" data-id="${esc(id)}">Salva e genera i link</button><button class="b c-gry" data-act="close">Annulla</button>`)}
case"salvact":{let tel;try{tel=normTel($("ctel").value)}catch(e){return alert(e.message)}const em=$("cmail").value.trim();
if(tel&&tel.length<6)return alert("Numero di telefono non valido");if(em&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return alert("Email non valida");
db.contacts[x.cod]={tel,email:em};save();chiudi();return toast("Contatti salvati")}
case"one":{const p=x.details&&x.details[+j];if(!p||!p.key)return;
return modal(`<h3>Avvisa solo una polizza</h3><p>${esc(x.cli)}<br>${esc(p.nome)} · n. ${esc(p.num)} · € ${eurF(p.imp)}</p><p>Il messaggio riguarda solo questa polizza. Le altre restano da avvisare.</p>${btnCh(x,+j)}${p.sms?`<a class="b c-sms" href="${esc(p.sms)}">Apri SMS</a>`:""}<p>Dopo l'invio, registra:</p><button class="b c-grn" data-act="fin1" data-id="${esc(id)}" data-j="${+j}" data-c="whatsapp">✅ Inviato tramite WhatsApp</button><button class="b c-grn" data-act="fin1" data-id="${esc(id)}" data-j="${+j}" data-c="email">✅ Inviato tramite Email</button><button class="b c-grn" data-act="fin1" data-id="${esc(id)}" data-j="${+j}" data-c="sms">✅ Inviato tramite SMS</button><button class="b c-gry" data-act="close">Annulla</button>`)}
case"fin1":return fin1(id,+j,el.dataset.c);
case"nc":if(confirm("Non contattare più "+x.cli+"?\nTutte le sue scadenze escono da Da avvisare e Urgenti e vanno in Archiviati › Clienti da non contattare. Potrai riabilitarlo quando vuoi.")){db.nc=db.nc||{};const cod=x.cod;db.nc[cod]=new Date().toISOString();save();$("mod").style.display="none";$("mod").className="";render();toast("Spostato in Archiviati (non contattare): "+x.cli,()=>{delete db.nc[cod];save();render()})}return;
case"ncoff":delete db.nc[x.cod];save();render();return toast("Contatto riabilitato");
case"undo2":if(!confirm("Riportare questa scheda in Da avvisare?"))return render();
case"undo":ripristina(db,x.keys);save();render();return toast("Riportato in Da avvisare");
}}
const FIRE=e=>{const t=e.target.closest("[data-act]");if(!t)return;const a=t.dataset.act;
if(e.type==="change"){if(t.tagName==="INPUT"||t.tagName==="SELECT")act(a,t.dataset.id,t.dataset.j,t)}
else if(t.tagName!=="INPUT"&&t.tagName!=="SELECT")act(a,t.dataset.id,t.dataset.j,t)};
document.addEventListener("click",e=>{const c=e.target.closest("[data-ch]");if(c){FCH=c.dataset.ch;const b=$("fdone");if(b){b.style.opacity=1;b.textContent="✅ Fatto · via "+CAN[FCH][0]}}FIRE(e)});
document.addEventListener("change",FIRE);
$("mod").addEventListener("click",e=>{if(e.target===$("mod"))chiudi()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("mod").style.display==="flex")return chiudi();
if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();$("q").focus()}});
/* ===== strumenti ===== */
function tool(t){const c=()=>{$("mod").style.display="none";$("mod").className=""};
if(t==="upl"){c();$("f").click()}else if(t==="imp"){c();$("imp").click()}else if(t==="sync"){SY.modal()}else if(t==="drive"){DR.modal()}
else if(t==="bk"){c();backup()}else if(t==="exp"){c();esporta()}else if(t==="theme")toggleTheme();else if(t==="reset")resetta();
else if(t==="menu")modal(`<h3>Strumenti</h3>${TOOLS.map(x=>`<button class="b ${x[3]}" data-act="tool" data-t="${x[0]}">${x[1]} ${x[2]}</button>`).join("")}<button class="b c-gry" data-act="close">Chiudi</button>`)}
const TOOLS=[["upl","📥","Carica Excel scadenze","c-ind"],["sync","☁️","Sincronizza Mac ↔ iPhone","c-ind"],["drive","📇","Numeri su Google Drive","c-grn"],["bk","💾","Scarica backup","c-grn"],["imp","♻️","Importa backup","c-gry"],["exp","📊","Esporta in Excel (CSV)","c-em"],["theme","🌓","Tema: auto · chiaro · scuro","c-gry"],["reset","🗑","Resetta tutti i dati","c-or"]];
$("tools").innerHTML=TOOLS.map(x=>`<button class="tl" data-act="tool" data-t="${x[0]}"><span class="e">${x[1]}</span>${x[2]}</button>`).join("");
function scarica(nome,blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nome;a.click()}
function backup(){db.lastBackup=new Date().toISOString();save();const t=new Date();
scarica(`Backup_Scadenze_${isoD(t)}_${p2(t.getHours())}${p2(t.getMinutes())}.json`,new Blob([JSON.stringify({app:"scadenze-bra",v:2,exported:db.lastBackup,db})],{type:"application/json"}));render();toast("Backup scaricato (contiene dati personali)")}
async function importaBackup(f){try{const b=JSON.parse(await f.text());const d=(b&&b.scad&&b.scad.db)||(b&&b.db)||b;if(!d||!Array.isArray(d.pol))throw new Error("Formato backup non riconosciuto (manca l'elenco polizze)");
const nAv=d.pol.filter(p=>p&&(p.notif||(p.storia&&p.storia.length))).length;
if(!confirm(`Importare il backup (${d.pol.length} polizze, ${nAv} già avvisate) unendolo ai dati attuali?`))return;
const r=unisciBackup(db,d);save();render();
alert(`Backup importato.\nPolizze nuove: ${r.n}\nPolizze già presenti aggiornate (avvisi/disdette/pagati): ${r.agg}\nRecord non validi scartati: ${r.scartate}`)}catch(err){alert("Backup non importato: "+err.message)}}
function esporta(){const c=s=>'"'+String(s??"").replace(/"/g,'""')+'"',G=costruisciGruppi(db,oggi()),A=costruisciArchivio(db);
const R=[["Inviato","Data","Ora","Canale","Nome Cliente","Tipologia / Targa","Scadenza e stato","Importo","Telefono","E-mail"]]
.concat(G.map(x=>["","","","",x.cli,x.tip,x.scad+" - "+x.st,x.impf,x.tel?"+39"+x.tel:"",x.email]))
.concat(A.map(x=>{const d=new Date(x.ts);return[x.assoc?"NO (archiviata, non inviata)":"OK",d.toLocaleDateString("it-IT"),d.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}),x.assoc?"":(CAN[x.canale]||[x.canale])[0],x.cli,x.tip,x.scad,x.impf,x.tel?"+39"+x.tel:"",x.email]}));
scarica("Scadenze_"+isoD(new Date())+".csv",new Blob(["﻿"+R.map(r=>r.map(c).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}))}
function resetta(){const n=db.pol.length;if(prompt("Stai per cancellare TUTTI i dati ("+n+" polizze, avvisi, contatti, Non contattare)"+(SY.on()?", anche sugli altri dispositivi collegati":"")+". Scrivi RESET per confermare:")!=="RESET")return;
db=nuovoDb();db.resetAt=Date.now();OPEN.clear();FLT.scad=FLT.urg=FLT.arch="";page="scad";$("q").value="";SY.snap(db);save();$("mod").style.display="none";render();toast("Tutti i dati sono stati cancellati")}
async function caricaFile(files){const agg={files:[],letti:0,escluse:0,aggiunte:0,duplicate:0,aggDis:0,pagate:0,anom:[],errori:[]},keys=new Set();let maxS='';
for(const f of files){try{const rows=await leggiXlsx(await f.arrayBuffer());const r=estrai(rows),u=unisci(db,r.recs);r.recs.forEach(x=>{keys.add(x.key);if(x.scad>maxS)maxS=x.scad});agg.files.push(f.name);agg.letti+=r.rep.letti;agg.escluse+=r.rep.escluse;
agg.aggiunte+=u.aggiunte;agg.duplicate+=u.duplicate;agg.aggDis+=u.aggDis;agg.anom.push(...r.rep.anom)}catch(e){agg.errori.push(f.name+": "+e.message)}}
if(!agg.errori.length&&keys.size)agg.pagate=segnaPagate(db,keys,maxS);
agg.ts=Date.now();db.lastReport=agg;save();setPage("scad")}
async function smista(files){const F=[...files],x=F.filter(f=>/\.(xlsx|xlsm)$/i.test(f.name)),j=F.filter(f=>/\.json$/i.test(f.name))
if(x.length)await caricaFile(x);if(j.length)await importaBackup(j[0]);if(!x.length&&!j.length)toast("Formato non supportato")}
$("f").onchange=e=>{if(e.target.files.length)caricaFile([...e.target.files]);e.target.value=""};
$("imp").onchange=e=>{const f=e.target.files[0];e.target.value="";if(f)importaBackup(f)};
let dragN=0;const ov=$("dropov");
addEventListener("dragenter",e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes("Files")){dragN++;ov.style.display="flex"}});
addEventListener("dragleave",()=>{dragN=Math.max(0,dragN-1);if(!dragN)ov.style.display="none"});
addEventListener("dragover",e=>e.preventDefault());
addEventListener("drop",e=>{e.preventDefault();dragN=0;ov.style.display="none";if(e.dataTransfer.files.length)smista(e.dataTransfer.files)});
$("q").oninput=render;
const tick=()=>{if(themeMode()==="auto"){const o=document.documentElement.dataset.theme;applyTheme();if(document.documentElement.dataset.theme!==o)render()}};(MQ.addEventListener?MQ.addEventListener("change",tick):MQ.addListener(tick));document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick()});
$("th").onclick=toggleTheme;$("mn").onclick=()=>tool("menu");$("bkc").onclick=()=>SY.modal();
SY.init({get:()=>db,set:d=>{db=d},save:saveLocal,render:()=>{if($("mod").style.display!=="flex")render()},toast:(t)=>toast(t)});
if(!SY.locked())DR.init({get:()=>db,save:saveLocal,snap:d=>SY.snap(d),later:()=>SY.later(),render:()=>{if($("mod").style.display!=="flex")render()},toast:(t)=>toast(t)});
render()


