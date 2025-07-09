import React from 'react';
import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type: 'WebSite' | 'Organization' | 'SoftwareApplication' | 'Service' | 'Article';
  data: any;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const generateStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type,
      ...data
    };

    // Add specific properties based on type
    switch (type) {
      case 'WebSite':
        return {
          ...baseData,
          url: "https://ac4815ee-3287-4227-becd-7ec7f5c2d508.lovableproject.com",
          name: "PitchPerfect AI",
          description: "AI-powered sales training platform for pitch practice and objection handling",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://ac4815ee-3287-4227-becd-7ec7f5c2d508.lovableproject.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        };
      
      case 'Organization':
        return {
          ...baseData,
          name: "PitchPerfect AI",
          url: "https://ac4815ee-3287-4227-becd-7ec7f5c2d508.lovableproject.com",
          description: "Leading AI-powered sales training platform",
          logo: "https://ac4815ee-3287-4227-becd-7ec7f5c2d508.lovableproject.com/assets/logo-pitchperfectai.webp",
          sameAs: [
            "https://linkedin.com/company/pitchperfect-ai",
            "https://twitter.com/pitchperfectai"
          ]
        };
      
      case 'SoftwareApplication':
        return {
          ...baseData,
          name: "PitchPerfect AI",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Free trial available"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "150"
          }
        };
      
      default:
        return baseData;
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData())}
      </script>
    </Helmet>
  );
};