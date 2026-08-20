import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { teacherProfileRepository } from '../../core/repositories/teacher-profile.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';

export function useOnboardingCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const profile = await teacherProfileRepository.getProfile();
        const year = await academicYearRepository.getCurrentYear();

        const isConfigured = !!profile && !!profile.fullName && !!year;

        if (!isConfigured && location.pathname !== '/onboarding') {
          navigate('/onboarding', { replace: true });
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [location.pathname, navigate]);

  return { checking };
}
