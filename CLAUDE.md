# Voicely AI — Sesli Hatirlatici + Mini CRM

> **Marka**: Voicely AI (kullaniciya gorunen isim) • **Repo/slug**: VoiceRemind (git + EAS icin degismedi) • **Bundle**: com.blaixs.VoiceRemind
> **Yayın stratejisi**: Türkiye-first (Faz 1) → Dünya açılımı (Faz 2, sonraki versiyonla)

## 🎯 Şu Anki Durum (Session Handoff — 2026-08-27, **v1.0.2 sprint — fetch resilience fix**)

**Son commit:** (bu commit ile güncellenecek) — `fix: resilient fetch + self-healing keep-alive cron (v1.0.2)`

**iOS App Store:** v1.0.1 LIVE (Nisan sonundan beri, ~4 ay yayında).
**Google Play:** v1.0 Closed Testing'de takıldı — tester listesi 1/20 doldu, 14 gün sayacı başlamadı. Bekliyor (production launch için 19 tester daha lazım — kullanıcı toplayacak).

### 🚨 INCIDENT (2026-08-27): Silent fetch failure — kullanıcı "veri kayboldu" sandı

**Belirti:** iOS production'da kullanıcı (`emrahatabek@hotmail.com`) Hatırlatıcılar tab'ını açtı, boş liste gördü. Bugün eklediği reminder + eski 29 kayıt hepsi "yok" görünüyordu. Panic → destek.

**Debug süreci:**
1. Supabase DB kontrolü → Healthy, pause'da değil (Haziran'daki incident tekrarı sanılmıştı)
2. `reminders` tablosunda 118 kayıt, `emrahatabek@hotmail.com` altında 30 satır (bugünkü dahil, `created_at: 2026-08-27 14:09:30`)
3. **Data hep DB'de sağlamdı** — sorun client tarafında sessiz fetch fail
4. Kullanıcı tekrar açınca liste kendiliğinden geldi → transient session/network glitch

**Kök neden zinciri:**
1. `reminderStore.fetchReminders` catch bloğu `console.error` + silent (`reminderStore.ts:145-148`)
2. Fetch fail olunca state boş kalıyordu (`reminders: []` init) → kullanıcı boş liste gördü
3. UI'da hiçbir hata göstergesi yoktu → "silinmiş" izlenimi
4. **Ayrıca:** Supabase keep-alive cron 2026-08-04 sonrası çalışmıyordu — GitHub Actions'ın **60 gün push yoksa scheduled workflow disable** politikası devreye girmişti (son commit 2026-06-01, 87 gün geçmişti)

### ✅ v1.0.2 sprint çözümleri (bu oturum)

**Katman 1 — UI: bug görünmez olmasın**
- `reminderStore.fetchReminders` yeniden yazıldı: 1 kez session refresh + retry, fail'de eski state korunuyor, `fetchError` set ediliyor
- `contactStore.fetchContacts` aynı desen (dual-fail durumunda cari listesi de kaybolmasın)
- `RemindersScreen` üstünde **turuncu hata bandı** — `fetchError` varsa görünüyor, tap ile retry
- **Pull-to-refresh** eklendi (RefreshControl) — kullanıcı manuel yenileyebilsin
- Empty state'te de RefreshControl aktif — boş görünüm de yenilenebilir

**Katman 2 — Auth: session robust olsun**
- `authStore.initialize` yeniden yazıldı: cache'lenmiş session'ı `getUser()` ile **server-side validate** ediyor
- Invalid ise `refreshSession()` deneniyor, o da başarısızsa session sıfırlanıyor → login ekranına düşer
- Sessiz cache-invalid durumu artık **imkansız** — kullanıcı ya login'de ya geçerli session'la

**Katman 3-A — Cron self-healing (INFRA)**
- `supabase-keep-alive.yml` workflow'una self-commit step eklendi
- Her run `.github/keep-alive-log.txt`'ye timestamp yazıp commit'liyor (github-actions[bot] adına)
- Bu **repo aktivitesi** sayılıyor → 60 gün inaktivite disable politikasına takılmıyor
- `permissions: contents: write` eklendi, `actions/checkout@v4` step'i eklendi

**Katman 3-B — External uptime monitor (kullanıcı yapacak)**
- Bkz. "⏭ Kullanıcıya sonraki adım" bölümü — UptimeRobot free tier setup rehberi

### ⏭ Kullanıcıya sonraki adım (v1.0.2 release)

1. **UptimeRobot kurulumu** (belt + suspenders — GitHub cron ölürse yedek):
   - https://uptimerobot.com → free hesap aç
   - **Add New Monitor** → HTTP(s)
   - URL: `https://dtepkruumsxlflyzfeut.supabase.co/auth/v1/health`
   - Header: `apikey: sb_publishable_weQnIg1g5Ru1RN0Dl__nwA_hOw4zkmS`
   - Interval: **5 dakikada bir** (free tier izin veriyor)
   - Alert contact: `blaixs@gmail.com`
2. **iOS TestFlight build:** `eas build --platform ios --profile production`
3. **Submit:** `eas submit --platform ios --latest`
4. Kişisel iPhone smoke test: silent fetch fail simüle et (airplane mode aç/kapat), banner + retry beklendiği gibi çalışıyor mu?
5. App Store Connect → Description update (gerekmez, sadece build changelog)
6. **Submit for Review** → onay 24-72h
7. Onay sonrası Auto-release → kullanıcılara auto-update ~1-3 gün

