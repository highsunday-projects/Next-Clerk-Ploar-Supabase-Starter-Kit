import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const footerLinks = {
    product: {
      title: '產品',
      links: [
        { name: '功能', href: '#features' },
        { name: '定價', href: '#pricing' },
        { name: '更新日誌', href: '#' },
        { name: '路線圖', href: '#' }
      ]
    },
    company: {
      title: '公司',
      links: [
        { name: '關於我們', href: '#' },
        { name: '部落格', href: '#' },
        { name: '職涯', href: '#' },
        { name: '聯絡我們', href: '#' }
      ]
    },
    resources: {
      title: '資源',
      links: [
        { name: '文檔', href: '#' },
        { name: 'API 參考', href: '#' },
        { name: '教學', href: '#' },
        { name: '社群', href: '#' }
      ]
    },
    legal: {
      title: '法律',
      links: [
        { name: '隱私政策', href: '#' },
        { name: '服務條款', href: '#' },
        { name: 'Cookie 政策', href: '#' },
        { name: '安全', href: '#' }
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
                SaaS Starter Kit
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                快速建立現代化 SaaS 應用程式的完整解決方案。
                整合 Next.js、Clerk、Polar 和 Supabase，
                讓您專注於核心業務邏輯。
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
              © 2025 SaaS Starter Kit. 版權所有。
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>使用 ❤️ 製作</span>
              <span>•</span>
              <span>Next.js + Clerk + Polar + Supabase</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
