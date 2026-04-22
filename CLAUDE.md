# Voicely AI — Sesli Hatirlatici + Mini CRM

> **Marka**: Voicely AI (kullaniciya gorunen isim) • **Repo/slug**: VoiceRemind (git + EAS icin degismedi) • **Bundle**: com.blaixs.VoiceRemind
> **Yayın stratejisi**: Türkiye-first (Faz 1) → Dünya açılımı (Faz 2, sonraki versiyonla)

## Proje Ozeti

iOS/Android sesli hatirlatici uygulamasi. Kullanici mikrofona basili tutar, konusur, ses Whisper STT ile metne cevrilir, GPT-4.1-mini ile intent parse edilir, deterministik Turkce tarih parser ile ISO datetime uretilir, onay modali gosterilir, lokal bildirim zamanlanir. Veriler Supabase bulut veritabaninda saklanir, kullanici auth ile korunur.

**Akis:** Login → Mikrofon → Whisper STT → GPT Function Calling → Turkish Date Parser → Onay Modal → Supabase DB + Local Notification

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | React Native (Expo SDK 54) |
| Dil | TypeScript (strict mode) |
| State | Zustand v5 (cloud-first, AsyncStorage kaldırıldı) |
| Navigasyon | React Navigation v7 (bottom tabs + native stack) |
| Ses | expo-av (44100Hz, mono, m4a AAC) |
| Bildirim | expo-notifications (local scheduled) |
| Backend | Supabase Edge Functions (Deno runtime) |
| Veritabani | Supabase PostgreSQL (RLS korumalı) |
| Auth | Supabase Auth (email/password) |
| STT | OpenAI Whisper API |
| NLP | GPT-4.1-mini (function calling) |
| Tasarim | Custom design system (indigo palette) |
| Build | EAS Build (Android APK hazır, iOS TestFlight bekliyor) |

## Proje Yapisi

