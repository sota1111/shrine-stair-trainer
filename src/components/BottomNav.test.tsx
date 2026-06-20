import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from './BottomNav'

function renderNav() {
  return render(
    <MemoryRouter>
      <BottomNav />
    </MemoryRouter>,
  )
}

describe('BottomNav', () => {
  it('renders all navigation labels', () => {
    renderNav()
    for (const label of ['今日', '記録', '履歴', 'グラフ', 'サマリ', 'メニュー']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('renders six navigation links', () => {
    renderNav()
    expect(screen.getAllByRole('link')).toHaveLength(6)
  })
})
