
import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
}

const defaultKeywords = "sales pitch practice, objection handling, AI coaching, sales enablement, roleplay training, sales training, pitch improvement, sales skills";

export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  keywords = defaultKeywords,
  canonical,
  ogImage = "/lovable-uploads/og-image.png"
}) => {
  const fullTitle = title.includes('PitchPerfect AI') ? title : `${title} - PitchPerfect AI`;
  
  // Use single canonical URL for all pages
  const getCanonicalUrl = (): string => {
    if (canonical) return canonical;
    
    // Always use production domain for canonical
    const baseUrl = 'https://pitchperfectai.ai';
    
    if (typeof window !== 'undefined') {
      const { pathname } = window.location;
      const cleanPath = pathname === '/' ? '' : pathname.replace(/\/$/, ''); // Remove trailing slash except for root
      return `${baseUrl}${cleanPath}`;
    }
    
    // Fallback for SSR
    return baseUrl;
  };
  
  const canonicalUrl = getCanonicalUrl();

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Mobile favicons */}
      <link rel="apple-touch-icon" sizes="180x180" href="/lovable-uploads/favicon-180x180.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/lovable-uploads/favicon-192x192.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/lovable-uploads/favicon-512x512.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/lovable-uploads/favicon-32x32.png" />
    </Helmet>
  );
};
