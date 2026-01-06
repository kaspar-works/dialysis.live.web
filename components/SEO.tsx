
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

const BASE_URL = 'https://dialysis.live';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION = 'A secure, clinical-grade platform for renal patients and caregivers. Track dialysis sessions, fluid intake, dry weight stability, and medications with AI-powered insights.';

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false
}) => {
  const location = useLocation();

  useEffect(() => {
    // Don't append domain to title for SEO best practices
    const finalTitle = title || 'Modern Kidney Dialysis Management Platform';
    const finalDescription = description || DEFAULT_DESCRIPTION;
    const currentUrl = `${BASE_URL}${location.pathname}`;

    // Update document title
    document.title = finalTitle;

    // Helper to update or create meta tag
    const updateMeta = (selector: string, content: string, attribute: string = 'content') => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (element) {
        element.setAttribute(attribute, content);
      } else {
        element = document.createElement('meta');
        const [attr, value] = selector.replace(/[\[\]'"]/g, '').split('=');
        if (attr === 'name' || attr === 'property') {
          element.setAttribute(attr, value);
        }
        element.setAttribute(attribute, content);
        document.head.appendChild(element);
      }
    };

    // Helper to update or create link tag
    const updateLink = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (element) {
        element.href = href;
      } else {
        element = document.createElement('link');
        element.rel = rel;
        element.href = href;
        document.head.appendChild(element);
      }
    };

    // Update primary meta tags
    updateMeta('meta[name="description"]', finalDescription);
    updateMeta('meta[name="title"]', finalTitle);

    // Update robots
    if (noIndex) {
      updateMeta('meta[name="robots"]', 'noindex, nofollow');
    } else {
      updateMeta('meta[name="robots"]', 'index, follow');
    }

    // Update canonical URL
    updateLink('canonical', currentUrl);

    // Update Open Graph tags
    updateMeta('meta[property="og:title"]', finalTitle);
    updateMeta('meta[property="og:description"]', finalDescription);
    updateMeta('meta[property="og:url"]', currentUrl);
    updateMeta('meta[property="og:image"]', image);
    updateMeta('meta[property="og:type"]', type);

    // Update Twitter tags
    updateMeta('meta[name="twitter:title"]', finalTitle);
    updateMeta('meta[name="twitter:description"]', finalDescription);
    updateMeta('meta[name="twitter:url"]', currentUrl);
    updateMeta('meta[name="twitter:image"]', image);

  }, [title, description, image, type, noIndex, location]);

  return null;
};

export default SEO;
