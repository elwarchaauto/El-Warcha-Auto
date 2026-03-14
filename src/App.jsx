import React, { useState, useEffect, useCallback } from "react";
import { getDealers, getCars, getSettings, createDealer, updateDealer, deleteDealer, createCar, updateCar, updateSettings, deleteCar, uploadCarPhoto } from "./lib/db";

const EQUIPMENT_LABELS = {
  cd_dvd:"CD/DVD", sun_roof:"Sun Roof", leather_seat:"Leather Seat",
  power_seat:"Power Seat", seat_heating:"Seat Heating",
  seat_ventilation:"Seat Ventilation", alloy_wheel:"Alloy Wheel",
  tv:"TV", power_window:"Power Window", auto_ac:"Auto A/C",
  abs:"ABS", driver_airbag:"Driver Airbag", camera_360:"360 Camera",
  adaptive_cruise:"Adaptive Cruise",
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


// Read deep-link param immediately on module load (before React renders)
// Read deep-link search params on module load
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

const EMPTY_FILTERS = {brand:"",model:"",fuel:"",condition:"",status:"",color:"",body_type:"",yearMin:"",yearMax:"",mileageMax:300000,priceMax:500000,priceMaxUSD:50000,equipment:{}};
const EMPTY_CAR     = {dealer_id:"",brand:"",model:"",year:"",trim:"",body_type:"",condition:"used",status:"available",mileage:"",origin:"imported",price_cny:"",price_usd:"",price_fob:"",price_currency:"CNY",negotiable:false,fuel_type:"",transmission:"",engine_size:"",color:"",doors:"",description:""};
const EMPTY_EQ      = Object.fromEntries(Object.keys(EQUIPMENT_LABELS).map(k=>[k,false]));

const fmt    = n => n!=null ? new Intl.NumberFormat("fr-DZ").format(Math.round(n)) : "—";
const fmtCNY = n => n ? "¥"+new Intl.NumberFormat("zh-CN").format(n) : "—";
// Calculate DZD from either CNY or USD source price
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
  return Math.round((priceUSD + (parseFloat(s.shipment_fee_usd)||0)) * parseFloat(s.usd_dzd_rate));
};

// Get the display price in USD for a car
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
@media(max-width:900px){
  .nav-top{display:none!important;}
  .nav-search{display:none!important;}
  .search-grid{grid-template-columns:1fr!important;}
  .detail-grid{grid-template-columns:1fr!important;}
  .sqlgen-grid{grid-template-columns:1fr!important;}
  .sqlgen-info{position:static!important;}
  .export-grid{grid-template-columns:1fr!important;}
}
@media(max-width:700px){
  .car-card{flex-direction:column!important;}
  .car-card-photo{width:100%!important;min-height:200px!important;}
  .car-card-price{width:100%!important;border-left:none!important;border-top:1px solid #e5e5e5!important;flex-direction:row!important;justify-content:space-between!important;align-items:center!important;padding:10px 14px!important;}
  .filter-grid4{grid-template-columns:1fr 1fr!important;}
  .nav-search{display:none!important;}
  .brand-grid{grid-template-columns:repeat(3,1fr)!important;}
  .specs-grid3{grid-template-columns:repeat(2,1fr)!important;}
  .eq-grid{grid-template-columns:repeat(2,1fr)!important;}
  .form-grid2{grid-template-columns:1fr!important;}
  .form-grid3{grid-template-columns:1fr!important;}
  .page-wrap{padding:78px 12px 40px!important;}
  .sqlgen-dealer-row{grid-template-columns:1fr!important;}
  .sqlgen-stats{grid-template-columns:repeat(2,1fr)!important;}
}
@media(max-width:480px){
  .brand-grid{grid-template-columns:repeat(2,1fr)!important;}
  .nav-main{padding:0 10px!important;}
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
  return <img src={"https://logo.clearbit.com/"+b.d} alt={brand} width={size} height={Math.round(size*.7)} style={{objectFit:"contain"}} onError={()=>setOk(false)}/>;
};

const Navbar = ({page, setPage, search, setSearch}) => (
  <nav style={{background:"#fff",borderBottom:"3px solid #d36135",position:"fixed",top:0,left:0,right:0,zIndex:300,boxShadow:"0 2px 10px rgba(0,0,0,.08)"}}>
    <div className="nav-top" style={{background:"#1c1c1c",padding:"4px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:"#888",fontSize:11,fontWeight:600}}>📍 Algérie — Import direct Chine</span>
      <div style={{display:"flex",gap:20}}>
        {[{id:"home",l:"🚗 Voitures"},{id:"dealers",l:"🏢 Concessionnaires"},{id:"export",l:"📄 Export PDF"},{id:"sql-gen",l:"🛠 SQL Generator"},{id:"settings",l:"⚙️ Paramètres"}].map(item=>(
          <button key={item.id} onClick={()=>setPage(item.id)} style={{background:"none",color:page===item.id?"#d36135":"#999",fontSize:11,fontWeight:700,padding:"2px 0",borderBottom:page===item.id?"1.5px solid #d36135":"1.5px solid transparent"}}>{item.l}</button>
        ))}
      </div>
    </div>
    <div className="nav-main" style={{padding:"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",gap:14}}>
      <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",flexShrink:0}} onClick={()=>setPage("home")}>
        <img
          src="/logo.png"
          alt="El Warcha Auto"
          style={{height:44,width:"auto",objectFit:"contain",flexShrink:0}}
          onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}
        />
        <div style={{display:"none",width:36,height:36,background:"#d36135",borderRadius:6,alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>🔧</div>
        <div>
          <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:19,lineHeight:1}}>EL WARCHA <span style={{color:"#d36135"}}>AUTO</span></div>
          <div style={{fontSize:8,color:"#9a9a9a",fontWeight:700,letterSpacing:".1em"}}>IMPORT • VENTE • ALGÉRIE</div>
        </div>
      </div>
      <div className="nav-search" style={{flex:1,maxWidth:440,position:"relative"}}>
        <input className="f" placeholder="🔍  Marque, modèle, année..." value={search} onChange={e=>setSearch(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&page!=="home")setPage("home");}}
          style={{borderRadius:20,paddingRight:search?32:16,fontSize:13,borderColor:"#e5e5e5",height:34}}/>
        {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#9a9a9a",fontSize:13,padding:2}}>✕</button>}
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
        <div className="mobile-nav" style={{gap:4}}>
          {[{id:"home",l:"🚗"},{id:"dealers",l:"🏢"},{id:"export",l:"📄"},{id:"sql-gen",l:"🛠"},{id:"settings",l:"⚙️"}].map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)} style={{background:page===item.id?"#d36135":"#f2f2f2",color:page===item.id?"#fff":"#555",border:"none",borderRadius:6,padding:"6px 9px",fontSize:15,transition:"all .18s"}}>{item.l}</button>
          ))}
        </div>
        <button className="btn-red" onClick={()=>setPage("add-car")} style={{fontSize:12,padding:"7px 12px"}}>+ Voiture</button>
      </div>
    </div>
  </nav>
);

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
          <div className="filter-grid4" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:12,alignItems:"end"}}>
            <div><label className="lbl">Condition</label>
              <select className="f" style={{fontSize:12}} value={draft.condition} onChange={e=>setDraft(f=>({...f,condition:e.target.value}))}>
                <option value="">Toutes</option><option value="new">Neuf</option><option value="used">Occasion</option>
              </select></div>
            <div><label className="lbl">Carburant</label>
              <select className="f" style={{fontSize:12}} value={draft.fuel} onChange={e=>setDraft(f=>({...f,fuel:e.target.value}))}>
                <option value="">Tous</option>{FUEL_TYPES.map(f=><option key={f}>{f}</option>)}
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:10}}>
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

