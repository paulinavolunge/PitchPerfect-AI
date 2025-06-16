
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-deep-navy text-white py-8 md:py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold text-lg mb-4 text-white">About PitchPerfect AI</h3>
            <p className="text-gray-300 leading-relaxed">
              Elevate your sales game with AI-powered pitch practice and personalized feedback.
              Perfect your presentations, close more deals, and grow your career.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-gray-300 hover:text-vibrant-blue-300 transition-colors">Dashboard</Link></li>
              <li><Link to="/practice" className="text-gray-300 hover:text-vibrant-blue-300 transition-colors">Practice</Link></li>
              <li><Link to="/roleplay" className="text-gray-300 hover:text-vibrant-blue-300 transition-colors">Roleplay</Link></li>
              <li><Link to="/tips" className="text-gray-300 hover:text-vibrant-blue-300 transition-colors">AI Tips</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-300 hover:text-vibrant-blue-300 transition-colors">About Us</Link></li>
              <li>
                <a 
                  href="mailto:info@pitchperfectai.ai?subject=Contact%20from%20PitchPerfect%20AI%20Website&body=Hi%20PitchPerfect%20AI%20team,%0A%0AI%20would%20like%20to%20get%20in%20touch%20regarding..." 
                  className="text-gray-300 hover:text-vibrant-blue-300 transition-colors inline-flex items-center gap-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail size={16} />
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-gray-300 hover:text-vibrant-blue-300 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-gray-300 hover:text-vibrant-blue-300 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/data-safety" className="text-gray-300 hover:text-vibrant-blue-300 transition-colors">Data Safety</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-600 mt-8 md:mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-300 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} PitchPerfect AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-gray-300 hover:text-vibrant-blue-300 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-300 hover:text-vibrant-blue-300 text-sm transition-colors">
              Terms of Use
            </Link>
            <Link to="/data-safety" className="text-gray-300 hover:text-vibrant-blue-300 text-sm transition-colors">
              Data Safety
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