```
VoiceRemind/
├── App.tsx                          # Root: auth flow + tab nav + notification + data fetch
├── eas.json                         # EAS Build config (preview=APK, production=store)
├── app.json                         # Expo config + plugins + EAS project ID
├── src/
│   ├── models/types.ts              # Contact, Reminder, ParsedReminder, EdgeFunctionResponse
│   ├── navigation/types.ts          # ContactsStackParamList
│   ├── stores/
│   │   ├── authStore.ts             # Supabase Auth — login, register, logout, session
│   │   ├── contactStore.ts          # Cloud-first CRUD — Supabase + lokal state
│   │   └── reminderStore.ts         # Cloud-first CRUD — Supabase + lokal notification lifecycle
│   ├── hooks/
│   │   ├── useRecording.ts          # expo-av recording hook (idle → recording → idle)
│   │   └── useParseAudio.ts         # Edge Function client (idle → sending → done/error)
│   ├── utils/
│   │   ├── config.ts                # Supabase URL/key, recording config, confidence thresholds
│   │   ├── api.ts                   # sendAudioForParsing (multipart + auth JWT + apikey)
│   │   ├── supabase.ts              # Supabase client singleton (AsyncStorage session persist)
│   │   ├── theme.ts                 # Design system: colors, spacing, radius, fontSize, shadow
│   │   └── turkishDateParser.ts     # Deterministic Turkish date → ISO (göreli + mutlak zaman)
│   ├── screens/
│   │   ├── AuthScreen.tsx           # Login/Register — tek ekran, toggle ile geçiş
│   │   ├── HomeScreen.tsx           # Mic button + bugünün hatırlatıcıları
│   │   ├── RemindersScreen.tsx      # Timeline + segment filtre + section groups
│   │   ├── ContactsScreen.tsx       # Avatar renkli liste + arama + FAB
│   │   └── ContactDetailScreen.tsx  # Profil kartı + aksiyon butonları
│   └── components/
│       ├── MicButton.tsx            # Gradient ring + glow pulse animasyonu
│       ├── ConfirmationModal.tsx     # Transcript kutusu + reminder kartları + onay
│       ├── ReminderCard.tsx         # Editable kart + confidence göstergesi
│       ├── ConfidenceIndicator.tsx  # Renk kodlu güven badge'i
│       ├── ContactBadge.tsx         # Yeni/mevcut kişi badge'i
│       ├── ContactForm.tsx          # İkon etiketli form (add + edit modu)
│       └── ErrorBoundary.tsx        # Class component crash fallback
├── supabase/
│   ├── functions/parse-reminder/
│   │   ├── index.ts                 # Edge Function: auth + multipart → Whisper → GPT → parser
│   │   └── turkishDateParser.ts     # Deno-compatible parser kopyası (src ile senkron tutulmalı!)
│   └── migrations/
│       └── 001_create_tables.sql    # contacts + reminders tabloları + RLS policy'ler
└── .env                             # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Mimari Kararlar

### Cloud-First Veri Yönetimi
Eski: AsyncStorage (lokal) → Yeni: Supabase PostgreSQL (bulut).
Her CRUD doğrudan Supabase'e gider, sonuç lokal state'e yazılır. Offline-first karmaşıklığı yok çünkü uygulama zaten internet gerektiriyor (Whisper + GPT).

### Auth Flow
`App.tsx`'te conditional rendering:
- `initialized === false` → Splash (loading)
- `session === null` → AuthScreen (login/register)
- `session !== null` → MainApp (tab navigator)
Kullanıcı "geri" basarak login'i bypass edemez.

### Hybrid Date Parsing
LLM tarih hesabı yapmaz. GPT sadece `dateText` (raw: "yarın akşam 8") üretir, deterministik parser bunu ISO'ya çevirir. Göreceli zaman desteği eklendi: "10 dakika sonra", "yarım saat sonra", "2 saat içinde".

### Edge Function Auth
- Client: `apikey` header (gateway erişim) + `Authorization: Bearer <user_jwt>` (kimlik)
- Edge Function: `--no-verify-jwt` ile deploy (gateway JWT doğrulaması kapalı)
- Fonksiyon içinde `supabase.auth.getUser(token)` ile doğrulama
- RLS policy'ler: `auth.uid() = user_id` — kullanıcı sadece kendi verisini görür

### Timezone Stratejisi
- Edge Function UTC'de çalışır → `now` kullanıcı timezone'una çevrilir: `new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))`
- `formatLocal()` fonksiyonu `toISOString()` yerine kullanılır (UTC offset sorunu)
- DB'de `datetime` kolonu `TEXT` tipinde (TIMESTAMPTZ timezone dönüşüm sorunları yaratıyordu)
- Bildirim `SchedulableTriggerInputTypes.DATE` ile zamanlanır

### Contact Pre-filtering
`contactStore.filterByTranscript(transcript)` transkriptte geçen carileri filtreler, GPT'ye sadece ilgili carileri gönderir → token tasarrufu.

### Confidence-Based UX
- `>= 0.9` → Yüksek (yeşil badge)
- `0.7 - 0.9` → Orta (sarı badge)
- `< 0.7` → Düşük (kırmızı badge, tarih zorunlu düzenleme)

### Notification Lifecycle
- `addReminder()` → `scheduleNotificationAsync()` → notification ID DB'ye kaydedilir
- `markDone()` → `cancelScheduledNotificationAsync()` + DB status güncelle
- `markPending()` → notification yeniden schedule + DB status güncelle
- `reconcileNotifications()` → uygulama açılışında hayalet bildirimleri temizle + geçmiş reminder'ları done yap

### Snake_case ↔ camelCase
PostgreSQL convention: `snake_case` (contact_name, remind_before)
JavaScript convention: `camelCase` (contactName, remindBefore)
Store'larda `rowToContact()` / `rowToReminder()` dönüşüm fonksiyonları var.

## Kodlama Kuralları

- TypeScript strict mode — `any` yasak (FormData hariç, RN kısıtlaması)
- Fonksiyonel componentler (class sadece ErrorBoundary)
- Zustand selector pattern: `useStore((s) => s.field)`
- Türkçe UI metinleri, İngilizce değişken/fonksiyon adları
- Theme sistemi: tüm renkler, spacing, font `theme.ts`'den gelir
- `colors.bg` (#EAEFF8 soft indigo-gray) arka plan, `colors.white/bgCard` kart yüzeyler
- Edge Function'da CORS header'lar zorunlu
- Edge Function deploy: `supabase functions deploy parse-reminder --no-verify-jwt --project-ref dtepkruumsxlflyzfeut`
- turkishDateParser.ts değiştiğinde MUTLAKA supabase kopyası da güncellenmelidir

## Çalıştırma

```bash
# Geliştirme (dev server gerekli — şimdilik iPhone için)
npx expo start --lan

