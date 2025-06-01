
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactElement } from 'react';

// Create a custom render function that includes providers
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries = ['/'], ...renderOptions } = options;
  const queryClient = createQueryClient();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock functions for common testing scenarios
export const mockVoiceService = {
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  isRecording: false,
  transcript: '',
};

export const mockAuth = {
  user: null,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
};

export const mockPerformanceAPI = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

// Voice API mocks
export const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null,
  onerror: null,
  onend: null,
  continuous: true,
  interimResults: true,
};

export const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
};

// Setup global mocks
export const setupMocks = () => {
  // Mock Speech Recognition
  (global as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);
  (global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

  // Mock Speech Synthesis
  (global as any).speechSynthesis = mockSpeechSynthesis;

  // Mock Performance API
  (global as any).performance = {
    ...global.performance,
    ...mockPerformanceAPI,
  };

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const createMockEvent = (type: string, data: any = {}) => {
  return {
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: '' },
    ...data,
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
