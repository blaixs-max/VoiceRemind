---
layout: default
title: Apple Onay Runbook (internal)
permalink: /apple-runbook/
---

# Apple Developer Onayı Geldikten Sonra — Step-by-Step Runbook

Bu doküman **"Welcome to the Apple Developer Program"** email'i geldiği andan itibaren izlenecek adımları sıralar. Hedef: email'den **~2 saat içinde TestFlight'ta çalışan build**.

Toplam aktif iş süresi: ~45 dakika. Bekleme süresi (build + propagation): ~1 saat.

---

## 📋 Ön-Hazırlık Checklist (Onaydan ÖNCE)

- [x] Apple ID (enrollment sırasında kullanılan) 2FA aktif mi?
- [x] iPhone'a **Developer** app indirildi mi? (push notification onayları için)
- [x] EAS CLI kurulu mu? → `eas --version` (v13+ olmalı)
- [x] Expo hesabı login mi? → `eas whoami` → `blaixs` dönmeli
- [x] Repo main branch'inde mi? → `git status` → clean working tree

---

## 🚀 Faz 1 — Apple ID'yi EAS'e Bağla (~5 dk)

### 1.1 EAS credentials session başlat
```bash
cd "C:/Users/hasan/OneDrive/Masaüstü/Asistan/VoiceRemind"
eas credentials --platform ios
```

### 1.2 Prompts'ları sırayla yanıtla
```
? Select build profile → preview (first test build)
? What do you want to do → Set up a new distribution certificate
? Apple ID → <senin apple email>
? Password → <apple şifre>
? 2FA code → <sms/app ile gelen>
? Which team → Individual (senin adın)
```

### 1.3 Certificate + Provisioning Profile oluştur
EAS otomatik şunları üretir:
- **Distribution Certificate** (iOS Distribution)
- **Provisioning Profile** (com.blaixs.VoiceRemind için)
- **Push Notification Key** (opsiyonel — şimdi gerek yok)

### 1.4 Doğrula
```bash
eas credentials --platform ios
# "View current credentials" seç
# Listede şunları görmelisin:
#   ✓ Distribution Certificate: valid
#   ✓ Provisioning Profile: com.blaixs.VoiceRemind
```

---

## 🏗 Faz 2 — App Store Connect Uygulama Kaydı (~10 dk)

### 2.1 App Store Connect'e giriş
https://appstoreconnect.apple.com → Apple ID ile login

### 2.2 My Apps → "+" → New App

Doldurulacak alanlar:

| Alan | Değer |
|---|---|
| Platforms | iOS |
| Name | **Voicely AI** |
| Primary Language | **Turkish (Türkçe)** |
| Bundle ID | **com.blaixs.VoiceRemind** (dropdown'dan seç — EAS otomatik register etmiş olmalı) |
| SKU | **voicely-ai-ios-v1** (internal, any string) |
| User Access | Full Access |

→ **Create**

### 2.3 App Information bölümünde
Bu aşamada metadata doldurmayı erteleyebilirsin (build yüklendikten sonra da girilebilir). Ama şimdi yaparsan:

- **Subtitle**: `Sesli Hatırlatıcı + Mini CRM`
- **Category — Primary**: `Productivity`
- **Category — Secondary**: `Business`
- **Content Rights**: "Does your app contain, show, or access third-party content?" → **No**
- **Age Rating**: "Start" → Tüm sorulara "None" → Result: 4+
- **Privacy Policy URL**: `https://blaixs-max.github.io/VoiceRemind/privacy/`

### 2.4 Availability → Territories
- **UNCHECK ALL** → sadece **Turkey** seç
- Price: Free

---

## 📦 Faz 3 — İlk iOS Build (~15 dk)

> **DİKKAT — Profile seçimi:**
> - `preview` → `distribution: internal` → **ad-hoc imza** → sadece register edilmiş iPhone'lara EAS link ile install. **TestFlight kabul ETMEZ.** Sadece kişisel iPhone'da hızlı smoke test için.
> - `production` → varsayılan App Store imza → **TestFlight + App Store yayını için doğru profile.**
>
> EAS Free quota ayda 15 iOS build. İki profile birden atmak yerine doğrudan `production` yeterli — kişisel iPhone'da test için TestFlight zaten ücretsiz dağıtım sağlıyor.

### 3.1 Production build'i tetikle (TestFlight için)
```bash
cd "C:/Users/hasan/OneDrive/Masaüstü/Asistan/VoiceRemind"
eas build --platform ios --profile production
```

İlk build sırasında EAS otomatik şunları yapar:
- Apple Distribution Certificate oluşturma (yoksa)
- App Store Provisioning Profile oluşturma
- (Opsiyonel) APNS Push Key oluşturma — lokal bildirim için gerekmez ama gelecekte remote push eklenirse hazır olsun

> **Eğer kişisel iPhone'da hızlı smoke test isteniyorsa** (TestFlight onayını beklemeden), önce `--profile preview` ile ad-hoc build atılıp UDID register edilebilir. Ama TestFlight için **mutlaka** ayrıca `production` build gerekir — preview IPA'sı App Store Connect'e gönderilemez.

### 3.2 Build durumunu izle
- CLI'da canlı log akar
- Paralel: https://expo.dev/accounts/blaixs/projects/VoiceRemind/builds
- ~12-15 dakika sürer

### 3.3 Build başarılı olunca
Terminal çıktısında:
```
✔ Build finished
🔗 https://expo.dev/artifacts/eas/<build-id>.ipa
```

---

## 📲 Faz 4 — TestFlight Upload (~5 dk)

### 4.1 Submit
```bash
eas submit --platform ios --latest
```

Prompts:
```
? Apple ID → <senin email>
? Apple ID password → <cookie cached ise sormaz>
? Generate a new App Store Connect API Key? → Y
? Which app → Voicely AI (otomatik bulur)
```

> **Apple session cookie:** İlk `eas build` sırasında 2FA + şifre girdiğinde fastlane cookie'yi `~/.app-store/auth/<email>/cookie` altına kaydeder, ~30 gün geçerli. Submit anında session cache'den okur, şifre sormaz.
>
> **App Store Connect API Key:** EAS otomatik oluşturup kendi sunucusunda saklar (Key ID + .p8 private key). Sonraki tüm submit'lerde reuse eder.
>
> **App-specific password (alternatif yol):** Eğer cookie expire olmuşsa veya ilk seferse Apple "App ID password" istediğinde **normal Apple ID şifren değil** app-specific password gir: https://appleid.apple.com/account/manage → Sign-In and Security → App-Specific Passwords → **+** → "EAS Submit" → 16-karakterli şifreyi kopyala.

### 4.2 TestFlight'a propagation
- Upload **anında** tamamlanır (~2 dk)
- **Apple'ın "processing"**'i ~15-30 dk
- App Store Connect → TestFlight → iOS builds listesinde görünür

### 4.3 "Missing Compliance" uyarısını çöz
Apple her build'de bu uyarıyı gösterir (export compliance). Biz `app.json`'da `ITSAppUsesNonExemptEncryption: false` set ettik, yine de:

1. TestFlight build'inin yanındaki **"Manage"** butonuna tıkla
2. "Does your app use encryption?" → **No**
3. Save

---

## 🧪 Faz 5 — iPhone'da Test (~sabır)

### 5.1 TestFlight app'i indir
iPhone App Store → "TestFlight" ara → Apple'ın resmi app'i

### 5.2 Uygulamayı ekle
Two ways:
- **A**: App Store Connect → TestFlight → Internal Testing → "Add Internal Tester" → kendini ekle → mail geldiğinde invite link'e tıkla
- **B**: App Store Connect → TestFlight → "Public Link" oluştur → iPhone'da aç

### 5.3 Test Senaryoları
- [ ] App açılışı — splash → login ekranı
- [ ] Register — yeni hesap oluştur
- [ ] Login — varolan hesap
- [ ] Mikrofon izni — "Voicely AI Mikrofonu Kullanmak İstiyor" iste
- [ ] Sesli kayıt — "yarın 3'te Ahmet'i ara" de, confirmation modal açılmalı
- [ ] Bildirim izni — yerel bildirim kurma
- [ ] Cari ekle — ad + telefon + e-posta
- [ ] Dashboard — grafik ve metric'ler doğru mu
- [ ] Reminders listesi — today/tomorrow/week grouplar
- [ ] Sign out + sign in — state korunuyor mu

---

## 📸 Faz 6 — Screenshots Hazırla (~30 dk)

### 6.1 iPhone'dan 6 screenshot çek

Önerilen sıralama + hangi ekran:

| # | Ekran | Görsel içerik |
|---|---|---|
| 1 | Dashboard | Metric grid + bar chart + streak |
| 2 | Mikrofon basılı | Pulse ring + "Dinliyorum" metni |
| 3 | Confirmation modal | Transcript + reminder kartları |
| 4 | Reminders list | Today/Tomorrow/This Week sections |
| 5 | Contact detail | Profile + call/email buttons |
| 6 | Search | Arama aktif + filtreli sonuçlar |

### 6.2 Screenshot boyut seçimi

App Store Connect 2024-2026 itibarıyla şu kategorilerden **en az birini** kabul ediyor:
- **iPhone 6.9" Display** = 1320×2868 (iPhone 16 Pro Max)
- **iPhone 6.7" Display** = 1290×2796 (iPhone 14/15/16 Pro Max) — **PRIMARY**, default tercih
- **iPhone 6.5" Display** = 1242×2688 (iPhone XS Max, 11 Pro Max) — legacy ama hâlâ kabul ediliyor
- **iPhone 5.5" Display** = 1242×2208 — legacy, opsiyonel

> **v1.0 deneyiminden:** Kullanıcı 6.7"'lik orijinalleri **1242×2688 (6.5")** boyutuna manuel resize etti ve App Store **kabul etti**. Submit butonu aktifleşti, "primary missing" uyarısı vermedi. Yani 6.5" tek başına yeterli; ama daha güvenli için 6.7" tab'ına da yüklemek tavsiye edilir.