# Supabase Edge Function deploy
supabase functions deploy parse-reminder --no-verify-jwt --project-ref dtepkruumsxlflyzfeut

# TypeScript kontrol
npx tsc --noEmit

# Android APK build (standalone, dev server gereksiz)
eas build --platform android --profile preview

# iOS build (Apple Developer hesabı gerekli — $99/yıl)
eas build --platform ios --profile preview
```

## Environment Variables

```env
# .env (client — EXPO_PUBLIC_ prefix ile build'e gömülür)
EXPO_PUBLIC_SUPABASE_URL=https://dtepkruumsxlflyzfeut.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_weQnIg1g5Ru1RN0Dl__nwA_hOw4zkmS

# Supabase Edge Function secrets (Dashboard > Edge Functions > Secrets)
OPENAI_API_KEY=sk-proj-xxx

# Otomatik olarak Edge Function'da mevcut:
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Bilgileri

- **Project ref:** dtepkruumsxlflyzfeut
- **Dashboard:** https://supabase.com/dashboard/project/dtepkruumsxlflyzfeut
- **DB tabloları:** contacts, reminders (RLS aktif, user_id bazlı)
- **Auth:** Email/password, Confirm email KAPALI
- **Edge Function:** parse-reminder (--no-verify-jwt)

## EAS Build Bilgileri

- **Expo hesabı:** @blaixs
- **Project ID:** 7187767c-54bc-4f2f-bc53-68e624c1f1c8
- **Android package:** com.blaixs.VoiceRemind
- **iOS bundle:** com.blaixs.VoiceRemind
- **Son Android APK:** https://expo.dev/accounts/blaixs/projects/VoiceRemind/builds/519f0a48-cd43-4483-9c06-f0755d5379da

---

## Tamamlanan Fazlar

