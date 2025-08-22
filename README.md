# SmartTravel 🌍✈️

SmartTravel è un'applicazione web intelligente che utilizza l'AI per aiutarti a pianificare i tuoi viaggi in modo completo e dettagliato. Con un design moderno e colori pastello, offre un'esperienza utente intuitiva e piacevole per ogni fase della pianificazione del viaggio.

## ✨ Caratteristiche Principali

### 🗺️ **Analisi Destinazione Intelligente**

- **Ricerca Intelligente**: Sistema di autocompletamento con oltre 200 destinazioni popolari worldwide
- **Analisi Meteorologica**: Previsioni dettagliate con temperature medie, precipitazioni e condizioni climatiche
- **Analisi Costi Completa**: Stime precise per alloggio, cibo, trasporti locali e attività turistiche
- **Timing Ottimale**: Valutazione automatica se il periodo scelto è ideale per visitare la destinazione
- **Consigli AI Personalizzati**: Raccomandazioni dettagliate basate su Gemini AI per ottimizzare l'esperienza di viaggio

### 🎒 **Assistente Preparazione Avanzato**

- **Lista Personalizzata Intelligente**: Generazione automatica di checklist basata su destinazione, periodo e preferenze personali
- **Categorizzazione Completa**: Organizzazione per abbigliamento, elettronica, salute, documenti, accessori
- **Sistema di Priorità**: Classificazione degli oggetti come essenziali, raccomandati o opzionali
- **Raccomandazioni Sanitarie**: Informazioni su vaccini necessari, medicinali consigliati e consigli di salute specifici
- **Documenti di Viaggio**: Lista completa dei documenti necessari per la destinazione scelta
- **Export Funzionalità**: Possibilità di esportare le liste in formato Markdown per utilizzo offline

### 🛡️ **Sicurezza e Affidabilità**

- **Rate Limiting Intelligente**: Sistema avanzato di controllo delle richieste API con circuit breaker
- **Retry Logic**: Meccanismo di retry automatico con backoff esponenziale per garantire affidabilità
- **Privacy-First**: Elaborazione locale dei dati con rigorosa policy di privacy
- **Content Security Policy**: Protezioni complete contro XSS e altri attacchi web
- **Cookie Management**: Sistema di gestione cookie conforme alle normative europee

## 🎨 Design e UI

