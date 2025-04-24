
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    quote: "PitchPerfect AI helped me increase my close rate by 27% in just three weeks. The feedback is incredibly specific and actionable.",
    author: "Sarah Johnson",
    role: "Sales Executive, Tech Innovators Inc."
  },
  {
    quote: "As a sales manager, I've seen my team's performance skyrocket since implementing PitchPerfect AI into our training routine.",
    author: "Michael Chen",
    role: "Sales Director, Growth Solutions"
  },
  {
    quote: "The AI feedback is like having a personal coach available 24/7. I practice every morning before my calls and it's been game-changing.",
    author: "Jessica Patel",
    role: "Account Manager, Swift Enterprise"
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-brand-dark">What Our Users Say</h2>
          <p className="text-lg text-brand-dark/70">
            Don't just take our word for it - hear from sales professionals who have transformed their pitches
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6 text-4xl text-brand-green">"</div>
                <p className="mb-6 text-brand-dark/80 italic">
                  {testimonial.quote}
                </p>
                <div>
                  <p className="font-medium text-brand-dark">{testimonial.author}</p>
                  <p className="text-sm text-brand-dark/70">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
