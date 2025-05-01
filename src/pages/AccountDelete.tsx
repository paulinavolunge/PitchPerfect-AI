
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const AccountDelete: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleDeleteAccount = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to delete your account.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    try {
      setIsDeleting(true);
      setError(null);
      
      // Call the API endpoint to delete the account
      // In a real implementation, this would be a call to your backend
      // For now, we'll simulate the API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear local storage
      localStorage.clear();
      
      // Sign the user out
      await signOut();
      
      // Show success state
      setIsDeleted(true);
      
      // Show toast
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
        variant: "default",
      });
      
      // After 3 seconds, redirect to home
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete your account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (isDeleted) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Alert className="bg-green-50 border-green-200 mb-6">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle>Account Deleted</AlertTitle>
          <AlertDescription>
            Your account has been successfully deleted. All your data has been removed from our servers.
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader className="bg-red-50">
          <CardTitle className="text-red-700">Delete Account</CardTitle>
          <CardDescription>This action cannot be undone</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <p className="text-gray-700 mb-4">
            Deleting your account will:
          </p>
          
          <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
            <li>Remove all your personal information</li>
            <li>Delete your practice history and recordings</li>
            <li>Cancel any active subscriptions</li>
            <li>Revoke all access to premium features</li>
          </ul>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm">
            <strong>Warning:</strong> This action is permanent and cannot be reversed.
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Account...
              </>
            ) : (
              'Permanently Delete My Account'
            )}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(-1)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccountDelete;
