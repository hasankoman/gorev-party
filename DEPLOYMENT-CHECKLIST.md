# 🚀 Deployment Checklist

Arkadaşlarınla test etmeden önce bu checklist'i tamamla!

## 📋 Pre-Deployment Checklist

### ✅ Local Testing

- [ ] `npm run dev` çalışıyor
- [ ] Socket bağlantısı çalışıyor (`localhost:3002/health`)
- [ ] Oda oluşturma/katılma çalışıyor
- [ ] Görev dağıtımı çalışıyor
- [ ] "Görevimi tamamladım" butonu çalışıyor
- [ ] Progress tracking çalışıyor
- [ ] 2+ sekmeyle test ettim

### 🔧 Environment Setup

- [ ] Railway/Render hesabı oluşturdum
- [ ] Vercel hesabı var
- [ ] Railway CLI yükledim: `npm install -g @railway/cli`
- [ ] Vercel CLI yükledim: `npm install -g vercel`

## 🚀 Deployment Steps

### 1. Socket Server Deployment

- [ ] `./scripts/deploy.sh` çalıştırdım
- [ ] Railway deployment başarılı
- [ ] Socket URL aldım (örn: `https://xxx.up.railway.app`)
- [ ] Health check çalışıyor: `curl https://xxx.up.railway.app/health`

### 2. Frontend Deployment

- [ ] Socket URL'i environment variable'a ekledim
- [ ] `npm run build` başarılı
- [ ] Vercel deployment başarılı
- [ ] Frontend URL aldım (örn: `https://xxx.vercel.app`)
- [ ] Health check çalışıyor: `curl https://xxx.vercel.app/api/health`

### 3. Cross-Service Testing

- [ ] Frontend'den socket'e bağlantı çalışıyor
- [ ] CORS hatası yok
- [ ] Real-time events çalışıyor
- [ ] Farklı cihazlardan test ettim

## 🧪 Production Testing

### Fonksiyonel Test

- [ ] Ana sayfa yükleniyor
- [ ] Socket bağlantısı kuruluyor (yeşil durum)
- [ ] Public oda oluşturabiliyorum
- [ ] Private oda oluşturabiliyorum
- [ ] Odaya katılabiliyorum
- [ ] Oyuncu listesi güncellenio
- [ ] "Hazırım" butonu çalışıyor
- [ ] Host olarak oyun başlatabiliyorum
- [ ] Görev atanıyor
- [ ] "Görevimi tamamladım" çalışıyor
- [ ] Progress bar güncelleniyor
- [ ] Tüm görevler tamamlandığında next phase mesajı

### Multi-User Test

- [ ] 2+ kişi aynı anda bağlanabiliyor
- [ ] Real-time sync çalışıyor
- [ ] Disconnect/reconnect çalışıyor
- [ ] Farklı tarayıcılarda test ettim
- [ ] Mobil cihazlarda test ettim

### Performance Test

- [ ] Sayfa yüklenme hızı iyi (<3 saniye)
- [ ] Socket latency düşük (<500ms)
- [ ] Memory leak yok (DevTools ile kontrol)
- [ ] Multiple room'lar çalışıyor

## 📱 Mobile Compatibility

- [ ] iPhone Safari'de test ettim
- [ ] Android Chrome'da test ettim
- [ ] Touch interactions çalışıyor
- [ ] Responsive design düzgün
- [ ] Virtual keyboard UI'ı bozmuyor

## 🔍 Error Handling

- [ ] Internet bağlantısı kesildiğinde graceful handling
- [ ] Socket disconnect/reconnect çalışıyor
- [ ] 404 sayfaları düzgün
- [ ] Error messages kullanıcı dostu
- [ ] Console'da kritik error yok

## 🌐 SEO & Meta

- [ ] Page title doğru
- [ ] Meta description var
- [ ] Favicon var
- [ ] Open Graph tags (sosyal medya için)

## 📊 Monitoring

- [ ] Railway dashboard'dan server logları kontrol ettim
- [ ] Vercel dashboard'dan frontend logları kontrol ettim
- [ ] Error tracking setup (opsiyonel)

## 🎯 Go-Live Checklist

### Son Kontroller

- [ ] Production URL'ler çalışıyor
- [ ] Domain names doğru (eğer custom domain kullanıyorsan)
- [ ] SSL certificates aktif (https)
- [ ] CORS policy'ler doğru
- [ ] Environment variables production'a set

### Arkadaşlarınla Test

- [ ] URL'i arkadaşlarına gönderdin
- [ ] En az 2-3 kişiyle beraber test ettin
- [ ] Farklı şehirlerden/network'lerden test ettin
- [ ] Feedback aldın ve düzeltttin

## 🆘 Emergency Rollback

Eğer bir şey ters giderse:

```bash
# Railway rollback
railway rollback

# Vercel rollback
vercel rollback

# Veya previous deployment'ı promote et
vercel promote https://xxx-git-main-username.vercel.app
```

## 🎉 Launch Ready!

Tüm checkboxları ✅ yaptıysan, arkadaşlarınla oynamaya hazırsın!

**Launch URL'lerin:**

- Frontend: `https://your-app.vercel.app`
- Socket API: `https://your-app.up.railway.app`

---

**🎮 İyi oyunlar!** 🚀
