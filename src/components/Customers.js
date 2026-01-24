import React, { useState, useEffect } from "react";
import firebaseHelpers from "../utils/firebaseHelpers";
import { FiUserPlus, FiSearch, FiUser, FiPhone, FiCreditCard } from "react-icons/fi";
import "../styles/Customers.css";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // NOT: 'detailLoading' değişkeni build hatası verdiği için kaldırıldı.

  useEffect(() => {
    const getCustomers = async () => {
      try {
        setLoading(true);
        const data = await firebaseHelpers.listCustomers();
        setCustomers(data || []);
      } catch (error) {
        console.error("Müşteriler yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    getCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>Müşteri Rehberi</h1>
        <div className="header-actions">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Müşteri veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-btn">
            <FiUserPlus /> Yeni Müşteri
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Yükleniyor...</div>
      ) : (
        <div className="customers-grid">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="customer-card">
                <div className="customer-info">
                  <div className="avatar">
                    <FiUser />
                  </div>
                  <div className="details">
                    <h3>{customer.name}</h3>
                    <p><FiPhone /> {customer.phone || "Telefon yok"}</p>
                  </div>
                </div>
                <div className="customer-balance">
                  <span>Bakiye</span>
                  <p className={(customer.balance || 0) < 0 ? "debt" : "credit"}>
                    {(customer.balance || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </p>
                </div>
                <button className="detail-btn">
                  <FiCreditCard /> İşlemleri Gör
                </button>
              </div>
            ))
          ) : (
            <div className="no-data">Müşteri bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Customers;
