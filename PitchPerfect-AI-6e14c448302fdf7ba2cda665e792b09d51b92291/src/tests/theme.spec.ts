import { render } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'

describe('ThemeProvider', () => {
  it('defaults to light theme and does not add dark class', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">child</div>
      </ThemeProvider>
    )

    // next-themes with defaultTheme='light' should not set a 'dark' class on html
    const htmlClass = document.documentElement.className
    expect(htmlClass.includes('dark')).toBe(false)
  })
})
