# 🚀 Görev Party - Quick Start Guide

## 📦 Hızlı Deployment (5 dakika)

### Option 1: Otomatik Script (Önerilen)

```bash
# 1. Deployment script'ini çalıştır
./scripts/deploy.sh

# 2. "1" seçeneğini seç (Quick deploy)
# 3. Railway URL'ini gir (script size söyleyecek)
# 4. Bitene kadar bekle 🎉
```

### Option 2: Manuel Adımlar

#### A. Socket Server (Railway)

```bash
# 1. Railway hesabı aç: https://railway.app
# 2. Socket server hazırla
mkdir socket-server && cd socket-server

# 3. Package.json oluştur
cat > package.json << EOF
{
  "name": "gorev-party-socket",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "socket.io": "^4.7.5",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# 4. Server dosyalarını kopyala
cp -r ../server/* .

# 5. Railway CLI ile deploy
npx @railway/cli login
npx @railway/cli new
npx @railway/cli up
```

#### B. Frontend (Vercel)

```bash
# 1. Environment variable ekle
echo "NEXT_PUBLIC_SOCKET_URL=https://your-railway-url.up.railway.app" > .env.production.local

# 2. Vercel'e deploy
npx vercel login
npx vercel --prod
```

## 🌍 Live URL'ler

Deployment tamamlandıktan sonra:

- **Frontend**: `https://your-app.vercel.app`
- **Socket API**: `https://your-app.up.railway.app`

## 🧪 Test Et

```bash
# Health check
curl https://your-railway-url.up.railway.app/health
curl https://your-vercel-url.vercel.app/api/health

# Frontend test
# Tarayıcıda Vercel URL'ini aç ve arkadaşlarınla test et!
```

## 💡 Pro Tips

1. **Custom Domain**: Railway ve Vercel'de ücretsiz custom domain alabilirsin
2. **Environment Variables**: Production'da debug mode'u kapat
3. **Monitoring**: Railway dashboard'dan server loglarını takip et
4. **Mobile Test**: QR code ile mobil cihazlarda test et

## 🆘 Sorun mu var?

**CORS Hatası**: Railway'de CORS origin'leri güncelle  
**Socket Bağlantı Sorunu**: Environment variables kontrol et  
**Build Hatası**: Dependencies kontrol et

Detaylı troubleshooting için `DEPLOYMENT.md` dosyasına bak!

---

**🎮 Happy Gaming!** Arkadaşlarınla keyifli oyunlar! 🎉
