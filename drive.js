/* Scadenze · numeri e email dei clienti salvati anche su Google Drive
   - Un tuo script Google (Apps Script, sul tuo account) tiene il foglio «Scadenze Bra 008 – numeri clienti» nel tuo Drive.
   - L'app gli manda i contatti quando li modifichi e li rilegge all'apertura: ogni contatto ha la data di modifica (mt)
     e vince sempre il più recente, quindi un numero corretto sull'iPhone arriva anche sul Mac (e viceversa).
   - Lo script risponde solo a chi conosce il codice segreto, ricavato dalla chiave del link privato (mai nel codice). */
"use strict";
const DR=(()=>{
const URL_RE=/^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[\w-]+\/exec$/;
let H=null,busy=false,again=false,timer=null,last="",st={s:"off",ts:0,err:"",n:0,foglio:""};
const ls={get:k=>{try{return localStorage.getItem(k)||""}catch(e){return""}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const url=()=>{const d=H&&H.get();return(d&&d.drive&&d.drive.url)||""};
async function segreto(){const k=ls.get("scad:key");if(!k)throw new Error("Apri l'app dal link privato");
const h=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("scadenze-numeri|"+k)));return[...h].map(b=>b.toString(16).padStart(2,"0")).join("").slice(0,40)}
function contatti(d){const nm={};(d.pol||[]).forEach(p=>{if(!nm[p.cod])nm[p.cod]=p.cli});const C={};
for(const k in d.contacts||{}){const c=d.contacts[k];if(c&&(c.tel||c.email||c.mt))C[k]={tel:c.tel||"",email:c.email||"",mt:c.mt||0,cli:nm[k]||""}}return C}
async function chiama(u,body){let r;try{r=body?await fetch(u,{method:"POST",body:JSON.stringify(body)}):await fetch(u+"?s="+encodeURIComponent(await segreto())+"&t="+Date.now(),{cache:"no-store"})}
catch(e){throw new Error("Google Drive non raggiungibile: controlla la rete e che lo script sia distribuito con accesso «Chiunque»")}
let j;try{j=await r.json()}catch(e){throw new Error("Lo script Google non ha risposto bene ("+r.status+"): ridistribuiscilo come «App web»")}
if(!j.ok)throw new Error(j.err==="accesso negato"?"Lo script Google ha un codice segreto diverso: ricopia il codice da qui":j.err||"risposta non valida");return j}
/* applica i contatti più recenti arrivati da Drive */
function applica(R){const d=H.get();d.contacts=d.contacts||{};let ch=0;
for(const k in R||{}){const c=R[k],l=d.contacts[k];if(!c)continue;if(!l||(c.mt||0)>(l.mt||0)){d.contacts[k]={tel:c.tel||"",email:c.email||"",mt:c.mt||0};ch++}}
if(ch){H.snap(d);H.save();H.later();H.render()}return ch}
async function adesso(forza){const u=url();if(!H||!u)return;if(busy){again=true;return}busy=true;st={...st,s:"run"};
try{const d=H.get(),C=contatti(d),sig=JSON.stringify(C);let j;
if(!forza&&sig===last)j=await chiama(u);else j=await chiama(u,{s:await segreto(),contatti:C});
applica(j.contatti);last=JSON.stringify(contatti(H.get()));st={s:"ok",ts:Date.now(),err:"",n:Object.keys(j.contatti||{}).length,foglio:j.foglio||st.foglio}}
catch(e){st={...st,s:"err",err:e.message||String(e)}}
busy=false;if(again){again=false;later(800)}}
function later(ms){if(!url())return;clearTimeout(timer);timer=setTimeout(()=>adesso(),ms==null?1500:ms)}
/* --- codice dello script Google (il segreto viene inserito al momento della copia) --- */
const GS=`/* Scadenze Bra 008 · numeri clienti su Google Drive (v1)
   Incolla tutto questo codice in un progetto nuovo di script.google.com, poi
   Distribuisci › Nuova distribuzione › App web · Esegui come: Me · Chi ha accesso: Chiunque. */
const SEGRETO = "__SEGRETO__";
const NOME = "Scadenze Bra 008 – numeri clienti";
function foglio_() {
  const pr = PropertiesService.getScriptProperties();
  let ss = null;
  const id = pr.getProperty("foglio");
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create(NOME);
    pr.setProperty("foglio", ss.getId());
    const sh = ss.getSheets()[0];
    sh.setName("Numeri");
    sh.getRange(1, 1, 1, 6).setValues([["Codice cliente", "Cliente", "Telefono", "Email", "Aggiornato il", "mt"]]).setFontWeight("bold");
    sh.getRange("A:D").setNumberFormat("@");
    sh.setFrozenRows(1);
    sh.hideColumns(6);
  }
  return ss;
}
function leggi_(sh) {
  const v = sh.getDataRange().getValues(), m = {};
  for (let i = 1; i < v.length; i++) {
    const r = v[i];
    if (!r[0]) continue;
    m[String(r[0])] = { row: i + 1, cli: String(r[1] || ""), tel: String(r[2] || ""), email: String(r[3] || ""), mt: Number(r[5]) || 0 };
  }
  return m;
}
function tutti_(m) { const c = {}; for (const k in m) c[k] = { tel: m[k].tel, email: m[k].email, mt: m[k].mt, cli: m[k].cli }; return c; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function doGet(e) {
  if (((e && e.parameter) || {}).s !== SEGRETO) return out_({ ok: false, err: "accesso negato" });
  const ss = foglio_();
  return out_({ ok: true, v: 1, foglio: ss.getUrl(), contatti: tutti_(leggi_(ss.getSheets()[0])) });
}
function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, err: "richiesta non valida" }); }
  if (!b || b.s !== SEGRETO) return out_({ ok: false, err: "accesso negato" });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = foglio_(), sh = ss.getSheets()[0], m = leggi_(sh), nuove = [];
    let n = 0;
    for (const k in (b.contatti || {})) {
      const c = b.contatti[k] || {}, mt = Number(c.mt) || 0, v = m[k];
      if (v && mt <= v.mt) continue;
      const cli = String(c.cli || (v && v.cli) || ""), tel = String(c.tel || ""), email = String(c.email || "");
      const riga = [k, cli, tel, email, new Date(mt || Date.now()), mt];
      if (v) sh.getRange(v.row, 1, 1, 6).setValues([riga]); else nuove.push(riga);
      m[k] = { row: v ? v.row : 0, cli: cli, tel: tel, email: email, mt: mt };
      n++;
    }
    if (nuove.length) sh.getRange(sh.getLastRow() + 1, 1, nuove.length, 6).setValues(nuove);
    return out_({ ok: true, v: 1, salvati: n, foglio: ss.getUrl(), contatti: tutti_(m) });
  } finally { lock.releaseLock(); }
}
/* Prova dall'editor: seleziona «autorizza» e premi Esegui, così Google chiede i permessi una volta sola. */
function autorizza() { Logger.log(foglio_().getUrl()); }
`;
async function codice(){return GS.replace("__SEGRETO__",await segreto())}
/* --- finestra --- */
const hm=ts=>{const d=new Date(ts);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
function modal(){const u=url(),E=s=>esc(s);
if(!u){window.modal(`<h3>📇 Numeri su Google Drive</h3><p>I numeri e le email che aggiorni vengono salvati anche in un foglio Google sul tuo Drive. Serve <b>una volta sola</b>, dal Mac:</p>
<p>1. Copia il codice dello script.<br>2. Apri Google Apps Script con il tuo <b>account Google di lavoro</b> › nuovo progetto › cancella tutto e incolla › 💾 Salva.<br>3. Scegli la funzione <b>autorizza</b> e premi <b>Esegui</b>: autorizza (Avanzate › Vai al progetto › Consenti).<br>4. <b>Distribuisci › Nuova distribuzione</b> › tipo <b>App web</b> · Esegui come: <b>Me</b> · Chi ha accesso: <b>Chiunque</b> › Distribuisci.<br>5. Copia l'URL che finisce con <code>/exec</code> e incollalo qui.</p>
<button class="b c-ind" data-act="dr" data-k="code">📋 Copia il codice dello script</button>
<a class="b c-gry" href="https://script.google.com/home/projects/create" target="_blank" rel="noopener">Apri Google Apps Script ↗</a>
<label>Indirizzo dello script (URL /exec)<input id="drurl" type="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec"></label>
<button class="b c-grn" data-act="dr" data-k="link">✅ Collega e salva i numeri</button>
<p class="ts">Il foglio è leggibile solo dal tuo account Google. Lo script risponde solo all'app aperta dal tuo link privato. Basta collegarlo su un dispositivo: gli altri lo ritrovano con la sincronizzazione.</p><button class="b c-gry" data-act="close">Chiudi</button>`);return}
window.modal(`<h3>📇 Numeri su Google Drive</h3><p>Ogni numero o email che modifichi viene salvato nel foglio «Scadenze Bra 008 – numeri clienti» del tuo Drive e ritorna su tutti i dispositivi.</p>
<div class="syst sy-${st.s}"><i class="dot"></i>${st.s==="err"?"Errore: "+E(st.err):st.s==="run"?"Salvataggio in corso…":st.ts?`Salvati ${st.n} contatti · ultimo controllo alle ${hm(st.ts)}`:"In attesa del primo salvataggio"}</div>
<button class="b c-ind" data-act="dr" data-k="now">🔄 Salva adesso su Drive</button>
${st.foglio?`<a class="b c-grn" href="${E(st.foglio)}" target="_blank" rel="noopener">Apri il foglio su Drive ↗</a>`:""}
<button class="b c-gry" data-act="dr" data-k="code">📋 Copia di nuovo il codice dello script</button>
<button class="b c-or" data-act="dr" data-k="off">Scollega Google Drive</button><button class="b c-gry" data-act="close">Chiudi</button>`)}
async function azione(k){
if(k==="code"){const c=await codice();try{await navigator.clipboard.writeText(c);H.toast("Codice dello script copiato: incollalo in Apps Script")}catch(e){window.modal(`<h3>Codice dello script</h3><p>Seleziona tutto e copia:</p><textarea style="width:100%;height:260px;font:12px ui-monospace,monospace">${esc(c)}</textarea><button class="b c-gry" data-act="close">Chiudi</button>`)}return}
if(k==="link"){const u=document.getElementById("drurl").value.trim();if(!URL_RE.test(u))return alert("L'indirizzo deve essere quello dell'App web e finire con /exec");
try{await chiama(u)}catch(e){return alert("Script non collegato: "+e.message)}
const d=H.get();d.drive={url:u,ts:Date.now()};H.save();H.later();window.chiudi();H.toast("📇 Google Drive collegato: salvo i numeri…");await adesso(true);return H.toast(st.s==="err"?"⚠️ "+st.err:"📇 "+st.n+" contatti salvati su Google Drive")}
if(k==="now"){await adesso(true);modal();return H.toast(st.s==="err"?"⚠️ "+st.err:"📇 Numeri salvati su Google Drive")}
if(k==="off"){if(!confirm("Scollegare Google Drive?\nIl foglio resta nel tuo Drive, ma l'app non ci salverà più i numeri (su nessun dispositivo)."))return;
const d=H.get();d.drive={url:"",ts:Date.now()};H.save();window.chiudi();H.toast("Google Drive scollegato")}}
document.addEventListener("click",e=>{const t=e.target.closest('[data-act="dr"]');if(t){e.preventDefault();e.stopPropagation();azione(t.dataset.k)}},true);
function dopo(){if(url()&&JSON.stringify(contatti(H.get()))!==last)later()}
function init(h){H=h;later(600);document.addEventListener("visibilitychange",()=>{if(!document.hidden)later(300)});addEventListener("online",()=>later(300))}
return{init,later,dopo,adesso,modal,on:()=>!!url(),_test:{segreto,codice,contatti,applica,stato:()=>st}}})();
