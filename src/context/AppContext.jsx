import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // ── Shared patients list ──────────────────────────────────────────────────
  const [patients, setPatients] = useState([
    { id: 'p1', name: 'Suhana Khatun',  type: 'pregnant',   house: 'House 42', village: 'Ramgarh', location: 'House 42, Ramgarh',  date: 'Visited today',        risk: 'HIGH', initials: 'SK', age: 24, phone: '9876543210', husband: 'Rahim Ali',     weeks: 32 },
    { id: 'p2', name: 'Priya Patel',    type: 'pregnant',   house: 'House 18', village: 'Ramgarh', location: 'House 18, Ramgarh',  date: 'Visited 5 days ago',   risk: 'MED',  initials: 'PP', age: 26, phone: '9876543211', husband: 'Raj Patel',     weeks: 24 },
    { id: 'p3', name: 'Anjali Devi',    type: 'newMother',  house: 'House 90', village: 'Ramgarh', location: 'House 90, Ramgarh',  date: 'Visited 1 week ago',   risk: 'LOW',  initials: 'AD', age: 22, phone: '9876543212', husband: 'Rahul Devi',    weeks: 0  },
    { id: 'p4', name: 'Ritu Sharma',    type: 'newMother',  house: 'House 11', village: 'Ramgarh', location: 'House 11, Ramgarh',  date: 'Visited 3 days ago',   risk: 'LOW',  initials: 'RS', age: 29, phone: '9876543213', husband: 'Vikram Sharma', weeks: 0  },
    { id: 'p5', name: 'Kavita Singh',   type: 'pregnant',   house: 'House 04', village: 'Ramgarh', location: 'House 04, Ramgarh',  date: 'Visited 2 weeks ago',  risk: 'HIGH', initials: 'KS', age: 27, phone: '9876543214', husband: 'Amit Singh',    weeks: 36 },
  ]);

  const addPatient = (newPatient) => {
    // Ensure type is ALWAYS exactly 'pregnant' or 'newMother'
    const safeType = newPatient.type?.toLowerCase() === 'newmother' ? 'newMother' : 'pregnant';
    const p = {
      ...newPatient,
      type: safeType,
      id: newPatient.id || 'p' + Date.now(),
      house: newPatient.house || newPatient.houseNumber || '',
      location: (newPatient.houseNumber || newPatient.house || '') +
                (newPatient.village ? ', ' + newPatient.village : ''),
      initials: (newPatient.name || 'UN')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      date: 'Visited today',
      risk: 'LOW',
    };
    setPatients(prev => [p, ...prev]);
  };

  const updatePatient = (updatedPatient) => {
    setPatients(prev =>
      prev.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    );
  };

  // ── Current logged-in ASHA user (mirrors Firebase auth profile) ───────────
  const [currentUser, setCurrentUser] = useState({
    name: 'Lakshmi Devi',
    ashaId: 'ASHA-2023-458',
    village: 'Ramgarh',
    yearsService: '3',
    dateJoined: '2023-01-15',
    phone: '+91 9876543210',
    photoURL: '',
    role: 'asha',
  });

  // Merge partial updates into currentUser (used after profile edits / photo uploads)
  const updateCurrentUser = (updates) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AppContext.Provider value={{
      patients,
      addPatient,
      updatePatient,
      currentUser,
      updateCurrentUser,
    }}>
      {children}
    </AppContext.Provider>
  );
};
