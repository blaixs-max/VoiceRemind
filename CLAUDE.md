# Voicely AI — Sesli Hatirlatici + Mini CRM

> **Marka**: Voicely AI (kullaniciya gorunen isim) • **Repo/slug**: VoiceRemind (git + EAS icin degismedi) • **Bundle**: com.blaixs.VoiceRemind
> **Yayın stratejisi**: Türkiye-first (Faz 1) → Dünya açılımı (Faz 2, sonraki versiyonla)

## 🎯 Şu Anki Durum (Session Handoff — 2026-06-01 akşam, **iOS v1.0.1 LIVE on App Store + Android v1.0 SUBMITTED to Play Console Closed Testing — IN GOOGLE REVIEW**)

**Son commit:** `ee49195` — `docs: handoff sync — Android v1.0 submitted to Play Console Internal Testing` (origin/main ile senkron).

> Bu handoff bölümü kullanıcı tarafından 2026-06-01 oturumunda Play Console Closed Testing review submission'a kadarki ilerlemeyi yansıtacak şekilde güncellendi.

### ✅ iOS App Store v1.0.1 — YAYINDA
Apple v1.0.1 onayladı, App Store'da canlı. Description uzun versiyon güncellendi, iPad screenshots gerçek versiyonlarla değiştirildi (kullanıcı manuel hallettiği için v1.0.2 sprint'i hafifledi).

### 🤖 Android Play Console v1.0 — CLOSED TESTING'E SUBMIT EDİLDİ, GOOGLE REVIEW BAŞLADI (2026-06-01)

**Bu oturumda tamamlanan akış (özet, sırayla):**

#### 1. Build + Doğrulama Aşaması (commit `2c1b0da`)
1. **EAS CLI global kuruldu** (`npm install -g eas-cli`, v18.10.0)
2. **Production AAB build** çekildi (commit `30155ef` ile) → https://expo.dev/artifacts/eas/tmbyQJoKYVRPT86STzqfVv.aab (versionCode 4)
3. **Google Cloud project `eas-submit-voicely`** oluşturuldu (numeric ID `435290266485`)
4. **Service account** `eas-submit@eas-submit-voicely.iam.gserviceaccount.com` + JSON key → `secrets/google-play-service-account.json`
5. **Google'ın yeni Android Developer Verification (2025 policy)** akışı için Expo config plugin yazıldı: `plugins/withAdiRegistration.js`
   - Token `DIOKKK6FM5PKGAAAAAAAAAAAAA` `assets/adi-registration.properties`'e gömüldü
   - Verification APK build edildi → Play Console'a upload → **paket sahipliği "Kayıtlı"** ✅
6. **Voicely AI app'i Play Console'da yeniden oluşturuldu** (yeni internal app ID `4972471939058285799` — eski kayıt yeni policy ile silinmişti)
7. **Service account "Kullanıcılar ve izinler" üzerinden invite edildi** (yeni redesign: "API access" sayfası kaldırılmış, Users tab'a entegre)
8. **Google Play Android Developer API** Cloud Console'da etkinleştirildi (PERMISSION_DENIED hatası sonrası)
9. **`eas submit --platform android --latest`** ✅ → AAB Internal Testing track'a yüklendi

#### 2. Play Console Form Doldurma Aşaması (2026-06-01 oturumu)
**Uygulama içeriği (11 madde, hepsi ✅):**
- Gizlilik politikası URL: `https://blaixs-max.github.io/VoiceRemind/privacy/`
- App access: Login required + reviewer creds (`blaixs+reviewer@gmail.com` / `Reviewer2026!`) + bilingual instructions (kısa <500 char versiyon)
- Reklamlar: Hayır
- İçerik derecelendirmesi (IARC): Tüm sorulara Hayır → Everyone/3+ rating
- Hedef kitle: 13-15, 16-17, 18+; çocuklara hitap etmez
- Haber/COVID/Government/Financial/Health: hepsi Hayır
- Veri güvenliği formu (5 adım):
  - Toplama: Evet (Email + Voice + User-generated content)
  - Email: Toplandı, Paylaşılmadı, Uzun süreli, Kullanıcı seçer (misafir mod), Amaç: App functionality + Account management
  - Voice: Toplandı + **Paylaşıldı** (OpenAI Whisper API), Kısa süreli (ephemeral), Kullanıcı seçer, Amaç: App functionality
  - User-generated content (reminders+contacts): Toplandı, Paylaşılmadı, Uzun süreli, Kullanıcı seçer, Amaç: App functionality
  - Hesap silme URL: support sayfası
  - Reklam Kimliği (AAID): Toplanmıyor

**Mağaza listesi (Ana mağaza girişi):**
- App name: `Voicely AI — Sesli Hatırlatıcı` (30/30)
- Kısa açıklama: 79 char
- Tam açıklama: ~2200 char emoji'li (`docs/store-listing.md` v1.0.1 PLANNED VERSION)
- **App icon**: 512×512 PowerShell ile resize'lı (`assets/brand/icon-512.png` — PowerShell System.Drawing ile 1024'ten downscale, 217 KB)
- Feature graphic: `assets/brand/feature-graphic.png` (1024×500)
- Phone screenshots: `iphone-screenshots/` klasöründen 8 JPEG
- Email: blaixs@gmail.com, Website: blaixs-max.github.io/VoiceRemind/

