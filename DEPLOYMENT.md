# Görev Party - Deployment Rehberi 🚀

Bu rehber Görev Party uygulamasını production'a deploy etmek için gerekli adımları açıklar.

## 📋 Mimari Genel Bakış

Uygulamamız iki ayrı servisten oluşuyor:

- **Frontend (Next.js)** → Vercel'de deploy edilecek
- **Socket.IO Server** → Ayrı bir platformda deploy edilecek (Railway/Render/Heroku)

## 🎯 Deployment Stratejisi

### 1. Socket.IO Server Deployment (Railway - Önerilen)

Railway ücretsiz tier sunuyor ve Socket.IO için ideal.

#### A. Railway Hesabı Oluştur

1. [Railway.app](https://railway.app) sitesine git
2. GitHub ile sign up yap
3. Dashboard'a eriş

#### B. Socket Server'ı Hazırla

```bash
# 1. Socket server için ayrı bir klasör oluştur
mkdir gorev-party-socket
cd gorev-party-socket

# 2. package.json oluştur
npm init -y

# 3. Dependencies ekle
npm install socket.io express cors

# 4. Server dosyalarını kopyala
# (server/ klasöründeki tüm dosyaları buraya kopyala)
```

#### C. Production Server Konfigürasyonu

**server/index.js** dosyasını production için güncelle:

```javascript
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { setupSocketEvents } = require("./events");
const { getPublicRooms, getAllRooms } = require("./rooms");

const app = express();
const server = createServer(app);

// Production CORS konfigürasyonu
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3003",
  "https://your-app.vercel.app", // Vercel URL'inizi buraya yazın
  "https://*.vercel.app", // Tüm Vercel preview deploy'ları için
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  const rooms = getAllRooms();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "mission-game-socket",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    stats: {
      totalRooms: rooms.length,
      publicRooms: getPublicRooms().length,
      totalPlayers: rooms.reduce((sum, room) => sum + room.players.length, 0),
    },
  });
});

app.get("/api/public-rooms", (req, res) => {
  try {
    const publicRooms = getPublicRooms();
    res.json({
      success: true,
      rooms: publicRooms,
      count: publicRooms.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Odalar getirilemedi",
    });
  }
});

setupSocketEvents(io);

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`🚀 Socket sunucusu ${PORT} portunda çalışıyor`);
  console.log(`📡 Socket.IO endpoint: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
```

#### D. Railway'de Deploy

```bash
# 1. Railway CLI yükle
npm install -g @railway/cli

# 2. Login ol
railway login

# 3. Proje oluştur
railway new

# 4. Deploy et
railway up

# 5. Domain al (Railway size otomatik verir)
railway domain
```

### 2. Next.js Frontend Deployment (Vercel)

#### A. Environment Variables Ayarla

Vercel dashboard'da şu environment variable'ları ekle:

```env
# Production Socket URL (Railway'den aldığın URL)
NEXT_PUBLIC_SOCKET_URL=https://your-railway-app.up.railway.app

# Diğer config'ler
NODE_ENV=production
```

#### B. Socket Client Konfigürasyonunu Güncelle

**lib/socketClient.ts** dosyasında production URL'i kullan:

```typescript
class SocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private static instance: SocketClient | null = null;

  // Production socket URL
  private getSocketUrl(): string {
    if (typeof window !== "undefined") {
      // Client-side
      return process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002";
    }
    // Server-side fallback
    return "http://localhost:3002";
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socketUrl = this.getSocketUrl();
      console.log("🔗 Socket bağlantısı kuruluyor:", socketUrl);

      this.socket = io(socketUrl, {
        transports: ["websocket", "polling"], // Production için önemli
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // ... rest of the code
    });
  }
}
```

#### C. Vercel Deployment

```bash
# 1. Vercel CLI yükle (eğer yoksa)
npm install -g vercel

# 2. Login ol
vercel login

# 3. Deploy et
vercel

# 4. Production deploy
vercel --prod
```

## 🔧 Production Optimizasyonları

### 1. Environment-Specific Config

**next.config.ts** güncelle:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: true,
  },
  env: {
    SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  // Production optimization
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
```

### 2. Package.json Scripts Güncelle

**package.json** production scripts ekle:

```json
{
  "scripts": {
    "dev:next": "next dev --turbopack",
    "dev:socket": "SOCKET_PORT=3002 node server/index.js",
    "dev": "concurrently \"npm:dev:socket\" \"npm:dev:next\"",
    "build": "next build",
    "start": "next start",
    "start:socket": "NODE_ENV=production node server/index.js",
    "lint": "eslint",
    "deploy:socket": "railway up",
    "deploy:frontend": "vercel --prod"
  }
}
```

## 🌐 Domain Configuration

### 1. Custom Domain (Opsiyonel)

Railway ve Vercel'de custom domain ayarlayabilirsin:

- **Railway**: `your-socket-api.your-domain.com`
- **Vercel**: `your-app.your-domain.com`

### 2. Environment URLs

```env
# Development
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002

# Production
NEXT_PUBLIC_SOCKET_URL=https://your-railway-app.up.railway.app

# Custom Domain (if any)
NEXT_PUBLIC_SOCKET_URL=https://socket.your-domain.com
```

## 🧪 Test Checklist

Deploy ettikten sonra şu testleri yap:

- [ ] Socket bağlantısı çalışıyor mu?
- [ ] Oda oluşturma/katılma çalışıyor mu?
- [ ] Real-time events çalışıyor mu?
- [ ] Cross-origin requests çalışıyor mu?
- [ ] Mobil cihazlarda çalışıyor mu?

```bash
# Health check testleri
curl https://your-railway-app.up.railway.app/health
curl https://your-vercel-app.vercel.app/api/health
```

## 🚨 Troubleshooting

### Yaygın Sorunlar

#### 1. CORS Hatası

```
Access to XMLHttpRequest at 'socket-url' from origin 'frontend-url' has been blocked by CORS policy
```

**Çözüm**: Socket server'da CORS origin'leri güncelle

#### 2. Socket Bağlantı Hatası

```
WebSocket connection failed
```

**Çözüm**:

- Transport methods'u kontrol et: `['websocket', 'polling']`
- Railway'de port konfigürasyonunu kontrol et

#### 3. Environment Variables

```
NEXT_PUBLIC_SOCKET_URL is undefined
```

**Çözüm**: Vercel dashboard'da env variable'ları tekrar kontrol et

## 📱 Mobile Testing

Production'da mobil cihazlarda test etmek için:

1. QR code generator kullan (Vercel otomatik sağlıyor)
2. WiFi'de aynı ağda test et
3. Real device'larda test et

## 💰 Maliyet Bilgisi

- **Railway**: Ücretsiz tier (500 saat/ay)
- **Vercel**: Ücretsiz tier (hobby projeler için yeterli)
- **Total**: $0/ay (ücretsiz tier'lar dahilinde)

## 🔄 CI/CD (İleri Seviye)

GitHub Actions ile otomatik deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"

      # Socket server deploy
      - name: Deploy Socket Server
        run: |
          # Railway deployment commands

      # Frontend deploy
      - name: Deploy Frontend
        run: |
          npm install -g vercel
          vercel --token ${{ secrets.VERCEL_TOKEN }} --prod
```

## 📞 Support

Deployment sırasında sorun yaşarsan:

1. GitHub Issues'da soru sor
2. Discord/Telegram'dan ulaş
3. Documentation'ı kontrol et

**Happy Deployment! 🎉**
