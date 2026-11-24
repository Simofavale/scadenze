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

## Numeri su Google Drive
- Strumenti › **📇 Numeri su Google Drive**: copia il codice dello script, incollalo in un progetto nuovo di
  script.google.com (account Google di lavoro), esegui `autorizza`, distribuisci come **App web** (Esegui come: Me ·
  Accesso: Chiunque) e incolla l'URL `/exec` nell'app.
- Lo script crea nel Drive il foglio «Scadenze Bra 008 – numeri clienti». Ogni numero/email modificato ci finisce subito
  e torna su tutti i dispositivi (vince il più recente). Il codice segreto dello script è ricavato dalla chiave del link privato.

## Regole
- **Già pagati:** a ogni nuovo elenco scadenze caricato (1–2 volte a settimana), le polizze che non ci sono più
  (con scadenza entro l'ultima dell'elenco) passano in Già pagati, raggruppate per data dell'elenco.
- **Archiviati** contiene le scadenze archiviate e i clienti da non contattare (non c'è più la voce Esclusi).
- **Tema automatico:** segue chiaro/scuro di iPhone e Mac (su iPhone: Impostazioni › Schermo › Automatico = alba/tramonto).

## File
`index.html`, `styles.css` (grafica), `core.js` (regole: Excel, messaggi, gruppi, unione), `app.js` (schermate e azioni),
`sync.js` (sincronizzazione cifrata), `drive.js` (numeri su Google Drive), `sw.js` (funziona offline), `icone/` (iPhone: `ios.svg`, Mac: `mac.svg`).
Prova in locale: `python3 -m http.server 5180` nella cartella, poi http://localhost:5180 (in `prove/` c'è un Excel finto).
