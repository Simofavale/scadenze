/* Scadenze · accesso riservato e sincronizzazione Mac ↔ iPhone (stesso metodo di Coach Garmin Web e Rassegna)
   - L'app si apre solo dal LINK PRIVATO (…/scadenze/?k=CHIAVE). La chiave (AES-256) sta solo nel link e nei dispositivi,
     mai su GitHub: il repository contiene soltanto testo cifrato.
   - I dati (polizze, avvisi, pagati, contatti) stanno nel dispositivo e, cifrati, nel ramo "dati" del repository
     (scadenze.enc.json). Ogni dispositivo scarica, unisce (mergeDb) e ricarica.
   - Per scrivere serve un'autorizzazione GitHub (github_pat_…, solo "Contents" su questo repository). Si inserisce una
     volta sola: viene salvata cifrata (accesso.enc.json) e gli altri dispositivi con il link privato la ritrovano da soli. */
"use strict";
const SY=(()=>{
const REPO="Simofavale/scadenze",BR="dati",FILE="scadenze.enc.json",ACC="accesso.enc.json",API="https://api.github.com";
const KK="scad:key",TK="scad:token",KEY_RE=/^[A-Za-z0-9_-]{43}$/;
let H=null,busy=false,again=false,timer=null,st={s:"off",ts:0,err:""},aes=null;
const ls={get:k=>{try{return localStorage.getItem(k)||""}catch(e){return""}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
/* --- chiave dal link privato --- */
const getKey=()=>{const q=new URLSearchParams(location.search).get("k");return q&&KEY_RE.test(q)?q:ls.get(KK)};
(()=>{const k=getKey();if(!k)return;ls.set(KK,k);const q=new URLSearchParams(location.search);if(q.get("k")!==k){q.set("k",k);history.replaceState(null,"",location.pathname+"?"+q+location.hash)}})();
const locked=()=>!getKey();
const privateLink=()=>location.origin+location.pathname+"?k="+getKey();
/* --- marca le modifiche: confronta ogni polizza/contatto con l'ultima versione salvata --- */
const SNAP=new Map(),sig=o=>{const{mt,...r}=o;return JSON.stringify(r)};
function snap(db){SNAP.clear();for(const p of db.pol||[])SNAP.set("p:"+p.key,sig(p));for(const k in db.contacts||{})if(db.contacts[k])SNAP.set("c:"+k,sig(db.contacts[k]));SNAP.set("nc",JSON.stringify(Object.keys(db.nc||{})))}
function stamp(db){const now=Date.now();
for(const p of db.pol||[]){const k="p:"+p.key,s=sig(p);if(SNAP.get(k)!==s){p.mt=now;SNAP.set(k,s)}}
for(const c in db.contacts||{}){const o=db.contacts[c];if(!o)continue;const k="c:"+c,s=sig(o);if(SNAP.get(k)!==s){o.mt=now;SNAP.set(k,s)}}
const prev=new Set(JSON.parse(SNAP.get("nc")||"[]")),cur=Object.keys(db.nc||{});db.ncOff=db.ncOff||{};
prev.forEach(c=>{if(!(db.nc||{})[c])db.ncOff[c]=now});cur.forEach(c=>{if(!prev.has(c))delete db.ncOff[c]});SNAP.set("nc",JSON.stringify(cur))}
/* --- cifratura con la chiave del link --- */
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(String(s).replace(/\s/g,"")),c=>c.charCodeAt(0));
async function pipe(u8,T){return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(T)).arrayBuffer())}
async function key(){const k=getKey();if(!k)throw new Error("Apri l'app dal link privato");if(aes&&aes.k===k)return aes.c;
const c=await crypto.subtle.importKey("raw",unb64(k.replace(/-/g,"+").replace(/_/g,"/")+"="),"AES-GCM",false,["encrypt","decrypt"]);aes={k,c};return c}
async function chiudi(obj){const iv=crypto.getRandomValues(new Uint8Array(12)),z=await pipe(new TextEncoder().encode(JSON.stringify(obj)),new CompressionStream("gzip"));
return JSON.stringify({enc:1,gz:1,iv:b64(iv),data:b64(new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await key(),z))),ts:new Date().toISOString()})}
async function apri(txt){const j=typeof txt==="string"?JSON.parse(txt):txt;let p;
try{p=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(j.iv)},await key(),unb64(j.data)))}catch(e){throw new Error("Il link privato non apre questi dati (chiave diversa)")}
return JSON.parse(new TextDecoder().decode(j.gz===0?p:await pipe(p,new DecompressionStream("gzip"))))}
/* --- autorizzazione GitHub: sul dispositivo, oppure ritrovata cifrata nel repository --- */
async function token(){let t=ls.get(TK);if(t)return t;
try{const r=await fetch(`https://raw.githubusercontent.com/${REPO}/${BR}/${ACC}?t=${Date.now()}`,{cache:"no-store"});if(r.ok){const a=await apri(await r.text());if(a&&a.token){ls.set(TK,a.token);return a.token}}}catch(e){}
return""}
async function gh(t,path,opt={}){const r=await fetch(API+"/repos/"+REPO+path,{cache:"no-store",...opt,headers:{Authorization:"Bearer "+t,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(opt.headers||{})}});
if(r.status===401){ls.del(TK);throw new Error("Autorizzazione GitHub scaduta o non valida: rifalla da ☁️")}if(r.status===403)throw new Error("L'autorizzazione GitHub non ha il permesso «Contents: Read and write»");return r}
async function leggi(t,file){const r=await gh(t,`/contents/${file}?ref=${BR}`);if(r.status===404)return null;if(!r.ok)throw new Error("GitHub ha risposto "+r.status);const j=await r.json();
let txt;if(j.content&&j.encoding==="base64")txt=new TextDecoder().decode(unb64(j.content));else{const bl=await(await gh(t,"/git/blobs/"+j.sha)).json();txt=new TextDecoder().decode(unb64(bl.content))}
return{sha:j.sha,txt}}
async function scrivi(t,file,txt,sha,msg){const body={message:msg,branch:BR,content:b64(new TextEncoder().encode(txt))};if(sha)body.sha=sha;
const r=await gh(t,"/contents/"+file,{method:"PUT",body:JSON.stringify(body)});if(r.status===409||r.status===422)return false;if(!r.ok)throw new Error("Salvataggio su GitHub non riuscito ("+r.status+")");return true}
/* --- sincronizzazione --- */
const pulito=d=>JSON.stringify({...d,lastReport:d.lastReport?{...d.lastReport,anom:[]}:null});
async function adesso(){if(!H||locked())return;if(busy){again=true;return}busy=true;st={...st,s:"run"};chip();
try{const t=await token();if(!t){st={s:"none",ts:0,err:""};busy=false;chip();return}
for(let n=0;n<3;n++){const rem=await leggi(t,FILE),R=rem?await apri(rem.txt):null,L=H.get(),M=R?mergeDb(L,R):L;
if(JSON.stringify(M)!==JSON.stringify(L)){H.set(M);snap(M);H.save();H.render()}
if(R&&pulito(M)===pulito(R))break;
if(!M.pol.length&&!R&&!M.resetAt)break;
if(await scrivi(t,FILE,await chiudi(M),rem&&rem.sha,"Scadenze aggiornate"))break}
st={s:"ok",ts:Date.now(),err:""}}catch(e){st={s:"err",ts:st.ts,err:e.message||String(e)}}
busy=false;chip();if(again){again=false;later(800)}}
function later(ms){if(locked())return;clearTimeout(timer);timer=setTimeout(adesso,ms==null?2500:ms)}
/* --- interfaccia --- */
const hm=ts=>{const d=new Date(ts);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
function chip(){const e=document.getElementById("bkc");if(!e||!H)return;
e.className="bkchip sy-"+st.s;e.title=st.err||"Sincronizzazione Mac ↔ iPhone";
e.innerHTML=`<i class="dot"></i>${st.s==="run"?"Sincronizzo…":st.s==="err"?"Non sincronizzato":st.s==="none"?"Collega GitHub":st.ts?"Sincronizzato "+hm(st.ts):"Sincronizzazione"}`}
const ghUrl=()=>"https://github.com/settings/personal-access-tokens/new?"+new URLSearchParams({name:"Scadenze Bra 008",description:"Sincronizzazione cifrata della web app Scadenze",target_name:"Simofavale",expires_in:"366",contents:"write"});
function modal(){const E=s=>esc(s),t=ls.get(TK);
if(!t){window.modal(`<h3>☁️ Collega GitHub</h3><p>Serve <b>una volta sola</b>: dopo, tutti i tuoi dispositivi aperti con il link privato si sincronizzano da soli.</p>
<p>1. Tocca il pulsante: si apre GitHub con il modulo già compilato.<br>2. In «Repository access» scegli <b>Only select repositories → scadenze</b> e controlla che «Contents» sia <b>Read and write</b>; poi <b>Generate token</b>.<br>3. Copia il codice che inizia con <code>github_pat_</code> e incollalo qui.</p>
<a class="b c-gry" href="${ghUrl()}" target="_blank" rel="noopener">Crea l'autorizzazione su GitHub ↗</a>
<label>Codice di autorizzazione<input id="sytok" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="github_pat_…"></label>
<button class="b c-grn" data-act="sy" data-k="tok">✅ Salva e sincronizza</button>
<p class="ts">Il codice viene salvato cifrato con la chiave del link privato: solo chi ha il link lo può usare, e può solo leggere e scrivere i file di questa app.</p><button class="b c-gry" data-act="close">Chiudi</button>`);return}
window.modal(`<h3>☁️ Sincronizzazione</h3><p>I dati viaggiano cifrati con la chiave del tuo link privato, che non è mai su GitHub.</p>
<div class="syst sy-${st.s}"><i class="dot"></i>${st.s==="err"?"Errore: "+E(st.err):st.ts?"Ultima sincronizzazione alle "+hm(st.ts):"In attesa della prima sincronizzazione"}</div>
<button class="b c-ind" data-act="sy" data-k="now">🔄 Sincronizza adesso</button>
<hr><p><b>Aggiungere l'iPhone o un altro Mac:</b> apri lì il link privato (Safari › Condividi › «Aggiungi alla schermata Home»). Non mandarlo su chat: chi ha il link vede i dati.</p>
<button class="b c-gry" data-act="sy" data-k="link">📋 Copia link privato</button>
<button class="b c-gry" data-act="tool" data-t="bk">💾 Scarica anche un backup sul dispositivo</button><button class="b c-gry" data-act="close">Chiudi</button>`)}
async function azione(k){
if(k==="now"){window.chiudi();await adesso();return H.toast(st.s==="err"?"⚠️ "+st.err:st.s==="none"?"Collega prima GitHub":"☁️ Sincronizzato")}
if(k==="link"){const t=privateLink();try{await navigator.clipboard.writeText(t);H.toast("Link privato copiato")}catch(e){prompt("Copia il link privato:",t)}return}
if(k==="tok"){const t=document.getElementById("sytok").value.trim();if(!/^(github_pat_|ghp_)\w{20,}$/.test(t))return alert("Il codice deve iniziare con github_pat_");
try{const r=await gh(t,"");if(!r.ok)throw new Error("Repository non raggiungibile ("+r.status+"): hai scelto «scadenze» in Repository access?");
const old=await leggi(t,ACC);if(!await scrivi(t,ACC,await chiudi({token:t,ts:Date.now()}),old&&old.sha,"Autorizzazione cifrata"))throw new Error("Salvataggio non riuscito, riprova")}
catch(e){return alert("Autorizzazione non salvata: "+e.message)}
ls.set(TK,t);window.chiudi();H.toast("☁️ GitHub collegato: sincronizzo…");return adesso()}}
document.addEventListener("click",e=>{const t=e.target.closest('[data-act="sy"]');if(t){e.stopPropagation();azione(t.dataset.k)}},true);
/* --- schermata di accesso riservato (come Coach Garmin) --- */
function lockScreen(){document.body.classList.add("locked");document.getElementById("m").innerHTML=`<div class="hero"><div class="hi"><img src="icone/icon-192.png" alt=""></div><h2>Accesso riservato</h2>
<p>Qui ci sono dati personali dei clienti. Incolla il link privato: basta farlo una volta sola su questo dispositivo.</p>
<form id="unlock" class="hb"><input id="unlockIn" class="unl" placeholder="Incolla il link privato" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="b c-ind">Entra</button></form><p id="unlockMsg" class="ts"></p></div>`;
document.getElementById("unlock").addEventListener("submit",e=>{e.preventDefault();const v=document.getElementById("unlockIn").value.trim(),k=(v.match(/[?#&]k=([A-Za-z0-9_-]{43})/)||v.match(/^([A-Za-z0-9_-]{43})$/)||[])[1];
if(!k){document.getElementById("unlockMsg").textContent="Link non valido: copia il link privato completo.";return}ls.set(KK,k);location.href=location.pathname+"?k="+k})}
function init(h){H=h;snap(H.get());chip();if(locked())return;later(300);setInterval(()=>{if(!document.hidden)adesso()},120000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)later(200)});addEventListener("online",()=>later(200))}
return{init,stamp,snap,later,chip,modal,adesso,locked,lockScreen,on:()=>!!ls.get(TK),_test:{chiudi,apri}}})();
