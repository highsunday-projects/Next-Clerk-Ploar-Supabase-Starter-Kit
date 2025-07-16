import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 定義受保護的路由
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

// 定義公開的認證路由（保留供未來使用）
// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/sign-in(.*)',
//   '/sign-up(.*)',
// ]);

export default clerkMiddleware(async (auth, req) => {
  // 如果是受保護的路由，要求用戶登入
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // 跳過 Next.js 內部路徑和所有靜態檔案
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // 總是執行 API 路由
    '/(api|trpc)(.*)',
  ],
};
