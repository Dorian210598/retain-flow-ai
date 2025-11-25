# Retain Flow AI - Dokumentacja do Pracy Magisterskiej

## 1. Informacje Ogólne o Projekcie

### 1.1 Nazwa i Cel Projektu
- **Nazwa**: Retain Flow AI
- **Tagline**: Customer retention and cancellation flow management system
- **Cel Biznesowy**: System zarządzania procesami retencji klientów i przepływami anulowania subskrypcji/usług z wykorzystaniem zaawansowanej analityki i testów A/B

### 1.2 Problem Biznesowy
Aplikacja rozwiązuje kluczowy problem w branży SaaS i ubezpieczeniowej - wysoką stopę rezygnacji klientów (churn rate). System umożliwia:
- Dynamiczne zarządzanie procesem rezygnacji z usługi
- Personalizację ofert retencyjnych w czasie rzeczywistym
- Testowanie różnych strategii zatrzymania klienta
- Analizę skuteczności działań retencyjnych
- Automatyzację procesów retencji

### 1.3 Kontekst Branżowy
Aplikacja jest zaprojektowana dla branży ubezpieczeniowej (widoczne w strukturze danych - policies, insurance products, CFAR benefit), ale architektura pozwala na łatwą adaptację do innych branż B2C/B2B z modelem subskrypcyjnym.

---

## 2. Architektura Techniczna

### 2.1 Stack Technologiczny

#### Frontend
- **Framework**: React 18.3.1
- **Język**: TypeScript
- **Build Tool**: Vite
- **Styling**: 
  - Tailwind CSS
  - shadcn/ui (system komponentów)
- **Zarządzanie stanem**: React Query (@tanstack/react-query 5.83.0)
- **Routing**: React Router DOM 6.30.1
- **Biblioteki UI**:
  - Radix UI (komponenty dostępności)
  - Lucide React (ikony)
  - Recharts (wykresy)
  - React Flow (@xyflow/react) (wizualny flow builder)

#### Backend
- **BaaS**: Supabase (PostgreSQL)
- **Autentykacja**: Supabase Auth
- **Baza danych**: PostgreSQL 17.4
- **ORM/Client**: @supabase/supabase-js 2.54.0

#### Narzędzia deweloperskie
- **Walidacja formularzy**: React Hook Form + Zod
- **Linting**: ESLint + TypeScript ESLint
- **CSS**: PostCSS + Tailwind

### 2.2 Architektura Aplikacji

#### Wzorzec Architektoniczny
Aplikacja wykorzystuje **Feature-Based Architecture** (architektura oparta na funkcjonalnościach):

```
src/
├── features/           # Moduły funkcjonalne
│   ├── auth/          # Autentykacja
│   ├── dashboard/     # Panel administracyjny i kliencki
│   └── cancellation-flow-renderer/  # Silnik renderujący przepływy
├── components/        # Komponenty współdzielone (UI)
├── hooks/            # Custom React hooks
├── integrations/     # Integracje zewnętrzne (Supabase)
├── lib/              # Narzędzia pomocnicze
└── pages/            # Komponenty stron
```

#### Separacja Warstw
1. **Warstwa prezentacji** (React Components)
2. **Warstwa logiki biznesowej** (Custom Hooks)
3. **Warstwa danych** (Supabase Client + React Query)
4. **Warstwa persistencji** (PostgreSQL via Supabase)

### 2.3 Kluczowe Wzorce Projektowe

1. **Component Composition Pattern** - budowanie złożonych UI z małych komponentów
2. **Custom Hooks Pattern** - enkapsulacja logiki biznesowej (useAuth, useFlowRenderer)
3. **Provider Pattern** - SessionContext dla zarządzania stanem sesji
4. **Protected Routes Pattern** - zabezpieczenie tras wymagających autentykacji
5. **Configuration-Driven Rendering** - dynamiczne renderowanie komponentów na podstawie konfiguracji z bazy danych

---

## 3. Model Danych i Baza Danych

### 3.1 Schemat Bazy Danych

#### Tabele Główne

**organizations** - Organizacje (firmy ubezpieczeniowe)
```sql
- id (UUID, PK)
- name (TEXT)
- created_at (TIMESTAMP)
```

