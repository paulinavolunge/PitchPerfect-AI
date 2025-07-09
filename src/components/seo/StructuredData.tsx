import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type: 'organization' | 'product' | 'faq' | 'review';
  data: any;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const generateStructuredData = () => {
    const baseUrl = 'https://pitchperfectai.ai';
    
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "PitchPerfect AI",
          "url": baseUrl,
          "logo": `${baseUrl}/assets/logo-pitchperfectai.webp`,
          "description": "AI-powered sales training platform for pitch practice and objection handling",
          "sameAs": [
            // Add social media URLs when available
          ]
        };
        
      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data.name || "PitchPerfect AI",
          "description": data.description || "Practice and perfect your sales pitch with AI-powered roleplay scenarios",
          "brand": {
            "@type": "Brand",
            "name": "PitchPerfect AI"
          },
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "price": data.price || "29",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock"
          }
        };
        
      case 'faq':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": data.map((faq: any) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        };
        
      case 'review':
        return {
          "@context": "https://schema.org",
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": data.rating,
            "bestRating": "5"
          },
          "author": {
            "@type": "Person",
            "name": data.author
          },
          "reviewBody": data.text
        };
        
      default:
        return null;
    }
  };

  const structuredData = generateStructuredData();
  
  if (!structuredData) return null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};