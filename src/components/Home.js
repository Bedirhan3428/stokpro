import "../styles/Home.css"; // Yeni CSS dosyasını import ediyoruz
 import React from "react"
 import f useNavigate ) from "react-router-dom"; 
import (getAuth ) from "firebase/auth"; 
import Info from "./info":
<
export default function Home() f const nav = useNaviqate () 
const auth = getAuth() 
const user = auth.currentUser:
return (
<div className="home-kapsul"> <div className="home-kart">
<h1 className="ho me-baslik">StokPro</ h1>
<p className="home-alt"> sletmeniz için basit, hizl ve qüvenilir stok vönetimi Satış, barkod, veresiye ve muhasebe işlemlerini tek bir yerden yönetin.
</p>
<div className="home-cta"> <button
className-"home-btn" onClick=(( => nav(user ? "/dashboard" : "/register")] aria-label="Hemen Başla"
>
fuser ? "Panele Git" :
"Hemen Basla")
</button> </div>
<div
className="home-info">
<lnfo /> </div>
</div> </div>
);