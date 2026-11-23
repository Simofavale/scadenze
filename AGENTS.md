# Scadenze Web
Web app (PWA) delle Scadenze, estratta da `../App forecast/Dashboard MAIN/sorgenti/scad.html` senza la parte chat WhatsApp (richiesta di Simone, 23-11-2026). Stesso metodo di Coach Garmin Web / Rassegna: GitHub Pages (repo pubblico `Simofavale/scadenze`, solo codice, nessun dato).
- Dati clienti solo nel dispositivo (localStorage `scadenze_db`, stesso formato della dashboard) e, se attivata, copia cifrata AES-GCM (PBKDF2 dalla password) in `db.enc.json` del repo **privato** `Simofavale/scadenze-dati`, via API GitHub con token fine-grained dell'utente salvato nel dispositivo.
- Unione: `mergeDb` in core.js (mt per polizza/contatto, nc/ncOff, resetAt). `save()` marca le modifiche (`SY.stamp`).
- Le regole (Excel, messaggi, gruppi, pagati) sono le stesse della dashboard: se cambi qualcosa lì, allinea core.js.
- Dopo una modifica: alza `V` in sw.js, `git push` (Pages si aggiorna in ~1 minuto).
> Regole generali in `~/.studio-locale/AGENTS.md`, preferenze in `~/.studio-locale/progetti/MEMORIA.md`.
