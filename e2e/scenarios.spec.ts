import { test, expect } from '@playwright/test'
import { mockApi } from './support/mockApi'

// SOT-1250: ボタン操作を自動化し、画面遷移が期待どおりかを検証するシナリオテスト。
// 既存 smoke と同じく全 `/api/**` をモックし、決定的に実行する。

// S3: ホーム → タイマー記録（/record へ遷移し、タイマータブが表示される）
test('S3: ホームからタイマー記録を開始すると /record へ遷移しタイマータブが表示される', async ({ page }) => {
  await mockApi(page, { authed: true })
  await page.goto('/home')

  await page.getByTestId('home-start-timer').click()

  // /timer は /record へリダイレクトされる
  await expect(page).toHaveURL(/\/record/)
  // タイマータブが既定で選択状態
  const timerTab = page.getByTestId('tab-timer')
  await expect(timerTab).toBeVisible()
  await expect(timerTab).toHaveAttribute('aria-selected', 'true')
})

// S4: 記録作成 → 履歴反映（手動入力で記録を保存すると /history へ遷移し、作成データが表示される）
test('S4: 手動入力で記録を作成すると /history へ遷移し作成データが履歴に表示される', async ({ page }) => {
  await mockApi(page, { authed: true })
  await page.goto('/record')

  // 手動入力タブへ切り替え
  await page.getByTestId('tab-manual').click()

  // 一意なメモを入力（履歴での照合用）。既定の日付・種目で十分に保存可能。
  const memo = `SOT-1250 シナリオ ${Date.now()}`
  await page.getByTestId('record-memo').fill(memo)

  await page.getByTestId('record-save').click()

  // 履歴ページへ遷移し、作成した記録（メモ）が表示される
  await expect(page).toHaveURL(/\/history/)
  await expect(page.getByText(memo)).toBeVisible()
})

// S1: 認証ガード（未認証で各保護ルートへアクセスすると /login へリダイレクトされる）
test('S1: 未認証で保護ルートへアクセスすると /login へリダイレクトされる', async ({ page }) => {
  await mockApi(page, { authed: false })

  for (const path of ['/home', '/record', '/history', '/charts', '/summary', '/menu']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login/)
  }
  await expect(page.locator('input[type="email"]')).toBeVisible()
})

// S2: ログイン成功（メール・パスワードを入力して送信すると /record へ遷移する）
test('S2: ログイン成功で /record へ遷移しナビが表示される', async ({ page }) => {
  await mockApi(page, { authed: false })
  await page.goto('/login')

  await page.locator('input[type="email"]').fill('test@example.com')
  await page.locator('input[type="password"]').fill('password123')
  await page.locator('button[type="submit"]').click()

  // LoginPage は成功時 /record へ遷移する
  await expect(page).toHaveURL(/\/record/)
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.locator('nav.app-nav')).toBeVisible()
})

// S5: 全ナビ網羅（トップナビの各リンクをクリックし対応ページへ遷移する）
test('S5: トップナビの各リンクで対応ページへ遷移する', async ({ page }) => {
  await mockApi(page, { authed: true })
  await page.goto('/home')

  for (const route of ['/record', '/history', '/charts', '/summary', '/menu', '/home']) {
    await page.locator(`nav.app-nav a[href="${route}"]`).click()
    await expect(page).toHaveURL(new RegExp(`${route}$`))
    await expect(page).not.toHaveURL(/\/login/)
  }
})

// S6: 週次メニュー（メニューへ遷移すると週間メニュー画面が表示される）
test('S6: メニューへ遷移すると週間トレーニングメニューが表示される', async ({ page }) => {
  await mockApi(page, { authed: true })
  await page.goto('/home')

  await page.locator('nav.app-nav a[href="/menu"]').click()

  await expect(page).toHaveURL(/\/menu/)
  await expect(page.locator('.weekly-menu-page')).toBeVisible()
  // 既定言語(ja)の見出しで照合
  await expect(page.getByRole('heading', { name: /週間トレーニングメニュー/ })).toBeVisible()
})

// S7: 言語トグル（EN/JP の切替でナビ文言が日英で切り替わる）
test('S7: 言語トグルでナビ文言が日英切り替わる', async ({ page }) => {
  await mockApi(page, { authed: true })
  await page.goto('/home')

  const homeNav = page.locator('nav.app-nav a[href="/home"]')

  await page.getByTestId('lang-en').click()
  await expect(homeNav).toHaveText(/Home/)

  await page.getByTestId('lang-ja').click()
  await expect(homeNav).toHaveText(/ホーム/)
})

// S8: ログアウト（ログアウトすると保護ルートから /login へ戻る）
test('S8: ログアウトすると /login へ戻る', async ({ page }) => {
  await mockApi(page, { authed: true })
  await page.goto('/home')

  await page.getByTestId('logout-btn').click()

  await expect(page).toHaveURL(/\/login/)
  await expect(page.locator('input[type="email"]')).toBeVisible()
})
