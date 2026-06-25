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