const CarCard = ({car, settings, onClick}) => {
  const dzd    = calcDZD(car.price_cny, settings, car.price_usd, car.price_currency);
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
          <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:21,color:"#d36135",lineHeight:1}}>{car.price_currency==='USD'?('$'+new Intl.NumberFormat('fr-DZ').format(Math.round(car.price_usd||0))):fmtCNY(car.price_cny)}</div>
          {dzd&&(
            <div style={{marginTop:5,padding:"4px 8px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:5}}>
              <div style={{fontSize:8,color:"#92400e",fontWeight:700}}>≈ DZD</div>
              <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:13,color:"#92400e"}}>{fmt(dzd)}</div>
            </div>
          )}
        </div>
        {car.price_fob&&<div style={{fontSize:9,background:"#f0f9ff",color:"#0369a1",fontWeight:700,padding:"2px 6px",borderRadius:3,border:"1px solid #bae6fd",marginBottom:3}}>FOB ${new Intl.NumberFormat("fr-DZ").format(car.price_fob)}</div>}
        <div style={{fontSize:9,color:"#9a9a9a",fontWeight:600}}>{new Date(car.created_at||Date.now()).toLocaleDateString("fr-DZ")}</div>
      </div>
    </div>
  );
};

const HomePage = ({cars, settings, loading, setPage, setSelectedCar, search, setSearch}) => {
  const [filters, setFilters] = useState({...EMPTY_FILTERS});
  const filtered = cars.filter(c => {
    const q = search.toLowerCase();
    if (q && !((c.brand+" "+c.model+" "+c.year+" "+(c.trim||"")+" "+(c.dealers?.name||"")).toLowerCase().includes(q))) return false;
    if (filters.brand     && c.brand!==filters.brand) return false;
    if (filters.model     && c.model!==filters.model) return false;
    if (filters.fuel      && c.fuel_type!==filters.fuel) return false;
    if (filters.condition && c.condition!==filters.condition) return false;
    if (filters.status    && c.status!==filters.status) return false;
    if (filters.color     && c.color!==filters.color) return false;
    if (filters.body_type && c.body_type!==filters.body_type) return false;
    if (filters.yearMin   && c.year < parseInt(filters.yearMin)) return false;
    if (filters.yearMax   && c.year > parseInt(filters.yearMax)) return false;
    if ((filters.mileageMax||300000)<300000 && (c.mileage||0)>filters.mileageMax) return false;
    if ((filters.priceMax||500000)<500000   && c.price_currency!=="USD" && (c.price_cny||0)>filters.priceMax) return false;
    if ((filters.priceMaxUSD||50000)<50000  && c.price_currency==="USD"  && (c.price_usd||0)>filters.priceMaxUSD) return false;
    if (filters.equipment) for (const [k,v] of Object.entries(filters.equipment)) if (v && !c.car_equipment?.[0]?.[k]) return false;
    return true;
  });
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
          <div style={{display:"flex",gap:18,flexShrink:0}}>
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
      </div>
      {loading?<Spinner/>:filtered.length===0?(
        <div className="card" style={{textAlign:"center",padding:60,color:"#9a9a9a"}}><div style={{fontSize:36,marginBottom:10}}>🔍</div><p style={{fontWeight:700,fontSize:15}}>Aucun véhicule trouvé</p><p style={{fontSize:12,marginTop:4}}>Modifiez vos filtres</p></div>
      ):(
        <div className="au">{filtered.map(car=><CarCard key={car.id} car={car} settings={settings} onClick={()=>{setSelectedCar(car);setPage("car-detail");}}/>)}</div>
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
  const [priceCur, setPriceCur] = useState(initial.price_currency || 'CNY');
  // Each entry: {src: string (dataURL or http URL), file: File|null}
  const [photos, setPhotos] = useState(
    (initial._existingPhotos||[]).map(url=>({src:url, file:null}))
  );
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  // Price input: CNY stores in price_cny, USD stores in price_usd
  const handlePriceInput = e => {
    const val = e.target.value;
    if (priceCur === 'CNY') {
      setForm(f => ({...f, price_cny: val, price_usd: null, price_currency: 'CNY'}));
    } else {
      setForm(f => ({...f, price_usd: val, price_cny: null, price_currency: 'USD'}));
    }
  };
  const priceInputVal = priceCur === 'CNY' ? (form.price_cny||'') : (form.price_usd||'');

  // Live DZD preview
  const previewDZD = priceCur === 'CNY'
    ? calcDZD(parseFloat(form.price_cny)||0, settings)
    : calcDZD(null, settings, parseFloat(form.price_usd)||0, 'USD');

  // Show equivalent in the other currency
  const priceEquiv = priceCur === 'CNY' && form.price_cny && settings?.cny_usd_rate
    ? `≈ $${(parseFloat(form.price_cny) * parseFloat(settings.cny_usd_rate)).toFixed(0)} USD`
    : priceCur === 'USD' && form.price_usd && settings?.cny_usd_rate
    ? `≈ ¥${new Intl.NumberFormat("zh-CN").format(Math.round(parseFloat(form.price_usd) / parseFloat(settings.cny_usd_rate)))} CNY`
    : null;

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
        <div style={{display:"flex",gap:0,borderRadius:8,overflow:"hidden",border:"1.5px solid #ddd",width:"fit-content"}}>
          {[{v:"CNY",l:"¥ Yuan (CNY)"},{v:"USD",l:"$ Dollar (USD)"}].map(cur=>(
            <button key={cur.v} type="button" onClick={()=>{setPriceCur(cur.v);setForm(f=>({...f,price_currency:cur.v,price_cny:null,price_usd:null}));}}
              style={{padding:"8px 24px",fontWeight:700,fontSize:13,border:"none",background:priceCur===cur.v?"#d36135":"#fff",color:priceCur===cur.v?"#fff":"#555",transition:"all .18s",cursor:"pointer"}}>
              {cur.l}
            </button>
          ))}
        </div>
        <FF label={priceCur==="CNY"?"Prix en Yuan ¥":"Prix en Dollar $"}>
          <input className="f" type="number" value={priceInputVal} onChange={handlePriceInput}
            placeholder={priceCur==="CNY"?"ex: 150 000 ¥":"ex: 20 000 $"}/>
        </FF>
        {priceEquiv&&<div style={{fontSize:11,color:"#9a9a9a",fontWeight:600,marginTop:-4}}>{priceEquiv}</div>}
        <FF label="Prix FOB (optionnel $)">
          <input className="f" type="number" value={form.price_fob||''} onChange={set("price_fob")} placeholder="ex: 7300 (Free On Board)"/>
        </FF>
        {previewDZD>0&&(
          <div style={{padding:"9px 13px",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"#92400e",fontWeight:700}}>Estimation DZD :</span>
            <span style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:16,color:"#92400e"}}>{fmt(previewDZD)} DZD</span>
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
        price_cny: form.price_currency==='CNY' ? parseFloat(form.price_cny)||null : null,
        price_usd: form.price_currency==='USD' ? parseFloat(form.price_usd)||null : null,
        price_fob: parseFloat(form.price_fob)||null,
        price_currency: form.price_currency||'CNY',
        doors: parseInt(form.doors)||null,
        photos: [],
      };
      delete data._existingPhotos;
      const newCar = await createCar(data, eq);
      // Upload all photos
      let photoUrls = [];
      for (const file of files) {
        try { const url = await uploadCarPhoto(newCar.id, file); if (url) photoUrls.push(url); } catch(_) {}
      }
      if (photoUrls.length) await updateCar(newCar.id, {photos: photoUrls});
      // Resolve dealer from the dealers list (compare as strings to be safe)
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
  const dealer=car.dealers; const eq=car.car_equipment?.[0]||{}; const dzd=calcDZD(car.price_cny,settings,car.price_usd,car.price_currency); const photos=car.photos||[];
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
                  <div style={{position:"absolute",bottom:12,right:14,background:"rgba(0,0,0,.6)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:12}}>{activePhoto+1}/{photos.length}</div>
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
        <div style={{display:"flex",flexDirection:"column",gap:12,position:"sticky",top:100}}>
          <div className="card" style={{padding:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:42,height:42,background:"#f2f2f2",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><BrandLogo brand={car.brand} size={34}/></div>
              <div><h1 style={{fontSize:21,fontWeight:900,lineHeight:1.1}}>{car.year} {car.brand} {car.model}</h1>{car.trim&&<p style={{color:"#9a9a9a",fontSize:11,fontWeight:600}}>{car.trim}</p>}</div>
            </div>
            <div style={{background:"#f2f2f2",borderRadius:8,padding:"11px 14px",marginBottom:8,borderLeft:"4px solid #d36135"}}>
              <div style={{fontSize:9,color:"#9a9a9a",fontWeight:700,letterSpacing:".1em",marginBottom:2}}>PRIX</div>
              <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:28,color:"#d36135",lineHeight:1}}>{car.price_currency==='USD'?('$ '+new Intl.NumberFormat('fr-DZ').format(Math.round(car.price_usd||0))):fmtCNY(car.price_cny)}</div>
            </div>
            {car.price_fob&&<div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"9px 14px",marginBottom:8}}><div style={{fontSize:9,color:"#0369a1",fontWeight:700,letterSpacing:".08em",marginBottom:2}}>PRIX FOB</div><div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:18,color:"#0369a1"}}>${new Intl.NumberFormat("fr-DZ").format(car.price_fob)}</div></div>}
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
    price_usd: car.price_usd||"", price_currency: car.price_currency||"CNY",
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
      data.price_cny = data.price_currency==='CNY' ? parseFloat(data.price_cny)||null : null;
      data.price_usd = data.price_currency==='USD' ? parseFloat(data.price_usd)||null : null;
      data.price_fob = parseFloat(data.price_fob)||null;
      data.doors = parseInt(data.doors)||null;
      // Keep existing http URLs that weren't removed, then append new uploads
      const existingUrls = allPreviews.filter(p => typeof p==="string" && p.startsWith("http"));
      let newUrls = [];
      for (const file of newFiles) {
        try { const url = await uploadCarPhoto(car.id, file); if (url) newUrls.push(url); } catch(_) {}
      }
      const allPhotos = [...existingUrls, ...newUrls];
      await updateCar(car.id, {...data, photos: allPhotos}, eq);
      // Resolve updated dealer name from full list
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

