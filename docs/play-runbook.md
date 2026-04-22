---
layout: default
title: Google Play Onay Runbook (internal)
permalink: /play-runbook/
---

# Google Play Console Onayı Geldikten Sonra — Step-by-Step Runbook

Bu doküman Play Console hesabı onaylandığı andan **Closed Testing track'ında 20 tester × 14 gün** tamamlanana kadarki tüm adımları sıralar.

**Gerçekçi süre tahmini**: hesap onayı + hazırlık (2-3 gün) + Closed Testing 14 gün + Review 1-2 gün = **~20 gün**.

---

## 📋 Play Console Zorunlu Kuralı: Closed Testing

2023'ten beri **yeni Individual developer hesaplarda** production release için önce:
- **En az 20 tester** (eğer Opening Day < 100 test için farklı)
- **En az 14 kesintisiz gün** test süresi
- Test sırasında her tester **app'i en az bir defa açmalı**

Bu kuralı atlama yolu yok. Planlama buna göre.

---

## 🚀 Faz 1 — Play Console'da Uygulama Oluştur (~10 dk)

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

*Son update: 2026-04-22*