- [x] **Faz 1** — Proje yapısı + tipler + config
- [x] **Faz 2** — Zustand store'lar (contact + reminder)
- [x] **Faz 3** — Ses kayıt hook'u (useRecording + expo-av)
- [x] **Faz 4** — Supabase Edge Function (Whisper + GPT + parser)
- [x] **Faz 5** — Client entegrasyonu (useParseAudio + ConfirmationModal)
- [x] **Faz 6** — Bildirim sistemi (expo-notifications + lifecycle)
- [x] **Faz 7** — UI/UX profesyonel tasarım (design system + tüm ekranlar)
- [x] **Faz 8** — Bulut altyapı (Supabase DB + Auth + RLS + cloud-first store'lar)
- [x] **Faz 9** — EAS Build (Android APK başarılı)

## Düzeltilen Buglar (bu oturumda)

- [x] Bug #2: Android'de cari filtresi çalışmıyordu (ActionSheetIOS → Alert.alert eklendi)
- [x] Bug #7: "Geri Al" butonu çalışmıyordu (markPending + notification re-schedule eklendi)
- [x] Bug #8: markDone notification iptal etmiyordu (önceden düzeltilmişti)
- [x] TIMESTAMPTZ → TEXT: 3 saatlik timezone kayması düzeltildi
- [x] Edge Function UTC sorunu: `now` kullanıcı timezone'una çevrildi
- [x] Göreceli zaman desteği: "X dakika sonra", "yarım saat sonra" eklendi
- [x] Türkçe sayı sözcükleri: "on altı", "yirmi bir" gibi saat ifadeleri eklendi
- [x] addContact void → string: yeni cari ID'si doğru döndürülüyor
- [x] Edge Function auth: apikey + user JWT header'ları + --no-verify-jwt
- [x] user_id eksikti: insert'lere user_id eklendi

---

## Yapılacaklar (Roadmap)

### Öncelik 0 — Yayın (Mevcut Faz)

**Ürün kimliği (kesinleşti)**
- [x] App adı: **Voicely AI** (Apple Name 10 char, Google Title 30 char — `docs/store-listing.md`)
- [x] Ülke stratejisi: **Türkiye-first** (Faz 1) → Dünya (Faz 2, EN localization ile)
- [x] Logo/wordmark teslim alındı (`assets/brand/icon-source-wide.png`)
- [x] Production app icon üretildi (`assets/icon.png` 1024x1024 RGB, no alpha, full-bleed indigo gradient — App Store ready)
- [x] Icon pipeline script'i (`scripts/process-icon.py` — source'tan regenerate için)
- [x] GitHub Pages canlı: https://blaixs-max.github.io/VoiceRemind/ (privacy + support + landing)

**iOS — App Store yolculuğu** ($99/yıl Apple Developer)
- [ ] Apple Developer Program enrollment (Individual, bekleme ~1 gün)
- [x] app.json iOS optimizasyonu (export compliance, build number)
- [x] Privacy Policy + Support page (docs/privacy.md, docs/support.md)
- [x] GitHub Pages setup (docs/_config.yml, Jekyll)
- [ ] `eas credentials` ile Apple ID bağlama
- [ ] App Store Connect uygulama kaydı (name + bundleId + SKU)
- [ ] İlk iOS build: `eas build --platform ios --profile preview`
- [ ] TestFlight upload: `eas submit --platform ios --latest`
- [ ] Screenshots: 6.7" iPhone + iPad 12.9"
- [ ] App Store Review submit (+ demo hesap bilgisi reviewer için)
- [ ] Production release

**Android — Google Play Store yolculuğu** ($25 tek seferlik Google Play Dev)
- [ ] Google Play Console hesap açılışı
- [x] app.json Android optimizasyonu (POST_NOTIFICATIONS izni)
- [x] eas.json submit profile (track: internal, releaseStatus: draft)
- [x] Data Safety referans dokümanı (docs/data-safety.md)
- [x] Store listing copy TR + EN (docs/store-listing.md)
- [ ] Play Console'da app oluştur
- [ ] Service account JSON key üret + EAS'e bağla
- [ ] Production build (AAB): `eas build --platform android --profile production`
- [ ] Internal track upload: `eas submit --platform android --latest`
- [ ] Closed Testing (20 kullanıcı × 14 gün — zorunlu)
- [ ] Production release

**Ortak dosyalar (tek kaynak, iki store)**
- [x] Privacy Policy (KVKK + Apple + Play uyumlu): `docs/privacy.md`
- [x] Support/SSS: `docs/support.md`
- [x] Data Safety cevapları: `docs/data-safety.md`
- [x] Store listing copy: `docs/store-listing.md`
- [ ] Screenshots setleri (iPhone 6.7, iPad 12.9, Android phone, Android tablet)
- [x] App icon 1024x1024 production — `assets/icon.png` (RGB, no alpha, full-bleed)
- [x] Feature graphic 1024x500 — `assets/brand/feature-graphic.png` (Play Store)
- [x] App adı: **Voicely AI**
- [ ] **Available territories (Faz 1)**: Apple Turkey only, Google Play Turkey only
- [ ] **Primary Language (Faz 1)**: Turkish (hem App Store hem Play)

