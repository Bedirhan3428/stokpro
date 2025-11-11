import React from 'react';

// Ikonları react-icons'tan doğru 'size' prop'u ile kullanacağız
import {
  IconDashboard,
  IconBox,
  IconPlusCircle,
  IconDollarSign,
  IconCategory,
  IconTrendingUp,
  IconWallet,
  IconUser
} from './Icons'; 

// PROP GÜNCELLEMESİ: 'userId' kaldırıldı, 'onSignOut' eklendi
const Navbar = ({ currentPage, setPage, onSignOut }) => { 
  const navItems = [
    { name: 'Dashboard', page: 'dashboard', icon: <IconDashboard /> },
    { name: 'Stok Listesi', page: 'products', icon: <IconBox /> },
    { name: 'Ürün Ekle', page: 'add_product', icon: <IconPlusCircle /> },
    // İKON DÜZELTMESİ: Satış için Kredi Kartı (daha mantıklı)
    { name: 'Satış Yap', page: 'sales', icon: <IconDollarSign /> }, 
    // İKON DÜZELTMESİ: Giderler için Dolar (daha mantıklı)
    { name: 'Finans', page: 'expenses', icon: <IconWallet /> }, 
    { name: 'Kategoriler', page: 'categories', icon: <IconCategory /> },
    { name: 'Muhasebe', page: 'accounting', icon: <IconTrendingUp /> },
    { name: 'Üyelik Bilgileri', page: 'subscription', icon: <IconUser /> },
  ];

  const getButtonClass = (page) =>
    `nav-item nav-item-desktop ${
      currentPage === page ? 'nav-item-active' : 'nav-item-inactive'
    }`;

  const getMobileButtonClass = (page) =>
    `nav-item nav-item-mobile ${
      currentPage === page ? 'nav-item-active' : 'nav-item-inactive'
    }`;

  return (
    <nav className="navbar-wrapper nav-sticky">
      <div className="nav-container">
        <div className="nav-main-row">
          
          {/* Logo */}
          <div className="nav-logo-group">
            <span className="nav-logo-text">StokPro</span>
          </div>
          
          {/* MASAÜSTÜ MENÜSÜ */}
          <div className="nav-desktop-menu"> 
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className={getButtonClass(item.page)}
              >
                {/* ICON DÜZELTMESİ: width/height yerine size=20 kullanıldı */}
                {React.cloneElement(item.icon, { className: 'nav-icon', size: 20 })}
                {item.name}
              </button>
            ))}
          </div>
          
          {/* KULLANICI BİLGİSİ YERİNE ÇIKIŞ BUTONU */}
          <div className="nav-user-info">
            <button
                onClick={onSignOut}
                className="btn btn-danger btn-logout" // Yeni CSS sınıfı
                title="Oturumu Kapat"
            >
                Çıkış Yap
            </button>
          </div>
        </div>
      </div>
      
      {/* MOBİL MENÜ */}
      <div className="nav-mobile-menu">
        <div className="nav-mobile-list-wrapper">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => setPage(item.page)}
              className={getMobileButtonClass(item.page)}
              style={{ minWidth: '70px' }}
            >
              {/* ICON DÜZELTMESİ: width/height yerine size=24 kullanıldı */}
              {React.cloneElement(item.icon, { size: 24 })}
              <span className="nav-mobile-label">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;