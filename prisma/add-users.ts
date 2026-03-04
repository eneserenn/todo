import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function hash(pw: string) {
    return bcrypt.hash(pw, 10)
}

async function main() {
    console.log("👥 Kullanıcılar ekleniyor...")

    // ── Grupları oluştur (varsa güncelle) ─────────────────────
    const groupYZS = await prisma.userGroup.upsert({
        where: { name: "YZS" },
        update: {},
        create: { name: "YZS", color: "#6366f1" },
    })
    const groupKOS = await prisma.userGroup.upsert({
        where: { name: "KOS" },
        update: {},
        create: { name: "KOS", color: "#10b981" },
    })
    const groupKUY = await prisma.userGroup.upsert({
        where: { name: "KUY" },
        update: {},
        create: { name: "KUY", color: "#f59e0b" },
    })
    console.log("  ✓ Gruplar hazır: YZS, KOS, KUY")

    // ── Mustafa (ADMIN) ────────────────────────────────────────
    const mustafa = await prisma.user.upsert({
        where: { email: "mustafa@gmail.com" },
        update: {},
        create: {
            name: "Mustafa",
            email: "mustafa@gmail.com",
            password: await hash("manager123"),
            role: "ADMIN",
        },
    })

    // ── Goksun (MANAGER) ──────────────────────────────────────
    const goksun = await prisma.user.upsert({
        where: { email: "goksun@gmail.com" },
        update: {},
        create: {
            name: "goksun",
            email: "goksun@gmail.com",
            password: await hash("manager123"),
            role: "MANAGER",
        },
    })

    // ── Çalışanlar (EMPLOYEE) ─────────────────────────────────
    const employees = await Promise.all([
        prisma.user.upsert({
            where: { email: "enes@gmail.com" },
            update: {},
            create: {
                name: "Enes",
                email: "enes@gmail.com",
                password: await hash("user123"),
                role: "EMPLOYEE",
                managerId: goksun.id,
            },
        }),
        prisma.user.upsert({
            where: { email: "bengisu@gmail.com" },
            update: {},
            create: {
                name: "bengisu",
                email: "bengisu@gmail.com",
                password: await hash("user123"),
                role: "EMPLOYEE",
                managerId: goksun.id,
            },
        }),
        prisma.user.upsert({
            where: { email: "esin@gmail.com" },
            update: {},
            create: {
                name: "esin",
                email: "esin@gmail.com",
                password: await hash("user123"),
                role: "EMPLOYEE",
                managerId: goksun.id,
            },
        }),
        prisma.user.upsert({
            where: { email: "ali@gmail.com" },
            update: {},
            create: {
                name: "ali",
                email: "ali@gmail.com",
                password: await hash("user123"),
                role: "EMPLOYEE",
                managerId: goksun.id,
            },
        }),
        prisma.user.upsert({
            where: { email: "erkan@gmail.com" },
            update: {},
            create: {
                name: "erkan",
                email: "erkan@gmail.com",
                password: await hash("user123"),
                role: "EMPLOYEE",
                managerId: goksun.id,
            },
        }),
    ])
    console.log("  ✓ Kullanıcılar oluşturuldu")

    // ── Grup ilişkileri ────────────────────────────────────────
    // YZS: managers = [Mustafa, goksun], members = [goksun, tüm çalışanlar]
    await prisma.userGroup.update({
        where: { id: groupYZS.id },
        data: {
            managers: {
                connect: [{ id: mustafa.id }, { id: goksun.id }],
            },
            members: {
                connect: [
                    { id: goksun.id },
                    ...employees.map(e => ({ id: e.id })),
                ],
            },
        },
    })

    // KOS: managers = [Mustafa]
    await prisma.userGroup.update({
        where: { id: groupKOS.id },
        data: {
            managers: { connect: [{ id: mustafa.id }] },
        },
    })

    // KUY: managers = [Mustafa]
    await prisma.userGroup.update({
        where: { id: groupKUY.id },
        data: {
            managers: { connect: [{ id: mustafa.id }] },
        },
    })

    console.log("  ✓ Grup ilişkileri kuruldu")
    console.log("\n✅ Tamamlandı!\n")
    console.log("  ┌──────────────────────────────────────────────────────┐")
    console.log("  │ Rol      │ Email                │ Şifre             │")
    console.log("  ├──────────────────────────────────────────────────────┤")
    console.log("  │ ADMIN    │ mustafa@gmail.com    │ manager123        │")
    console.log("  │ MANAGER  │ goksun@gmail.com     │ manager123        │")
    console.log("  │ EMPLOYEE │ enes@gmail.com       │ user123           │")
    console.log("  │ EMPLOYEE │ bengisu@gmail.com    │ user123           │")
    console.log("  │ EMPLOYEE │ esin@gmail.com       │ user123           │")
    console.log("  │ EMPLOYEE │ ali@gmail.com        │ user123           │")
    console.log("  │ EMPLOYEE │ erkan@gmail.com      │ user123           │")
    console.log("  └──────────────────────────────────────────────────────┘")
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
