import React from 'react';
import { IconLoader } from './Icons';

const LoadingScreen = ({ message = "Yükleniyor..." }) => (
  <div className="loading-screen-wrapper">
    <div className="loading-content">
      <IconLoader width="32" height="32" className="loading-icon" style={{ color: '#3b82f6' }} />
      <p className="loading-message">{message}</p>
    </div>
  </div>
);

export default LoadingScreen;