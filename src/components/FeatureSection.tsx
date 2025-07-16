import { Shield, CreditCard, Database, Zap } from 'lucide-react';

export default function FeatureSection() {
  const features = [
    {
      icon: Shield,
      title: '完整認證系統',
      description: '使用 Clerk 提供安全的用戶認證、社交登入、多因素認證和組織管理功能。',
      highlights: ['社交登入', '多因素認證', '組織管理', '用戶權限']
    },
    {
      icon: CreditCard,
      title: '付費訂閱管理',
      description: '整合 Polar 處理訂閱計費、發票生成、退款處理和收入分析。',
      highlights: ['訂閱計費', '發票生成', '退款處理', '收入分析']
    },
    {
      icon: Database,
      title: '強大資料庫',
      description: '使用 Supabase 提供 PostgreSQL 資料庫、即時同步、檔案儲存和 Row Level Security。',
      highlights: ['PostgreSQL', '即時同步', '檔案儲存', '安全控制']
    },
    {
      icon: Zap,
      title: '快速開發',
      description: '基於 Next.js 15 和 TypeScript，提供現代化的開發體驗和最佳效能。',
      highlights: ['Next.js 15', 'TypeScript', '響應式設計', 'SEO 優化']
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            為什麼選擇我們的 Starter Kit？
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            整合業界最佳實踐和頂級服務，讓您的 SaaS 產品快速上線
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 leading-relaxed">
                {feature.description}
              </p>

              {/* Highlights */}
              <div className="space-y-2">
                {feature.highlights.map((highlight, highlightIndex) => (
                  <div key={highlightIndex} className="flex items-center text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              準備好開始建立您的 SaaS 了嗎？
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              所有功能都已預先配置完成，您只需要專注於您的核心業務邏輯
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200">
              查看完整功能
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
