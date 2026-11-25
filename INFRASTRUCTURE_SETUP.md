# Tradyx — Guida al Setup Infrastrutturale di Produzione

Questa guida descrive passo per passo come attivare in produzione l'intera architettura backend di **Tradyx** su **Vercel**, **Supabase (PostgreSQL + RLS)** e **Upstash Redis**, garantendo isolamento multi-tenant, zero chiavi API esposte nel client, caching distribuito e protezione anti-abuso per migliaia di utenti concorrenti.

---

## 1. Architettura Sicura Implementata

| Componente | Percorso nel Repository | Funzione |
| :--- | :--- | :--- |
| **API Gateway Mercati** | `api/atlas/markets.ts` | Proxy server-side (Twelve Data, Finnhub, CoinGecko, ExchangeRate, Yahoo) con cache distribuita **10s** |
| **API Gateway News + AI** | `api/atlas/news.ts` | Aggregatore news reali (Marketaux, NewsData, GNews) + analisi batch impatto AI (`gemini-2.5-flash`) lato server, cache **15 min**, rate limit **30 req/min** |
| **API Gateway Macro & FDI** | `api/atlas/macro.ts` | Aggregatore World Bank v2 + FRED API con cache distribuita **12 ore** |
| **AI Coach / Ulysses / Voice / OCR** | `api/ai/coach.ts` | Endpoint `POST` protetto da JWT Supabase + Rate Limit **30 req/min** + validazione Zod + `gemini-2.5-flash` server-side |
| **Auth Guard JWT** | `api/_lib/authGuard.ts` | Verifica del token `Authorization: Bearer <supabase_jwt>` contro Supabase Auth |
| **Cache & Rate Limiter** | `api/_lib/cacheAndRateLimit.ts` | Upstash Redis REST API con fallback automatico su warm memory cache |
| **Validazione Input Zod** | `api/_lib/validators.ts` | Validazione rigorosa di ISO2/ISO3, ticker, payload trade, trascrizioni e immagini (`400 Bad Request` su input malformati) |
| **Schema DB + RLS** | `supabase/schema.sql` | Tabelle `profiles`, `trades`, `watchlists`, `price_alerts`, `ulysses_sessions` con **Row Level Security** |
| **Header HTTP Bancari** | `vercel.json` | HSTS preload, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |

---

## 2. Configurazione Database & Auth su Supabase

