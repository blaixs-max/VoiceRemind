---
layout: default
title: Monetizasyon Planı (internal)
permalink: /monetization-plan/
---

# Voicely AI — Monetizasyon Planı (v1.1)

**Karar tarihi:** 2026-04-22
**Status:** Approved, implementation v1.1'de (Faz 1 launch'tan ~1 ay sonra)

---

## 🎯 Karar Özeti

| Soru | Karar |
|---|---|
| Model | **Freemium + Subscription** |
| İlk launch | **Free app** (Faz 1) |
| Monetization ekleme | **v1.1'de** (Faz 2, ~1 ay sonra) |
| Tech stack | **RevenueCat** (`react-native-purchases`) |
| Free tier limit | **10 hatırlatıcı/gün + 20 cari** |
| Aylık plan | **₺59.99** |
| Yıllık plan | **₺399.99** (%44 indirim pazarlama mesajı) |
| Free trial | **7 gün** (Apple + Google bestpractice) |

### Neden bu model? (Decision Record)

1. **AI API maliyeti ongoing** → tek seferlik IAP matematiksel olarak zarar
2. **TR pazarı paid-only kaldırmıyor** → free tier ASO için zorunlu
3. **Try-before-buy kritik** → özellikle Türkçe voice recognition'da kullanıcı kendini test etmek ister
4. **RevenueCat endüstri standardı** → native IAP ile 3 hafta ekstra iş, RevenueCat'te 2 gün

---

## 📐 Tier Tasarımı

