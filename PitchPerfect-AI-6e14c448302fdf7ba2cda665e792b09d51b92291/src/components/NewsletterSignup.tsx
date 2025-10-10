
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ValidatedInput } from '@/components/ui/validated-input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { emailSchema } from '@/utils/formValidation';

const formSchema = z.object({
  email: emailSchema
});

type FormValues = z.infer<typeof formSchema>;

const NewsletterSignup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ''
    },
    mode: 'onChange' // Enable real-time validation
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsSuccess(true);
      toast.success("Welcome to our newsletter!", {
        description: "You'll receive updates on new resources and tips.",
        icon: <CheckCircle2 className="h-4 w-4" />
      });
      
      form.reset();
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error("Couldn't complete your subscription", {
        description: "Please try again later.",
        icon: <AlertCircle className="h-4 w-4" />
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmail = (email: string): string | undefined => {
    try {
      emailSchema.parse(email);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message;
      }
      return 'Invalid email';
    }
  };

  return (
    <section className="bg-brand-blue/5 py-12 border-t border-b border-brand-blue/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block bg-brand-blue/10 p-2 rounded-full mb-4">
            <Mail className="h-6 w-6 text-brand-blue" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-3">
            Get Sales Tips & Resources
          </h2>
          <p className="text-brand-dark/70 mb-6 max-w-lg mx-auto">
            Subscribe to our newsletter for weekly sales strategies, pitch templates, and AI insights to boost your sales performance.
          </p>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-grow">
              <ValidatedInput
                id="newsletter-email"
                placeholder="Enter your email address"
                type="email"
                value={form.watch('email')}
                onChange={(value) => form.setValue('email', value, { shouldValidate: true })}
                validateOnChange={validateEmail}
                error={form.formState.errors.email?.message}
                success={form.formState.isValid && form.watch('email').length > 0}
                hint="We'll never spam you or share your email"
                className="h-12"
                disabled={isSubmitting}
              />
            </div>
            
            <Button 
              type="submit" 
              className="btn-primary h-12 px-6 flex-shrink-0"
              disabled={isSubmitting || !form.formState.isValid || !form.watch('email')}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Subscribing...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Subscribed!
                </>
              ) : (
                'Subscribe'
              )}
            </Button>
          </form>
          
          <p className="text-xs text-brand-dark/60 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
          
          {isSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
              <p className="text-sm text-green-700 font-medium">
                🎉 Thanks for subscribing! Check your email for a welcome message.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
