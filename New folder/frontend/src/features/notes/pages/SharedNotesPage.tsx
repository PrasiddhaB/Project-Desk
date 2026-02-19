/**
 * Shared Notes Page - Redirects to Notes with filter
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SharedNotesPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to main notes page - filter handled there
    navigate('/notes', { replace: true });
  }, []);

  return null;
};

export default SharedNotesPage;
