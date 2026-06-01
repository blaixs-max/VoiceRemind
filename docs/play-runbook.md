---
layout: default
title: Google Play Onay Runbook (internal)
permalink: /play-runbook/
---

# Google Play Console Onayı Geldikten Sonra — Step-by-Step Runbook

Bu doküman Play Console hesabı onaylandığı andan **Closed Testing track'ında 20 tester × 14 gün** tamamlanana kadarki tüm adımları sıralar.

**Gerçekçi süre tahmini**: hesap onayı + hazırlık (2-3 gün) + Closed Testing 14 gün + Review 1-2 gün = **~20 gün**.

---

## 📍 Mevcut Durum (2026-06-01 — Closed Testing Review'da, Google approval bekleniyor)

- ✅ Play Console hesabı onaylandı (2026-04-23)
- ✅ Privacy Policy URL canlı: https://blaixs-max.github.io/VoiceRemind/privacy/
- ✅ **Faz 1.5 (paket sahipliği doğrulaması)** TAMAMLANDI — Google'ın yeni token-based flow'u ile (`plugins/withAdiRegistration.js`, token `DIOKKK6FM5PKGAAAAAAAAAAAAA` APK'ya gömüldü), `com.blaixs.VoiceRemind` "Kayıtlı" statüsünde
- ✅ **Faz 1 (app create)** TAMAMLANDI — Voicely AI app yeniden oluşturuldu, yeni internal ID `4972471939058285799`
- ✅ **Faz 2 (Service Account JSON)** TAMAMLANDI — `secrets/google-play-service-account.json` mevcut, Google Cloud project `eas-submit-voicely` (numeric `435290266485`), Google Play Android Developer API enabled
- ✅ **Service account invite** — "Kullanıcılar ve izinler → Yeni kullanıcılar davet et" (yeni redesign'da "API access" sayfası kaldırılmış). App permissions: Voicely AI için Yönetici (13 izin). Account permissions boş (least-privilege).
- ✅ **Faz 3 (Production AAB build)** TAMAMLANDI — versionCode 4, https://expo.dev/artifacts/eas/tmbyQJoKYVRPT86STzqfVv.aab
- ✅ **Faz 4 (eas submit Internal Testing'e)** TAMAMLANDI — DRAFT release
- ✅ **Faz 5 (Store Listing)** TAMAMLANDI — Ana mağaza girişi tamamen dolduruldu:
  - App name, kısa açıklama (79 char), tam açıklama (~2200 char emoji'li), 512×512 icon (`assets/brand/icon-512.png`), 1024×500 feature graphic, 8 phone screenshots, kategori (Verimlilik)
- ✅ **Faz 6 (Data Safety)** TAMAMLANDI — 3 veri tipi (Email, Voice, User-generated), 3rd party share: OpenAI (audio için), in-app deletion
- ✅ **Faz 7 (Content Rating IARC)** TAMAMLANDI — Tüm sorulara Hayır → Everyone/3+ rating
- ✅ **Faz 8 (Target Audience)** TAMAMLANDI — 13-15, 16-17, 18+; çocuklara hitap etmez
- ✅ **Faz 9 (App Content checklist)** TAMAMLANDI — 11 madde hepsi yeşil ✅ (Privacy, App access, Ads=No, Content rating, Target audience, News=No, COVID=No, Government=No, Financial=No, Health=No, Data safety)
- ✅ **Dahili Test yayında** — Sürüm 4 (1.0.0) "Etkin"
- ✅ **Kapalı Test - Alpha kanalı konfigüre edildi** — Sürüm 4, Türkiye, voicely-ai-closed-testers email listesi
- ✅ **FINAL SUBMIT (2026-06-01):** 12 değişiklik Google review'a gönderildi (Yönetilen yayınlama aktif)
- ⏳ **Google review** — 1-3 gün (ilk submission'da 7 gün olabilir)
- ⏸ **Faz 10 (Closed Testing 14 gün)** — review onayından sonra başlar
- ⏸ **Faz 11 (Production Turkey-only)** — 14 gün sonra

### Sıradaki adımlar (kullanıcı manuel)
1. ⏳ Google review onayını bekle (mail kontrol)
2. 🎯 20 tester topla (review beklerken paralel)
3. 📧 Onay sonrası test linkini testerlara gönder → 14 gün sayacı başlar
4. 🚀 14 gün sonunda production'a promote → Türkiye only → review 1-3 gün
5. 🎉 Production yayın

### Sentry entegrasyonu (v1.0.2 sprint'i — Android production yayınlandıktan sonra)
- Hem Android hem iOS için ortak v1.0.2 build
- Detay: `CLAUDE.md` → "Bilinen Sorunlar"

---

## 📋 Play Console Zorunlu Kuralı: Closed Testing

2023'ten beri **yeni Individual developer hesaplarda** production release için önce:
- **En az 20 tester** (eğer Opening Day < 100 test için farklı)
- **En az 14 kesintisiz gün** test süresi
- Test sırasında her tester **app'i en az bir defa açmalı**

Bu kuralı atlama yolu yok. Planlama buna göre.

---

## 🚀 Faz 1 — Play Console'da Uygulama Oluştur (~10 dk) ✅ (2026-04-26)

### 1.1 Giriş
https://play.google.com/console → Apps → **Create app**

### 1.2 Form
| Alan | Değer |
|---|---|
| App name | **Voicely AI — Sesli Hatırlatıcı** |
| Default language | **Turkish – tr-TR** |
| App or game | **App** |
| Free or paid | **Free** |
| Declarations — Developer Program Policies | ✅ |
| Declarations — US export laws | ✅ |

→ **Create app**

---

## 🛡 Faz 1.5 — Paket Sahipliği Doğrulaması (~5 dk) ⚠️ Yeni Google Politikası

> **Bu adım 2025'te eklendi**: yeni Individual hesaplar için Play Console, app oluşturduktan sonra "Android geliştirici doğrulaması → Paket anahtarlarını yönetme" ekranına yönlendiriyor. İmzalanmış bir APK upload ederek paket adının (`com.blaixs.VoiceRemind`) sahibi olduğunu kanıtlamamız gerek. Bu fingerprint Play Console'da kalıcı olarak kayıtlanır — sonraki tüm AAB/APK upload'lar bu key ile imzalanmış olmalı.

### 1.5.1 Hangi key kullanılır?
EAS Build, app başına bir Android upload-keystore yönetir (cloud'da). Tüm preview/production build'ler aynı keystore ile imzalanır → SHA-256 sabit kalır:

```
8E:87:57:A1:01:92:BC:87:52:1D:C4:AC:0D:10:2C:07:96:77:FD:58:3E:A0:F3:C7:D5:2F:C5:BF:10:B5:79:12
```

### 1.5.2 APK indirme
EAS bulutunda zaten Faz 9'dan kalma preview APK'lar var. En son APK URL'sini almak için:
```bash
eas build:list --platform android --limit 1 --json --non-interactive
```
JSON'daki `artifacts.buildUrl` alanını al, `curl` ile lokal'e indir (ör. `secrets/voicely-latest.apk`).

### 1.5.3 Upload
Play Console → **Android geliştirici doğrulaması → Paket anahtarlarını yönetme** → **APK yükle** → indirilen APK'yı seç → submit.

> Bu APK doğrulama amaçlıdır, **production sürümüne gitmez**. Closed Testing / Production track'lerine ayrı bir AAB build edip yükleyeceğiz (Faz 3-4).

### 1.5.4 Doğrulama tamam
Upload sonrası "Taslak" durumu kalkar, sol menüde Politika durumu, Kullanıcılar ve izinler vs. açılır.

---

## 🔐 Faz 2 — Service Account Key Üret (~10 dk)

EAS'in otomatik submit yapabilmesi için Google Cloud service account gerek.

### 2.1 Google Cloud Console'a git
https://console.cloud.google.com → aynı hesapla login → **Select a project** → "Voicely AI" project oluştur (veya Play Console'un varsayılan project'ini kullan)

### 2.2 Service Account oluştur
IAM & Admin → **Service Accounts** → **Create Service Account**

| Alan | Değer |
|---|---|
| Name | `eas-submit-voicely` |
| Description | `EAS automated Play Store uploads` |
| Role | **Service Account User** |

→ Done

### 2.3 JSON Key üret
Created service account → **Keys** tab → **Add Key** → **Create new key** → **JSON** → Download

**Dosyayı ŞURAYA kaydet:**
```
C:/Users/hasan/OneDrive/Masaüstü/Asistan/VoiceRemind/secrets/google-play-service-account.json
```

> `secrets/` klasörü `.gitignore`'a zaten eklendi — git'e push olmaz.

### 2.4 Play Console'da access ver
Play Console → **Setup → API access** → "Create new service account" değil, **"Link existing"** → listede service account'u seç → **Grant access** → Permissions:
- ✅ View app information and download bulk reports
- ✅ Manage testing track releases and rollouts
- ✅ Manage production releases

---

## 🏗 Faz 3 — Production AAB Build (~15 dk)

```bash
cd "C:/Users/hasan/OneDrive/Masaüstü/Asistan/VoiceRemind"
eas build --platform android --profile production
```

`eas.json`'da `production` profile AAB (Android App Bundle) çıkarır — Play Store zorunlu format.

### Build tamamlandığında
```
✔ Build finished
🔗 https://expo.dev/artifacts/eas/<build-id>.aab
```

---

## 📤 Faz 4 — Internal Track'a Upload (~5 dk)

### 4.1 EAS submit
```bash
eas submit --platform android --latest
```

`eas.json`'daki `submit.production.android` config otomatik çalışır:
```json
{
  "serviceAccountKeyPath": "./secrets/google-play-service-account.json",
  "track": "internal",
  "releaseStatus": "draft"
}
```

### 4.2 Play Console'da doğrula
Play Console → **Release → Testing → Internal testing** → en üstte v1.0.0 draft görünmeli.

---

## 📝 Faz 5 — Store Listing Metadata (~30 dk)

### 5.1 Main store listing
Play Console → **Grow → Store presence → Main store listing**

**App name**:
```
Voicely AI — Sesli Hatırlatıcı
```

**Short description** (80 char):
```
Mikrofona Türkçe konuş, AI hatırlatıcı + CRM. Satış ve görevler tek uygulamada.
```

**Full description**: `docs/store-listing.md` → Apple description'ı aynen kullan (4000 char aynı limit).

### 5.2 Graphics
| Asset | Dosya | Gereklilik |
|---|---|---|
| App icon | `assets/icon.png` | 512×512 (Play otomatik resize eder, 1024 ver) |
| Feature graphic | `assets/brand/feature-graphic.png` | **Zorunlu** |
| Phone screenshots | 2-8 adet | **Zorunlu** |
| 7" tablet screenshots | 1-8 adet | Önerilir |
| 10" tablet screenshots | 1-8 adet | 7" varsa zorunlu |

### 5.3 Categorization
- **App category**: Productivity
- **Tags**: Business, Productivity, Tools

### 5.4 Contact details
- Email: **blaixs@gmail.com**
- Phone: opsiyonel
- Website: **https://blaixs-max.github.io/VoiceRemind/**

### 5.5 Privacy Policy
- **URL**: `https://blaixs-max.github.io/VoiceRemind/privacy/`

---

## 🛡 Faz 6 — Data Safety Form (~20 dk)

Play Console → **Policy → App content → Data safety**

Tüm cevaplar için referans: **`docs/data-safety.md`**

### Özet hızlı girişi
- Data collection: **Yes**
- Data sharing: **Yes** (OpenAI için — transcription amaçlı)
- Encrypted in transit: **Yes**
- User can request deletion: **Yes** (email)
- Families policy: **No**

### Kategoriler
- **Personal info**: Email address (app functionality)
- **Audio**: Voice recordings (app functionality, ephemeral, shared with OpenAI)
- **App activity**: Other user-generated content (reminders, contacts)

Detaylı adım adım: `docs/data-safety.md`

---

## 🔞 Faz 7 — Content Rating (IARC) (~10 dk)

Play Console → **Policy → App content → Content rating**

Questionnaire — tüm cevaplar: **No**

Kategori: **Utility, Productivity, Communication, or Other**

Sonuç: **Everyone / 3+** (IARC) → Hedef kitle 13+

---

## 🎯 Faz 8 — Target Audience (~5 dk)

Play Console → **Policy → App content → Target audience and content**

- Target age group: **13–15 ve 16–17 ve 18+** (hepsini seç)
- App appeals to children: **No**

---

## 📱 Faz 9 — Uygulamayı Yayına Hazırla (~10 dk)

Play Console sol menü → **Policy → App content** → tüm gereksinimleri ✅ gör:

- [ ] Privacy Policy
- [ ] App access (Login required → reviewer hesabı ver)
- [ ] Ads (app contains ads? → **No**)
- [ ] Content rating
- [ ] Target audience
- [ ] News app (Is this a news app? → **No**)
- [ ] COVID-19 contact tracing → **No**
- [ ] Data safety
- [ ] Government app → **No**
- [ ] Financial features → **No**
- [ ] Health → **No**

---

## 🧪 Faz 10 — Closed Testing Track Başlat (~20 dk)

Play Console → **Release → Testing → Closed testing** → **Create track** veya varsayılan "Closed testing" track'ı

### 10.1 Testers
**Email list** yaklaşımı:
- Maksimum 100 tester email'i tek tek veya CSV ile ekle
- Minimum **20 tester** gerek
- Herkes aynı Google hesabı ile Play Store'a giriş yapmış olmalı

### Önerilen tester kaynakları
- **Aile / arkadaşlar** (en hızlı)
- **Discord, WhatsApp grupları** ("kim test eder?")
- **Twitter/X post** ("Türkçe sesli hatırlatıcı app test edecek 20 kişi lazım, DM")
- **r/Turkey veya r/Android subreddit'leri** (post)

### 10.2 Release to Closed Testing
Build (Faz 4'te upload ettiğin) → Internal'den Closed'a **promote** et:

Internal testing track → sağ üst → **Releases → v1.0.0 → Promote to closed testing**

### 10.3 14-gün sayacı
Closed testing'de release ilk gün 00:00'dan itibaren **14 tam gün** beklemek zorunda. Bu süre boyunca:
- Her tester en az 1 kere app'i açmalı
- Play Console → Release → Testing → Closed testing → **Testers tab** → her tester için "opt-in" durumu görünür

---

## 🚀 Faz 11 — Production Release (~5 dk aktif iş)

Closed testing 14 gün dolduktan sonra:

### 11.1 Production'a promote
Closed testing → **Releases → v1.0.0 → Promote to production**

### 11.2 Countries
Faz 1 stratejisi: **Turkey only**
- Available countries → **Uncheck all** → **Turkey** seç

### 11.3 Review submit
Review takes **1-3 days** (ilk submission'da bazen 7 gün sürüyor).

---

## ⏳ Review Sonuçları

### Kabul
- Email: **"Your app has been published"**
- Play Store linki canlı: `https://play.google.com/store/apps/details?id=com.blaixs.VoiceRemind`
- Google arama + Play Store search'te arama: "Voicely AI" → ~2 saat içinde index olur

### Reddedilme
En sık sebepler:
- **Broken functionality**: Reviewer app açamadı → login info yanlış veya demo hesap çalışmıyor
- **Missing data safety**: Form'da bir kategori eksik
- **Permission mismatch**: İstenen izin açıklaması yetersiz (örn. mikrofon için)
- **Metadata policy**: Yanıltıcı screenshot/promo

Reddedilme email'inde **Resolution Center link'i** var. Oradan cevap + düzeltme + resubmit.

---

## 🆘 Sık Karşılaşılan Hatalar

| Hata | Çözüm |
|---|---|
| `The Android App Bundle was not signed...` | EAS credentials Android için setup değil → `eas credentials --platform android` |
| `Versiyon Kodu already used` | `app.json` → `android.versionCode` artır + rebuild |
| Closed Testing "0 testers opted in" | Invite link'i tester'lara tekrar gönder, "join testing" sayfasından katılmaları gerek |
| Data Safety incomplete | docs/data-safety.md'deki her kategoriyi tek tek gir, skip etme |
| Service account "Permission denied" | Google Cloud Console → IAM → Role eksik veya Play Console'da link edilmemiş |

---

## ⚡ Hızlandırma İpuçları

- **Apple + Play paralel**: Apple onayı varsa iOS build'i Play Closed Testing başlarken başlat — 14 günlük bekleme ikisinde de aynı anda geçer
- **20 tester önceden topla**: Hesap onayı beklerken Discord/WhatsApp'tan liste hazırla, email'ler hazır olsun
- **Beta testing geri bildirimlerini filtrele**: 14 gün içinde gerçek bug raporları gelirse → patch build → **aynı closed testing track'a yükle** (14 gün sıfırlanmaz)

---

*Son update: 2026-04-26 — Faz 1 tamamlandı (Play Console app create), Faz 1.5 eklendi (paket sahipliği doğrulaması, yeni Google politikası).*
