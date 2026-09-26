export interface NavLink {
  href: string;
  label: string;
  shortLabel?: string;
  description?: string;
}

export interface SiteNavigationConfig {
  primary: NavLink[];
  productDropdown: NavLink[];
  resourcesDropdown: NavLink[];
  footerProduct: NavLink[];
  footerResources: NavLink[];
  company: NavLink[];
  legal: NavLink[];
  auth: {
    login: NavLink;
    register: NavLink;
  };
}

/**
 * Single source of truth for site-wide navigation links and destination labels.
 * Eliminates naming drift between header dropdowns, mobile navigation, and footer columns.
 * Complies with Section 2.1 and Section 2.12 of the AcePharm copy deck.
 */
export const SITE_NAVIGATION: SiteNavigationConfig = {
  primary: [
    { href: '/question-bank', label: 'Question Bank' },
    { href: '/calculations', label: 'Calculations' },
    { href: '/ace', label: 'Ace' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ],
  productDropdown: [
    { href: '/features', label: 'All Features Overview', shortLabel: 'Features' },
    { href: '/question-bank#modes', label: 'Mock Exams', shortLabel: 'Mock Exams' },
  ],
  resourcesDropdown: [
    { href: '/blog', label: 'Revision Guides & Blog', shortLabel: 'Revision Guides' },
    { href: '/blog?tag=guidelines', label: 'Clinical Guidelines Index' },
    { href: '/blog?tag=bnf', label: 'BNF High-Yield Guide' },
    { href: '/blog?tag=blueprint', label: 'GPhC Exam Blueprint Guide' },
    { href: '/faq', label: 'Student FAQ' },
  ],
  footerProduct: [
    { href: '/question-bank', label: 'Question Bank' },
    { href: '/features#progress', label: 'Progress' },
    { href: '/pricing', label: 'Pricing' },
  ],
  footerResources: [
    { href: '/blog', label: 'Blog' },
    { href: '/help-centre', label: 'Help Centre' },
    { href: '/faq', label: 'Student FAQ' },
  ],
  company: [
    { href: '/editorial-standards', label: 'Editorial Standards' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/terms', label: 'Terms' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/cookie-policy', label: 'Cookie Policy' },
    { href: '/accessibility', label: 'Accessibility' },
    { href: '/terms#acceptable-use', label: 'Acceptable Use' },
    { href: '/ai-use-policy', label: 'AI Use Policy' },
  ],
  auth: {
    login: {
      href: 'https://app.acepharmexams.co.uk/auth/login',
      label: 'Log in',
    },
    register: {
      href: 'https://app.acepharmexams.co.uk/auth/register',
      label: 'Start revising free',
    },
  },
};