**Runbook'lar (onay geldiğinde step-by-step)**
- [x] Apple: `docs/apple-runbook.md` — enrollment onayından TestFlight'a 7 faz
- [x] Play: `docs/play-runbook.md` — hesap onayından production'a 11 faz + Closed Testing planı

**Asset pipeline script'leri (`scripts/`)**
- [x] `process-icon.py` — source wide PNG → 1024x1024 App Store icon
- [x] `build-feature-graphic.py` — icon + wordmark → Play Store 1024x500 banner

**Zaman tahmini**
- iOS (Individual): ~1 hafta (Apple Developer onay 1 gün + hazırlık 2 gün + Review 2-3 gün)
- Android: ~3 hafta (Closed Testing 14 gün zorunlu + hazırlık + Review 1-2 gün)

### Öncelik 0.5 — Monetizasyon v1.1 (Faz 2, Launch+4-6 hafta)

**Karar kaydı:** `docs/monetization-plan.md` — 2026-04-22 onaylandı
- Model: **Freemium + Subscription** (paid-only değil, lifetime IAP değil)
- Free tier: 10 hatırlatıcı/gün + 20 cari
- Pro: **₺59.99/ay** veya **₺399.99/yıl** + 7 gün ücretsiz trial
- Tech: **RevenueCat** (`react-native-purchases`) — cross-platform entitlement yönetimi

**Store ön-koşulları (v1.1 öncesi halledilmeli)**
- [ ] Apple: Paid Apps Agreement imzala + banking/tax bilgileri (2-7 gün onay)
- [ ] Google: Payments profile + banking + tax onayı (1-3 gün)
- [ ] RevenueCat hesap + App Store Connect API Key + Play Service Account bağla

**Kod tarafı (yeni dosyalar)**
- [ ] `src/utils/revenuecat.ts` — SDK init, offerings fetch
- [ ] `src/utils/entitlements.ts` — `isPro()`, `canCreateReminder()` gates
- [ ] `src/stores/subscriptionStore.ts` — Zustand entitlement state
- [ ] `src/screens/PaywallScreen.tsx` — Custom paywall UI (Turkish-first)
- [ ] `src/components/UpgradeBadge.tsx` + `RateLimitModal.tsx`
- [ ] Supabase schema: `users.is_pro`, `users.subscription_expires_at`, `users.revenuecat_user_id`
- [ ] Edge Function: daily reminder counter + 402 Payment Required gate

