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

### 3.1 Preview build'i tetikle (TestFlight için)
```bash
cd "C:/Users/hasan/OneDrive/Masaüstü/Asistan/VoiceRemind"
eas build --platform ios --profile preview
```

> **Not**: `preview` profili `app.json`'da simulator build için değil, internal distribution için tanımlı. TestFlight'a yükleme için ideal.

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
? Which Apple ID → <senin email>
? App-specific password → <oluştur: appleid.apple.com/account/manage>
? Which app → Voicely AI (az önce kaydettiğin)
```

> **App-specific password nedir?** Apple ID şifren yerine EAS'e verdiğin "dar kapsamlı" token. https://appleid.apple.com/account/manage → Sign-In and Security → App-Specific Passwords → **+** → "EAS Submit" → şifre kopyala.

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

### 6.2 Screenshot boyut doğrulama
iPhone 15/16 Pro Max'ta çekilen screenshot = **1290×2796** (tam App Store gereksinimi). Başka iPhone'da çekilirse script dönüştürür:

```bash
python scripts/verify-screenshots.py ./screenshots/
```

### 6.3 Upload
App Store Connect → App → Version 1.0 → Screenshots → iPhone 6.7" → **Drag & drop 6 dosya**

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

---

*Bu runbook her Apple submission öncesi güncellenir. Son update: 2026-04-22*
