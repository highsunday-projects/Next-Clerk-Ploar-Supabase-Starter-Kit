import { Check, Star } from 'lucide-react';
import Link from 'next/link';

export default function PricingSection() {
  const plans = [
    {
      name: '免費方案',
      price: '免費',
      period: '',
      description: '適合個人使用和小型專案',
      features: [
        '每月 1,000 次 API 呼叫',
        '基本功能存取',
        '社群支援'
      ],
      buttonText: '開始使用',
      buttonStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    },
    {
      name: '專業方案',
      price: '$29',
      period: '/月',
      description: '適合成長中的團隊和企業',
      features: [
        '每月 10,000 次 API 呼叫',
        '進階功能存取',
        '優先支援',
        '詳細分析報告'
      ],
      buttonText: '立即升級',
      buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700',
      popular: true
    },
    {
      name: '企業方案',
      price: '$99',
      period: '/月',
      description: '適合大型企業和高流量應用',
      features: [
        '每月 100,000 次 API 呼叫',
        '所有功能存取',
        '24/7 專屬支援',
        '自訂整合',
        '進階安全功能'
      ],
      buttonText: '全面啟用',
      buttonStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            選擇適合您的方案
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            從個人專案到企業級應用，我們提供靈活的定價方案
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-blue-500 scale-105' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    最受歡迎
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  href="/dashboard/subscription"
                  className={`block w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 text-center ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            免費方案無需信用卡，付費方案可隨時升級或降級
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              隨時取消
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              無設定費用
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              即時生效
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
