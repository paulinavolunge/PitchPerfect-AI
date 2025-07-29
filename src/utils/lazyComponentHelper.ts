import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Helper function to create lazy components with error handling
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error('Failed to load lazy component:', error);
      // Return a fallback component that displays an error
      return {
        default: (() => {
          return (
            <div className="p-4 text-red-600 bg-red-50 rounded">
              Failed to load component. Please refresh the page.
            </div>
          );
        }) as T
      };
    }
  });
}

// Preload function with error handling
export async function preloadComponent(
  importFn: () => Promise<any>
): Promise<void> {
  try {
    await importFn();
  } catch (error) {
    console.error('Failed to preload component:', error);
  }
}