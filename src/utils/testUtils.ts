
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactElement } from 'react'

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries = ['/'], ...renderOptions } = options
  const queryClient = createQueryClient()

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export * from '@testing-library/react'
export { customRender as render }
