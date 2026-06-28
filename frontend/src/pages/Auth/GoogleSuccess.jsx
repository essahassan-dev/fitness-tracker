import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const GoogleSuccess = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      window.location.replace('/login');
      return;
    }

    // Use the SAME key as AuthContext — 'FitStack_token'
    localStorage.setItem('FitStack_token', token);

    // Fetch user and store with the correct key
    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          localStorage.setItem('FitStack_user', JSON.stringify(data.user));
          window.location.replace('/dashboard');
        } else {
          localStorage.removeItem('FitStack_token');
          window.location.replace('/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('FitStack_token');
        window.location.replace('/login');
      });
  }, []);

  return <LoadingSpinner fullScreen text="Signing you in..." />;
};

export default GoogleSuccess;
