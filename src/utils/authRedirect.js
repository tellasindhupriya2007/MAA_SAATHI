export const getRouteFromProfile = (profile) => {
  if (!profile?.role) return '/welcome';

  if (profile.role === 'asha') return '/asha/dashboard';
  if (profile.role === 'doctor') return '/doctor/dashboard';

  if (profile.role === 'mother') {
    return profile.isSurveyCompleted === false
      ? '/mother/medical-history'
      : '/mother/dashboard';
  }

  if (profile.role === 'caretaker') return '/family-dashboard';

  if (profile.role === 'patient') {
    const patientType = profile.patientType;
    const surveyCompleted = profile.isSurveyCompleted !== false;

    if (patientType === 'elderly') {
      return surveyCompleted ? '/dashboard/elderly' : '/elderly/health-survey';
    }

    if (patientType === 'wellness') {
      return surveyCompleted ? '/dashboard/wellness' : '/wellness/health-survey';
    }

    return '/patient-type-select';
  }

  return '/welcome';
};
