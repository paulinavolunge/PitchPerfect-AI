(function(){
  try {
    var hasConsent = localStorage.getItem('analytics-consent') === 'true';
    if (!hasConsent) return;

    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }

    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-HVCRJT504Y';
    document.head.appendChild(gaScript);

    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-P2ZQPJGM';
    document.head.appendChild(j);

    gtag('js', new Date());
    gtag('config', 'G-HVCRJT504Y', { send_page_view: true });
  } catch (e) {
    // swallow
  }
})();