
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | PitchPerfect AI</title>
        <meta name="description" content="The page you're looking for doesn't exist. Return to PitchPerfect AI to practice and perfect your sales pitch with AI-powered roleplay scenarios." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`${window.location.origin}/404`} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold text-brand-dark mb-6">404</h1>
          <div className="w-24 h-1 bg-brand-green mx-auto mb-8"></div>
          <p className="text-2xl text-gray-700 mb-3">Page not found</p>
          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
            The page you are looking for might have been removed, had its name 
            changed, or is temporarily unavailable.
          </p>
          
          <p className="text-gray-500 mb-6">
            Looking for: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{location.pathname}</span>
          </p>
          
          <div className="space-y-4">
            <Link to="/">
              <Button className="bg-brand-green hover:bg-brand-green/90 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
};

export default NotFound;
