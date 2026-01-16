import React, { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';
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
import { MdSecurity, MdLockOutline, MdPersonSearch } from "react-icons/md";

// SENİN UID'N
const MASTER_ADMIN_UID = "p4h4hZYTtaPBk6kp1UUfRA7z2px2";
const ARTIFACT_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "default_artifact";

const AdminDashboard = () => {
  const [authState, setAuthState] = useState('checking');
  const [pinInput, setPinInput] = useState('');
  const [storedPin, setStoredPin] = useState(null);
  
  // Veri State'leri
  const [usersList, setUsersList] = useState([]); // Sol panel için liste
  const [filteredUsers, setFilteredUsers] = useState([]); // Arama sonucu
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null); // Seçili Kullanıcı
  const [targetLogs, setTargetLogs] = useState([]); // Seçili kişinin son 10 işlemi
  const [loadingTarget, setLoadingTarget] = useState(false);

  // 1. GİRİŞ VE GÜVENLİK
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

  // 2. KULLANICI LİSTESİNİ ÇEK (Sadece Listeyi Alır)
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

  // 3. ARAMA FONKSİYONU
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = usersList.filter(u => 
      u.uid.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  // 4. HEDEF SEÇME VE LOGLARI ÇEKME (KRİTİK KISIM)
  const selectTarget = async (user) => {
    setSelectedUser(user);
    setLoadingTarget(true);
    setTargetLogs([]);

    try {
      // A) Son 10 Ürün (Ürün Ekleme İşlemi)
      const pQuery = query(
        collection(db, "artifacts", ARTIFACT_ID, "users", user.uid, "products"), 
        orderBy('createdAt', 'desc'), 
        limit(10)
      );
      
      // B) Son 10 Satış (Satış İşlemi)
      const sQuery = query(
        collection(db, "artifacts", ARTIFACT_ID, "users", user.uid, "sales"), 
        orderBy('createdAt', 'desc'), 
        limit(10)
      );

      const [pSnap, sSnap] = await Promise.all([getDocs(pQuery), getDocs(sQuery)]);

      let logs = [];

      // Ürünleri listeye ekle
      pSnap.forEach(doc => {
        logs.push({
          id: doc.id,
          type: 'ÜRÜN_EKLEME',
          desc: doc.data().name || 'İsimsiz Ürün',
          time: doc.data().createdAt, // String ISO veya Timestamp olabilir
          detail: `${doc.data().price}₺ | Stok: ${doc.data().stock}`
        });
      });

      // Satışları listeye ekle
      sSnap.forEach(doc => {
        logs.push({
          id: doc.id,
          type: 'SATIŞ_İŞLEMİ',
          desc: `Toplam: ${doc.data().totals?.total || 0}₺`,
          time: doc.data().createdAt,
          detail: doc.data().saleType === 'credit' ? 'Veresiye' : 'Nakit'
        });
      });

      // Tarihe göre sırala (En yeniden en eskiye)
      logs.sort((a, b) => new Date(b.time) - new Date(a.time));

      // Sadece en son 10 tanesini al
      setTargetLogs(logs.slice(0, 10));

    } catch (err) {
      console.error(err);
      alert("Veri çekilemedi: " + err.message);
    } finally {
      setLoadingTarget(false);
    }
  };

  // --- RENDER ---
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
        
        {/* SOL PANEL: KULLANICI LİSTESİ */}
        <div className="cyber-card">
          <h3 className="card-title">{'>'} TESPİT EDİLEN KULLANICILAR ({filteredUsers.length})</h3>
          <ul className="data-list">
            {filteredUsers.map((u) => (
              <li 
                key={u.uid} 
                className="data-item" 
                onClick={() => selectTarget(u)}
                style={{background: selectedUser?.uid === u.uid ? '#003300' : 'transparent'}}
              >
                <span className="id-tag">USR</span>
                <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
                  <span className="value">{u.email}</span>
                  <span className="info" style={{fontSize:'0.7rem'}}>UID: {u.uid.slice(0,12)}...</span>
                </div>
                <button className="cyber-btn" style={{width:'auto', padding:'5px 10px', fontSize:'0.8rem', marginTop:0}}>SEÇ</button>
              </li>
            ))}
          </ul>
        </div>

        {/* SAĞ PANEL: SEÇİLİ KİŞİNİN LOGLARI */}
        <div className="cyber-card">
          <h3 className="card-title">
            {'>'} {selectedUser ? `HEDEF ANALİZİ: ${selectedUser.email}` : 'HEDEF SEÇİLMESİ BEKLENİYOR...'}
          </h3>
          
          {!selectedUser ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', opacity:0.5}}>
               <MdPersonSearch size={64} />
               <p>LÜTFEN LİSTEDEN BİR KULLANICI SEÇİN</p>
            </div>
          ) : loadingTarget ? (
            <div className="loading">VERİLER DEŞİFRE EDİLİYOR...</div>
          ) : (
            <ul className="data-list">
              {targetLogs.length === 0 ? (
                 <div style={{textAlign:'center', marginTop:20}}>BU KULLANICIYA AİT KAYIT BULUNAMADI.</div>
              ) : (
                targetLogs.map((log, i) => (
                  <li key={i} className="data-item">
                    <span className="id-tag" style={{width:'80px', color: log.type === 'SATIŞ_İŞLEMİ' ? '#ffcc00' : '#00ccff'}}>
                      [{log.type === 'SATIŞ_İŞLEMİ' ? 'SATIŞ' : 'EKLE'}]
                    </span>
                    <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
                      <span className="value">{log.desc}</span>
                      <span className="info">{log.detail}</span>
                    </div>
                    <span className="date">
                      {new Date(log.time).toLocaleDateString()} <br/>
                      {new Date(log.time).toLocaleTimeString()}
                    </span>
                  </li>
                ))
              )}
            </ul>
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