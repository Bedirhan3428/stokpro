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
import { MdSecurity, MdLockOutline, MdRefresh } from "react-icons/md";

// SENİN UID'N
const MASTER_ADMIN_UID = "p4h4hZYTtaPBk6kp1UUfRA7z2px2";
const ARTIFACT_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "default_artifact";

const AdminDashboard = () => {
  const [authState, setAuthState] = useState('checking');
  const [pinInput, setPinInput] = useState('');
  const [storedPin, setStoredPin] = useState(null);
  const [consoleLog, setConsoleLog] = useState([]); 

  // Dashboard Verileri
  const [allUsersData, setAllUsersData] = useState([]); // Kullanıcılar ve Son İşlemleri
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [globalRecentActivity, setGlobalRecentActivity] = useState([]); // Son 5 işlem (Manuel toplanmış)
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  const addLog = (msg) => {
    setConsoleLog(prev => [`> ${new Date().toLocaleTimeString()} : ${msg}`, ...prev].slice(0, 5));
  };

  // 1. GİRİŞ KONTROLLERİ
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
      } catch (err) {
        setAuthState('unauthorized');
      }
    };
    checkAccess();
  }, []);

  const handleCreatePin = async () => {
    if (pinInput.length < 4) return alert("En az 4 hane.");
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "artifacts", ARTIFACT_ID, "users", user.uid, "settings", "master_key"), { pin: pinInput });
      setStoredPin(pinInput);
      setPinInput('');
      setAuthState('unlocked');
    } catch (e) { alert(e.message); }
  };

  const handleEnterPin = () => {
    if (pinInput === storedPin) {
      setPinInput('');
      setAuthState('unlocked');
    } else {
      alert("HATALI ŞİFRE!");
      setPinInput('');
    }
  };

  // 2. VERİ ÇEKME (STANDART YÖNTEM - INDEX GEREKTİRMEZ)
  useEffect(() => {
    if (authState !== 'unlocked') return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]);

  const fetchData = async () => {
    setLoadingData(true);
    addLog("KULLANICILAR TARANIYOR...");

    try {
      // 1. Tüm Kullanıcıları Bul (artifacts/{id}/users)
      const usersRef = collection(db, "artifacts", ARTIFACT_ID, "users");
      const usersSnap = await getDocs(usersRef);
      
      let allActivities = [];
      let usersList = [];

      // 2. Her kullanıcı için tek tek son işlemine bak
      const promises = usersSnap.docs.map(async (userDoc) => {
        const uid = userDoc.id;
        const userData = userDoc.data();
        
        // A) Son Eklenen Ürün (Limit 1)
        const pQuery = query(collection(db, "artifacts", ARTIFACT_ID, "users", uid, "products"), orderBy('createdAt', 'desc'), limit(1));
        const pSnap = await getDocs(pQuery);
        const lastProduct = pSnap.docs[0];

        // B) Son Satış (Limit 1)
        const sQuery = query(collection(db, "artifacts", ARTIFACT_ID, "users", uid, "sales"), orderBy('createdAt', 'desc'), limit(1));
        const sSnap = await getDocs(sQuery);
        const lastSale = sSnap.docs[0];

        // Verileri işle
        let lastSeenTime = null;
        
        if (lastProduct) {
           const t = lastProduct.data().createdAt;
           allActivities.push({ type: 'ÜRÜN', desc: lastProduct.data().name, time: t, uid: uid });
           if (!lastSeenTime || new Date(t) > new Date(lastSeenTime)) lastSeenTime = t;
        }

        if (lastSale) {
           const t = lastSale.data().createdAt;
           allActivities.push({ type: 'SATIŞ', desc: `${lastSale.data().totals?.total || 0}₺`, time: t, uid: uid });
           if (!lastSeenTime || new Date(t) > new Date(lastSeenTime)) lastSeenTime = t;
        }

        // Kullanıcı Listesine Ekle
        usersList.push({
            uid: uid,
            email: userData.email || "Bilinmiyor",
            lastSeen: lastSeenTime
        });
      });

      await Promise.all(promises);

      // 3. Verileri Sırala ve State'e at
      // Aktiviteleri tarihe göre sırala (En yeni en üstte)
      allActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setGlobalRecentActivity(allActivities.slice(0, 5));

      // Kullanıcıları da son işlem tarihine göre sırala
      usersList.sort((a, b) => {
          if (!a.lastSeen) return 1;
          if (!b.lastSeen) return -1;
          return new Date(b.lastSeen) - new Date(a.lastSeen);
      });

      setAllUsersData(usersList);
      setFilteredUsers(usersList);
      addLog("VERİLER GÜNCELLENDİ.");

    } catch (err) {
      addLog("HATA: " + err.message);
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  // 3. ARAMA
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = allUsersData.filter(u => 
      u.uid.toLowerCase().includes(term) || 
      (u.email && u.email.toLowerCase().includes(term))
    );
    setFilteredUsers(filtered);
  };

  // --- RENDER ---
  if (authState === 'checking') return <div className="hacker-wrapper"><div className="loading">SİSTEM KONTROLÜ...</div></div>;

  if (authState === 'unauthorized') {
    return (
      <div className="hacker-wrapper login-mode" style={{justifyContent:'center', textAlign:'center'}}>
        <MdLockOutline size={80} color="red" />
        <h1 style={{color:'red'}}>ERİŞİM YASAK</h1>
        <p>BU PANEL SADECE BEDİRHAN İÇİNDİR.</p>
      </div>
    );
  }

  if (authState === 'create_pin' || authState === 'enter_pin') {
    return (
      <div className="hacker-wrapper login-mode">
        <div className="security-panel">
          <MdSecurity size={50} className="glitch" />
          <h2>GÜVENLİK GİRİŞİ</h2>
          <div className="input-group">
            <label>{authState === 'create_pin' ? "YENİ ŞİFRE OLUŞTUR:" : "ŞİFREYİ GİRİN:"}</label>
            <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="search-input" autoFocus />
          </div>
          <button className="cyber-btn" onClick={authState === 'create_pin' ? handleCreatePin : handleEnterPin}>GİRİŞ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hacker-wrapper dashboard-mode">
      <header className="cyber-header">
        <div className="brand">BEDIRHAN ADMIN PANEL</div>
        <div className="status" style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <span>ONLINE</span>
            <MdRefresh style={{cursor:'pointer'}} onClick={fetchData} title="Yenile"/>
        </div>
      </header>

      <div className="control-bar">
        <span className="prompt">{'>'} KULLANICI ARA:</span>
        <input type="text" className="search-input" placeholder="UID veya E-posta..." value={searchTerm} onChange={handleSearch}/>
      </div>

      <div className="grid-container">
        {/* SOL: SON 5 HAREKET */}
        <div className="cyber-card">
          <h3 className="card-title">{'>'} AĞDAKİ SON 5 İŞLEM</h3>
          {loadingData ? <div className="loading">YÜKLENİYOR...</div> : (
            <ul className="data-list">
              {globalRecentActivity.map((log, i) => (
                <li key={i} className="data-item">
                  <span className="id-tag">[{log.type}]</span>
                  <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
                    <span className="value">{log.desc}</span>
                    <span className="info">Yapan: {log.uid.slice(0,5)}...</span>
                  </div>
                  <span className="date">{new Date(log.time).toLocaleTimeString()}</span>
                </li>
              ))}
              {globalRecentActivity.length === 0 && <div>Haraket yok.</div>}
            </ul>
          )}
        </div>

        {/* SAĞ: KULLANICI LİSTESİ */}
        <div className="cyber-card">
          <h3 className="card-title">{'>'} KULLANICILAR ({filteredUsers.length})</h3>
          {loadingData ? <div className="loading">TARANIYOR...</div> : (
            <ul className="data-list">
              {filteredUsers.map((user) => (
                <li key={user.uid} className="data-item">
                  <span className="id-tag">USR</span>
                  <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
                    <span className="value" title={user.uid}>{user.email !== "Bilinmiyor" ? user.email : user.uid.slice(0,12)+"..."}</span>
                    <span className="info">
                      Son Görülme: {user.lastSeen ? <span style={{color:'#0f0'}}>{new Date(user.lastSeen).toLocaleString()}</span> : <span style={{color:'gray'}}>Yok</span>}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="terminal-footer">
        {consoleLog.map((log, i) => <span key={i} className="log-line">{log}</span>)}
      </div>
    </div>
  );
};

export default AdminDashboard;