### 6.3 iPad screenshot (zorunlu eğer `supportsTablet: true`)

`app.json` içinde `ios.supportsTablet: true` ise Apple **iPad 13" Display (2064×2752)** screenshot ister, yoksa Add for Review butonu **gri kalır**.

**3 yol:**

**A) Gerçek iPad simulator'da çek** (en doğru, macOS gerektirir):
```bash
# Mac üzerinde
xcrun simctl boot "iPad Pro 13-inch (M4)"
# Voicely AI'ı simülatörde aç, Cmd+S ile screenshot çek
```

**B) iPhone screenshot'larını iPad canvas'a center-fit et** (Windows-friendly, hızlı):
```bash
python scripts/generate_ipad_screenshots.py
# Source: VoiceRemind/iphone-screenshots/*.png|jpeg
# Output: VoiceRemind/ipad-screenshots/ipad_NN.png (2064×2752, dark navy #0F172A bg)
```
> v1.0'da bu yol kullanıldı. Apple validator dimensions'ı kontrol eder, gerçek iPad UI'ı görmez. Kabul edildi.

**C) `app.json`'da `supportsTablet: false` yap** ve iPad zorunluluğunu komple kaldır. Yeni build gerekir (1 EAS build slotu).

### 6.4 Upload
App Store Connect → 1.0 Prepare for Submission → Previews and Screenshots:
- **iPhone tab** → 6.7" veya 6.5" sub-tab → 6 PNG drag&drop
- **iPad tab** → iPad Pro 13" sub-tab → 3-8 PNG drag&drop (en az 3, max 10)

---

## 🏁 Faz 7 — Submit for Review (~10 dk)

### 7.1 Version metadata doldur

**What's New in This Version**:
```
v1.0 — İlk sürüm!

• Sesli hatırlatıcı oluşturma (Türkçe AI)
• Mini CRM ile cari takibi
• Dashboard ve haftalık istatistikler
• Yerel bildirimler
```

**Promotional Text** (170 char):
```
Mikrofona basılı tut, Türkçe konuş, AI hatırlatıcını saniyeler içinde oluşturur. Müşteri takibi ve günlük yapılacaklar tek yerde.
```

**Description**: `docs/store-listing.md` → "Description" bölümündeki 4000 char metni kopyala.

**Keywords** (100 char, virgülle ayrılmış boşluksuz):
```
hatırlatıcı,sesli,AI,yapay zeka,hatırla,görev,CRM,müşteri,takip,ajanda,not,bildirim
```

**Support URL**: `https://blaixs-max.github.io/VoiceRemind/support/`
**Marketing URL**: `https://blaixs-max.github.io/VoiceRemind/` (opsiyonel)

### 7.2 App Review Information

