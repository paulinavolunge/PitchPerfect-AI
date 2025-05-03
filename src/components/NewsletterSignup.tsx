
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' })
    .refine(email => !email.endsWith('.con'), {
      message: 'Did you mean .com? Please check your email address',
    })
});

type FormValues = z.infer<typeof formSchema>;

const NewsletterSignup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ''
    },
    mode: 'onBlur' // Validate on blur for better UX
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would integrate with an email service API here
      console.log('Newsletter signup:', data.email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success("Thanks for subscribing to our newsletter!", {
        description: "You'll receive updates on new resources and tips."
      });
      
      form.reset();
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast.error("Couldn't complete your subscription", {
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem className="flex-grow relative">
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Enter your email" 
                          type="email"
                          className={`h-12 ${fieldState.error ? 'border-red-500 focus-visible:ring-red-300' : ''}`}
                          aria-invalid={fieldState.error ? "true" : "false"}
                          {...field} 
                        />
                        {fieldState.error && (
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                            <AlertCircle className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-left absolute text-xs" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="btn-primary h-12 px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </Form>
          
          <p className="text-xs text-brand-dark/60 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
