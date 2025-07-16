import { 
  Crown, 
  Check, 
  CreditCard, 
  Calendar,
  AlertCircle,
  Star
} from 'lucide-react';

export default function SubscriptionPage() {
  // 模擬當前訂閱數據
  const currentSubscription = {
    plan: '專業版',
    price: 29,
    period: 'month',
    status: 'active',
    nextBilling: '2025-08-16',
    paymentMethod: '**** **** **** 4242',
    features: [
      '無限專案',
      '進階分析',
      '優先客服支援',
      '50GB 儲存空間',
      '自訂品牌',
      'API 存取權限'
    ]
  };

  // 可用的訂閱方案
  const plans = [
    {
      name: '入門版',
      price: 0,
      period: 'month',
      description: '適合個人使用和小型專案',
      features: [
        '最多 3 個專案',
        '基本分析',
        '社群支援',
        '1GB 儲存空間',
        '基本 API 存取'
      ],
      current: false,
      popular: false
    },
    {
      name: '專業版',
      price: 29,
      period: 'month',
      description: '適合成長中的團隊和企業',
      features: [
        '無限專案',
        '進階分析',
        '優先客服支援',
        '50GB 儲存空間',
        '自訂品牌',
        'API 存取權限'
      ],
      current: true,
      popular: true
    },
    {
      name: '企業版',
      price: 99,
      period: 'month',
      description: '適合大型企業和高流量應用',
      features: [
        '無限專案',
        '企業級分析',
        '24/7 專屬支援',
        '無限儲存空間',
        '白標解決方案',
        '專屬客戶經理',
        'SLA 保證'
      ],
      current: false,
      popular: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">訂閱管理</h1>
        <p className="text-gray-600">
          管理您的訂閱方案、付費方式和帳單資訊
        </p>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            目前訂閱
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentSubscription.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {currentSubscription.status === 'active' ? '使用中' : '未啟用'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline mb-2">
              <span className="text-3xl font-bold text-gray-900">{currentSubscription.plan}</span>
              <span className="ml-2 text-lg text-gray-600">
                ${currentSubscription.price}/{currentSubscription.period === 'month' ? '月' : '年'}
              </span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                下次計費：{currentSubscription.nextBilling}
              </div>
              <div className="flex items-center text-gray-600">
                <CreditCard className="w-4 h-4 mr-2" />
                付款方式：{currentSubscription.paymentMethod}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">包含功能：</h4>
              <ul className="space-y-1">
                {currentSubscription.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-3">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              更新付款方式
            </button>
            <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              下載發票
            </button>
            <button className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors duration-200">
              取消訂閱
            </button>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">變更訂閱方案</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative border-2 rounded-lg p-6 transition-all duration-200 ${
                plan.current 
                  ? 'border-blue-500 bg-blue-50' 
                  : plan.popular
                  ? 'border-purple-500 hover:border-purple-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && !plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    推薦
                  </span>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    目前方案
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{plan.period === 'month' ? '月' : '年'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="text-sm text-gray-600 flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.current}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  plan.current
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.price > currentSubscription.price
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : plan.price === 0
                    ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'border border-orange-300 text-orange-700 hover:bg-orange-50'
                }`}
              >
                {plan.current 
                  ? '目前方案' 
                  : plan.price > currentSubscription.price 
                  ? '升級' 
                  : plan.price === 0
                  ? '降級至免費'
                  : '降級'
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">計費說明</h3>
            <p className="text-sm text-yellow-700 mt-1">
              方案變更將在下個計費週期生效。如果您升級方案，將立即按比例收費。
              如果您降級方案，變更將在當前計費週期結束時生效。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
