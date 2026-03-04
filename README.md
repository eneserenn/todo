# Todo Uygulaması

Yapay zeka destekli, yönetici-çalışan rollerine sahip tam kapsamlı bir görev yönetim uygulaması. Next.js, PostgreSQL ve yerel LLM entegrasyonu ile geliştirilmiştir.

## Özellikler

### Görev Yönetimi
- Görev oluşturma, düzenleme, silme ve tamamlama
- Tarihe göre görev atama ve takvim görünümü
- Geçmiş tamamlanmamış görevler bugüne otomatik taşınır
- Görev açıklamaları ve alt görev desteği

### Alt Görev Yönetimi
- Görevlere alt görev ekleme ve yönetme
- Alt görevleri tamamlama ve silme
- Yapay zeka ile otomatik alt görev oluşturma

### Görev Havuzu (Yönetici/Çalışan Sistemi)
- Yöneticiler ortak havuzda görev oluşturur
- Çalışanlar havuzdan görev talep eder
- Talep edilen görevler çalışanın takvimine otomatik eklenir

### Yapay Zeka Özellikleri
- Günlük görev özeti oluşturma
- Yöneticiler için ekip üretkenlik raporu
- Görev başlığından otomatik alt görev önerileri
- Veritabanında özelleştirilebilir AI prompt yönetimi

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Dil | TypeScript 5 |
| Kimlik Doğrulama | NextAuth.js 4 (JWT) |
| Veritabanı | PostgreSQL 15 |
| ORM | Prisma 6 |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| İkonlar | Lucide React |
| Form Yönetimi | React Hook Form + Zod |
| Yapay Zeka | OpenAI SDK (Ollama/LMStudio uyumlu) |
| Konteyner | Docker + Docker Compose |

## Başlangıç

### Gereksinimler

