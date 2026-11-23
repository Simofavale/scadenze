# Scadenze · Agenzia 008 Bra

Web app delle scadenze delle polizze, estratta dalla pagina Simone › Scadenze della Dashboard MAIN.
Funziona su **Mac** e **iPhone/iPad**, anche senza rete. C'è tutto tranne le chat WhatsApp.

**Indirizzo:** https://simofavale.github.io/scadenze/

## Installarla
- **iPhone/iPad:** apri l'indirizzo in Safari › Condividi › «Aggiungi alla schermata Home». Usa sempre l'icona.
- **Mac:** apri l'indirizzo in Safari › menu File › «Aggiungi al Dock» (in Chrome: icona ⊕ nella barra degli indirizzi › Installa).

## Primo avvio: portare i dati dalla Dashboard
Nella Dashboard MAIN › pagina Simone › Scadenze › Strumenti › **💾 Scarica backup**.
Nella nuova app › **♻️ Importa backup** e scegli quel file (va bene anche il backup completo della dashboard).

## Sincronizzazione Mac ↔ iPhone
I dati restano sul dispositivo. Con la sincronizzazione una copia **cifrata** (AES-256, con la tua password)
sta nel repository GitHub **privato** `Simofavale/scadenze-dati`. Ogni dispositivo la scarica e la unisce da solo
(all'apertura, ogni 2 minuti e dopo ogni modifica).

1. Su github.com › Settings › Developer settings › Fine-grained tokens › **Generate new token**:
   - Repository access: *Only select repositories* › `scadenze-dati`
   - Permissions › Repository › **Contents: Read and write**
   - Expiration: la più lunga possibile.
2. Nell'app sul Mac › **☁️ Sincronizza Mac ↔ iPhone** › incolla il token, scegli una password › **Attiva**.
3. Sempre lì › **📋 Copia codice di collegamento**; sull'iPhone apri l'app › ☁️ › incollalo in «Codice di collegamento».
   Il codice contiene token e password: passalo con Appunti condivisi/AirDrop, non su chat.

## File
`index.html`, `styles.css` (grafica), `core.js` (regole: Excel, messaggi, gruppi, unione), `app.js` (schermate e azioni),
`sync.js` (sincronizzazione cifrata), `sw.js` (funziona offline), `icone/` (iPhone: `ios.svg`, Mac: `mac.svg`).
Prova in locale: `python3 -m http.server 5180` nella cartella, poi http://localhost:5180 (in `prove/` c'è un Excel finto).
