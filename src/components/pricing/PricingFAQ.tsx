
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Can I change plans anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains secure and accessible for 30 days after cancellation. You can export your practice history and analytics during this period."
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund."
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees ever! All plans include free onboarding, training materials, and customer support to get you started quickly."
  },
  {
    question: "Can I get a custom plan if these don't fit?",
    answer: "Absolutely! We work with organizations of all sizes to create custom solutions. Contact our sales team to discuss your specific needs."
  },
  {
    question: "How does seat-based pricing work?",
    answer: "For Team and Professional plans, you pay per active user. You can add or remove users anytime, and billing adjusts automatically on your next cycle."
  },
  {
    question: "Do you offer discounts for annual plans?",
    answer: "Yes! Annual plans save you 20% compared to monthly billing. That's like getting 2 months free when you pay annually."
  },
  {
    question: "What kind of support do you provide?",
    answer: "All plans include email support. Professional and higher tiers get priority support, video tutorials, and dedicated account management."
  }
];

const PricingFAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-brand-dark mb-4">Frequently Asked Questions</h2>
        <p className="text-lg text-brand-dark/70">Everything you need to know about our pricing and plans</p>
      </div>
      
      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div 
            key={index}
            className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <button
              className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 rounded-lg"
              onClick={() => toggleItem(index)}
              aria-expanded={openItems.includes(index)}
            >
              <span className="font-medium text-brand-dark pr-4">{item.question}</span>
              {openItems.includes(index) ? (
                <ChevronUp className="h-5 w-5 text-brand-blue flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
              )}
            </button>
            
            {openItems.includes(index) && (
              <div className="px-6 pb-4">
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-brand-dark/70 leading-relaxed">{item.answer}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <p className="text-brand-dark/70 mb-4">Still have questions?</p>
        <button 
          onClick={() => window.location.href = "mailto:support@pitchperfectai.com?subject=Pricing Question"}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default PricingFAQ;
