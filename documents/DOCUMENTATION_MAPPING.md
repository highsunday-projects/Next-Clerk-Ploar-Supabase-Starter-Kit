---
uuid: eabf4ab46b9d4b58a3d7a7cba2760d1d
---
# Documentation Mapping / 文檔對應關係

This document outlines the correspondence between Chinese and English documentation files.

## Configuration Guides / 配置指南

| 中文文檔 | English Document | Status |
|---------|------------------|--------|
| `Clerk認證策略配置指南.md` | `Clerk-Authentication-Configuration-Guide.md` | ✅ Complete |
| `Supabase配置與使用說明.md` | `Supabase-Configuration-Guide.md` | ✅ Complete |
| `Polar配置與準備說明.md` | `Polar-Configuration-Guide.md` | ✅ Complete |

## Architecture Documentation / 架構文檔

| 中文文檔 | English Document | Status |
|---------|------------------|--------|
| `當前專案架構.md` | `Project-Architecture-Overview.md` | ✅ Complete |

## Feature Requirements / 功能需求文檔

All feature requirement documents are currently in Chinese only and located in the `功能/` directory:

- `F00-功能需求書模板.md` - Feature Requirement Template
- `B00-Bug修正模板.md` - Bug Fix Template  
- `R00-重構任務模板.md` - Refactoring Task Template
- `SF00-簡易功能需求書模板.md` - Simple Feature Requirement Template

## Specialized Documentation / 專業文檔

### User Authentication / 用戶認證
- `用戶認證/Clerk整合說明文件.md` - Chinese only
- `用戶認證/Clerk認證方式說明.md` - Chinese only
- `用戶認證/密碼管理說明.md` - Chinese only
- `user-authentication/Clerk-Integration-Guide.md` - English only

### Database / 資料庫
- `database/Supabase-Configuration-Guide.md` - English only

### Payment / 付費系統
- `訂閱模組/Polar金流整合說明.md` - Chinese only
- `訂閱模組/Polar與Supabase整合關聯說明.md` - Chinese only
- `payment/Polar-Payment-Integration-Guide.md` - English only

## Recommendations / 建議

1. **Standardize file naming**: Use consistent naming patterns for language pairs
2. **Create missing translations**: Some documents only exist in one language
3. **Organize by language**: Consider creating separate language directories
4. **Update README references**: Ensure all documentation links are accurate

## File Organization Suggestions / 文件組織建議

```
documents/
├── en/                           # English documentation
│   ├── configuration/
│   ├── architecture/
│   └── features/
├── zh-TW/                        # Traditional Chinese documentation  
│   ├── configuration/
│   ├── architecture/
│   └── features/
└── shared/                       # Language-neutral files (code, SQL, etc.)
```