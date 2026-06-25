import { type Page } from '@playwright/test'

// バックエンドは起動しない。すべての `/api/**` をブラウザ層で横取りし決定的なレスポンスを返す（SOT-1154）。
// authed=false で /auth/me を 401 にすると ProtectedRoute が /login へリダイレクトする。
// シナリオテスト（SOT-1250）と smoke テストで共通利用する。
export async function mockApi(page: Page, opts: { authed: boolean }) {
  await page.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/auth/me')) {
      await route.fulfill({
        status: opts.authed ? 200 : 401,
        contentType: 'application/json',
        body: JSON.stringify({ email: 'test@example.com', uid: 'u1' }),
      })
      return
    }
    if (pathname.endsWith('/auth/login') || pathname.endsWith('/auth/logout')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ email: 'test@example.com', uid: 'u1' }) })
      return
    }
    // 記録一覧などのリスト系は空配列。
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
}
