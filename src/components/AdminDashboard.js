"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { MdSecurity, MdLockOutline, MdPersonSearch, MdHistory } from "react-icons/md";

const MASTER_ADMIN_UID = "p4h4hZYTtaPBk6kp1UUfRA7z2px2";
const ARTIFACT_ID = process.env.NEXT_PUBLIC_FIREBASE_ARTIFACTS_COLLECTION || process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "1:330292329201:web:d19827937fb863ea490750";

const AdminDashboard = () => {
  const [authState, setAuthState] = useState('checking');
  const [pinInput, setPinInput] = useState('');
  const [storedPin, setStoredPin] = useState(null);
  
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetLogs, setTargetLogs] = useState([]);
  const [loadingTarget, setLoadingTarget] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;
      if (!user || user.uid !== MASTER_ADMIN_UID) {
        setAuthState('unauthorized');
        return;
      }
      try {
        const pinRef = doc(db, "artifacts", ARTIFACT_ID, "users", user.uid, "settings", "master_key");
        const pinSnap = await getDoc(pinRef);
        if (pinSnap.exists()) {
          setStoredPin(pinSnap.data().pin);
          setAuthState('enter_pin');
        } else {
          setAuthState('create_pin');
        }
      } catch { setAuthState('unauthorized'); }
    };
    checkAccess();
  }, []);

  const handleCreatePin = async () => {
    if (pinInput.length < 4) return alert("En az 4 hane.");
    const user = auth.currentUser;
    await setDoc(doc(db, "artifacts", ARTIFACT_ID, "users", user.uid, "settings", "master_key"), { pin: pinInput });
    setStoredPin(pinInput);
    setAuthState('unlocked');
  };

  const handleEnterPin = () => {
    if (pinInput === storedPin) setAuthState('unlocked');
    else { alert("ERİŞİM REDDEDİLDİ"); setPinInput(''); }
  };

  useEffect(() => {
    if (authState !== 'unlocked') return;
    
    const fetchUsers = async () => {
      const usersRef = collection(db, "artifacts", ARTIFACT_ID, "users");
      const snap = await getDocs(usersRef);
      const list = snap.docs.map(d => ({
        uid: d.id,
        email: d.data().email || "E-posta Yok",
        createdAt: d.data().createdAt
      }));
      setUsersList(list);
      setFilteredUsers(list);
    };
    fetchUsers();
  }, [authState]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = usersList.filter(u => 
      u.uid.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  const selectTarget = async (user) => {
    setSelectedUser(user);
    setLoadingTarget(true);
    setTargetLogs([]);

    try {
      const pQuery = query(
        collection(db, "artifacts", ARTIFACT_ID, "users", user.uid, "products"), 
        orderBy('createdAt', 'desc'), 
        limit(10)
      );
      
      const sQuery = query(
        collection(db, "artifacts", ARTIFACT_ID, "users", user.uid, "sales"), 
        orderBy('createdAt', 'desc'), 
        limit(10)
      );

      const [pSnap, sSnap] = await Promise.all([getDocs(pQuery), getDocs(sQuery)]);

      let logs = [];

      pSnap.forEach(doc => {
        logs.push({
          id: doc.id,
          type: 'ÜRÜN_EKLEME',
          desc: doc.data().name || 'İsimsiz Ürün',
          time: doc.data().createdAt,
          detail: `${doc.data().price}₺ | Stok: ${doc.data().stock}`
        });
      });

      sSnap.forEach(doc => {
        logs.push({
          id: doc.id,
          type: 'SATIŞ_İŞLEMİ',
          desc: `Toplam: ${doc.data().totals?.total || 0}₺`,
          time: doc.data().createdAt,
          detail: doc.data().saleType === 'credit' ? 'Veresiye' : 'Nakit'
        });
      });

      logs.sort((a, b) => new Date(b.time) - new Date(a.time));
      setTargetLogs(logs.slice(0, 10));

    } catch (err) {
      console.error(err);
      alert("Veri çekilemedi: " + err.message);
    } finally {
      setLoadingTarget(false);
    }
  };

  if (authState === 'checking') return <div className="hacker-wrapper"><div className="loading">SİSTEM BAŞLATILIYOR...</div></div>;
  
  if (authState === 'unauthorized') return (
    <div className="hacker-wrapper login-mode">
      <MdLockOutline size={80} color="red" />
      <h1 style={{color:'red'}}>YETKİSİZ ERİŞİM</h1>
      <p>BU TERMİNAL KİLİTLİDİR.</p>
    </div>
  );

  if (authState === 'create_pin' || authState === 'enter_pin') return (
    <div className="hacker-wrapper login-mode">
      <div className="security-panel">
        <MdSecurity size={50} className="glitch" />
        <h2>GÜVENLİK PROTOKOLÜ</h2>
        <div className="input-group">
          <label>{authState === 'create_pin' ? "YENİ ŞİFRE:" : "ŞİFREYİ GİRİN:"}</label>
          <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="search-input" autoFocus />
        </div>
        <button className="cyber-btn" onClick={authState === 'create_pin' ? handleCreatePin : handleEnterPin}>GİRİŞ</button>
      </div>
    </div>
  );

  return (
    <div className="hacker-wrapper dashboard-mode">
      <header className="cyber-header">
        <div className="brand">BEDIRHAN_MAIN_FRAME // V4</div>
        <div className="status"><span style={{color:'#0f0'}}>SECURE_CONN</span></div>
      </header>

      <div className="control-bar">
        <MdPersonSearch size={24} style={{marginRight:10}} />
        <input 
          type="text" 
          className="search-input" 
          placeholder="UID VEYA E-POSTA İLE HEDEF ARA..." 
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="grid-container">
        
        {/* SOL PANEL: KULLANICI TABLOSU */}
        <div className="cyber-card">
          <h3 className="card-title">{'>'} TESPİT EDİLEN KULLANICILAR TABLOSU ({filteredUsers.length})</h3>
          <div className="table-responsive-wrapper" style={{ background: '#0a0a0a', borderColor: '#00ff00' }}>
            <table className="data-table" style={{ color: '#00ff00' }}>
              <thead>
                <tr>
                  <th style={{ color: '#00ff00', borderBottomColor: '#00ff00' }}>E-Posta</th>
                  <th style={{ color: '#00ff00', borderBottomColor: '#00ff00' }}>UID</th>
                  <th style={{ color: '#00ff00', borderBottomColor: '#00ff00', textAlign: 'center' }}>Eylem</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr 
                    key={u.uid} 
                    style={{ background: selectedUser?.uid === u.uid ? '#003300' : 'transparent', borderBottomColor: '#003300' }}
                  >
                    <td><strong>{u.email}</strong></td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{u.uid.slice(0, 14)}...</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="cyber-btn" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => selectTarget(u)}>
                        SEÇ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SAĞ PANEL: SEÇİLİ KİŞİNİN LOG TABLOSU */}
        <div className="cyber-card">
          <h3 className="card-title">
            {'>'} {selectedUser ? `HEDEF LOG TABLOSU: ${selectedUser.email}` : 'HEDEF SEÇİLMESİ BEKLENİYOR...'}
          </h3>
          
          {!selectedUser ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', opacity:0.5}}>
               <MdPersonSearch size={64} />
               <p>LÜTFEN LİSTEDEN BİR KULLANICI SEÇİN</p>
            </div>
          ) : loadingTarget ? (
            <div className="loading">VERİLER DEŞİFRE EDİLİYOR...</div>
          ) : (
            <div className="table-responsive-wrapper" style={{ background: '#0a0a0a', borderColor: '#00ff00' }}>
              {targetLogs.length === 0 ? (
                <div style={{textAlign:'center', padding: '2rem'}}>BU KULLANICIYA AİT KAYIT BULUNAMADI.</div>
              ) : (
                <table className="data-table" style={{ color: '#00ff00' }}>
                  <thead>
                    <tr>
                      <th style={{ color: '#00ff00', borderBottomColor: '#00ff00' }}>Tür</th>
                      <th style={{ color: '#00ff00', borderBottomColor: '#00ff00' }}>Açıklama</th>
                      <th style={{ color: '#00ff00', borderBottomColor: '#00ff00' }}>Detay</th>
                      <th style={{ color: '#00ff00', borderBottomColor: '#00ff00' }}>Zaman</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetLogs.map((log, i) => (
                      <tr key={i} style={{ borderBottomColor: '#003300' }}>
                        <td>
                          <span className={`table-badge ${log.type === 'SATIŞ_İŞLEMİ' ? 'orange' : 'blue'}`}>
                            {log.type === 'SATIŞ_İŞLEMİ' ? 'SATIŞ' : 'EKLE'}
                          </span>
                        </td>
                        <td>{log.desc}</td>
                        <td style={{ fontSize: '0.85rem' }}>{log.detail}</td>
                        <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          {new Date(log.time).toLocaleDateString()} {new Date(log.time).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

      </div>
      
      <div className="terminal-footer">
        <span className="log-line">{'>'} SYSTEM_READY.</span>
        {selectedUser && <span className="log-line">{'>'} TARGET_LOCKED: {selectedUser.uid}</span>}
      </div>
    </div>
  );
};

export default AdminDashboard;