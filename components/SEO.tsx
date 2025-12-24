
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description }) => {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = 'dialysis.live';
    const finalTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    document.title = finalTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        description || 'A complete web-based system for dialysis care, tracking, and insight.'
      );
    }
  }, [title, description, location]);

  return null;
};

export default SEO;