const DealersPage = ({dealers, cars, loading, setPage, setSelectedDealer, onDeleteDealer, showToast}) => (
  <div className="page-wrap" style={{padding:"86px 20px 40px",maxWidth:1200,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18,flexWrap:"wrap",gap:10}}>
      <div><h1 style={{fontSize:26,fontWeight:900}}>Concessionnaires</h1><p style={{color:"#9a9a9a",fontSize:13}}>{dealers.length} partenaire{dealers.length!==1?"s":""}</p></div>
      <button className="btn-red" onClick={()=>setPage("add-dealer")}>+ Ajouter</button>
    </div>
    {loading?<Spinner/>:(
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
        {dealers.map(d=>{
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

const DealerDetailPage = ({dealer, cars, settings, setPage, setSelectedCar, setSelectedDealer, onDeleteDealer}) => {
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
        :dc.map(car=><CarCard key={car.id} car={car} settings={settings} onClick={()=>{setSelectedCar(car);setPage("car-detail");}}/>)
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
          <div className="form-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
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
          <div className="form-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
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
    cny_usd_rate:   settings?.cny_usd_rate   || '',
    usd_dzd_rate:   settings?.usd_dzd_rate   || '',
    shipment_fee_usd: settings?.shipment_fee_usd || '',
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
        rates_updated_at: new Date().toISOString(),
      });
      setSettings(u);
      showToast("Paramètres sauvegardés !","success");
    } catch(e) { showToast("Erreur: "+e.message,"error"); }
    finally { setSaving(false); }
  };

  const previewCNY = form.cny_usd_rate && form.usd_dzd_rate
    ? Math.round((100000 * parseFloat(form.cny_usd_rate) + parseFloat(form.shipment_fee_usd||0)) * parseFloat(form.usd_dzd_rate))
    : null;
  const previewUSD = form.usd_dzd_rate
    ? Math.round((20000 + parseFloat(form.shipment_fee_usd||0)) * parseFloat(form.usd_dzd_rate))
    : null;

  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:560,margin:"0 auto"}}>
      <h1 style={{fontSize:24,fontWeight:900,marginBottom:18}}>⚙️ Paramètres</h1>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Sec title="Taux de change — saisie manuelle">
          <p style={{fontSize:12,color:"#9a9a9a",marginBottom:4}}>Définissez vos propres taux. Ces valeurs sont utilisées pour toutes les conversions de prix.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
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
        {(previewCNY||previewUSD)&&(
          <Sec title="Aperçu des formules">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {previewCNY&&(
                <div style={{background:"#f8f8f8",borderRadius:8,padding:"12px 14px",border:"1px solid #e5e5e5"}}>
                  <div style={{fontSize:10,color:"#9a9a9a",fontWeight:700,marginBottom:4}}>¥100 000 CNY →</div>
                  <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:18,color:"#d36135"}}>{fmt(previewCNY)} DZD</div>
                  <code style={{fontSize:9,color:"#9a9a9a",display:"block",marginTop:4}}>
                    (100K × {parseFloat(form.cny_usd_rate)||0} + {parseFloat(form.shipment_fee_usd)||0}$) × {parseFloat(form.usd_dzd_rate)||0}
                  </code>
                </div>
              )}
              {previewUSD&&(
                <div style={{background:"#f8f8f8",borderRadius:8,padding:"12px 14px",border:"1px solid #e5e5e5"}}>
                  <div style={{fontSize:10,color:"#9a9a9a",fontWeight:700,marginBottom:4}}>$20 000 USD →</div>
                  <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:18,color:"#d36135"}}>{fmt(previewUSD)} DZD</div>
                  <code style={{fontSize:9,color:"#9a9a9a",display:"block",marginTop:4}}>
                    (20K + {parseFloat(form.shipment_fee_usd)||0}$) × {parseFloat(form.usd_dzd_rate)||0}
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
  {k:"price_cny",l:"Prix CNY"},{k:"price_usd",l:"Prix USD"},{k:"price_fob",l:"Prix FOB"},{k:"total_usd",l:"Total USD (+ transport)"},{k:"total_dzd",l:"Total DZD"},{k:"fuel_type",l:"Carburant"},
  {k:"transmission",l:"Transmission"},{k:"engine_size",l:"Cylindrée"},
  {k:"color",l:"Couleur"},{k:"doors",l:"Portes"},{k:"negotiable",l:"Négociable"},
  {k:"dealers.name",l:"Concessionnaire"},
];
const GROUP_OPTIONS = [
  {k:"dealers.name",l:"Concessionnaire"},
  {k:"brand",l:"Marque"},
  {k:"brand_model",l:"Marque + Modèle"},
  {k:"model",l:"Modèle"},
  {k:"status",l:"Statut"},
  {k:"condition",l:"Condition"},
  {k:"fuel_type",l:"Carburant"},
  {k:"body_type",l:"Carrosserie"},
  {k:"color",l:"Couleur"},
  {k:"origin",l:"Origine"},
  {k:"year",l:"Année"},
];
const SORT_OPTIONS = [
  {k:"price_cny",l:"Prix CNY"},{k:"price_usd",l:"Prix USD"},
  {k:"year",l:"Année"},{k:"mileage",l:"Kilométrage"},
  {k:"brand",l:"Marque"},{k:"model",l:"Modèle"},
  {k:"dealers.name",l:"Concessionnaire"},
];

