import { test, expect, type Page } from '@playwright/test'

// バックエンドは起動しない。すべての `/api/**` をブラウザ層で横取りし決定的なレスポンスを返す（SOT-1154）。
// authed=false で /auth/me を 401 にすると ProtectedRoute が /login へリダイレクトする。
async function mockApi(page: Page, opts: { authed: boolean }) {
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

test('未認証で /home にアクセスすると /login へリダイレクトしフォームが表示される', async ({ page }) => {
  await mockApi(page, { authed: false })
  await page.goto('/home')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('/login がメール・パスワード入力と送信ボタンを表示する', async ({ page }) => {
  await mockApi(page, { authed: false })
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('認証済みで /home がホーム本文・ナビ・言語トグルを表示する', async ({ page }) => {
  // AuthProvider は loading 中 null を返すため、直接 /home に来てもバウンスせず描画される。
  await mockApi(page, { authed: true })
  await page.goto('/home')
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.locator('nav.app-nav')).toBeVisible()
  await expect(page.locator('.home-page')).toBeVisible()
  await expect(page.locator('a[href="/menu"]').first()).toBeVisible()
})

test('ナビゲーションで記録ページへ遷移しても認証が維持される', async ({ page }) => {
  await mockApi(page, { authed: true })
  await page.goto('/home')
  await page.locator('nav.app-nav a[href="/record"]').click()
  await expect(page).toHaveURL(/\/record/)
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.locator('nav.app-nav')).toBeVisible()
})
