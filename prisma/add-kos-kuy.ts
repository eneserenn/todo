import { PrismaClient, Priority } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

function hash(pw: string) { return bcrypt.hash(pw, 10) }
function daysAgo(n: number): Date {
    const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0, 0, 0, 0); return d
}

// ── Kullanıcı verileri ─────────────────────────────────────────────────────

const KOS_MANAGER  = { name: "Selin",    email: "selin@gmail.com",    password: "manager123", role: "MANAGER" as const }
const KUY_MANAGER  = { name: "Tarik",    email: "tarik@gmail.com",    password: "manager123", role: "MANAGER" as const }

const KOS_EMPLOYEES = [
    { name: "Burak",    email: "burak@gmail.com",    password: "user123", role: "EMPLOYEE" as const },
    { name: "Deniz",    email: "deniz@gmail.com",    password: "user123", role: "EMPLOYEE" as const },
    { name: "Fatma",    email: "fatma@gmail.com",    password: "user123", role: "EMPLOYEE" as const },
    { name: "Kemal",    email: "kemal@gmail.com",    password: "user123", role: "EMPLOYEE" as const },
]

const KUY_EMPLOYEES = [
    { name: "Neslihan", email: "neslihan@gmail.com", password: "user123", role: "EMPLOYEE" as const },
    { name: "Oguz",     email: "oguz@gmail.com",     password: "user123", role: "EMPLOYEE" as const },
    { name: "Pinar",    email: "pinar@gmail.com",    password: "user123", role: "EMPLOYEE" as const },
    { name: "Sercan",   email: "sercan@gmail.com",   password: "user123", role: "EMPLOYEE" as const },
]

// ── Görev verileri ─────────────────────────────────────────────────────────

type TaskDef = {
    title: string; description?: string; priority: Priority
    dayOffset: number; isCompleted: boolean; subtasks?: string[]
}