const getFieldVal = (car, key, settings=null) => {
  // Computed keys — must be checked BEFORE the early-return on car[key]
  if (key === "brand_model") return (car.brand||"?") + " " + (car.model||"?");
  if (key === "dealers.name") return car.dealers?.name || "—";
  if (key === "total_usd") {
    const priceUSD = car.price_currency==="USD"
      ? parseFloat(car.price_usd||0)
      : parseFloat(car.price_cny||0) * parseFloat(settings?.cny_usd_rate||0);
    const total = priceUSD + parseFloat(settings?.shipment_fee_usd||0);
    return total>0 ? "$"+new Intl.NumberFormat("fr-DZ").format(Math.round(total)) : "—";
  }
  if (key === "total_dzd") {
    const dzd = calcDZD(car.price_cny, settings, car.price_usd, car.price_currency);
    return dzd ? new Intl.NumberFormat("fr-DZ").format(dzd)+" DZD" : "—";
  }
  // Real car fields
  const v = car[key];
  if (v === null || v === undefined || v === "") return "—";
  if (key === "negotiable") return v ? "Oui" : "Non";
  if (key === "mileage") return fmt(v) + " km";
  if (key === "condition") return v === "new" ? "Neuf" : "Occasion";
  if (key === "status") return {available:"Disponible",sold:"Vendu",reserved:"Réservé"}[v] || v;
  if (key === "origin") return v === "imported" ? "Importé" : "Local";
  if (key === "price_cny") return "¥" + new Intl.NumberFormat("zh-CN").format(v);
  if (key === "price_usd") return "$" + new Intl.NumberFormat("fr-DZ").format(Math.round(v));
  if (key === "price_fob") return "FOB $" + new Intl.NumberFormat("fr-DZ").format(Math.round(v));
  return String(v);
};