**Store products (iki store'da aynı ID)**
- [ ] `voicely_ai_pro_monthly` — ₺59.99/ay, 7-day trial
- [ ] `voicely_ai_pro_yearly` — ₺399.99/yıl, 7-day trial

> **Tier key**: 🟢 = Free tier, 🔒 = Pro-only (v1.1'de paywall arkasında), ⚪ = tier-neutral (her iki tier'a dahil)

### Öncelik 1 — Temel İyileştirmeler
- [ ] 🟢 **Hatırlatıcı düzenleme ekranı** — mevcut hatırlatıcıyı tap ile aç, başlık/tarih/cari düzenle
- [ ] 🟢 **Swipe aksiyonlar** — RemindersScreen'de sağa swipe = tamamla, sola swipe = sil
- [ ] 🔒 **Tekrarlayan hatırlatıcılar** — günlük/haftalık/aylık tekrar seçeneği (Pro-only)
- [ ] 🔒 **remindBefore seçeneği** — 5dk/15dk/30dk/1saat önce bildirim (Pro-only)
- [ ] 🟢 **Kayıt çok kısa uyarısı** — stopRecording null dönerse kullanıcıya mesaj göster

### Öncelik 2 — Cari Yönetimi
- [ ] 🟢 **Cari düzenleme** — mevcut cariyi ContactDetailScreen'den düzenle
- [ ] 🟢 **Cari bazlı hatırlatıcı listesi** — ContactDetail içinde o cariye ait hatırlatıcılar
- [ ] 🔒 **Cari import** — telefon rehberinden cari ekleme (Pro-only, toplu ekleme)
- [ ] 🟢 **Cari arama iyileştirmesi** — fuzzy search + son kullanılan cariler

### Öncelik 3 — Kullanıcı Deneyimi
- [ ] ⚪ **Onboarding ekranı** — ilk açılışta 3 slide tanıtım (paywall dahil son slide)
- [ ] 🟢 **Haptic feedback** — mikrofon basma/bırakma, tamamlama, silme
- [ ] 🟢 **Ses dalgası animasyonu** — kayıt sırasında canlı ses seviyesi görseli
- [ ] 🟢 **Dark mode** — otomatik (sistem) + manuel toggle
- [ ] 🟢 **Dil seçeneği** — Türkçe/İngilizce (Faz 2 dünya açılımında)
- [ ] 🟢 **Accessibility labels** — interaktif elementlere erişilebilirlik ekleme
- [ ] 🟢 **Loading skeleton** — store hydrate olurken placeholder gösterimi
- [ ] 🟢 **Pull-to-refresh** — listelerde çekip yenileme

### Öncelik 4 — Veri ve Senkronizasyon
- [ ] 🟢 **Google sign-in** — Supabase Auth'a Google OAuth ekleme
- [ ] 🔒 **Export/import** — verileri JSON/CSV olarak dışarı aktarma (Pro-only)
- [ ] 🟢 **Silinen hatırlatıcılar** — yumuşak silme (soft delete) + geri alma

### Öncelik 5 — Gelişmiş Özellikler
- [ ] 🔒 **Takvim entegrasyonu** — hatırlatıcıları iOS Calendar'a yazma (Pro-only)
- [ ] 🔒 **Widget** — iOS widget ile bugünün hatırlatıcıları (Pro-only)
- [ ] ⚪ **Siri Shortcuts** — "Voicely'e hatırlatıcı ekle" ses komutu (sınırlı Free, unlimited Pro)
- [ ] 🔒 **Gelişmiş istatistik ekranı** — aylık/yıllık trendler (Pro-only)
- [ ] 🔒 **AI özet** — haftalık aktivite özeti GPT ile (Pro-only — GPT maliyeti)

### Öncelik 6 — Yayın Hazırlığı
- [ ] **App icon + splash screen** — profesyonel branding (indigo tema)
- [ ] **App Store hazırlığı** — screenshots, açıklama, metadata
- [ ] **TestFlight** — beta test dağıtımı
- [ ] **App Store yayın** — review süreci
- [ ] **Play Store yayın** — Android mağaza yayını (APK zaten hazır)

## Bilinen Kısıtlamalar

- turkishDateParser.ts iki yerde var (src + supabase) — değişiklik yapınca ikisi de güncellenmeli
- ContactForm'da `(form as any)[field.key]` type-safety eksik
- useParseAudio'da `filterByTranscript` import edilip kullanılmıyor (getSummaries kullanılıyor)
- Expo Go ile çalıştırma hala dev server gerektiriyor (iPhone için)
- Free tier Supabase: 500MB DB, 1GB storage, 50K auth users

## Çözülmesi Gereken Sorunlar

- [~] **RemindersScreen — "Bugün" ve "Önemli" filtre segmentleri** (commit `c7016f9` ile yeniden tasarlandı)
  - İlk deneme (`d43fdaa`): horizontal ScrollView + pill segment tasarımı → kullanıcı onaylamadı
  - İkinci deneme (`c7016f9`): iOS segment-control tarzı `flex: 1` eşit paylaşım + fontSize.xs + adjustsFontSizeToFit
  - APK test sonuçları beklemede — kullanıcının geri dönüşüne göre değerlendirilecek
  - Eğer hâlâ sığmazsa label'lar kısaltılabilir (`Tamamlandı` → `Bitti`)
