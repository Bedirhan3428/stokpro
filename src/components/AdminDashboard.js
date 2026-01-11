import React, { useState, useEffect } from 'react';
import "../styles/AdminDashboard.css"; temasının CSS dosyası
import { auth, db } from './firebase'; 
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  collectionGroup 
} from "firebase/firestore";
import { MdSecurity, MdLockOutline } from "react-icons/md";

// SENİN UID'N (Sadece bu kişi girebilir)
const MASTER_ADMIN_UID = "p4h4hZYTtaPBk6kp1UUfRA7z2px2";
const ARTIFACT_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "default_artifact";

const AdminDashboard = () => {
  // Durumlar: 'checking' | 'unauthorized' | 'create_pin' | 'enter_pin' | 'unlocked'
  const [authState, setAuthState] = useState('checking');
  const [pinInput, setPinInput] = useState('');
  const [storedPin, setStoredPin] = useState(null);
  const [consoleLog, setConsoleLog] = useState([]); 

  // Dashboard Verileri
  const [globalLogs, setGlobalLogs] = useState([]); // Son 5 İşlem
  const [allUsers, setAllUsers] = useState([]);     // Tüm Kullanıcılar
  const [filteredUsers, setFilteredUsers] = useState([]); // Arama Sonucu
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  // LOG YARDIMCISI
  const addLog = (msg) => {
    setConsoleLog(prev => [`> ${new Date().toLocaleTimeString()} : ${msg}`, ...prev].slice(0, 5));
  };

  // 1. BAŞLANGIÇ KONTROLLERİ (UID + PIN DURUMU)
  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;
      
      // UID KONTROLÜ
      if (!user || user.uid !== MASTER_ADMIN_UID) {
        setAuthState('unauthorized');
        return;
      }

      // PIN KONTROLÜ (DB'den çekiyoruz)
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
        console.error("Auth Error:", err);
        setAuthState('unauthorized');
      }
    };

    checkAccess();
  }, []);

  // 2. ŞİFRE İŞLEMLERİ
  const handleCreatePin = async () => {
    if (pinInput.length < 4) return alert("Şifre en az 4 hane olmalı.");
    try {
      const user = auth.currentUser;
      const pinRef = doc(db, "artifacts", ARTIFACT_ID, "users", user.uid, "settings", "master_key");
      await setDoc(pinRef, { pin: pinInput });
      setStoredPin(pinInput);
      setPinInput('');
      setAuthState('unlocked');
    } catch (e) {
      alert("Hata: " + e.message);
    }
  };

  const handleEnterPin = () => {
    if (pinInput === storedPin) {
      setPinInput('');
      setAuthState('unlocked');
    } else {
      alert("HATALI ŞİFRE! İZİNSİZ GİRİŞ TESPİT EDİLDİ.");
      setPinInput('');
    }
  };

  // 3. VERİ ÇEKME (SURVEILLANCE MODE)
  useEffect(() => {
    if (authState !== 'unlocked') return;

    const fetchSurveillanceData = async () => {
      setLoadingData(true);
      addLog("CONNECTING TO GLOBAL MAINFRAME...");

      try {
        // A) GLOBAL LOGLAR (Son 5 işlem - Tüm Kullanıcılar)
        // Not: Firestore index hatası verirse konsoldaki linke tıkla.
        const pQuery = query(collectionGroup(db, 'products'), orderBy('createdAt', 'desc'), limit(5));
        const sQuery = query(collectionGroup(db, 'sales'), orderBy('createdAt', 'desc'), limit(5));

        const [pSnap, sSnap] = await Promise.all([getDocs(pQuery), getDocs(sQuery)]);

        let logs = [];
        
        // Ürün Logları
        pSnap.forEach(d => {
           // Firestore yapısı: artifacts/{artId}/users/{uid}/products/{docId}
           // parent -> products, parent.parent -> {uid}
           const uid = d.ref.parent.parent?.id || "UNKNOWN";
           logs.push({
             type: 'ÜRÜN',
             desc: `Eklendi: ${d.data().name}`,
             time: d.data().createdAt,
             uid: uid
           });
        });

        // Satış Logları
        sSnap.forEach(d => {
           const uid = d.ref.parent.parent?.id || "UNKNOWN";
           logs.push({
             type: 'SATIŞ',
             desc: `Tutar: ${d.data().totals?.total || 0}₺`,
             time: d.data().createdAt,
             uid: uid
           });
        });

        // Birleştir ve Sırala
        logs.sort((a, b) => new Date(b.time) - new Date(a.time));
        setGlobalLogs(logs.slice(0, 5));

        // B) KULLANICI LİSTESİ
        const usersRef = collection(db, "artifacts", ARTIFACT_ID, "users");
        const usersSnap = await getDocs(usersRef);
        
        // Kullanıcıları ve son işlem zamanlarını eşleştir
        const users = usersSnap.docs.map(doc => {
          // Bu kullanıcının global loglardaki en son işlemini bul
          const lastAction = logs.find(l => l.uid === doc.id);
          return {
            uid: doc.id,
            lastSeen: lastAction ? lastAction.time : null,
            email: doc.data().email || "Bilinmiyor" // Eğer profile kaydettiysen
          };
        });

        setAllUsers(users);
        setFilteredUsers(users);
        addLog("SCAN COMPLETED. TARGETS ACQUIRED.");

      } catch (err) {
        addLog("DATA ERROR: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchSurveillanceData();
  }, [authState]);

  // 4. ARAMA FONKSİYONU
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = allUsers.filter(u => 
      u.uid.toLowerCase().includes(term) || 
      (u.email && u.email.toLowerCase().includes(term))
    );
    setFilteredUsers(filtered);
  };

  // --- RENDER ---

  // 1. Loading
  if (authState === 'checking') return <div className="hacker-wrapper"><div className="loading">SYSTEM_CHECK...</div></div>;

  // 2. Yetkisiz
  if (authState === 'unauthorized') {
    return (
      <div className="hacker-wrapper login-mode" style={{justifyContent:'center', textAlign:'center'}}>
        <MdLockOutline size={80} color="red" />
        <h1 style={{color:'red'}}>ERİŞİM REDDEDİLDİ</h1>
        <p>BU ALAN SADECE BEDİRHAN TARAFINDAN GÖRÜNTÜLENEBİLİR.</p>
        <div style={{marginTop:20}}>UID: {auth.currentUser?.uid}</div>
      </div>
    );
  }

  // 3. Şifre Oluşturma / Girme
  if (authState === 'create_pin' || authState === 'enter_pin') {
    return (
      <div className="hacker-wrapper login-mode">
        <div className="security-panel">
          <MdSecurity size={50} className="glitch" />
          <h2>{authState === 'create_pin' ? "MASTER KEY OLUŞTUR" : "GÜVENLİK PROTOKOLÜ"}</h2>
          <div className="input-group">
            <label>{authState === 'create_pin' ? "YENİ ŞİFRE BELİRLE:" : "ŞİFREYİ GİRİN:"}</label>
            <input 
              type="password" 
              value={pinInput} 
              onChange={e => setPinInput(e.target.value)} 
              className="search-input"
              autoFocus
            />
          </div>
          <button 
            className="cyber-btn" 
            onClick={authState === 'create_pin' ? handleCreatePin : handleEnterPin}
          >
            [ ONAYLA ]
          </button>
        </div>
      </div>
    );
  }

  // 4. ANA DASHBOARD (Unlocked)
  return (
    <div className="hacker-wrapper dashboard-mode">
      <header className="cyber-header">
        <div className="brand">BEDIRHAN_SURVEILLANCE_V1</div>
        <div className="status">ADMIN: <span style={{color:'#0f0'}}>ONLINE</span></div>
      </header>

      {/* ARAMA ÇUBUĞU */}
      <div className="control-bar">
        <span className="prompt">{'>'} TARGET_SEARCH:</span>
        <input 
          type="text" 
          className="search-input" 
          placeholder="UID ARA..." 
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="grid-container">
        
        {/* SOL: SON GLOBAL İŞLEMLER */}
        <div className="cyber-card">
          <h3 className="card-title">{'>'} SON 5 SİSTEM HAREKETİ</h3>
          {loadingData ? <div className="loading">DECRYPTING...</div> : (
            <ul className="data-list">
              {globalLogs.map((log, i) => (
                <li key={i} className="data-item">
                  <span className="id-tag">[{log.type}]</span>
                  <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
                    <span className="value">{log.desc}</span>
                    <span className="info" style={{fontSize:'0.7rem', color:'#555'}}>
                      YAPAN: {log.uid.slice(0,5)}***
                    </span>
                  </div>
                  <span className="date">
                    {new Date(log.time).toLocaleTimeString()}
                  </span>
                </li>
              ))}
              {globalLogs.length === 0 && <div>VERİ YOK</div>}
            </ul>
          )}
        </div>

        {/* SAĞ: KULLANICILAR VE SON GÖRÜLME */}
        <div className="cyber-card">
          <h3 className="card-title">{'>'} AĞDAKİ HEDEFLER ({filteredUsers.length})</h3>
          {loadingData ? <div className="loading">SCANNING...</div> : (
            <ul className="data-list" style={{maxHeight:'400px', overflowY:'auto'}}>
              {filteredUsers.map((user) => (
                <li key={user.uid} className="data-item">
                  <span className="id-tag">UID</span>
                  <div style={{display:'flex', flexDirection:'column', width:'100%'}}>
                    <span className="value" title={user.uid}>
                      {user.uid.slice(0, 10)}...
                    </span>
                    <span className="info">
                      SON İŞLEM: {user.lastSeen 
                        ? <span style={{color:'#0f0'}}>{new Date(user.lastSeen).toLocaleString()}</span> 
                        : <span style={{color:'gray'}}>BİLİNMİYOR</span>}
                    </span>
                  </div>
                </li>
              ))}
              {filteredUsers.length === 0 && <div>HEDEF BULUNAMADI</div>}
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