---

## 🗄 Eski handoff (2026-06-01 akşam — Play Console Closed Testing submission)

**Son commit (o zaman):** `ee49195` — `docs: handoff sync — Android v1.0 submitted to Play Console Internal Testing`

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

### 🚨 INCIDENT (2026-06-01): iOS Production Network Failure

**Belirti:** Kullanıcı iOS production app'i açtı, "Network Request Failed" hatası.

**Kök neden:** Supabase Free tier projesi 1 hafta inaktivite sonrası **auto-pause** olmuş. DNS bile resolve etmiyordu (`Non-existent domain`).

**Çözüm (manuel + otomatik):**
1. **Anında fix:** Kullanıcı Supabase Dashboard'dan projeyi restore etti → iOS app tekrar bağlandı
2. **Önleyici tedbir:** GitHub Actions cron workflow eklendi (commit `ac32c2d`)
   - Dosya: `.github/workflows/supabase-keep-alive.yml`
   - Schedule: `'0 12 * * 2,5'` (Salı + Cuma 12:00 UTC)
   - Pings: `/auth/v1/health` + `/rest/v1/reminders?limit=1` + Edge Functions OPTIONS

### 🔑 Önemli State Bilgileri
- **EAS Android upload-key SHA-256:** `8E:87:57:A1:01:92:BC:87:52:1D:C4:AC:0D:10:2C:07:96:77:FD:58:3E:A0:F3:C7:D5:2F:C5:BF:10:B5:79:12`
- **EAS Android versionCode:** 4 (Internal Testing'teki current), 5 sonraki build
- **Google Cloud project:** `eas-submit-voicely` (numeric ID `435290266485`)
- **Service account:** `eas-submit@eas-submit-voicely.iam.gserviceaccount.com`
- **Play Console developer ID:** `5418024835905394928`
- **Play Console app ID (yeni):** `4972471939058285799` (Voicely AI — Sesli Hatırlatıcı)
- **Package verification token:** `DIOKKK6FM5PKGAAAAAAAAAAAAA`
- **Apple ASC App ID:** `6764582214`
- **Apple Team ID:** `XRUJLSF5J9` (Fevzi Emrah Atabek, Individual)
- **Apple Distribution Cert exp:** 2027-04-29
- **Apple session cookie konumu:** `C:\Users\hasan\.app-store\auth\blaixs@gmail.com\cookie` (~30 gün geçerli)
- **iOS buildNumber kaynağı:** `appVersionSource: remote` (eas.json) → server-side autoIncrement
- **Edge Function deploy yedek yolu:** Supabase CLI 403 verdiğinde Dashboard üzerinden manuel deploy edilebilir

### 🔒 Senkronizasyon Kuralı (2026-05-04 belirlendi)
**Build/submit/deploy öncesi GitHub remote ile lokal proje %100 senkronize olmalı.**
- `git status` → "working tree clean" + "Your branch is up to date"
- `git log -1` lokal hash = `git ls-remote origin main` remote hash
- Push edilmemiş commit varsa önce push; remote'ta yeni varsa önce pull; divergent ise sor.

### 🤖 CI/CD Workflows (.github/workflows/)
- **`supabase-keep-alive.yml`** — Supabase Free tier auto-pause önleyici cron (Salı+Cuma 12:00 UTC). Manuel trigger: `gh workflow run supabase-keep-alive.yml`. Eklenen tarih: 2026-06-01 (incident sonrası önleyici tedbir). **2026-08-27 update:** Self-healing commit step eklendi — GitHub 60-gün inaktivite disable politikasını devre dışı bıraktı.

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
| Veritabani | Supabase PostgreSQL (RLS korumaı) |
| Auth | Supabase Auth (email/password) |
| STT | OpenAI Whisper API |
| NLP | GPT-4.1-mini (function calling) |
| Tasarim | Custom design system (dark navy + purple→orange sunset gradient) |
| Build | EAS Build (Android APK hazır, iOS TestFlight bekliyor) |

## Supabase Bilgileri

- **Project ref:** dtepkruumsxlflyzfeut
- **Dashboard:** https://supabase.com/dashboard/project/dtepkruumsxlflyzfeut
- **DB tabloları:** contacts, reminders (RLS aktif, user_id bazlı)
- **Auth:** Email/password, Confirm email KAPALI
- **Edge Function:** parse-reminder (--no-verify-jwt), delete-account (v1.0.1'de eklendi)

## EAS Build Bilgileri

- **Expo hesabı:** @blaixs
- **Project ID:** 7187767c-54bc-4f2f-bc53-68e624c1f1c8
- **Android package:** com.blaixs.VoiceRemind
- **iOS bundle:** com.blaixs.VoiceRemind

## Bilinen Kısıtlamalar

- turkishDateParser.ts iki yerde var (src + supabase) — değişiklik yapınca ikisi de güncellenmeli
- ContactForm'da `(form as any)[field.key]` type-safety eksik
- Expo Go ile çalıştırma hala dev server gerektiriyor (iPhone için)
- Free tier Supabase: 500MB DB, 1GB storage, 50K auth users
- **EAS Build Free quota**: Ayda 30 Android + 15 iOS build. Reset tarihi ayın 1'i.