### Colori Pastello
- **Sky Blue** (#7dd3fc) - Colore primario
- **Soft Green** (#86efac) - Colore secondario
- **Warm Amber** (#fbbf24) - Accent
- **Soft Coral** (#fca5a5) - Highlight
- **Light Purple** (#c4b5fd) - Lavender
- **Peach** (#fed7aa) - Warm tone
- **Mint Green** (#bbf7d0) - Fresh tone

### Effetti Visivi
- **Glass Effect**: Sfondo semi-trasparente con blur
- **Hover Animations**: Scale e translate al passaggio del mouse
- **Floating Elements**: Animazioni di background decorative
- **Gradient Backgrounds**: Sfumature pastello fluide

## 🚀 Tecnologie e Architettura

### Stack Tecnologico Moderno

- **React 19** + **TypeScript** - Framework frontend con type safety completo
- **Tailwind CSS** - Design system utility-first per styling coerente
- **Vite** - Build tool ultra-veloce con HMR avanzato
- **Google Gemini AI** - Integrazione AI per analisi intelligenti e consigli personalizzati
- **Inter Font** - Tipografia moderna ottimizzata per leggibilità

### Architettura e Servizi

- **Gestione Stato**: Hooks personalizzati per navigazione e business logic
- **Servizi Modulari**: Separazione clear tra API, cache e business logic
- **Rate Limiting**: Sistema avanzato di throttling e circuit breaker
- **Sicurezza Integrata**: CSP, headers di sicurezza e input sanitization
- **Responsive Design**: Mobile-first approach con breakpoint ottimizzati

## 📱 Esperienza Utente e Design

### Responsive Design Completo

L'applicazione è ottimizzata per ogni dispositivo:

- 📱 **Mobile** - Design touch-friendly con gesture intuitive
- 📱 **Tablet** - Layout adattivo che sfrutta lo spazio disponibile
- 💻 **Desktop** - Esperienza completa con scorciatoie da tastiera

### Design System Pastello

- **Sky Blue** (#7dd3fc) - Colore primario per elementi interattivi
- **Soft Green** (#86efac) - Colore secondario per successo e conferme
- **Warm Amber** (#fbbf24) - Accent per evidenziare informazioni importanti
- **Soft Coral** (#fca5a5) - Highlight per avvisi e attenzione
- **Light Purple** (#c4b5fd) - Lavender per elementi decorativi
- **Peach** (#fed7aa) - Warm tone per accenti calorosi
- **Mint Green** (#bbf7d0) - Fresh tone per elementi naturali

### Effetti Visivi Moderni

- **Glass Effect**: Sfondo semi-trasparente con blur per eleganza
- **Hover Animations**: Scale e translate fluidi al passaggio del mouse
- **Floating Elements**: Animazioni di background decorative che creano profondità
- **Gradient Backgrounds**: Sfumature pastello fluide per un look moderno
- **Micro-interactions**: Feedback visivo immediato per ogni azione utente

## 🛠️ Installazione e Sviluppo

### Requisiti

- **Node.js** 18+ con npm
- **Chiave API Google Gemini** per funzionalità AI

### Setup Rapido

```bash
# Clona il repository
git clone https://github.com/Narden91/SmartTravel.git
cd SmartTravel

# Installa le dipendenze
npm install

# Configura le variabili d'ambiente
# Crea un file .env.local e aggiungi:
# VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build

# Anteprima build di produzione
npm run preview

# Type checking
npm run type-check

# Lint check
npm run lint
```

### Scripts Disponibili

- `npm run dev` - Server di sviluppo con HMR
- `npm run build` - Build ottimizzato per produzione
- `npm run preview` - Preview della build di produzione
- `npm run type-check` - Controllo tipi TypeScript
- `npm run lint` - Linting del codice

## 🚀 Deployment

L'applicazione viene deployata automaticamente su **GitHub Pages** tramite GitHub Actions quando viene effettuato un push al branch `main`.

### Setup Deployment

1. **GitHub Secrets**: Configura `VITE_GEMINI_API_KEY` nei secrets del repository
2. **GitHub Pages**: Abilita GitHub Pages nel repository (source: GitHub Actions)
3. **Automatic Deployment**: Ogni push al main branch triggera il deployment automatico

### URL Live
- 🌐 **Production**: https://narden91.github.io/SmartTravel/

Per dettagli completi sul deployment, consulta [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## 🔐 Sicurezza e Privacy Enterprise-Grade

### Sicurezza Web Avanzata

- **Content Security Policy (CSP)**: Protezione completa contro XSS e code injection
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, HSTS configurati
- **Input Sanitization**: Validazione e pulizia di tutti gli input utente
- **Domain Allowlisting**: Controllo rigoroso dei domini esterni consentiti

### Privacy e Conformità

- **Privacy-First Design**: Elaborazione locale dei dati senza persistenza remota
- **Cookie Essenziali**: Solo cookie tecnici necessari per il funzionamento
- **GDPR Compliant**: Banner cookie e gestione consensi conforme alle normative
- **No Tracking**: Nessun sistema di analytics o tracking degli utenti

### Resilienza e Affidabilità

- **Circuit Breaker Pattern**: Protezione automatica da fallimenti dei servizi esterni
- **Rate Limiting**: Controllo intelligente delle richieste per prevenire abusi
- **Graceful Degradation**: Fallback automatici in caso di indisponibilità servizi
- **Error Boundary**: Gestione centralizzata degli errori per UX sempre fluida

## 📁 Struttura del Progetto

```typescript
SmartTravel/
├── components/
│   ├── HomePage.tsx              # Homepage con overview delle funzionalità
│   ├── TravelAnalysis.tsx        # Componente analisi destinazione intelligente
│   ├── PackingAssistant.tsx      # Assistente preparazione avanzato
│   ├── NavBar.tsx               # Barra di navigazione responsive
│   ├── Footer.tsx               # Footer con link rapidi
│   ├── icons.tsx                # Libreria icone SVG personalizzate
│   ├── CookieBanner.tsx         # Banner gestione cookie GDPR-compliant
│   └── RateLimitStatus.tsx      # Monitor stato API e rate limiting
├── hooks/
│   └── useNavigation.ts         # Hook navigazione SPA con state management
├── services/
│   ├── geminiService.ts         # Integrazione Google Gemini AI con retry logic
│   ├── cityService.ts           # Database destinazioni e autocompletamento
│   ├── rateLimitService.ts      # Gestione rate limiting e circuit breaker
│   └── cookieService.ts         # Gestione cookie e localStorage
├── types.ts                     # Definizioni TypeScript complete
├── security.config.ts           # Configurazione sicurezza CSP e headers
├── index.css                    # Design system e stili globali
└── App.tsx                      # Componente principale e router
```

## 🌟 Funzionalità Avanzate

### 🔍 Sistema di Ricerca Intelligente

- **Database Esteso**: Oltre 200 destinazioni popolari categorizzate per popolarità
- **Autocompletamento Real-time**: Suggerimenti istantanei durante la digitazione
- **Ricerca Fuzzy**: Matching intelligente anche con errori di battitura
- **Gestione Focus**: UX ottimizzata per navigazione da tastiera

### 🔄 Gestione Errori e Resilienza

- **Circuit Breaker Pattern**: Protezione automatica da fallimenti API
- **Retry con Backoff**: Tentativi automatici con delay esponenziale
- **Fallback Graceful**: Risposte mock in caso di indisponibilità servizi
- **Error Boundary**: Gestione centralizzata degli errori React

### 📊 Monitoraggio e Debug

- **Rate Limit Monitor**: Dashboard real-time delle richieste API
- **Debug Hotkeys**: Ctrl+Shift+R per accesso rapido agli strumenti di debug
- **Performance Tracking**: Monitoring delle prestazioni e tempi di risposta

## 🌟 Roadmap e Funzionalità Future

### Versione 2.0 (In Pianificazione)

- [ ] **Integrazione Meteo Real-time**: API meteorologiche per previsioni accurate
- [ ] **Sistema di Preferenze**: Salvataggio profili utente e preferenze di viaggio
- [ ] **Modalità Offline**: Utilizzo delle funzionalità base senza connessione
- [ ] **Geolocalizzazione**: Suggerimenti automatici basati sulla posizione
- [ ] **Calendario Integrato**: Sincronizzazione con Google Calendar e Outlook

### Versione 3.0 (Visione Futura)

- [ ] **Community Features**: Condivisione liste e recensioni tra utenti  
- [ ] **Mobile App**: Versione nativa per iOS e Android
- [ ] **AI Voice Assistant**: Interazione vocale per pianificazione hands-free
- [ ] **Realtà Aumentata**: Preview AR delle destinazioni
- [ ] **Blockchain Integration**: Sistema di certificazione viaggi verificati

## 👥 Contributi e Community

### Come Contribuire

Il progetto è aperto ai contributi della community. Per contribuire:

1. **Fork** del repository
2. **Branch** dedicato per la feature (`git checkout -b feature/amazing-feature`)
3. **Commit** delle modifiche (`git commit -m 'Add amazing feature'`)
4. **Push** al branch (`git push origin feature/amazing-feature`)
5. **Pull Request** con descrizione dettagliata

### Standard di Qualità

- **TypeScript**: Codebase completamente tipizzato
- **ESLint + Prettier**: Code style consistente
- **Testing**: Coverage minima 80% per nuove features
- **Documentation**: Documentazione completa per ogni componente

---

## 🚀 SmartTravel - Il Futuro della Pianificazione Viaggi

**SmartTravel** rappresenta l'evoluzione della pianificazione viaggi, combinando intelligenza artificiale avanzata con un design moderno e sicurezza enterprise-grade. Che tu stia pianificando una fuga weekend o un'avventura intercontinentale, SmartTravel ti accompagna in ogni fase del viaggio.

Fatto con ❤️ per esploratori digitali 🌍✈️

---

### Links Utili

- 🌐 **Live Demo**: [SmartTravel App](https://narden91.github.io/SmartTravel)
- 📚 **Repository**: [GitHub](https://github.com/Narden91/SmartTravel)
- 🐛 **Report Bug**: [Issues](https://github.com/Narden91/SmartTravel/issues)
- 💡 **Feature Request**: [Discussions](https://github.com/Narden91/SmartTravel/discussions)
