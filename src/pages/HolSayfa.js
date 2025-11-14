import React from 'react';

const HolSayfa = ({ onNavigateToAuth }) => {
  return (
    <div className="hol-bg">
     
       
        <button
          className="hol-btn"
          onClick={onNavigateToAuth}
        >
             Şimdi Üye Ol / Giriş Yap
        </button>
      </div>
   
  );
};

export default HolSayfa;