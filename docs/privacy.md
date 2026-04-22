---
layout: default
title: Gizlilik Politikası — Voicely AI
permalink: /privacy/
---

# Voicely AI — Gizlilik Politikası

**Son güncelleme:** 22 Nisan 2026

Bu gizlilik politikası, Voicely AI uygulaması ("Uygulama", "biz") tarafından toplanan verilerin nasıl işlendiğini açıklar. Uygulamayı kullanarak bu politikayı kabul etmiş sayılırsınız.

## 1. Veri Sorumlusu

Voicely AI bireysel bir geliştirici tarafından geliştirilmektedir. Her türlü soru, talep ve KVKK kapsamındaki haklarınız için iletişim:

- **E-posta:** blaixs@gmail.com

## 2. Topladığımız Veriler

### 2.1 Hesap Verileri
Uygulamayı kullanabilmek için bir hesap oluşturmanız gerekir. Bu kapsamda:
- **E-posta adresi** — Kimlik doğrulama amacıyla
- **Şifre** — Güvenli bir şekilde hash'lenmiş olarak saklanır (açık metin olarak tutulmaz)

### 2.2 Kullanıcı İçeriği
Uygulamayı kullanırken oluşturduğunuz tüm içerik:
- **Sesli kayıtlar** — İşlendikten sonra **saklanmaz** (aşağıdaki 3.1 bölümüne bakın)
- **Hatırlatıcı başlığı, tarihi ve notları** — Veritabanımızda saklanır
- **Cari (kişi/firma) bilgileri** — Ad, firma, telefon, e-posta, notlar

### 2.3 Teknik Veriler
- **Zaman dilimi (timezone)** — Hatırlatıcıları doğru saatte planlayabilmek için
- **Cihaz bildirim ID'si** — Yerel bildirim göndermek için (cihazınızdan çıkmaz)

### 2.4 Toplamadığımız Veriler
- **Konum bilgisi** — Hiçbir zaman toplanmaz
- **Kişi rehberiniz** — Erişim istemez, okumayız
- **Reklam tanımlayıcıları (IDFA, AAID)** — Kullanmayız
- **Analitik/takip verileri** — Üçüncü taraf analitik SDK kullanmıyoruz

## 3. Verilerin Kullanımı ve İşlenmesi

### 3.1 Sesli Kayıt Akışı (En Önemli Nokta)

Mikrofona basılı tuttuğunuzda oluşan ses kaydı şu aşamalardan geçer:

1. **Cihazınızda kayıt** — Ses dosyası geçici olarak cihazınızın yerel depolamasında tutulur
2. **Supabase Edge Function'a iletim** — HTTPS üzerinden şifreli olarak sunucuya gönderilir
3. **OpenAI Whisper API ile metne çevrim** — Ses metne çevrilir
4. **OpenAI GPT-4 ile ayrıştırma** — Metinden hatırlatıcı bilgileri çıkarılır
5. **Ses dosyasının silinmesi** — İşlem biter bitmez hem cihazdaki geçici dosya hem sunucu tarafındaki geçici dosya **silinir**. Ses kaydı hiçbir yerde kalıcı olarak saklanmaz.
6. **Metnin kaydedilmesi** — Yalnızca ayrıştırılmış sonuç (başlık, tarih vs.) veritabanımıza yazılır.

### 3.2 Üçüncü Taraf Servisler

Uygulamamız aşağıdaki servislerle çalışır:

| Servis | Ne için kullanıldığı | Veri konumu |
|--------|----------------------|-------------|
| **Supabase** | Kimlik doğrulama + veritabanı | EU (Frankfurt) |
| **OpenAI Whisper** | Sesten metne çevrim | ABD (OpenAI sunucuları) |
| **OpenAI GPT-4** | Metin ayrıştırma (hatırlatıcı çıkarma) | ABD (OpenAI sunucuları) |
| **Expo Notifications** | Yerel bildirim planlama | Cihazınızda yerel |

OpenAI sunucularına gönderilen ses/metin verileri OpenAI'nin [kullanım politikaları](https://openai.com/policies/api-data-usage-policies) çerçevesinde işlenir. OpenAI, API üzerinden gelen verileri **model eğitimi için kullanmayacağını** taahhüt etmiştir (30 gün saklayıp silmektedir).

### 3.3 Veri Paylaşımı ve Satışı

- Verilerinizi **hiçbir zaman üçüncü taraflara satmayız**
- Verilerinizi reklam amacıyla kullanmayız
- Hukuki zorunluluk (mahkeme kararı) haricinde üçüncü taraflarla paylaşmayız

## 4. Verilerinizin Saklama Süresi

- **Ses kayıtları** — İşlem biter bitmez silinir (saniyeler içinde)
- **Hatırlatıcılar ve cariler** — Siz silene kadar saklanır
- **Hesap bilgileri** — Hesabınızı sildiğiniz an tamamen silinir

## 5. Haklarınız (KVKK / GDPR)

Aşağıdaki haklara sahipsiniz:

- **Erişim hakkı** — Hakkınızda tuttuğumuz tüm verileri talep edebilirsiniz
- **Düzeltme hakkı** — Yanlış verilerin düzeltilmesini isteyebilirsiniz
- **Silme hakkı** — Tüm verilerinizin silinmesini talep edebilirsiniz ("unutulma hakkı")
- **İtiraz hakkı** — Verilerinizin işlenmesine itiraz edebilirsiniz
- **Taşınabilirlik hakkı** — Verilerinizi yapılandırılmış formatta isteyebilirsiniz

Tüm talepleriniz için: **blaixs@gmail.com** — en geç 30 gün içinde yanıt veririz.

## 6. Güvenlik Önlemleri

- **HTTPS/TLS** — Cihaz ile sunucu arasındaki tüm trafik şifrelidir
- **Row-Level Security (RLS)** — Her kullanıcı yalnızca kendi verilerini görebilir, veritabanı seviyesinde enforce edilir
- **Şifre hash'leme** — Şifreler asla açık metin saklanmaz (bcrypt)
- **JWT authentication** — Her istek doğrulanır

## 7. Çocuklar

Uygulama 13 yaş altı çocuklara yönelik değildir. Bilerek 13 yaş altı kullanıcılardan veri toplamayız. 13 yaş altı bir kullanıcının veri gönderdiğini fark edersek derhal sileriz.

## 8. Politika Değişiklikleri

Bu politika güncellenebilir. Önemli değişiklikleri uygulama içinde ve bu sayfada duyururuz. Politika'nın en güncel versiyonu her zaman bu sayfada yer alır.

## 9. İletişim

Sorularınız, talepleriniz ve şikayetleriniz için:

- **E-posta:** blaixs@gmail.com
- **Uygulama:** Voicely AI (iOS / Android)

---

*Bu politika Apple App Store Review Guidelines 5.1.1 ve 5.1.2 gereksinimlerine uygun olarak hazırlanmıştır.*
