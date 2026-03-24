import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeartbeat } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { getRouteFromProfile } from '../../utils/authRedirect';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        if (user && profile) {
          navigate(getRouteFromProfile(profile));
        } else {
          navigate('/welcome');
        }
      }
    }, 2500); // 2.5s total to allow for animations

    return () => clearTimeout(timer);
  }, [loading, user, profile, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center gap-16"
      >
        <FaHeartbeat size={48} color="var(--accent)" />
        
        <div className="flex flex-col items-center gap-4">
          <h1 className="display text-primary">MaaSathi</h1>
          <p className="caption text-tertiary">Real Time Maternal Care</p>
        </div>

        {/* Loading Bar with 0.5s delay */}
        <div className="w-[120px] h-[2px] bg-tertiary overflow-hidden m-t-24">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ 
              delay: 0.5, 
              duration: 1.5,
              ease: "easeInOut" 
            }}
            className="h-full bg-accent"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
