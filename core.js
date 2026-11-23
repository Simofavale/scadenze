/* ===== CORE ===== */
const IBAN="IT26F0503446040000000034750",INTEST="GENERALI ITALIA S.p.A AG. 008 Bra";
const COLORI={"Doppio Quietanzamento":"#CCFFFF","In Vigore":"#C6EFCE","Scadenza a Breve":"#FFF2CC","In Tolleranza":"#FFE699","Fuori Copertura":"#FFC7CE"};
const NEED=["Cliente","Codice Cliente","Email","Cellulare","Data scadenza","Importo","Modalita' Pagamento Polizza","Iniziative Riforma","Numero Polizza","Stato Polizza","Prodotto","Targa","Presenza disdetta"];
const ESCL=["rid","sdd","banca","conto corrente"];
const enc=s=>encodeURIComponent(s).replace(/[!'()*]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase());
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const vuoto=v=>v==null||["","-","nan","none"].includes(String(v).trim().toLowerCase());
const dec=s=>s.replace(/&#(\d+);/g,(m,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(m,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
async function inflate(u8){const ds=new DecompressionStream("deflate-raw");const w=ds.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer())}
async function unzip(buf){const u=new Uint8Array(buf),v=new DataView(buf);let e=u.length-22;while(e>=0&&v.getUint32(e,true)!==0x06054b50)e--;
if(e<0)throw new Error("File non valido (non è un .xlsx)");const n=v.getUint16(e+10,true);let p=v.getUint32(e+16,true);const F={};
for(let i=0;i<n;i++){const meth=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),el=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),off=v.getUint32(p+42,true);
const name=new TextDecoder().decode(u.subarray(p+46,p+46+nl));p+=46+nl+el+cl;
F[name]=async()=>{const lh=30+v.getUint16(off+26,true)+v.getUint16(off+28,true);const d=u.subarray(off+lh,off+lh+cs);return new TextDecoder().decode(meth===0?d:await inflate(d))}}
return F}
function colIdx(ref){let n=0;for(const ch of ref.replace(/\d+/g,""))n=n*26+ch.charCodeAt(0)-64;return n-1}
async function leggiXlsx(buf){const F=await unzip(buf);let ss=[];
if(F["xl/sharedStrings.xml"]){const x=await F["xl/sharedStrings.xml"]();ss=[...x.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m=>dec([...m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>t[1]).join("")))}
let path="xl/worksheets/sheet1.xml";
try{const wb=await F["xl/workbook.xml"](),rel=await F["xl/_rels/workbook.xml.rels"]();const rid=wb.match(/<sheet\b[^>]*r:id="([^"]+)"/)[1];
const t=[...rel.matchAll(/<Relationship\b[^>]*>/g)].map(m=>m[0]).find(s=>s.includes('Id="'+rid+'"')).match(/Target="([^"]+)"/)[1];
path=t.startsWith("/")?t.slice(1):"xl/"+t}catch(e){}
if(!F[path])throw new Error("Foglio non trovato");const x=await F[path]();const rows=[];
for(const rm of x.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)){const row=[];if(rm[1])for(const c of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){
const ref=(c[1].match(/\br="([A-Z]+\d+)"/)||[])[1];if(!ref)continue;const t=(c[1].match(/\bt="(\w+)"/)||[])[1];const body=c[2]||"";let val="";
if(t==="inlineStr")val=dec([...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m=>m[1]).join(""));
else{const m=body.match(/<v>([\s\S]*?)<\/v>/);if(m)val=t==="s"?ss[+m[1]]:dec(m[1])}
row[colIdx(ref)]=val}rows.push(row)}
return rows.map(r=>Array.from(r,v=>v==null?"":String(v)))}
function telefono(v){if(vuoto(v))return"";let s=String(v).trim().replace(/\s/g,"").replace(",",".");
const m=s.match(/^(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);if(!m)return s.replace(/\D/g,"");
let ip=m[1],fp=m[2]||"",ex=+(m[3]||0);if(ex<0)return ip;while(fp.length<ex)fp+="0";return(ip+fp.slice(0,ex)).replace(/^0+(?=\d)/,"")}
function normTel(v){let s=String(v??'').trim().replace(/[\s\-().]/g,'');if(!s)return '';if(s.startsWith('+39'))s=s.slice(3);else if(s.startsWith('0039'))s=s.slice(4);if(!/^\d+$/.test(s))throw new Error('Inserisci un numero italiano con o senza +39');return s}
function importo(v){let s=String(v??"").replace(/[€\s]/g,"");if(vuoto(s))return 0;if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");const n=parseFloat(s);return isNaN(n)?0:n}
function parseData(v){const s=String(v??"").trim();let m;
if(/^\d+(\.\d+)?$/.test(s)&&+s>20000)return new Date(1899,11,30+Math.floor(+s));
if(m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/))return new Date(+m[3],m[2]-1,+m[1]);
if(m=s.match(/^(\d{4})-(\d{2})-(\d{2})/))return new Date(+m[1],m[2]-1,+m[3]);return null}
const eurF=x=>{const[i,d]=x.toFixed(2).split(".");return i.replace(/\B(?=(\d{3})+(?!\d))/g,".")+","+d};
const p2=n=>String(n).padStart(2,"0");
const fd=d=>p2(d.getDate())+"/"+p2(d.getMonth()+1)+"/"+d.getFullYear();
const isoD=d=>d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate());
const fromISO=s=>{const[a,b,c]=s.split("-");return new Date(+a,b-1,+c)};
const addD=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const titolo=s=>s.toLowerCase().replace(/(^|[^\p{L}])(\p{L})/gu,(m,a,b)=>a+b.toUpperCase());
function stato(g){if(g<0)return g+15>=0?"In Tolleranza":"Fuori Copertura";return g<=7?"Scadenza a Breve":"In Vigore"}
function msgSingolo(wa,nome,targa,num,scad,tol,imp,fuori){const b=d=>wa?"*"+d+"*":d;
const pag=`Per effettuare il pagamento tramite bonifico, le riporto di seguito le coordinate:\nIBAN: ${IBAN}\nIntestato a: ${INTEST}\nCausale: polizza ${num}\nImporto: € ${imp}\n\nResto a disposizione per ogni necessità. Buona giornata.`;
if(targa){return(fuori?`Buongiorno, le ricordo che la polizza Auto ${targa} risulta in scadenza.`:`Buongiorno, le ricordo che la polizza Auto ${targa} scade il ${b(scad)} (tolleranza fino al ${b(tol)}).`)+"\n\n"+pag}
return(fuori?`Buongiorno, le ricordo che la polizza ${nome} risulta in scadenza.`:`Buongiorno, le ricordo che la polizza ${nome} scade il ${b(scad)}, termine massimo di tolleranza ${b(tol)}.`)+
"\n\nCon l'occasione, le propongo di fissare un breve appuntamento per fare il punto sulla sua copertura e verificare insieme l'adeguatezza dei massimali.\n\n"+pag}
function msgMulti(wa,items,tot){const b=d=>wa?"*"+d+"*":d;
const el=items.map(p=>p.st==="Fuori Copertura"?`- ${p.nome} (polizza n. ${p.num}) risulta in scadenza - Importo: € ${eurF(p.imp)}`:
`- ${p.nome} (polizza n. ${p.num}) scade il ${b(fd(p.sc))} (tolleranza ${b(fd(p.tol))}) - Importo: € ${eurF(p.imp)}`).join("\n");
return `Buongiorno, le comunico le seguenti scadenze:\n\n${el}\n\nImporto Totale da saldare: € ${eurF(tot)}\n\nPer effettuare il pagamento tramite bonifico, le riporto di seguito le coordinate:\nIBAN: ${IBAN}\nIntestato a: ${INTEST}\nCausale: ${items.map(p=>p.num).join(" - ")}\nImporto: € ${eurF(tot)}\n\nResto a disposizione per ogni necessità. Buona giornata.`}
function estrai(rows){
const hi=rows.findIndex(r=>r.map(x=>x.trim()).includes("Cliente")&&r.map(x=>x.trim()).includes("Numero Polizza"));
if(hi<0)throw new Error('Intestazione non trovata (servono "Cliente" e "Numero Polizza")');
const hdr=rows[hi].map(x=>x.trim()),ix={},mancanti=[];NEED.forEach(n=>{ix[n]=hdr.indexOf(n);if(ix[n]<0)mancanti.push(n)});
const G=(r,n)=>ix[n]<0?"":(r[ix[n]]??"").toString().trim();
const raw=rows.slice(hi+1).filter(r=>!vuoto(G(r,"Numero Polizza")));const anom=[],recs=[];let escluse=0;
if(mancanti.length)anom.push("Colonne mancanti: "+mancanti.join(", "));
for(const r of raw){const pg=G(r,"Modalita' Pagamento Polizza").toLowerCase();if(ESCL.some(k=>pg.includes(k))){escluse++;continue}
const sc=parseData(G(r,"Data scadenza"));if(!sc){anom.push(`Data non valida: ${G(r,"Cliente")} / ${G(r,"Numero Polizza")}`);continue}
const cli=titolo(G(r,"Cliente")),cod=G(r,"Codice Cliente")||cli,num=G(r,"Numero Polizza"),iso=isoD(sc);
const targa=vuoto(G(r,"Targa"))?"":G(r,"Targa");
const dis=G(r,"Presenza disdetta").toLowerCase().startsWith("si")||/disdett|storn/.test(G(r,"Stato Polizza").toLowerCase());
const tel=telefono(G(r,"Cellulare")),email=vuoto(G(r,"Email"))?"":G(r,"Email");
if(!tel)anom.push("Telefono assente: "+cli);else if(tel.length<10)anom.push(`Telefono con meno di 10 cifre (${tel}): ${cli}`);
if(!email)anom.push("Email assente: "+cli);
recs.push({key:`${cod}|${num}|${iso}`,cod,cli,email,tel,scad:iso,imp:importo(G(r,"Importo")),num,targa,nome:targa?"Auto "+targa:G(r,"Prodotto"),
dis,dq:G(r,"Iniziative Riforma").toLowerCase().includes("doppio quietanzamento"),notif:null,storia:[]})}
return{recs,rep:{letti:raw.length,escluse,anom}}}
const nuovoDb=()=>({v:2,pol:[],contacts:{},nc:{},lastBackup:null,lastReport:null});
function unisci(db,recs){const idx=new Map(db.pol.map(p=>[p.key,p]));let aggiunte=0,duplicate=0,aggDis=0;
for(const r of recs){const e=idx.get(r.key);if(e){duplicate++;if(r.dis&&!e.dis){e.dis=true;aggDis++}if(e.pag&&!e.pag.man){delete e.pag}continue}db.pol.push(r);idx.set(r.key,r);aggiunte++}
return{aggiunte,duplicate,aggDis}}
/* polizze già in archivio che non compaiono più nell'Excel caricato (con scadenza entro l'ultima data del file) = pagate */
function segnaPagate(db,keys,maxScad){let n=0;const ts=Date.now();if(!maxScad)return 0;
for(const p of db.pol){if(p.dis||p.pag||keys.has(p.key)||p.scad>maxScad)continue;p.pag={ts};n++}return n}
function unisciBackup(db,b){let n=0,agg=0,scartate=0;const idx=new Map(db.pol.map(p=>[p.key,p]));
const hist=p=>(p.storia&&p.storia.length?p.storia:(p.notif&&!p.notif.assoc?[p.notif]:[])).filter(x=>x&&x.ts);
for(const p of b.pol||[]){if(!p||!p.key||!/^\d{4}-\d{2}-\d{2}/.test(p.scad||"")){scartate++;continue}
const e=idx.get(p.key);
if(!e){const q={...p,storia:hist(p)};q.notif=q.storia.length?q.storia[q.storia.length-1]:(p.notif&&p.notif.assoc?p.notif:null);db.pol.push(q);idx.set(q.key,q);n++;continue}
const m=new Map();[...hist(e),...hist(p)].forEach(x=>m.set(x.ts+"|"+x.canale,x));const h=[...m.values()].sort((x,y)=>x.ts<y.ts?-1:1);
if(h.length!==hist(e).length){e.storia=h;e.notif=h[h.length-1];agg++}
if(p.dis&&!e.dis){e.dis=true;agg++}if(p.pag&&!e.pag){e.pag=p.pag;agg++}if(!e.notif&&p.notif&&p.notif.assoc){e.notif=p.notif;agg++}}
for(const k in b.contacts||{})if(!db.contacts[k])db.contacts[k]=b.contacts[k];
db.nc=db.nc||{};for(const k in b.nc||{})if(!db.nc[k])db.nc[k]=b.nc[k];
return{n,agg,scartate}}
function creaGruppo(g,C,finoDom){g.sort((a,b)=>a.g-b.g);const p=g[0],multi=g.length>1,tot=g.reduce((s,x)=>s+x.imp,0),c=C[p.cod]||{};
const tel=c.tel||g.map(x=>x.tel).find(Boolean)||"",email=c.email||g.map(x=>x.email).find(Boolean)||"";let mw,me,tip,num;const lk=z=>{const f=z.st==="Fuori Copertura",a=msgSingolo(true,z.nome,z.targa,z.num,fd(z.sc),fd(z.tol),eurF(z.imp),f),b=msgSingolo(false,z.nome,z.targa,z.num,fd(z.sc),fd(z.tol),eurF(z.imp),f);
return{key:z.key,solo:true,wa:tel?`whatsapp://send?phone=39${tel}&text=${enc(a)}`:"",mail:email?`mailto:${email}?subject=Scadenza%20polizza&body=${enc(b)}`:"",sms:tel?`sms:+39${tel}?&body=${enc(b)}`:""}};
if(multi){mw=msgMulti(true,g,tot);me=msgMulti(false,g,tot);tip="Polizze Multiple";num=g.map(x=>x.num).join(" - ")}
else{const f=p.st==="Fuori Copertura";mw=msgSingolo(true,p.nome,p.targa,p.num,fd(p.sc),fd(p.tol),eurF(tot),f);me=msgSingolo(false,p.nome,p.targa,p.num,fd(p.sc),fd(p.tol),eurF(tot),f);tip=p.nome;num=p.num}
const dq=!!p.dq,st=dq?"Doppio Quietanzamento":p.st;
const ric=p.st==="Fuori Copertura"||(p.g<0&&p.g+15<=5);
return{keys:g.map(x=>x.key),id:g.map(x=>x.key).join("~"),cod:p.cod,cli:p.cli,imp:tot,impf:eurF(tot),tip,num,scad:fd(p.sc),sortScad:p.sc.getTime(),g:p.g,st,stReal:p.st,col:COLORI[st],dq,multi,details:g.map(z=>({nome:z.nome,num:z.num,imp:z.imp,scad:fd(z.sc),...lk(z)})),
tel,email,wa:tel?`whatsapp://send?phone=39${tel}&text=${enc(mw)}`:"",sms:tel?`sms:+39${tel}?&body=${enc(me)}`:"",mail:email?`mailto:${email}?subject=Scadenza%20polizza&body=${enc(me)}`:"",urg:p.g<=finoDom,ric}}
function costruisciGruppi(db,oggi,solo){const NCm=db.nc||{};const P=db.pol.filter(p=>!p.dis&&!p.pag&&!p.arch&&!p.notif&&(solo?!!NCm[p.cod]:!NCm[p.cod])).map(p=>{const sc=fromISO(p.scad),g=Math.round((sc-oggi)/864e5);return{...p,sc,g,tol:addD(sc,15),st:stato(g)}});
const finoDom=6-((oggi.getDay()+6)%7),B=[],gr={};P.forEach(p=>{if(p.dq)B.push([p]);else(gr[p.cod]=gr[p.cod]||[]).push(p)});Object.values(gr).forEach(g=>B.push(g));
return B.map(g=>creaGruppo(g,db.contacts||{},finoDom)).sort((a,b)=>a.g-b.g)}
function costruisciArchivio(db){const m={};db.pol.filter(p=>p.notif).forEach(p=>{const k=p.dq?p.key:p.cod+"|"+p.notif.ts;(m[k]=m[k]||[]).push(p)});
return Object.values(m).map(g=>{g.sort((a,b)=>a.scad<b.scad?-1:1);const p=g[0],c=db.contacts[p.cod]||{},tot=g.reduce((s,x)=>s+x.imp,0);
const as=!!p.notif.assoc,H=as?[]:(p.storia&&p.storia.length?p.storia:[p.notif]);let dqPair=false,aum=null;
if(p.dq&&g.length===1){const sib=db.pol.filter(q=>q.dq&&!q.dis&&q.notif&&q.cod===p.cod);if(sib.length>1){dqPair=true;const mx=Math.max(...sib.map(q=>q.imp)),mn=Math.min(...sib.map(q=>q.imp));aum=mx===mn?null:p.imp===mx}}
return{keys:g.map(x=>x.key),cod:p.cod,cli:p.cli,dq:p.dq,tip:g.length>1?"Polizze Multiple":p.nome,num:g.map(x=>x.num).join(" - "),imp:tot,impf:eurF(tot),scad:fd(fromISO(p.scad)),
details:g.map(z=>({nome:z.nome,num:z.num,imp:z.imp,scad:fd(fromISO(z.scad))})),multi:g.length>1,ts:p.notif.ts,canale:p.notif.canale,tel:c.tel||p.tel,email:c.email||p.email,sortScad:fromISO(p.scad).getTime(),stato:p.notif.canale,
volti:H.length,ultimi:H.map(x=>esc(x.canale)+" il "+new Date(x.ts).toLocaleString("it-IT")).join("<br>"),assoc:as,dqPair,aum,inviata:!as}})}
function segna(db,keys,canale){const ts=new Date().toISOString();db.pol.forEach(p=>{if(keys.includes(p.key)){if(!p.storia||!p.storia.length)p.storia=p.notif?[p.notif]:[];p.notif={ts,canale};p.storia.push({ts,canale})}})}
function ripristina(db,keys){const ts=new Set();db.pol.forEach(p=>{if(keys.includes(p.key)){if(p.notif&&!p.notif.assoc)ts.add(p.cod+"|"+p.notif.ts);p.notif=null;const s=p.storia||[];s.pop();p.storia=s}});
db.pol.forEach(p=>{if(p.notif&&p.notif.assoc&&ts.has(p.cod+"|"+p.notif.ts))p.notif=null})}
/* ===== END CORE ===== */
/* ===== SINCRONIZZAZIONE: unione di due copie del database =====
   Ogni polizza e ogni contatto hanno "mt" (ora dell'ultima modifica, messa da save()).
   Vince la versione modificata più di recente; a parità vince la copia locale.
   "Non contattare": vince l'azione più recente tra inserimento (nc) e riabilitazione (ncOff).
   "resetAt": dopo un «Resetta tutti i dati» le polizze più vecchie del reset non tornano. */
