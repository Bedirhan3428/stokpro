import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { auth, db } from './firebase'; 
import { collection, getDocs, query, orderBy, limit, collectionGroup } from "firebase/firestore";

const AdminDashboard = () => {
  const [isSystemAccessGranted, setSystemAccessGranted] = useState(false);
  const [keys, setKeys] = useState({ level1: '', level2: '', level3: '' });
  
  // Veri State'leri
  const [globalLogs, setGlobalLogs] = useState([]); // Son 5 veri (Global)
  const [userSignals, setUserSignals] = useState([]); // Kullanıcı Listesi ve Son Aktiviteleri
  const [loading, setLoading] = useState(false);
  const [consoleLog, setConsoleLog] = useState([]); 

  const addLog = (msg) => {
    setConsoleLog(prev => [`> ${new Date().toLocaleTimeString()} : ${msg}`, ...prev].slice(0, 5));
  };

  const handleSecurityCheck = () => {
    // Şifreler: root / admin / 1234
    if (keys.level1 === 'root' && keys.level2 === 'admin' && keys.level3 === '1234') {
      addLog("ACCESS_GRANTED... INITIATING SURVEILLANCE MODE...");
      setSystemAccessGranted(true);
    } else {
      addLog("ACCESS_DENIED... INVALID PROTOCOL.");
      setKeys({ level1: '', level2: '', level3: '' });
    }
  };

  useEffect(() => {
    if (!isSystemAccessGranted) return;

    const initSurveillance = async () => {
      setLoading(true);
      try {
        addLog("SCANNING_GLOBAL_NETWORKS...");
        const ARTIFACT_ID = process.env.REACT_APP_FIREBASE_ARTIFACTS_COLLECTION || "default_artifact";

        // 1. GLOBAL LOGLARI ÇEK (Collection Group Query)
        // Tüm kullanıcıların 'products' ve 'sales' koleksiyonlarına bakar.
        const productsQuery = query(collectionGroup(db, 'products'), orderBy('createdAt', 'desc'), limit(5));
        const salesQuery = query(collectionGroup(db, 'sales'), orderBy('createdAt', 'desc'), limit(5));

        const [pSnap, sSnap] = await Promise.all([getDocs(productsQuery), getDocs(salesQuery)]);

        const logs = [];
        pSnap.forEach(doc => {
            // parent.parent.id bize UID'yi verir (path: users/{uid}/products/{doc})
            const uid = doc.ref.parent.parent ? doc.ref.parent.parent.id : "UNKNOWN";
            logs.push({ 
                id: doc.id, 
                type: 'PRODUCT', 
                desc: doc.data().name, 
                time: doc.data().createdAt, 
                uid: uid 
            });
        });
        sSnap.forEach(doc => {
            const uid = doc.ref.parent.parent ? doc.ref.parent.parent.id : "UNKNOWN";
            logs.push({ 
                id: doc.id, 
                type: 'SALE', 
                desc: `${doc.data().totals?.total || 0}₺`, 
                time: doc.data().createdAt, 
                uid: uid 
            });
        });

        // Tarihe göre sırala ve son 5'i al
        logs.sort((a, b) => new Date(b.time) - new Date(a.time));
        setGlobalLogs(logs.slice(0, 5));

        // 2. KULLANICI LİSTESİNİ ÇEK (Sinyaller)
        addLog("DETECTING_ACTIVE_SIGNALS...");
        // Artifact altındaki users koleksiyonunu çekiyoruz
        const usersRef = collection(db, "artifacts", ARTIFACT_ID, "users");
        const usersSnap = await getDocs(usersRef);
        
        const usersList = usersSnap.docs.map(doc => ({
            uid: doc.id,
            lastLogin: doc.data().lastLogin || "UNKNOWN", // Eğer login kaydediyorsan
            // Profil verisi varsa alalım
            data: doc.data() 
        }));
        
        setUserSignals(usersList);
        
        addLog("SURVEILLANCE_ACTIVE.");
      } catch (err) {
        console.error(err);
        addLog(`ERROR: ${err.message}`);
        addLog("HINT: CHECK FIRESTORE INDEXES");
      } finally {
        setLoading(false);
      }
    };

    initSurveillance();
  }, [isSystemAccessGranted]);

  if (!isSystemAccessGranted) {
    return (
      <div className="hacker-wrapper login-mode">
        <div className="security-panel">
          <h1 className="glitch" data-text="SECURE_GATEWAY">SECURE_GATEWAY</h1>
          <div className="terminal-output">
            {consoleLog.map((log, i) => <div key={i}>{log}</div>)}
          </div>
          <div className="input-group">
            <label>PROTOCOL_1 (root):</label>
            <input type="password" value={keys.level1} onChange={e => setKeys({...keys, level1: e.target.value})} />
          </div>
          <div className="input-group">
            <label>PROTOCOL_2 (admin):</label>
            <input type="password" value={keys.level2} onChange={e => setKeys({...keys, level2: e.target.value})} />
          </div>
          <div className="input-group">
            <label>PROTOCOL_3 (1234):</label>
            <input type="password" value={keys.level3} onChange={e => setKeys({...keys, level3: e.target.value})} />
          </div>
          <button className="cyber-btn" onClick={handleSecurityCheck}>[ INITIALIZE ]</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hacker-wrapper dashboard-mode">
      <header className="cyber-header">
        <div className="brand">BEDIRHAN_MAIN_FRAME // V3.0</div>
        <div className="status">NET_STATUS: <span style={{color:'#0f0'}}>CONNECTED</span></div>
      </header>

      <div className="grid-container">
        {/* SOL PANEL: GLOBAL SON İŞLEMLER */}
        <div className="cyber-card">
          <h3 className="card-title">{'>'} INTERCEPTED_DATA_PACKETS (LAST 5)</h3>
          {loading ? <div className="loading">DECRYPTING...</div> : (
            <ul className="data-list">
              {globalLogs.map((log, i) => (
                <li key={i} className="data-item">
                  <span className="id-tag">[{log.type}]</span>
                  <span className="value">
                    UID:{log.uid.slice(0,4)}... | {log.desc}
                  </span>
                  <span className="date">
                    {log.time ? new Date(log.time).toLocaleTimeString() : 'N/A'}
                  </span>
                </li>
              ))}
              {globalLogs.length === 0 && <div>NO_ACTIVITY_DETECTED</div>}
            </ul>
          )}
        </div>

        {/* SAĞ PANEL: KULLANICI LİSTESİ */}
        <div className="cyber-card">
          <h3 className="card-title">{'>'} DETECTED_USER_SIGNALS</h3>
          {loading ? <div className="loading">SCANNING...</div> : (
            <ul className="data-list">
              {userSignals.map((u) => (
                <li key={u.uid} className="data-item">
                  <span className="id-tag">USR</span>
                  <span className="value">
                    {u.uid.slice(0,8)}...
                  </span>
                  <span className="info">
                     {/* Burada o kullanıcının son işlem zamanını göstermek için global loglardan eşleşeni bulabiliriz */}
                     LAST_ACT: {
                        globalLogs.find(l => l.uid === u.uid) 
                        ? new Date(globalLogs.find(l => l.uid === u.uid).time).toLocaleDateString()
                        : "UNKNOWN"
                     }
                  </span>
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