- [Docker](https://www.docker.com/) ve Docker Compose
- (Opsiyonel) AI özellikleri için [Ollama](https://ollama.com/)

### Docker ile Kurulum (Önerilen)

1. Repoyu klonlayın:
   ```bash
   git clone <repo-url>
   cd todo-app
   ```

2. Ortam değişkenlerini ayarlayın:
   ```bash
   cp .env.example .env
   ```
   `.env` dosyasını düzenleyin:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@db:5432/tododb?schema=public"
   NEXTAUTH_SECRET="guclu-ve-gizli-bir-anahtar"
   NEXTAUTH_URL="http://localhost:3000"
   LOCAL_LLM_URL="http://host.docker.internal:11434/v1"
   ```

3. Servisleri başlatın:
   ```bash
   docker compose up -d
   ```

4. Veritabanı migrasyonlarını çalıştırın:
   ```bash
   docker compose exec app npx prisma migrate dev
   ```

5. Uygulamaya erişin: [http://localhost:3000](http://localhost:3000)

### Yerel Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env` dosyasını oluşturun:
   ```env
   DATABASE_URL="postgresql://localhost:5432/tododb?schema=public"
   NEXTAUTH_SECRET="guclu-ve-gizli-bir-anahtar"
   NEXTAUTH_URL="http://localhost:3000"
   LOCAL_LLM_URL="http://localhost:11434/v1"
   ```

3. Veritabanını hazırlayın:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Yapay Zeka Kurulumu (Opsiyonel)

AI özelliklerini kullanmak için OpenAI API uyumlu bir yerel LLM sunucusu gereklidir.

**Ollama ile:**
```bash
# Ollama'yı kurun ve bir model indirin
ollama pull llama3.2

# Sunucu varsayılan olarak http://localhost:11434 adresinde çalışır
```

**Docker kullanıyorsanız** `LOCAL_LLM_URL` değerini şu şekilde ayarlayın:
```env
LOCAL_LLM_URL="http://host.docker.internal:11434/v1"
```

## Kullanıcı Rolleri

### Yönetici (MANAGER)
- Kendi görevlerini yönetir
- Çalışanlara atanacak görev havuzu oluşturur
- Ekibin günlük aktivite özetini görüntüler

### Çalışan (EMPLOYEE)
- Kendi görevlerini yönetir
- Yöneticinin görev havuzundan görev talep eder
- Günlük görev özetini görüntüler

## Kayıt Akışı

1. `/register` sayfasına gidin
2. Ad, e-posta ve şifre girin
3. Rol seçin: **Yönetici** veya **Çalışan**
4. Çalışan rolü seçildiyse bağlı olduğunuz yöneticiyi belirtin
5. `/login` ile giriş yapın

## API Endpointleri

### Kimlik Doğrulama
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/[...nextauth]` | Giriş/çıkış |
| POST | `/api/register` | Yeni kullanıcı kaydı |

### Görevler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/tasks?date={date}` | Tarihe göre görevleri getir |
| POST | `/api/tasks` | Yeni görev oluştur |
| PATCH | `/api/tasks/[id]` | Görevi güncelle |
| DELETE | `/api/tasks/[id]` | Görevi sil |

### Alt Görevler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/tasks/[id]/subtasks` | Alt görev oluştur |
| PATCH | `/api/subtasks/[id]` | Alt görevi güncelle |
| DELETE | `/api/subtasks/[id]` | Alt görevi sil |

### Görev Havuzu
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/pool` | Havuz görevlerini getir |
| POST | `/api/pool` | Havuza görev ekle (Yönetici) |
| POST | `/api/pool/claim/[id]` | Görevi talep et (Çalışan) |

### Yapay Zeka
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/ai/summary` | Günlük özet oluştur |
| POST | `/api/ai/subtasks` | Alt görev önerileri al |
| POST | `/api/ai/manager-summary` | Ekip özeti oluştur (Yönetici) |

## Veritabanı Şeması

```
User
├── id, name, email, password (hash)
├── role: MANAGER | EMPLOYEE
└── managerId (Çalışanlar için)

Task
├── id, title, description
├── date, isCompleted
├── isPoolTask (havuz görevi mi?)
├── createdById (oluşturan)
└── assignedToId (atanan çalışan)

Subtask
├── id, title, isCompleted
└── taskId (bağlı görev, cascade delete)

AiPrompt
├── id, name (benzersiz anahtar)
└── content (AI sistem promptu)
```

## Proje Yapısı

```
src/
├── app/
│   ├── api/              # API route handler'ları
│   │   ├── auth/         # NextAuth
│   │   ├── tasks/        # Görev CRUD
│   │   ├── subtasks/     # Alt görev CRUD
│   │   ├── pool/         # Görev havuzu
│   │   └── ai/           # Yapay zeka endpointleri
│   ├── dashboard/        # Ana panel (korumalı)
│   ├── login/            # Giriş sayfası
│   └── register/         # Kayıt sayfası
├── components/
│   ├── providers.tsx     # NextAuth oturum sağlayıcı
│   └── ui/               # shadcn/ui bileşenleri
└── lib/
    ├── auth.ts           # NextAuth yapılandırması
    ├── prisma.ts         # Prisma istemcisi
    ├── ai.ts             # Yapay zeka istemcisi
    └── utils.ts          # Yardımcı fonksiyonlar
```

## Ortam Değişkenleri

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `DATABASE_URL` | PostgreSQL bağlantı stringi | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | JWT imzalama anahtarı | Rastgele güçlü bir string |
| `NEXTAUTH_URL` | Uygulama base URL | `http://localhost:3000` |
| `LOCAL_LLM_URL` | Yerel LLM API adresi | `http://localhost:11434/v1` |

## Komutlar

```bash
npm run dev            # Geliştirme sunucusunu başlat
npm run build          # Prodüksiyon build'i oluştur
npm start              # Prodüksiyon sunucusunu çalıştır
npm run lint           # ESLint kontrolü
npx prisma studio      # Veritabanı arayüzünü aç
npx prisma migrate dev # Migrasyon oluştur ve uygula
```
