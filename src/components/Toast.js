import React, { useEffect } from 'react';

// Hata/Başarı mesajlarını göstermek için basit, kaybolan bir bildirim kutusu
const Toast = ({ message, type, onClose }) => {
    
    // 1. HOOK'U KOŞULSUZ OLARAK EN ÜSTTE ÇAĞIR
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // 5 saniye sonra kapat

            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    // 2. KOŞULLU RENDER'I EN SONDA YAP
    if (!message) return null;

    // --- Modern Style Tanımları ---
    const baseStyle = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 18px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        color: '#ffffff',
        maxWidth: '300px',
        zIndex: 9999,
        transition: 'opacity 0.3s ease-in-out',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column'
    };

    let colorStyle = {};
    let icon = '';

    switch (type) {
        case 'success':
            colorStyle.backgroundColor = '#10B981'; // Tailwind green-600
            icon = '✅';
            break;
        case 'error':
            colorStyle.backgroundColor = '#EF4444'; // Tailwind red-600
            icon = '❌';
            break;
        case 'info':
        default:
            colorStyle.backgroundColor = '#3B82F6'; // Tailwind blue-600
            icon = '💡';
            break;
    }

    // Stil nesnelerini birleştirme
    const finalStyle = { ...baseStyle, ...colorStyle };

    return (
        <div style={finalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold' }}>{icon} {type.toUpperCase()}</span>
                <button 
                    onClick={onClose} 
                    style={{ 
                        marginLeft: '15px', 
                        background: 'none', 
                        border: 'none', 
                        color: 'inherit', 
                        cursor: 'pointer',
                        fontSize: '20px'
                    }}
                >
                    &times;
                </button>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.4' }}>{message}</p>
        </div>
    );
};

export default Toast;