**profiles** - Profile użytkowników
```sql
- id (UUID, PK, FK -> auth.users)
- organization_id (UUID, FK -> organizations)
- role (ENUM: 'admin' | 'client')
- full_name (TEXT)
- avatar_url (TEXT)
- created_at, updated_at (TIMESTAMP)
```

**products** - Produkty ubezpieczeniowe
```sql
- id (UUID, PK)
- organization_id (UUID, FK -> organizations)
- name (TEXT)
- description (TEXT)
- created_at (TIMESTAMP)
```

**client_policies** - Polisy klientów
```sql
- id (UUID, PK)
- client_id (UUID, FK -> profiles)
- product_id (UUID, FK -> products)
- policy_number (TEXT, UNIQUE)
- status (ENUM: 'active' | 'pending_cancellation' | 'cancelled')
- start_date (DATE)
- renewal_date (DATE)
- has_active_claim (BOOLEAN)
- has_cfar_benefit (BOOLEAN) # Cancel For Any Reason
- created_at (TIMESTAMP)
```

**cancellation_flows** - Definicje przepływów anulowania
```sql
- id (UUID, PK)
- organization_id (UUID, FK -> organizations)
- name (TEXT)
- description (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

**flow_variants** - Warianty przepływów (dla testów A/B)
```sql
- id (UUID, PK)
- flow_id (UUID, FK -> cancellation_flows)
- name (TEXT)
- is_control (BOOLEAN) # Wariant kontrolny
- traffic_allocation (FLOAT) # % ruchu
- created_at (TIMESTAMP)
```

**flow_steps** - Kroki w przepływie
```sql
- id (UUID, PK)
- variant_id (UUID, FK -> flow_variants)
- component_name (TEXT, FK -> step_components)
- step_order (INTEGER)
- configuration (JSONB) # Konfiguracja komponentu
- condition (JSONB) # Warunki wyświetlania
- created_at (TIMESTAMP)
```

**step_components** - Dostępne komponenty
```sql
- component_name (TEXT, PK)
- description (TEXT)
- default_config_schema (JSONB)
```

**flow_sessions** - Sesje użytkowników
```sql
- id (UUID, PK)
- client_id (UUID, FK -> profiles)
- policy_id (UUID, FK -> client_policies)
- flow_variant_id (UUID, FK -> flow_variants)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- outcome (ENUM: 'retained' | 'cancelled')
- created_at (TIMESTAMP)
```

**interaction_events** - Zdarzenia interakcji
```sql
- id (UUID, PK)
- session_id (UUID, FK -> flow_sessions)
- step_id (UUID, FK -> flow_steps)
- event_type (TEXT) # 'view', 'click', 'submit', etc.
- event_data (JSONB) # Szczegóły zdarzenia
- timestamp (TIMESTAMP)
```

### 3.2 Bezpieczeństwo Danych (Row Level Security)

#### Kluczowe Funkcje Bezpieczeństwa

```sql
-- Pobieranie ID organizacji użytkownika
CREATE FUNCTION get_my_organization_id()
RETURNS UUID
SECURITY DEFINER

