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

    // Store token immediately
    localStorage.setItem('fittrack_token', token);

    // Fetch user with token
    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        console.log('GoogleSuccess getMe response:', data);
        if (data.success && data.user) {
          localStorage.setItem('fittrack_user', JSON.stringify(data.user));
          window.location.replace('/dashboard');
        } else {
          console.error('getMe failed:', data);
          window.location.replace('/login?error=auth_failed');
        }
      })
      .catch((err) => {
        console.error('fetch error:', err);
        window.location.replace('/login?error=network');
      });
  }, []);

  return <LoadingSpinner fullScreen text="Signing you in..." />;
};

export default GoogleSuccess;