| Alan | Değer |
|---|---|
| Sign-in required | **Yes** |
| Username | `reviewer@voicely.test` (önceden Supabase'de oluştur) |
| Password | `Reviewer2026!` (veya güçlü başka) |
| Notes | "Mikrofona basılı tutarak ses kaydı yapın. Türkçe komut: 'yarın saat 3'te toplantı'. AI confirmation modal'ı açılacak." |
| Contact — First name | Hasan |
| Contact — Last name | <soyad> |
| Contact — Email | blaixs@gmail.com |
| Contact — Phone | <telefon> |

### 7.3 Version Release
- **Automatically release this version after approval** → seçebilirsin
- Veya **Manually release this version** → onay sonrası sen tetikliyorsun

### 7.4 Submit for Review
Sağ üstte **"Submit for Review"** butonu → **Submit**

---

## ⏳ Faz 8 — Apple Review Bekleme

### Ortalama süreler (2025/2026 için)
- **"Waiting for Review"**: ~24 saat
- **"In Review"**: ~4-12 saat
- **"Ready for Sale"** veya **"Rejected"**: toplam 2-3 gün

### Reviewer email alırsan
- Rejection genelde 1-2 madde olur
- En sık: missing metadata, privacy manifest, permission açıklaması
- Düzelt + **Resolution Center**'da cevap ver + yeniden submit

### Kabul olduğunda
Email: **"Your app has been approved"**
- Automatic release ise → 24 saat içinde App Store'da canlı
- Manual release ise → App Store Connect'ten **"Release This Version"** → ~4 saat

---

## 🎉 Canlı Olduktan Sonra

### İlk saatler
- App Store linki paylaş: `https://apps.apple.com/tr/app/voicely-ai/id<app-id>`
- iPhone'da **arama yap**: "Voicely AI" → uygulaman çıkmalı (ASO sinyalleri ~1 saat içinde oturur)

### İlk 48 saat — izle
- App Store Connect → Analytics → Impressions, Downloads, Conversion rate
- Crash reports (eğer varsa)
- İlk user feedback'leri (varsa review)

### Öncelik 1 başla
`CLAUDE.md` → Öncelik 1 (temel iyileştirmeler) → sıradaki feature'lar

---

## 🆘 Sık Karşılaşılan Hatalar

| Hata | Çözüm |
|---|---|
| `ITMS-90717: Invalid App Store Icon` | Icon'da alpha var → `scripts/process-icon.py` ile yeniden üret |
| `ITMS-90022: Invalid dimensions` | Icon 1024x1024 değil → aynı script'ten geçir |
| Build fails: "No bundle identifier" | `app.json` → `ios.bundleIdentifier` doğru mu kontrol et |
| EAS credentials "Session expired" | `eas login` tekrar çalıştır |
| TestFlight "Missing Compliance" | Build detaylarında "Manage" → No encryption |
| Rejected: "Metadata missing" | App Store Connect → App Review Information bölümünü doldur (demo hesap zorunlu) |
| Rejected: "Permission description generic" | `app.json` → `NSMicrophoneUsageDescription` daha açıklayıcı yap |
| Description: "This field contains one or more invalid characters" | Browser clipboard'da hidden Unicode (zero-width chars, smart quotes, emoji placeholder bytes). Çözüm: metni Notepad'e yapıştır → tekrar kopyala → App Store'a yapıştır. Emoji'leri ve em-dash'leri (`—`) ASCII'ye çevir. Bullet'lar için `•` yerine `-` kullan. |
| "Unable to Add for Review: You must upload a screenshot for 13-inch iPad displays" | `app.json` `supportsTablet: true` olduğu için iPad screenshot zorunlu. Çözüm: `scripts/generate_ipad_screenshots.py` ile generate et veya `supportsTablet: false` yap (yeni build gerekir). |
| "Unable to Add for Review: You must respond to the required age ratings questions" | App Information → Age Rating → Edit → 7-step questionnaire'i doldur (hepsi None/No → Result: 4+) |
| Save butonu kırmızı/gri ama spesifik hata yok | Birden fazla zorunlu alan eksik. Çözüm: F12 DevTools → Network → Save'e tıkla → kırmızı request'in Response panel'inde tam hata mesajı görünür. Veya sol menüde sarı/turuncu noktalı sayfa(lar)ı ara (App Privacy, Age Rating, App Information). |

---

## 📚 v1.0 Submission Lessons Learned (2026-04-29)

İlk gerçek submission'dan kazanılan deneyimler — sonraki sürümlerde zaman kazandıracak:

### 1. Description "Invalid Characters" tuzağı
- **Belirti:** Description alanına uzun, emoji'li, formatlı metin yapıştırınca "This field contains one or more invalid characters" hatası
- **Sebep:** Browser kopya-yapıştır sırasında akıllı tırnaklara dönüşüm + zero-width spaces + emoji placeholder bytes
- **Workaround:** **Notepad UTF-8** üzerinden geçirip yapıştır. Emoji'siz, ASCII bullet (`-`), düz tırnak versiyonu hazırla.
- **Submit edilen v1.0 versiyonu:** Kısa, sade Türkçe (~1620 char). Uzun versiyon v1.0.1'de update edilecek (Description App Store'da version-bound olduğu için).