function mergeDb(L,R){L=L||nuovoDb();R=R||nuovoDb();
const ra=Math.max(L.resetAt||0,R.resetAt||0),keep=(x,s)=>(s.resetAt||0)===ra||(x.mt||0)>ra;
const m=new Map();for(const p of R.pol||[])if(p&&p.key&&keep(p,R))m.set(p.key,p);
for(const p of L.pol||[]){if(!p||!p.key||!keep(p,L))continue;const e=m.get(p.key);if(!e||(p.mt||0)>=(e.mt||0))m.set(p.key,p)}
const ct={};for(const[s,o]of[[R,R.contacts||{}],[L,L.contacts||{}]])for(const k in o){const c=o[k];if(!c||!keep(c,s))continue;if(!ct[k]||(c.mt||0)>=(ct[k].mt||0))ct[k]=c}
const t=v=>typeof v==="number"?v:(Date.parse(v)||0),nc={},off={},cods=new Set([L.nc,R.nc,L.ncOff,R.ncOff].flatMap(o=>Object.keys(o||{})));
for(const c of cods){const a=(L.nc||{})[c],b=(R.nc||{})[c],on=Math.max(t(a),t(b)),of=Math.max(t((L.ncOff||{})[c]),t((R.ncOff||{})[c]));
if(on>ra&&on>of)nc[c]=t(a)>=t(b)?a:b;else if(of>ra)off[c]=of}
const rep=[L.lastReport,R.lastReport].filter(Boolean).sort((a,b)=>(b.ts||0)-(a.ts||0))[0]||null;
const bk=[L.lastBackup,R.lastBackup].filter(Boolean).sort().pop()||null;
return{...R,...L,v:2,pol:[...m.values()],contacts:ct,nc,ncOff:off,lastReport:rep,lastBackup:bk,resetAt:ra||undefined}}
