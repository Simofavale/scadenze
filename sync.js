/* Scadenze · sincronizzazione Mac ↔ iPhone
   I dati restano sul dispositivo (localStorage). Se attivi la sincronizzazione, una copia CIFRATA
   (AES-256-GCM, chiave ricavata dalla tua password con PBKDF2) viene tenuta in un repository GitHub
   PRIVATO (file db.enc.json). Ogni dispositivo scarica, unisce (mergeDb) e ricarica.
   Token e password restano solo sul dispositivo: non sono nel codice né nel repository. */
"use strict";
const SY=(()=>{
const K="scad_sync",FILE="db.enc.json",API="https://api.github.com";
let H=null,busy=false,again=false,timer=null,st={s:"off",ts:0,err:""},keyCache=null;
const SNAP=new Map();
const cfg=()=>{try{const c=JSON.parse(localStorage.getItem(K));return c&&c.token&&c.pass&&c.repo?c:null}catch(e){return null}};
const on=()=>!!cfg();
/* --- marca le modifiche: confronta ogni polizza/contatto con l'ultima versione salvata --- */
const sig=o=>{const{mt,...r}=o;return JSON.stringify(r)};
function snap(db){SNAP.clear();for(const p of db.pol||[])SNAP.set("p:"+p.key,sig(p));for(const k in db.contacts||{})if(db.contacts[k])SNAP.set("c:"+k,sig(db.contacts[k]));SNAP.set("nc",JSON.stringify(Object.keys(db.nc||{})))}
function stamp(db){const now=Date.now();
for(const p of db.pol||[]){const k="p:"+p.key,s=sig(p);if(SNAP.get(k)!==s){p.mt=now;SNAP.set(k,s)}}
for(const c in db.contacts||{}){const o=db.contacts[c];if(!o)continue;const k="c:"+c,s=sig(o);if(SNAP.get(k)!==s){o.mt=now;SNAP.set(k,s)}}
const prev=new Set(JSON.parse(SNAP.get("nc")||"[]")),cur=Object.keys(db.nc||{});db.ncOff=db.ncOff||{};
prev.forEach(c=>{if(!(db.nc||{})[c])db.ncOff[c]=now});cur.forEach(c=>{if(!prev.has(c))delete db.ncOff[c]});SNAP.set("nc",JSON.stringify(cur))}
/* --- cifratura --- */
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s.replace(/\s/g,"")),c=>c.charCodeAt(0));
async function pipe(u8,T){const s=new Blob([u8]).stream().pipeThrough(T);return new Uint8Array(await new Response(s).arrayBuffer())}
async function key(pass,salt){const id=pass+"|"+b64(salt);if(keyCache&&keyCache.id===id)return keyCache.k;
const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pass),"PBKDF2",false,["deriveKey"]);
const k=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);keyCache={id,k};return k}
async function chiudi(obj,pass){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
const z=await pipe(new TextEncoder().encode(JSON.stringify(obj)),new CompressionStream("gzip"));
const c=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await key(pass,salt),z));
return JSON.stringify({app:"scadenze-bra",v:1,salt:b64(salt),iv:b64(iv),data:b64(c),ts:new Date().toISOString()})}
async function apri(txt,pass){const f=JSON.parse(txt);let z;
try{z=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(f.iv)},await key(pass,unb64(f.salt)),unb64(f.data))}catch(e){throw new Error("Password di sincronizzazione sbagliata")}
return JSON.parse(new TextDecoder().decode(await pipe(new Uint8Array(z),new DecompressionStream("gzip"))))}
/* --- GitHub --- */
async function gh(c,path,opt={}){const r=await fetch(API+"/repos/"+c.repo+path,{cache:"no-store",...opt,headers:{Authorization:"Bearer "+c.token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(opt.headers||{})}});
if(r.status===401)throw new Error("Token GitHub non valido o scaduto");if(r.status===403)throw new Error("Il token non ha il permesso di scrivere nel repository");return r}
async function leggi(c){const r=await gh(c,"/contents/"+FILE);if(r.status===404){const q=await gh(c,"");if(q.status===404)throw new Error("Repository «"+c.repo+"» non trovato");return null}
if(!r.ok)throw new Error("GitHub ha risposto "+r.status);const j=await r.json();let txt;
if(j.content&&j.encoding==="base64")txt=new TextDecoder().decode(unb64(j.content));
else{const bl=await(await gh(c,"/git/blobs/"+j.sha)).json();txt=new TextDecoder().decode(unb64(bl.content))}
return{sha:j.sha,txt}}
async function scrivi(c,obj,sha){const body={message:"Scadenze aggiornate "+new Date().toISOString(),content:b64(new TextEncoder().encode(await chiudi(obj,c.pass)))};if(sha)body.sha=sha;
const r=await gh(c,"/contents/"+FILE,{method:"PUT",body:JSON.stringify(body)});if(r.status===409||r.status===422)return false;if(!r.ok)throw new Error("Salvataggio su GitHub non riuscito ("+r.status+")");return true}
const pulito=d=>JSON.stringify({...d,lastReport:d.lastReport?{...d.lastReport,anom:[]}:null});
async function adesso(){const c=cfg();if(!c||!H)return;if(busy){again=true;return}busy=true;st.s="run";chip();
try{for(let n=0;n<3;n++){const rem=await leggi(c);let R=null;if(rem)R=await apri(rem.txt,c.pass);
const L=H.get(),M=R?mergeDb(L,R):L;
if(JSON.stringify(M)!==JSON.stringify(L)){H.set(M);snap(M);H.save();H.render()}
if(R&&pulito(M)===pulito(R)){break}
if(await scrivi(c,M,rem&&rem.sha))break}
st={s:"ok",ts:Date.now(),err:""}}catch(e){st={s:"err",ts:st.ts,err:e.message||String(e)}}
busy=false;chip();if(again){again=false;later(800)}}
function later(ms){if(!on())return;clearTimeout(timer);timer=setTimeout(adesso,ms==null?2500:ms)}
/* --- interfaccia --- */
const hm=ts=>{const d=new Date(ts);return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
function chip(){const e=document.getElementById("bkc");if(!e||!H)return;const db=H.get();
if(!on()){const bk=db.lastBackup?new Date(db.lastBackup):null,old=!bk||(Date.now()-bk)>864e5;e.className="bkchip"+(old?" old":"");e.innerHTML=`<i class="dot"></i>${bk?"Backup "+bk.toLocaleDateString("it-IT"):"Nessun backup"}`;e.title="Scarica una copia di sicurezza";return}
e.className="bkchip sy-"+st.s;e.title=st.err||"Sincronizzazione Mac ↔ iPhone";
e.innerHTML=`<i class="dot"></i>${st.s==="run"?"Sincronizzo…":st.s==="err"?"Non sincronizzato":st.ts?"Sincronizzato "+hm(st.ts):"Sincronizzazione"}`}
const codice=c=>"SCAD1:"+btoa(unescape(encodeURIComponent(JSON.stringify({repo:c.repo,token:c.token,pass:c.pass}))));
function leggiCodice(s){s=String(s||"").trim();if(!s.startsWith("SCAD1:"))throw new Error("Codice non valido: deve iniziare con SCAD1:");const c=JSON.parse(decodeURIComponent(escape(atob(s.slice(6)))));if(!c.repo||!c.token||!c.pass)throw new Error("Codice incompleto");return c}
function modal(){const c=cfg(),E=s=>esc(s);
if(c){window.modal(`<h3>☁️ Sincronizzazione attiva</h3><p>Repository privato <b>${E(c.repo)}</b>. I dati viaggiano cifrati con la tua password.</p>
<div class="syst sy-${st.s}"><i class="dot"></i>${st.s==="err"?"Errore: "+E(st.err):st.ts?"Ultima sincronizzazione alle "+hm(st.ts):"In attesa della prima sincronizzazione"}</div>
<button class="b c-ind" data-act="sy" data-k="now">🔄 Sincronizza adesso</button>
<hr><p><b>Collega un altro dispositivo</b> (iPhone, iPad, altro Mac): copia questo codice, aprilo nell'app sull'altro dispositivo e incollalo in «Incolla codice». Contiene token e password: non mandarlo su chat.</p>
<button class="b c-gry" data-act="sy" data-k="copy">📋 Copia codice di collegamento</button>
<button class="b c-gry" data-act="tool" data-t="bk">💾 Scarica anche un backup sul dispositivo</button>
<button class="b c-or" data-act="sy" data-k="off">Scollega questo dispositivo</button><button class="b c-gry" data-act="close">Chiudi</button>`);return}
window.modal(`<h3>☁️ Sincronizza Mac ↔ iPhone</h3><p>Così trovi gli stessi dati (avvisati, pagati, contatti) su tutti i dispositivi.</p>
<p><b>Hai già collegato un altro dispositivo?</b> Copia lì il codice e incollalo qui:</p>
<label>Codice di collegamento<input id="sycod" type="text" autocomplete="off" placeholder="SCAD1:…"></label>
<button class="b c-ind" data-act="sy" data-k="paste">🔗 Collega con il codice</button>
<hr><p><b>Prima volta?</b> Inserisci il token GitHub (permesso «Contents: lettura e scrittura» solo sul repository privato) e scegli una password: servirà a cifrare i dati.</p>
<label>Repository privato<input id="syrepo" type="text" autocomplete="off" value="Simofavale/scadenze-dati"></label>
<label>Token GitHub<input id="sytok" type="password" autocomplete="off" placeholder="github_pat_…"></label>
<label>Password di cifratura (la stessa su tutti i dispositivi)<input id="sypass" type="password" autocomplete="new-password"></label>
<button class="b c-grn" data-act="sy" data-k="new">✅ Attiva la sincronizzazione</button><button class="b c-gry" data-act="close">Annulla</button>`)}
async function attiva(c){try{localStorage.setItem(K,JSON.stringify(c))}catch(e){return alert("Impossibile salvare sul dispositivo")}
window.chiudi();H.toast("☁️ Collegamento in corso…");await adesso();
if(st.s==="err"){alert("Sincronizzazione non riuscita: "+st.err+"\nControlla e riprova.");try{localStorage.removeItem(K)}catch(e){}chip();return}
H.toast("☁️ Sincronizzazione attiva")}
async function azione(k){
if(k==="now"){window.chiudi();await adesso();return H.toast(st.s==="err"?"⚠️ "+st.err:"☁️ Sincronizzato")}
if(k==="copy"){const t=codice(cfg());try{await navigator.clipboard.writeText(t);H.toast("Codice copiato: incollalo nell'altro dispositivo")}catch(e){prompt("Copia questo codice:",t)}return}
if(k==="off"){if(!confirm("Scollegare questo dispositivo? I dati restano qui, ma non si sincronizzano più."))return;try{localStorage.removeItem(K)}catch(e){}st={s:"off",ts:0,err:""};window.chiudi();return}
if(k==="paste"){let c;try{c=leggiCodice(document.getElementById("sycod").value)}catch(e){return alert(e.message)}return attiva(c)}
if(k==="new"){const repo=document.getElementById("syrepo").value.trim(),token=document.getElementById("sytok").value.trim(),pass=document.getElementById("sypass").value;
if(!/^[\w.-]+\/[\w.-]+$/.test(repo))return alert("Repository non valido (es. Simofavale/scadenze-dati)");if(token.length<20)return alert("Incolla il token GitHub");if(pass.length<8)return alert("Scegli una password di almeno 8 caratteri");
return attiva({repo,token,pass})}}
document.addEventListener("click",e=>{const t=e.target.closest('[data-act="sy"]');if(t){e.stopPropagation();azione(t.dataset.k)}},true);
function init(h){H=h;snap(H.get());chip();if(on())later(300);setInterval(()=>{if(!document.hidden&&on())adesso()},120000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)later(200)});addEventListener("online",()=>later(200))}
return{init,stamp,snap,later,chip,modal,on,adesso,_test:{chiudi,apri,mergeDb:(a,b)=>mergeDb(a,b)}}})();
