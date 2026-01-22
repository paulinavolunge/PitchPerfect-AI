
export default {
  // Hide the Lovable badge for production deployment
  hideBadge: true,
  
  // Additional configuration for production
  build: {
    optimization: true,
    minify: true
  }
};
