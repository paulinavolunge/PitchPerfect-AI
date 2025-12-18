import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2, CheckCircle, Sparkles, ArrowRight, User, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

type TrialStep = 'practice' | 'feedback' | 'signup';

const FreeTrial = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<TrialStep>('practice');
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Signup form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const prospectObjection = "Your price is too high compared to competitors.";

  const handleSubmitResponse = async () => {
    if (!userResponse.trim() || userResponse.trim().length < 10) {
      toast.error('Please enter a longer response (at least 10 characters)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the demo-feedback edge function
      const { data, error } = await supabase.functions.invoke('demo-feedback', {
        body: {
          response: userResponse,
          inputType: 'text'
        }
      });

      if (error) {
        console.error('Demo feedback error:', error);
        // Use fallback feedback
        setFeedback(generateFallbackFeedback(userResponse));
        setScore(Math.floor(Math.random() * 3) + 7);
      } else {
        setFeedback(data.feedback || generateFallbackFeedback(userResponse));
        setScore(data.score || Math.floor(Math.random() * 3) + 7);
      }
      
      setStep('feedback');
    } catch (err) {
      console.error('Error getting feedback:', err);
      setFeedback(generateFallbackFeedback(userResponse));
      setScore(7);
      setStep('feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackFeedback = (response: string): string => {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('value') || lowerResponse.includes('roi')) {
      return "Great approach! You focused on value rather than defending the price. Consider adding specific metrics or case studies to make your ROI argument even more compelling.";
    } else if (lowerResponse.includes('understand') || lowerResponse.includes('budget')) {
      return "Good empathetic response! Acknowledging budget concerns builds rapport. Try following up with questions to understand their specific constraints better.";
    } else if (lowerResponse.includes('compare') || lowerResponse.includes('different')) {
      return "Nice competitive positioning! Highlighting differentiation is key. Consider asking what specific features they're comparing to guide the conversation.";
    } else {
      return "Good effort! To strengthen your response, try: 1) Acknowledge their concern, 2) Ask clarifying questions about their needs, 3) Focus on value and outcomes rather than features.";
    }
  };

  const handleContinueToSignup = () => {
    setStep('signup');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSigningUp(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Account created! Check your email to confirm, then log in.');
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSkipSignup = () => {
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Try PitchPerfect AI Free - No Signup Required</title>
        <meta name="description" content="Practice handling sales objections instantly with AI feedback. No signup required for your first session." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-background">
        <Navbar />
        
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto">
            
            {/* Progress indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'practice' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                }`}>
                  1
                </div>
                <div className={`w-12 h-1 ${step !== 'practice' ? 'bg-primary' : 'bg-primary/20'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'feedback' ? 'bg-primary text-primary-foreground' : step === 'signup' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  2
                </div>
                <div className={`w-12 h-1 ${step === 'signup' ? 'bg-primary' : 'bg-primary/20'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'signup' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  3
                </div>
              </div>
            </div>

            {/* Step 1: Practice */}
            {step === 'practice' && (
              <Card className="shadow-lg border-primary/20">
                <CardHeader className="text-center pb-4">
                  <Badge className="w-fit mx-auto mb-3 bg-primary-100 text-primary-700 border-primary-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Free Practice Session
                  </Badge>
                  <CardTitle className="text-2xl">Handle This Objection</CardTitle>
                  <CardDescription>
                    Text mode • Beginner • Price Objection • Technology
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Prospect message */}
                  <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                    <p className="text-sm text-muted-foreground mb-1">Your prospect just said:</p>
                    <p className="text-lg font-medium text-foreground">"{prospectObjection}"</p>
                  </div>

                  {/* User input */}
                  <div className="space-y-2">
                    <Label htmlFor="response" className="text-base">How do you respond?</Label>
                    <Textarea
                      id="response"
                      placeholder="Type your response to handle this pricing objection..."
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      className="min-h-[120px] text-base"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: Focus on value, ask questions, and don't just defend the price.
                    </p>
                  </div>

                  <Button 
                    onClick={handleSubmitResponse} 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading || !userResponse.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing your response...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Get AI Feedback
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Feedback */}
            {step === 'feedback' && feedback && (
              <Card className="shadow-lg border-green-200">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">Great Job!</CardTitle>
                  {score && (
                    <Badge className="w-fit mx-auto mt-2 bg-green-100 text-green-700 border-green-200">
                      Score: {score}/10
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* User's response */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Your response:</p>
                    <p className="text-foreground italic">"{userResponse}"</p>
                  </div>

                  {/* AI Feedback */}
                  <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                    <p className="text-sm font-medium text-primary-700 mb-2">AI Coach Feedback:</p>
                    <p className="text-foreground">{feedback}</p>
                  </div>

                  <Button 
                    onClick={handleContinueToSignup} 
                    className="w-full" 
                    size="lg"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Signup prompt */}
            {step === 'signup' && (
              <Card className="shadow-lg border-primary/20">
                <CardHeader className="text-center pb-4">
                  <Badge className="w-fit mx-auto mb-3 bg-primary-100 text-primary-700 border-primary-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Unlock Full Access
                  </Badge>
                  <CardTitle className="text-2xl">Create Your Free Account</CardTitle>
                  <CardDescription>
                    Save your progress and unlock more scenarios
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Benefits */}
                  <div className="grid gap-3">
                    {[
                      'Track your improvement over time',
                      'Access 50+ objection scenarios',
                      'Voice and text practice modes',
                      'Personalized AI coaching'
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Signup form */}
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isSigningUp}
                    >
                      {isSigningUp ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create Free Account
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="text-center">
                    <button
                      onClick={handleSkipSignup}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Maybe later
                    </button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      onClick={() => navigate('/login')}
                      className="text-primary hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default FreeTrial;