const ExportPage = ({cars, dealers, settings, setPage, showToast}) => {
  const BASE_URL = window.location.origin;

  // ── Filter state (same as HomePage) ──
  const [filters, setFilters]   = useState({...EMPTY_FILTERS});
  const [search,  setSearch2]   = useState("");

  // ── Export config ──
  const [groupBy,   setGroupBy]   = useState("dealers.name");
  const [sortBy,    setSortBy]    = useState("price_cny");
  const [sortDir,   setSortDir]   = useState("asc");
  const [selFields, setSelFields] = useState(["brand","model","year","trim","status","price_usd","price_fob","total_usd","total_dzd"]);
  const [printing,  setPrinting]  = useState(false);

  const toggleField = k => setSelFields(f => f.includes(k) ? f.filter(x=>x!==k) : [...f,k]);

  // Apply filters (same logic as HomePage)
  const filtered = cars.filter(c => {
    const q = search.toLowerCase();
    if (q && !((c.brand+" "+c.model+" "+c.year+" "+(c.trim||"")+" "+(c.dealers?.name||"")).toLowerCase().includes(q))) return false;
    if (filters.brand     && c.brand!==filters.brand) return false;
    if (filters.model     && c.model!==filters.model) return false;
    if (filters.fuel      && c.fuel_type!==filters.fuel) return false;
    if (filters.condition && c.condition!==filters.condition) return false;
    if (filters.status    && c.status!==filters.status) return false;
    if (filters.color     && c.color!==filters.color) return false;
    if (filters.body_type && c.body_type!==filters.body_type) return false;
    if (filters.yearMin   && c.year < parseInt(filters.yearMin)) return false;
    if (filters.yearMax   && c.year > parseInt(filters.yearMax)) return false;
    if ((filters.mileageMax||300000)<300000 && (c.mileage||0)>filters.mileageMax) return false;
    if ((filters.priceMax||500000)<500000   && c.price_currency!=="USD" && (c.price_cny||0)>filters.priceMax) return false;
    if ((filters.priceMaxUSD||50000)<50000  && c.price_currency==="USD"  && (c.price_usd||0)>filters.priceMaxUSD) return false;
    if (filters.equipment) for (const [k,v] of Object.entries(filters.equipment)) if (v && !c.car_equipment?.[0]?.[k]) return false;
    return true;
  });

  // Sort helper
  const getSortVal = (car, key) => {
    if (key === "dealers.name") return car.dealers?.name?.toLowerCase() || "";
    const v = car[key];
    return typeof v === "string" ? v.toLowerCase() : (v ?? 0);
  };

  // Group + sort
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

  // ── PDF Generation ──
  const exportPDF = () => {
    setPrinting(true);
    // Build HTML for print
    const cols = selFields.map(k => EXPORT_FIELDS.find(f=>f.k===k)).filter(Boolean);
    const now = new Date().toLocaleString("fr-DZ");

    const groupRows = grouped.map(([gName, gcars]) => {
      // Build rows with rowspan: detect consecutive identical values per column
      const rowData = gcars.map(car => {
        const params = new URLSearchParams();
        if (car.brand)         params.set('brand',  car.brand);
        if (car.model)         params.set('model',  car.model);
        if (car.year)          params.set('year',   String(car.year));
        if (car.dealers?.name) params.set('dealer', car.dealers.name);
        if (car.trim)          params.set('trim',   car.trim);
        if (car.color)         params.set('color',  car.color);
        const link = BASE_URL + '/?' + params.toString();
        return { vals: cols.map(col => getFieldVal(car, col.k, settings)), link };
      });

      // Compute rowspans per column
      const spanMatrix = cols.map((_, ci) => {
        const spans = new Array(rowData.length).fill(1);
        for (let i = rowData.length - 2; i >= 0; i--) {
          if (rowData[i].vals[ci] === rowData[i+1].vals[ci] && rowData[i].vals[ci] !== "—") {
            spans[i] = spans[i+1] + 1;
            spans[i+1] = 0; // hidden
          }
        }
        return spans;
      });

      const rows = rowData.map((row, ri) => {
        const cells = cols.map((col, ci) => {
          const span = spanMatrix[ci][ri];
          if (span === 0) return '';
          const rs = span > 1 ? ` rowspan="${span}"` : '';
          const bg = span > 1 ? ' style="background:#fff8f8;font-weight:700;"' : '';
          return `<td${rs}${bg}>${row.vals[ci]}</td>`;
        }).join("");
        return `<tr>${cells}<td><a href="${row.link}" style="color:#d36135;font-size:10px;">🔗 Voir</a></td></tr>`;
      }).join("");

      return `
        <tr class="group-header"><td colspan="${cols.length+1}">${gName} — ${gcars.length} véhicule${gcars.length!==1?"s":""}</td></tr>
        ${rows}
      `;
    }).join("");

    const headerCells = cols.map(c=>`<th>${c.l}</th>`).join("") + "<th>Lien</th>";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Export El Warcha Auto</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:Arial,sans-serif;font-size:11px;color:#1c1c1c;padding:20px;}
      h1{font-size:18px;margin-bottom:4px;color:#1c1c1c;}
      .sub{font-size:10px;color:#888;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;margin-top:8px;}
      th{background:#1c1c1c;color:#fff;padding:6px 8px;text-align:left;font-size:10px;white-space:nowrap;}
      td{padding:5px 8px;border-bottom:1px solid #e5e5e5;vertical-align:top;}
      tr:nth-child(even) td{background:#f9f9f9;}
      .group-header td{background:#d36135;color:#fff;font-weight:700;font-size:11px;padding:6px 10px;letter-spacing:.04em;}
      @media print{
        body{padding:10px;}
        a{color:#d36135!important;}
        .group-header td{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#d36135!important;}
        th{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#1c1c1c!important;}
      }
    </style></head><body>
    <h1>🔧 EL WARCHA AUTO — Export</h1>
    <div class="sub">Généré le ${now} · ${totalCars} véhicule${totalCars!==1?"s":""} · Groupé par : ${GROUP_OPTIONS.find(g=>g.k===groupBy)?.l} · Trié par : ${SORT_OPTIONS.find(s=>s.k===sortBy)?.l} (${sortDir==="asc"?"croissant":"décroissant"})</div>
    <table><thead><tr>${headerCells}</tr></thead><tbody>${groupRows}</tbody></table>
    </body></html>`;

    const win = window.open("","_blank","width=1100,height=800");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(()=>{ win.print(); setPrinting(false); }, 600);
  };

  return (
    <div className="page-wrap" style={{padding:"86px 20px 60px",maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:900}}>📄 Export PDF</h1>
          <p style={{color:"#9a9a9a",fontSize:13}}>{totalCars} véhicule{totalCars!==1?"s":""} sélectionné{totalCars!==1?"s":""}</p>
        </div>
        <button className="btn-red" onClick={exportPDF} disabled={printing||totalCars===0} style={{fontSize:13,padding:"10px 24px"}}>
          {printing?"⏳ Génération...":"📥 Exporter PDF"}
        </button>
      </div>

      <div className="export-grid" style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Filters */}
          <SearchPanel filters={filters} setFilters={setFilters} cars={cars}/>
          <div className="card" style={{padding:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <input className="f" placeholder="🔍 Recherche rapide..." value={search} onChange={e=>setSearch2(e.target.value)} style={{fontSize:13}}/>
              {search&&<button className="btn-out" onClick={()=>setSearch2("")} style={{fontSize:11}}>✕</button>}
            </div>
          </div>

          {/* Preview */}
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

        {/* Config panel */}
        <div style={{display:"flex",flexDirection:"column",gap:12,position:"sticky",top:96}}>
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
                <button key={d.v} onClick={()=>setSortDir(d.v)}
                  style={{flex:1,padding:"7px 4px",fontSize:11,fontWeight:700,border:"none",background:sortDir===d.v?"#1c1c1c":"#fff",color:sortDir===d.v?"#fff":"#555",cursor:"pointer"}}>
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:16}}>
            <h3 style={{fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:".06em",marginBottom:12,paddingBottom:8,borderBottom:"1px solid #e5e5e5"}}>📋 Colonnes dans le PDF</h3>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {EXPORT_FIELDS.map(f=>(
                <label key={f.k} style={{display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:600,cursor:"pointer",padding:"4px 6px",borderRadius:5,background:selFields.includes(f.k)?"#f0fdf4":"transparent",border:"1px solid "+(selFields.includes(f.k)?"#a7f3d0":"transparent")}}>
                  <input type="checkbox" checked={selFields.includes(f.k)} onChange={()=>toggleField(f.k)} style={{accentColor:"#d36135",width:13,height:13}}/>
                  {f.l}
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
const SQL_EQ_COLS = ['cd_dvd','sun_roof','leather_seat','power_seat','seat_heating',
  'seat_ventilation','alloy_wheel','tv','power_window','auto_ac',
  'abs','driver_airbag','camera_360','adaptive_cruise'];

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
    const cols = ['id','dealer_id','brand','model','year','trim','body_type',
      'condition','status','origin','price_usd','price_currency','fuel_type','transmission'];
    const vals = [cid, dealerUUID,
      car.brand||'Autre', car.model||'', car.year||null, car.trim||null,
      car.body_type||'SUV','new','available','imported',
      car.price_usd||null,'USD', car.fuel_type||'Essence', car.transmission||null];
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
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: rawText }]
        })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const raw = (data.content?.[0]?.text || '').replace(/```json|```/g,'').trim();
      const cars = JSON.parse(raw);
      if (!Array.isArray(cars) || cars.length === 0) throw new Error('Aucune voiture trouvée dans le texte.');
      const generated = buildCarSQL(cars, dealerName.trim(), uuid);
      setSql(generated);
      setStats({
        total: cars.length,
        colored: cars.filter(c=>c.color).length,
        fob: cars.filter(c=>c.price_fob).length,
        sunroof: cars.filter(c=>c.equipment?.sun_roof).length,
      });
      saveHistory(dealerName.trim(), uuid, cars.length, rawText, generated);
      showToast(`${cars.length} voitures générées pour "${dealerName}"`, 'success');
    } catch(e) {
      showToast('Erreur: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(dealerName||'dealer').toLowerCase().replace(/\s+/g,'-')}-${Date.now()}.sql`;
    a.click();
  };

  const loadFromHistory = h => {
    setDealerName(h.name);
    setDealerUUID(h.uuid);
    setRawText(h.text);
    setSql(h.sql || '');
    setActiveTab('generate');
  };

  const GTab = ({id, label}) => (
    <button onClick={()=>setActiveTab(id)} style={{
      background:'none', border:'none', padding:'8px 16px', fontSize:13, fontWeight:700,
      color: activeTab===id ? '#d36135' : '#9a9a9a', cursor:'pointer',
      borderBottom: activeTab===id ? '2px solid #d36135' : '2px solid transparent',
      marginBottom:-1, transition:'color .15s',
    }}>{label}</button>
  );

  const Tag = ({children}) => (
    <span style={{display:'inline-block',background:'rgba(232,0,29,.1)',color:'#d36135',
      border:'1px solid rgba(232,0,29,.2)',borderRadius:4,padding:'1px 7px',
      fontSize:11,fontWeight:700,fontFamily:'monospace',margin:'2px 2px 2px 0'}}>{children}</span>
  );

  return (
    <div style={{padding:'86px 20px 60px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:26,fontWeight:900,marginBottom:4}}>🛠 SQL <span style={{color:'#d36135'}}>Generator</span></h1>
        <p style={{color:'#9a9a9a',fontSize:13}}>Colle le texte brut d'un dealer — l'IA génère les INSERT SQL prêts à exécuter dans Supabase.</p>
      </div>

      <div className="sqlgen-grid" style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start'}}>
        {/* LEFT */}
        <div>
          {/* Tabs */}
          <div style={{borderBottom:'1px solid #e5e5e5',marginBottom:16,display:'flex'}}>
            <GTab id="generate" label="Générer SQL"/>
            <GTab id="history" label={`Historique (${history.length})`}/>
          </div>

          {activeTab === 'generate' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* Dealer info */}
              <div className="card" style={{padding:18}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #e5e5e5'}}>
                  <div style={{width:3,height:15,background:'#d36135',borderRadius:2,flexShrink:0}}/>
                  <h3 style={{fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'.06em'}}>Informations dealer</h3>
                </div>
                <div className="sqlgen-dealer-row" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div>
                    <label className="lbl">Nom du dealer *</label>
                    <input className="f" value={dealerName} onChange={e=>setDealerName(e.target.value)} placeholder="ex: Lucas"/>
                  </div>
                  <div>
                    <label className="lbl">UUID dealer (optionnel)</label>
                    <input className="f" value={dealerUUID} onChange={e=>setDealerUUID(e.target.value)} placeholder="Auto-généré" style={{fontFamily:'monospace',fontSize:11}}/>
                  </div>
                </div>
              </div>

              {/* Text input */}
              <div className="card" style={{padding:18}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,paddingBottom:8,borderBottom:'1px solid #e5e5e5'}}>
                  <div style={{width:3,height:15,background:'#d36135',borderRadius:2,flexShrink:0}}/>
                  <h3 style={{fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'.06em'}}>Texte brut du dealer</h3>
                </div>
                <textarea className="f" value={rawText} onChange={e=>setRawText(e.target.value)}
                  rows={12} style={{resize:'vertical',fontFamily:'monospace',fontSize:12,lineHeight:1.65}}
                  placeholder={"- livan x3 pro MT / CVT\n  MT：7600$ (white/gray)\n  7700$ (black/silver)\n- MG5 MT 2023 edition 7700$\n- Geely coolray super MT 8800$ (gray stock ready on port)\n- Jetour dashing 2026 full option 17800$ (English system)\n..."}/>
              </div>

              {/* Generate button */}
              <button className="btn-red" onClick={handleGenerate} disabled={loading}
                style={{padding:14,fontSize:14,justifyContent:'center',width:'100%'}}>
                {loading ? '⏳ Génération en cours...' : '⚡ Générer SQL'}
              </button>

              {/* Stats */}
              {stats && (
                <div className="sqlgen-stats" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                  {[
                    {n:stats.total,   l:'Voitures'},
                    {n:stats.colored, l:'Avec couleur'},
                    {n:stats.fob,     l:'Prix FOB'},
                    {n:stats.sunroof, l:'Toit ouvrant'},
                  ].map(s=>(
                    <div key={s.l} className="card" style={{padding:'10px 14px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:26,color:'#d36135',lineHeight:1}}>{s.n}</div>
                      <div style={{fontSize:10,color:'#9a9a9a',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginTop:2}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* SQL output */}
              {sql && (
                <div className="card" style={{padding:18}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <h3 style={{fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'.06em'}}>SQL Généré</h3>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn-out" onClick={handleDownload} style={{fontSize:11,padding:'6px 12px'}}>⬇ .sql</button>
                      <button className="btn-out" onClick={handleCopy} style={{fontSize:11,padding:'6px 12px',color:copied?'#16a34a':'inherit',borderColor:copied?'#a7f3d0':'inherit'}}>
                        {copied ? '✓ Copié !' : '⎘ Copier'}
                      </button>
                    </div>
                  </div>
                  <pre style={{background:'#1c1c1c',color:'#e2e8f0',borderRadius:8,padding:16,
                    fontSize:11,fontFamily:'monospace',lineHeight:1.75,
                    overflowX:'auto',maxHeight:480,overflowY:'auto',
                    border:'1px solid #2e2e2e',whiteSpace:'pre'}}>{sql}</pre>
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
                <div style={{textAlign:'center',padding:40,color:'#9a9a9a'}}>
                  <div style={{fontSize:28,marginBottom:8}}>🕐</div>
                  <p style={{fontWeight:700}}>Aucun historique</p>
                  <p style={{fontSize:12,marginTop:4}}>Génère ton premier SQL pour le voir ici.</p>
                </div>
              ) : history.map((h,i) => (
                <div key={i} onClick={()=>loadFromHistory(h)}
                  style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'11px 14px',borderRadius:8,border:'1px solid #e5e5e5',
                    marginBottom:8,cursor:'pointer',transition:'border-color .15s,background .15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='#bbb';e.currentTarget.style.background='#fafafa';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e5e5';e.currentTarget.style.background='';}}
                >
                  <div>
                    <div style={{fontWeight:800,fontSize:14,marginBottom:2}}>{h.name}</div>
                    <div style={{fontSize:11,color:'#9a9a9a'}}>
                      {new Date(h.date).toLocaleString('fr-DZ')}
                      <span style={{fontFamily:'monospace',marginLeft:8,fontSize:10}}>{h.uuid?.slice(0,13)}...</span>
                    </div>
                  </div>
                  <div style={{fontFamily:"'Barlow Condensed'",fontWeight:900,fontSize:28,color:'#d36135'}}>{h.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Info panel */}
        <div className="sqlgen-info" style={{position:'sticky',top:96,display:'flex',flexDirection:'column',gap:12}}>
          <div className="card" style={{padding:16}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'#9a9a9a',marginBottom:10}}>Règles de l'IA</div>
            {[
              ['white/gray', '→ 2 lignes : Blanc + Gris'],
              ['black/silver', '→ 2 lignes : Noir + Argent'],
              ['MT / AT', '→ Manuelle / Automatique'],
              ['FOB price', '→ price_usd + price_fob'],
              ['sunroof', '→ sun_roof = TRUE'],
              ['Trims différents', '→ 1 ligne par trim'],
            ].map(([k,v]) => (
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
            <div>
              {['Livan','MG','GAC','Geely','Kia','Roewe','Jetour','Renault','BYD','Chery','Haval','Changan','+ autres'].map(b=>(
                <Tag key={b}>{b}</Tag>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [page,    setPage]    = useState("home");
  const [cars,    setCars]    = useState([]);
  const [dealers, setDealers] = useState([]);
  const [settings,setSettings]= useState(null);
  const [selectedCar,    setSelectedCar]    = useState(null);
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
        // Deep-link: search by car info params
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

  // ── Cars ──
  const handleAddCar    = car  => setCars(prev=>[car, ...prev]);
  const handleUpdateCar = updated => {
    setCars(prev=>prev.map(c=>c.id===updated.id ? updated : c));
    setSelectedCar(updated);
  };
  const handleDeleteCar = id => {
    if (!window.confirm("Supprimer ce véhicule ?")) return;
    deleteCar(id)
      .then(()=>{ setCars(prev=>prev.filter(c=>c.id!==id)); showToast("Véhicule supprimé","success"); setPage("home"); })
      .catch(e=>showToast("Erreur: "+e.message,"error"));
  };

  // ── Dealers ──
  const handleAddDealer    = d => setDealers(prev=>[d, ...prev]);
  const handleUpdateDealer = updated => {
    setDealers(prev=>prev.map(d=>d.id===updated.id ? updated : d));
    setSelectedDealer(updated);
  };
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
        return <HomePage {...p} cars={cars} loading={loading} setSelectedCar={setSelectedCar} search={search} setSearch={setSearch}/>;
      case "car-detail":
        return selectedCar
          ? <CarDetailPage {...p} car={selectedCar} dealers={dealers}
              onDelete={handleDeleteCar} onUpdate={handleUpdateCar}/>
          : null;
      case "dealers":
        return <DealersPage {...p} dealers={dealers} cars={cars} loading={loading}
          setSelectedDealer={setSelectedDealer} onDeleteDealer={handleDeleteDealer}/>;
      case "dealer-detail":
        return selectedDealer
          ? <DealerDetailPage {...p} dealer={selectedDealer} cars={cars}
              setSelectedCar={setSelectedCar} setSelectedDealer={setSelectedDealer}
              onDeleteDealer={handleDeleteDealer}/>
          : null;
      case "add-dealer":
        return <AddDealerPage {...p} onAdd={handleAddDealer}/>;
      case "edit-dealer":
        return selectedDealer
          ? <EditDealerPage {...p} dealer={selectedDealer} onUpdate={handleUpdateDealer}/>
          : null;
      case "add-car":
        return <AddCarPage {...p} dealers={dealers} onAdd={handleAddCar}/>;
      case "export":
        return <ExportPage {...p} cars={cars} dealers={dealers}/>;
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
