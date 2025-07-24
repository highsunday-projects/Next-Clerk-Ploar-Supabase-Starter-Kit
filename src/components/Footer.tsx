'use client';

import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const footerLinks = {
    product: {
      title: t('footer.sections.product.title'),
      links: [
        { name: t('footer.sections.product.links.features'), href: '#features' },
        { name: t('footer.sections.product.links.pricing'), href: '#pricing' },
        { name: t('footer.sections.product.links.changelog'), href: '#' },
        { name: t('footer.sections.product.links.roadmap'), href: '#' }
      ]
    },
    company: {
      title: t('footer.sections.company.title'),
      links: [
        { name: t('footer.sections.company.links.about'), href: '#' },
        { name: t('footer.sections.company.links.blog'), href: '#' },
        { name: t('footer.sections.company.links.careers'), href: '#' },
        { name: t('footer.sections.company.links.contact'), href: '#' }
      ]
    },
    resources: {
      title: t('footer.sections.resources.title'),
      links: [
        { name: t('footer.sections.resources.links.docs'), href: '#' },
        { name: t('footer.sections.resources.links.api'), href: '#' },
        { name: t('footer.sections.resources.links.tutorials'), href: '#' },
        { name: t('footer.sections.resources.links.community'), href: '#' }
      ]
    },
    legal: {
      title: t('footer.sections.legal.title'),
      links: [
        { name: t('footer.sections.legal.links.privacy'), href: '#' },
        { name: t('footer.sections.legal.links.terms'), href: '#' },
        { name: t('footer.sections.legal.links.cookies'), href: '#' },
        { name: t('footer.sections.legal.links.security'), href: '#' }
      ]
    }
  };

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' }
  ];

  return (
    <footer id="about" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold mb-4">
                {t('header.brand')}
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t('footer.description')}
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h4 className="font-semibold mb-4 text-white">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>


        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              {t('footer.copyright')}
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>{t('footer.madeWith')}</span>
              <span>•</span>
              <span>Next.js + Clerk + Polar + Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
