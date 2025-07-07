import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    quote: "PitchPerfect AI helped me increase my close rate by 27% in just three weeks. The feedback is incredibly specific and actionable.",
    author: "Sarah Johnson",
    role: "Sales Executive, Tech Innovators Inc.",
    avatar: "/lovable-uploads/1167785f-2451-4e85-a1ae-a2bf86c90a95.png"
  },
  {
    quote: "As a sales manager, I've seen my team's performance skyrocket since implementing PitchPerfect AI into our training routine.",
    author: "Michael Chen",
    role: "Sales Director, Growth Solutions",
    avatar: "/lovable-uploads/255b0025-56b1-4a4a-b966-bb658c0c5a51.png"
  },
  {
    quote: "The AI feedback is like having a personal coach available 24/7. I practice every morning before my calls and it's been game-changing.",
    author: "Jessica Patel",
    role: "Account Manager, Swift Enterprise",
    avatar: "/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png"
  },
  {
    quote: "My cold call success rate doubled after just two weeks of using PitchPerfect AI. The real-time feedback makes all the difference.",
    author: "David Rodriguez",
    role: "Business Development, Nexus Group",
    avatar: "/lovable-uploads/1167785f-2451-4e85-a1ae-a2bf86c90a95.png"
  },
  {
    quote: "Our entire sales team uses PitchPerfect AI daily. It's transformed our approach to customer conversations and boosted revenue.",
    author: "Emma Wilson",
    role: "VP of Sales, Future Technologies",
    avatar: "/lovable-uploads/255b0025-56b1-4a4a-b966-bb658c0c5a51.png"
  }
];

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const isMobile = useIsMobile();
  
  // Calculate how many testimonials to display based on screen size
  const displayCount = isMobile ? 1 : 3;
  
  // Automatically rotate testimonials
  useEffect(() => {
    let intervalId: number | undefined;
    
    if (autoRotate) {
      intervalId = window.setInterval(() => {
        setCurrentIndex(prevIndex => 
          (prevIndex + 1) % (testimonials.length - displayCount + 1)
        );
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRotate, displayCount]);
  
  // Pause rotation when user interacts
  const handleNavigation = (direction: 'prev' | 'next') => {
    setAutoRotate(false);
    
    if (direction === 'prev') {
      setCurrentIndex(prev => 
        prev === 0 ? testimonials.length - displayCount : prev - 1
      );
    } else {
      setCurrentIndex(prev => 
        (prev + 1) % (testimonials.length - displayCount + 1)
      );
    }
    
    // Resume auto-rotation after a period of inactivity
    setTimeout(() => setAutoRotate(true), 10000);
  };
  
  // Get visible testimonials
  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + displayCount);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-deep-navy">What Our Users Say</h2>
          <p className="text-lg text-deep-navy/70 mb-10">
            Don't just take our word for it - hear from sales professionals who have transformed their pitches
          </p>
          
          <Link to="/signup" className="inline-block mb-6">
            <Button 
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-lg hover:shadow-xl flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg touch-target"
              aria-label="Start your free trial now"
            >
              Try Free Now <Rocket className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} aria-hidden="true" />
            </Button>
          </Link>
        </div>
        
        <div className="relative">
          <div className="flex justify-between items-center absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10 px-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation('prev')}
              className="bg-white shadow-lg border hover:bg-primary-50 hover:border-primary-200 touch-target"
              aria-label="Show previous testimonials"
            >
              <ArrowLeft size={24} aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigation('next')}
              className="bg-white shadow-lg border hover:bg-primary-50 hover:border-primary-200 touch-target"
              aria-label="Show next testimonials"
            >
              <ArrowRight size={24} aria-hidden="true" />
            </Button>
          </div>
          
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {visibleTestimonials.map((testimonial, index) => (
                    <Card key={index} className="border-none shadow-lg" role="article" aria-labelledby={`testimonial-${index}-author`}>
                      <CardContent className="p-8">
                        <div className="flex items-center mb-6">
                          <Avatar className="h-12 w-12 border-2 border-primary-200">
                            <AvatarImage 
                              src={testimonial.avatar} 
                              alt={`Profile photo of ${testimonial.author}`}
                            />
                            <AvatarFallback className="bg-primary-100 text-primary-700 font-semibold">
                              {testimonial.author.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="mb-6 text-4xl text-primary-600" aria-hidden="true">"</div>
                        <blockquote className="mb-6 text-deep-navy/80 italic">
                          {testimonial.quote}
                        </blockquote>
                        <div>
                          <p id={`testimonial-${index}-author`} className="font-medium text-deep-navy">{testimonial.author}</p>
                          <p className="text-sm text-deep-navy/70">{testimonial.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex justify-center mt-8">
          {Array.from({ length: testimonials.length - displayCount + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setAutoRotate(false);
                setTimeout(() => setAutoRotate(true), 10000);
              }}
              className={`h-2 w-2 mx-1 rounded-full touch-target transition-colors ${
                currentIndex === idx ? 'bg-primary-600' : 'bg-muted-foreground/30 hover:bg-primary-300'
              }`}
              aria-label={`Show testimonials ${idx + 1} to ${Math.min(idx + displayCount, testimonials.length)}`}
              aria-current={currentIndex === idx ? 'true' : 'false'}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
