// =============================================================================
// CFO Family Finance App — Database Seed
// Dữ liệu mẫu khởi tạo cho môi trường development
// =============================================================================

import { PrismaClient, AccountType, CategoryType, TransactionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ---------------------------------------------------------------------------
  // 1. DEFAULT SYSTEM CATEGORIES (Danh mục mặc định hệ thống)
  // ---------------------------------------------------------------------------
  const systemCategories = [
    // === INCOME ===
    { name: 'Lương & Thu nhập', type: CategoryType.INCOME, icon: '💼', color: '#10b981', children: [
      { name: 'Lương chính', icon: '💰', color: '#10b981' },
      { name: 'Thưởng & Hoa hồng', icon: '🎁', color: '#10b981' },
      { name: 'Thu nhập phụ', icon: '💵', color: '#10b981' },
      { name: 'Freelance', icon: '💻', color: '#10b981' },
    ]},
    { name: 'Đầu tư & Tài sản', type: CategoryType.INCOME, icon: '📈', color: '#10b981', children: [
      { name: 'Lãi tiết kiệm', icon: '🏦', color: '#10b981' },
      { name: 'Cổ tức', icon: '📊', color: '#10b981' },
      { name: 'Cho thuê tài sản', icon: '🏠', color: '#10b981' },
    ]},
    { name: 'Thu nhập khác', type: CategoryType.INCOME, icon: '🎯', color: '#10b981', children: [
      { name: 'Quà tặng nhận', icon: '🎀', color: '#10b981' },
      { name: 'Hoàn tiền', icon: '↩️', color: '#10b981' },
      { name: 'Bán đồ cũ', icon: '🛒', color: '#10b981' },
    ]},

    // === EXPENSE ===
    { name: 'Ăn uống', type: CategoryType.EXPENSE, icon: '🍜', color: '#ef4444', children: [
      { name: 'Nấu ăn tại nhà', icon: '🏠', color: '#ef4444' },
      { name: 'Ăn ngoài', icon: '🍽️', color: '#ef4444' },
      { name: 'Cà phê & Trà sữa', icon: '☕', color: '#ef4444' },
      { name: 'Giao hàng thức ăn', icon: '🛵', color: '#ef4444' },
    ]},
    { name: 'Nhà ở & Tiện ích', type: CategoryType.EXPENSE, icon: '🏠', color: '#f59e0b', children: [
      { name: 'Tiền thuê nhà', icon: '🔑', color: '#f59e0b' },
      { name: 'Điện', icon: '⚡', color: '#f59e0b' },
      { name: 'Nước', icon: '💧', color: '#f59e0b' },
      { name: 'Internet & Điện thoại', icon: '📱', color: '#f59e0b' },
      { name: 'Vật tư gia dụng', icon: '🧹', color: '#f59e0b' },
    ]},
    { name: 'Di chuyển', type: CategoryType.EXPENSE, icon: '🚗', color: '#8b5cf6', children: [
      { name: 'Xăng dầu', icon: '⛽', color: '#8b5cf6' },
      { name: 'Grab & Taxi', icon: '🚕', color: '#8b5cf6' },
      { name: 'Bãi đỗ xe', icon: '🅿️', color: '#8b5cf6' },
      { name: 'Bảo dưỡng xe', icon: '🔧', color: '#8b5cf6' },
    ]},
    { name: 'Sức khỏe & Y tế', type: CategoryType.EXPENSE, icon: '🏥', color: '#ec4899', children: [
      { name: 'Khám bệnh', icon: '🩺', color: '#ec4899' },
      { name: 'Thuốc men', icon: '💊', color: '#ec4899' },
      { name: 'Thể thao & Gym', icon: '💪', color: '#ec4899' },
    ]},
    { name: 'Giáo dục', type: CategoryType.EXPENSE, icon: '📚', color: '#06b6d4', children: [
      { name: 'Học phí', icon: '🎓', color: '#06b6d4' },
      { name: 'Sách & Khóa học online', icon: '📖', color: '#06b6d4' },
      { name: 'Đồ dùng học tập', icon: '✏️', color: '#06b6d4' },
    ]},
    { name: 'Mua sắm', type: CategoryType.EXPENSE, icon: '🛍️', color: '#f97316', children: [
      { name: 'Quần áo & Giày dép', icon: '👗', color: '#f97316' },
      { name: 'Điện tử & Công nghệ', icon: '📱', color: '#f97316' },
      { name: 'Nội thất & Gia dụng', icon: '🛋️', color: '#f97316' },
    ]},
    { name: 'Giải trí', type: CategoryType.EXPENSE, icon: '🎮', color: '#a855f7', children: [
      { name: 'Phim ảnh & Sự kiện', icon: '🎬', color: '#a855f7' },
      { name: 'Game & Streaming', icon: '🎮', color: '#a855f7' },
      { name: 'Du lịch', icon: '✈️', color: '#a855f7' },
    ]},
    { name: 'Con cái', type: CategoryType.EXPENSE, icon: '👶', color: '#fb923c', children: [
      { name: 'Học phí con', icon: '🎒', color: '#fb923c' },
      { name: 'Đồ dùng & Quần áo con', icon: '🧸', color: '#fb923c' },
      { name: 'Hoạt động ngoại khóa', icon: '⚽', color: '#fb923c' },
    ]},
    { name: 'Bảo hiểm', type: CategoryType.EXPENSE, icon: '🛡️', color: '#64748b', children: [
      { name: 'Bảo hiểm nhân thọ', icon: '❤️', color: '#64748b' },
      { name: 'Bảo hiểm xe', icon: '🚗', color: '#64748b' },
      { name: 'Bảo hiểm y tế', icon: '🏥', color: '#64748b' },
    ]},
    { name: 'Hỗ trợ gia đình', type: CategoryType.EXPENSE, icon: '👨‍👩‍👧', color: '#84cc16', children: [
      { name: 'Biếu bố mẹ', icon: '❤️', color: '#84cc16' },
      { name: 'Hỗ trợ anh chị em', icon: '🤝', color: '#84cc16' },
    ]},
    { name: 'Tài chính & Ngân hàng', type: CategoryType.EXPENSE, icon: '💳', color: '#94a3b8', children: [
      { name: 'Phí ngân hàng', icon: '🏦', color: '#94a3b8' },
      { name: 'Lãi thẻ tín dụng', icon: '💳', color: '#ef4444' },
      { name: 'Tiết kiệm định kỳ', icon: '🐷', color: '#10b981' },
    ]},
    { name: 'Quà tặng & Từ thiện', type: CategoryType.EXPENSE, icon: '🎁', color: '#f472b6', children: [
      { name: 'Quà tặng', icon: '🎀', color: '#f472b6' },
      { name: 'Từ thiện', icon: '🙏', color: '#f472b6' },
      { name: 'Tiệc & Sự kiện', icon: '🎉', color: '#f472b6' },
    ]},
    { name: 'Chi phí khác', type: CategoryType.EXPENSE, icon: '📦', color: '#6b7280', children: [] },

    // === TRANSFER ===
    { name: 'Chuyển khoản nội bộ', type: CategoryType.TRANSFER, icon: '↔️', color: '#6366f1', children: [] },
  ]

  console.log('📁 Seeding system categories...')

  for (const cat of systemCategories) {
    const parent = await prisma.category.upsert({
      where: {
        familyId_name_type: {
          familyId: null as any,
          name: cat.name,
          type: cat.type,
        }
      },
      update: {},
      create: {
        familyId: null,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      },
    })

    for (const child of cat.children || []) {
      await prisma.category.upsert({
        where: {
          familyId_name_type: {
            familyId: null as any,
            name: child.name,
            type: cat.type,
          }
        },
        update: {},
        create: {
          familyId: null,
          name: child.name,
          type: cat.type,
          icon: child.icon,
          color: child.color,
          parentId: parent.id,
          isDefault: true,
        },
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 2. DEMO FAMILY (Gia đình demo cho dev/staging)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    console.log('👨‍👩‍👧 Seeding demo family...')

    const husbandUser = await prisma.user.upsert({
      where: { email: 'husband@cfofamily.demo' },
      update: {},
      create: {
        email: 'husband@cfofamily.demo',
        name: 'Nguyễn Văn Anh',
        locale: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND',
      },
    })

    const wifeUser = await prisma.user.upsert({
      where: { email: 'wife@cfofamily.demo' },
      update: {},
      create: {
        email: 'wife@cfofamily.demo',
        name: 'Trần Thị Mai',
        locale: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        currency: 'VND',
      },
    })

    const demoFamily = await prisma.family.upsert({
      where: { id: 'demo-family-001' },
      update: {},
      create: {
        id: 'demo-family-001',
        name: 'Gia đình Nguyễn - Trần',
        currency: 'VND',
        locale: 'vi-VN',
        settings: {
          monthStartDay: 1,
          weekStartDay: 1,
          defaultBudgetPeriod: 'monthly',
        },
        members: {
          create: [
            { userId: husbandUser.id, role: 'OWNER', status: 'ACTIVE', joinedAt: new Date() },
            { userId: wifeUser.id, role: 'ADMIN', status: 'ACTIVE', joinedAt: new Date() },
          ]
        }
      },
    })

    // Tài khoản tài chính demo
    const accounts = await Promise.all([
      prisma.financialAccount.create({
        data: {
          familyId: demoFamily.id,
          name: 'Tài khoản Vietcombank',
          type: AccountType.BANK_ACCOUNT,
          currency: 'VND',
          balance: 45_000_000,
          bankName: 'Vietcombank',
          accountNumber: '3421',
          icon: '🏦',
          color: '#10b981',
          isShared: true,
        }
      }),
      prisma.financialAccount.create({
        data: {
          familyId: demoFamily.id,
          name: 'Ví tiền mặt',
          type: AccountType.CASH,
          currency: 'VND',
          balance: 3_500_000,
          icon: '💵',
          color: '#f59e0b',
        }
      }),
      prisma.financialAccount.create({
        data: {
          familyId: demoFamily.id,
          name: 'Thẻ tín dụng Techcombank Visa',
          type: AccountType.CREDIT_CARD,
          currency: 'VND',
          balance: -8_200_000,  // Dư nợ hiện tại
          creditLimit: 50_000_000,
          statementDay: 25,
          paymentDueDays: 15,
          interestRate: 0.24,  // 24%/năm
          gracePeriodDays: 45,
          bankName: 'Techcombank',
          accountNumber: '8812',
          icon: '💳',
          color: '#ef4444',
        }
      }),
      prisma.financialAccount.create({
        data: {
          familyId: demoFamily.id,
          name: 'Tài khoản MBBank (Vợ)',
          type: AccountType.BANK_ACCOUNT,
          currency: 'VND',
          balance: 12_000_000,
          bankName: 'MBBank',
          accountNumber: '5678',
          icon: '🏦',
          color: '#6366f1',
        }
      }),
      prisma.financialAccount.create({
        data: {
          familyId: demoFamily.id,
          name: 'Tiết kiệm Online ACB 12 tháng',
          type: AccountType.SAVINGS,
          currency: 'VND',
          balance: 80_000_000,
          interestRate: 0.065, // 6.5%/năm
          bankName: 'ACB',
          icon: '🐷',
          color: '#84cc16',
        }
      }),
    ])

    console.log(`✅ Created ${accounts.length} demo accounts`)
    console.log('✅ Seed completed successfully!')
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
