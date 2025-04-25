
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-brand-dark text-white py-8 md:py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <p className="text-gray-300">
              Elevate your sales game with AI-powered pitch practice and personalized feedback.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-gray-300 hover:text-brand-green transition-colors">Dashboard</Link></li>
              <li><Link to="/practice" className="text-gray-300 hover:text-brand-green transition-colors">Practice</Link></li>
              <li><Link to="/tips" className="text-gray-300 hover:text-brand-green transition-colors">AI Tips</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-brand-green transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-green transition-colors">Guides</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-green transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-brand-green transition-colors">About</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-green transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-brand-green transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 md:mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} PitchPerfect AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-brand-green transition-colors text-sm">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-brand-green transition-colors text-sm">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-brand-green transition-colors text-sm">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
