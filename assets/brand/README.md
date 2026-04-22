# Voicely AI — Brand Assets

Bu klasör marka görsellerini saklamak içindir. Expo runtime'ı bu klasörü kullanmaz — sadece referans amaçlı.

## Dosya Listesi

| Dosya | Boyut | Kullanım | Durum |
|-------|-------|----------|-------|
| `logo-wordmark.png` | 1024x820 veya üzeri | Landing, marketing, GitHub README | ⏳ **Eklenecek** |
| `logo-mark.png` | 1024x1024 kare (yazısız, alpha'sız) | → `../icon.png` olarak kopyalanacak | ⏳ **Eklenecek** |
| `feature-graphic.png` | 1024x500 | Google Play Store üst banner | ⏳ Opsiyonel |

## Kullanım

### Wordmark logo (tam logo + yazı)
- Landing page (`docs/index.md`)
- App Store screenshot'larının overlay'inde
- GitHub README'sinde

### Mark-only icon (sadece işaret)
Bu dosya **1024x1024 px, kare, yazısız, alpha kanalsız** olmalı:
1. `brand/logo-mark.png` olarak kaydet
2. `assets/icon.png` dosyasını sil
3. Şu komutla kopyala:
   ```bash
   cp brand/logo-mark.png ../icon.png
   ```
4. `adaptive-icon.png` ve `splash-icon.png`'yi de güncelle (Android için foreground)

## Icon Gereksinimleri

### Apple App Store
- 1024x1024 PNG
- **No alpha channel** (beyaz veya solid zemin)
- **No rounded corners** (iOS otomatik yuvarlar)
- **No transparency**

### Google Play Store
- 512x512 PNG (store listing)
- Alpha channel kabul edilir

### Android adaptive icon
- Foreground: 1024x1024 PNG (alpha var, sadece logo)
- Background: Düz renk (`#ffffff`)
- İçerik "safe zone" içinde: merkez 66% (kenarlar farklı launcher'larda kırpılabilir)

## AI Icon Generator Prompt (referans)

```
Flat minimal app icon, blue-purple gradient (#4F46E5 to #818CF8),
circular speech bubble mark with checkmark inside,
sound waves on both sides, no text, solid white square background,
1024x1024, crisp edges, no shadow, no transparency
```
