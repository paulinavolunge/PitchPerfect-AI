import React from 'react';
import { Button } from '@/components/ui/button';
import { captureError } from '@/lib/sentry';
import { AlertTriangle } from 'lucide-react';

const TestError: React.FC = () => {
  const [errorThrown, setErrorThrown] = React.useState(false);

  const throwError = () => {
    throw new Error('Test error: This is a test error thrown from TestError page');
  };

  const captureManualError = () => {
    const error = new Error('Test error: Manual error capture');
    captureError(error, {
      page: 'TestError',
      action: 'manual_capture',
      timestamp: new Date().toISOString()
    });
    alert('Manual error captured and sent to Sentry');
  };

  const throwAsyncError = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Test error: Async error from TestError page');
  };

  const triggerNetworkError = async () => {
    try {
      await fetch('https://non-existent-domain-for-testing.com/api/test');
    } catch (error) {
      throw new Error('Test error: Network request failed');
    }
  };

  if (errorThrown) {
    throw new Error('Test error: Component error boundary test');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Sentry Error Test Page
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Use the buttons below to test different error scenarios
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={throwError}
            variant="destructive"
            className="w-full"
          >
            Throw Synchronous Error
          </Button>
          
          <Button 
            onClick={captureManualError}
            variant="outline"
            className="w-full"
          >
            Capture Manual Error
          </Button>
          
          <Button 
            onClick={throwAsyncError}
            variant="outline"
            className="w-full"
          >
            Throw Async Error
          </Button>
          
          <Button 
            onClick={triggerNetworkError}
            variant="outline"
            className="w-full"
          >
            Trigger Network Error
          </Button>
          
          <Button 
            onClick={() => setErrorThrown(true)}
            variant="outline"
            className="w-full"
          >
            Test Error Boundary
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded text-sm text-blue-700">
          <p className="font-semibold mb-1">Note:</p>
          <p>Errors will only be sent to Sentry in production mode with a valid DSN configured.</p>
        </div>
      </div>
    </div>
  );
};

export default TestError;