### Free Tier (varsayılan tüm kullanıcılar)
- ✅ 10 sesli hatırlatıcı / gün (rate limit Edge Function'da)
- ✅ 20 cari kaydı (Supabase RLS + row count check)
- ✅ Temel dashboard (bugün + bu hafta)
- ✅ Yerel bildirimler
- ✅ Türkçe AI transcription
- ❌ Gelişmiş dashboard (aylık trend, streak'ler)
- ❌ Tekrarlayan hatırlatıcılar
- ❌ Takvim entegrasyonu
- ❌ Export/import
- ❌ Öncelikli destek

### Pro Tier (₺59.99/ay veya ₺399.99/yıl)
- ✅ Her şey unlimited
- ✅ Gelişmiş dashboard (aylık/yıllık grafikler, streak)
- ✅ Tekrarlayan hatırlatıcılar (günlük/haftalık/aylık)
- ✅ Takvim entegrasyonu (iOS Calendar)
- ✅ Export/import (JSON/CSV)
- ✅ Öncelikli email desteği
- ✅ Future Pro-only features (tanımlama hakkı)

### Pricing psikolojisi
- Aylık ₺59.99 = günde ≈ ₺2 (bir simit parası)
- Yıllık ₺399.99 = aylık ≈ ₺33 (₺26 indirim/ay × 12 = ₺312 tasarruf pazarlama)
- 7 gün trial: risk-free deneyim

---

## 🏗 Teknik Implementasyon

### Paket ekleme
```bash
npx expo install react-native-purchases
# RevenueCat SDK, Expo EAS Build ile uyumlu (Expo Go değil)
```

### Dosya değişiklikleri (v1.1 scope)

```
src/
├── utils/
│   ├── revenuecat.ts              [NEW] — SDK init, entitlement check
│   └── entitlements.ts            [NEW] — "isPro()", "canCreateReminder()" gates
├── stores/
│   └── subscriptionStore.ts       [NEW] — Zustand: {isPro, expiresAt, refresh()}
├── screens/
│   └── PaywallScreen.tsx          [NEW] — Custom paywall UI
├── components/
│   ├── UpgradeBadge.tsx           [NEW] — "Pro" lock icon overlay
│   └── RateLimitModal.tsx         [NEW] — "10 hatırlatıcı doldu, Pro'ya geç"
├── screens/
│   └── DashboardScreen.tsx        [MODIFY] — Pro features locked state
├── hooks/
│   └── useParseAudio.ts           [MODIFY] — Rate limit check before API call
└── App.tsx                         [MODIFY] — RevenueCat init on launch
```

### Edge Function tarafı
- **Yeni**: `parse-reminder` function'a daily counter: `reminders_created_today` per user
- Eğer `is_pro = false AND count >= 10` → return `402 Payment Required`
- App tarafında 402 gelirse → `RateLimitModal` aç + paywall'a yönlendir

### Supabase schema değişikliği
```sql
alter table users add column is_pro boolean default false;
alter table users add column subscription_expires_at timestamptz;
alter table users add column revenuecat_user_id text unique;

-- Row-level policy'ler değişmez, sadece read/write için is_pro field'ı check edilir
```

---

## 🛒 Store Setup Adımları (v1.1 öncesi)

### App Store Connect (iOS)

**Ön-koşul (kritik):** Paid Apps Agreement imzalanmış olmalı → 2-7 gün onay
- Agreements, Tax, and Banking → Request
- Banking: Türkiye bankası IBAN
- Tax: TCKN + adres

**Adımlar:**
1. App Store Connect → Voicely AI → **Monetization → Subscriptions**
2. **Subscription Group** oluştur: `Voicely AI Pro`
3. Subscriptions ekle:
   - Product ID: `voicely_ai_pro_monthly` — Duration: 1 month — Price: ₺59.99
   - Product ID: `voicely_ai_pro_yearly` — Duration: 1 year — Price: ₺399.99
4. **Introductory Offer** (her ikisi için): 7-day free trial
5. Localization (Turkish):
   - Display Name: "Voicely AI Pro"
   - Description: "Sınırsız hatırlatıcı, sınırsız cari, gelişmiş dashboard"
6. Review Information:
   - Reviewer için test account: `pro-reviewer@voicely.test` / `Reviewer2026!`
   - Screenshot: paywall ekranı
7. Submit for Review (IAP review ayrı, ilk ~48 saat sürer)

### Google Play Console

**Ön-koşul:** Payments profile onaylanmış olmalı
- Setup → Payments profile → banking + tax → verify

**Adımlar:**
1. Play Console → Voicely AI → **Monetize → Products → Subscriptions**
2. Base plans + offers:
   - `voicely_ai_pro_monthly`:
     - Base plan: auto-renewing, 1 month, ₺59.99
     - Offer: 7-day free trial
   - `voicely_ai_pro_yearly`:
     - Base plan: auto-renewing, 1 year, ₺399.99
     - Offer: 7-day free trial
3. Countries: Turkey (Faz 1)
4. Activate products

**Önemli:** Product ID'leri iOS + Android'de **aynı** olmalı → RevenueCat tek dashboard'dan yönetir.

### RevenueCat Dashboard

1. https://app.revenuecat.com/ hesap aç (ücretsiz, $10K MRR'a kadar)
2. Project: **Voicely AI**
3. App ekle: iOS (bundle: `com.blaixs.VoiceRemind`) + Android (aynı bundle)
4. **iOS bağlantı**: App Store Connect → Keys → App Store Connect API Key üret → RevenueCat'e upload
5. **Android bağlantı**: Google Play Service Account (submit için kullandığımız) → aynı JSON → RevenueCat'e upload
6. Products RevenueCat'te otomatik görünür (sync)
7. **Entitlement** tanımla: `pro`
8. **Offerings**: `default` → 2 package:
   - `$rc_monthly` → voicely_ai_pro_monthly
   - `$rc_annual` → voicely_ai_pro_yearly
9. SDK kod: RevenueCat **Public SDK Key**'i al (iOS + Android) → `.env` veya `app.config.ts`'e koy

---

## 🚀 Launch Plan (v1.1)

### Hafta 1: Geliştirme
- RevenueCat entegrasyonu
- Paywall ekranı tasarımı + içerik
- Rate limit logic (Edge Function + client)
- Pro-only feature gate'leri

### Hafta 2: Store setup
- Apple: agreements + IAP products + review submit
- Google: payments profile + products + submit
- RevenueCat: product sync + test

### Hafta 3: Internal test
- RevenueCat sandbox (test accounts)
- TestFlight build
- End-to-end: free → rate limit → paywall → subscribe → pro unlock → cancel → grace period

### Hafta 4: Release
- Production build (v1.1.0, versionCode ++)
- App Store Connect + Play Console release
- Store listing güncelle (Pro özellikleri vurgula)
- Mevcut free users'a in-app announcement

---

## 📊 KPIs — Ölçeceğimiz Metrikler

RevenueCat Dashboard'unda otomatik takip edeceğimiz:

| Metric | Target (ilk 3 ay) |
|---|---|
| **Free → Paid conversion rate** | %3-5 |
| **Monthly vs Annual split** | %30 monthly, %70 annual ideal |
| **Trial conversion rate** | %40+ (7 gün sonunda ödemeye geçiş) |
| **MRR (Monthly Recurring Revenue)** | Organik, hedef yok, izle |
| **Churn rate** | %8'in altı sağlıklı |
| **LTV (Lifetime Value)** | Minimum ₺200 ideal (2.5 ay ortalama) |

### İzleme noktaları
- RevenueCat: ana dashboard
- Supabase: `is_pro = true` users count (paralel doğrulama)
- Play Console Financial Reports / App Store Connect Payments

---

## 🧠 Gelecek Optimizasyon Fırsatları

### A/B testing (RevenueCat'te 1 saatte kurulur)
- Trial süresi: 7 gün vs 14 gün
- Fiyat: ₺59.99 vs ₺79.99 (aylık)
- Yıllık discount: %44 vs %30 vs %55
- Paywall UI: liste vs emojili vs sosyal proof'lu

### Promotional offers
- **Lifetime Pro** (tek seferlik ₺999) — early adopter için special
- **Student discount** (.edu email) — %50 indirim
- **Black Friday** — aralık %30 off

### Feature gating deneyleri
- Gelişmiş dashboard Pro'dan Free'ye taşı → conversion düşer mi artırır mı?
- Tekrarlayan hatırlatıcıyı Free'ye ver → engagement artar → paid conversion up?

Bunların hepsi production sonrası **veri ile** karar verilecek.

---

## 🚨 Risk Yönetimi

### Risk 1: Apple IAP Review reddeder
- En sık sebep: paywall açıklaması yetersiz, fiyat belirsiz
- Çözüm: Apple HIG'a birebir uy — "Restore Purchase" button'u zorunlu, terms + privacy link'leri zorunlu

### Risk 2: RevenueCat outage
- RevenueCat üzerinden entitlement kontrol ediyorsak, down olunca ne olur?
- Çözüm: Offline cache — son başarılı entitlement state'i AsyncStorage'da tut, 48 saat boyunca güven

### Risk 3: Refund fırtınası
- Google Play 2-saat no-questions refund var
- Çözüm: 10 hatırlatıcı free tier yeterince değerli olsun ki kullanıcı "aldık ama yetmedi" deyip refund değil "aldık iyi çalışıyor" desin

### Risk 4: VAT/Tax karmaşası
- Apple + Google TR VAT %20'yi withholding yapar, sen fatura kesmekten muafsın
- Ama yıl sonunda gelen tutarı **vergi beyannamesinde gelir olarak** belirtmen gerek
- Muhasebeciye danış (ilk yıl sonunda)

---

## 📅 Timeline Özeti

```
Şimdi (Nisan 2026)
├─ Apple Developer onay bekleniyor
├─ Faz 1 launch'a hazırlık
│
+1 hafta → iOS TestFlight
+2 hafta → App Store + Play Store free launch
+4 hafta → Kullanıcı verisi + geri bildirim topla
│
+6 hafta (Haziran 2026) → Faz 2 başla
├─ RevenueCat entegrasyonu
├─ Paywall + rate limit
├─ Store products setup
│
+8 hafta (Haziran sonu) → v1.1 release
└─ Monetization canlı, MRR ölçümü başlar
```

---

*Bu plan Faz 2 öncesi revize edilebilir — pazar verisi geldikçe fiyat/tier güncellenebilir.*
