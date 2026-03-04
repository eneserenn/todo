import { PrismaClient, Priority } from "@prisma/client"

const prisma = new PrismaClient()

// Helpers
function daysAgo(n: number): Date {
    const d = new Date()
    d.setDate(d.getDate() - n)
    d.setHours(0, 0, 0, 0)
    return d
}

function rand<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"]

// ── Task data per person ───────────────────────────────────────────────────

const TASK_SETS: Record<string, Array<{
    title: string
    description?: string
    priority: Priority
    dayOffset: number // 0 = today, 1 = yesterday, ...
    isCompleted: boolean
    subtasks?: string[]
}>> = {
    "mustafa@gmail.com": [
        { title: "Sistem güvenlik politikasını gözden geçir", description: "Tüm güvenlik protokollerini ve erişim yetkilerini kontrol et", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Erişim loglarını incele", "Şifre politikasını güncelle", "2FA zorunluluğunu uygula"] },
        { title: "Q1 bütçe raporunu hazırla", description: "Ocak-Mart dönemi harcama ve gelir analizi", priority: "URGENT", dayOffset: 5, isCompleted: true, subtasks: ["Harcama kalemlerini topla", "Gelir grafiğini çiz", "Yönetim sunumu hazırla"] },
        { title: "Yeni personel oryantasyon planı", description: "Mart ayında işe başlayacak personel için program hazırla", priority: "MEDIUM", dayOffset: 4, isCompleted: true },
        { title: "Sunucu altyapısını değerlendir", description: "Mevcut sunucuların kapasitesi ve upgrade ihtiyacı", priority: "HIGH", dayOffset: 3, isCompleted: true, subtasks: ["Disk kullanımını kontrol et", "RAM ve CPU metrikleri al", "Upgrade tekliflerini karşılaştır"] },
        { title: "KOS grubu toplantısı düzenle", description: "Aylık performans değerlendirme toplantısı için gündem oluştur", priority: "MEDIUM", dayOffset: 2, isCompleted: true },
        { title: "Yazılım lisans yenilemelerini kontrol et", description: "Süresi dolmak üzere olan lisansları listele ve yenile", priority: "HIGH", dayOffset: 1, isCompleted: true },
        { title: "Admin paneli erişim loglarını incele", description: "Son 30 günün sistem erişimlerini denetle", priority: "LOW", dayOffset: 0, isCompleted: false, subtasks: ["Login loglarını export et", "Şüpheli girişleri işaretle"] },
        { title: "Çalışan memnuniyet anketi tasarla", description: "Yıllık anket formunu güncelle ve dağıt", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
        { title: "Yedekleme prosedürlerini test et", description: "Disaster recovery senaryolarını simüle et", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Full backup al", "Restore testi yap", "RPO/RTO ölçümlerini kaydet"] },
    ],

    "goksun@gmail.com": [
        { title: "Ekip haftalık sprint planlaması", description: "Enes, Bengisu, Esin, Ali ve Erkan için görev dağılımı yap", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Öncelikleri belirle", "Görevleri ata", "Takvim bloklarını ayarla"] },
        { title: "Müşteri sunumu hazırla", description: "Proje ilerleme raporu için slaytları tamamla", priority: "URGENT", dayOffset: 5, isCompleted: true, subtasks: ["KPI'ları güncelle", "Demo videosu hazırla", "Grafikleri ekle"] },
        { title: "Kod review süreci tanımla", description: "Pull request şablonu ve review kriterleri oluştur", priority: "MEDIUM", dayOffset: 4, isCompleted: true },
        { title: "Aylık performans değerlendirme raporları", description: "Her çalışan için bireysel değerlendirme yaz", priority: "HIGH", dayOffset: 3, isCompleted: true, subtasks: ["Enes raporu", "Bengisu raporu", "Esin raporu", "Ali raporu", "Erkan raporu"] },
        { title: "CI/CD pipeline optimizasyonu", description: "Build sürelerini kısaltmak için pipeline'ı incele", priority: "MEDIUM", dayOffset: 2, isCompleted: true },
        { title: "Test coverage raporunu gözden geçir", description: "Düşük coverage'lı modülleri tespit et", priority: "HIGH", dayOffset: 1, isCompleted: true },
        { title: "Yeni özellik roadmap güncellemesi", description: "Q2 için planlanan özellikleri listele ve önceliklendir", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
        { title: "Teknik borç listesi oluştur", description: "Refactor edilmesi gereken kod alanlarını belgele", priority: "LOW", dayOffset: 0, isCompleted: false, subtasks: ["Legacy modülleri listele", "Tahmini efor hesapla"] },
        { title: "Ekip eğitim ihtiyaç analizi", description: "Hangi teknolojilerde eğitim gerekli?", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
    ],

    "enes@gmail.com": [
        { title: "Login sayfası validasyon hataları düzelt", description: "Email format ve şifre uzunluğu kontrollerini güçlendir", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Email regex güncelle", "Hata mesajlarını Türkçeleştir", "Unit test yaz"] },
        { title: "Dashboard analitik widgetları geliştir", description: "Görev tamamlanma oranı grafiği ekle", priority: "MEDIUM", dayOffset: 5, isCompleted: true },
        { title: "API rate limiting implemente et", description: "Her endpoint için rate limit kuralları tanımla", priority: "HIGH", dayOffset: 4, isCompleted: true, subtasks: ["Middleware yaz", "Redis entegre et", "Limitleri konfigüre et"] },
        { title: "Mobil responsive düzenlemeleri", description: "Tablet ve telefon görünümlerindeki layout sorunlarını gider", priority: "MEDIUM", dayOffset: 3, isCompleted: true },
        { title: "Veritabanı sorgu optimizasyonu", description: "N+1 query sorunlarını bul ve düzelt", priority: "HIGH", dayOffset: 2, isCompleted: true, subtasks: ["Slow query loglarını incele", "Index'leri kontrol et", "Eager loading ekle"] },
        { title: "Bildirim sistemi entegrasyonu", description: "Email ve in-app bildirim altyapısını kur", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "Kullanıcı profil sayfası tasarımı", description: "Avatar yükleme ve profil düzenleme ekranı", priority: "LOW", dayOffset: 0, isCompleted: false, subtasks: ["Figma tasarımı incele", "Component yaz", "Upload API bağla"] },
        { title: "Search functionality geliştir", description: "Global arama özelliğini implement et", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
        { title: "E2E test senaryoları yaz", description: "Kritik kullanıcı akışları için Playwright testleri", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Login flow", "Task creation flow", "Pool claim flow"] },
    ],

    "bengisu@gmail.com": [
        { title: "UI component kütüphanesi dokümantasyonu", description: "Storybook ile bileşen kataloğunu güncelle", priority: "MEDIUM", dayOffset: 6, isCompleted: true, subtasks: ["Button varyantlarını ekle", "Form bileşenlerini belgele"] },
        { title: "Dark mode implementasyonu", description: "Uygulamaya karanlık tema desteği ekle", priority: "HIGH", dayOffset: 5, isCompleted: true, subtasks: ["CSS değişkenlerini tanımla", "Toggle butonu ekle", "LocalStorage'a kaydet"] },
        { title: "Accessibility audit gerçekleştir", description: "WCAG 2.1 standartlarına uygunluğu kontrol et", priority: "HIGH", dayOffset: 4, isCompleted: true },
        { title: "Animasyon ve geçiş efektleri", description: "Sayfa geçişleri ve modal animasyonlarını iyileştir", priority: "LOW", dayOffset: 3, isCompleted: true, subtasks: ["Framer Motion kurulumu", "Route geçiş animasyonu", "Modal fade-in/out"] },
        { title: "Form validation UX iyileştirmesi", description: "Gerçek zamanlı validasyon geri bildirimi ekle", priority: "MEDIUM", dayOffset: 2, isCompleted: true },
        { title: "Takvim bileşeni geliştirme", description: "Görev tarihleri için custom date picker", priority: "HIGH", dayOffset: 1, isCompleted: true },
        { title: "Performans optimizasyonu — bundle size", description: "Kullanılmayan bağımlılıkları kaldır ve lazy loading ekle", priority: "MEDIUM", dayOffset: 0, isCompleted: false, subtasks: ["Bundle analyzer çalıştır", "Dead code tespit et", "Dynamic import ekle"] },
        { title: "Error boundary implementasyonu", description: "Global hata yönetimi için React Error Boundary kur", priority: "HIGH", dayOffset: 0, isCompleted: false },
        { title: "Skeleton loading state'leri ekle", description: "Veri yüklenirken placeholder göster", priority: "LOW", dayOffset: 0, isCompleted: false },
    ],

    "esin@gmail.com": [
        { title: "Kullanıcı araştırması analiz raporu", description: "Kullanıcı görüşmelerinden çıkan bulgular ve öneriler", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Görüşme notlarını topla", "Temaları kategorize et", "Öneri listesi oluştur"] },
        { title: "Onboarding flow yeniden tasarımı", description: "Yeni kullanıcı deneyimini iyileştir", priority: "URGENT", dayOffset: 5, isCompleted: true, subtasks: ["Mevcut flow analizi", "Wireframe çiz", "Prototip hazırla"] },
        { title: "Email şablonlarını güncelle", description: "Hoşgeldiniz, sıfırlama ve bildirim emaillerini yenile", priority: "MEDIUM", dayOffset: 4, isCompleted: true },
        { title: "Kullanıcı segmentasyon analizi", description: "Aktif, pasif ve kayıp kullanıcıları segmente et", priority: "HIGH", dayOffset: 3, isCompleted: true },
        { title: "A/B test planı hazırla", description: "Kayıt sayfası varyantları için test metodolojisi belirle", priority: "MEDIUM", dayOffset: 2, isCompleted: true },
        { title: "Help center içerikleri yaz", description: "Sık sorulan sorular ve rehber makaleleri hazırla", priority: "LOW", dayOffset: 1, isCompleted: true },
        { title: "NPS anketi analizi", description: "Son çeyrekteki NPS sonuçlarını değerlendir", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Veriyi export et", "Detractor yorumlarını categorize et", "Aksiyon planı yaz"] },
        { title: "Rakip ürün benchmarking", description: "3 rakip ürünle özellik ve UX karşılaştırması", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
        { title: "Kullanıcı yolculuğu haritası güncelle", description: "Yeni özelliklere göre customer journey'i güncelle", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
    ],

    "ali@gmail.com": [
        { title: "Sunucu log analizi ve monitoring kurulumu", description: "Grafana ve Prometheus ile metrik takibi kur", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Prometheus kurulumu", "Dashboard oluştur", "Alert kuralları tanımla"] },
        { title: "Docker image boyutunu küçült", description: "Multi-stage build ile image'ları optimize et", priority: "MEDIUM", dayOffset: 5, isCompleted: true },
        { title: "SSL sertifika yenileme prosedürü", description: "Otomatik sertifika yenileme için Let's Encrypt kur", priority: "URGENT", dayOffset: 4, isCompleted: true, subtasks: ["Certbot kurulumu", "Cron job oluştur", "Test et"] },
        { title: "Nginx load balancer konfigürasyonu", description: "Yüksek trafik için load balancing ayarla", priority: "HIGH", dayOffset: 3, isCompleted: true },
        { title: "Veritabanı yedekleme scripti yaz", description: "Günlük otomatik PostgreSQL yedekleme scripti", priority: "HIGH", dayOffset: 2, isCompleted: true, subtasks: ["Script yaz", "S3 entegrasyon ekle", "Cron'a ekle"] },
        { title: "Kubernetes cluster kurulumu araştır", description: "Üretim ortamı için K8s migration planı hazırla", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "CDN entegrasyonu kur", description: "Statik dosyalar için CloudFront veya Cloudflare ayarla", priority: "MEDIUM", dayOffset: 0, isCompleted: false, subtasks: ["Provider seç", "DNS ayarlarını yap", "Cache politikası belirle"] },
        { title: "Güvenlik açığı taraması yap", description: "Bağımlılıkları ve konfigürasyonları güvenlik açığı için tara", priority: "HIGH", dayOffset: 0, isCompleted: false },
        { title: "Deployment pipeline dokümantasyonu", description: "CI/CD sürecini adım adım belgele", priority: "LOW", dayOffset: 0, isCompleted: false },
    ],

    "erkan@gmail.com": [
        { title: "REST API dokümantasyonu güncelle", description: "Tüm endpointleri Swagger/OpenAPI ile belgele", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Mevcut endpointleri listele", "Request/response örnekleri ekle", "Swagger UI kur"] },
        { title: "Unit test coverage %80'e çıkar", description: "Kritik servis katmanı için eksik testleri yaz", priority: "HIGH", dayOffset: 5, isCompleted: true, subtasks: ["Coverage raporunu çalıştır", "En düşük modülleri tespit et", "Test yaz"] },
        { title: "Dependency upgrade planı", description: "Eski bağımlılıkları tespit et ve upgrade planla", priority: "MEDIUM", dayOffset: 4, isCompleted: true },
        { title: "GraphQL şema tasarımı araştır", description: "REST'ten GraphQL'e geçiş fizibilite analizi", priority: "LOW", dayOffset: 3, isCompleted: true },
        { title: "Cache layer implementasyonu", description: "Redis ile API yanıt önbellekleme ekle", priority: "HIGH", dayOffset: 2, isCompleted: true, subtasks: ["Redis bağlantısı kur", "Cache middleware yaz", "TTL politikası belirle"] },
        { title: "Kod kalite araçları kur", description: "ESLint, Prettier ve Husky ile kod standardı zorla", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "Webhook sistemi implemente et", description: "Harici sistemler için webhook gönderme mekanizması", priority: "MEDIUM", dayOffset: 0, isCompleted: false, subtasks: ["Endpoint tasarla", "Retry mekanizması ekle", "Signature doğrulama ekle"] },
        { title: "Loglama standartları belirle", description: "Yapılandırılmış loglama formatı ve seviyelerini tanımla", priority: "LOW", dayOffset: 0, isCompleted: false },
        { title: "API versioning stratejisi belirle", description: "v1/v2 geçiş planını ve deprecation politikasını yaz", priority: "HIGH", dayOffset: 0, isCompleted: false },
    ],
}

// ── Personal pool tasks ────────────────────────────────────────────────────

const POOL_TASKS: Record<string, Array<{ title: string; description?: string; priority: Priority }>> = {
    "mustafa@gmail.com": [
        { title: "Yeni ofis ekipmanı satın alma listesi", description: "Çalışanlar için ihtiyaç duyulan donanımları listele", priority: "LOW" },
        { title: "ISO 27001 sertifikasyon sürecini başlat", description: "Sertifikasyon için gerekli adımları araştır", priority: "HIGH" },
    ],
    "goksun@gmail.com": [
        { title: "Agile retrospektif şablonu hazırla", description: "Sprint sonu geri bildirim toplantısı için format", priority: "LOW" },
        { title: "Mentorluk programı planla", description: "Kıdemli ve junior geliştiriciler için eşleştirme sistemi", priority: "MEDIUM" },
    ],
    "enes@gmail.com": [
        { title: "Yeni JavaScript framework araştır", description: "Svelte veya SolidJS'i proje için değerlendir", priority: "LOW" },
        { title: "Open source katkı planla", description: "Hangi projeye katkı yapılabilir?", priority: "LOW" },
    ],
    "bengisu@gmail.com": [
        { title: "Design system dokümantasyon şablonu", description: "Figma ve kod bileşenlerini birleştiren dokümantasyon", priority: "MEDIUM" },
        { title: "CSS animasyon kütüphanesi araştır", description: "Framer Motion alternatiflerini değerlendir", priority: "LOW" },
    ],
    "esin@gmail.com": [
        { title: "Kullanıcı görüşmesi soru seti hazırla", description: "Keşif ve doğrulama soruları için şablon", priority: "MEDIUM" },
        { title: "Rekabetçi analiz raporu taslağı", description: "Rakip ürünlerin özellik matrisini çıkar", priority: "LOW" },
    ],
    "ali@gmail.com": [
        { title: "HomeLab Kubernetes deneyi", description: "Kişisel lab ortamında K8s pratik yap", priority: "LOW" },
        { title: "Terraform ile infrastructure as code dene", description: "AWS üzerinde IaC pratiği", priority: "MEDIUM" },
    ],
    "erkan@gmail.com": [
        { title: "Clean Code kitabı notları", description: "Ekiple paylaşmak için özet çıkar", priority: "LOW" },
        { title: "Test Driven Development workshop hazırla", description: "Ekip için TDD eğitim materyali", priority: "MEDIUM" },
    ],
}

// ── Templates ──────────────────────────────────────────────────────────────

const TEMPLATES = [
    {
        name: "Bug Fix Süreci",
        description: "Bir hatayı tespit etmekten çözüme götüren standart süreç adımları",
        subtasks: [
            { title: "Hatayı reproduce et", description: "Adım adım hatanın nasıl oluştuğunu belgele" },
            { title: "Root cause analizi yap", description: "Hatanın kök nedenini tespit et" },
            { title: "Fix'i implemente et", description: "Sorunu çözen kodu yaz" },
            { title: "Unit test ekle", description: "Regression'ı önlemek için test yaz" },
            { title: "Code review ve merge", description: "PR aç ve onay al" },
        ],
    },
    {
        name: "Yeni Özellik Geliştirme",
        description: "Sıfırdan yeni bir özelliği tasarlayıp geliştirmek için standart süreç",
        subtasks: [
            { title: "Gereksinimleri analiz et", description: "Product brief ve acceptance criteria'yı incele" },
            { title: "Teknik tasarım belgesi yaz", description: "Mimari kararları ve API tasarımını belgele" },
            { title: "UI/UX tasarımını incele", description: "Figma tasarımlarını gözden geçir ve onay al" },
            { title: "Backend API'yi geliştir", description: "Endpoint'leri yaz ve test et" },
            { title: "Frontend entegrasyonu yap", description: "UI bileşenlerini API'ye bağla" },
            { title: "QA testleri tamamla", description: "Manuel ve otomatik testleri çalıştır" },
        ],
    },
    {
        name: "Kod Review Süreci",
        description: "Pull request incelemesi için takip edilecek adımlar",
        subtasks: [
            { title: "Kod değişikliklerini incele", description: "Diff'i satır satır gözden geçir" },
            { title: "Test coverage'ı kontrol et", description: "Yeni kodun test edilip edilmediğini doğrula" },
            { title: "Güvenlik açıklarını ara", description: "Input validation, XSS, SQL injection gibi sorunları kontrol et" },
            { title: "Performans etkisini değerlendir", description: "Yeni kodun performans üzerindeki etkisini gözden geçir" },
            { title: "Onay ver veya değişiklik iste", description: "Yorumları ekle ve PR'ı onayla/reddet" },
        ],
    },
    {
        name: "Sprint Planlama",
        description: "İki haftalık sprint döngüsü için takım planlama toplantısı hazırlığı",
        subtasks: [
            { title: "Backlog grooming yap", description: "Öncelik sırasını güncelle ve story'leri boyutlandır" },
            { title: "Ekip kapasitesini belirle", description: "İzin ve tatil günlerini hesaba katarak kapasite hesapla" },
            { title: "Sprint hedefini tanımla", description: "Sprint için tek cümlelik hedef yaz" },
            { title: "Görevleri ekip üyelerine ata", description: "İş yükünü dengeli şekilde dağıt" },
            { title: "Definition of Done'ı güncelle", description: "Tamamlanma kriterlerinin güncel olduğunu doğrula" },
        ],
    },
    {
        name: "Deployment Kontrol Listesi",
        description: "Üretim ortamına güvenli deployment için adımlar",
        subtasks: [
            { title: "Tüm testlerin geçtiğini doğrula", description: "CI pipeline'ın yeşil olduğunu kontrol et" },
            { title: "Database migration'ları hazırla", description: "Migration script'lerini test ortamında dene" },
            { title: "Geri alma planı oluştur", description: "Sorun çıkarsa rollback adımlarını belgele" },
            { title: "Paydaşları bilgilendir", description: "Deployment zamanını ve etkilenecek alanları duyur" },
            { title: "Deployment'ı uygula", description: "Adım adım deployment'ı gerçekleştir" },
            { title: "Post-deployment izleme yap", description: "Metrikler ve hata loglarını 1 saat takip et" },
        ],
    },
]

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log("📋 Görevler ve templateler ekleniyor...\n")

    // Fetch users
    const users = await prisma.user.findMany({
        where: {
            email: { in: Object.keys(TASK_SETS) },
        },
    })

    if (users.length === 0) {
        throw new Error("Kullanıcılar bulunamadı. Önce add-users.ts scriptini çalıştırın.")
    }

    const userByEmail = Object.fromEntries(users.map(u => [u.email, u]))

    // Fetch YZS group
    const yzsGroup = await prisma.userGroup.findUnique({ where: { name: "YZS" } })

    // ── 1. Görevler ─────────────────────────────────────────────────────────
    let taskCount = 0
    for (const [email, tasks] of Object.entries(TASK_SETS)) {
        const user = userByEmail[email]
        if (!user) {
            console.warn(`  ⚠ Kullanıcı bulunamadı: ${email}`)
            continue
        }

        for (const t of tasks) {
            const taskDate = daysAgo(t.dayOffset)
            const task = await prisma.task.create({
                data: {
                    title: t.title,
                    description: t.description || null,
                    date: taskDate,
                    isCompleted: t.isCompleted,
                    priority: t.priority,
                    isPoolTask: false,
                    isPersonalPool: false,
                    createdById: user.id,
                    assignedToId: user.id,
                    subtasks: t.subtasks
                        ? {
                              create: t.subtasks.map(st => ({
                                  title: st,
                                  isCompleted: t.isCompleted, // tamamlanmış görevin subtask'ları da tamamlanmış
                              })),
                          }
                        : undefined,
                },
            })
            taskCount++
        }

        console.log(`  ✓ ${user.name} — ${tasks.length} görev`)
    }

    // ── 2. Kişisel Pool Görevleri ────────────────────────────────────────────
    let poolCount = 0
    for (const [email, poolTasks] of Object.entries(POOL_TASKS)) {
        const user = userByEmail[email]
        if (!user) continue

        for (const pt of poolTasks) {
            await prisma.task.create({
                data: {
                    title: pt.title,
                    description: pt.description || null,
                    date: new Date(2099, 0, 1), // pool tasks don't have a real date
                    isCompleted: false,
                    priority: pt.priority,
                    isPoolTask: false,
                    isPersonalPool: true,
                    createdById: user.id,
                    assignedToId: user.id,
                },
            })
            poolCount++
        }
    }
    console.log(`\n  ✓ ${poolCount} kişisel pool görevi`)

    // ── 3. Templateler ───────────────────────────────────────────────────────
    // mustafa oluştursun, YZS grubuna ata
    const mustafa = userByEmail["mustafa@gmail.com"]
    const goksun = userByEmail["goksun@gmail.com"]

    const templateCreators = [mustafa, goksun, mustafa, goksun, mustafa]
    let templateCount = 0

    for (let i = 0; i < TEMPLATES.length; i++) {
        const tmpl = TEMPLATES[i]
        const creator = templateCreators[i] || mustafa

        await prisma.taskTemplate.create({
            data: {
                name: tmpl.name,
                description: tmpl.description,
                createdById: creator.id,
                groups: yzsGroup ? { connect: [{ id: yzsGroup.id }] } : undefined,
                subtasks: {
                    create: tmpl.subtasks.map((st, idx) => ({
                        title: st.title,
                        description: st.description,
                        sortOrder: idx,
                    })),
                },
            },
        })
        templateCount++
    }

    console.log(`  ✓ ${templateCount} template`)

    // ── Özet ─────────────────────────────────────────────────────────────────
    console.log("\n✅ Tamamlandı!")
    console.log(`  📌 ${taskCount} görev oluşturuldu`)
    console.log(`  📦 ${poolCount} kişisel pool görevi oluşturuldu`)
    console.log(`  📄 ${templateCount} template oluşturuldu`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
