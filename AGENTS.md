# Scadenze Web
Web app (PWA) delle Scadenze, estratta da `../App forecast/Dashboard MAIN/sorgenti/scad.html` senza la parte chat WhatsApp (richiesta di Simone, 23-11-2026). Stesso metodo di Coach Garmin Web / Rassegna: GitHub Pages (repo pubblico `Simofavale/scadenze`, solo codice, nessun dato).
- **Metodo di Coach Garmin Web / Rassegna (scelta di Simone 23-11-2026):** repo pubblico con solo codice; l'app si apre dal link privato `?k=DATA_KEY` (chiave AES-256 solo in `data/chiavi.json` e `data/link-privato.txt`, sul Mac, mai su GitHub). Il repo privato non si può usare: con l'account gratuito GitHub Pages sparisce (provato).
- Dati nel dispositivo (localStorage `scadenze_db`, formato della dashboard) e cifrati nel ramo `dati` (`scadenze.enc.json`, scritto via API). Token `github_pat_` (solo Contents su `scadenze`) inserito da Simone una volta, salvato cifrato in `dati/accesso.enc.json`: gli altri dispositivi lo ritrovano da raw.githubusercontent.com.
- Unione: `mergeDb` in core.js (mt per polizza/contatto, nc/ncOff, resetAt). `save()` marca le modifiche (`SY.stamp`).
- Le regole (Excel, messaggi, gruppi, pagati) sono le stesse della dashboard: se cambi qualcosa lì, allinea core.js.
- Dopo una modifica: alza `V` in sw.js, `git push` (Pages si aggiorna in ~1 minuto).
> Regole generali in `~/.studio-locale/AGENTS.md`, preferenze in `~/.studio-locale/progetti/MEMORIA.md`.