1. Accedi a [Supabase Dashboard](https://supabase.com/dashboard) e crea un nuovo progetto (regione consigliata: **Europe West — Frankfurt / Milan** per latenza minima).
2. Nel menu laterale, apri **SQL Editor** → **New Query**.
3. Copia l'intero contenuto del file [`supabase/schema.sql`](./supabase/schema.sql) e clicca **Run**.
4. Verifica in **Table Editor** che siano presenti tutte le 5 tabelle con badge **RLS Enabled**:
   - `public.profiles`
   - `public.trades`
   - `public.watchlists`
   - `public.price_alerts`
   - `public.ulysses_sessions`
5. Vai in **Authentication → URL Configuration**:
   - Imposta **Site URL** sul dominio di produzione Vercel (es. `https://tradyx-frontend.vercel.app`).
   - Aggiungi il dominio tra i **Redirect URLs** (es. `https://tradyx-frontend.vercel.app/**`).
6. *(Opzionale)* Per Google Login: vai in **Authentication → Providers → Google**, inserisci Client ID e Client Secret di Google Cloud OAuth.
7. Recupera le chiavi in **Project Settings → API**:
   - `Project URL` → usala come `VITE_SUPABASE_URL` e `SUPABASE_URL`
   - `anon public key` → usala come `VITE_SUPABASE_ANON_KEY` e `SUPABASE_ANON_KEY`

---

## 3. Configurazione Cache Distribuita & Rate Limiting su Upstash Redis

Per servire migliaia di utenti concorrenti senza esaurire le quote API esterne o di Gemini:

1. Crea un database Redis gratuito o pay-as-you-go su [Upstash Console](https://console.upstash.com/) (regione consigliata: stessa regione EU/US delle Vercel Functions).
2. Nella pagina del database, sezione **REST API**, copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Inseriscili nelle Environment Variables di Vercel (solo lato server).

### Politiche di Cache & Anti-Abuso Attive
- **Quotazioni Mercati (`/api/atlas/markets`)**: TTL `10 secondi` (`s-maxage=10`)
- **News Paese + Analisi AI Batch (`/api/atlas/news`)**: TTL `15 minuti` (`900s`) + Rate Limit `30 req/min` per utente/IP
- **Indicatori Macro & FDI (`/api/atlas/macro`)**: TTL `12 ore` (`43200s`)
- **AI Coach / Ulysses / Voice / OCR (`/api/ai/coach`)**: Rate Limit `30 req/min` per utente autenticato/IP → risponde `HTTP 429 Too Many Requests` con header `Retry-After`

> Se `UPSTASH_REDIS_REST_URL` non è ancora configurata, il gateway degrada automaticamente e senza errori sulla cache in-memory della serverless instance.

---

## 4. Variabili d'Ambiente su Vercel (Checklist Completa)

Vai su **Vercel Dashboard → Progetto `tradyx-frontend` → Settings → Environment Variables** e aggiungi le seguenti variabili (abilita **Production** e **Preview**):

### A. Variabili Pubbliche Client (`VITE_*`)
*Queste variabili vengono incluse nel bundle frontend e sono protette da PostgreSQL RLS:*

| Nome Variabile | Obbligatoria | Descrizione |
| :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | **Sì** | URL del progetto Supabase (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **Sì** | Chiave pubblica `anon` di Supabase |

### B. Chiavi Segrete Esclusivamente Server-Side (MAI prefisso `VITE_`)
*Lette solo da `process.env` nelle Vercel Serverless Functions in `api/`. Mai esposte nel browser.*

| Nome Variabile | Obbligatoria | Utilizzata da |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Sì** | `api/ai/coach.ts`, `api/atlas/news.ts` (`gemini-2.5-flash`) |
| `UPSTASH_REDIS_REST_URL` | **Consigliata** | `api/_lib/cacheAndRateLimit.ts` |
| `UPSTASH_REDIS_REST_TOKEN` | **Consigliata** | `api/_lib/cacheAndRateLimit.ts` |
| `SUPABASE_URL` | **Consigliata** | `api/_lib/authGuard.ts` (verifica JWT server-side) |
| `SUPABASE_ANON_KEY` | **Consigliata** | `api/_lib/authGuard.ts` (verifica JWT server-side) |
| `TWELVEDATA_API_KEY` | Opzionale | `api/atlas/markets.ts` (azioni/indici/FX live) |
| `FINNHUB_API_KEY` | Opzionale | `api/atlas/markets.ts` (fallback equity live) |
| `MARKETAUX_API_KEY` | Opzionale | `api/atlas/news.ts` (news finanziarie globali con link canonici) |
| `NEWSDATA_API_KEY` | Opzionale | `api/atlas/news.ts` (fallback news business per paese) |
| `GNEWS_API_KEY` | Opzionale | `api/atlas/news.ts` (fallback news economiche) |
| `FRED_API_KEY` | Opzionale | `api/atlas/macro.ts` (tassi Fed/BCE e rendimenti Treasury reali) |

> **Importante:** Dopo aver salvato o modificato le variabili su Vercel, esegui un **Redeploy** dalla tab **Deployments** affinché il bundle e le serverless functions carichino la nuova configurazione.

---

## 5. Verifica Rapida Post-Deploy

Dopo il deploy su Vercel, verifica che tutto risponda correttamente:

1. **Test Validazione Zod (`400 Bad Request`)**:
   ```bash
   curl -i "https://<tuo-dominio>/api/atlas/news?iso2=INVALID"
   ```
   Deve restituire `HTTP 400` con `error: "VALIDATION_ERROR"`.

2. **Test Cache & Mercati (`200 OK`)**:
   ```bash
   curl -i "https://<tuo-dominio>/api/atlas/markets"
   ```
   Verifica la presenza degli header `X-Tradyx-Cache`, `Strict-Transport-Security`, `X-Frame-Options: DENY` e `X-Content-Type-Options: nosniff`.

3. **Test Protezione Auth su AI Coach (`401 Unauthorized` senza JWT quando Supabase è attivo)**:
   ```bash
   curl -i -X POST "https://<tuo-dominio>/api/ai/coach" \
     -H "Content-Type: application/json" \
     -d '{"mode":"COACH","prompt":"Analizza la mia disciplina"}'
   ```
   Con Supabase configurato deve rispondere `HTTP 401` finché non viene passato `Authorization: Bearer <jwt_utente>`.
