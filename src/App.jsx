import React, { useState, useEffect, useCallback } from "react";
import { getDealers, getCars, getSettings, createDealer, updateDealer, deleteDealer, createCar, updateCar, updateSettings, deleteCar, uploadCarPhoto, getCatalogueTemplates, saveCatalogueTemplate, deleteCatalogueTemplate, uploadCatalogueAsset } from "./lib/db";

const EQUIPMENT_LABELS = {
  sun_roof:        "☀️ Sun Roof",
  leather_seat:    "🪑 Cuir",
  power_seat:      "⚡ Siège élec.",
  seat_heating:    "🌡️ Chauf. siège",
  seat_ventilation:"💨 Ventil. siège",
  alloy_wheel:     "🔘 Jantes alu",
  led_lights:      "💡 LED Lights",
  camera_360:      "📷 360° Caméra",
  adaptive_cruise: "🚗 Cruise Control",
  auto_ac:         "❄️ Clim Auto",
  abs:             "🛑 ABS",
  driver_airbag:   "💺 Airbag",
  power_window:    "🔲 Vitres élec.",
  gps:             "🗺️ GPS",
  bluetooth:       "📶 Bluetooth",
  keyless_entry:   "🔑 Keyless Entry",
  parking_sensors: "📡 Capteurs park.",
  start_stop:      "🔄 Start/Stop",
  cd_dvd:          "📀 CD/DVD",
  tv:              "📺 Écran TV",
};
const FUEL_TYPES    = ["Essence","Diesel","Hybride","Électrique","GPL"];
const TRANSMISSIONS = ["Manuelle","Automatique","CVT","DSG/DCT","PDK","Tiptronic","EDC","Autre"];
const BODY_TYPES    = ["Berline","SUV","Hatchback","Coupé","Cabriolet","Wagon","Pickup","Monospace","Autre"];
const COLORS_LIST   = ["Noir","Blanc","Gris","Argent","Bleu","Rouge","Vert","Orange","Beige","Marron","Or","Rose","Violet","Autre"];
const COLOR_HEX     = {Noir:"#111",Blanc:"#fff",Gris:"#888",Argent:"#C0C0C0",Bleu:"#2563eb",Rouge:"#dc2626",Vert:"#16a34a",Orange:"#ea580c",Beige:"#d4b896",Marron:"#78350f",Or:"#ca8a04",Rose:"#ec4899",Violet:"#7c3aed",Autre:"#6b7280"};

const ALL_BRANDS = [
  {n:"Acura",d:"acura.com"},{n:"Alfa Romeo",d:"alfaromeo.com"},{n:"Alpine",d:"alpinecars.com"},
  {n:"Aston Martin",d:"astonmartin.com"},{n:"Audi",d:"audi.com"},{n:"BAIC",d:"baic.com.cn"},
  {n:"Bentley",d:"bentleymotors.com"},{n:"BMW",d:"bmw.com"},{n:"BYD",d:"byd.com"},
  {n:"Bugatti",d:"bugatti.com"},{n:"Buick",d:"buick.com"},{n:"Cadillac",d:"cadillac.com"},
  {n:"Changan",d:"changan.com"},{n:"Chery",d:"chery.com"},{n:"Chevrolet",d:"chevrolet.com"},
  {n:"Chrysler",d:"chrysler.com"},{n:"Citroën",d:"citroen.com"},{n:"Cupra",d:"cupraofficial.com"},
  {n:"Dacia",d:"dacia.com"},{n:"Dodge",d:"dodge.com"},{n:"DS",d:"dsautomobiles.com"},
  {n:"Ferrari",d:"ferrari.com"},{n:"Fiat",d:"fiat.com"},{n:"Ford",d:"ford.com"},
  {n:"GAC",d:"gac.com"},{n:"Geely",d:"geely.com"},{n:"Genesis",d:"genesis.com"},
  {n:"GMC",d:"gmc.com"},{n:"Great Wall",d:"gwm.com"},{n:"Haval",d:"haval.com"},
  {n:"Honda",d:"honda.com"},{n:"HongQi",d:"hongqi.com"},{n:"Hummer",d:"hummer.com"},
  {n:"Hyundai",d:"hyundai.com"},{n:"Infiniti",d:"infiniti.com"},{n:"Isuzu",d:"isuzu.com"},
  {n:"Jaguar",d:"jaguar.com"},{n:"Jeep",d:"jeep.com"},{n:"Jetour",d:"jetour.com"},
  {n:"Kia",d:"kia.com"},{n:"Lamborghini",d:"lamborghini.com"},{n:"Lancia",d:"lancia.com"},
  {n:"Land Rover",d:"landrover.com"},{n:"Livan",d:"livan-auto.com"},{n:"Leapmotor",d:"leapmotor.com"},{n:"Lexus",d:"lexus.com"},
  {n:"Li Auto",d:"lixiang.com"},{n:"Lincoln",d:"lincolnvehicles.com"},{n:"Lotus",d:"lotuscars.com"},
  {n:"Lucid",d:"lucidmotors.com"},{n:"Maserati",d:"maserati.com"},{n:"Mazda",d:"mazda.com"},
  {n:"McLaren",d:"mclaren.com"},{n:"Mercedes-Benz",d:"mercedes-benz.com"},{n:"MG",d:"mgmotor.com"},{n:"Roewe",d:"roewe.com"},
  {n:"Mini",d:"mini.com"},{n:"Mitsubishi",d:"mitsubishi-motors.com"},{n:"NIO",d:"nio.com"},
  {n:"Nissan",d:"nissan.com"},{n:"Opel",d:"opel.com"},{n:"Peugeot",d:"peugeot.com"},
  {n:"Porsche",d:"porsche.com"},{n:"RAM",d:"ramtrucks.com"},{n:"Renault",d:"renault.com"},
  {n:"Rivian",d:"rivian.com"},{n:"Rolls-Royce",d:"rolls-roycemotorcars.com"},
  {n:"Seat",d:"seat.com"},{n:"Skoda",d:"skoda-auto.com"},{n:"Smart",d:"smart.com"},
  {n:"Subaru",d:"subaru.com"},{n:"Suzuki",d:"globalsuzuki.com"},{n:"Tank",d:"tank.com"},
  {n:"Tesla",d:"tesla.com"},{n:"Toyota",d:"toyota.com"},{n:"Volkswagen",d:"volkswagen.com"},
  {n:"Volvo",d:"volvocars.com"},{n:"Xpeng",d:"hpnio.com"},{n:"Zeekr",d:"zeekr.com"},
  {n:"Autre",d:null},
];
const BRAND_NAMES = ALL_BRANDS.map(b=>b.n);

const _dlParams = new URLSearchParams(window.location.search);
const _deepLink = {
  brand:  _dlParams.get('brand')  || '',
  model:  _dlParams.get('model')  || '',
  year:   _dlParams.get('year')   || '',
  dealer: _dlParams.get('dealer') || '',
  trim:   _dlParams.get('trim')   || '',
  color:  _dlParams.get('color')  || '',
};
const _hasDeepLink = Object.values(_deepLink).some(v => v !== '');

const EMPTY_FILTERS = {brand:"",model:"",fuel:"",transmission:"",condition:"",status:"",color:"",body_type:"",yearMin:"",yearMax:"",mileageMax:300000,priceMax:500000,priceMaxUSD:50000,equipment:{}};
const EMPTY_CAR     = {dealer_id:"",brand:"",model:"",year:"",trim:"",body_type:"",condition:"used",status:"available",mileage:"",origin:"imported",price_fob:"",negotiable:false,fuel_type:"",transmission:"",engine_size:"",color:"",doors:"",description:""};
const EMPTY_EQ      = Object.fromEntries(Object.keys(EQUIPMENT_LABELS).map(k=>[k,false]));

const fmt    = n => n!=null ? new Intl.NumberFormat("fr-DZ").format(Math.round(n)) : "—";
const fmtCNY = n => n ? "¥"+new Intl.NumberFormat("zh-CN").format(n) : "—";
const calcDZD = (cny, s, usd=null, currency='CNY') => {
  if (!s?.usd_dzd_rate) return null;
  let priceUSD;
  if (currency === 'USD' && usd) {
    priceUSD = parseFloat(usd);
  } else if (cny && s?.cny_usd_rate) {
    priceUSD = parseFloat(cny) * parseFloat(s.cny_usd_rate);
  } else {
    return null;
  }
  if (!priceUSD) return null;
  const margin = parseFloat(s.margin_dzd)||0;
  return Math.round((priceUSD + (parseFloat(s.shipment_fee_usd)||0)) * parseFloat(s.usd_dzd_rate) + margin);
};

const getUSD = (car, s) => {
  if (car.price_currency === 'USD' && car.price_usd) return parseFloat(car.price_usd);
  if (car.price_cny && s?.cny_usd_rate) return parseFloat(car.price_cny) * parseFloat(s.cny_usd_rate);
  return null;
};

