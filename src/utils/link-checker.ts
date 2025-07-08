
export const checkInternalLinks = () => {
  const links = document.querySelectorAll('a[href^="/"], a[href^="#"]');
  const brokenLinks: string[] = [];

  links.forEach((link) => {
    const href = (link as HTMLAnchorElement).href;
    const pathname = new URL(href).pathname;

    // Define valid routes
    const validRoutes = [
      '/',
      '/login',
      '/signup',
      '/dashboard',
      '/demo',
      '/practice',
      '/pricing',
      '/about',
      '/privacy',
      '/terms',
      '/voice-training',
      '/analytics',
      '/ai-roleplay',
      '/roleplay',
      '/tips',
      '/progress'
    ];

    if (!validRoutes.includes(pathname) && !pathname.startsWith('#')) {
      brokenLinks.push(href);
    }
  });

  if (brokenLinks.length > 0) {
    console.warn('Potential broken internal links found:', brokenLinks);
  }

  return brokenLinks;
};

export const validateRoutes = () => {
  // This would be expanded to check actual route definitions
  const routes = [
    { path: '/', component: 'Index' },
    { path: '/login', component: 'Login' },
    { path: '/signup', component: 'Signup' },
    { path: '/dashboard', component: 'Dashboard' },
    { path: '/demo', component: 'Demo' },
    { path: '/practice', component: 'Practice' },
    { path: '/pricing', component: 'Pricing' },
    { path: '/voice-training', component: 'VoiceTraining' },
    { path: '/analytics', component: 'Analytics' },
    { path: '/ai-roleplay', component: 'AIRoleplay' },
    { path: '/roleplay', component: 'RolePlay' }
  ];

  return routes;
};
