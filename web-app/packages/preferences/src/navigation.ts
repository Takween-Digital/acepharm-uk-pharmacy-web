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
    { href: '/question-bank', label: 'Question Bank', shortLabel: 'Question Bank' },
    { href: '/calculations', label: 'Calculations Coach', shortLabel: 'Calculations Coach' },
    { href: '/ace', label: 'Ace AI Tutor', shortLabel: 'Ace AI Tutor' },
    { href: '/question-bank#modes', label: 'Mock Exams', shortLabel: 'Mock Exams' },
    { href: '/pricing', label: 'Pricing', shortLabel: 'Pricing' },
  ],
  resourcesDropdown: [
    { href: '/blog?tag=guidelines', label: 'Clinical Guidelines Index' },
    { href: '/blog?tag=bnf', label: 'BNF High-Yield Guide' },
    { href: '/calculations#topics', label: 'Calculation Formula Sheet' },
    { href: '/blog?tag=blueprint', label: 'GPhC Exam Blueprint Guide' },
    { href: '/blog', label: 'Revision Guides & Blog', shortLabel: 'Revision Guides' },
    { href: '/faq', label: 'Student FAQ' },
  ],
  company: [
    { href: '/about', label: 'About AcePharm' },
    { href: '/editorial-standards', label: 'Editorial Standards' },
    { href: '/about#team', label: 'Clinical Advisory Team' },
    { href: '/contact', label: 'Contact & Support' },
  ],
  legal: [
    { href: '/terms', label: 'Terms of Service', shortLabel: 'Terms' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookie-policy', label: 'Cookie Policy' },
    { href: '/privacy#security', label: 'Security & Compliance' },
    { href: '/editorial-standards#independence', label: 'Independence Disclaimer' },
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