**Mağaza ayarları:** Kategori = Verimlilik (Productivity)

#### 3. Test Track Setup
- **Dahili test (Internal Testing) yayında**: Sürüm 4 (1.0.0), versionCode 4, status: "Etkin" + "Dahili test kullanıcıları tarafından kullanılabilir"
- **Kapalı test - Alpha kanalı** konfigüre edildi:
  - Sürüm: 4 (1.0.0) — Sürümü yükselt ile Internal'dan promote
  - Ülke/bölge: **Türkiye** ✅
  - Test kullanıcıları: `voicely-ai-closed-testers` email listesi atandı (şu an 1 kullanıcı: blaixs@gmail.com, 20'ye çıkartılacak)

#### 4. ✅ FINAL SUBMIT: 12 değişiklik Google review'a gönderildi (2026-06-01)
Yayın özeti sayfasından "12 değişikliği yayınla" butonuna basıldı. Liste:
- Kapalı test - Alpha: sürüm 4, Türkiye, voicely-ai-closed-testers
- Mağaza girişleri: Türkçe (tr-TR) dil eklendi
- Uygulama içeriği: IARC, Hedef kitle, Gizlilik URL, Ads, Data Safety
- Mağaza ayarları: Verimlilik kategorisi
- **Yönetilen yayınlama AKTIF** (Google approve'dan sonra manuel "yayına çık" gerekecek — basit ayarla)

### 📦 Yeni Eklenen Dosyalar (commit `2c1b0da` + sonrası)
- `plugins/withAdiRegistration.js` — Google package verification için config plugin
- `app.json` — plugin referansı eklendi
- `assets/brand/icon-512.png` — Play Console 512×512 icon (PowerShell resize)

### ⏳ Şu an bekleniyor
- **Google Closed Testing review** — 1-3 gün (ilk submission'da 7 gün olabilir)
- Onay mail'i: `noreply@google.com` → `blaixs@gmail.com`
- Onay sonrası test linki aktif olur, testerlara gönderilir, 14 gün sayacı başlar

### 🚨 INCIDENT (2026-06-01): iOS Production Network Failure

**Belirti:** Kullanıcı iOS production app'i açtı, "Network Request Failed" hatası.

**Kök neden:** Supabase Free tier projesi 1 hafta inaktivite sonrası **auto-pause** olmuş. DNS bile resolve etmiyordu (`Non-existent domain`).

**Çözüm (manuel + otomatik):**
1. **Anında fix:** Kullanıcı Supabase Dashboard'dan projeyi restore etti → iOS app tekrar bağlandı
2. **Önleyici tedbir:** GitHub Actions cron workflow eklendi (commit `ac32c2d`)
   - Dosya: `.github/workflows/supabase-keep-alive.yml`
   - Schedule: `'0 12 * * 2,5'` (Salı + Cuma 12:00 UTC)
   - Pings: `/auth/v1/health` + `/rest/v1/reminders?limit=1` + Edge Functions OPTIONS
   - Manuel trigger: `gh workflow run supabase-keep-alive.yml`
   - Test edildi: 3 başarılı run, hepsi yeşil ✅

**İlk denenen endpoint hatası:** `/rest/v1/` root endpoint **secret API key** istiyor (401 "Secret API key required"). Düzeltme: RLS-protected table query (`/rest/v1/reminders?limit=1`) + `/auth/v1/health` ile değiştirildi, ikisi de publishable anon key ile 200 dönüyor.

**Uzun vadeli öneri:** Production'a geçince Supabase **Pro plan ($25/ay)** önerilir — auto-pause yok, 8GB DB, daily backups, 100GB bandwidth. Free tier şimdilik yeterli ama Play Store launch sonrası kullanıcı sayısı artarsa upgrade.

### 📦 v1.0.1 Code Changes (commit `2376d74`)

12 dosya, +1368 / -42 satır:
- **Yeni:** `supabase/functions/delete-account/index.ts`, `src/screens/SettingsScreen.tsx`, `src/components/ManualReminderForm.tsx`
- **Modified:** `App.tsx` (4. tab + guest mode bypass), `src/stores/authStore.ts` (deleteAccount + isGuest), `src/stores/reminderStore.ts` (dual-mode), `src/stores/contactStore.ts` (guest no-op), `src/components/CustomTabBar.tsx` (mic guest gate + Ayarlar icon), `src/screens/AuthScreen.tsx` (Misafir butonu), `src/screens/ContactsScreen.tsx` (guest lock screen), `src/screens/RemindersScreen.tsx` (FAB + form integration), `docs/privacy.md`

### ✅ Tamamlanan Milestone'lar (v1.0 öncesi)
- Faz 1-10 + 10.1 tamamlandı (UI redesign + parser + Edge Function redeploy)
- **Google Play Console hesabı:** onaylandı (2026-04-23)
- **Google Play app oluşturuldu:** `Voicely AI — Sesli Hatırlatıcı` (2026-04-26)
- **Apple Developer Program enrollment:** ONAYLANDI (2026-04-29 sabah)
- **iOS preview build (ad-hoc):** başarılı, kişisel iPhone'da smoke test PASS (2026-04-29 öğle)
- **iOS production build:** başarılı, TestFlight'ta Build 3 (latest) — Build 2 ilk upload, sonradan Build 3 ile değiştirildi
- **App Store Connect app oluşturuldu:** Voicely AI, ASC App ID `6764582214`, Bundle `com.blaixs.VoiceRemind`, Primary Language Turkish, Available Territories Turkey only, Categories: Productivity (primary) + Business (secondary)
- **App Privacy survey published:** 4 data type declared (Email Address, Audio Data, Other User Content, User ID — hepsi Linked=Yes, Tracking=No, Purpose=App Functionality)
- **Privacy Policy URL set:** https://blaixs-max.github.io/VoiceRemind/privacy/ (canlı, doğrulandı 2026-04-29)
- **Apple credentials EAS'ta kayıtlı:** Distribution Cert (serial `7EBCAA7598FFB62841B286D453C53B2C`, exp 2027-04-29), App Store + Ad-Hoc Provisioning Profiles, APNS Push Key, ASC API Key (`5U3M99K3LJ` — EAS otomatik oluşturdu)
- **TestFlight Internal Testing group otomatik oluştu:** "Team (Expo)", blaixs@gmail.com tester olarak eklendi
- Edge Function (parse-reminder) redeploy edildi
- Eski preview APK (Faz 9 tarihli) `secrets/voicely-latest.apk`'a indirildi (paket sahipliği doğrulaması için)

### 🚀 iOS App Store — SUBMITTED FOR REVIEW (2026-04-29 gece)

Apple review kuyruğunda. Beklenen: 24-72h içinde "In Review" → onay/red.

**Submitted state (canon):**
- **Build:** Build 3 (1.0.0) — TestFlight'tan seçildi
- **Screenshots iPhone 6.5" Display:** 6 adet (1242×2688) — kullanıcı 6.7"→6.5" dönüştürdü, App Store kabul etti
- **Screenshots iPad Pro 13" Display:** 8 adet (2064×2752) — `scripts/generate_ipad_screenshots.py` ile generate edildi (iPhone PNG'ler dark navy `#0F172A` canvas üzerine ortalandı, supportsTablet:true zorunluluğu için fallback)
- **Description:** **KISA versiyon** submitted (uzun versiyon "invalid characters" hatası verdi — bkz. Bilinen Sorunlar)
- **Promotional Text:** 159 char Türkçe
- **Keywords:** `hatırlatıcı,sesli,AI,yapay zeka,hatırla,görev,CRM,müşteri,takip,ajanda,not,bildirim`
- **Support URL:** https://blaixs-max.github.io/VoiceRemind/support/
- **Marketing URL:** https://blaixs-max.github.io/VoiceRemind/
- **Copyright:** `2026 [Hasan ...]`
- **Age Rating:** 4+ (7-step questionnaire, hepsi None/No)
- **Routing App Coverage:** boş (productivity app, navigation kategorisi değil)
- **Game Center:** Off
- **App Review Information:**
  - Sign-in: required
  - Demo creds: `blaixs+reviewer@gmail.com` / `Reviewer2026!` (kullanıcı kendi Voicely AI uygulamasından register flow ile oluşturdu, 3 hatırlatıcı + 2 cari pre-populated)
  - Notes: bilingual (TR/EN) reviewer rehberi — Türkçe dictation kurulum talimatı + populated demo hesap vurgusu + 30 dk minimum test akışı
  - Contact: blaixs@gmail.com
- **Export Compliance:** No (HTTPS only, no custom crypto)
- **Content Rights:** No
- **IDFA:** No
- **Version Release:** [manuel/otomatik — kullanıcı seçimi]

**Pre-submit Apple validator engelleri (çözüldü):**
1. ✅ "iPad 13" screenshot zorunlu" — Python script ile çözüldü
2. ✅ "Age Rating questionnaire eksik" — 7-step doldurulup Save edildi
3. ✅ "App Privacy not published" — survey doldurulup Published

**Submission timeline:**
- Build 3 TestFlight: ~2026-04-29 öğle
- App Privacy Published: 2026-04-29 akşam
- Age Rating saved: 2026-04-29 gece
- iPad screenshots generated: 2026-04-29 gece
- All metadata + Submit for Review: 2026-04-29 gece (~24:00 yaklaşık)

### ⚠️ Bilinen Sorunlar (sonraki sprint'e taşındı)

#### 1. Description "Invalid Characters" — uzun versiyon kabul edilmedi
- **Sorun:** Apple validator uzun emoji'li/em-dash'li/akıllı tırnaklı Description'a "This field contains one or more invalid characters" döndü
- **Workaround:** Notepad'den geçirilmiş, emoji'siz, ASCII bullet (`-`), düz tırnak versiyonu submit edildi
- **Kök sebep:** Browser clipboard'da kalmış zero-width characters / smart quotes / emoji placeholder bytes
- **v1.0.2 fix:** Notepad UTF-8 save → reload workflow ile uzun versiyonu yeniden hazırla, App Store'da Description güncelle (yeni binary gerektirmez)

#### 2. ~~Manuel hatırlatıcı ekleme YOK~~ — v1.0.1'de **ÇÖZÜLDÜ** ✅
- `+` FAB + `ManualReminderForm` modal eklendi. Apple 5.1.1(v) login wall fix'inin parçası olarak yapıldı.

#### 3. iPad screenshot'lar gerçek iPad UI'ı göstermiyor
- **Sorun:** Generate edilen screenshot'lar iPhone PNG'lerin iPad canvas'a center-fit edilmiş hali. Apple v1.0'da kabul etti ama gerçekçi değil.
- **v1.0.2 fix:** macOS makinede iPad simulator'da gerçek UI'ı çek (eğer iPad layout'u gerçekten optimize edildiyse). Alternatif: `app.json`'da `supportsTablet: false` yap → iPad zorunluluğu kalkar (hedef kullanıcı zaten phone-first).

#### 4. Sentry / crash reporting yok
- **Sorun:** Production'da crash'ler görünmez. İlk kullanıcılar geldiğinde bug'lar kaybolur.
- **v1.0.2 fix (1.0.1 sprint'inde zaman yetmedi):** `@sentry/react-native` entegrasyonu — `app.json` plugin + `App.tsx` Sentry.init() + `src/utils/errorReporting.ts` helper. DSN kullanıcı tarafından sentry.io'da yeni project oluşturulup alınacak. Auth flow'a `setUserContext` eklenecek (login/logout). Privacy: `beforeSend` callback ile audio file path'lerini filtrele.

#### 5. Misafir → login geçişinde local reminder'lar migrate edilmiyor
- **Sorun:** Misafir modda AsyncStorage'da oluşturulan hatırlatıcılar, kullanıcı sonra hesap açtığında Supabase'e migrate edilmiyor (UX sorunu, Apple sormaz).
- **v1.1 fix:** authStore'da `signIn`/`signUp` success'inde `reminderStore.migrateLocalToCloud()` çağrısı — AsyncStorage'daki tüm reminder'ları Supabase'e POST + AsyncStorage'ı temizle.

### 🤖 Android — Closed Testing Review'da → Sıradaki Adımlar

**ŞU ANKİ STATÜ (2026-06-01):** Kapalı test - Alpha kanalında **12 değişiklik Google review'a gönderildi**, onay bekleniyor.

**Sıradaki adımlar (kullanıcı):**
1. ⏳ **Google review onayını bekle** (1-3 gün, mail kutusunu kontrol et)
2. 🎯 **20 tester topla** (paralel iş — review tamamlanmadan önce hazır olmalı)
   - Liste: `voicely-ai-closed-testers` (Dahili test → E-posta listeleri → düzenle)
   - Şu an 1 kişi (blaixs@gmail.com), 19 kişi daha gerekli
   - Kanallar: aile/arkadaş → WhatsApp → Twitter post → Discord/Slack → Reddit
3. 📧 **Onay sonrası** test linkini testerlara gönder
4. ⏲ **14 gün kesintisiz test** (her tester en az 1 kez app'i açmalı, sayaç release date'ten)
5. 🚀 **14 gün sonunda Production'a promote** → Üretim track → Turkey only → Submit → Review 1-3 gün
6. 🎉 **Production yayın** → Play Store'da `play.google.com/store/apps/details?id=com.blaixs.VoiceRemind`

### 🗓 Tahmini Yayın Tarihleri (Updated 2026-06-01)
- **iOS App Store v1.0.1:** ✅ YAYINDA
- **Google Play v1.0:** Closed Testing review'da (2026-06-01) → onay 1-3 gün → 14 gün kapalı test → production review 1-3 gün → **Tahmini production: ~2026-06-18 ± 3 gün**
- **v1.0.2 sprint (Sentry):** Android production yayınlandıktan sonra
- **v1.1 sprint (reminder migration + monetization):** Yaz ortası

### 🔑 Önemli State Bilgileri
- **EAS Android upload-key SHA-256:** `8E:87:57:A1:01:92:BC:87:52:1D:C4:AC:0D:10:2C:07:96:77:FD:58:3E:A0:F3:C7:D5:2F:C5:BF:10:B5:79:12` (Play Console'a kayıtlı, "Kayıtlı" statüsünde)
- **EAS Android versionCode:** 4 (Internal Testing'teki current), 5 sonraki build
- **Google Cloud project:** `eas-submit-voicely` (numeric ID `435290266485`, Google Play Android Developer API ENABLED)
- **Service account:** `eas-submit@eas-submit-voicely.iam.gserviceaccount.com` (JSON: `secrets/google-play-service-account.json`, Play Console'da Voicely AI için Yönetici)
- **Play Console developer ID:** `5418024835905394928`
- **Play Console app ID (yeni):** `4972471939058285799` (Voicely AI — Sesli Hatırlatıcı)
- **Package verification token:** `DIOKKK6FM5PKGAAAAAAAAAAAAA` (commit `2c1b0da` ile `app.json` plugin args'a gömülü, asset olarak APK'lara gider)
- **Apple ASC App ID:** `6764582214`
- **Apple Team ID:** `XRUJLSF5J9` (Fevzi Emrah Atabek, Individual)
- **Apple Distribution Cert exp:** 2027-04-29 (1 yıl sonra rotate gerekli — EAS otomatik halleder)
- **Apple session cookie konumu:** `C:\Users\hasan\.app-store\auth\blaixs@gmail.com\cookie` (~30 gün geçerli, expire olursa eas build/submit yeniden 2FA ister)
- **iOS buildNumber kaynağı:** `appVersionSource: remote` (eas.json) → server-side autoIncrement, app.json'dan `buildNumber` field kaldırıldı
- **Edge Function deploy yedek yolu:** Supabase CLI 403 verdiğinde Dashboard üzerinden manuel deploy edilebilir (Functions → Deploy a new function → Via Editor). Kod kopyala-yapıştır + "Verify JWT" KAPALI bırak (--no-verify-jwt eşdeğeri).

### 🔒 Senkronizasyon Kuralı (2026-05-04 belirlendi)
**Build/submit/deploy öncesi GitHub remote ile lokal proje %100 senkronize olmalı.** Memory'de kayıtlı: `~/.claude/projects/.../memory/feedback_github_local_sync.md`. Pratik:
- `git status` → "working tree clean" + "Your branch is up to date"
- `git log -1` lokal hash = `git ls-remote origin main` remote hash
- Push edilmemiş commit varsa önce push; remote'ta yeni varsa önce pull; divergent ise sor.

### 🤖 CI/CD Workflows (.github/workflows/)
- **`supabase-keep-alive.yml`** — Supabase Free tier auto-pause önleyici cron (Salı+Cuma 12:00 UTC), `/auth/v1/health` + `/rest/v1/reminders?limit=1` + Edge Functions OPTIONS ping. Manuel trigger: `gh workflow run supabase-keep-alive.yml`. Eklenen tarih: 2026-06-01 (incident sonrası önleyici tedbir).

---

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
| Tasarim | Custom design system (dark navy + purple→orange sunset gradient) |
| Build | EAS Build (Android APK hazır, iOS TestFlight bekliyor) |

## Proje Yapisi

```
VoiceRemind/
├── App.tsx                          # Root: auth flow + tab nav + notification + data fetch
├── eas.json                         # EAS Build config (preview=APK, production=store)
├── app.json                         # Expo config + plugins + EAS project ID
├── src/
│   ├── models/types.ts              # Contact, Reminder, ParsedReminder, EdgeFunctionResponse
│   ├── navigation/types.ts          # ContactsStackParamList, RemindersStackParamList
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
│   │   ├── theme.ts                 # Design system: dark navy palette, gradients, shadow helpers
│   │   └── turkishDateParser.ts     # Deterministic Turkish date → ISO (göreli + mutlak zaman)
│   ├── screens/
│   │   ├── AuthScreen.tsx           # Login/Register — tek ekran, toggle ile geçiş
│   │   ├── DashboardScreen.tsx      # Executive dashboard (KPI kartları + bugün listesi) — mic FAB tab bar'da
│   │   ├── RemindersScreen.tsx      # Timeline + segment filtre + section groups (dark tema)
│   │   ├── ReminderEditScreen.tsx   # Mevcut hatırlatıcıyı düzenleme ekranı
│   │   ├── ContactsScreen.tsx       # Avatar renkli liste + arama + FAB
│   │   └── ContactDetailScreen.tsx  # Profil kartı + aksiyon butonları
│   └── components/
│       ├── CustomTabBar.tsx         # Rounded-top tab bar + floating center mic FAB (state lift)
│       ├── MicButton.tsx            # Gradient sunset + glow pulse (compact mode tab için)
│       ├── AppDialog.tsx            # Merkezi DialogHost (Alert.alert / ActionSheetIOS yerine)
│       ├── ConfirmationModal.tsx    # Transcript kutusu + reminder kartları + onay
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
├── scripts/
│   ├── test-parser.ts               # Türkçe parser regression smoke test (31 senaryo)
│   ├── process-icon.py              # Source wide PNG → 1024x1024 App Store icon
│   └── build-feature-graphic.py     # Icon + wordmark → Play Store 1024x500 banner
├── secrets/                         # gitignore'lu — service account JSON + tester APK
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
- `colors.bg` (dark navy) arka plan, `colors.bgSecondary` tab bar, `colors.bgCard` kart yüzeyler
- `colors.textOnDark` ve `colors.textOnDarkMuted` — dark bg üstünde metin kullanımı
- `gradients.mic` / `gradients.micRecording` — mic button purple→orange sunset
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

# Türkçe tarih parser regression smoke test (31 senaryo)
npx tsx scripts/test-parser.ts

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
- **Son iOS preview (ad-hoc):** https://expo.dev/accounts/blaixs/projects/VoiceRemind/builds/8015a2c6-7a73-4c8e-923c-eeab7df1e276
- **Son iOS production (TestFlight'ta):** Build ID `f1d01177-4ce1-4b31-9b63-a80047ec3268` (build 2)

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
- [x] **Faz 10** — Executive Dashboard redesign (2026-04-24/25)
  - Dark navy tema + premium CRM görünümü (commit `1f403f2`)
  - Custom bottom tab bar + floating center mic FAB (commit `8aec7f2`)
  - Tab label'lar bottom-aligned, mic alanıyla çakışma kaldırıldı (commit `b83355b`)
  - Mic glow fix: 120px centered + pointerEvents="none" + daha transparent (commit `798ccff`)
  - SafeAreaProvider bg: iOS yuvarlak ekran köşelerinde beyaz sızma kapatıldı
  - Mic button artık tüm tab'lardan erişilebilir (state CustomTabBar'a lift edildi)
- [x] **Faz 10.1** — Parser genişletme + Edge Function redeploy (2026-04-26, commit `6a7fcfe`)
  - Yeni desteklenen ifadeler: "X gün/hafta/ay/yıl sonra", "X gün içinde", "gelecek/önümüzdeki pazartesi", "az sonra/birazdan" (+5 dk), "öğleden önce" (10), "ikindi" (16), "akşamüstü" (17), "yarından sonra" (öbür gün)
  - Confidence iyileştirmesi: "akşam 8" / "saat 14" gibi implicit today saatlerinde artık `confident=true` (eski davranış: low badge + manuel düzeltme istiyordu)
  - Bug fix: Türkçe sayılarla ("üç", "beş", "altı") shift çalışmıyordu — `\b` ASCII-only boundary "ü/ç/ğ" tanımıyordu; suffix `\s+` ile çözüldü
  - TIME_WORDS uzun→kısa sıralı match: "öğleden sonra" "öğle"den önce match olsun
  - `scripts/test-parser.ts` — 31 senaryolu regression smoke test
  - **Edge Function redeploy edildi:** server-side parser de yeni

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
- [x] Parser: Türkçe karakterli sayı sözcükleriyle ("üç", "beş") tarih shift bug — `\b` ASCII boundary `ü/ç/ğ`'yi tanımıyordu, suffix `\s+` ile düzeltildi (commit `6a7fcfe`)
- [x] Parser: implicit today saat ifadeleri ("akşam 8") low confidence yerine `confident=true` döndürüyor — gereksiz manuel düzeltme adımı kalktı (commit `6a7fcfe`)

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
- [x] Apple Developer Program enrollment — ONAYLANDI (2026-04-29)
- [x] app.json iOS optimizasyonu (export compliance — `ITSAppUsesNonExemptEncryption: false`)
- [x] Privacy Policy + Support page (docs/privacy.md, docs/support.md)
- [x] GitHub Pages setup (docs/_config.yml, Jekyll)
- [x] EAS Apple credentials kuruldu — Distribution Cert, App Store + Ad-Hoc Provisioning Profiles, APNS Key, ASC API Key (2026-04-29)
- [x] iOS preview build (ad-hoc) → kişisel iPhone smoke test PASS (2026-04-29)
- [x] iOS production build → Build 2 başarılı (2026-04-29)
- [x] App Store Connect uygulama kaydı — ASC App ID `6764582214`, Voicely AI, com.blaixs.VoiceRemind (2026-04-29)
- [x] App Information: Categories (Productivity + Business), Privacy Policy URL, Content Rights = No, Age 4+
- [x] Pricing & Availability: Free, Turkey only
- [x] App Privacy survey: 4 data type declared + Published (2026-04-29)
- [x] TestFlight upload: `eas submit --platform ios --latest` → Submitted (2026-04-29)
- [x] Apple processing → TestFlight smoke test iPhone'da PASS (2026-04-29)
- [x] Screenshots iPhone 6.5" Display: 6 adet (1242×2688) — kullanıcı 6.7"'lik orijinalleri 6.5" boyutuna indirgedi
- [x] Screenshots iPad Pro 13" Display: 8 adet (2064×2752) — `scripts/generate_ipad_screenshots.py` ile generate (Python+Pillow, dark navy `#0F172A` canvas üstüne center-fit)
- [x] Metadata doldur: Description (kısa versiyon — uzun "invalid characters" verdi), Keywords, Promo Text, Support/Marketing URL, Copyright
- [x] App Review Information: demo hesap `blaixs+reviewer@gmail.com` / `Reviewer2026!` (kullanıcı kendi register flow'undan oluşturdu, 3 hatırlatıcı + 2 cari pre-populated), bilingual TR/EN reviewer notes
- [x] Age Rating: 7-step questionnaire → 4+ (hepsi None/No)
- [x] **Submit for Review** — gönderildi 2026-04-29 gece, Apple review beklemede
- [ ] Apple onay/red yanıtı (24-72h)
- [ ] Production release (manuel veya otomatik)

**Android — Google Play Store yolculuğu** ($25 tek seferlik Google Play Dev)
- [x] Google Play Console hesap açılışı — **onaylandı 2026-04-23**
- [x] app.json Android optimizasyonu (POST_NOTIFICATIONS izni)
- [x] eas.json submit profile (track: internal, releaseStatus: draft)
- [x] Data Safety referans dokümanı (docs/data-safety.md)
- [x] Store listing copy TR + EN (docs/store-listing.md)
- [x] Play Console'da app oluşturuldu — `Voicely AI — Sesli Hatırlatıcı` (2026-04-26)
- [~] **ŞİMDİ:** Paket sahipliği doğrulama (yeni Google "Android geliştirici doğrulaması" politikası) — mevcut EAS APK'sı (`secrets/voicely-latest.apk`) Play Console'a upload edilecek; SHA-256 fingerprint zaten eşleşiyor (`8E:87:57:A1:01:92:BC:87:52:1D:C4:AC:0D:10:2C:07:96:77:FD:58:3E:A0:F3:C7:D5:2F:C5:BF:10:B5:79:12`)
- [ ] Service account JSON üret + `secrets/google-play-service-account.json` konumuna koy
- [x] versionCode yönetimi — EAS `appVersionSource: remote` + `autoIncrement: true` otomatik halleder (manuel güncelleme yok)
- [ ] Production AAB build (Faz 10.1 dahil güncel kod): `eas build --platform android --profile production` — **EAS Free quota reset 2026-05-01'i bekliyor** (April quotası dolu)
- [ ] Internal track upload: `eas submit --platform android --latest`
- [ ] Store listing + Data Safety + Content Rating + Target Audience doldur (build gerektirmez, paralel yapılabilir)
- [ ] Closed Testing track'e promote → 20 tester davet → 14 gün sayacı başlat
- [ ] Production release → TR only → Review 1-3 gün

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
- **EAS Build Free quota**: Ayda 30 Android + 15 iOS build. Reset tarihi ayın 1'i (bir sonraki: **2026-05-01**)
- **Ngrok tunnel (Windows, tester paylaşımı için)**: `@expo/ngrok` bundled binary v2.3.41 deprecated → v3.38.0 ile swap gerekli. Bundled yol: `%APPDATA%\npm\node_modules\@expo\ngrok\node_modules\@expo\ngrok-bin-win32-x64\ngrok.exe`. Ayrıca free hesap için authtoken zorunlu (ERR_NGROK_4018) + minimum agent 3.20+ (ERR_NGROK_121). Alternatif: manuel `ngrok http 8081` başlat, PowerShell'de `$env:REACT_NATIVE_PACKAGER_HOSTNAME`, `$env:EXPO_PACKAGER_PROXY_URL`, `$env:EXPO_MANIFEST_PROXY_URL` set edip `npx expo start --lan` ile çalıştır.

## Çözülmesi Gereken Sorunlar

> Faz 10 (Executive Dashboard redesign) ile tüm UI yenilendiğinde önceki segment-filter sorunu (commit `c7016f9`) artık geçerli değil — eski RemindersScreen layout'u kaldırıldı. Bu bölüm şu an boş; yeni UI üzerinde ortaya çıkan sorunlar buraya işlenecek.
