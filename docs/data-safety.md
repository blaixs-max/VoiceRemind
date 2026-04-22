---
layout: default
title: Data Safety Referansı (internal)
permalink: /data-safety/
---

# Google Play — Data Safety Form Cevapları

Bu doküman, Play Console'daki **Data Safety** formunu doldururken kullanılacak referanstır. Form link: https://play.google.com/console → App → Policy → Data safety

> Bu sayfa App Store Connect "App Privacy" form'u için de geçerli (sorular çok benzer).

---

## 📋 Ana Özet (Kısa Cevaplar)

| Soru | Cevap |
|------|-------|
| Bu uygulama kullanıcı verisi topluyor mu? | **Evet** |
| Toplanan veri 3. taraflarla paylaşılıyor mu? | **Evet** (OpenAI ile — işleme için) |
| Veriler şifreleniyor mu? | **Evet** (HTTPS + at-rest encryption) |
| Kullanıcı veri silme talep edebilir mi? | **Evet** (e-posta yoluyla) |
| Uygulama Google'ın Families Policy'sine uyuyor mu? | **Hayır** (genel kullanıcı hedefli, 13+ yaş) |

---

## 🔐 Veri Kategorileri

### 1. Personal Info (Kişisel Bilgi)

**Email address**
- ✅ Toplanıyor: **Evet**
- Amaç: `App functionality` (hesap oluşturma + kimlik doğrulama)
- Opsiyonel mi? **Hayır** (hesap için zorunlu)
- Paylaşılıyor mu? **Hayır**
- Şifreli iletim: **Evet**
- Kullanıcı silebilir mi? **Evet**

**Name / User IDs**
- ❌ Toplanmıyor

**Address, phone number**
- ❌ Toplanmıyor (uygulamamız kullanıcıdan değil — kullanıcının kendi oluşturduğu "cari"ler içinde olabilir ama bu kullanıcı içeriği)

---

### 2. Financial info
❌ **Hiçbiri toplanmıyor**

---

### 3. Health and fitness
❌ **Hiçbiri toplanmıyor**

---

### 4. Messages
❌ SMS, emails, in-app messages — hiçbiri toplanmıyor

---

### 5. Photos and videos
❌ **Hiçbiri toplanmıyor**

---

### 6. Audio files ⚠️ ÖNEMLİ

**Voice or sound recordings**
- ✅ Toplanıyor: **Evet** (geçici olarak)
- Amaç: `App functionality` (sesten metne çevrim)
- **KRİTİK AÇIKLAMA**: "Audio is collected ephemerally, processed immediately, and not retained. Only the transcribed text is saved."
- Opsiyonel mi? **Evet** (kullanıcı mikrofon iznini reddedebilir, manuel giriş yapabilir)
- Paylaşılıyor mu? **Evet** — OpenAI (Whisper API, ABD)
- Şifreli iletim: **Evet**
- Kullanıcı silebilir mi? **N/A** (zaten saklanmıyor)

**Music files / Other audio files**
- ❌ Toplanmıyor

---

### 7. Files and docs
❌ Uygulama dosyalara erişmiyor

---

### 8. Calendar
❌ **Henüz entegre değil** (gelecekte eklenebilir, o zaman güncellenecek)

---

### 9. Contacts
❌ Telefon rehberi okunmuyor. Kullanıcının kendi oluşturduğu **Cari (CRM) bilgileri** var ama bu user-generated content kategorisinde.

---

### 10. App activity

**App interactions**
- ❌ Toplanmıyor (analytics SDK yok)

**In-app search history**
- ❌ Toplanmıyor (lokal)

**Installed apps**
- ❌ Taranmıyor

**Other user-generated content**
- ✅ Toplanıyor: **Evet**
- İçerik: Hatırlatıcı başlıkları, tarihler, notlar, cari bilgileri
- Amaç: `App functionality` (hatırlatıcıyı saklamak)
- Paylaşılıyor mu? **Hayır**
- Şifreli iletim: **Evet** (HTTPS)
- Şifreli saklama: **Evet** (Supabase at-rest encryption)
- Kullanıcı silebilir mi? **Evet**

---

### 11. Web browsing
❌ Tarayıcı verisi toplanmıyor

---

### 12. App info and performance

**Crash logs**
- ❌ Toplanmıyor (Sentry, Crashlytics vb. yok)

**Diagnostics**
- ❌ Toplanmıyor

**Other app performance data**
- ❌ Toplanmıyor

---

### 13. Device or other IDs
❌ **Toplanmıyor**
- IDFA/AAID (advertising ID): kullanılmıyor
- Android ID: kullanılmıyor
- IMEI: kullanılmıyor

---

## 🔒 Güvenlik Uygulamaları

### Data is encrypted in transit
- ✅ **Evet** — TLS/HTTPS tüm network trafikte

### You provide a way for users to request data deletion
- ✅ **Evet** — E-posta ile: `blaixs@gmail.com` → 24 saat içinde silinir

### You follow Families Policy
- ❌ **Hayır** — uygulama 13+ yaş hedefli

### Independent security review
- ❌ **Hayır** (bireysel geliştirici, bağımsız audit yok)

### You have committed to Google Play Families Policy
- ❌ **Hayır** (hedef kitle 13+)

---

## 🤝 3. Taraf Paylaşımları

### Supabase (Veritabanı + Auth)
- Paylaşılan veri: **Email, user content** (hatırlatıcılar, cariler)
- Amaç: App functionality (veri saklama)
- Konum: EU (Frankfurt)
- Supabase kullanıcı verilerini **bizim adımıza işler** (processor role), kendi amacıyla kullanmaz

### OpenAI (Whisper + GPT-4)
- Paylaşılan veri: **Audio recording (geçici), transcript (geçici)**
- Amaç: App functionality (ses-metin çevrim, intent parsing)
- Konum: ABD
- OpenAI API politikası: 30 gün saklar, silinir, model eğitiminde kullanılmaz

### Expo (Push Notifications)
- Paylaşılan veri: **Yok** (yerel bildirim kullanıyoruz, remote push değil)
- N/A

---

## 📝 Privacy Policy URL

**https://blaixs-max.github.io/VoiceRemind/privacy/**

Bu URL:
- Play Console'da **Policy → App content → Privacy policy** alanına
- App Store Connect'te **App Information → Privacy Policy URL** alanına
- girilecek.

---

## ✅ Form Doldurma Check-list

Play Console'da form doldururken:

- [ ] **Data collection and security** sayfasını aç
- [ ] "Does your app collect or share any of the required user data types?" → **Yes**
- [ ] "Is all of the user data collected by your app encrypted in transit?" → **Yes**
- [ ] "Do you provide a way for users to request that their data be deleted?" → **Yes**
- [ ] Kategoriler için yukarıdaki cevapları seç
- [ ] Privacy Policy URL ekle
- [ ] **Save → Submit for review**

---

## ⚠️ Gelecek Değişiklikler

Şu özellikler eklenirse **formu güncellemek zorunlu**:

- Google Sign-in → "User IDs" kategorisi eklenir
- Analytics (Firebase, Posthog) → "App interactions" kategorisi
- Crashlytics → "Crash logs" + "Diagnostics"
- Takvim entegrasyonu → "Calendar" kategorisi
- Rehberden import → "Contacts" kategorisi
- Reklam → "Advertising ID" + "Data shared with partners for advertising"
