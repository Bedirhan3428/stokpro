import React from 'react';

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-wrapper">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            onClick={onClose}
            className="modal-close-button"
          >
            &times;
          </button>
        </div>
        <div className="modal-content">
            {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;