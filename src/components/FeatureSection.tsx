'use client';

import { Shield, CreditCard, Database, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FeatureSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      title: t('features.items.auth.title'),
      description: t('features.items.auth.description'),
      highlights: t('features.items.auth.highlights') as unknown as string[]
    },
    {
      icon: CreditCard,
      title: t('features.items.payment.title'),
      description: t('features.items.payment.description'),
      highlights: t('features.items.payment.highlights') as unknown as string[]
    },
    {
      icon: Database,
      title: t('features.items.database.title'),
      description: t('features.items.database.description'),
      highlights: t('features.items.database.highlights') as unknown as string[]
    },
    {
      icon: Zap,
      title: t('features.items.development.title'),
      description: t('features.items.development.description'),
      highlights: t('features.items.development.highlights') as unknown as string[]
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('features.subtitle')}
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
              {t('features.cta.title')}
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {t('features.cta.subtitle')}
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200">
              {t('features.cta.button')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
