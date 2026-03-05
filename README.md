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

## Helm Chart ile OpenShift Deployment

### Gereksinimler

- [Helm 3+](https://helm.sh/docs/intro/install/)
- OpenShift CLI (`oc`) veya `kubectl`
- OpenShift 4.x kümesi
- Uygulamanın Docker imajı için erişilebilir bir container registry (örn. Quay.io, Docker Hub, OpenShift Internal Registry)

---

### 1. Docker İmajını Build ve Push Etme

```bash
# İmajı build edin
docker build -t your-registry.example.com/todo-app:latest .

# Registry'e push edin
docker push your-registry.example.com/todo-app:latest
```

OpenShift Internal Registry kullanıyorsanız:

```bash
# OpenShift'e giriş yapın
oc login --token=<token> --server=https://api.your-cluster.example.com:6443

# Internal registry adresini alın
REGISTRY=$(oc get route default-route -n openshift-image-registry --template='{{ .spec.host }}')

# Registry'e giriş yapın
docker login -u $(oc whoami) -p $(oc whoami --show-token) $REGISTRY

# İmajı tag'leyin ve push edin
docker tag todo-app:latest $REGISTRY/<namespace>/todo-app:latest
docker push $REGISTRY/<namespace>/todo-app:latest
```

---

### 2. Namespace / Project Oluşturma

```bash
# Yeni bir OpenShift projesi oluşturun
oc new-project todo-app-prod

# ya da mevcut projeye geçin
oc project todo-app-prod
```

---

### 3. `values.yaml` Dosyasını Özelleştirme

`helm/todo-app/values.yaml` dosyasını kendi ortamınıza göre düzenleyin:

```yaml
# İmaj adresi (kendi registry'inizi yazın)
image:
  repository: your-registry.example.com/todo-app
  tag: latest
  pullPolicy: IfNotPresent

replicaCount: 2

app:
  port: 3000

  # Kümenizin gerçek route adresi
  nextauthUrl: "https://todo-app.apps.your-cluster.example.com"

  # Güçlü bir secret üretin: openssl rand -base64 32
  nextauthSecret: "CHANGE_ME_USE_A_STRONG_SECRET_AT_LEAST_32_CHARS"

  # Varsa Ollama / LLM servis adresi
  localLlmUrl: "http://ollama:11434/v1"

postgresql:
  enabled: true          # false yaparak harici DB kullanabilirsiniz
  database: tododb
  user: postgres
  password: "CHANGE_ME_POSTGRES_PASSWORD"
  storage: 5Gi
  storageClass: ""       # Boş bırakırsanız cluster default kullanılır

route:
  enabled: true
  host: ""               # Boş bırakırsanız OpenShift otomatik atar
  tls:
    enabled: true
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

> **Güvenlik notu:** `nextauthSecret` ve `postgresql.password` değerlerini asla varsayılan haliyle bırakmayın. Üretim ortamında `--set` flag'i veya ayrı bir `secrets.yaml` dosyası kullanın.

---

### 4. Private Registry için Image Pull Secret Oluşturma

Registry'niz özel ise OpenShift'e kimlik bilgisi tanımlayın:

```bash
# Docker Hub / Quay.io için
oc create secret docker-registry registry-secret \
  --docker-server=your-registry.example.com \
  --docker-username=<kullanici> \
  --docker-password=<sifre> \
  --docker-email=<email>

# values.yaml içinde secret adını belirtin
# imagePullSecrets:
#   - name: registry-secret
```

---

### 5. Helm ile Deploy Etme

```bash
# Helm chart'ı doğrulayın (dry-run)
helm install todo-app ./helm/todo-app \
  --namespace todo-app-prod \
  --dry-run --debug

# Gerçek kurulumu başlatın
helm install todo-app ./helm/todo-app \
  --namespace todo-app-prod \
  --set image.repository=your-registry.example.com/todo-app \
  --set image.tag=latest \
  --set app.nextauthSecret=$(openssl rand -base64 32) \
  --set postgresql.password=guclu-bir-sifre
```

Hassas değerleri ayrı bir dosyada tutmak isterseniz:

```bash
# secrets-override.yaml (git'e eklemeyin!)
cat > /tmp/secrets-override.yaml <<EOF
app:
  nextauthSecret: "$(openssl rand -base64 32)"
  nextauthUrl: "https://todo-app.apps.your-cluster.example.com"
postgresql:
  password: "guclu-bir-sifre"
image:
  repository: your-registry.example.com/todo-app
  tag: v1.2.3
EOF

helm install todo-app ./helm/todo-app \
  --namespace todo-app-prod \
  -f /tmp/secrets-override.yaml
```

---

### 6. Deployment Durumunu Kontrol Etme

```bash
# Helm release durumu
helm status todo-app -n todo-app-prod

# Pod'ların durumu
oc get pods -n todo-app-prod

# Uygulama logları
oc logs -f deployment/todo-app -n todo-app-prod

# Init container (migrasyon) logları
oc logs -f <pod-adi> -c migrate -n todo-app-prod

# Oluşturulan Route (URL) adresini görün
oc get route todo-app -n todo-app-prod
```

---

### 7. Güncelleme (Helm Upgrade)

```bash
# İmaj tag'ini güncelleyerek yeniden deploy edin
helm upgrade todo-app ./helm/todo-app \
  --namespace todo-app-prod \
  --reuse-values \
  --set image.tag=v1.2.3

# Tüm values ile birlikte upgrade
helm upgrade todo-app ./helm/todo-app \
  --namespace todo-app-prod \
  -f /tmp/secrets-override.yaml
```

---

### 8. Kaldırma

```bash
# Release'i kaldırın (PVC'ler silinmez)
helm uninstall todo-app -n todo-app-prod

# PostgreSQL verisini de silmek için PVC'yi manuel silin
oc delete pvc -l app.kubernetes.io/instance=todo-app -n todo-app-prod
```

---

### Helm Chart Yapısı

```
helm/todo-app/
├── Chart.yaml              # Chart metadata (isim, versiyon)
├── values.yaml             # Varsayılan konfigürasyon değerleri
└── templates/
    ├── _helpers.tpl        # Yardımcı template fonksiyonları
    ├── configmap.yaml      # NEXTAUTH_URL, LLM_URL gibi env değerleri
    ├── secret.yaml         # DATABASE_URL, NEXTAUTH_SECRET (şifreli)
    ├── deployment.yaml     # Uygulama Deployment (init container ile migrasyon)
    ├── service.yaml        # ClusterIP Service
    ├── route.yaml          # OpenShift Route (TLS desteğiyle)
    ├── db-statefulset.yaml # PostgreSQL StatefulSet
    ├── db-service.yaml     # PostgreSQL headless Service
    ├── serviceaccount.yaml # ServiceAccount (restricted-v2 SCC uyumlu)
    └── NOTES.txt           # Kurulum sonrası yardım mesajı
```

#### Önemli Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Init Container** | Her deploy'da `prisma db push` çalıştırarak DB şemasını otomatik günceller |
| **OpenShift SCC** | `restricted-v2` SCC ile tam uyumlu pod security context |
| **TLS Route** | Edge termination ile HTTPS trafiği otomatik yönetilir |
| **Rolling Update** | `maxUnavailable: 0` ile sıfır kesintili güncelleme |
| **Resource Limits** | CPU/bellek talep ve limitleri varsayılan olarak tanımlıdır |
| **Harici DB Desteği** | `postgresql.enabled: false` + `postgresql.externalUrl` ile harici DB kullanılabilir |

---

### Harici PostgreSQL Kullanımı

Kendi veritabanınızı kullanmak istiyorsanız:

```yaml
# values.yaml
postgresql:
  enabled: false
  externalUrl: "postgresql://kullanici:sifre@db-host:5432/tododb"
```

---

### Sorun Giderme

```bash
# Pod'un neden başlamadığını inceleyin
oc describe pod <pod-adi> -n todo-app-prod

# Tüm event'leri listeleyin
oc get events -n todo-app-prod --sort-by='.lastTimestamp'

# Secret ve ConfigMap içeriklerini kontrol edin
oc get secret todo-app -n todo-app-prod -o yaml
oc get configmap todo-app -n todo-app-prod -o yaml

# Route'un doğru oluştuğunu doğrulayın
oc describe route todo-app -n todo-app-prod
```

---

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