const G = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--red:#d36135;--red2:#c0001a;--dark:#1c1c1c;--gray:#f2f2f2;--gray2:#e5e5e5;--gray4:#9a9a9a;--border:#ddd;--text:#1c1c1c;--text2:#555;}
body{font-family:'Barlow',sans-serif;background:var(--gray);color:var(--text);min-height:100vh;}
h1,h2,h3,h4{font-family:'Barlow Condensed',sans-serif;}
::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#ebebeb;}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px;}
button{cursor:pointer;font-family:'Barlow',sans-serif;border:none;outline:none;transition:all .18s;}
input,select,textarea{font-family:'Barlow',sans-serif;outline:none;}
a{text-decoration:none;color:inherit;}
.btn-red{background:var(--red);color:#fff;padding:9px 20px;border-radius:8px;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.btn-red:hover{background:var(--red2);box-shadow:0 3px 12px rgba(232,0,29,.25);}
.btn-red:disabled{opacity:.5;cursor:not-allowed;}
.btn-out{background:#fff;color:var(--text);padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;border:1.5px solid var(--border);display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.btn-out:hover{border-color:#aaa;background:var(--gray);}
.btn-del{background:#fff0f0;color:#dc2626;padding:7px 13px;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #fecaca;display:inline-flex;align-items:center;gap:5px;}
.btn-del:hover{background:#fee2e2;}
.f{background:#fff;border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;width:100%;transition:border .2s;}
.f:focus{border-color:var(--red);box-shadow:0 0 0 3px rgba(232,0,29,.07);}
.f::placeholder{color:#bbb;}
select.f{appearance:auto;}
.lbl{font-size:11px;font-weight:700;color:var(--text2);margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em;display:block;}
.tag{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;}
.tg{background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;}
.tr{background:#fee2e2;color:#991b1b;border:1px solid #fecaca;}
.to{background:#fef3c7;color:#92400e;border:1px solid #fde68a;}
.tb{background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;}
.tgr{background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;}
.card{background:#fff;border:1px solid var(--border);border-radius:12px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes spin{from{transform:rotate(0);}to{transform:rotate(360deg);}}
.au{animation:fadeUp .3s ease forwards;}
.mobile-nav{display:none;}
.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:400;animation:fadeIn .2s ease;}
.sidebar{position:fixed;top:0;left:0;bottom:0;width:280px;background:#fff;z-index:401;box-shadow:4px 0 24px rgba(0,0,0,.18);display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);}
.sidebar.open{transform:translateX(0);}
@media(max-width:900px){
  .nav-top{display:none!important;}
  .nav-search{display:none!important;}
  .mobile-nav{display:flex!important;}
  .sidebar-overlay{display:block;}
  .search-grid{grid-template-columns:1fr!important;}
  .detail-grid{grid-template-columns:1fr!important;}
  .sqlgen-grid{grid-template-columns:1fr!important;}
  .sqlgen-info{position:static!important;}
  .export-grid{grid-template-columns:1fr!important;}
  .sticky-sidebar{position:static!important;}
  .settings-grid{grid-template-columns:1fr!important;}
  .stats-row{grid-template-columns:repeat(2,1fr)!important;}
}
@media(max-width:700px){
  .car-card{flex-direction:column!important;}
  .car-card-photo{width:100%!important;min-height:180px!important;}
  .car-card-price{width:100%!important;border-left:none!important;border-top:1px solid #e5e5e5!important;flex-direction:row!important;justify-content:space-between!important;align-items:center!important;padding:10px 14px!important;}
  .filter-grid4{grid-template-columns:1fr 1fr!important;}
  .filter-sliders{grid-template-columns:1fr!important;}
  .brand-grid{grid-template-columns:repeat(3,1fr)!important;}
  .specs-grid3{grid-template-columns:repeat(2,1fr)!important;}
  .eq-grid{grid-template-columns:repeat(2,1fr)!important;}
  .form-grid2{grid-template-columns:1fr!important;}
  .form-grid3{grid-template-columns:1fr!important;}
  .page-wrap{padding:120px 12px 40px!important;}
  .sqlgen-dealer-row{grid-template-columns:1fr!important;}
  .sqlgen-stats{grid-template-columns:repeat(2,1fr)!important;}
  .dealer-form-row{grid-template-columns:1fr!important;}
  .export-config-panel{display:none!important;}
  .export-mobile-config{display:block!important;}
  .hero-stats{display:none!important;}
}
@media(max-width:480px){
  .brand-grid{grid-template-columns:repeat(2,1fr)!important;}
  .nav-main{padding:0 8px!important;}
  .filter-grid4{grid-template-columns:1fr!important;}
  .specs-grid3{grid-template-columns:1fr 1fr!important;}
  .sqlgen-stats{grid-template-columns:1fr 1fr!important;}
}
`;

const CarSVG = ({size=80}) => (
  <svg width={size} height={size*.55} viewBox="0 0 120 66" fill="none">
    <rect x="4" y="28" width="112" height="26" rx="6" fill="#e5e7eb"/>
    <path d="M18 28 L28 11 Q30 8 34 8 L86 8 Q90 8 92 11 L102 28Z" fill="#d1d5db"/>
    <circle cx="26" cy="54" r="9" fill="#374151"/><circle cx="26" cy="54" r="5" fill="#9ca3af"/>
    <circle cx="94" cy="54" r="9" fill="#374151"/><circle cx="94" cy="54" r="5" fill="#9ca3af"/>
    <rect x="36" y="10" width="48" height="16" rx="2" fill="#bfdbfe" opacity=".8"/>
    <rect x="7" y="31" width="16" height="8" rx="2" fill="#fde68a"/>
    <rect x="97" y="31" width="16" height="8" rx="2" fill="#fca5a5"/>
  </svg>
);

const Spinner = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80}}>
    <div style={{width:32,height:32,border:"3px solid #e5e5e5",borderTopColor:"#d36135",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
  </div>
);

const Toast = ({msg,type}) => (
  <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:type==="error"?"#fef2f2":"#f0fdf4",border:"1px solid "+(type==="error"?"#fecaca":"#bbf7d0"),color:type==="error"?"#dc2626":"#16a34a",padding:"11px 18px",borderRadius:10,fontSize:13,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,.12)",animation:"fadeUp .3s ease"}}>
    {type==="error"?"✕ ":"✓ "}{msg}
  </div>
);

const STag = ({status}) => {
  const m={available:{c:"tg",l:"● Disponible"},sold:{c:"tr",l:"● Vendu"},reserved:{c:"to",l:"● Réservé"}};
  const s=m[status]||m.available;
  return <span className={"tag "+s.c}>{s.l}</span>;
};
const CTag = ({condition}) => condition==="new" ? <span className="tag tb">Neuf</span> : <span className="tag tgr">Occasion</span>;

const BrandLogo = ({brand, size=28}) => {
  const b = ALL_BRANDS.find(x=>x.n===brand);
  const [ok, setOk] = useState(true);
  if (!b?.d || !ok) return <span style={{fontSize:9,fontWeight:900,color:"#9a9a9a",lineHeight:1,textAlign:"center"}}>{(brand||"?").slice(0,5)}</span>;
  return <img src={"https://logo.clearbit.com/"+b.d} alt={brand} width={size} height={Math.round(size*.7)} style={{objectFit:"contain"}} onError={()=>setOk(false)} referrerPolicy="no-referrer"/>;
};

const NAV_ITEMS = [
  {id:"home",     icon:"🚗", l:"Voitures"},
  {id:"dealers",  icon:"🏢", l:"Concessionnaires"},
  {id:"export",   icon:"📄", l:"Export PDF"},
  {id:"catalogue",icon:"🎨", l:"Catalogue"},
  {id:"sql-gen",  icon:"🛠", l:"SQL Generator"},
  {id:"settings", icon:"⚙️", l:"Paramètres"},
];

const Navbar = ({page, setPage, search, setSearch}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = id => { setPage(id); setSidebarOpen(false); };

  return (
    <>
      <nav style={{background:"#fff",borderBottom:"3px solid #d36135",position:"fixed",top:0,left:0,right:0,zIndex:300,boxShadow:"0 2px 10px rgba(0,0,0,.08)"}}>
        <div className="nav-top" style={{background:"#1c1c1c",padding:"4px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#888",fontSize:11,fontWeight:600}}>📍 Algérie — Import direct Chine</span>
          <div style={{display:"flex",gap:20}}>
            {NAV_ITEMS.map(item=>(
              <button key={item.id} onClick={()=>setPage(item.id)} style={{background:"none",color:page===item.id?"#d36135":"#999",fontSize:11,fontWeight:700,padding:"2px 0",borderBottom:page===item.id?"1.5px solid #d36135":"1.5px solid transparent"}}>{item.icon} {item.l}</button>
            ))}
          </div>
        </div>
        <div className="nav-main" style={{padding:"0 16px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}} onClick={()=>navigate("home")}>
            <img src="/logo.png" alt="El Warcha Auto"
              style={{height:40,width:"auto",objectFit:"contain",flexShrink:0}}
              onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>
            <div style={{display:"none",width:34,height:34,background:"#d36135",borderRadius:6,alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔧</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:18,lineHeight:1}}>EL WARCHA <span style={{color:"#d36135"}}>AUTO</span></div>
              <div style={{fontSize:8,color:"#9a9a9a",fontWeight:700,letterSpacing:".1em"}}>IMPORT • VENTE • ALGÉRIE</div>
            </div>
          </div>
          <div className="nav-search" style={{flex:1,maxWidth:440,position:"relative"}}>
            <input className="f" placeholder="🔍  Marque, modèle, année..." value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&page!=="home")setPage("home");}}
              style={{borderRadius:20,paddingRight:search?32:16,fontSize:13,borderColor:"#e5e5e5",height:34}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#9a9a9a",fontSize:13,padding:2}}>✕</button>}
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
            <button className="btn-red" onClick={()=>navigate("add-car")} style={{fontSize:12,padding:"7px 14px"}}>+ Voiture</button>
            <button className="mobile-nav" onClick={()=>setSidebarOpen(true)}
              style={{flexDirection:"column",gap:4,background:"none",border:"none",padding:"6px",cursor:"pointer",borderRadius:6}}>
              <span style={{display:"block",width:22,height:2,background:"#1c1c1c",borderRadius:2}}/>
              <span style={{display:"block",width:22,height:2,background:"#1c1c1c",borderRadius:2}}/>
              <span style={{display:"block",width:22,height:2,background:"#1c1c1c",borderRadius:2}}/>
            </button>
          </div>
        </div>
        <div className="mobile-nav" style={{padding:"8px 14px 10px",borderTop:"1px solid #f0f0f0"}}>
          <div style={{position:"relative",width:"100%"}}>
            <input className="f" placeholder="🔍  Rechercher..." value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&page!=="home")setPage("home");}}
              style={{borderRadius:20,paddingRight:search?32:16,fontSize:13,borderColor:"#e5e5e5",height:36}}/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#9a9a9a",fontSize:13,padding:2}}>✕</button>}
          </div>
        </div>
      </nav>

      {sidebarOpen&&<div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>}

      <div className={"sidebar"+(sidebarOpen?" open":"")}>
        <div style={{background:"#1c1c1c",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,background:"#d36135",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🔧</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:17,color:"#fff",lineHeight:1}}>EL WARCHA <span style={{color:"#d36135"}}>AUTO</span></div>
              <div style={{fontSize:9,color:"#888",fontWeight:700,letterSpacing:".08em"}}>IMPORT • VENTE • ALGÉRIE</div>
            </div>
          </div>
          <button onClick={()=>setSidebarOpen(false)} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",width:30,height:30,borderRadius:6,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 10px"}}>
          {NAV_ITEMS.map(item=>{
            const active = page===item.id;
            return (
              <button key={item.id} onClick={()=>navigate(item.id)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 14px",borderRadius:10,border:"none",background:active?"#fff0f0":"transparent",color:active?"#d36135":"#333",fontFamily:"'Barlow',sans-serif",fontSize:14,fontWeight:active?700:500,cursor:"pointer",marginBottom:4,textAlign:"left",transition:"background .15s"}}>
                <span style={{fontSize:20,flexShrink:0}}>{item.icon}</span>
                <span>{item.l}</span>
                {active&&<span style={{marginLeft:"auto",width:6,height:6,background:"#d36135",borderRadius:"50%",flexShrink:0}}/>}
              </button>
            );
          })}
          <div style={{borderTop:"1px solid #f0f0f0",margin:"12px 0"}}/>
          <button onClick={()=>navigate("add-car")}
            style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"13px 14px",borderRadius:10,border:"none",background:"#d36135",color:"#fff",fontFamily:"'Barlow',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",textAlign:"left"}}>
            <span style={{fontSize:20,flexShrink:0}}>➕</span>
            <span>Ajouter une voiture</span>
          </button>
        </div>
        <div style={{padding:"14px 20px",borderTop:"1px solid #f0f0f0",flexShrink:0}}>
          <p style={{fontSize:10,color:"#bbb",fontWeight:600,letterSpacing:".06em",textAlign:"center"}}>EL WARCHA AUTO © 2025</p>
        </div>
      </div>
    </>
  );
};

const SearchPanel = ({filters, setFilters, cars=[]}) => {
  const [draft, setDraft] = useState({...filters});
  const [activeLetter, setActiveLetter] = useState("All");
  const [moreOpen, setMoreOpen] = useState(false);
  const alphabet = ["All","2","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
  const visibleBrands = activeLetter==="All" ? ALL_BRANDS : ALL_BRANDS.filter(b=>b.n.toUpperCase().startsWith(activeLetter));
  const eqRow1 = ["cd_dvd","sun_roof","leather_seat","power_seat","seat_heating","seat_ventilation","alloy_wheel","tv"];
  const eqRow2 = ["power_window","auto_ac","abs","driver_airbag","camera_360","adaptive_cruise"];
  const years  = Array.from({length:16},(_,i)=>2025-i);
  const availableModels = draft.brand
    ? [...new Set(cars.filter(c=>c.brand===draft.brand).map(c=>c.model).filter(Boolean))].sort()
    : [];
  const toggleEq = k => setDraft(f=>({...f,equipment:{...(f.equipment||{}),[k]:!f.equipment?.[k]}}));
  const apply = () => setFilters({...draft});
  const clearAll = () => { setDraft({...EMPTY_FILTERS}); setFilters({...EMPTY_FILTERS}); };

  return (
    <div className="card" style={{overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
      <div style={{background:"#1c1c1c",padding:"10px 16px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{color:"#d36135",fontSize:18,fontWeight:900,lineHeight:1}}>|</span>
        <span style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:17,color:"#fff",letterSpacing:".03em"}}>RECHERCHE AVANCÉE</span>
      </div>
      <div className="search-grid" style={{display:"grid",gridTemplateColumns:"1fr 270px"}}>
        <div style={{padding:"14px 16px",borderRight:"1px solid #e5e5e5"}}>
          <div className="filter-grid4" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:10,marginBottom:10,alignItems:"end"}}>
            <div><label className="lbl">Marque</label>
              <select className="f" style={{fontSize:12}} value={draft.brand} onChange={e=>setDraft(f=>({...f,brand:e.target.value,model:""}))}>
                <option value="">Toutes</option>{BRAND_NAMES.map(b=><option key={b} value={b}>{b}</option>)}
              </select></div>
            <div><label className="lbl">Modèle</label>
              <select className="f" style={{fontSize:12}} value={draft.model||""} onChange={e=>setDraft(f=>({...f,model:e.target.value}))} disabled={!draft.brand}>
                <option value="">{draft.brand?"Tous":"— Choisir marque"}</option>
                {availableModels.map(m=><option key={m} value={m}>{m}</option>)}
              </select></div>
            <div><label className="lbl">Carrosserie</label>
              <select className="f" style={{fontSize:12}} value={draft.body_type} onChange={e=>setDraft(f=>({...f,body_type:e.target.value}))}>
                <option value="">Tous</option>{BODY_TYPES.map(b=><option key={b}>{b}</option>)}
              </select></div>
            <div><label className="lbl">Année min</label>
              <select className="f" style={{fontSize:12}} value={draft.yearMin} onChange={e=>setDraft(f=>({...f,yearMin:e.target.value}))}>
                <option value="">—</option>{years.map(y=><option key={y}>{y}</option>)}
              </select></div>
            <div><label className="lbl">Année max</label>
              <select className="f" style={{fontSize:12}} value={draft.yearMax} onChange={e=>setDraft(f=>({...f,yearMax:e.target.value}))}>
                <option value="">—</option>{years.map(y=><option key={y}>{y}</option>)}
              </select></div>
          </div>
          <div className="filter-grid4" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:10,marginBottom:12,alignItems:"end"}}>
            <div><label className="lbl">Condition</label>
              <select className="f" style={{fontSize:12}} value={draft.condition} onChange={e=>setDraft(f=>({...f,condition:e.target.value}))}>
                <option value="">Toutes</option><option value="new">Neuf</option><option value="used">Occasion</option>
              </select></div>
            <div><label className="lbl">Carburant</label>
              <select className="f" style={{fontSize:12}} value={draft.fuel} onChange={e=>setDraft(f=>({...f,fuel:e.target.value}))}>
                <option value="">Tous</option>{FUEL_TYPES.map(f=><option key={f}>{f}</option>)}
              </select></div>
            <div><label className="lbl">Transmission</label>
              <select className="f" style={{fontSize:12}} value={draft.transmission||""} onChange={e=>setDraft(f=>({...f,transmission:e.target.value}))}>
                <option value="">Toutes</option>{TRANSMISSIONS.map(t=><option key={t}>{t}</option>)}
              </select></div>
            <div><label className="lbl">Statut</label>
              <select className="f" style={{fontSize:12}} value={draft.status} onChange={e=>setDraft(f=>({...f,status:e.target.value}))}>
                <option value="">Tous</option><option value="available">Disponible</option><option value="sold">Vendu</option><option value="reserved">Réservé</option>
              </select></div>
            <div><label className="lbl">Couleur</label>
              <select className="f" style={{fontSize:12}} value={draft.color} onChange={e=>setDraft(f=>({...f,color:e.target.value}))}>
                <option value="">Toutes</option>{COLORS_LIST.map(c=><option key={c}>{c}</option>)}
              </select></div>
          </div>
          <div className="filter-sliders" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:10}}>
            <div><label className="lbl">Km max: <b>{fmt(draft.mileageMax||300000)} km</b></label>
              <input type="range" min={0} max={300000} step={5000} value={draft.mileageMax||300000} onChange={e=>setDraft(f=>({...f,mileageMax:+e.target.value}))} style={{width:"100%",accentColor:"#d36135"}}/></div>
            <div><label className="lbl">Prix max CNY: <b>{fmtCNY(draft.priceMax||500000)}</b></label>
              <input type="range" min={0} max={500000} step={5000} value={draft.priceMax||500000} onChange={e=>setDraft(f=>({...f,priceMax:+e.target.value}))} style={{width:"100%",accentColor:"#d36135"}}/></div>
            <div><label className="lbl">Prix max USD: <b>{"$"+(draft.priceMaxUSD||50000).toLocaleString("fr-DZ")}</b></label>
              <input type="range" min={0} max={50000} step={500} value={draft.priceMaxUSD||50000} onChange={e=>setDraft(f=>({...f,priceMaxUSD:+e.target.value}))} style={{width:"100%",accentColor:"#d36135"}}/></div>
          </div>
          <div style={{marginBottom:10}}>
            <label className="lbl" style={{marginBottom:6}}>Couleur (cliquer)</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {COLORS_LIST.map(c=>(
                <button key={c} title={c} onClick={()=>setDraft(f=>({...f,color:f.color===c?"":c}))}
                  style={{width:22,height:22,borderRadius:"50%",background:COLOR_HEX[c]||"#ccc",border:draft.color===c?"3px solid #d36135":"2px solid #d1d5db",boxShadow:draft.color===c?"0 0 0 2px #fff,0 0 0 4px #d36135":"none",flexShrink:0,transition:"all .15s"}}/>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:4}}>
            {eqRow1.map(k=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,cursor:"pointer",background:draft.equipment?.[k]?"#fef2f2":"#f9f9f9",padding:"4px 8px",borderRadius:5,border:"1px solid "+(draft.equipment?.[k]?"#fecaca":"#e5e5e5")}}>
                <input type="checkbox" checked={!!draft.equipment?.[k]} onChange={()=>toggleEq(k)} style={{accentColor:"#d36135",width:12,height:12}}/>{EQUIPMENT_LABELS[k]}
              </label>
            ))}
          </div>
          <button onClick={()=>setMoreOpen(!moreOpen)} style={{background:"none",border:"none",color:"#9a9a9a",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4,padding:"4px 0"}}>{moreOpen?"▲":"▼"} PLUS D'OPTIONS</button>
          {moreOpen&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6,marginBottom:4}}>
              {eqRow2.map(k=>(
                <label key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,cursor:"pointer",background:draft.equipment?.[k]?"#fef2f2":"#f9f9f9",padding:"4px 8px",borderRadius:5,border:"1px solid "+(draft.equipment?.[k]?"#fecaca":"#e5e5e5")}}>
                  <input type="checkbox" checked={!!draft.equipment?.[k]} onChange={()=>toggleEq(k)} style={{accentColor:"#d36135",width:12,height:12}}/>{EQUIPMENT_LABELS[k]}
                </label>
              ))}
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid #e5e5e5",marginTop:10}}>
            <button onClick={clearAll} style={{background:"none",border:"none",color:"#9a9a9a",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>⟳ Effacer</button>
            <button className="btn-red" onClick={apply} style={{padding:"8px 28px",fontSize:13}}>🔍 Rechercher</button>
          </div>
        </div>
        <div style={{padding:"12px",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:2,marginBottom:8,paddingBottom:6,borderBottom:"1px solid #e5e5e5"}}>
            {alphabet.map(l=>(
              <button key={l} onClick={()=>setActiveLetter(l)} style={{padding:"1px 5px",borderRadius:3,fontSize:10,fontWeight:700,background:activeLetter===l?"#1c1c1c":"transparent",color:activeLetter===l?"#fff":"#555",border:"1px solid "+(activeLetter===l?"#1c1c1c":"transparent")}}>{l}</button>
            ))}
          </div>
          <div className="brand-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,overflowY:"auto",flex:1,maxHeight:220}}>
            {visibleBrands.map(b=>(
              <button key={b.n} onClick={()=>setDraft(f=>({...f,brand:f.brand===b.n?"":b.n}))}
                style={{background:draft.brand===b.n?"#fff0f0":"#fff",border:"1.5px solid "+(draft.brand===b.n?"#d36135":"#e5e5e5"),borderRadius:6,padding:"5px 2px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",transition:"all .15s",minHeight:48}}>
                <div style={{width:34,height:22,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <BrandLogo brand={b.n} size={30}/>
                </div>
                <span style={{fontSize:8,fontWeight:700,color:"#555",textAlign:"center",lineHeight:1.2,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingInline:2,width:"100%"}}>{b.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CarCard = ({car, settings, onClick, onCatalogue}) => {
  const dzd = calcDZD(car.price_cny, settings, car.price_fob||car.price_usd, 'USD');
  const photos = car.photos||[];
  const eq     = car.car_equipment?.[0]||{};
  const eqList = Object.entries(EQUIPMENT_LABELS).filter(([k])=>eq[k]).map(([,v])=>v);
  return (
    <div onClick={onClick} className="card car-card" style={{display:"flex",cursor:"pointer",marginBottom:10,transition:"box-shadow .2s,border-color .2s",overflow:"hidden"}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.12)";e.currentTarget.style.borderColor="#bbb";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="#ddd";}}>
      <div className="car-card-photo" style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",background:"#f7f7f7",position:"relative"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",minHeight:130,overflow:"hidden",position:"relative"}}>
          {photos.length>0?<img src={photos[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<CarSVG size={80}/>}
          {car.status==="sold"&&(
            <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:20,color:"#fff",border:"2px solid #fff",padding:"1px 10px",transform:"rotate(-12deg)"}}>VENDU</span>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:3,padding:4,background:"#efefef",borderTop:"1px solid #e5e5e5"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{flex:1,height:34,background:"#e5e5e5",borderRadius:3,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {photos[i]?<img src={photos[i]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<CarSVG size={18}/>}
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1,padding:"11px 14px",borderLeft:"1px solid #e5e5e5",display:"flex",flexDirection:"column",gap:7,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{minWidth:0}}>
            <h3 style={{fontSize:17,fontWeight:900,lineHeight:1.2,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{car.year} {car.brand} {car.model} {car.trim}</h3>
            {car.dealers&&<span style={{fontSize:11,color:"#9a9a9a",fontWeight:600}}>🏢 {car.dealers.name}</span>}
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <STag status={car.status}/><CTag condition={car.condition}/>{car.negotiable&&<span className="tag tgr">🏷️</span>}
          </div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",borderRadius:5,overflow:"hidden",border:"1px solid #e5e5e5",width:"fit-content",maxWidth:"100%"}}>
          {[{l:"Année",v:car.year||"—"},{l:"Km",v:car.mileage?fmt(car.mileage):"—"},{l:"Carburant",v:car.fuel_type||"—"},{l:"Moteur",v:car.engine_size||"—"},{l:"Boîte",v:(car.transmission||"—").split("/")[0]}].map((s,i,arr)=>(
            <div key={s.l} style={{padding:"4px 10px",borderRight:i<arr.length-1?"1px solid #e5e5e5":"none",textAlign:"center",minWidth:68}}>
              <div style={{fontSize:8,color:"#9a9a9a",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:1}}>{s.l}</div>
              <div style={{fontSize:12,fontWeight:800}}>{s.v}</div>
            </div>
          ))}
        </div>
        {eqList.length>0&&(
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {eqList.slice(0,6).map(e=><span key={e} style={{fontSize:10,padding:"2px 6px",background:"#f0f9ff",color:"#0369a1",border:"1px solid #bae6fd",borderRadius:3,fontWeight:700}}>{e}</span>)}
            {eqList.length>6&&<span style={{fontSize:10,color:"#9a9a9a",fontWeight:600}}>+{eqList.length-6}</span>}
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:"auto",flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#9a9a9a"}}>{car.origin==="imported"?"✈️ Importé":"🏠 Local"}{car.body_type?" • "+car.body_type:""}</span>
          {car.color&&<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,color:"#555"}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:COLOR_HEX[car.color]||"#ccc",border:"1px solid rgba(0,0,0,.15)",flexShrink:0,display:"inline-block"}}/>
            {car.color}
          </span>}
        </div>
      </div>
      <div className="car-card-price" style={{width:148,flexShrink:0,borderLeft:"1px solid #e5e5e5",padding:"12px",display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"space-between",background:"#fafafa"}}>
        <div style={{textAlign:"right"}}>
          {car.price_fob&&<div style={{fontSize:9,color:"#0369a1",fontWeight:700,marginBottom:1}}>FOB ${new Intl.NumberFormat("fr-DZ").format(car.price_fob)}</div>}
          <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:21,color:"#d36135",lineHeight:1}}>
            {(()=>{const f=parseFloat(car.price_fob)||0;const s=parseFloat(settings?.shipment_fee_usd)||0;const t=f>0?f+s:0;return t>0?'$'+new Intl.NumberFormat('fr-DZ').format(Math.round(t)):'—';})()}
          </div>
          {dzd&&(
            <div style={{marginTop:5,padding:"4px 8px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:5}}>
              <div style={{fontSize:8,color:"#92400e",fontWeight:700}}>≈ DZD</div>
              <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:13,color:"#92400e"}}>{fmt(dzd)}</div>
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
          <div style={{fontSize:9,color:"#9a9a9a",fontWeight:600}}>{new Date(car.created_at||Date.now()).toLocaleDateString("fr-DZ")}</div>
          {onCatalogue&&<button
            onClick={e=>{e.stopPropagation();onCatalogue(car);}}
            title="Générer le catalogue"
            style={{background:"#1c1c1c",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:"#E89A1C",whiteSpace:"nowrap",transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#333"}
            onMouseLeave={e=>e.currentTarget.style.background="#1c1c1c"}
          >
            🎨 Catalogue
          </button>}
        </div>
      </div>
    </div>
  );
};

const HomePage = ({cars, settings, loading, setPage, setSelectedCar, setCatalogueCar, search, setSearch}) => {
  const [filters, setFilters] = useState({...EMPTY_FILTERS});
  const [sortHome, setSortHome] = useState("default");
  const filtered = cars.filter(c => {
    const q = search.toLowerCase();
    if (q && !((c.brand+" "+c.model+" "+c.year+" "+(c.trim||"")+" "+(c.dealers?.name||"")).toLowerCase().includes(q))) return false;
    if (filters.brand     && c.brand!==filters.brand) return false;
    if (filters.model     && c.model!==filters.model) return false;
    if (filters.fuel      && c.fuel_type!==filters.fuel) return false;
    if (filters.transmission && c.transmission!==filters.transmission) return false;
    if (filters.condition && c.condition!==filters.condition) return false;
    if (filters.status    && c.status!==filters.status) return false;
    if (filters.color     && c.color!==filters.color) return false;
    if (filters.body_type && c.body_type!==filters.body_type) return false;
    if (filters.yearMin   && c.year < parseInt(filters.yearMin)) return false;
    if (filters.yearMax   && c.year > parseInt(filters.yearMax)) return false;
    if ((filters.mileageMax||300000)<300000 && (c.mileage||0)>filters.mileageMax) return false;
    if ((filters.priceMax||500000)<500000   && c.price_currency!=="USD" && (c.price_cny||0)>filters.priceMax) return false;
    if ((filters.priceMaxUSD||50000)<50000  && (parseFloat(c.price_fob)||0)>filters.priceMaxUSD) return false;
    if (filters.equipment) for (const [k,v] of Object.entries(filters.equipment)) if (v && !c.car_equipment?.[0]?.[k]) return false;
    return true;
  });
  const sortedFiltered = React.useMemo(() => {
    if (sortHome === "default") return filtered;
    return [...filtered].sort((a, b) => {
      const getDZD = c => calcDZD(c.price_cny, settings, c.price_fob||c.price_usd, 'USD') || 0;
      const getFOB = c => parseFloat(c.price_fob) || 0;
      if (sortHome === "dzd_asc")  return getDZD(a) - getDZD(b);
      if (sortHome === "dzd_desc") return getDZD(b) - getDZD(a);
      if (sortHome === "fob_asc")  return getFOB(a) - getFOB(b);
      if (sortHome === "fob_desc") return getFOB(b) - getFOB(a);
      return 0;
    });
  }, [filtered, sortHome, settings]);

  const stats=[{n:cars.length,l:"Véhicules"},{n:cars.filter(c=>c.status==="available").length,l:"Disponibles"},{n:[...new Set(cars.map(c=>c.dealer_id))].length,l:"Concession."},{n:[...new Set(cars.map(c=>c.brand).filter(Boolean))].length,l:"Marques"}];
  const hasActive = search||Object.entries(filters).some(([k,v])=>k!=="mileageMax"&&k!=="priceMax"&&k!=="priceMaxUSD"&&v&&(typeof v!=="object"||Object.values(v).some(Boolean)));
  return (
    <div className="page-wrap" style={{padding:"80px 20px 40px",maxWidth:1280,margin:"0 auto"}}>
      <div style={{background:"linear-gradient(120deg,#1c1c1c 55%,#2a0808)",borderRadius:12,padding:"18px 22px",color:"#fff",marginBottom:14,overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{fontSize:28,fontWeight:900,lineHeight:1,marginBottom:3}}>EL WARCHA <span style={{color:"#d36135"}}>AUTO</span></h1>
            <p style={{color:"#999",fontSize:12}}>Import direct depuis la Chine — Algérie</p>
          </div>
          <div className="hero-stats" style={{display:"flex",gap:18,flexShrink:0}}>
            {stats.map(s=>(
              <div key={s.l} style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:24,color:"#d36135",lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:9,color:"#999",fontWeight:700,letterSpacing:".04em"}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{marginBottom:14}}><SearchPanel filters={filters} setFilters={setFilters} cars={cars}/></div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"'Barlow Condensed'",fontWeight:800,fontSize:16}}>{filtered.length} véhicule{filtered.length!==1?"s":""}</span>
          {hasActive&&<span onClick={()=>{setSearch("");setFilters({...EMPTY_FILTERS});}} style={{fontSize:11,color:"#d36135",fontWeight:700,cursor:"pointer",border:"1px solid #fecaca",background:"#fff0f0",padding:"2px 8px",borderRadius:10}}>✕ Effacer tout</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:11,color:"#9a9a9a",fontWeight:600}}>Trier :</span>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{v:"default",l:"Par défaut"},{v:"fob_asc",l:"FOB ↑"},{v:"fob_desc",l:"FOB ↓"},{v:"dzd_asc",l:"DZD ↑"},{v:"dzd_desc",l:"DZD ↓"}].map(o=>(
              <button key={o.v} onClick={()=>setSortHome(o.v)}
                style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:"1px solid",borderColor:sortHome===o.v?"#d36135":"#ddd",background:sortHome===o.v?"#d36135":"#fff",color:sortHome===o.v?"#fff":"#555",fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading?<Spinner/>:sortedFiltered.length===0?(
        <div className="card" style={{textAlign:"center",padding:60,color:"#9a9a9a"}}><div style={{fontSize:36,marginBottom:10}}>🔍</div><p style={{fontWeight:700,fontSize:15}}>Aucun véhicule trouvé</p><p style={{fontSize:12,marginTop:4}}>Modifiez vos filtres</p></div>
      ):(
        <div className="au">{sortedFiltered.map(car=><CarCard key={car.id} car={car} settings={settings} onClick={()=>{setSelectedCar(car);setPage("car-detail");}} onCatalogue={car=>{setCatalogueCar(car);setPage("catalogue");}}/>)}</div>
      )}
    </div>
  );
};

const PhotoGrid = ({previews, onAdd, onRemove}) => {
  const inputRef = React.useRef(null);
  const handleFiles = e => {
    Array.from(e.target.files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=ev=>onAdd(file,ev.target.result);
      reader.readAsDataURL(file);
    });
    e.target.value="";
  };
  return (
    <div>
      <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFiles} style={{display:"none"}}/>
      <div style={{border:"2px dashed #ddd",borderRadius:8,padding:"18px 16px",textAlign:"center",cursor:"pointer",background:"#fafafa",marginBottom:previews.length?10:0}} onClick={()=>inputRef.current?.click()}>
        <div style={{fontSize:26,marginBottom:5}}>📷</div>
        <p style={{fontSize:13,fontWeight:600,color:"#555"}}>Cliquez pour ajouter des photos</p>
        <p style={{fontSize:11,color:"#9a9a9a",marginTop:2}}>Plusieurs photos acceptées — JPG, PNG, WEBP</p>
      </div>
      {previews.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
          {previews.map((src,i)=>(
            <div key={i} style={{position:"relative",width:"100%",height:110,borderRadius:7,overflow:"hidden",border:i===0?"2px solid #d36135":"1px solid #ddd",flexShrink:0}}>
              <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
              <button onClick={e=>{e.stopPropagation();onRemove(i);}} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,.65)",color:"#fff",border:"none",borderRadius:"50%",width:20,height:20,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",padding:0,cursor:"pointer"}}>✕</button>
              {i===0&&<div style={{position:"absolute",bottom:4,left:4,background:"#d36135",color:"#fff",fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3}}>PRINCIPALE</div>}
            </div>
          ))}
          <div style={{width:"100%",height:110,borderRadius:7,border:"2px dashed #ddd",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#fafafa",gap:4}} onClick={()=>inputRef.current?.click()}>
            <span style={{fontSize:22,color:"#9a9a9a"}}>+</span>
            <span style={{fontSize:10,color:"#9a9a9a",fontWeight:600}}>Ajouter</span>
          </div>
        </div>
      )}
    </div>
  );
};

const FF  = ({label,required,children}) => (<div><label className="lbl">{label}{required&&<span style={{color:"#d36135",marginLeft:3}}>*</span>}</label>{children}</div>);
const Sec = ({title,children}) => (
  <div className="card" style={{padding:18}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:8,borderBottom:"1px solid #e5e5e5"}}>
      <div style={{width:3,height:15,background:"#d36135",borderRadius:2,flexShrink:0}}/>
      <h3 style={{fontSize:13,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em"}}>{title}</h3>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>{children}</div>
  </div>
);

const CarForm = ({initial, initialEq, dealers, settings, onSubmit, onCancel, submitLabel, loading}) => {
  const [form, setForm] = useState(initial);
  const [eq,   setEq]   = useState(initialEq);
  const [photos, setPhotos] = useState(
    (initial._existingPhotos||[]).map(url=>({src:url, file:null}))
  );
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const fobVal    = parseFloat(form.price_fob) || 0;
  const shipFee   = parseFloat(settings?.shipment_fee_usd) || 0;
  const totalUSD  = fobVal > 0 ? fobVal + shipFee : 0;
  const previewDZD = totalUSD > 0 && settings?.usd_dzd_rate
    ? Math.round(totalUSD * parseFloat(settings.usd_dzd_rate) + (parseFloat(settings?.margin_dzd)||0))
    : 0;

  const addPhoto = (file, dataUrl) => setPhotos(p=>[...p,{src:dataUrl, file}]);
  const removePhoto = i => setPhotos(p=>p.filter((_,idx)=>idx!==i));

  const previews = photos.map(p=>p.src);
  const newFiles = photos.filter(p=>p.file!==null).map(p=>p.file);
  const allPreviews = photos.map(p=>p.src);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Sec title="Concessionnaire">
        <FF label="Concessionnaire" required>
          <select className="f" value={form.dealer_id} onChange={set("dealer_id")}>
            <option value="">Sélectionner...</option>{dealers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FF>
      </Sec>
      <Sec title="Identité">
        <div className="form-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FF label="Marque"><select className="f" value={form.brand} onChange={set("brand")}><option value="">Sélectionner...</option>{BRAND_NAMES.map(b=><option key={b} value={b}>{b}</option>)}</select></FF>
          <FF label="Modèle"><input className="f" value={form.model} onChange={set("model")} placeholder="ex: Corolla"/></FF>
          <FF label="Année"><input className="f" type="number" value={form.year} onChange={set("year")} placeholder="2023"/></FF>
          <FF label="Version"><input className="f" value={form.trim} onChange={set("trim")} placeholder="ex: Sport 1.5T"/></FF>
          <FF label="Carrosserie"><select className="f" value={form.body_type} onChange={set("body_type")}><option value="">—</option>{BODY_TYPES.map(b=><option key={b}>{b}</option>)}</select></FF>
          <FF label="Couleur"><select className="f" value={form.color} onChange={set("color")}><option value="">—</option>{COLORS_LIST.map(c=><option key={c}>{c}</option>)}</select></FF>
        </div>
      </Sec>
      <Sec title="État & Statut">
        <div className="form-grid3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <FF label="Condition"><select className="f" value={form.condition} onChange={set("condition")}><option value="new">Neuf</option><option value="used">Occasion</option></select></FF>
          <FF label="Statut"><select className="f" value={form.status} onChange={set("status")}><option value="available">Disponible</option><option value="sold">Vendu</option><option value="reserved">Réservé</option></select></FF>
          <FF label="Origine"><select className="f" value={form.origin} onChange={set("origin")}><option value="imported">Importé</option><option value="local">Local</option></select></FF>
          <FF label="Kilométrage"><input className="f" type="number" value={form.mileage} onChange={set("mileage")} placeholder="45000"/></FF>
        </div>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600}}>
          <input type="checkbox" checked={form.negotiable} onChange={e=>setForm(f=>({...f,negotiable:e.target.checked}))} style={{width:14,height:14,accentColor:"#d36135"}}/>Prix négociable
        </label>
      </Sec>
      <Sec title="Prix">
        <FF label="Prix FOB ($) — Free On Board" required>
          <input className="f" type="number" value={form.price_fob||''} onChange={set("price_fob")} placeholder="ex: 7500"/>
        </FF>
        {fobVal>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 13px",background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8}}>
              <div>
                <div style={{fontSize:9,color:"#0369a1",fontWeight:700,letterSpacing:".08em",marginBottom:1}}>PRIX FOB</div>
                <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:18,color:"#0369a1"}}>${new Intl.NumberFormat("fr-DZ").format(fobVal)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"#9a9a9a",fontWeight:600}}>+ Transport ${shipFee}</div>
                <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:22,color:"#d36135"}}>${new Intl.NumberFormat("fr-DZ").format(Math.round(totalUSD))}</div>
                <div style={{fontSize:9,color:"#9a9a9a",fontWeight:600}}>PRIX TOTAL USD</div>
              </div>
            </div>
            {previewDZD>0&&(
              <div style={{padding:"9px 13px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:"#92400e",fontWeight:700}}>≈ Estimation DZD</span>
                <span style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:16,color:"#92400e"}}>{fmt(previewDZD)} DZD</span>
              </div>
            )}
          </div>
        )}
      </Sec>
      <Sec title="Technique">
        <div className="form-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FF label="Carburant"><select className="f" value={form.fuel_type} onChange={set("fuel_type")}><option value="">—</option>{FUEL_TYPES.map(f=><option key={f}>{f}</option>)}</select></FF>
          <FF label="Transmission"><select className="f" value={form.transmission} onChange={set("transmission")}><option value="">—</option>{TRANSMISSIONS.map(t=><option key={t}>{t}</option>)}</select></FF>
          <FF label="Cylindrée"><input className="f" value={form.engine_size} onChange={set("engine_size")} placeholder="1499cc"/></FF>
          <FF label="Nb. Portes"><input className="f" type="number" value={form.doors} onChange={set("doors")} placeholder="5"/></FF>
        </div>
      </Sec>
      <Sec title="Photos"><PhotoGrid previews={previews} onAdd={addPhoto} onRemove={removePhoto}/></Sec>
      <Sec title="Équipements">
        <div className="eq-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:6}}>
          {Object.entries(EQUIPMENT_LABELS).map(([key,label])=>(
            <label key={key} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 11px",borderRadius:5,cursor:"pointer",background:eq[key]?"#f0fdf4":"#fff",border:"1px solid "+(eq[key]?"#a7f3d0":"#ddd"),transition:"all .15s"}}>
              <input type="checkbox" checked={eq[key]||false} onChange={()=>setEq(e=>({...e,[key]:!e[key]}))} style={{accentColor:"#d36135",width:13,height:13}}/>
              <span style={{fontSize:11,fontWeight:700,color:eq[key]?"#1c1c1c":"#9a9a9a"}}>{label}</span>
            </label>
          ))}
        </div>
      </Sec>
      <Sec title="Description"><textarea className="f" value={form.description} onChange={set("description")} rows={4} style={{resize:"vertical"}} placeholder="Description, état, remarques..."/></Sec>
      <div style={{display:"flex",gap:8}}>
        <button className="btn-red" onClick={()=>onSubmit(form,eq,newFiles,allPreviews)} disabled={loading} style={{flex:1,justifyContent:"center",padding:12,fontSize:14}}>{loading?"⏳ Enregistrement...":submitLabel}</button>
        <button className="btn-out" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
};

const AddCarPage = ({dealers, settings, setPage, onAdd, showToast}) => {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (form, eq, files) => {
    if (!form.dealer_id) return showToast("Sélectionnez un concessionnaire","error");
    setLoading(true);
    try {
      const data = {
        ...form,
        year: parseInt(form.year)||null,
        mileage: parseInt(form.mileage)||null,
        price_fob: parseFloat(form.price_fob)||null,
        price_usd: form.price_fob && settings?.shipment_fee_usd !== undefined
          ? (parseFloat(form.price_fob)||0) + (parseFloat(settings.shipment_fee_usd)||0)
          : parseFloat(form.price_fob)||null,
        price_currency: 'USD',
        price_cny: null,
        doors: parseInt(form.doors)||null,
        photos: [],
      };
      delete data._existingPhotos;
      const newCar = await createCar(data, eq);
      let photoUrls = [];
      for (const file of files) {
        try { const url = await uploadCarPhoto(newCar.id, file); if (url) photoUrls.push(url); } catch(_) {}
      }
      if (photoUrls.length) await updateCar(newCar.id, {photos: photoUrls});
      const dealerObj = dealers.find(d => String(d.id) === String(form.dealer_id)) || null;
      onAdd({...newCar, photos: photoUrls, car_equipment: [eq], dealers: dealerObj});
      showToast("Voiture ajoutée !", "success");
      setPage("home");
    } catch(e) { showToast("Erreur: " + e.message, "error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:800,margin:"0 auto"}}>
      <button className="btn-out" onClick={()=>setPage("home")} style={{marginBottom:14,fontSize:12}}>← Retour</button>
      <h1 style={{fontSize:24,fontWeight:900,marginBottom:18}}>Ajouter une <span style={{color:"#d36135"}}>Voiture</span></h1>
      <CarForm initial={{...EMPTY_CAR,_existingPhotos:[]}} initialEq={{...EMPTY_EQ}} dealers={dealers} settings={settings} onSubmit={handleSubmit} onCancel={()=>setPage("home")} submitLabel="✓ Enregistrer" loading={loading}/>
    </div>
  );
};

const CarDetailPage = ({car, settings, setPage, onDelete, onUpdate, showToast, dealers}) => {
  const [activePhoto, setActivePhoto] = useState(0);
  const [editing, setEditing] = useState(false);
  if (editing) return <EditCarPage car={car} settings={settings} setPage={setPage} dealers={dealers} onUpdate={u=>{onUpdate(u);setEditing(false);}} showToast={showToast} onCancel={()=>setEditing(false)}/>;
  const dealer=car.dealers; const eq=car.car_equipment?.[0]||{}; const photos=car.photos||[];
  const dzd = calcDZD(car.price_cny, settings, car.price_fob||car.price_usd, 'USD');
  const specs=[{l:"Marque",v:car.brand},{l:"Modèle",v:car.model},{l:"Année",v:car.year},{l:"Version",v:car.trim},{l:"Carrosserie",v:car.body_type},{l:"Couleur",v:car.color},{l:"Origine",v:car.origin==="imported"?"Importé":"Local"},{l:"Kilométrage",v:car.mileage?fmt(car.mileage)+" km":null},{l:"Carburant",v:car.fuel_type},{l:"Transmission",v:car.transmission},{l:"Cylindrée",v:car.engine_size},{l:"Portes",v:car.doors}].filter(s=>s.v);
  return (
    <div style={{background:"#f2f2f2",minHeight:"100vh",paddingBottom:60}}>
      <div style={{background:"#1c1c1c",padding:"7px 24px",marginTop:86,display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#888"}}>
        <span onClick={()=>setPage("home")} style={{color:"#d36135",cursor:"pointer",fontWeight:700}}>Accueil</span>
        <span>›</span><span style={{color:"#ccc",fontWeight:600}}>{car.brand} {car.model} {car.year}</span>
      </div>
      <div className="detail-grid" style={{maxWidth:1260,margin:"0 auto",padding:"18px 20px",display:"grid",gridTemplateColumns:"1fr 310px",gap:16,alignItems:"start"}}>
        <div>
          <div className="card" style={{overflow:"hidden",marginBottom:12}}>
            <div style={{height:520,background:"#f0f0f0",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {photos.length>0?<img src={photos[activePhoto]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<CarSVG size={200}/>}
              {photos.length>1&&(
                <>
                  <button onClick={e=>{e.stopPropagation();setActivePhoto(p=>(p-1+photos.length)%photos.length);}} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.55)",color:"#fff",border:"none",borderRadius:"50%",width:40,height:40,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                  <button onClick={e=>{e.stopPropagation();setActivePhoto(p=>(p+1)%photos.length);}} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.55)",color:"#fff",border:"none",borderRadius:"50%",width:40,height:40,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
                </>
              )}
              <div style={{position:"absolute",top:12,left:12,display:"flex",gap:5}}>
                <STag status={car.status}/><CTag condition={car.condition}/>{car.negotiable&&<span className="tag tgr">🏷️ Négociable</span>}
              </div>
            </div>
            {photos.length>1&&(
              <div style={{display:"flex",gap:6,padding:"10px 12px",background:"#f5f5f5",borderTop:"1px solid #e5e5e5",overflowX:"auto"}}>
                {photos.map((src,i)=>(
                  <div key={i} onClick={()=>setActivePhoto(i)} style={{width:88,height:62,flexShrink:0,borderRadius:6,overflow:"hidden",cursor:"pointer",border:"2px solid "+(activePhoto===i?"#d36135":"transparent"),transition:"border .15s"}}>
                    <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card" style={{padding:18,marginBottom:12}}>
            <h3 style={{fontSize:16,fontWeight:800,marginBottom:12,paddingBottom:8,borderBottom:"2px solid #e5e5e5"}}>Caractéristiques</h3>
            <div className="specs-grid3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {specs.map(s=><div key={s.l} style={{background:"#f2f2f2",borderRadius:6,padding:"8px 12px"}}><div style={{fontSize:9,color:"#9a9a9a",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{s.l}</div><div style={{fontSize:13,fontWeight:700}}>{s.v}</div></div>)}
            </div>
          </div>
          <div className="card" style={{padding:18,marginBottom:12}}>
            <h3 style={{fontSize:16,fontWeight:800,marginBottom:12,paddingBottom:8,borderBottom:"2px solid #e5e5e5"}}>Équipements</h3>
            <div className="eq-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:6}}>
              {Object.entries(EQUIPMENT_LABELS).map(([key,label])=>{const has=eq[key];return(
                <div key={key} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:5,background:has?"#f0fdf4":"#f9f9f9",border:"1px solid "+(has?"#a7f3d0":"#e5e5e5"),opacity:has?1:.55}}>
                  <span style={{fontSize:12}}>{has?"✅":"⬜"}</span><span style={{fontSize:11,fontWeight:700,color:has?"#1c1c1c":"#9a9a9a"}}>{label}</span>
                </div>
              );})}
            </div>
          </div>
          {car.description&&<div className="card" style={{padding:18}}><h3 style={{fontSize:16,fontWeight:800,marginBottom:10,paddingBottom:8,borderBottom:"2px solid #e5e5e5"}}>Description</h3><p style={{color:"#555",lineHeight:1.75,fontSize:13}}>{car.description}</p></div>}
        </div>
        <div className="sticky-sidebar" style={{display:"flex",flexDirection:"column",gap:12,position:"sticky",top:100}}>
          <div className="card" style={{padding:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:42,height:42,background:"#f2f2f2",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><BrandLogo brand={car.brand} size={34}/></div>
              <div><h1 style={{fontSize:21,fontWeight:900,lineHeight:1.1}}>{car.year} {car.brand} {car.model}</h1>{car.trim&&<p style={{color:"#9a9a9a",fontSize:11,fontWeight:600}}>{car.trim}</p>}</div>
            </div>
            {car.price_fob&&(
              <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"10px 14px",marginBottom:8}}>
                <div style={{fontSize:9,color:"#0369a1",fontWeight:700,letterSpacing:".08em",marginBottom:2}}>PRIX FOB</div>
                <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:22,color:"#0369a1",lineHeight:1}}>${new Intl.NumberFormat("fr-DZ").format(car.price_fob)}</div>
              </div>
            )}
            {(()=>{
              const _fob  = parseFloat(car.price_fob)||0;
              const _ship = parseFloat(settings?.shipment_fee_usd)||0;
              const _tot  = _fob > 0 ? _fob + _ship : 0;
              return _tot > 0 ? (
                <div style={{background:"#f2f2f2",borderRadius:8,padding:"11px 14px",marginBottom:8,borderLeft:"4px solid #d36135"}}>
                  <div style={{fontSize:9,color:"#9a9a9a",fontWeight:700,letterSpacing:".1em",marginBottom:2}}>
                    PRIX TOTAL (FOB ${new Intl.NumberFormat("fr-DZ").format(_fob)} + Transport ${_ship})
                  </div>
                  <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:28,color:"#d36135",lineHeight:1}}>
                    ${new Intl.NumberFormat("fr-DZ").format(Math.round(_tot))}
                  </div>
                </div>
              ) : null;
            })()}
            {dzd&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:9,color:"#92400e",fontWeight:700,letterSpacing:".08em",marginBottom:2}}>ESTIMATION DZD</div><div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:20,color:"#92400e"}}>{fmt(dzd)} DZD</div><div style={{fontSize:9,color:"#b45309",marginTop:2}}>Transport · ${settings?.shipment_fee_usd} USD</div></div>}
            <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}><STag status={car.status}/><CTag condition={car.condition}/>{car.negotiable&&<span className="tag tgr">🏷️ Négociable</span>}</div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-out" style={{flex:1,justifyContent:"center",fontSize:12}} onClick={()=>setEditing(true)}>✏️ Modifier</button>
              <button className="btn-del" onClick={()=>onDelete(car.id)} style={{fontSize:12}}>🗑️</button>
            </div>
          </div>
          {dealer&&<div className="card" style={{padding:16}}>
            <div style={{fontSize:9,color:"#9a9a9a",fontWeight:700,letterSpacing:".1em",marginBottom:10,textTransform:"uppercase"}}>Concessionnaire</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:38,height:38,borderRadius:8,background:"#f2f2f2",border:"1px solid #e5e5e5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🏢</div><div style={{fontFamily:"'Barlow Condensed'",fontWeight:800,fontSize:15}}>{dealer.name}</div></div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {dealer.mobile&&<div style={{display:"flex",gap:7,fontSize:12}}>📞 <span style={{color:"#555"}}>{dealer.mobile}</span></div>}
              {dealer.email&&<div style={{display:"flex",gap:7,fontSize:12}}>✉️ <span style={{color:"#555"}}>{dealer.email}</span></div>}
              {dealer.google_maps_link&&<a href={dealer.google_maps_link} target="_blank" rel="noreferrer" style={{display:"flex",gap:7,fontSize:12,color:"#d36135",fontWeight:600}}>🗺️ Google Maps</a>}
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
};

const EditCarPage = ({car, settings, setPage, onUpdate, showToast, onCancel, dealers}) => {
  const [loading, setLoading] = useState(false);
  const initialForm = {
    _existingPhotos: car.photos||[],
    price_fob: car.price_fob||"",
    dealer_id: car.dealer_id||"",
    brand: car.brand||"", model: car.model||"", year: car.year||"",
    trim: car.trim||"", body_type: car.body_type||"",
    condition: car.condition||"used", status: car.status||"available",
    mileage: car.mileage||"", origin: car.origin||"imported",
    price_cny: car.price_cny||"", negotiable: car.negotiable||false,
    fuel_type: car.fuel_type||"", transmission: car.transmission||"",
    engine_size: car.engine_size||"", color: car.color||"",
    doors: car.doors||"", description: car.description||"",
  };
  const initialEq = {...EMPTY_EQ, ...Object.fromEntries(Object.keys(EMPTY_EQ).map(k=>[k, car.car_equipment?.[0]?.[k]??false]))};

  const handleSubmit = async (form, eq, newFiles, allPreviews) => {
    setLoading(true);
    try {
      const data = {...form};
      delete data._existingPhotos;
      data.year = parseInt(data.year)||null;
      data.mileage = parseInt(data.mileage)||null;
      data.price_fob = parseFloat(data.price_fob)||null;
      data.price_usd = data.price_fob && settings?.shipment_fee_usd !== undefined
        ? (data.price_fob) + (parseFloat(settings.shipment_fee_usd)||0)
        : data.price_fob||null;
      data.price_cny = null;
      data.price_currency = 'USD';
      data.doors = parseInt(data.doors)||null;
      const existingUrls = allPreviews.filter(p => typeof p==="string" && p.startsWith("http"));
      let newUrls = [];
      for (const file of newFiles) {
        try { const url = await uploadCarPhoto(car.id, file); if (url) newUrls.push(url); } catch(_) {}
      }
      const allPhotos = [...existingUrls, ...newUrls];
      await updateCar(car.id, {...data, photos: allPhotos}, eq);
      const dealerObj = dealers.find(d => String(d.id) === String(data.dealer_id)) || car.dealers || null;
      onUpdate({...car, ...data, photos: allPhotos, car_equipment: [eq], dealers: dealerObj});
      showToast("Voiture modifiée !", "success");
    } catch(e) { showToast("Erreur: " + e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:800,margin:"0 auto"}}>
      <button className="btn-out" onClick={onCancel} style={{marginBottom:14,fontSize:12}}>← Annuler</button>
      <h1 style={{fontSize:24,fontWeight:900,marginBottom:18}}>Modifier <span style={{color:"#d36135"}}>{car.brand} {car.model}</span></h1>
      <CarForm initial={initialForm} initialEq={initialEq} dealers={dealers} settings={settings}
        onSubmit={handleSubmit} onCancel={onCancel} submitLabel="✓ Sauvegarder" loading={loading}/>
    </div>
  );
};

const DealersPage = ({dealers, cars, loading, setPage, setSelectedDealer, onDeleteDealer, showToast}) => {
  const [dealerSearch, setDealerSearch] = useState("");
  const filteredDealers = dealerSearch.trim()
    ? dealers.filter(d => (d.name+' '+(d.email||'')+' '+(d.mobile||'')+' '+(d.notes||'')).toLowerCase().includes(dealerSearch.toLowerCase()))
    : dealers;
  return (
  <div className="page-wrap" style={{padding:"86px 20px 40px",maxWidth:1200,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14,flexWrap:"wrap",gap:10}}>
      <div><h1 style={{fontSize:26,fontWeight:900}}>Concessionnaires</h1><p style={{color:"#9a9a9a",fontSize:13}}>{filteredDealers.length} / {dealers.length} partenaire{dealers.length!==1?"s":""}</p></div>
      <button className="btn-red" onClick={()=>setPage("add-dealer")}>+ Ajouter</button>
    </div>
    <div style={{position:"relative",marginBottom:16,maxWidth:420}}>
      <input className="f" placeholder="🔍  Rechercher un concessionnaire..." value={dealerSearch} onChange={e=>setDealerSearch(e.target.value)}
        style={{paddingRight:dealerSearch?36:16,fontSize:13,borderRadius:20}}/>
      {dealerSearch&&<button onClick={()=>setDealerSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#9a9a9a",fontSize:13,cursor:"pointer"}}>✕</button>}
    </div>
    {loading?<Spinner/>:filteredDealers.length===0?(
      <div className="card" style={{textAlign:"center",padding:40,color:"#9a9a9a"}}><div style={{fontSize:32,marginBottom:8}}>🔍</div><p style={{fontWeight:700}}>Aucun concessionnaire trouvé</p></div>
    ):(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
        {filteredDealers.map(d=>{
          const dc=cars.filter(c=>c.dealer_id===d.id);
          const avail=dc.filter(c=>c.status==="available").length;
          return (
            <div key={d.id} className="card" style={{padding:18,transition:"all .2s"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10,cursor:"pointer"}}
                onClick={()=>{setSelectedDealer(d);setPage("dealer-detail");}}>
                <div style={{width:46,height:46,borderRadius:8,background:"#f2f2f2",border:"1px solid #e5e5e5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>🏢</div>
                <div style={{flex:1,minWidth:0}}>
                  <h3 style={{fontSize:15,fontWeight:800,marginBottom:2}}>{d.name}</h3>
                  {d.email&&<p style={{fontSize:11,color:"#9a9a9a"}}>{d.email}</p>}
                  {d.mobile&&<p style={{fontSize:11,color:"#9a9a9a"}}>{d.mobile}</p>}
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                <span className="tag tb">{dc.length} voiture{dc.length!==1?"s":""}</span>
                {avail>0&&<span className="tag tg">{avail} disponible{avail!==1?"s":""}</span>}
              </div>
              {d.notes&&<p style={{fontSize:11,color:"#9a9a9a",marginBottom:10,lineHeight:1.5,borderTop:"1px solid #e5e5e5",paddingTop:9}}>{d.notes}</p>}
              <div style={{display:"flex",gap:6,borderTop:"1px solid #f0f0f0",paddingTop:10}}>
                <button className="btn-out" style={{flex:1,justifyContent:"center",fontSize:11}} onClick={()=>{setSelectedDealer(d);setPage("edit-dealer");}}>✏️ Modifier</button>
                <button className="btn-del" style={{fontSize:11}} onClick={()=>onDeleteDealer(d.id)}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
  );
};

const DealerDetailPage = ({dealer, cars, settings, setPage, setSelectedCar, setSelectedDealer, onDeleteDealer, setCatalogueCar}) => {
  const dc=cars.filter(c=>c.dealer_id===dealer.id);
  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:1200,margin:"0 auto"}}>
      <button className="btn-out" onClick={()=>setPage("dealers")} style={{marginBottom:12,fontSize:12}}>← Retour</button>
      <div className="card" style={{padding:20,marginBottom:16,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:14,alignItems:"flex-start",flex:1,minWidth:0}}>
          <div style={{width:56,height:56,borderRadius:10,background:"#f2f2f2",border:"1px solid #e5e5e5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🏢</div>
          <div>
            <h1 style={{fontSize:22,fontWeight:900,marginBottom:5}}>{dealer.name}</h1>
            <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
              {dealer.mobile&&<span style={{fontSize:12,color:"#555"}}>📞 {dealer.mobile}</span>}
              {dealer.email&&<span style={{fontSize:12,color:"#555"}}>✉️ {dealer.email}</span>}
              {dealer.website&&<a href={dealer.website} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#d36135",fontWeight:600}}>🌐 Site web</a>}
              {dealer.google_maps_link&&<a href={dealer.google_maps_link} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#d36135",fontWeight:600}}>🗺️ Maps</a>}
            </div>
            {dealer.notes&&<p style={{fontSize:12,color:"#9a9a9a",marginTop:5}}>{dealer.notes}</p>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <button className="btn-out" style={{fontSize:12}} onClick={()=>{setSelectedDealer(dealer);setPage("edit-dealer");}}>✏️ Modifier</button>
          <button className="btn-del" style={{fontSize:12}} onClick={()=>onDeleteDealer(dealer.id,true)}>🗑️ Supprimer</button>
        </div>
      </div>
      <h2 style={{fontSize:17,fontWeight:800,marginBottom:12}}>Véhicules <span style={{color:"#9a9a9a",fontWeight:500,fontSize:13}}>({dc.length})</span></h2>
      {dc.length===0
        ?<div className="card" style={{textAlign:"center",padding:48,color:"#9a9a9a"}}><div style={{fontSize:30,marginBottom:8}}>🚗</div><p style={{fontWeight:700}}>Aucun véhicule pour ce concessionnaire</p></div>
        :dc.map(car=><CarCard key={car.id} car={car} settings={settings} onClick={()=>{setSelectedCar(car);setPage("car-detail");}} onCatalogue={car=>{setCatalogueCar(car);setPage("catalogue");}}/>)
      }
    </div>
  );
};

const AddDealerPage = ({setPage, onAdd, showToast}) => {
  const [form, setForm]=useState({name:"",mobile:"",email:"",google_maps_link:"",website:"",notes:""});
  const [loading, setLoading]=useState(false);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const submit=async()=>{
    if(!form.name.trim())return showToast("Le nom est obligatoire","error");
    setLoading(true);
    try{const d=await createDealer(form);onAdd(d);showToast("Concessionnaire ajouté !","success");setPage("dealers");}
    catch(e){showToast("Erreur: "+e.message,"error");}
    finally{setLoading(false);}
  };
  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:600,margin:"0 auto"}}>
      <button className="btn-out" onClick={()=>setPage("dealers")} style={{marginBottom:12,fontSize:12}}>← Retour</button>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:16}}>Nouveau <span style={{color:"#d36135"}}>Concessionnaire</span></h1>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Sec title="Informations">
          <FF label="Nom" required><input className="f" value={form.name} onChange={set("name")} placeholder="Ahmed Auto Alger"/></FF>
          <div className="dealer-form-row form-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FF label="Téléphone"><input className="f" value={form.mobile} onChange={set("mobile")} placeholder="+213 770..."/></FF>
            <FF label="Email"><input className="f" type="email" value={form.email} onChange={set("email")} placeholder="contact@..."/></FF>
          </div>
          <FF label="Lien Google Maps"><input className="f" value={form.google_maps_link} onChange={set("google_maps_link")} placeholder="https://maps.google.com/..."/></FF>
          <FF label="Site Web"><input className="f" value={form.website} onChange={set("website")} placeholder="https://..."/></FF>
          <FF label="Notes"><textarea className="f" value={form.notes} onChange={set("notes")} rows={3} style={{resize:"vertical"}}/></FF>
        </Sec>
        <div style={{display:"flex",gap:8}}>
          <button className="btn-red" onClick={submit} disabled={loading} style={{flex:1,justifyContent:"center",padding:11,fontSize:14}}>{loading?"⏳ Enregistrement...":"✓ Enregistrer"}</button>
          <button className="btn-out" onClick={()=>setPage("dealers")}>Annuler</button>
        </div>
      </div>
    </div>
  );
};

const EditDealerPage = ({dealer, setPage, onUpdate, showToast}) => {
  const [form, setForm] = useState({
    name: dealer.name||"", mobile: dealer.mobile||"",
    email: dealer.email||"", google_maps_link: dealer.google_maps_link||"",
    website: dealer.website||"", notes: dealer.notes||"",
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const submit = async () => {
    if (!form.name.trim()) return showToast("Le nom est obligatoire","error");
    setLoading(true);
    try {
      const updated = await updateDealer(dealer.id, form);
      onUpdate(updated);
      showToast("Concessionnaire modifié !","success");
      setPage("dealers");
    } catch(e) { showToast("Erreur: "+e.message,"error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:600,margin:"0 auto"}}>
      <button className="btn-out" onClick={()=>setPage("dealers")} style={{marginBottom:12,fontSize:12}}>← Retour</button>
      <h1 style={{fontSize:22,fontWeight:900,marginBottom:16}}>Modifier <span style={{color:"#d36135"}}>{dealer.name}</span></h1>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Sec title="Informations">
          <FF label="Nom" required><input className="f" value={form.name} onChange={set("name")} placeholder="Ahmed Auto Alger"/></FF>
          <div className="dealer-form-row form-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FF label="Téléphone"><input className="f" value={form.mobile} onChange={set("mobile")} placeholder="+213 770..."/></FF>
            <FF label="Email"><input className="f" type="email" value={form.email} onChange={set("email")} placeholder="contact@..."/></FF>
          </div>
          <FF label="Lien Google Maps"><input className="f" value={form.google_maps_link} onChange={set("google_maps_link")} placeholder="https://maps.google.com/..."/></FF>
          <FF label="Site Web"><input className="f" value={form.website} onChange={set("website")} placeholder="https://..."/></FF>
          <FF label="Notes"><textarea className="f" value={form.notes} onChange={set("notes")} rows={3} style={{resize:"vertical"}}/></FF>
        </Sec>
        <div style={{display:"flex",gap:8}}>
          <button className="btn-red" onClick={submit} disabled={loading} style={{flex:1,justifyContent:"center",padding:11,fontSize:14}}>{loading?"⏳ Enregistrement...":"✓ Sauvegarder"}</button>
          <button className="btn-out" onClick={()=>setPage("dealers")}>Annuler</button>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = ({settings, setSettings, showToast}) => {
  const [form, setForm] = useState({
    cny_usd_rate:     settings?.cny_usd_rate     || '',
    usd_dzd_rate:     settings?.usd_dzd_rate     || '',
    shipment_fee_usd: settings?.shipment_fee_usd || '',
    margin_dzd:       settings?.margin_dzd       || '',
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const save = async () => {
    setSaving(true);
    try {
      const u = await updateSettings({
        cny_usd_rate:     parseFloat(form.cny_usd_rate)     || 0,
        usd_dzd_rate:     parseFloat(form.usd_dzd_rate)     || 0,
        shipment_fee_usd: parseFloat(form.shipment_fee_usd) || 0,
        margin_dzd:       parseFloat(form.margin_dzd)       || 0,
        rates_updated_at: new Date().toISOString(),
      });
      setSettings(u);
      showToast("Paramètres sauvegardés !","success");
    } catch(e) { showToast("Erreur: "+e.message,"error"); }
    finally { setSaving(false); }
  };

  const margin = parseFloat(form.margin_dzd)||0;
  const previewCNY = form.cny_usd_rate && form.usd_dzd_rate
    ? Math.round((100000 * parseFloat(form.cny_usd_rate) + parseFloat(form.shipment_fee_usd||0)) * parseFloat(form.usd_dzd_rate) + margin)
    : null;
  const previewUSD = form.usd_dzd_rate
    ? Math.round((20000 + parseFloat(form.shipment_fee_usd||0)) * parseFloat(form.usd_dzd_rate) + margin)
    : null;

  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:560,margin:"0 auto"}}>
      <h1 style={{fontSize:24,fontWeight:900,marginBottom:18}}>⚙️ Paramètres</h1>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Sec title="Taux de change — saisie manuelle">
          <p style={{fontSize:12,color:"#9a9a9a",marginBottom:4}}>Définissez vos propres taux. Ces valeurs sont utilisées pour toutes les conversions de prix.</p>
          <div className="settings-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FF label="1 Yuan (CNY) = ? Dollar (USD)">
              <input className="f" type="number" step="0.000001" value={form.cny_usd_rate} onChange={set("cny_usd_rate")} placeholder="ex: 0.138000"/>
            </FF>
            <FF label="1 Dollar (USD) = ? Dinar (DZD)">
              <input className="f" type="number" step="0.0001" value={form.usd_dzd_rate} onChange={set("usd_dzd_rate")} placeholder="ex: 134.5000"/>
            </FF>
          </div>
        </Sec>
        <Sec title="Frais de transport (USD)">
          <p style={{fontSize:12,color:"#9a9a9a"}}>Montant fixe USD ajouté à chaque véhicule pour le calcul DZD.</p>
          <FF label="Frais de transport ($)">
            <input className="f" type="number" value={form.shipment_fee_usd} onChange={set("shipment_fee_usd")} placeholder="ex: 1200"/>
          </FF>
        </Sec>
        <Sec title="Marge bénéficiaire (DZD)">
          <p style={{fontSize:12,color:"#9a9a9a"}}>Montant fixe en DZD ajouté au prix final de <b>chaque véhicule</b> après conversion.</p>
          <FF label="Marge (DZD)">
            <input className="f" type="number" value={form.margin_dzd} onChange={set("margin_dzd")} placeholder="ex: 150000"/>
          </FF>
          {form.margin_dzd&&parseFloat(form.margin_dzd)>0&&(
            <div style={{marginTop:6,fontSize:12,color:"#9a9a9a",background:"#f8f8f8",borderRadius:6,padding:"7px 10px",border:"1px solid #e5e5e5"}}>
              + {fmt(parseFloat(form.margin_dzd))} DZD ajoutés à chaque prix affiché
            </div>
          )}
        </Sec>
        {(previewCNY||previewUSD)&&(
          <Sec title="Aperçu des formules">
            <div className="settings-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {previewCNY&&(
                <div style={{background:"#f8f8f8",borderRadius:8,padding:"12px 14px",border:"1px solid #e5e5e5"}}>
                  <div style={{fontSize:10,color:"#9a9a9a",fontWeight:700,marginBottom:4}}>¥100 000 CNY →</div>
                  <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:18,color:"#d36135"}}>{fmt(previewCNY)} DZD</div>
                  <code style={{fontSize:9,color:"#9a9a9a",display:"block",marginTop:4}}>
                    (100K × {parseFloat(form.cny_usd_rate)||0} + {parseFloat(form.shipment_fee_usd)||0}$) × {parseFloat(form.usd_dzd_rate)||0}{margin>0?` + ${fmt(margin)} DZD`:''}
                  </code>
                </div>
              )}
              {previewUSD&&(
                <div style={{background:"#f8f8f8",borderRadius:8,padding:"12px 14px",border:"1px solid #e5e5e5"}}>
                  <div style={{fontSize:10,color:"#9a9a9a",fontWeight:700,marginBottom:4}}>$20 000 USD →</div>
                  <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:18,color:"#d36135"}}>{fmt(previewUSD)} DZD</div>
                  <code style={{fontSize:9,color:"#9a9a9a",display:"block",marginTop:4}}>
                    (20K + {parseFloat(form.shipment_fee_usd)||0}$) × {parseFloat(form.usd_dzd_rate)||0}{margin>0?` + ${fmt(margin)} DZD`:''}
                  </code>
                </div>
              )}
            </div>
          </Sec>
        )}
        <button className="btn-red" onClick={save} disabled={saving} style={{padding:"12px",fontSize:14,justifyContent:"center"}}>
          {saving?"⏳ Sauvegarde...":"💾 Sauvegarder les paramètres"}
        </button>
        {settings?.rates_updated_at&&(
          <p style={{fontSize:11,color:"#9a9a9a",textAlign:"center"}}>Dernière mise à jour : {new Date(settings.rates_updated_at).toLocaleString("fr-DZ")}</p>
        )}
      </div>
    </div>
  );
};

// ============================================================
// EXPORT PAGE
// ============================================================
const EXPORT_FIELDS = [
  {k:"brand",l:"Marque"},{k:"model",l:"Modèle"},{k:"year",l:"Année"},
  {k:"trim",l:"Version"},{k:"body_type",l:"Carrosserie"},{k:"condition",l:"Condition"},
  {k:"status",l:"Statut"},{k:"mileage",l:"Kilométrage"},{k:"origin",l:"Origine"},
  {k:"price_fob",l:"Prix FOB"},{k:"total_usd",l:"Total USD (+ transport)"},{k:"total_dzd",l:"Total DZD"},{k:"fuel_type",l:"Carburant"},
  {k:"transmission",l:"Transmission"},{k:"engine_size",l:"Cylindrée"},
  {k:"color",l:"Couleur"},{k:"doors",l:"Portes"},{k:"negotiable",l:"Négociable"},
  {k:"dealers.name",l:"Concessionnaire"},
];
const GROUP_OPTIONS = [
  {k:"dealers.name",l:"Concessionnaire"},{k:"brand",l:"Marque"},{k:"brand_model",l:"Marque + Modèle"},
  {k:"model",l:"Modèle"},{k:"transmission",l:"Transmission"},{k:"status",l:"Statut"},
  {k:"condition",l:"Condition"},{k:"fuel_type",l:"Carburant"},{k:"body_type",l:"Carrosserie"},
  {k:"color",l:"Couleur"},{k:"origin",l:"Origine"},{k:"year",l:"Année"},
];
const SORT_OPTIONS = [
  {k:"price_fob",l:"Prix FOB"},{k:"total_usd",l:"Total USD"},{k:"total_dzd",l:"Total DZD"},
  {k:"year",l:"Année"},{k:"mileage",l:"Kilométrage"},{k:"brand",l:"Marque"},
  {k:"model",l:"Modèle"},{k:"dealers.name",l:"Concessionnaire"},
];

const fmtPDF = n => { if (n == null) return "-"; return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };

const getFieldVal = (car, key, settings=null) => {
  if (key === "brand_model") return (car.brand||"?") + " " + (car.model||"?");
  if (key === "dealers.name") return car.dealers?.name || "—";
  if (key === "total_usd") {
    const fob   = parseFloat(car.price_fob)||0;
    const ship  = parseFloat(settings?.shipment_fee_usd)||0;
    const total = fob > 0 ? fob + ship : 0;
    return total>0 ? "$ "+fmtPDF(total) : "—";
  }
  if (key === "total_dzd") {
    const dzd = calcDZD(null, settings, parseFloat(car.price_fob)||parseFloat(car.price_usd)||0, 'USD');
    return dzd ? fmtPDF(dzd)+" DZD" : "—";
  }
  const v = car[key];
  if (v === null || v === undefined || v === "") return "—";
  if (key === "negotiable") return v ? "Oui" : "Non";
  if (key === "mileage") return fmt(v) + " km";
  if (key === "condition") return v === "new" ? "Neuf" : "Occasion";
  if (key === "status") return {available:"Disponible",sold:"Vendu",reserved:"Réservé"}[v] || v;
  if (key === "origin") return v === "imported" ? "Importé" : "Local";
  if (key === "price_cny") return "¥ " + fmtPDF(v);
  if (key === "price_usd") return "$ " + fmtPDF(v);
  if (key === "price_fob") return "FOB $ " + fmtPDF(v);
  return String(v);
};

const MobileExportConfig = ({groupBy, setGroupBy, sortBy, setSortBy, sortDir, setSortDir, selFields, toggleField}) => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button className="btn-out" onClick={()=>setOpen(!open)} style={{fontSize:12}}>⚙️ Options</button>
      {open && (
        <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
          <div style={{background:"#fff",width:"100%",maxHeight:"80vh",overflowY:"auto",borderRadius:"16px 16px 0 0",padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{fontSize:15,fontWeight:800}}>Options d'export</span>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",fontSize:20,color:"#9a9a9a"}}>✕</button>
            </div>
            <div style={{marginBottom:14}}>
              <label className="lbl">Grouper par</label>
              <select className="f" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
                {GROUP_OPTIONS.map(o=><option key={o.k} value={o.k}>{o.l}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label className="lbl">Trier par</label>
              <select className="f" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{marginBottom:8}}>
                {SORT_OPTIONS.map(o=><option key={o.k} value={o.k}>{o.l}</option>)}
              </select>
              <div style={{display:"flex",gap:0,borderRadius:8,overflow:"hidden",border:"1.5px solid #ddd"}}>
                {[{v:"asc",l:"⬆ Croissant"},{v:"desc",l:"⬇ Décroissant"}].map(d=>(
                  <button key={d.v} onClick={()=>setSortDir(d.v)} style={{flex:1,padding:"8px 4px",fontSize:12,fontWeight:700,border:"none",background:sortDir===d.v?"#1c1c1c":"#fff",color:sortDir===d.v?"#fff":"#555",cursor:"pointer"}}>{d.l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="lbl" style={{marginBottom:8}}>Colonnes PDF</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {EXPORT_FIELDS.map(f=>(
                  <label key={f.k} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600,cursor:"pointer",padding:"5px 8px",borderRadius:5,background:selFields.includes(f.k)?"#f0fdf4":"#f9f9f9",border:"1px solid "+(selFields.includes(f.k)?"#a7f3d0":"#e5e5e5")}}>
                    <input type="checkbox" checked={selFields.includes(f.k)} onChange={()=>toggleField(f.k)} style={{accentColor:"#d36135",width:13,height:13}}/>{f.l}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ExportPage = ({cars, dealers, settings, setPage, showToast}) => {
  const BASE_URL = window.location.origin;
  const [filters, setFilters]   = useState({...EMPTY_FILTERS});
  const [search,  setSearch2]   = useState("");
  const [groupBy,   setGroupBy]   = useState("dealers.name");
  const [sortBy,    setSortBy]    = useState("price_cny");
  const [sortDir,   setSortDir]   = useState("asc");
  const [selFields, setSelFields] = useState(["brand","model","year","trim","transmission","status","price_fob","total_usd","total_dzd"]);
  const [printing,  setPrinting]  = useState(false);

  const toggleField = k => setSelFields(f => f.includes(k) ? f.filter(x=>x!==k) : [...f,k]);

  const filtered = cars.filter(c => {
    const q = search.toLowerCase();
    if (q && !((c.brand+" "+c.model+" "+c.year+" "+(c.trim||"")+" "+(c.dealers?.name||"")).toLowerCase().includes(q))) return false;
    if (filters.brand     && c.brand!==filters.brand) return false;
    if (filters.model     && c.model!==filters.model) return false;
    if (filters.fuel      && c.fuel_type!==filters.fuel) return false;
    if (filters.transmission && c.transmission!==filters.transmission) return false;
    if (filters.condition && c.condition!==filters.condition) return false;
    if (filters.status    && c.status!==filters.status) return false;
    if (filters.color     && c.color!==filters.color) return false;
    if (filters.body_type && c.body_type!==filters.body_type) return false;
    if (filters.yearMin   && c.year < parseInt(filters.yearMin)) return false;
    if (filters.yearMax   && c.year > parseInt(filters.yearMax)) return false;
    if ((filters.mileageMax||300000)<300000 && (c.mileage||0)>filters.mileageMax) return false;
    if ((filters.priceMax||500000)<500000   && c.price_currency!=="USD" && (c.price_cny||0)>filters.priceMax) return false;
    if ((filters.priceMaxUSD||50000)<50000  && (parseFloat(c.price_fob)||0)>filters.priceMaxUSD) return false;
    if (filters.equipment) for (const [k,v] of Object.entries(filters.equipment)) if (v && !c.car_equipment?.[0]?.[k]) return false;
    return true;
  });

  const getSortVal = (car, key) => {
    if (key === "dealers.name") return car.dealers?.name?.toLowerCase() || "";
    if (key === "total_usd") { const fob=parseFloat(car.price_fob)||0; const ship=parseFloat(settings?.shipment_fee_usd)||0; return fob>0?fob+ship:0; }
    if (key === "total_dzd") return calcDZD(car.price_cny, settings, car.price_fob||car.price_usd, 'USD') || 0;
    if (key === "price_fob") return parseFloat(car.price_fob)||0;
    const v = car[key];
    return typeof v === "string" ? v.toLowerCase() : (v ?? 0);
  };

  const grouped = React.useMemo(() => {
    const sorted = [...filtered].sort((a,b) => {
      const va = getSortVal(a, sortBy), vb = getSortVal(b, sortBy);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    const groups = {};
    sorted.forEach(car => {
      const gKey = getFieldVal(car, groupBy) || "Autres";
      if (!groups[gKey]) groups[gKey] = [];
      groups[gKey].push(car);
    });
    return Object.entries(groups).sort(([a],[b])=>a.localeCompare(b));
  }, [filtered, groupBy, sortBy, sortDir]);

  const totalCars = filtered.length;

  const exportPDF = async () => {
    setPrinting(true);
    try {
      if (!window.jspdf) {
        await new Promise((res, rej) => { const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      }
      if (!window.jspdf?.jsPDF?.prototype?.autoTable) {
        await new Promise((res, rej) => { const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      }
      const { jsPDF } = window.jspdf;
      const cols = selFields.map(k => EXPORT_FIELDS.find(f=>f.k===k)).filter(Boolean);
      const now  = new Date().toLocaleString("fr-DZ");
      const fileName = `elwarcha-export-${new Date().toISOString().slice(0,10)}.pdf`;
      const drawHeader = () => {
        doc.setFillColor(232, 0, 29); doc.rect(0, 0, 297, 1.5, 'F');
        doc.setTextColor(28,28,28); doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text('El Warcha Auto', 10, 11);
        doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(160,160,160); doc.text('IMPORT · VENTE · ALGERIE', 10, 16);
        const sortLabel = SORT_OPTIONS.find(s=>s.k===sortBy)?.l || '';
        const groupLabel = GROUP_OPTIONS.find(g=>g.k===groupBy)?.l || '';
        const meta = `${now}   ·   ${totalCars} vehicule${totalCars!==1?'s':''}   ·   Groupe: ${groupLabel}   ·   Tri: ${sortLabel} (${sortDir==='asc'?'croissant':'decroissant'})`;
        doc.setFontSize(6); doc.setTextColor(140,140,140); doc.text(meta, 289, 10, { align: 'right' });
      };
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      drawHeader();
      let startY = 24;
      grouped.forEach(([gName, gcars]) => {
        if (startY > 182) { doc.addPage(); drawHeader(); startY = 24; }
        doc.setFillColor(232,0,29); doc.rect(8, startY, 2.5, 7, 'F');
        doc.setTextColor(28,28,28); doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.text(gName, 13.5, startY+5);
        startY += 10;
        const head = [cols.map(c => c.l).concat('Lien')];
        const rowVals = gcars.map(car => {
          const params = new URLSearchParams();
          if (car.brand) params.set('brand', car.brand);
          if (car.model) params.set('model', car.model);
          if (car.year) params.set('year', String(car.year));
          if (car.dealers?.name) params.set('dealer', car.dealers.name);
          if (car.trim) params.set('trim', car.trim);
          if (car.color) params.set('color', car.color);
          const link = BASE_URL + '/?' + params.toString();
          return { cells: cols.map(col => getFieldVal(car, col.k, settings)), link };
        });
        const EVEN_BG=[255,255,255], ODD_BG=[244,246,250];
        const groups2 = [];
        let gIdx2 = 0;
        rowVals.forEach((row, ri) => {
          const newGroup = ri===0 || row.cells[0]!==rowVals[ri-1].cells[0] || row.cells[1]!==rowVals[ri-1].cells[1];
          if (newGroup) { groups2.push({start:ri,end:ri,bg:gIdx2++%2===0?EVEN_BG:ODD_BG}); }
          else { groups2[groups2.length-1].end = ri; }
        });
        const rowGroupInfo = rowVals.map((_,ri) => groups2.find(g => ri>=g.start && ri<=g.end));
        const showAt = cols.map((_,ci) => {
          const result = new Array(rowVals.length).fill(false);
          let spanStart = 0;
          for (let ri=0; ri<=rowVals.length; ri++) {
            const ended = ri===rowVals.length || rowVals[ri].cells[ci]!==rowVals[spanStart].cells[ci] || rowGroupInfo[ri]!==rowGroupInfo[spanStart];
            if (ended) { result[Math.floor((spanStart+ri-1)/2)] = true; spanStart = ri; }
          }
          return result;
        });
        const body = rowVals.map((row, ri) => {
          const grp=rowGroupInfo[ri], bg=grp.bg, isFirst=ri===grp.start, isLast=ri===grp.end, OUTER=[180,180,180];
          return row.cells.map((val,ci) => ({
            content: showAt[ci][ri] ? val : '',
            styles: { fillColor:bg, textColor:[30,30,30], valign:'middle', lineWidth:{top:isFirst?0.4:0,right:0.4,bottom:isLast?0.4:0,left:0.4}, lineColor:OUTER },
          })).concat({
            content:'Voir fiche',
            styles: { fillColor:bg, textColor:[210,0,20], fontStyle:'bold', fontSize:7, halign:'center', valign:'middle', lineWidth:{top:isFirst?0.4:0,right:0.4,bottom:isLast?0.4:0,left:0.4}, lineColor:OUTER },
            link: row.link,
          });
        });
        const colStyles = {}; colStyles[cols.length] = { cellWidth:20, halign:'center' };
        doc.autoTable({
          head, body, startY, theme:'plain',
          styles: { fontSize:7.5, cellPadding:{top:3,right:3,bottom:3,left:3}, overflow:'ellipsize', textColor:[30,30,30], lineWidth:0.25 },
          headStyles: { fillColor:[40,40,40], textColor:[255,255,255], fontStyle:'bold', fontSize:7, lineWidth:0 },
          columnStyles: colStyles, margin:{left:8,right:8}, tableLineColor:[200,200,200], tableLineWidth:0.3,
          didDrawCell: (data) => {
            if (data.section!=='body') return;
            const ri=data.row.index, ci=data.column.index;
            if (ci===cols.length && rowVals[ri]?.link) doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: rowVals[ri].link });
          },
        });
        startY = doc.lastAutoTable.finalY + 8;
      });
      const pageCount = doc.getNumberOfPages();
      for (let i=1; i<=pageCount; i++) {
        doc.setPage(i); doc.setFontSize(6.5); doc.setTextColor(170,170,170); doc.setFont('helvetica','normal');
        doc.text('El Warcha Auto', 8, 205.5); doc.text(`${i} / ${pageCount}`, 289, 205.5, { align:'right' });
      }
      doc.save(fileName);
    } catch(e) { showToast('Erreur export PDF: ' + e.message, 'error'); }
    finally { setPrinting(false); }
  };

  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:900}}>📄 Export PDF</h1>
          <p style={{color:"#9a9a9a",fontSize:13}}>{totalCars} véhicule{totalCars!==1?"s":""} sélectionné{totalCars!==1?"s":""}</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <MobileExportConfig groupBy={groupBy} setGroupBy={setGroupBy} sortBy={sortBy} setSortBy={setSortBy} sortDir={sortDir} setSortDir={setSortDir} selFields={selFields} toggleField={toggleField}/>
          <button className="btn-red" onClick={exportPDF} disabled={printing||totalCars===0} style={{fontSize:13,padding:"10px 24px"}}>
            {printing?"⏳ Génération...":"📥 Exporter PDF"}
          </button>
        </div>
      </div>
      <div className="export-grid" style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <SearchPanel filters={filters} setFilters={setFilters} cars={cars}/>
          <div className="card" style={{padding:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <input className="f" placeholder="🔍 Recherche rapide..." value={search} onChange={e=>setSearch2(e.target.value)} style={{fontSize:13}}/>
              {search&&<button className="btn-out" onClick={()=>setSearch2("")} style={{fontSize:11}}>✕</button>}
            </div>
          </div>
          <div className="card" style={{padding:14}}>
            <h3 style={{fontSize:13,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Aperçu du résultat</h3>
            {grouped.length===0
              ? <div style={{textAlign:"center",padding:40,color:"#9a9a9a"}}><div style={{fontSize:28,marginBottom:8}}>🔍</div><p>Aucun véhicule</p></div>
              : grouped.map(([gName, gcars])=>(
                <div key={gName} style={{marginBottom:12}}>
                  <div style={{background:"#1c1c1c",color:"#fff",padding:"5px 12px",borderRadius:"6px 6px 0 0",fontSize:12,fontWeight:700,display:"flex",justifyContent:"space-between"}}>
                    <span>{gName}</span><span style={{color:"#d36135"}}>{gcars.length} voiture{gcars.length!==1?"s":""}</span>
                  </div>
                  <div style={{border:"1px solid #e5e5e5",borderTop:"none",borderRadius:"0 0 6px 6px",overflow:"hidden"}}>
                    {gcars.map((car,i)=>(
                      <div key={car.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:i%2===0?"#fff":"#fafafa",fontSize:12,borderBottom:i<gcars.length-1?"1px solid #f0f0f0":"none"}}>
                        <span style={{fontWeight:700}}>{car.year} {car.brand} {car.model} {car.trim||""}</span>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <STag status={car.status}/>
                          <span style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:13,color:"#d36135"}}>
                            {car.price_currency==="USD"?("$"+new Intl.NumberFormat("fr-DZ").format(Math.round(car.price_usd||0))):fmtCNY(car.price_cny)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        <div className="sticky-sidebar" style={{display:"flex",flexDirection:"column",gap:12,position:"sticky",top:96}}>
          <div className="card" style={{padding:16}}>
            <h3 style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",marginBottom:12,paddingBottom:8,borderBottom:"1px solid #e5e5e5"}}>🗂 Grouper par</h3>
            <select className="f" value={groupBy} onChange={e=>setGroupBy(e.target.value)} style={{fontSize:13}}>
              {GROUP_OPTIONS.map(o=><option key={o.k} value={o.k}>{o.l}</option>)}
            </select>
          </div>
          <div className="card" style={{padding:16}}>
            <h3 style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",marginBottom:12,paddingBottom:8,borderBottom:"1px solid #e5e5e5"}}>↕ Trier par</h3>
            <select className="f" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{fontSize:13,marginBottom:8}}>
              {SORT_OPTIONS.map(o=><option key={o.k} value={o.k}>{o.l}</option>)}
            </select>
            <div style={{display:"flex",gap:0,borderRadius:8,overflow:"hidden",border:"1.5px solid #ddd"}}>
              {[{v:"asc",l:"⬆ Croissant"},{v:"desc",l:"⬇ Décroissant"}].map(d=>(
                <button key={d.v} onClick={()=>setSortDir(d.v)} style={{flex:1,padding:"7px 4px",fontSize:11,fontWeight:700,border:"none",background:sortDir===d.v?"#1c1c1c":"#fff",color:sortDir===d.v?"#fff":"#555",cursor:"pointer"}}>{d.l}</button>
              ))}
            </div>
          </div>
          <div className="card" style={{padding:16}}>
            <h3 style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",marginBottom:12,paddingBottom:8,borderBottom:"1px solid #e5e5e5"}}>📋 Colonnes dans le PDF</h3>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {EXPORT_FIELDS.map(f=>(
                <label key={f.k} style={{display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:600,cursor:"pointer",padding:"4px 6px",borderRadius:5,background:selFields.includes(f.k)?"#f0fdf4":"transparent",border:"1px solid "+(selFields.includes(f.k)?"#a7f3d0":"transparent")}}>
                  <input type="checkbox" checked={selFields.includes(f.k)} onChange={()=>toggleField(f.k)} style={{accentColor:"#d36135",width:13,height:13}}/>{f.l}
                </label>
              ))}
            </div>
            <p style={{fontSize:10,color:"#9a9a9a",marginTop:10}}>Une colonne "Lien" est toujours ajoutée automatiquement.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SQL GENERATOR PAGE
// ============================================================
const SQL_EQ_COLS = ['sun_roof','leather_seat','power_seat','seat_heating','seat_ventilation','alloy_wheel','led_lights','camera_360','adaptive_cruise','auto_ac','abs','driver_airbag','power_window','gps','bluetooth','keyless_entry','parking_sensors','start_stop','cd_dvd','tv'];

const sqlEsc = v => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g,"''") + "'";
};

const genUUIDv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random()*16|0;
  return (c==='x'?r:(r&0x3|0x8)).toString(16);
});

const buildCarSQL = (cars, dealerName, dealerUUID) => {
  const lines = [
    '-- ================================================================',
    `-- Dealer : ${dealerName}`,
    `-- UUID   : ${dealerUUID}`,
    `-- Cars   : ${cars.length} rows`,
    `-- Generated: ${new Date().toLocaleString('fr-DZ')}`,
    '-- ================================================================\n',
    'INSERT INTO dealers (id, name)',
    `VALUES (${sqlEsc(dealerUUID)}, ${sqlEsc(dealerName)})`,
    'ON CONFLICT (id) DO NOTHING;\n',
  ];
  cars.forEach((car, i) => {
    const cid = genUUIDv4();
    const cols = ['id','dealer_id','brand','model','year','trim','body_type','condition','status','origin','price_usd','price_currency','fuel_type','transmission'];
    const vals = [cid, dealerUUID, car.brand||'Autre', car.model||'', car.year||null, car.trim||null, car.body_type||'SUV','new','available','imported', car.price_usd||null,'USD', car.fuel_type||'Essence', car.transmission||null];
    if (car.description) { cols.push('description'); vals.push(car.description); }
    if (car.price_fob)   { cols.push('price_fob');   vals.push(car.price_fob); }
    if (car.engine_size) { cols.push('engine_size'); vals.push(car.engine_size); }
    if (car.color)       { cols.push('color');       vals.push(car.color); }
    if (car.doors)       { cols.push('doors');       vals.push(car.doors); }
    if (car.negotiable)  { cols.push('negotiable');  vals.push(true); }
    const eqVals = [cid, ...SQL_EQ_COLS.map(k => car.equipment?.[k] || false)];
    lines.push(`-- [${i+1}] ${car.brand||'?'} ${car.model||'?'} | ${car.trim||'—'} | ${car.color||'no color'} | $${car.price_usd||'?'}`);
    lines.push(`INSERT INTO cars (${cols.join(', ')})`);
    lines.push(`VALUES (${vals.map(sqlEsc).join(', ')});`);
    lines.push(`INSERT INTO car_equipment (car_id, ${SQL_EQ_COLS.join(', ')})`);
    lines.push(`VALUES (${eqVals.map(sqlEsc).join(', ')});\n`);
  });
  return lines.join('\n');
};

const SYSTEM_PROMPT = `You are a car database assistant for a platform managing car dealers importing cars to Algeria. Parse raw dealer price list text and return a JSON array of car objects.

Each object must have: brand, model, year (int or null), trim, body_type (one of: SUV/Berline/Hatchback/Coupé/Cabriolet/Wagon/Pickup/Monospace/Autre), price_usd (number), price_fob (number or null), fuel_type (Essence/Diesel/Hybride/Électrique/GPL), transmission (Manuelle/Automatique/CVT/DSG-DCT/PDK/Tiptronic/EDC/Autre), engine_size (string or null), color (one of: Noir/Blanc/Gris/Argent/Bleu/Rouge/Vert/Orange/Beige/Marron/Or/Rose/Violet — or null), doors (int or null), negotiable (false), description (brief notes), equipment (object with booleans: sun_roof/leather_seat/alloy_wheel/abs/driver_airbag/camera_360/adaptive_cruise/auto_ac/power_window/power_seat/seat_heating/seat_ventilation/tv/cd_dvd).

CRITICAL RULES:
1. white/gray → TWO objects: color "Blanc" + color "Gris" (same price)
2. black/silver → TWO objects: color "Noir" + color "Argent" (same price)
3. Multiple trims at different prices → one object per trim
4. sun_roof=true if text mentions sunroof
5. FOB price → set BOTH price_usd AND price_fob to that number
6. MT→Manuelle, AT→Automatique, DCT→DSG-DCT
7. Body type inference: X3 Pro/Coolray/Seltos/GS3/GS5/Dashing→SUV, MG5/i5/Roewe i5→Berline
8. Return ONLY a valid JSON array starting with [ and ending with ]. No markdown, no explanation.`;

const SQLGeneratorPage = ({showToast}) => {
  const [dealerName, setDealerName] = useState('');
  const [dealerUUID, setDealerUUID] = useState('');
  const [rawText,    setRawText]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [sql,        setSql]        = useState('');
  const [stats,      setStats]      = useState(null);
  const [history,    setHistory]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('ewg_history') || '[]'); } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState('generate');
  const [copied,    setCopied]    = useState(false);

  const saveHistory = (name, uuid, count, text, generatedSql) => {
    const entry = { name, uuid, count, text, sql: generatedSql, date: new Date().toISOString() };
    const next = [entry, ...history].slice(0, 20);
    setHistory(next);
    localStorage.setItem('ewg_history', JSON.stringify(next));
  };

  const handleGenerate = async () => {
    if (!rawText.trim()) { showToast('Colle le texte du dealer d\'abord', 'error'); return; }
    if (!dealerName.trim()) { showToast('Entre le nom du dealer', 'error'); return; }
    const uuid = dealerUUID.trim() || genUUIDv4();
    if (!dealerUUID) setDealerUUID(uuid);
    setLoading(true); setSql(''); setStats(null);
    try {
      const resp = await fetch('http://localhost:3001/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 8000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: rawText }] })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = (data.content?.[0]?.text || '').replace(/```json|```/g,'').trim();
      const cars = JSON.parse(raw);
      if (!Array.isArray(cars) || cars.length === 0) throw new Error('Aucune voiture trouvée dans le texte.');
      const generated = buildCarSQL(cars, dealerName.trim(), uuid);
      setSql(generated);
      setStats({ total:cars.length, colored:cars.filter(c=>c.color).length, fob:cars.filter(c=>c.price_fob).length, sunroof:cars.filter(c=>c.equipment?.sun_roof).length });
      saveHistory(dealerName.trim(), uuid, cars.length, rawText, generated);
      showToast(`${cars.length} voitures générées pour "${dealerName}"`, 'success');
    } catch(e) { showToast('Erreur: ' + e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleCopy = () => { navigator.clipboard.writeText(sql).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(dealerName||'dealer').toLowerCase().replace(/\s+/g,'-')}-${Date.now()}.sql`;
    a.click();
  };
  const loadFromHistory = h => { setDealerName(h.name); setDealerUUID(h.uuid); setRawText(h.text); setSql(h.sql || ''); setActiveTab('generate'); };

  const GTab = ({id, label}) => (
    <button onClick={()=>setActiveTab(id)} style={{background:'none',border:'none',padding:'8px 16px',fontSize:13,fontWeight:700,color:activeTab===id?'#d36135':'#9a9a9a',cursor:'pointer',borderBottom:activeTab===id?'2px solid #d36135':'2px solid transparent',marginBottom:-1,transition:'color .15s'}}>{label}</button>
  );
  const Tag = ({children}) => (
    <span style={{display:'inline-block',background:'rgba(232,0,29,.1)',color:'#d36135',border:'1px solid rgba(232,0,29,.2)',borderRadius:4,padding:'1px 7px',fontSize:11,fontWeight:700,fontFamily:'monospace',margin:'2px 2px 2px 0'}}>{children}</span>
  );

  return (
    <div style={{padding:'86px 20px 60px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:26,fontWeight:900,marginBottom:4}}>🛠 SQL <span style={{color:'#d36135'}}>Generator</span></h1>
        <p style={{color:'#9a9a9a',fontSize:13}}>Colle le texte brut d'un dealer — l'IA génère les INSERT SQL prêts à exécuter dans Supabase.</p>
      </div>
      <div className="sqlgen-grid" style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start'}}>
        <div>
          <div style={{borderBottom:'1px solid #e5e5e5',marginBottom:16,display:'flex'}}>
            <GTab id="generate" label="Générer SQL"/>
            <GTab id="history" label={`Historique (${history.length})`}/>
          </div>
          {activeTab === 'generate' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="card" style={{padding:18}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #e5e5e5'}}>
                  <div style={{width:3,height:15,background:'#d36135',borderRadius:2,flexShrink:0}}/>
                  <h3 style={{fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'.06em'}}>Informations dealer</h3>
                </div>
                <div className="sqlgen-dealer-row" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div><label className="lbl">Nom du dealer *</label><input className="f" value={dealerName} onChange={e=>setDealerName(e.target.value)} placeholder="ex: Lucas"/></div>
                  <div><label className="lbl">UUID dealer (optionnel)</label><input className="f" value={dealerUUID} onChange={e=>setDealerUUID(e.target.value)} placeholder="Auto-généré" style={{fontFamily:'monospace',fontSize:11}}/></div>
                </div>
              </div>
              <div className="card" style={{padding:18}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #e5e5e5'}}>
                  <div style={{width:3,height:15,background:'#d36135',borderRadius:2,flexShrink:0}}/>
                  <h3 style={{fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'.06em'}}>Texte brut du dealer</h3>
                </div>
                <textarea className="f" value={rawText} onChange={e=>setRawText(e.target.value)} rows={12} style={{resize:'vertical',fontFamily:'monospace',fontSize:12,lineHeight:1.65}} placeholder={"- livan x3 pro MT / CVT\n  MT：7600$ (white/gray)\n  7700$ (black/silver)\n..."}/>
              </div>
              <button className="btn-red" onClick={handleGenerate} disabled={loading} style={{padding:14,fontSize:14,justifyContent:'center',width:'100%'}}>
                {loading ? '⏳ Génération en cours...' : '⚡ Générer SQL'}
              </button>
              {stats && (
                <div className="sqlgen-stats" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                  {[{n:stats.total,l:'Voitures'},{n:stats.colored,l:'Avec couleur'},{n:stats.fob,l:'Prix FOB'},{n:stats.sunroof,l:'Toit ouvrant'}].map(s=>(
                    <div key={s.l} className="card" style={{padding:'10px 14px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:26,color:'#d36135',lineHeight:1}}>{s.n}</div>
                      <div style={{fontSize:10,color:'#9a9a9a',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:2}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              )}
              {sql && (
                <div className="card" style={{padding:18}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <h3 style={{fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'.06em'}}>SQL Généré</h3>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn-out" onClick={handleDownload} style={{fontSize:11,padding:'6px 12px'}}>⬇ .sql</button>
                      <button className="btn-out" onClick={handleCopy} style={{fontSize:11,padding:'6px 12px',color:copied?'#16a34a':'inherit',borderColor:copied?'#a7f3d0':'inherit'}}>{copied ? '✓ Copié !' : '⎘ Copier'}</button>
                    </div>
                  </div>
                  <pre style={{background:'#1c1c1c',color:'#e2e8f0',borderRadius:8,padding:16,fontSize:11,fontFamily:'monospace',lineHeight:1.75,overflowX:'auto',maxHeight:480,overflowY:'auto',border:'1px solid #2e2e2e',whiteSpace:'pre'}}>{sql}</pre>
                </div>
              )}
            </div>
          )}
          {activeTab === 'history' && (
            <div className="card" style={{padding:18}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #e5e5e5'}}>
                <div style={{width:3,height:15,background:'#d36135',borderRadius:2,flexShrink:0}}/>
                <h3 style={{fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'.06em'}}>Historique des générations</h3>
              </div>
              {history.length === 0 ? (
                <div style={{textAlign:'center',padding:40,color:'#9a9a9a'}}><div style={{fontSize:28,marginBottom:8}}>🕐</div><p style={{fontWeight:700}}>Aucun historique</p></div>
              ) : history.map((h,i) => (
                <div key={i} onClick={()=>loadFromHistory(h)}
                  style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 14px',borderRadius:8,border:'1px solid #e5e5e5',marginBottom:8,cursor:'pointer',transition:'border-color .15s,background .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#bbb';e.currentTarget.style.background='#fafafa';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e5e5';e.currentTarget.style.background='';}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:14,marginBottom:2}}>{h.name}</div>
                    <div style={{fontSize:11,color:'#9a9a9a'}}>{new Date(h.date).toLocaleString('fr-DZ')}<span style={{fontFamily:'monospace',marginLeft:8,fontSize:10}}>{h.uuid?.slice(0,13)}...</span></div>
                  </div>
                  <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:28,color:'#d36135'}}>{h.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="sqlgen-info" style={{position:'sticky',top:96,display:'flex',flexDirection:'column',gap:12}}>
          <div className="card" style={{padding:16}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#9a9a9a',marginBottom:10}}>Règles de l'IA</div>
            {[['white/gray','→ 2 lignes : Blanc + Gris'],['black/silver','→ 2 lignes : Noir + Argent'],['MT / AT','→ Manuelle / Automatique'],['FOB price','→ price_usd + price_fob'],['sunroof','→ sun_roof = TRUE'],['Trims différents','→ 1 ligne par trim']].map(([k,v]) => (
              <div key={k} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:7,fontSize:12}}>
                <div style={{width:4,height:4,background:'#d36135',borderRadius:'50%',flexShrink:0,marginTop:5}}/>
                <span><span style={{fontWeight:700,fontFamily:'monospace',fontSize:11}}>{k}</span> {v}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{padding:16}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#9a9a9a',marginBottom:10}}>Colonnes requises</div>
            <div style={{fontSize:12,color:'#555',marginBottom:8}}>Vérifie que ces colonnes existent dans Supabase avant d'exécuter :</div>
            <Tag>price_usd</Tag><Tag>price_fob</Tag><Tag>price_currency</Tag>
            <div style={{fontSize:11,color:'#9a9a9a',marginTop:8}}>Lance <code style={{fontSize:10}}>migration_fob.sql</code> si ce n'est pas fait.</div>
          </div>
          <div className="card" style={{padding:16}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#9a9a9a',marginBottom:10}}>Marques supportées</div>
            <div>{['Livan','MG','GAC','Geely','Kia','Roewe','Jetour','Renault','BYD','Chery','Haval','Changan','+ autres'].map(b=><Tag key={b}>{b}</Tag>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// CATALOGUE PAGE
// ═══════════════════════════════════════════════════════════════════════════
const CATALOGUE_CSS = `
  .cat-pg{background:#060D17;min-height:100vh;padding-top:87px;display:flex;flex-direction:row;}
  .cat-panel{width:360px;min-width:360px;flex-shrink:0;background:linear-gradient(180deg,#0d1b2a,#0a1622);border-right:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;height:calc(100vh - 87px);position:sticky;top:87px;overflow:hidden;}
  .cat-ptabs{display:flex;flex-shrink:0;background:rgba(0,0,0,0.25);border-bottom:1px solid rgba(255,255,255,0.08);}
  .cat-ptab{flex:1;padding:13px 0;text-align:center;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.3);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;}
  .cat-ptab.on{color:#E89A1C;border-bottom-color:#E89A1C;}
  .cat-pbody{flex:1;overflow-y:auto;overflow-x:hidden;padding:16px 14px;display:flex;flex-direction:column;gap:14px;min-height:0;}
  .cat-pbody::-webkit-scrollbar{width:3px;}
  .cat-pbody::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
  .cat-tp{display:none;flex-direction:column;gap:14px;}
  .cat-tp.on{display:flex;}
  .cat-sh{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#E89A1C;opacity:.85;margin-bottom:8px;display:flex;align-items:center;gap:8px;}
  .cat-sh::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(232,154,28,0.3),transparent);}
  .cat-r2{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .cat-r3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
  .cat-fld{display:flex;flex-direction:column;gap:4px;}
  .cat-fld label{font-size:8px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:rgba(255,255,255,0.38);}
  .cat-fld input,.cat-fld select,.cat-fld textarea{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 11px;font-family:'Barlow',sans-serif;font-size:12px;font-weight:500;color:#fff;outline:none;transition:border-color .15s;resize:vertical;width:100%;}
  .cat-fld input:focus,.cat-fld select:focus,.cat-fld textarea:focus{border-color:#E89A1C;background:rgba(232,154,28,0.04);}
  .cat-fld select option{background:#111e2e;}
  .cat-lz{border:2px dashed rgba(255,255,255,0.1);border-radius:10px;padding:10px 13px;display:flex;align-items:center;gap:12px;cursor:pointer;position:relative;transition:all .2s;background:rgba(255,255,255,0.02);}
  .cat-lz:hover{border-color:#E89A1C;background:rgba(232,154,28,0.06);}
  .cat-lz input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
  .cat-lzprev{width:64px;height:34px;border-radius:6px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
  .cat-ig{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
  .cat-isl{aspect-ratio:4/3;border:2px dashed rgba(255,255,255,0.1);border-radius:9px;position:relative;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;transition:all .2s;background:rgba(255,255,255,0.02);}
  .cat-isl:hover{border-color:#E89A1C;background:rgba(232,154,28,0.05);}
  .cat-isl input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
  .cat-isl .pv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:7px;z-index:2;}
  .cat-isl .ilbl{font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.22);}
  .cat-isl-del{position:absolute;top:4px;right:4px;z-index:4;background:rgba(200,0,0,0.85);border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:11px;line-height:1;opacity:0;transition:opacity .15s;}
  .cat-isl:hover .cat-isl-del{opacity:1;}
  .cat-cks{display:flex;flex-wrap:wrap;gap:6px;}
  .cat-ck{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:5px 11px;cursor:pointer;transition:all .15s;user-select:none;}
  .cat-ck.on{background:rgba(232,154,28,0.14);border-color:rgba(232,154,28,0.4);color:#E89A1C;}
  .cat-swr{display:flex;flex-wrap:wrap;gap:7px;align-items:center;}
  .cat-csw{width:24px;height:24px;border-radius:50%;cursor:pointer;border:2px solid rgba(255,255,255,0.08);transition:transform .15s,border-color .15s;flex-shrink:0;}
  .cat-csw.on{transform:scale(1.22);border-color:rgba(255,255,255,0.6);}
  .cat-preview{flex:1;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;align-items:center;padding:24px 16px 60px;gap:16px;}
  .cat-preview::-webkit-scrollbar{width:3px;}
  .cat-outer{width:860px;transform-origin:top center;flex-shrink:0;}
  .cat-tpl-section{flex-shrink:0;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);max-height:260px;overflow:hidden;display:flex;flex-direction:column;}
  .cat-actions{display:flex;gap:10px;align-items:center;flex-shrink:0;padding:12px 14px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);}
  .cat-btn{display:inline-flex;align-items:center;gap:7px;border:none;border-radius:9px;padding:0 18px;height:36px;font-family:'Barlow',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;white-space:nowrap;letter-spacing:.5px;}
  .cat-btn-gold{background:linear-gradient(135deg,#E89A1C,#C47A0A);color:#fff;box-shadow:0 4px 16px rgba(232,154,28,0.3);flex:1;justify-content:center;}
  .cat-btn-gold:hover{box-shadow:0 6px 22px rgba(232,154,28,0.5);transform:translateY(-1px);}
  .cat-btn-out{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;}
  .cat-btn-out:hover{background:rgba(255,255,255,0.1);}
  .cat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:60px 20px;text-align:center;color:rgba(255,255,255,0.15);}
  .cat-tpl-row{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);cursor:pointer;transition:all .15s;}
  .cat-tpl-row:hover{background:rgba(232,154,28,0.08);border-color:rgba(232,154,28,0.25);}
  .cat-tpl-name{flex:1;font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .cat-tpl-date{font-size:9px;color:rgba(255,255,255,0.28);flex-shrink:0;}
  .cat-tpl-del{background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:13px;padding:0 2px;transition:color .15s;}
  .cat-tpl-del:hover{color:#d36135;}
  .cat-tpl-empty{font-size:11px;color:rgba(255,255,255,0.2);text-align:center;padding:16px 0;}
  .cat-save-row{display:flex;gap:7px;align-items:center;}
  .cat-save-row input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:7px 10px;font-size:12px;color:#fff;outline:none;}
  .cat-save-row input:focus{border-color:#E89A1C;}
  .cat-save-row input::placeholder{color:rgba(255,255,255,0.2);}
  .cat-btn-save{background:rgba(232,154,28,0.15);border:1px solid rgba(232,154,28,0.35);color:#E89A1C;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s;}
  .cat-btn-save:hover{background:rgba(232,154,28,0.25);}
  @media(max-width:900px){.cat-panel{display:none;}.cat-preview{padding:16px 8px 60px;}.cat-pg{padding-top:115px;}}
`;

const EQUIPS = Object.entries(EQUIPMENT_LABELS).map(([k,v]) => ({key:k, label:v}));
const SWATCH_COLORS = ['#ffffff','#1a1a1a','#888888','#C0C0C0','#1a3a7a','#8B0000','#2d6a1a','#8B4513'];

const CataloguePage = ({initialCar=null, settings=null}) => {
  const [tab, setTab] = useState(0);
  const [activeThumb, setActiveThumb] = useState('front');

  const fmtNum = n => n ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ') : '';

  const carToForm = (car) => {
    if (!car) return {make:'',model:'',year:'',body:'',cond:'',price:'',status:'',phone:'0795505722',fb:'EL Warcha Auto',ig:'el.warcha.auto',desc:'',engine:'',power:'',fuel:'',gear:'',drive:'',km:'',doors:'',seats:'',colorname:''};
    const fob = parseFloat(car.price_fob)||0;
    const dzd = calcDZD(car.price_cny, settings, fob||car.price_usd, 'USD');
    let priceStr = '';
    if (dzd && dzd > 0) { priceStr = fmtNum(dzd) + ' DA'; }
    else if (fob > 0) { priceStr = '$ ' + fmtNum(fob) + ' FOB'; }
    return {
      make: car.brand||'', model: car.model||'', year: car.year ? String(car.year) : '',
      body: car.body_type||'', cond: car.condition==='new'?'Neuf':car.condition==='used'?'Occasion':'',
      price: priceStr, status: car.status==='available'?'En stock':car.status==='reserved'?'Sur commande':car.status==='sold'?'Vendu':'',
      phone: '0795505722', fb:'EL Warcha Auto', ig:'el.warcha.auto',
      desc: car.description||'', engine: car.engine_size||'', power: '',
      fuel: car.fuel_type||'', gear: car.transmission||'', drive: '',
      km: car.mileage ? String(car.mileage)+' km' : '0 km',
      doors: car.doors ? String(car.doors) : '', seats: '', colorname: car.color||'',
    };
  };
  const carToEquips = (car) => {
    const eq = car?.car_equipment?.[0]||{};
    return new Set(Object.keys(EQUIPMENT_LABELS).filter(k => eq[k]));
  };
  const carToColors = (car) => {
    const hexMap = {Blanc:'#ffffff',Gris:'#888888',Noir:'#1a1a1a',Argent:'#C0C0C0',Bleu:'#1a3a7a',Rouge:'#8B0000',Vert:'#2d6a1a',Marron:'#8B4513'};
    const c = car?.color;
    return new Set(c && hexMap[c] ? [hexMap[c]] : ['#ffffff']);
  };
  const carToImgs = (car) => {
    if (!car) return {};
    const photos = car.photos||[];
    const keys = ['front','rear','side-r','side-l','int1','int2'];
    const result = {};
    photos.forEach((url, i) => { if (url && keys[i]) result[keys[i]] = url; });
    return result;
  };

  const [form, setForm] = useState(()=>carToForm(initialCar));
  const [logoB64, setLogoB64] = useState(null);
  const [imgs, setImgs] = useState(()=>carToImgs(initialCar));
  const [equips, setEquips] = useState(()=>carToEquips(initialCar));
  const [colors, setColors] = useState(()=>carToColors(initialCar));
  const [generated, setGenerated] = useState(!!initialCar);
  const [exporting, setExporting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);
  const [currentTplId, setCurrentTplId] = useState(null);

  React.useEffect(() => {
    const name = (form.make + ' ' + form.model).trim();
    if (name) setSaveName(name);
  }, [form.make, form.model]);

  React.useEffect(() => {
    getCatalogueTemplates().then(setTemplates).catch(e => console.error('Failed to load templates', e));
  }, []);

  const saveTemplate = async () => {
    const name = saveName.trim() || (form.make + ' ' + form.model).trim() || 'Sans nom';
    setSavingTpl(true);
    try {
      const tplId = currentTplId || crypto.randomUUID();
      const uploadedImgs = { ...imgs };
      for (const [slot, val] of Object.entries(imgs)) {
        if (val && val.startsWith('data:')) {
          try { const res=await fetch(val); const blob=await res.blob(); const file=new File([blob],`${slot}.jpg`,{type:blob.type}); uploadedImgs[slot]=await uploadCatalogueAsset(tplId,slot,file); } catch(_) {}
        }
      }
      let savedLogo = logoB64;
      if (logoB64 && logoB64.startsWith('data:')) {
        try { const res=await fetch(logoB64); const blob=await res.blob(); const file=new File([blob],'logo.png',{type:blob.type}); savedLogo=await uploadCatalogueAsset(tplId,'logo',file); } catch(_) {}
      }
      const payload = {
        id: currentTplId||undefined, name, form_data: form, equips: [...equips], colors: [...colors],
        logo_url: savedLogo,
        photo_front:  uploadedImgs.front      ||null, photo_rear:   uploadedImgs.rear       ||null,
        photo_side_r: uploadedImgs['side-r']  ||null, photo_side_l: uploadedImgs['side-l']  ||null,
        photo_int1:   uploadedImgs.int1       ||null, photo_int2:   uploadedImgs.int2        ||null,
      };
      const saved = await saveCatalogueTemplate(payload);
      setCurrentTplId(saved.id);
      setTemplates(prev => { const idx=prev.findIndex(t=>t.id===saved.id); return idx>=0?prev.map(t=>t.id===saved.id?saved:t):[saved,...prev]; });
      setSaveName(''); setShowTemplates(true);
    } catch(e) { console.error('Save failed', e); }
    finally { setSavingTpl(false); }
  };

  const loadTemplate = (tpl) => {
    setForm(tpl.form_data||{});
    setEquips(new Set(tpl.equips||[]));
    setColors(new Set(tpl.colors?.length?tpl.colors:['#ffffff']));
    setLogoB64(tpl.logo_url||null);
    setImgs({
      ...(tpl.photo_front  ?{front:   tpl.photo_front }:{}),
      ...(tpl.photo_rear   ?{rear:    tpl.photo_rear  }:{}),
      ...(tpl.photo_side_r ?{'side-r':tpl.photo_side_r}:{}),
      ...(tpl.photo_side_l ?{'side-l':tpl.photo_side_l}:{}),
      ...(tpl.photo_int1   ?{int1:    tpl.photo_int1  }:{}),
      ...(tpl.photo_int2   ?{int2:    tpl.photo_int2  }:{}),
    });
    setSaveName(tpl.name); setCurrentTplId(tpl.id); setGenerated(true); setShowTemplates(false);
  };

  const deleteTemplate = async (id, e) => {
    e.stopPropagation();
    try { await deleteCatalogueTemplate(id); setTemplates(prev=>prev.filter(t=>t.id!==id)); if (currentTplId===id) setCurrentTplId(null); }
    catch(e) { console.error('Delete failed', e); }
  };

  const catRef = React.useRef(null);
  const outerRef = React.useRef(null);
  const previewRef = React.useRef(null);
  const sf = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const handleLogo = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => setLogoB64(ev.target.result); r.readAsDataURL(file); e.target.value='';
  };
  const handleImg = (key, e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => setImgs(prev=>({...prev,[key]:ev.target.result})); r.readAsDataURL(file); e.target.value='';
  };
  const toggleEquip = eq => setEquips(prev => { const n=new Set(prev); n.has(eq)?n.delete(eq):n.add(eq); return n; });
  const toggleColor = c => setColors(prev => { const n=new Set(prev); n.has(c)?n.delete(c):n.add(c); return n; });

  React.useEffect(() => {
    if (!outerRef.current || !previewRef.current || !generated) return;
    const scale = () => {
      const w = previewRef.current.clientWidth - 32;
      const s = Math.min(1, w / 860);
      outerRef.current.style.transform = `scale(${s})`;
      outerRef.current.style.height = (catRef.current.offsetHeight * s) + 'px';
    };
    scale(); window.addEventListener('resize', scale); return () => window.removeEventListener('resize', scale);
  }, [generated]);

  const stripItems = [
    form.price && {lbl:'Prix', val: form.price, gold: true},
    form.gear  && {lbl:'Boîte', val: form.gear},
    form.fuel  && {lbl:'Carburant', val: form.fuel},
    form.engine&& {lbl:'Moteur', val: form.engine},
    form.km    && {lbl:'Kilométrage', val: form.km},
  ].filter(Boolean);

  const specRows = [
    ['Marque', form.make.toUpperCase()], ['Modèle', form.model.toUpperCase()],
    ['Année', form.year], ['Carrosserie', form.body],
    ['Moteur', form.engine], ['Puissance', form.power],
    ['Boîte', form.gear], ['Carburant', form.fuel],
    ['Kilométrage', form.km], ['Portes', form.doors],
    ['Places', form.seats], ['Traction', form.drive], ['Condition', form.cond],
  ].filter(r => r[1]);

  const exportPDF = () => {
    if (!catRef.current) return;
    setExporting(true);

    const el  = catRef.current;
    const W   = 860;
    const H   = el.scrollHeight;

    const html   = el.outerHTML;
    const styles = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'))
      .map(s => s.outerHTML).join('\n');

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) { setExporting(false); return; }

    // Convert px to mm (96dpi → 1px = 0.2646mm)
    const mmW = (W * 0.2646).toFixed(1);
    const mmH = (H * 0.2646).toFixed(1);

    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=${W}"/>
  <title>Catalogue — ${form.make || ''} ${form.model || ''}</title>
  ${styles}
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800;900&display=swap"/>
  <style>
    *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

    /* Screen preview — center the card */
    html, body {
      width: ${W}px;
      background: #080d14 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      font-family: 'Barlow', sans-serif;
    }
    body {
      padding: 0;
      margin: 0;
    }
    .cat-wrap {
      width: ${W}px;
    }

    /* Print — page exactly the size of the card, no margins, full fidelity */
    @page {
      size: ${mmW}mm ${mmH}mm;
      margin: 0;
    }
    @media print {
      html, body {
        width: ${W}px !important;
        height: ${H}px !important;
        overflow: hidden !important;
        background: #080d14 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .cat-wrap {
        width: ${W}px !important;
        transform-origin: top left;
      }
      /* hide everything except the catalogue card */
      body > * { display: none !important; }
      body > .cat-wrap { display: block !important; }
    }
  </style>
</head>
<body>
  <div class="cat-wrap">${html}</div>
</body>
</html>`);

    printWin.document.close();

    const doPrint = () => {
      printWin.focus();
      printWin.print();
      setTimeout(() => { try { printWin.close(); } catch(_){} }, 2000);
      setExporting(false);
    };

    if (printWin.document.readyState === 'complete') {
      setTimeout(doPrint, 900);
    } else {
      printWin.onload = () => setTimeout(doPrint, 900);
      setTimeout(doPrint, 2500);
    }
  };


  const IMG_SLOTS = [
    {key:'front',lbl:'Avant ★'},{key:'rear',lbl:'Arrière ◆'},
    {key:'side-r',lbl:'Côté D.'},{key:'side-l',lbl:'Côté G.'},
    {key:'int1',lbl:'Int. 1'},{key:'int2',lbl:'Int. 2'},
  ];

  return (
    <>
      <style>{CATALOGUE_CSS}</style>
      <div className="cat-pg">

        {/* ── LEFT PANEL ── */}
        <div className="cat-panel">
          <div className="cat-ptabs">
            {['Infos','Specs','Équip.','Photos'].map((t,i)=>(
              <div key={i} className={"cat-ptab"+(tab===i?" on":"")} onClick={()=>setTab(i)}>{t}</div>
            ))}
          </div>
          <div className="cat-pbody">
            {tab===0&&<div className="cat-tp on">
              <div>
                <div className="cat-sh">Logo</div>
                <div style={{position:'relative'}}>
                  <div className="cat-lz">
                    <input type="file" accept="image/*" onChange={handleLogo}/>
                    <div className="cat-lzprev">
                      {logoB64?<img src={logoB64} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{fontSize:11,color:'rgba(255,255,255,0.2)'}}>Logo</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:'#fff',marginBottom:2}}>{logoB64?'Logo chargé — cliquer pour changer':'Uploader votre logo'}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>PNG transparent recommandé</div>
                    </div>
                  </div>
                  {logoB64&&<button onClick={e=>{e.stopPropagation();setLogoB64(null);}} style={{position:'absolute',top:-6,right:-6,background:'#dc2626',border:'none',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:11,zIndex:10,flexShrink:0}} title="Supprimer le logo">✕</button>}
                </div>
              </div>
              <div>
                <div className="cat-sh">Véhicule</div>
                <div className="cat-r2">
                  <div className="cat-fld"><label>Marque</label><input value={form.make} onChange={sf('make')} placeholder="ex: Livan"/></div>
                  <div className="cat-fld"><label>Modèle</label><input value={form.model} onChange={sf('model')} placeholder="ex: X3 Pro"/></div>
                </div>
                <div className="cat-r3" style={{marginTop:8}}>
                  <div className="cat-fld"><label>Année</label><input type="number" value={form.year} onChange={sf('year')} placeholder="2025"/></div>
                  <div className="cat-fld"><label>Carrosserie</label>
                    <select value={form.body} onChange={sf('body')}><option value="">—</option>{['Berline','SUV','Crossover','Coupé','Break','Pick-Up','Cabriolet'].map(v=><option key={v}>{v}</option>)}</select>
                  </div>
                  <div className="cat-fld"><label>Condition</label>
                    <select value={form.cond} onChange={sf('cond')}><option value="">—</option>{['Neuf','Occasion','Semi-Neuf'].map(v=><option key={v}>{v}</option>)}</select>
                  </div>
                </div>
              </div>
              <div>
                <div className="cat-sh">Prix & Contact</div>
                <div className="cat-r2">
                  <div className="cat-fld"><label>Prix</label><input value={form.price} onChange={sf('price')} placeholder="292 M DA"/></div>
                  <div className="cat-fld"><label>Statut</label>
                    <select value={form.status} onChange={sf('status')}><option value="">—</option>{['واصلة','En stock','Sur commande','Vendu'].map(v=><option key={v}>{v}</option>)}</select>
                  </div>
                </div>
                <div className="cat-r3" style={{marginTop:8}}>
                  <div className="cat-fld"><label>Téléphone</label><input value={form.phone} onChange={sf('phone')}/></div>
                  <div className="cat-fld"><label>Facebook</label><input value={form.fb} onChange={sf('fb')}/></div>
                  <div className="cat-fld"><label>Instagram</label><input value={form.ig} onChange={sf('ig')}/></div>
                </div>
              </div>
              <div>
                <div className="cat-sh">Description</div>
                <div className="cat-fld"><textarea value={form.desc} onChange={sf('desc')} rows={3} placeholder="Points forts, état du véhicule…"/></div>
              </div>
            </div>}

            {tab===1&&<div className="cat-tp on">
              <div>
                <div className="cat-sh">Motorisation</div>
                <div className="cat-r2">
                  <div className="cat-fld"><label>Moteur</label><input value={form.engine} onChange={sf('engine')} placeholder="1.5L Turbo"/></div>
                  <div className="cat-fld"><label>Puissance</label><input value={form.power} onChange={sf('power')} placeholder="169 ch"/></div>
                </div>
                <div className="cat-r2" style={{marginTop:8}}>
                  <div className="cat-fld"><label>Carburant</label>
                    <select value={form.fuel} onChange={sf('fuel')}><option value="">—</option>{['Essence','Diesel','Hybride','Électrique','GPL'].map(v=><option key={v}>{v}</option>)}</select>
                  </div>
                  <div className="cat-fld"><label>Boîte</label>
                    <select value={form.gear} onChange={sf('gear')}><option value="">—</option>{['Automatique','Manuelle','CVT','Semi-auto'].map(v=><option key={v}>{v}</option>)}</select>
                  </div>
                </div>
                <div className="cat-r2" style={{marginTop:8}}>
                  <div className="cat-fld"><label>Traction</label>
                    <select value={form.drive} onChange={sf('drive')}><option value="">—</option>{['FWD','RWD','AWD','4WD'].map(v=><option key={v}>{v}</option>)}</select>
                  </div>
                  <div className="cat-fld"><label>Kilométrage</label><input value={form.km} onChange={sf('km')} placeholder="0 km"/></div>
                </div>
              </div>
              <div>
                <div className="cat-sh">Dimensions</div>
                <div className="cat-r3">
                  <div className="cat-fld"><label>Portes</label>
                    <select value={form.doors} onChange={sf('doors')}><option value="">—</option>{['2','3','4','5'].map(v=><option key={v}>{v}</option>)}</select>
                  </div>
                  <div className="cat-fld"><label>Places</label>
                    <select value={form.seats} onChange={sf('seats')}><option value="">—</option>{['2','4','5','7','8'].map(v=><option key={v}>{v}</option>)}</select>
                  </div>
                  <div className="cat-fld"><label>Couleur(s)</label><input value={form.colorname} onChange={sf('colorname')} placeholder="Blanc, Gris"/></div>
                </div>
              </div>
              <div>
                <div className="cat-sh">Couleurs disponibles</div>
                <div className="cat-swr">
                  {SWATCH_COLORS.map(c=>(
                    <div key={c} className={"cat-csw"+(colors.has(c)?" on":"")} style={{background:c}} onClick={()=>toggleColor(c)}/>
                  ))}
                  <input type="color" style={{width:24,height:24,borderRadius:'50%',border:'none',cursor:'pointer',background:'transparent',padding:0}} onChange={e=>setColors(prev=>new Set([...prev,e.target.value]))}/>
                </div>
              </div>
            </div>}

            {tab===2&&<div className="cat-tp on">
              <div>
                <div className="cat-sh">Sélectionner les équipements</div>
                <div className="cat-cks">
                  {EQUIPS.map(({key,label})=>(
                    <div key={key} className={"cat-ck"+(equips.has(key)?" on":"")} onClick={()=>toggleEquip(key)}>{label}</div>
                  ))}
                </div>
              </div>
            </div>}

            {tab===3&&<div className="cat-tp on">
              <div>
                <div className="cat-sh">Photos du véhicule</div>
                <div className="cat-ig">
                  {IMG_SLOTS.map(({key,lbl})=>(
                    <div key={key} className="cat-isl">
                      <input type="file" accept="image/*" onChange={e=>handleImg(key,e)}/>
                      {imgs[key]
                        ?<><img className="pv" src={imgs[key]} alt={lbl}/>
                          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.55)',fontSize:7,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'rgba(255,255,255,0.7)',padding:'3px 5px',textAlign:'center',zIndex:3}}>Cliquer pour remplacer</div>
                          <button className="cat-isl-del" onClick={e=>{e.stopPropagation();e.preventDefault();setImgs(prev=>{const n={...prev};delete n[key];return n;});}} title="Supprimer">✕</button>
                        </>
                        :<><svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{opacity:.2}}><rect x="3" y="5" width="18" height="14" rx="2" stroke="white" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5"/></svg><div className="ilbl">{lbl}</div></>
                      }
                    </div>
                  ))}
                </div>
                <p style={{fontSize:'8px',color:'rgba(255,255,255,0.2)',marginTop:8,textAlign:'center',lineHeight:1.6}}>★ Avant = image principale · ◆ Arrière = miniature</p>
              </div>
            </div>}
          </div>

          {/* TEMPLATE MANAGER */}
          <div className="cat-tpl-section">
            <div style={{padding:'10px 14px 8px'}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(255,255,255,0.25)',marginBottom:6}}>{currentTplId?'Mettre à jour le modèle':'Sauvegarder le modèle'}</div>
              <div className="cat-save-row">
                <input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="Nom du modèle..." onKeyDown={e=>e.key==='Enter'&&saveTemplate()}/>
                <button className="cat-btn-save" onClick={saveTemplate} disabled={savingTpl}>{savingTpl?'⏳':'💾'} Sauv.</button>
              </div>
            </div>
            <div onClick={()=>setShowTemplates(v=>!v)} style={{padding:'7px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:templates.length>0?'rgba(232,154,28,0.8)':'rgba(255,255,255,0.2)'}}>📂 Modèles sauvegardés ({templates.length})</span>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.25)'}}>{showTemplates?'▲':'▼'}</span>
            </div>
            {showTemplates&&(
              <div style={{maxHeight:150,overflowY:'auto',padding:'0 10px 10px',display:'flex',flexDirection:'column',gap:5}}>
                {templates.length===0
                  ?<div className="cat-tpl-empty">Aucun modèle sauvegardé</div>
                  :templates.map(tpl=>(
                    <div key={tpl.key} className="cat-tpl-row" onClick={()=>loadTemplate(tpl)}>
                      <div style={{flexShrink:0,width:28,height:28,borderRadius:6,background:'rgba(232,154,28,0.12)',border:'1px solid rgba(232,154,28,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>🎨</div>
                      <div style={{flex:1,minWidth:0}}><div className="cat-tpl-name">{tpl.name}</div><div className="cat-tpl-date">{new Date(tpl.savedAt).toLocaleDateString('fr-DZ')}</div></div>
                      <button className="cat-tpl-del" onClick={e=>deleteTemplate(tpl.id,e)} title="Supprimer">✕</button>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* MAIN ACTIONS */}
          <div className="cat-actions">
            <button className="cat-btn cat-btn-gold" onClick={()=>setGenerated(true)}>✦ Générer le catalogue</button>
            {generated&&<button className="cat-btn cat-btn-out" onClick={exportPDF} disabled={exporting}>{exporting?'⏳':'🖨️'} Imprimer</button>}
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div className="cat-preview" ref={previewRef}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'rgba(255,255,255,0.14)',marginBottom:8}}>Aperçu live</div>

          {!generated&&(
            <div className="cat-empty">
              <svg width="64" height="64" fill="none" viewBox="0 0 72 72" opacity=".12"><rect x="8" y="16" width="56" height="40" rx="6" stroke="white" strokeWidth="2"/><path d="M16 48C16 48 22 36 36 36C50 36 56 48 56 48" stroke="white" strokeWidth="2" fill="none"/><circle cx="36" cy="29" r="7" stroke="white" strokeWidth="2"/></svg>
              <p style={{color:'rgba(255,255,255,0.18)'}}>Remplissez le formulaire<br/>puis cliquez sur <strong style={{color:'#E89A1C'}}>Générer</strong></p>
            </div>
          )}

          {generated&&(
            <div className="cat-outer" ref={outerRef}>
              <div ref={catRef} style={{
                width:860,
                background:'linear-gradient(160deg,#0e1823 0%,#080d14 60%,#0b1520 100%)',
                borderRadius:20,overflow:'hidden',position:'relative',
                fontFamily:"'Barlow',sans-serif",
                border:'1px solid rgba(255,255,255,0.06)',
              }}>

                {/* ── DECORATIVE BACKGROUND LAYER ── */}
                <div data-bg-layer="1" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden',borderRadius:20}}>

                  {/* Fine dot matrix */}
                  <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>

                  {/* Diagonal ruled lines */}
                  <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} preserveAspectRatio="none">
                    <defs>
                      <pattern id="diag" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                        <line x1="0" y1="0" x2="0" y2="60" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
                      </pattern>
                      <pattern id="diag2" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                        <line x1="0" y1="0" x2="0" y2="120" stroke="rgba(232,184,75,0.045)" strokeWidth="1.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#diag)"/>
                    <rect width="100%" height="100%" fill="url(#diag2)"/>
                  </svg>

                  {/* Corner brackets */}
                  <svg style={{position:'absolute',top:14,left:14,opacity:.4}} width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <path d="M2 28 L2 2 L28 2" stroke="#E8B84B" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="2" cy="2" r="2.5" fill="#E8B84B"/>
                  </svg>
                  <svg style={{position:'absolute',top:14,right:14,opacity:.4}} width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <path d="M58 28 L58 2 L32 2" stroke="#E8B84B" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="58" cy="2" r="2.5" fill="#E8B84B"/>
                  </svg>
                  <svg style={{position:'absolute',bottom:14,left:14,opacity:.2}} width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <path d="M2 32 L2 58 L28 58" stroke="#E8B84B" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="2" cy="58" r="2.5" fill="#E8B84B"/>
                  </svg>
                  <svg style={{position:'absolute',bottom:14,right:14,opacity:.2}} width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <path d="M58 32 L58 58 L32 58" stroke="#E8B84B" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="58" cy="58" r="2.5" fill="#E8B84B"/>
                  </svg>

                  {/* Radial glows */}
                  <div style={{position:'absolute',top:-80,left:'50%',transform:'translateX(-50%)',width:600,height:400,background:'radial-gradient(ellipse at center,rgba(232,184,75,0.08) 0%,transparent 65%)'}}/>
                  <div style={{position:'absolute',bottom:-60,right:-60,width:320,height:320,background:'radial-gradient(ellipse at center,rgba(100,160,255,0.05) 0%,transparent 65%)'}}/>
                  <div style={{position:'absolute',top:'42%',left:-40,width:220,height:220,background:'radial-gradient(ellipse at center,rgba(232,184,75,0.04) 0%,transparent 70%)'}}/>

                  {/* Horizontal scan line */}
                  <div style={{position:'absolute',top:'31%',left:0,right:0,height:1,background:'linear-gradient(90deg,transparent 0%,rgba(232,184,75,0.14) 20%,rgba(232,184,75,0.2) 50%,rgba(232,184,75,0.14) 80%,transparent 100%)'}}/>

                  {/* Vertical inner rails */}
                  <div style={{position:'absolute',top:0,left:28,width:1,height:'100%',background:'linear-gradient(180deg,transparent 0%,rgba(255,255,255,0.045) 15%,rgba(255,255,255,0.045) 85%,transparent 100%)'}}/>
                  <div style={{position:'absolute',top:0,right:28,width:1,height:'100%',background:'linear-gradient(180deg,transparent 0%,rgba(255,255,255,0.045) 15%,rgba(255,255,255,0.045) 85%,transparent 100%)'}}/>

                  {/* Circuit nodes */}
                  {[{x:92,y:'18%'},{x:768,y:'22%'},{x:430,y:'67%'},{x:140,y:'74%'},{x:720,y:'71%'}].map((p,i)=>(
                    <div key={i} style={{position:'absolute',left:p.x,top:p.y,width:5,height:5,borderRadius:'50%',border:'1px solid rgba(232,184,75,0.28)',background:'rgba(232,184,75,0.07)'}}/>
                  ))}
                  <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.12}} viewBox="0 0 860 800" preserveAspectRatio="none">
                    <line x1="94" y1="144" x2="143" y2="592" stroke="#E8B84B" strokeWidth="0.6" strokeDasharray="3 7"/>
                    <line x1="770" y1="176" x2="722" y2="568" stroke="#E8B84B" strokeWidth="0.6" strokeDasharray="3 7"/>
                  </svg>

                </div>

                {/* ── ALL CONTENT (above bg layer) ── */}
                <div style={{position:'relative',zIndex:1}}>

                {/* TOP GOLD LINE */}
                <div style={{height:2,background:'linear-gradient(90deg,transparent 0%,#C8922A 30%,#E8B84B 55%,#C8922A 75%,transparent 100%)'}}/>

                {/* ── HEADER ── */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 28px 16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {/* LOGO — uploaded image or text fallback */}
                  {logoB64
                    ? <img src={logoB64} style={{height:70,maxWidth:240,objectFit:'contain',display:'block'}}/>
                    : <div>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,letterSpacing:'3.5px',color:'#fff',textTransform:'uppercase',lineHeight:1}}>
                          EL WARCHA <span style={{color:'#E8B84B'}}>AUTO</span>
                        </div>
                        <div style={{fontSize:9,fontWeight:500,letterSpacing:'1.5px',color:'rgba(255,255,255,0.3)',marginTop:3,textTransform:'uppercase'}}>
                          Importation Chine · Algérie
                        </div>
                      </div>
                  }
                  {/* FLAGS */}
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <div style={{width:44,height:28,borderRadius:5,overflow:'hidden',border:'1px solid rgba(255,255,255,0.12)',flexShrink:0}}>
                      <svg viewBox="0 0 44 28" style={{width:'100%',height:'100%'}}>
                        <rect fill="#DE2910" width="44" height="28"/>
                        <text x="2" y="14" fontSize="12" fill="#FFDE00" fontFamily="serif">★</text>
                        <text x="13" y="7"  fontSize="6"  fill="#FFDE00" fontFamily="serif">★</text>
                        <text x="17" y="12" fontSize="6"  fill="#FFDE00" fontFamily="serif">★</text>
                        <text x="15" y="18" fontSize="6"  fill="#FFDE00" fontFamily="serif">★</text>
                        <text x="11" y="23" fontSize="6"  fill="#FFDE00" fontFamily="serif">★</text>
                      </svg>
                    </div>
                    <div style={{width:44,height:28,borderRadius:5,overflow:'hidden',border:'1px solid rgba(255,255,255,0.12)',flexShrink:0}}>
                      <svg viewBox="0 0 44 28" style={{width:'100%',height:'100%'}}>
                        <rect fill="#006233" width="22" height="28"/>
                        <rect fill="white" x="22" width="22" height="28"/>
                        <circle cx="23.5" cy="14" r="6.5" fill="#D21034"/>
                        <circle cx="25.5" cy="14" r="5.2" fill="white"/>
                        <path d="M31.0,10.5 L31.8,12.9 L34.3,12.9 L32.3,14.4 L33.1,16.8 L31.0,15.4 L28.9,16.8 L29.7,14.4 L27.7,12.9 L30.2,12.9 Z" fill="#D21034"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ── HERO: vertical thumbs + main photo ── */}
                <div style={{display:'flex',padding:'20px 24px',alignItems:'stretch',gap:10}}>

                  {/* VERTICAL THUMBNAILS */}
                  <div style={{display:'flex',flexDirection:'column',gap:8,width:104,flexShrink:0}}>
                    {IMG_SLOTS.map(({key,lbl}) => imgs[key] ? (
                      <div key={key} onClick={()=>setActiveThumb(key)}
                        style={{
                          height:96,borderRadius:10,overflow:'hidden',flexShrink:0,
                          cursor:'pointer',position:'relative',
                          border: activeThumb===key ? '2px solid #E8B84B' : '1px solid rgba(255,255,255,0.1)',
                          opacity: activeThumb===key ? 1 : 0.6,
                          transition:'all .15s',
                        }}>
                        <img src={imgs[key]} alt={lbl} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                        <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(0,0,0,0.72))',fontSize:8,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'rgba(255,255,255,0.75)',textAlign:'center',padding:'5px 3px'}}>{lbl}</div>
                      </div>
                    ) : null)}
                  </div>

                  {/* MAIN PHOTO */}
                  <div style={{flex:1,borderRadius:14,overflow:'hidden',background:'linear-gradient(135deg,#111c2a,#0a1218)',minHeight:320,position:'relative',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {/* grid bg */}
                    <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.01) 1px,transparent 1px)',backgroundSize:'44px 44px'}}/>
                    {/* glow */}
                    <div style={{position:'absolute',bottom:-30,left:'50%',transform:'translateX(-50%)',width:420,height:120,background:'radial-gradient(ellipse,rgba(232,184,75,0.07) 0%,transparent 70%)',pointerEvents:'none'}}/>
                    {imgs[activeThumb]
                      ? <img src={imgs[activeThumb]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0,display:'block'}}/>
                      : <div style={{position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
                          <CarSVG size={200}/>
                          <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'rgba(255,255,255,0.12)'}}>Votre photo ici</div>
                        </div>
                    }
                  </div>
                </div>

                {/* ── MODEL NAME + PRICE BAND ── */}
                <div style={{padding:'0 24px 20px',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:20}}>
                  <div>
                    {form.make && <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:4,color:'#E8B84B',opacity:.85,marginBottom:2,textTransform:'uppercase'}}>{form.make.toUpperCase()}</div>}
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:72,fontWeight:900,textTransform:'uppercase',color:'#fff',lineHeight:.88,letterSpacing:-2}}>{form.model.toUpperCase()||'MODÈLE'}</div>
                    {(form.body||form.year) && <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:400,color:'rgba(255,255,255,0.32)',letterSpacing:3,marginTop:6,textTransform:'uppercase'}}>{[form.body,form.year?'Modèle '+form.year:''].filter(Boolean).join(' · ')}</div>}
                  </div>
                  {/* PRICE + STATUS stacked */}
                  {form.price && (
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:9,letterSpacing:2,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',marginBottom:6}}>Prix</div>
                      {/* Price number — large gold hero text */}
                      <div style={{position:'relative',display:'inline-block'}}>
                        {/* glow behind price */}
                        <div style={{position:'absolute',inset:-10,background:'radial-gradient(ellipse,rgba(232,184,75,0.18) 0%,transparent 70%)',pointerEvents:'none'}}/>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,lineHeight:1,letterSpacing:-1,position:'relative',display:'flex',alignItems:'flex-end',gap:6,justifyContent:'flex-end'}}>
                          {/* Strip any trailing unit the stored string already has */}
                          <span style={{fontSize:64,color:'#E8B84B',textShadow:'0 0 30px rgba(232,184,75,0.5)'}}>{form.price.replace(/\s*(DA|FOB)\s*$/i,'').trim()}</span>
                          {/* Show unit: DA for DZD prices, FOB label for USD prices */}
                          <span style={{fontSize:22,color:'rgba(232,184,75,0.7)',marginBottom:6,fontWeight:700,letterSpacing:1}}>
                            {/FOB/i.test(form.price) ? 'USD FOB' : 'DA'}
                          </span>
                        </div>
                      </div>
                      {form.status && (
                        <div style={{marginTop:10,display:'inline-block',background:'rgba(232,184,75,0.14)',border:'1px solid rgba(232,184,75,0.4)',borderRadius:8,padding:'8px 18px',fontSize:17,fontWeight:800,color:'#E8B84B',letterSpacing:0,textTransform:'none',direction:'rtl',unicodeBidi:'plaintext'}}>{form.status}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── SPECS STRIP ── */}
                {stripItems.length>0 && (
                  <div style={{background:'rgba(255,255,255,0.04)',borderTop:'1px solid rgba(255,255,255,0.07)',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'stretch',overflow:'hidden'}}>
                    {stripItems.map((s,i)=>(
                      <React.Fragment key={i}>
                        {i>0 && <div style={{width:1,background:'rgba(255,255,255,0.06)',flexShrink:0}}/>}
                        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'16px 8px',gap:4,textAlign:'center'}}>
                          <div style={{fontSize:9,letterSpacing:2,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',lineHeight:1}}>{s.lbl}</div>
                          <div style={{fontSize:15,fontWeight:800,color:s.gold?'#E8B84B':'#fff',textTransform:'uppercase',letterSpacing:.5,lineHeight:1.2}}>{s.val}</div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* ── BODY ── */}
                {(specRows.length>0 || equips.size>0 || colors.size>0 || form.desc) && (
                  <div style={{padding:'20px 24px 0'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:form.desc?14:0}}>

                      {/* FICHE TECHNIQUE */}
                      {specRows.length>0 && (
                        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
                          <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)'}}/>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'#E8B84B',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                            Fiche technique
                            <span style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(232,184,75,0.3),transparent)',display:'block'}}/>
                          </div>
                          <table style={{width:'100%',borderCollapse:'collapse'}}>
                            <tbody>
                              {specRows.map(([k,v])=>(
                                <tr key={k} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                                  <td style={{padding:'8px 0',fontSize:14,color:'rgba(255,255,255,0.38)',width:'45%',paddingRight:8}}>{k}</td>
                                  <td style={{padding:'8px 0',fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.9)',textAlign:'right'}}>
                                    <span style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:5,padding:'2px 10px',fontSize:13}}>{v}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* EQUIPEMENTS + COULEURS */}
                      <div style={{display:'flex',flexDirection:'column',gap:14}}>
                        {equips.size>0 && (
                          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
                            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)'}}/>
                            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'#E8B84B',marginBottom:12}}>Équipements</div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                              {[...equips].map(key=>(
                                <div key={key} style={{display:'flex',alignItems:'center',gap:5,background:'rgba(232,184,75,0.1)',border:'1px solid rgba(232,184,75,0.28)',borderRadius:20,padding:'6px 13px',fontSize:13,fontWeight:700,color:'#E8B84B'}}>
                                  <div style={{width:5,height:5,borderRadius:'50%',background:'#E8B84B',flexShrink:0}}/>
                                  {EQUIPMENT_LABELS[key]||key}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(colors.size>0||form.colorname) && (
                          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
                            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)'}}/>
                            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'#E8B84B',marginBottom:12}}>Couleurs</div>
                            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                              {[...colors].map(c=>(
                                <div key={c} style={{width:26,height:26,borderRadius:'50%',background:c,border:'2px solid rgba(255,255,255,0.2)',boxShadow:'0 2px 8px rgba(0,0,0,0.4)',flexShrink:0}}/>
                              ))}
                              {form.colorname && <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.55)',marginLeft:4}}>{form.colorname}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DESCRIPTION */}
                    {form.desc && (
                      <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'18px 20px',marginBottom:0,position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)'}}/>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:'#E8B84B',marginBottom:12}}>Description</div>
                        <div style={{fontSize:14,color:'rgba(255,255,255,0.5)',lineHeight:1.75}}>{form.desc}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── FOOTER ── */}
                <div style={{background:'rgba(0,0,0,0.35)',borderTop:'1px solid rgba(255,255,255,0.06)',padding:'14px 28px',marginTop:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:20}}>
                    {form.fb && (
                      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.8)'}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'#1877F2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <svg width="13" height="13" fill="white" viewBox="0 0 16 16"><path d="M9.5 3H11V1H9C7.3 1 6 2.3 6 4V5H4V7H6V15H8.5V7H10.5L11 5H8.5V4C8.5 3.4 8.9 3 9.5 3Z"/></svg>
                        </div>
                        {form.fb}
                      </div>
                    )}
                    {form.ig && (
                      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.8)'}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'radial-gradient(circle at 30% 107%,#fdf497,#fd5949 45%,#d6249f 60%,#285AEB)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <svg width="13" height="13" fill="none" viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="3.5" stroke="white" strokeWidth="1.4"/><circle cx="8" cy="8" r="3" stroke="white" strokeWidth="1.4"/><circle cx="11.5" cy="4.5" r=".8" fill="white"/></svg>
                        </div>
                        {form.ig}
                      </div>
                    )}
                    {form.phone && (
                      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.8)'}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'#E8B84B',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <svg width="13" height="13" fill="none" viewBox="0 0 16 16"><path d="M3 2C3 2 2 2 2 3C2 4 2 7 5 10C8 13 11 14 12 14C13 14 13 13 13 13L14 11C14 10.5 13.5 10.2 11.5 9.2C11 9 10.8 9.1 10.5 9.4L10 10C10 10 9 9.5 8 8.5C7 7.5 6.5 6.5 6.5 6.5L7.1 5.9C7.4 5.6 7.5 5.4 7.3 4.9L6.3 3C6 2.5 5.5 2.5 5.5 2.5Z" stroke="white" strokeWidth="1.3" fill="none"/></svg>
                        </div>
                        {form.phone}
                      </div>
                    )}
                  </div>
                  <div style={{fontSize:9,letterSpacing:2,color:'rgba(255,255,255,0.15)',textTransform:'uppercase'}}>Import Chine · Algérie</div>
                </div>

                </div>{/* end content wrapper */}
              </div>{/* end catRef */}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default function App() {
  const [page,    setPage]    = useState("home");
  const [cars,    setCars]    = useState([]);
  const [dealers, setDealers] = useState([]);
  const [settings,setSettings]= useState(null);
  const [selectedCar,    setSelectedCar]    = useState(null);
  const [catalogueCar,   setCatalogueCar]   = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const [search,  setSearch]  = useState("");
  const showToast = useCallback((msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);},[]);

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try {
        const [c,d,s] = await Promise.all([getCars(), getDealers(), getSettings()]);
        setCars(c); setDealers(d); if (s) setSettings(s);
        if (_hasDeepLink) {
          const found = c.find(x => {
            const matchBrand  = !_deepLink.brand  || x.brand === _deepLink.brand;
            const matchModel  = !_deepLink.model  || x.model === _deepLink.model;
            const matchYear   = !_deepLink.year   || String(x.year) === _deepLink.year;
            const matchDealer = !_deepLink.dealer || x.dealers?.name === _deepLink.dealer;
            const matchTrim   = !_deepLink.trim   || x.trim === _deepLink.trim;
            const matchColor  = !_deepLink.color  || x.color === _deepLink.color;
            return matchBrand && matchModel && matchYear && matchDealer && matchTrim && matchColor;
          });
          if (found) { setSelectedCar(found); setPage("car-detail"); }
        }
      } catch(e) { showToast("Erreur Supabase: "+e.message,"error"); }
      finally { setLoading(false); }
    };
    load();
  },[]);

  const handleAddCar    = car  => setCars(prev=>[car, ...prev]);
  const handleUpdateCar = updated => { setCars(prev=>prev.map(c=>c.id===updated.id ? updated : c)); setSelectedCar(updated); };
  const handleDeleteCar = id => {
    if (!window.confirm("Supprimer ce véhicule ?")) return;
    deleteCar(id)
      .then(()=>{ setCars(prev=>prev.filter(c=>c.id!==id)); showToast("Véhicule supprimé","success"); setPage("home"); })
      .catch(e=>showToast("Erreur: "+e.message,"error"));
  };

  const handleAddDealer    = d => setDealers(prev=>[d, ...prev]);
  const handleUpdateDealer = updated => { setDealers(prev=>prev.map(d=>d.id===updated.id ? updated : d)); setSelectedDealer(updated); };
  const handleDeleteDealer = (id, goBack=false) => {
    if (!window.confirm("Supprimer ce concessionnaire ? Ses voitures ne seront pas supprimées.")) return;
    deleteDealer(id)
      .then(()=>{ setDealers(prev=>prev.filter(d=>d.id!==id)); showToast("Concessionnaire supprimé","success"); if (goBack) setPage("dealers"); })
      .catch(e=>showToast("Erreur: "+e.message,"error"));
  };

  const p = {setPage, showToast, settings};

  const renderPage = () => {
    switch(page) {
      case "home":
        return <HomePage {...p} cars={cars} loading={loading} setSelectedCar={setSelectedCar} setCatalogueCar={setCatalogueCar} search={search} setSearch={setSearch}/>;
      case "car-detail":
        return selectedCar ? <CarDetailPage {...p} car={selectedCar} dealers={dealers} onDelete={handleDeleteCar} onUpdate={handleUpdateCar}/> : null;
      case "dealers":
        return <DealersPage {...p} dealers={dealers} cars={cars} loading={loading} setSelectedDealer={setSelectedDealer} onDeleteDealer={handleDeleteDealer}/>;
      case "dealer-detail":
        return selectedDealer ? <DealerDetailPage {...p} dealer={selectedDealer} cars={cars} setSelectedCar={setSelectedCar} setSelectedDealer={setSelectedDealer} onDeleteDealer={handleDeleteDealer} setCatalogueCar={setCatalogueCar}/> : null;
      case "add-dealer":
        return <AddDealerPage {...p} onAdd={handleAddDealer}/>;
      case "edit-dealer":
        return selectedDealer ? <EditDealerPage {...p} dealer={selectedDealer} onUpdate={handleUpdateDealer}/> : null;
      case "add-car":
        return <AddCarPage {...p} dealers={dealers} onAdd={handleAddCar}/>;
      case "export":
        return <ExportPage {...p} cars={cars} dealers={dealers}/>;
      case "catalogue":
        return <CataloguePage initialCar={catalogueCar} settings={settings}/>;
      case "sql-gen":
        return <SQLGeneratorPage showToast={showToast}/>;
      case "settings":
        return <SettingsPage {...p} setSettings={setSettings}/>;
      default:
        return null;
    }
  };

  return (
    <>
      <style>{G}</style>
      <div style={{minHeight:"100vh",background:"#f2f2f2"}}>
        <Navbar page={page} setPage={setPage} search={search} setSearch={setSearch}/>
        {renderPage()}
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
    </>
  );
}