-- Pobieranie roli użytkownika
CREATE FUNCTION get_my_role()
RETURNS TEXT
SECURITY DEFINER
```

#### Przykładowe Polityki RLS

**Administratorzy**:
- Mogą zarządzać przepływami tylko w swojej organizacji
- Widzą wszystkie sesje klientów ze swojej organizacji
- Zarządzają produktami i wariantami przepływów

**Klienci**:
- Widzą tylko własne polisy
- Tworzą i aktualizują własne sesje
- Zapisują swoje interakcje

### 3.3 Triggery i Automatyzacja

**handle_new_user()** - Automatyczne tworzenie profilu przy rejestracji
- Tworzy organizację dla adminów
- Przypisuje klientów do organizacji
- Tworzy domyślną polisę dla klientów
- Generuje numer polisy

**update_updated_at_column()** - Automatyczna aktualizacja znaczników czasu

---

## 4. Kluczowe Funkcjonalności

### 4.1 System Autentykacji

#### Implementacja
- Dwupoziomowy system ról: **admin** i **client**
- Wykorzystanie Supabase Auth z email/hasłem
- Automatyczne tworzenie profilu i organizacji przy rejestracji
- Protected Routes dla zabezpieczenia zasobów

#### Przepływ Autentykacji
1. Użytkownik rejestruje się podając: email, hasło, imię, rolę, nazwę organizacji (admin)
2. Trigger `handle_new_user()` tworzy profil i powiązania
3. Przekierowanie do odpowiedniego dashboardu na podstawie roli
4. Persist sesji w localStorage via Supabase

### 4.2 Panel Administracyjny

#### Dostępne Moduły
1. **Dashboard** - Przegląd metryk i statystyk
2. **Analytics** - Zaawansowana analityka
   - Funnel Analysis (analiza lejka konwersji)
   - Heatmapy interakcji
   - Real-time metrics
   - Session Replay
3. **Flow Builder** - Wizualny kreator przepływów
4. **Client Management** - Zarządzanie klientami

#### Analytics - Kluczowe Metryki
```typescript
interface AdminStats {
  totalClients: number;
  activeFlows: number;
  retentionRate: number;
  avgSessionTime: string;
}
```

#### Flow Builder
- Wizualne tworzenie przepływów za pomocą React Flow
- Drag-and-drop interface
- Konfiguracja wariantów A/B
- Traffic allocation między wariantami
- Conditional logic dla kroków

### 4.3 Panel Kliencki

#### Funkcjonalności
- Przegląd aktywnych polis
- Inicjowanie procesu anulowania
- Interakcja z personalizowanymi ofertami retencyjnymi

### 4.4 Flow Renderer - Silnik Przepływów

#### Architektura
```typescript
// Mapowanie komponentów
const componentMap: Record<string, React.ComponentType<any>> = {
  'FeedbackSurvey': FeedbackSurvey,
  'DiscountOffer': DiscountOffer,
  'PauseSubscription': PauseSubscription,
  'ServiceUpgrade': ServiceUpgrade,
  'LoyaltyReward': LoyaltyReward,
  'CallbackScheduler': CallbackScheduler,
  'FinalConfirmation': FinalConfirmation,
  'CompletionSummary': CompletionSummary,
}
```

#### Dostępne Komponenty Retencyjne

1. **FeedbackSurvey** - Ankieta powodów rezygnacji
   - Zbieranie przyczyn odejścia
   - Analiza sentimentu
   
2. **DiscountOffer** - Oferta rabatowa
   - Dynamiczne generowanie zniżek
   - Personalizacja oferty
   
3. **PauseSubscription** - Tymczasowe zawieszenie
   - Alternatywa dla anulowania
   - Wybór okresu zawieszenia
   
4. **ServiceUpgrade** - Upgrade usługi
   - Cross-sell/up-sell
   - Lepszy produkt w tej samej cenie
   
5. **LoyaltyReward** - Nagrody lojalnościowe
   - Punkty, benefity dla długoletnich klientów
   
6. **CallbackScheduler** - Umówienie rozmowy
   - Kontakt z konsultantem
   - Kalendarz spotkań
   
7. **FinalConfirmation** - Potwierdzenie decyzji
   - Last-chance offer
   
8. **CompletionSummary** - Podsumowanie
   - Wynik sesji (retained/cancelled)

#### Tracking Interakcji
Każda interakcja użytkownika jest zapisywana:
```typescript
await supabase.from('interaction_events').insert({
  session_id: sessionId,
  step_id: currentStep.id,
  event_type: 'click' | 'view' | 'submit',
  event_data: { /* szczegóły */ }
})
```

### 4.5 System A/B Testing

#### Implementacja
1. **Traffic Allocation**: Rozkład ruchu między wariantami na podstawie `traffic_allocation`
2. **Random Assignment**: Losowe przypisywanie użytkowników do wariantów
3. **Session Persistence**: Użytkownik widzi ten sam wariant przez całą sesję
4. **Control Group**: Zawsze istnieje wariant kontrolny (is_control: true)

#### Metryki Porównawcze
- Retention rate per variant
- Average session time
- Completion rate
- Step-by-step drop-off analysis

### 4.6 Session Replay

#### Technologia
- Nagrywanie wszystkich interakcji użytkownika
- Storage w JSONB (interaction_events)
- Odtwarzanie sekwencyjne zdarzeń
- Funkcja bazodanowa `get_session_replay_data()`

#### Use Case
- Debugging problematycznych przepływów
- UX optimization
- Training nowych pracowników
- Compliance i audyt

### 4.7 Real-Time Metrics

#### Monitoring na Żywo
- Active sessions count
- Current retention rate
- Average time per step
- Drop-off points identification

---

## 5. Aspekty Biznesowe

### 5.1 Wartość dla Biznesu

#### ROI Metrics
1. **Zwiększona retencja** - Redukcja churn rate o X%
2. **Automatyzacja** - Redukcja kosztów obsługi klienta
3. **Data-driven decisions** - Decyzje oparte na danych
4. **Personalizacja** - Wyższy engagement klientów
5. **Compliance** - Śledzenie i dokumentacja interakcji

#### KPI Systemu
- **Retention Rate**: % klientów zatrzymanych po wejściu w flow
- **Average Session Time**: Czas spędzony w przepływie
- **Conversion per Step**: Skuteczność każdego kroku
- **Variant Performance**: Porównanie skuteczności wariantów A/B
- **Cost per Retained Customer**: Koszt zatrzymania klienta

### 5.2 Target Market

#### Primary Markets
1. **Insurance Companies** - Obecna implementacja
2. **SaaS Companies** - Subscription-based software
3. **Telecom** - Mobile/internet providers
4. **Streaming Services** - Netflix-like platforms
5. **E-commerce Subscriptions** - Recurring purchases

### 5.3 Competitive Advantage

#### Differentiatory
1. **Configuration-Driven**: Bez konieczności kodowania nowych przepływów
2. **Multi-tenant**: Jedna instancja, wiele organizacji
3. **Real-Time Analytics**: Instant insights
4. **Session Replay**: Unikalny feature w tej kategorii
5. **Open Architecture**: Łatwa integracja z istniejącymi systemami

### 5.4 Business Model

#### Potencjalne Modele Monetyzacji
1. **Per-Seat Pricing**: Opłata za użytkownika (admin)
2. **Usage-Based**: Opłata za liczbę sesji/klientów
3. **Tiered Plans**:
   - Starter: Basic flows, limited analytics
   - Professional: A/B testing, advanced analytics
   - Enterprise: Custom components, white-label, API access
4. **Implementation Fee**: One-time setup
5. **Managed Service**: Optymalizacja przepływów jako usługa

---

## 6. Integracje i Rozszerzalność

### 6.1 Obecne Integracje
- **Supabase**: Auth, Database, Real-time
- **React Query**: Cache management, optimistic updates

### 6.2 Potencjalne Integracje
1. **CRM Systems**: Salesforce, HubSpot
2. **Email Marketing**: SendGrid, Mailchimp
3. **Analytics**: Google Analytics, Mixpanel
4. **Payment Gateways**: Stripe, PayPal (dla ofert)
5. **Customer Support**: Intercom, Zendesk
6. **BI Tools**: Looker, Tableau, Power BI

### 6.3 API Architecture

#### Obecna Struktura
REST API przez Supabase PostgREST:
```
GET    /cancellation_flows
POST   /cancellation_flows
GET    /flow_sessions
POST   /flow_sessions
POST   /interaction_events
```

#### Potencjalna Rozbudowa
- GraphQL API dla złożonych zapytań
- Webhooks dla event-driven integrations
- Public API dla third-party developers

---

## 7. Bezpieczeństwo i Compliance

### 7.1 Security Measures

#### Application Level
1. **Row Level Security (RLS)** - Izolacja danych na poziomie bazy
2. **JWT Authentication** - Secure token-based auth
3. **HTTPS Only** - Encrypted communication
4. **Input Validation** - Zod schemas dla wszystkich formularzy
5. **XSS Protection** - React's built-in escaping
6. **CSRF Protection** - Supabase token validation

#### Data Level
1. **Encryption at Rest** - PostgreSQL encryption
2. **Encrypted Backups** - Supabase automated backups
3. **Audit Trail** - Wszystkie interakcje logowane
4. **Soft Deletes** - Nie usuwamy danych permanentnie

### 7.2 Privacy & Compliance

#### GDPR Readiness
- **Right to Access**: Query user's all data
- **Right to Erasure**: Cascade delete on user removal
- **Data Portability**: Export functionality (planned)
- **Consent Management**: Explicit opt-ins dla marketingu

#### HIPAA Considerations (Insurance)
- **PHI Protection**: Brak przechowywania wrażliwych danych medycznych
- **Access Controls**: Role-based access
- **Audit Logs**: Kompletny trail interakcji

---

## 8. Performance i Skalowalność

### 8.1 Current Performance

#### Frontend
- **Vite Build**: Fast dev server, optimized production builds
- **Code Splitting**: Lazy loading routes
- **React Query**: Intelligent caching, background updates
- **Optimistic Updates**: Instant UI feedback

#### Backend
- **Indexed Queries**: Proper database indices
- **Connection Pooling**: PgBouncer przez Supabase
- **Caching Strategy**: React Query + Supabase cache headers

### 8.2 Scalability Considerations

#### Horizontal Scaling
- **Stateless Frontend**: Deploy on CDN (Vercel, Netlify)
- **Supabase Scaling**: Auto-scaling database
- **Multi-region**: Possible with Supabase Enterprise

#### Vertical Scaling
- **Database**: PostgreSQL scales well vertically
- **Read Replicas**: For analytics queries
- **Caching Layer**: Redis for hot data (future)

### 8.3 Monitoring & Observability

#### Current Monitoring
- Supabase Dashboard: Database metrics
- Browser DevTools: Performance profiling
- React Query DevTools: Cache inspection

#### Recommended Additions
- **APM**: Sentry for error tracking
- **Logging**: Structured logging with severity levels
- **Metrics**: Prometheus + Grafana
- **Uptime Monitoring**: UptimeRobot, Pingdom

---

## 9. Development Workflow

### 9.1 Version Control
- **Git**: Source control
- **GitHub Integration**: Lovable native integration
- **Branching Strategy**: Feature branches (recommended)

### 9.2 CI/CD
- **Auto Deploy**: Lovable automatic deployment
- **Frontend**: Instant preview on push
- **Backend (Supabase)**: Migration-based deployments

### 9.3 Testing Strategy

#### Current State
- Manual testing
- TypeScript type safety

#### Recommended Additions
1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: Playwright / Cypress
3. **E2E Tests**: Critical user flows
4. **Load Testing**: K6 / Artillery dla testów wydajności
5. **A/B Test Validation**: Statistical significance tests

---

## 10. Roadmap i Przyszły Rozwój

### 10.1 Short-term (0-3 miesiące)
1. **Enhanced Analytics**
   - Cohort analysis
   - Customer lifetime value tracking
   - Predictive churn modeling

2. **AI Integration**
   - GPT-powered response suggestions
   - Sentiment analysis feedback
   - Automatic flow optimization recommendations

3. **Improved Flow Builder**
   - Drag-and-drop step reordering
   - Visual condition builder
   - Template library

### 10.2 Mid-term (3-6 miesięcy)
1. **Mobile App**
   - React Native version
   - Push notifications dla ofert

2. **Advanced Personalization**
   - Customer segmentation
   - Dynamic content based on history
   - Machine learning predictions

3. **Multi-channel Support**
   - Email flows
   - SMS notifications
   - In-app messages

### 10.3 Long-term (6-12 miesięcy)
1. **White Label Solution**
   - Custom branding per organization
   - Subdomain routing
   - Custom component library

2. **Marketplace**
   - Community-built flow templates
   - Custom component sharing
   - Best practices library

3. **Enterprise Features**
   - SSO (SAML, OAuth)
   - Advanced audit logs
   - Custom SLAs
   - Dedicated support

---

## 11. Wnioski i Rekomendacje

### 11.1 Mocne Strony Projektu
1. **Modern Tech Stack**: Wykorzystanie najnowszych technologii
2. **Scalable Architecture**: Przygotowana na wzrost
3. **Security-First**: RLS i proper authentication
4. **Data-Driven**: Extensywna analityka
5. **Flexibility**: Configuration-driven approach

### 11.2 Obszary do Poprawy
1. **Testing Coverage**: Brak automatycznych testów
2. **Documentation**: Brak kompletnej dokumentacji API
3. **Error Handling**: Można ulepszyć user-facing errors
4. **Offline Support**: Brak PWA capabilities
5. **Internationalization**: Tylko angielski interface

### 11.3 Rekomendacje dla Rozwoju
1. Implementacja comprehensive testing strategy
2. Dodanie monitoring i alerting solutions
3. Rozbudowa dokumentacji dla developerów
4. Przeprowadzenie security audit przez third-party
5. User research dla UX improvements

---

## 12. Appendix

### 12.1 Kluczowe Pliki Projektu

```
src/
├── features/
│   ├── auth/
│   │   ├── components/AuthForm.tsx          # Formularz logowania/rejestracji
│   │   ├── components/ProtectedRoute.tsx    # HOC dla zabezpieczonych tras
│   │   └── hooks/useAuth.ts                 # Hook zarządzania autentykacją
│   │
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx               # Panel admina
│   │   ├── ClientDashboard.tsx              # Panel klienta
│   │   ├── Analytics.tsx                    # Moduł analityczny
│   │   ├── FlowBuilder.tsx                  # Kreator przepływów
│   │   └── components/analytics/            # Komponenty analityczne
│   │
│   └── cancellation-flow-renderer/
│       ├── components/FlowRenderer.tsx      # Główny renderer
│       ├── components/componentMap.ts       # Mapowanie komponentów
│       ├── contexts/SessionContext.tsx      # Context sesji
│       └── components/retention/            # Komponenty retencyjne
│
├── integrations/supabase/
│   ├── client.ts                            # Supabase client config
│   └── types.ts                             # Auto-generated types
│
└── pages/
    ├── Index.tsx                            # Dashboard router
    ├── Auth.tsx                             # Strona logowania
    └── ResearchIntro.tsx                    # Landing page