const TASKS: Record<string, TaskDef[]> = {
    // ── KOS Ekibi ────────────────────────────────────────────────────────
    "selin@gmail.com": [
        { title: "KOS Q1 proje planı hazırla", description: "Ocak-Mart hedefleri ve milestone'ları belirle", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Hedefleri listele", "Kaynak dağılımını yap", "Timeline oluştur"] },
        { title: "Müşteri talep analizi raporu", description: "Son 3 ayın müşteri taleplerini kategorize et", priority: "URGENT", dayOffset: 5, isCompleted: true, subtasks: ["Talep verilerini topla", "Kategorilere ayır", "Rapor yaz"] },
        { title: "KOS ekip haftalık standup formatı belirle", description: "15 dakikalık günlük sync toplantısı için yapı kur", priority: "MEDIUM", dayOffset: 4, isCompleted: true },
        { title: "Vendor görüşmeleri koordinasyonu", description: "3 tedarikçi ile teknik görüşme randevuları ayarla", priority: "HIGH", dayOffset: 3, isCompleted: true, subtasks: ["Tedarikçilere ulaş", "Takvim bloklarını ayarla", "Gündem gönder"] },
        { title: "Süreç optimizasyon önerileri hazırla", description: "Mevcut iş akışlarındaki darboğazları tespit et", priority: "MEDIUM", dayOffset: 2, isCompleted: true },
        { title: "Ekip performans metrikleri dashboard'u", description: "KPI'ları takip etmek için dashboard tasarla", priority: "HIGH", dayOffset: 1, isCompleted: true },
        { title: "KOS roadmap sunumu hazırla", description: "Yönetim için çeyreklik yol haritası sunumu", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Öncelikleri güncelle", "Grafikleri hazırla", "Slaytları oluştur"] },
        { title: "Risk analizi güncelle", description: "Projedeki potansiyel riskleri ve azaltma stratejilerini güncelle", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
        { title: "Yeni ekip üyesi oryantasyonu planla", description: "Yeni katılacak kişi için ilk hafta programı", priority: "LOW", dayOffset: 0, isCompleted: false },
    ],
    "burak@gmail.com": [
        { title: "CRM sistemine müşteri verilerini aktarma", description: "Eski Excel tablolarını CRM'e taşı", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Veriyi temizle", "Import şablonu hazırla", "Test et ve doğrula"] },
        { title: "Müşteri memnuniyet anketi sonuçlarını analiz et", description: "Q4 anket verilerini değerlendir ve rapor yaz", priority: "MEDIUM", dayOffset: 5, isCompleted: true },
        { title: "Satış süreç dokümantasyonu", description: "Mevcut satış akışını adım adım belgele", priority: "LOW", dayOffset: 4, isCompleted: true, subtasks: ["Süreci haritalandır", "Örnekler ekle", "Dökümanı yayınla"] },
        { title: "Yeni müşteri onboarding e-posta serisi", description: "Yeni kayıt olan müşteriler için 5 e-posta dizisi yaz", priority: "HIGH", dayOffset: 3, isCompleted: true },
        { title: "Ürün demo videosu senaryosu yaz", description: "10 dakikalık ürün tanıtım videosu için script", priority: "MEDIUM", dayOffset: 2, isCompleted: true },
        { title: "Müşteri başarı hikayeleri derle", description: "5 müşteriden referans hikayesi topla", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "Fiyatlandırma stratejisi araştırması", description: "Rakip fiyatlandırmayı analiz et ve öneride bulun", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Rakip fiyatları araştır", "Fiyat elastikiyeti hesapla", "Öneri hazırla"] },
        { title: "Quarterly business review sunumu", description: "Müşteri QBR toplantısı için slaytları hazırla", priority: "URGENT", dayOffset: 0, isCompleted: false },
        { title: "Lead scoring modeli güncelle", description: "Potansiyel müşteri puanlama kriterlerini gözden geçir", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
    ],
    "deniz@gmail.com": [
        { title: "Pazar araştırması raporu tamamla", description: "Yeni segment için tam pazar analizi", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Pazar büyüklüğünü hesapla", "Rakipleri listele", "SWOT analizi yap"] },
        { title: "Sosyal medya içerik takvimi oluştur", description: "Mart ayı için günlük içerik planı", priority: "MEDIUM", dayOffset: 5, isCompleted: true },
        { title: "Google Analytics raporunu incele", description: "Web sitesi trafiği ve dönüşüm oranlarını analiz et", priority: "HIGH", dayOffset: 4, isCompleted: true, subtasks: ["Aylık trafik raporu al", "Dönüşüm hunisini incele", "İyileştirme önerileri yaz"] },
        { title: "Email kampanyası A/B testi", description: "Konu satırı varyantlarını test et", priority: "MEDIUM", dayOffset: 3, isCompleted: true },
        { title: "SEO teknik audit gerçekleştir", description: "Site hız, meta tag ve backlink analizini yap", priority: "HIGH", dayOffset: 2, isCompleted: true },
        { title: "Influencer işbirliği araştır", description: "Sektörle ilgili mikro influencer listesi oluştur", priority: "LOW", dayOffset: 1, isCompleted: true },
        { title: "Landing page optimizasyonu", description: "Ana landing page'in conversion rate'ini artır", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Heatmap verilerini incele", "CTA butonlarını test et", "Form uzunluğunu kısalt"] },
        { title: "Aylık pazarlama raporu yaz", description: "Kanal bazlı performans ve ROI analizi", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
        { title: "Webinar içerik planı hazırla", description: "Aylık eğitim webinarı için konu ve içerik planla", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
    ],
    "fatma@gmail.com": [
        { title: "Muhasebe sistem entegrasyonu testi", description: "Yeni muhasebe yazılımının mevcut sistemle entegrasyon testleri", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Test senaryolarını hazırla", "Entegrasyon testlerini çalıştır", "Hataları raporla"] },
        { title: "Ay sonu kapanış raporları", description: "Şubat ayı finansal kapanış işlemlerini tamamla", priority: "URGENT", dayOffset: 5, isCompleted: true },
        { title: "Gider analizi ve bütçe karşılaştırması", description: "Planlanan vs gerçekleşen harcamaları karşılaştır", priority: "HIGH", dayOffset: 4, isCompleted: true, subtasks: ["Harcama verilerini topla", "Sapmaları analiz et", "Yönetim raporunu hazırla"] },
        { title: "KDV beyannamesi hazırlığı", description: "Şubat ayı KDV belgelerini derle", priority: "URGENT", dayOffset: 3, isCompleted: true },
        { title: "Tedarikçi ödeme takibini güncelle", description: "Vadesi gelen ödemeleri kontrol et ve işle", priority: "HIGH", dayOffset: 2, isCompleted: true },
        { title: "Bütçe revizyon talebi hazırla", description: "Q2 için ek bütçe talebini gerekçesiyle yaz", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "Finansal projeksiyon modeli güncelle", description: "Yıl sonu tahminlerini güncel verilerle yenile", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Gelirleri güncelle", "Maliyet tahminlerini ayarla", "Senaryo analizleri yap"] },
        { title: "İç denetim bulguları takip et", description: "Önceki denetimde bulunan hataların düzeltilip düzeltilmediğini kontrol et", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
        { title: "Çalışan harcama politikasını güncelle", description: "Seyahat ve temsil giderleri limitlerini revize et", priority: "LOW", dayOffset: 0, isCompleted: false },
    ],
    "kemal@gmail.com": [
        { title: "IT destek talep sistemini kur", description: "Helpdesk ticketing sisteminin konfigürasyonu", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Platform seç", "Kategorileri tanımla", "SLA'ları ayarla"] },
        { title: "Ağ altyapısı haritası oluştur", description: "Tüm sunucu ve ağ cihazlarının görsel haritasını çiz", priority: "MEDIUM", dayOffset: 5, isCompleted: true },
        { title: "Kullanıcı hesapları denetimi", description: "Aktif olmayan hesapları tespit et ve devre dışı bırak", priority: "HIGH", dayOffset: 4, isCompleted: true, subtasks: ["Aktif kullanıcıları listele", "90 gündür girilmeyenleri tespit et", "Hesapları devre dışı bırak"] },
        { title: "Yazılım envanter güncellemesi", description: "Kurulu tüm yazılımların lisans durumunu kontrol et", priority: "MEDIUM", dayOffset: 3, isCompleted: true },
        { title: "VPN bağlantı sorunlarını gider", description: "Uzaktan çalışan personelin VPN problemlerini çöz", priority: "URGENT", dayOffset: 2, isCompleted: true },
        { title: "Güvenlik duvarı kural setini güncelle", description: "Gereksiz portları kapat ve kuralları optimize et", priority: "HIGH", dayOffset: 1, isCompleted: true },
        { title: "Donanım yenileme planı hazırla", description: "5 yılı geçmiş cihazların listesini ve maliyetini çıkar", priority: "MEDIUM", dayOffset: 0, isCompleted: false, subtasks: ["Envanter taraması yap", "Maliyet analizi hazırla", "Öncelik sırası belirle"] },
        { title: "Disaster recovery tatbikatı planla", description: "Sistem kesintisi senaryosu için tatbikat programı", priority: "HIGH", dayOffset: 0, isCompleted: false },
        { title: "Kullanıcı eğitim materyalleri hazırla", description: "Yeni yazılım geçişi için kullanım kılavuzu yaz", priority: "LOW", dayOffset: 0, isCompleted: false },
    ],

    // ── KUY Ekibi ────────────────────────────────────────────────────────
    "tarik@gmail.com": [
        { title: "KUY yıllık strateji belgesi", description: "Yıllık hedefler ve stratejik öncelikleri belgele", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["SWOT analizi yap", "Hedefleri belirle", "Belgeyi son haline getir"] },
        { title: "Çeyreklik bütçe planlaması", description: "Q2 için departman bütçesini hazırla", priority: "URGENT", dayOffset: 5, isCompleted: true, subtasks: ["Geçen çeyrek harcamalarını incele", "İhtiyaçları listele", "Bütçe taslağı hazırla"] },
        { title: "Ekip yapısı reorganizasyonu", description: "Yeni proje gereksinimlerine göre ekip rollerini güncelle", priority: "HIGH", dayOffset: 4, isCompleted: true },
        { title: "Paydaş toplantısı gündemi hazırla", description: "Yönetim kurulu ile aylık güncelleme toplantısı", priority: "MEDIUM", dayOffset: 3, isCompleted: true, subtasks: ["Gündem kalemlerini topla", "Sunumlara ekle", "Toplantı notlarını hazırla"] },
        { title: "KPI dashboard'u güncelle", description: "Departman performans metriklerini yenile", priority: "HIGH", dayOffset: 2, isCompleted: true },
        { title: "İşe alım süreci iyileştirme önerileri", description: "Mevcut işe alım sürecindeki eksiklikleri raporla", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "Yönetim raporu hazırla", description: "Aylık operasyon raporu için verileri topla ve yaz", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Metrikleri topla", "Analizleri yap", "Raporu formatla"] },
        { title: "Proje izleme sistemi kur", description: "Ekip projelerini takip için araç seç ve kur", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
        { title: "Çalışan kariyer gelişim planları yap", description: "Her ekip üyesi için 6 aylık gelişim planı oluştur", priority: "MEDIUM", dayOffset: 0, isCompleted: false },
    ],
    "neslihan@gmail.com": [
        { title: "İK politika el kitabı güncelleme", description: "Yeni yasal düzenlemelere göre el kitabını revize et", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Yasal değişiklikleri araştır", "İlgili bölümleri güncelle", "Hukuk onayı al"] },
        { title: "Performans değerlendirme sistemi tasarla", description: "360 derece geri bildirim formu oluştur", priority: "MEDIUM", dayOffset: 5, isCompleted: true },
        { title: "İşe alım ilanı hazırla", description: "Yazılım geliştirici pozisyonu için iş ilanı yaz", priority: "HIGH", dayOffset: 4, isCompleted: true, subtasks: ["Gereksinimler listele", "İlan metnini yaz", "Platformlara yayınla"] },
        { title: "Çalışan memnuniyet anketi düzenle", description: "Yıllık anket tasarla ve gönder", priority: "MEDIUM", dayOffset: 3, isCompleted: true },
        { title: "Onboarding süreci iyileştirme", description: "Yeni çalışan ilk 30 gün deneyimini optimize et", priority: "HIGH", dayOffset: 2, isCompleted: true },
        { title: "Eğitim bütçesi planlaması", description: "Yıllık çalışan eğitim bütçesini dağıt", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "İzin yönetimi sistemini güncelle", description: "Otomatik izin hesaplama kurallarını düzenle", priority: "HIGH", dayOffset: 0, isCompleted: false, subtasks: ["Mevcut kuralları belgele", "Hataları düzelt", "Test et"] },
        { title: "Çalışan ödül programı tasarla", description: "Ay çalışanı ve yıl çalışanı ödül kriterlerini belirle", priority: "LOW", dayOffset: 0, isCompleted: false },
        { title: "İşten ayrılma röportajı formları oluştur", description: "Exit interview sorularını hazırla", priority: "LOW", dayOffset: 0, isCompleted: false },
    ],
    "oguz@gmail.com": [
        { title: "Tedarik zinciri analizi", description: "Mevcut tedarikçi performansını değerlendir", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Tedarikçi listesini çıkar", "Puanlama kriterleri belirle", "Değerlendirme yap"] },
        { title: "Stok yönetimi optimizasyonu", description: "Fazla stok ve eksik stok sorunlarını analiz et", priority: "URGENT", dayOffset: 5, isCompleted: true },
        { title: "Yeni tedarikçi değerlendirme süreci", description: "Tedarikçi seçim kriterleri ve onay süreci belirle", priority: "HIGH", dayOffset: 4, isCompleted: true, subtasks: ["Kriter listesi oluştur", "Değerlendirme formu hazırla", "Onay akışını tanımla"] },
        { title: "Lojistik maliyet analizi", description: "Nakliye ve depolama maliyetlerini düşürme fırsatları", priority: "MEDIUM", dayOffset: 3, isCompleted: true },
        { title: "Tedarikçi sözleşmelerini gözden geçir", description: "Vadesi yaklaşan sözleşmeleri yenile veya renegotiate et", priority: "HIGH", dayOffset: 2, isCompleted: true },
        { title: "Just-in-time envanter modeli araştır", description: "JIT uygulaması için fizibilite analizi", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "Tedarik raporunu hazırla", description: "Aylık tedarik ve stok durum raporu", priority: "MEDIUM", dayOffset: 0, isCompleted: false, subtasks: ["Veriyi topla", "Grafikleri oluştur", "Raporla"] },
        { title: "ERP sistem entegrasyon testi", description: "Yeni ERP modülünün tedarik akışıyla entegrasyon testi", priority: "HIGH", dayOffset: 0, isCompleted: false },
        { title: "Sürdürülebilirlik politikası için tedarikçi değerlendirme", description: "Yeşil tedarik kriterlerini belirle", priority: "LOW", dayOffset: 0, isCompleted: false },
    ],
    "pinar@gmail.com": [
        { title: "Yıllık eğitim planı hazırla", description: "Departman genelinde yetkinlik boşluklarını belirle ve eğitim planla", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Yetkinlik haritası oluştur", "Eğitim ihtiyaçlarını tespit et", "Takvim hazırla"] },
        { title: "E-learning platformu değerlendirmesi", description: "3 farklı online eğitim platformunu karşılaştır", priority: "MEDIUM", dayOffset: 5, isCompleted: true },
        { title: "Yöneticilik gelişim programı tasarla", description: "Orta kademe yöneticiler için 6 aylık program", priority: "HIGH", dayOffset: 4, isCompleted: true, subtasks: ["İhtiyaç analizi yap", "Müfredat tasarla", "Eğitmenleri belirle"] },
        { title: "Eğitim etkinliği ölçüm sistemi kur", description: "Kirkpatrick modeline göre değerlendirme araçları hazırla", priority: "MEDIUM", dayOffset: 3, isCompleted: true },
        { title: "Mentorluk programı başlat", description: "Kıdemli-junior çalışan eşleştirme programı kur", priority: "HIGH", dayOffset: 2, isCompleted: true },
        { title: "Teknik beceri bootcamp programla", description: "Ekip için 2 günlük teknik yetkinlik eğitimi organize et", priority: "MEDIUM", dayOffset: 1, isCompleted: true },
        { title: "Eğitim bütçesi kullanım raporu", description: "Q1 eğitim harcamalarını ve ROI'yi raporla", priority: "MEDIUM", dayOffset: 0, isCompleted: false, subtasks: ["Harcamaları derle", "Katılım metriklerini ekle", "ROI hesapla"] },
        { title: "Sertifikasyon programları araştır", description: "Ekibe uygun sektör sertifikasyonlarını listele", priority: "LOW", dayOffset: 0, isCompleted: false },
        { title: "İş başı eğitim materyalleri güncelle", description: "Mevcut eğitim dökümanlarını güncel süreçlerle uyumlu hale getir", priority: "HIGH", dayOffset: 0, isCompleted: false },
    ],
    "sercan@gmail.com": [
        { title: "Kalite yönetim sistemi denetimi", description: "ISO 9001 uyumluluk denetimini gerçekleştir", priority: "HIGH", dayOffset: 6, isCompleted: true, subtasks: ["Denetim planı oluştur", "Bölümleri ziyaret et", "Bulguları raporla"] },
        { title: "Süreç akış diyagramları güncelle", description: "Değişen süreçleri BPMN diyagramlarında güncelle", priority: "MEDIUM", dayOffset: 5, isCompleted: true },
        { title: "Müşteri şikayet analizi", description: "Son çeyrekteki şikayetleri kategorize et ve kök neden analizi yap", priority: "HIGH", dayOffset: 4, isCompleted: true, subtasks: ["Şikayetleri grupla", "Pareto analizi yap", "Düzeltici aksiyon planla"] },
        { title: "Kalite metrik raporlama sistemi kur", description: "Otomatik kalite dashboard'u oluştur", priority: "HIGH", dayOffset: 3, isCompleted: true },
        { title: "Tedarikçi kalite denetimi", description: "3 kritik tedarikçide sahaya kalite denetimi yap", priority: "URGENT", dayOffset: 2, isCompleted: true },
        { title: "Hata modu analizi (FMEA) güncelle", description: "Yeni süreçler için FMEA tablosunu güncelle", priority: "HIGH", dayOffset: 1, isCompleted: true },
        { title: "Kalite eğitim materyalleri hazırla", description: "Yeni personel için kalite prosedürleri eğitim paketi", priority: "MEDIUM", dayOffset: 0, isCompleted: false, subtasks: ["Prosedürleri belgele", "Slaytları hazırla", "Sınav soruları yaz"] },
        { title: "Kontrol planı revizyonu", description: "Üretim süreçlerindeki kontrol noktalarını güncelle", priority: "HIGH", dayOffset: 0, isCompleted: false },
        { title: "8D problem çözme raporu yaz", description: "Kritik müşteri şikayeti için 8D raporu tamamla", priority: "URGENT", dayOffset: 0, isCompleted: false },
    ],
}

// ── Pool görevleri ─────────────────────────────────────────────────────────

const POOL: Record<string, Array<{ title: string; description?: string; priority: Priority }>> = {
    "selin@gmail.com":   [{ title: "Agile sertifikasyon sınavına hazırlan", priority: "MEDIUM" }, { title: "Endüstri konferansı başvurusu yap", priority: "LOW" }],
    "burak@gmail.com":   [{ title: "HubSpot ileri düzey kurs tamamla", priority: "LOW" }, { title: "Müşteri segmentasyon modeli araştır", priority: "MEDIUM" }],
    "deniz@gmail.com":   [{ title: "Google Ads sertifikasyon sınavı", priority: "LOW" }, { title: "Competitor analysis framework kur", priority: "MEDIUM" }],
    "fatma@gmail.com":   [{ title: "IFRS güncellemelerini takip et", priority: "MEDIUM" }, { title: "Excel ileri düzey pivot table eğitimi", priority: "LOW" }],
    "kemal@gmail.com":   [{ title: "CompTIA Security+ sertifikasyon çalışması", priority: "MEDIUM" }, { title: "Home lab network simülasyonu kur", priority: "LOW" }],
    "tarik@gmail.com":   [{ title: "Liderlik kitabı okuma listesi oluştur", priority: "LOW" }, { title: "OKR metodolojisi araştır ve uygula", priority: "MEDIUM" }],
    "neslihan@gmail.com":[{ title: "SHRM sertifikasyon materyallerini incele", priority: "MEDIUM" }, { title: "İnsan kaynakları trendleri raporu yaz", priority: "LOW" }],
    "oguz@gmail.com":    [{ title: "Tedarik zinciri yönetimi sertifikası araştır", priority: "MEDIUM" }, { title: "Blockchain in supply chain araştır", priority: "LOW" }],
    "pinar@gmail.com":   [{ title: "Instructional design kurs materyalleri topla", priority: "LOW" }, { title: "Learning management system karşılaştırması yap", priority: "MEDIUM" }],
    "sercan@gmail.com":  [{ title: "Six Sigma Green Belt sınavı için çalış", priority: "MEDIUM" }, { title: "Kalite 4.0 trendlerini araştır", priority: "LOW" }],
}

// ── Templateler ───────────────────────────────────────────────────────────

const KOS_TEMPLATES = [
    {
        name: "Müşteri Onboarding Süreci",
        description: "Yeni müşteriyi sisteme almak ve ilk başarıya ulaştırmak için izlenecek standart adımlar",
        subtasks: [
            { title: "Müşteri bilgilerini CRM'e gir", description: "İletişim bilgileri ve sözleşme detaylarını ekle" },
            { title: "Hoşgeldiniz e-postası gönder", description: "Kişiselleştirilmiş karşılama mesajı ilet" },
            { title: "Kick-off toplantısı organize et", description: "İlk 48 saat içinde 30 dakikalık toplantı planla" },
            { title: "Ürün demo ve eğitim ver", description: "Temel özellikler için ekran paylaşımlı eğitim" },
            { title: "30 günlük başarı planı hazırla", description: "İlk ay için hedefler ve kontrol noktaları belirle" },
        ],
    },
    {
        name: "Aylık Finansal Kapanış",
        description: "Her ay sonu yapılacak muhasebe kapanış işlemleri için kontrol listesi",
        subtasks: [
            { title: "Banka mutabakatlarını tamamla", description: "Tüm hesapların mutabakatını yap" },
            { title: "Tahakkuk ve erteleme kayıtları", description: "Dönemlik gider ve gelirleri kaydet" },
            { title: "Stok sayımını doğrula", description: "Fiziksel stok ile sistem kaydını karşılaştır" },
            { title: "Bilanço kontrolü", description: "Tutarsızlıkları tespit et ve düzelt" },
            { title: "Yönetim raporunu hazırla", description: "Özet finansal tabloları yönetimine sun" },
        ],
    },
]

const KUY_TEMPLATES = [
    {
        name: "Çalışan Performans Değerlendirmesi",
        description: "Yıllık ve yarıyıl performans değerlendirme toplantısı için standart süreç",
        subtasks: [
            { title: "Öz değerlendirme formunu gönder", description: "Çalışandan kendi hedefleri üzerine geri bildirim al" },
            { title: "360 derece geri bildirim topla", description: "Ekip arkadaşları ve müşterilerden değerlendirme al" },
            { title: "Yönetici değerlendirmesini tamamla", description: "Hedef gerçekleşme oranlarını not et" },
            { title: "1-on-1 değerlendirme toplantısı yap", description: "Güçlü yönler ve gelişim alanlarını paylaş" },
            { title: "Kariyer gelişim planını güncelle", description: "Sonraki dönem hedefler ve gelişim aksiyonları belirle" },
        ],
    },
    {
        name: "Kalite Denetim Süreci",
        description: "İç veya dış kalite denetimi için hazırlık ve uygulama adımları",
        subtasks: [
            { title: "Denetim kapsamını belirle", description: "Hangi süreç ve alanların denetleneceğini listele" },
            { title: "Denetim planını hazırla", description: "Tarih, saat ve sorumluları belirle" },
            { title: "Dokümantasyonu hazırla", description: "Gerekli prosedür ve kayıtları derle" },
            { title: "Denetimi gerçekleştir", description: "Plana göre gözlem ve inceleme yap" },
            { title: "Bulguları raporla ve aksiyon planı oluştur", description: "Uygunsuzluklar için düzeltici faaliyet planı yaz" },
        ],
    },
]

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log("👥 KOS ve KUY ekipleri oluşturuluyor...\n")

    const mustafa = await prisma.user.findUniqueOrThrow({ where: { email: "mustafa@gmail.com" } })
    const groupKOS = await prisma.userGroup.findUniqueOrThrow({ where: { name: "KOS" } })
    const groupKUY = await prisma.userGroup.findUniqueOrThrow({ where: { name: "KUY" } })

    // ── Kullanıcılar ────────────────────────────────────────────────────────
    const selin = await prisma.user.upsert({
        where: { email: KOS_MANAGER.email }, update: {},
        create: { ...KOS_MANAGER, password: await hash(KOS_MANAGER.password) },
    })
    const tarik = await prisma.user.upsert({
        where: { email: KUY_MANAGER.email }, update: {},
        create: { ...KUY_MANAGER, password: await hash(KUY_MANAGER.password) },
    })

    const kosEmps = await Promise.all(KOS_EMPLOYEES.map(async e =>
        prisma.user.upsert({
            where: { email: e.email }, update: { managerId: selin.id },
            create: { name: e.name, email: e.email, password: await hash(e.password), role: e.role, managerId: selin.id },
        })
    ))
    const kuyEmps = await Promise.all(KUY_EMPLOYEES.map(async e =>
        prisma.user.upsert({
            where: { email: e.email }, update: { managerId: tarik.id },
            create: { name: e.name, email: e.email, password: await hash(e.password), role: e.role, managerId: tarik.id },
        })
    ))

    console.log("  ✓ 10 kullanıcı oluşturuldu (2 manager + 8 employee)")

    // ── Grup ilişkileri ─────────────────────────────────────────────────────
    await prisma.userGroup.update({
        where: { id: groupKOS.id },
        data: {
            managers: { connect: [{ id: mustafa.id }, { id: selin.id }] },
            members:  { connect: [{ id: selin.id }, ...kosEmps.map(e => ({ id: e.id }))] },
        },
    })
    await prisma.userGroup.update({
        where: { id: groupKUY.id },
        data: {
            managers: { connect: [{ id: mustafa.id }, { id: tarik.id }] },
            members:  { connect: [{ id: tarik.id }, ...kuyEmps.map(e => ({ id: e.id }))] },
        },
    })
    console.log("  ✓ Grup ilişkileri kuruldu\n")

    // ── Görevler ────────────────────────────────────────────────────────────
    const allNewEmails = [
        KOS_MANAGER.email, ...KOS_EMPLOYEES.map(e => e.email),
        KUY_MANAGER.email, ...KUY_EMPLOYEES.map(e => e.email),
    ]
    const allUsers = await prisma.user.findMany({ where: { email: { in: allNewEmails } } })
    const byEmail = Object.fromEntries(allUsers.map(u => [u.email, u]))

    let taskCount = 0
    for (const [email, tasks] of Object.entries(TASKS)) {
        const user = byEmail[email]
        if (!user) { console.warn(`  ⚠ Bulunamadı: ${email}`); continue }
        for (const t of tasks) {
            await prisma.task.create({
                data: {
                    title: t.title,
                    description: t.description || null,
                    date: daysAgo(t.dayOffset),
                    isCompleted: t.isCompleted,
                    priority: t.priority,
                    isPoolTask: false,
                    isPersonalPool: false,
                    createdById: user.id,
                    assignedToId: user.id,
                    subtasks: t.subtasks ? {
                        create: t.subtasks.map(st => ({ title: st, isCompleted: t.isCompleted })),
                    } : undefined,
                },
            })
            taskCount++
        }
        console.log(`  ✓ ${user.name} — ${tasks.length} görev`)
    }

    // ── Pool görevleri ──────────────────────────────────────────────────────
    let poolCount = 0
    for (const [email, poolTasks] of Object.entries(POOL)) {
        const user = byEmail[email]
        if (!user) continue
        for (const pt of poolTasks) {
            await prisma.task.create({
                data: {
                    title: pt.title, description: pt.description || null,
                    date: new Date(2099, 0, 1), isCompleted: false,
                    priority: pt.priority, isPoolTask: false, isPersonalPool: true,
                    createdById: user.id, assignedToId: user.id,
                },
            })
            poolCount++
        }
    }
    console.log(`\n  ✓ ${poolCount} kişisel pool görevi`)

    // ── Templateler ─────────────────────────────────────────────────────────
    let templateCount = 0
    for (const tmpl of KOS_TEMPLATES) {
        await prisma.taskTemplate.create({
            data: {
                name: tmpl.name, description: tmpl.description,
                createdById: selin.id,
                groups: { connect: [{ id: groupKOS.id }] },
                subtasks: { create: tmpl.subtasks.map((st, i) => ({ title: st.title, description: st.description, sortOrder: i })) },
            },
        })
        templateCount++
    }
    for (const tmpl of KUY_TEMPLATES) {
        await prisma.taskTemplate.create({
            data: {
                name: tmpl.name, description: tmpl.description,
                createdById: tarik.id,
                groups: { connect: [{ id: groupKUY.id }] },
                subtasks: { create: tmpl.subtasks.map((st, i) => ({ title: st.title, description: st.description, sortOrder: i })) },
            },
        })
        templateCount++
    }
    console.log(`  ✓ ${templateCount} template`)

    // ── Özet ────────────────────────────────────────────────────────────────
    console.log("\n✅ Tamamlandı!")
    console.log("  ┌─────────────────────────────────────────────────────┐")
    console.log("  │ Grup │ Rol      │ Email                │ Şifre      │")
    console.log("  ├─────────────────────────────────────────────────────┤")
    console.log("  │ KOS  │ MANAGER  │ selin@gmail.com      │ manager123 │")
    console.log("  │ KOS  │ EMPLOYEE │ burak@gmail.com      │ user123    │")
    console.log("  │ KOS  │ EMPLOYEE │ deniz@gmail.com      │ user123    │")
    console.log("  │ KOS  │ EMPLOYEE │ fatma@gmail.com      │ user123    │")
    console.log("  │ KOS  │ EMPLOYEE │ kemal@gmail.com      │ user123    │")
    console.log("  │ KUY  │ MANAGER  │ tarik@gmail.com      │ manager123 │")
    console.log("  │ KUY  │ EMPLOYEE │ neslihan@gmail.com   │ user123    │")
    console.log("  │ KUY  │ EMPLOYEE │ oguz@gmail.com       │ user123    │")
    console.log("  │ KUY  │ EMPLOYEE │ pinar@gmail.com      │ user123    │")
    console.log("  │ KUY  │ EMPLOYEE │ sercan@gmail.com     │ user123    │")
    console.log("  └─────────────────────────────────────────────────────┘")
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
