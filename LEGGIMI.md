# Scadenze · Agenzia 008 Bra

Web app delle scadenze delle polizze, estratta dalla pagina Simone › Scadenze della Dashboard MAIN.
Funziona su **Mac** e **iPhone/iPad**, anche senza rete. C'è tutto tranne le chat WhatsApp.

**Indirizzo:** il link privato in `data/link-privato.txt` (https://simofavale.github.io/scadenze/?k=…)

## Installarla
- **iPhone/iPad:** apri il link privato in Safari › Condividi › «Aggiungi alla schermata Home». Usa sempre l'icona.
- **Mac:** apri il link privato in Safari › menu File › «Aggiungi al Dock» (in Chrome: icona ⊕ nella barra degli indirizzi › Installa).

## Primo avvio: portare i dati dalla Dashboard
Nella Dashboard MAIN › pagina Simone › Scadenze › Strumenti › **💾 Scarica backup**.
Nella nuova app › **♻️ Importa backup** e scegli quel file (va bene anche il backup completo della dashboard).

## Accesso e sincronizzazione (come Coach Garmin Web)
- L'app si apre dal **link privato**, che è sul Mac in `data/link-privato.txt`. Senza link chiede di incollarlo.
- La chiave del link cifra i dati: su GitHub (repository `scadenze`, ramo `dati`) c'è solo testo cifrato.
- **Una volta sola:** nell'app › ☁️ › «Crea l'autorizzazione su GitHub» › Only select repositories › `scadenze`
  (Contents: Read and write) › Generate token › incolla il codice `github_pat_…`. Gli altri dispositivi aperti con il link
  privato la ritrovano da soli.
- Si sincronizza all'apertura, ogni 2 minuti e dopo ogni modifica.

## File
`index.html`, `styles.css` (grafica), `core.js` (regole: Excel, messaggi, gruppi, unione), `app.js` (schermate e azioni),
`sync.js` (sincronizzazione cifrata), `sw.js` (funziona offline), `icone/` (iPhone: `ios.svg`, Mac: `mac.svg`).
Prova in locale: `python3 -m http.server 5180` nella cartella, poi http://localhost:5180 (in `prove/` c'è un Excel finto).
