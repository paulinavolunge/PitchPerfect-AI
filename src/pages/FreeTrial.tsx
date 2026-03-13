import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FreeTrial = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/demo', { replace: true });
  }, [navigate]);

  return null;
};

export default FreeTrial;
