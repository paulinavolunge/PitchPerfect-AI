
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const features = [
  "Real-time voice analysis",
  "Personalized improvement tips", 
  "Progress tracking dashboard",
  "AI-powered feedback"
];

// Form validation schema for trial signup
const trialFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  company: z.string().min(1, { message: "Company name is required" })
});

// Form validation schema for demo booking
const demoFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  company: z.string().min(1, { message: "Company name is required" })
});

type TrialFormValues = z.infer<typeof trialFormSchema>;
type DemoFormValues = z.infer<typeof demoFormSchema>;

interface CTASectionProps {
  activeSection?: string | null;
}

const CTASection: React.FC<CTASectionProps> = ({ activeSection }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmittingTrial, setIsSubmittingTrial] = useState(false);
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);
  const [showDemoSuccess, setShowDemoSuccess] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);

  // Show demo dialog if activeSection is 'demo'
  useEffect(() => {
    if (activeSection === 'demo') {
      setShowDemoDialog(true);
    } else if (activeSection === 'trial') {
      // Focus on the trial form fields
      const nameInput = document.getElementById('trial-name-input');
      if (nameInput) {
        nameInput.focus();
      }
    }
  }, [activeSection]);

  // Trial form setup
  const trialForm = useForm<TrialFormValues>({
    resolver: zodResolver(trialFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      company: ''
    }
  });

  // Demo form setup
  const demoForm = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      company: ''
    }
  });

  // Handle trial signup submission
  const onTrialSubmit = async (data: TrialFormValues) => {
    setIsSubmittingTrial(true);
    try {
      // Create a new user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: generatePassword(), // Generate a random secure password
        options: {
          data: {
            full_name: data.fullName,
            company: data.company,
            is_trial: true,
            trial_start_date: new Date().toISOString(),
          },
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Success - redirect to dashboard
      toast({
        title: "Trial Started!",
        description: "Your free trial has been activated. Welcome!",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error starting trial:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingTrial(false);
    }
  };

  // Handle demo booking submission
  const onDemoSubmit = async (data: DemoFormValues) => {
    setIsSubmittingDemo(true);
    try {
      // Insert demo request into Supabase
      const { error } = await supabase
        .from('demo_requests')
        .insert({
          full_name: data.fullName,
          email: data.email,
          company: data.company,
          requested_at: new Date().toISOString(),
          status: 'pending'
        });

      if (error) {
        throw new Error(error.message);
      }

      // Show success message
      setShowDemoDialog(false);
      setShowDemoSuccess(true);
      demoForm.reset();
      
      toast({
        title: "Demo Requested",
        description: "Thank you! We'll reach out shortly to schedule your demo.",
      });
    } catch (error) {
      console.error('Error booking demo:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book demo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDemo(false);
    }
  };

  // Generate a secure random password
  const generatePassword = (): string => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Handle Book Demo button click
  const handleBookDemoClick = () => {
    setShowDemoDialog(true);
  };

  return (
    <section className="py-24 bg-gradient-to-br from-brand-dark to-black text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to perfect your <span className="text-brand-blue">sales pitch</span>?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join thousands of sales professionals who are closing more deals with PitchPerfect AI.
            </p>
            
            <ul className="space-y-3 mb-10">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-brand-green min-w-[20px]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                className="btn-primary" 
                form="trial-form" 
                type="submit" 
                disabled={isSubmittingTrial}
              >
                {isSubmittingTrial ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </Button>
              <Button 
                className="btn-primary"
                disabled={isSubmittingDemo}
                onClick={handleBookDemoClick}
              >
                {isSubmittingDemo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Book a Demo'
                )}
              </Button>
            </div>
          </div>
          
          <div className="bg-brand-dark/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
            {showDemoSuccess ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-6 w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-medium mb-4 text-center text-brand-blue">Thanks! We'll reach out shortly.</h3>
                <p className="text-white/80 text-center mb-6">
                  Our team will contact you to schedule your personalized demo.
                </p>
                <Button 
                  variant="outline" 
                  className="border-white/20 hover:bg-white/10"
                  onClick={() => setShowDemoSuccess(false)}
                >
                  Request another demo
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-medium mb-2 text-brand-blue">Try PitchPerfect AI Today</h3>
                <p className="text-white/80 mb-6">
                  Start your 14-day free trial. No credit card required.
                </p>
                
                <Form {...trialForm}>
                  <form id="trial-form" onSubmit={trialForm.handleSubmit(onTrialSubmit)} className="space-y-4">
                    <FormField
                      control={trialForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              id="trial-name-input"
                              placeholder="Full Name" 
                              {...field}
                              className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trialForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Work Email" 
                              {...field}
                              className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trialForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Company Name" 
                              {...field}
                              className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="btn-primary w-full">
                      {isSubmittingTrial ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        'Get Started'
                      )}
                    </Button>
                  </form>
                </Form>
                
                <p className="text-white/60 text-sm mt-4 text-center">
                  By signing up, you agree to our Terms and Privacy Policy
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Demo Request Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="bg-brand-dark text-white border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl text-brand-blue">Book a Demo</DialogTitle>
            <DialogDescription className="text-white/80">
              Fill out the form below and we'll contact you to schedule a personalized demo.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...demoForm}>
            <form onSubmit={demoForm.handleSubmit(onDemoSubmit)} className="space-y-4 mt-4">
              <FormField
                control={demoForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Full Name" 
                        {...field}
                        className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={demoForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Work Email" 
                        {...field}
                        className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={demoForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Company Name" 
                        {...field}
                        className="w-full bg-white/10 rounded-lg border border-white/20 p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-brand-green"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isSubmittingDemo}
              >
                {isSubmittingDemo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Request Demo'
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CTASection;