### 2. iPad zorunluluğu
- **Belirti:** Add for Review gri, "Upload screenshot for 13-inch iPad displays" hatası
- **Sebep:** `app.json` `supportsTablet: true` (default Expo değeri), iPad screenshot zorunlu
- **Çözüm:** `scripts/generate_ipad_screenshots.py` (Python+Pillow) — iPhone PNG'leri 2064×2752 dark navy canvas'a center-fit eder

### 3. Age Rating questionnaire (7 step)
- 2024+ Apple binary NO/YES + NONE/INFREQUENT/FREQUENT yapısına geçti (eski "None" tek seçenekti)
- Voicely AI productivity app → tüm sorulara **None/No** → Result: **4+**
- Step 7'de "Not Applicable" default kalır (Made for Kids işaretleme)

### 4. Demo Account hazırlığı
- Reviewer kendi cihazından login yapacak — sadece Supabase'de auth kullanıcısı yetmez, **populated state** gerekir
- En azından 3-5 hatırlatıcı + 2-3 cari + 1-2 tamamlanmış hatırlatıcı (dashboard streak için) olmalı
- En kolay yol: kullanıcının **kendi telefonundaki Voicely AI'dan demo email ile register flow** ile hesap aç → birkaç hatırlatıcı oluştur. SQL insert'ten daha gerçekçi (auth trigger'lar düzgün çalışır).

### 5. Reviewer Notes — bilingual + dictation rehberi
- Reviewer çoğunlukla ABD/İrlanda merkezli, Türkçe dictation cihazında olmayabilir
- Notes alanına **İngilizce talimat** + Türkçe dictation kurulum adımları + populated demo account vurgusu eklendi
- Manuel hatırlatıcı ekleme henüz yok → reviewer için kritik fallback (1.0.1 priority)

### 6. App Privacy "Published" zorunlu
- Sadece doldurmak yetmiyor, **Publish** tıklamak gerekiyor — yoksa Save butonu kırmızı kalır ve hata mesajı belirsiz
- App Privacy → 4 data type declared (Email, Audio, Other Content, User ID) — Linked=Yes, Tracking=No

### 7. Country availability
- Faz 1 strategy: Turkey only (App Information → Pricing & Availability)
- Age Rating sayfasında görünen "173 countries" listesi sadece **rating çevirisi** (Brazil "AL", Korea "ALL"), country availability değil
- v2.0'da global açılım yapılacak (English localization ile birlikte)

---

## 🚨 v1.0 Reject + v1.0.1 Resubmit Lessons (2026-04-30)

**Reject:** Submission ID `ed0e119e-8f0b-4d3d-ba01-8b868b7dfce2`, **Guideline 5.1.1(v)** — iki ayrı sorun:
1. **Account deletion eksik** — App hesap açmaya izin veriyor ama silme yolu yok (Apple zorunlu kılıyor)
2. **Login wall yasağı** — Apps may not require users to enter personal information to function, except when directly relevant to core functionality

**Tek günde fix + resubmit:** 2026-04-30 — kod yazımı + Edge Function deploy + smoke test + screen recording + Resolution Center reply.

### 1. Account Deletion zorunluluğu (5.1.1(v))

**Apple kuralı:**
- Hesap açmaya izin veren her app **uygulama içinden** hesap silmeyi de sunmalı
- "Sadece pasif hâle al" yetmez — gerçek silme olmalı
- Telefon/email customer service zorunluluğu sadece "highly-regulated industries" için
- Confirm dialog OK ama tek tıkla bitmemeli

**Çözüm pattern (Supabase için):**
- Client SDK'da self-delete API yok → service-role key ile **Edge Function** lazım
- Edge Function: `auth.admin.deleteUser(user.id)` çağırır
- DB tarafında `ON DELETE CASCADE` foreign key'lerle ilişkili kayıtlar otomatik silinir
- Dosyalar: `supabase/functions/delete-account/index.ts` (yeni) + `authStore.deleteAccount()` (yeni method) + `SettingsScreen` (yeni ekran)
- Privacy policy'de §4.1 "in-app account deletion" bölümü olmalı (promise/implementation parity)

**Edge Function deploy yedek yolu:**
- CLI 403 verirse (account/project mismatch) → Supabase Dashboard → Functions → "Deploy a new function" → "Via Editor" → kod yapıştır → "Verify JWT" KAPALI → Deploy
- Health check: `curl POST https://<project>.supabase.co/functions/v1/delete-account` → beklenen: 401 + `{"error":"Yetkilendirme gerekli"}` (auth header yok mesajı)

### 2. Login Wall yasağı (5.1.1(v))

**Apple kuralı:**
- "Apps may not require users to enter personal information to function, except when directly relevant to the core functionality"
- AI/Voice processing tek başına "core functionality" sayılmıyor (Apple 2024+ daralttı)
- Çözüm: **alternatif giriş yolu** sun (guest mode / anonymous)

**Çözüm pattern (cloud-first app için):**
- AsyncStorage'da `isGuest` flag tut (`voicely.isGuest = '1'`)
- AuthScreen'e "Misafir olarak devam et" butonu ekle
- App.tsx'te `(session || isGuest) ? MainApp : AuthScreen`
- Store layer'da **dual-mode**: cloud Supabase OR AsyncStorage local fallback
  - `isGuestMode()` helper → `useAuthStore.getState().isGuest`
  - Her CRUD method'da if/else branch
  - Cross-store reference için `getState()` (circular import'tan kaçınma)
- Account-based feature'lar **gating** ile (block değil, prompt'la):
  - Voice AI mic → "Sesli Komut için Hesap Gerekli" diyalogu + 1-tap exit-to-login
  - CRM/Cariler tab → gradient lock screen + "Hesap Aç" CTA

### 3. Resubmit pratikleri

**ASC'de yeni version oluşturmadan resubmit:**
- 1.0 Rejected sayfasında (`/distribution/ios/version/inflight`) Build alanından eski build'i kaldır → yeni Build'i ekle → Save → sağ üstte **"Update Review"** butonu → resubmit
- Yeni version oluşturmaya gerek yok (1.0.1 etiketi sonraki update için saklanır)

**Resolution Center reply:**
- ASC → App Review → "Yesterday at X:XX | iOS 1.0 | Unresolved Issues" satırı → tıkla → submission detay → Reply textbox
- Apple "Reply to this message in App Store Connect" diyor — **email reply yapma**, ASC içinden yaz
- Notes'a Submission ID + build number + path-by-path açıklama yaz (yeni reviewer atanırsa context lazım)

**Screen recording attachment:**
- ASC App Review Information → Attachment tek dosya kabul eder (~50 MB)
- Birden fazla video varsa: birini ASC'ye, diğerlerini **YouTube Unlisted/Public link** olarak Resolution Center reply'a yaz
- Format: iPhone Photos screen recording → Mail kendine gönder → PC'ye indir → YouTube'a yükle → Reply'a embed
- Apple reviewer YouTube linkini açıp izleyebilir, attachment limiti aşmasın

**Reply format (kanıtlanmış kabul edici):**
```
Recording 1 - Account Deletion + post-deletion sign-in re-try (physical iPhone):
https://www.youtube.com/shorts/<id>

Recording 2 - Guest login + manual reminder creation (physical iPhone):
https://www.youtube.com/shorts/<id>
```

### 4. Mimari tasarım dersi: cloud-first ≠ login-only

- "Cloud-first" mimari (AsyncStorage persist kaldırılmış, her CRUD Supabase'e gider) **kötü değil** ama login wall kuralına çakılır
- Çözüm: **dual-mode store** — `isGuest` branch + AsyncStorage fallback. Mevcut Supabase code'una dokunmadan paralel akış.
- Pattern reusable: ileride **offline mode** için aynı dual-mode infrastructure kullanılır

### 5. Privacy policy/implementation parity

- Privacy policy'de "Hesabınızı sildiğiniz an tamamen silinir" yazıyorsa Apple bunu **kontrol eder**
- Implementation eksikse iki katlı reject sebebi (5.1.1(v) + 5.1.1 promise gap)
- Yeni feature eklerken privacy policy'yi mutlaka senkron güncelle (atomic commit ile)

---

*Bu runbook her Apple submission öncesi güncellenir. Son update: 2026-04-30 akşam (v1.0.1 resubmit)*