```

### 12.2 Environment Variables

```env
VITE_SUPABASE_URL=https://qljdeabjvxdpvqldceor.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=qljdeabjvxdpvqldceor
```

### 12.3 Deployment

#### Frontend Hosting
- **Lovable Platform**: Auto-deploy
- **Alternatives**: Vercel, Netlify, CloudFlare Pages

#### Backend (Supabase)
- **Region**: Configurable
- **Plan**: Free tier available, Pro recommended for production
- **Backup**: Automatic daily backups

### 12.4 Dependencies Overview

**Core Dependencies** (21):
- react, react-dom (UI framework)
- @supabase/supabase-js (Backend)
- @tanstack/react-query (State management)
- react-router-dom (Routing)
- zod (Validation)
- recharts (Charts)
- @xyflow/react (Flow builder)

**UI Dependencies** (30+ Radix UI packages):
- Accessible, unstyled primitives
- Full keyboard navigation
- ARIA compliant

---

## 13. Bibliografia i Źródła

### 13.1 Dokumentacja Techniczna
1. React Documentation: https://react.dev
2. TypeScript Handbook: https://www.typescriptlang.org/docs
3. Supabase Docs: https://supabase.com/docs
4. Tailwind CSS: https://tailwindcss.com/docs
5. React Query: https://tanstack.com/query/latest

### 13.2 Best Practices
1. React Best Practices: Kent C. Dodds Blog
2. TypeScript Best Practices: TypeScript Handbook
3. Database Design: PostgreSQL Documentation
4. Security: OWASP Top 10

### 13.3 Research Papers (Rekomendowane)
1. Customer Churn Prediction using Machine Learning
2. A/B Testing Best Practices
3. User Experience in Retention Flows
4. Behavioral Economics in Customer Retention

---

## Podsumowanie dla AI

Ta dokumentacja zawiera kompletny opis projektu Retain Flow AI - zaawansowanego systemu zarządzania retencją klientów z funkcjami:

- **Multi-tenant SaaS** z role-based access control
- **Dynamic flow builder** z A/B testing
- **Real-time analytics** i session replay
- **Configuration-driven architecture** umożliwiająca personalizację bez kodu
- **Modern tech stack** (React, TypeScript, Supabase)
- **Enterprise-grade security** z Row Level Security

Aplikacja jest gotowa do deployment i dalszego rozwoju w kierunku enterprise solution dla firm z branży ubezpieczeniowej, SaaS, i telco.

**Kluczowe innowacje**:
1. Session replay dla customer journey analysis
2. Configuration-driven rendering komponentów retencyjnych
3. Real-time A/B testing z traffic allocation
4. Automatyzacja procesu retencji z data-driven insights
