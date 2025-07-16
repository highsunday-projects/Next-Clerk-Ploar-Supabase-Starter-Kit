import { Star, Quote } from 'lucide-react';

export default function TestimonialSection() {
  const testimonials = [
    {
      name: '張小明',
      role: '創辦人',
      company: 'TechStart',
      avatar: '/api/placeholder/64/64',
      content: '這個 Starter Kit 讓我們在兩週內就上線了我們的 SaaS 產品。認證、付費和資料庫都已經完美整合，省下了數個月的開發時間。',
      rating: 5
    },
    {
      name: '李美華',
      role: '技術總監',
      company: 'InnovateLab',
      avatar: '/api/placeholder/64/64',
      content: '程式碼品質非常高，文檔詳細，支援也很棒。我們的團隊能夠快速上手並客製化符合我們需求的功能。',
      rating: 5
    },
    {
      name: '王大偉',
      role: '產品經理',
      company: 'StartupHub',
      avatar: '/api/placeholder/64/64',
      content: '從概念到產品上線只花了一個月。這個模板包含了所有我們需要的功能，讓我們能專注在核心業務邏輯上。',
      rating: 5
    }
  ];

  const stats = [
    { number: '1,000+', label: '滿意客戶' },
    { number: '50+', label: '國家使用' },
    { number: '99.9%', label: '正常運行時間' },
    { number: '24/7', label: '技術支援' }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            客戶怎麼說
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            來自世界各地開發者和企業的真實回饋
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-6 relative hover:shadow-lg transition-shadow duration-300"
            >
              {/* Quote Icon */}
              <Quote className="w-8 h-8 text-blue-600 mb-4" />

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">
              值得信賴的數字
            </h3>
            <p className="text-blue-100">
              我們的成果說明一切
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-100 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
