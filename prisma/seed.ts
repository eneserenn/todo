import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { addDays, subDays, startOfToday } from "date-fns"

const prisma = new PrismaClient()
const today = startOfToday()

async function hash(pw: string) {
    return bcrypt.hash(pw, 10)
}

async function main() {
    console.log("🌱 Seeding database...")

    // ── Temizlik ──────────────────────────────────────────────
    await prisma.subtask.deleteMany()
    await prisma.task.deleteMany()
    await prisma.user.deleteMany()
    console.log("  ✓ Cleared existing data")

    // ── Kullanıcılar ──────────────────────────────────────────
    const admin = await prisma.user.create({
        data: {
            name: "Admin User",
            email: "admin@todo.com",
            password: await hash("admin123"),
            role: "ADMIN",
        },
    })

    const manager1 = await prisma.user.create({
        data: {
            name: "Ayşe Yılmaz",
            email: "ayse@todo.com",
            password: await hash("manager123"),
            role: "MANAGER",
        },
    })

    const manager2 = await prisma.user.create({
        data: {
            name: "Mehmet Kaya",
            email: "mehmet@todo.com",
            password: await hash("manager123"),
            role: "MANAGER",
        },
    })

    const emp1 = await prisma.user.create({
        data: {
            name: "Zeynep Demir",
            email: "zeynep@todo.com",
            password: await hash("emp123"),
            role: "EMPLOYEE",
            managerId: manager1.id,
        },
    })

    const emp2 = await prisma.user.create({
        data: {
            name: "Can Öztürk",
            email: "can@todo.com",
            password: await hash("emp123"),
            role: "EMPLOYEE",
            managerId: manager1.id,
        },
    })

    const emp3 = await prisma.user.create({
        data: {
            name: "Elif Şahin",
            email: "elif@todo.com",
            password: await hash("emp123"),
            role: "EMPLOYEE",
            managerId: manager2.id,
        },
    })

    console.log("  ✓ Created users (1 admin, 2 manager, 3 employee)")

    // ── Yardımcı: task oluştur ────────────────────────────────
    async function createTask(
        title: string,
        description: string | null,
        date: Date,
        isCompleted: boolean,
        createdById: string,
        assignedToId: string | null,
        isPoolTask = false,
        subtasks: { title: string; isCompleted: boolean }[] = []
    ) {
        return prisma.task.create({
            data: {
                title,
                description,
                date,
                isCompleted,
                isPoolTask,
                createdById,
                assignedToId,
                subtasks: { create: subtasks },
            },
        })
    }

    // ── Zeynep'in taskları ────────────────────────────────────
    await createTask("API entegrasyonunu tamamla", "REST endpoint'lerini dokümante et ve testleri yaz", subDays(today, 3), true, manager1.id, emp1.id, false, [
        { title: "Endpoint listesini çıkar", isCompleted: true },
        { title: "Swagger dökümanı oluştur", isCompleted: true },
        { title: "Postman collection ekle", isCompleted: true },
    ])
    await createTask("Dashboard tasarımını güncelle", "Yeni renk paleti ve tipografi uygula", subDays(today, 1), true, emp1.id, emp1.id, false, [
        { title: "Renk değişkenlerini tanımla", isCompleted: true },
        { title: "Komponent stillerini güncelle", isCompleted: true },
    ])
    await createTask("Haftalık raporu hazırla", "Geçen haftanın sprint özetini çıkar", today, false, emp1.id, emp1.id, false, [
        { title: "Tamamlanan ticket'ları listele", isCompleted: true },
        { title: "Velocity hesapla", isCompleted: false },
        { title: "Yöneticiye gönder", isCompleted: false },
    ])
    await createTask("Unit testleri yaz", "Auth modülü için kapsamlı testler", today, false, manager1.id, emp1.id, false, [
        { title: "Login test senaryoları", isCompleted: false },
        { title: "Token refresh testleri", isCompleted: false },
    ])
    await createTask("Code review yap", null, addDays(today, 1), false, emp1.id, emp1.id)
    await createTask("Sprint planning toplantısına katıl", "Bir sonraki sprint için tahmın ver", addDays(today, 2), false, manager1.id, emp1.id)

    // ── Can'ın taskları ───────────────────────────────────────
    await createTask("Veritabanı migration'larını çalıştır", "Production için DB güncelleme", subDays(today, 2), true, manager1.id, emp2.id, false, [
        { title: "Backup al", isCompleted: true },
        { title: "Migration script'i test et", isCompleted: true },
        { title: "Production'a uygula", isCompleted: true },
    ])
    await createTask("Müşteri geribildirimlerini incele", "Son 2 haftanın support ticket'larını analiz et", subDays(today, 1), true, emp2.id, emp2.id)
    await createTask("Performans optimizasyonu", "Yavaş çalışan sorguları tespit et ve düzelt", today, false, emp2.id, emp2.id, false, [
        { title: "Slow query log'ları incele", isCompleted: true },
        { title: "Index ekle", isCompleted: false },
        { title: "Cache layer ekle", isCompleted: false },
    ])
    await createTask("Deployment pipeline'ı güncelle", null, today, false, manager1.id, emp2.id)
    await createTask("Teknik borç toplantısı", "Refactor edilecek alanları belirle", addDays(today, 1), false, emp2.id, emp2.id)

    // ── Elif'in taskları ──────────────────────────────────────
    await createTask("Mobil uyumluluk testleri", "iOS ve Android cihazlarda test et", subDays(today, 4), true, manager2.id, emp3.id, false, [
        { title: "iPhone SE testleri", isCompleted: true },
        { title: "Android küçük ekran testleri", isCompleted: true },
        { title: "Tablet görünümü", isCompleted: true },
    ])
    await createTask("SEO optimizasyonu", "Meta etiketleri ve sitemap güncelle", subDays(today, 1), true, emp3.id, emp3.id)
    await createTask("A/B testi kur", "Yeni landing page varyantını hazırla", today, false, manager2.id, emp3.id, false, [
        { title: "Varyant tasarımı oluştur", isCompleted: true },
        { title: "Analytics event'lerini ekle", isCompleted: false },
        { title: "Testi başlat", isCompleted: false },
    ])
    await createTask("İçerik güncellemesi", "Blog yazılarını revize et", today, false, emp3.id, emp3.id)
    await createTask("Haftalık analitik raporu", null, addDays(today, 1), false, manager2.id, emp3.id)

    // ── Manager1 (Ayşe) kendi taskları ───────────────────────
    await createTask("Q2 roadmap hazırla", "Üç aylık ürün yol haritasını çiz", subDays(today, 2), true, manager1.id, manager1.id, false, [
        { title: "Stakeholder toplantısı", isCompleted: true },
        { title: "Önceliklendirme matrisi", isCompleted: true },
        { title: "Sunum hazırla", isCompleted: true },
    ])
    await createTask("Ekip 1-on-1 toplantıları", "Zeynep ve Can ile haftalık görüşme", today, false, manager1.id, manager1.id, false, [
        { title: "Zeynep ile görüşme", isCompleted: true },
        { title: "Can ile görüşme", isCompleted: false },
    ])
    await createTask("OKR değerlendirmesi", "Çeyrek sonu hedef analizi", addDays(today, 2), false, manager1.id, manager1.id)

    // ── Manager2 (Mehmet) kendi taskları ─────────────────────
    await createTask("Bütçe planlaması", "Yıllık teknik altyapı bütçesini hazırla", subDays(today, 1), true, manager2.id, manager2.id)
    await createTask("Yeni işe alım görüşmeleri", "3 backend developer adayı ile mülakat", today, false, manager2.id, manager2.id, false, [
        { title: "Teknik sorular hazırla", isCompleted: true },
        { title: "1. aday görüşmesi", isCompleted: true },
        { title: "2. aday görüşmesi", isCompleted: false },
        { title: "3. aday görüşmesi", isCompleted: false },
    ])
    await createTask("Güvenlik denetimi", "Penetration test bulgularını incele", addDays(today, 1), false, manager2.id, manager2.id)

    console.log("  ✓ Created personal tasks")

    // ── Task Pool (manager'ların oluşturduğu havuz taskları) ──
    const poolTasks = [
        { title: "Onboarding dokümanı güncelle", description: "Yeni geliştirici rehberini revize et", createdById: manager1.id },
        { title: "Log monitoring kurulumu", description: "Datadog veya Grafana entegrasyonu yap", createdById: manager1.id },
        { title: "Erişilebilirlik (a11y) testi", description: "WCAG 2.1 uyumluluğunu kontrol et", createdById: manager1.id },
        { title: "API rate limiting ekle", description: "Abuse koruması için throttling uygula", createdById: manager2.id },
        { title: "Dark mode desteği", description: "Tüm sayfaları dark tema ile test et", createdById: manager2.id },
        { title: "Cache stratejisi belirle", description: "Redis kullanım senaryolarını dokümante et", createdById: manager2.id },
    ]

    for (const t of poolTasks) {
        await createTask(t.title, t.description, today, false, t.createdById, null, true)
    }

    console.log("  ✓ Created pool tasks (6)")

    // ── Kişisel pool taskları ─────────────────────────────────
    const personalPoolData = [
        { userId: emp1.id, title: "Typescript advanced patterns öğren", description: "Generics ve utility types" },
        { userId: emp1.id, title: "Docker networking araştır", description: null },
        { userId: emp1.id, title: "Kişisel portföy sitesini güncelle", description: null },
        { userId: emp2.id, title: "PostgreSQL indexing stratejileri", description: "Compound index optimizasyonu" },
        { userId: emp2.id, title: "Redis pub/sub öğren", description: null },
        { userId: emp3.id, title: "Google Analytics 4 kursunu bitir", description: null },
        { userId: emp3.id, title: "Figma component library oluştur", description: "Design token sistemi kur" },
        { userId: manager1.id, title: "Q3 için yeni işe alım planı", description: null },
        { userId: manager2.id, title: "Yıllık performans değerlendirme şablonu", description: null },
    ]

    for (const p of personalPoolData) {
        await prisma.task.create({
            data: {
                title: p.title,
                description: p.description,
                date: new Date(),
                isPersonalPool: true,
                createdById: p.userId,
                assignedToId: p.userId,
            },
        })
    }

    console.log("  ✓ Created personal pool tasks (9)")
    console.log("\n✅ Seed tamamlandı!\n")
    console.log("  Kullanıcı bilgileri:")
    console.log("  ┌─────────────────────────────────────────────────┐")
    console.log("  │ Rol      │ Email              │ Şifre           │")
    console.log("  ├─────────────────────────────────────────────────┤")
    console.log("  │ ADMIN    │ admin@todo.com     │ admin123        │")
    console.log("  │ MANAGER  │ ayse@todo.com      │ manager123      │")
    console.log("  │ MANAGER  │ mehmet@todo.com    │ manager123      │")
    console.log("  │ EMPLOYEE │ zeynep@todo.com    │ emp123          │")
    console.log("  │ EMPLOYEE │ can@todo.com       │ emp123          │")
    console.log("  │ EMPLOYEE │ elif@todo.com      │ emp123          │")
    console.log("  └─────────────────────────────────────────────────┘")
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
