/* ================== 設定（部署時只需要改這裡） ================== */
const CONFIG = {
  APP_NAME: '匹克球教練筆記',
  // 到 Google Cloud Console 建立「OAuth 用戶端 ID（網頁應用程式）」後貼在這裡
  GOOGLE_CLIENT_ID: '1077129293968-bf6dib39uopauv90j3l9107ardu57290.apps.googleusercontent.com',
  DRIVE_FOLDER: '匹克球教練筆記',
  // 舊版用過的資料夾名稱，改名前就在用的人要能繼續找到自己的資料
  LEGACY_FOLDERS: ['匹克球教練本'],
  DRIVE_FILE: 'coach-data.json',
  PRIVACY_URL: 'privacy.html',
  // 新增可登入的教練：Google 的「測試人員」名單（Google 沒有開放用程式管理，只能在這一頁操作）
  USERS_URL: 'https://console.cloud.google.com/auth/audience',
  VERSION: '1.9.1'
};
const SCOPES = 'https://www.googleapis.com/auth/drive.file openid email profile';
const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

/* ================== 常數 ================== */
// 技術評分項目的預設值；教練可以在設定裡自己增減（存在 settings.skills）
const DEFAULT_SKILLS=[['serve','發球'],['return','接發球'],['dink','小球 Dink'],['drop','第三拍吊球'],['drive','抽球'],['volley','截擊'],['footwork','步法'],['strategy','戰術判斷']];
const skillList=()=>SET().skills;
const PAYTYPES={single:['課程收費','in'],income:['其他收入','in'],venue:['場地費','out'],gear:['器材','out'],expense:['其他支出','out']};
const payType=t=>PAYTYPES[t]||['其他','in'];
const ATTLABEL={present:'出席',leave:'請假',noshow:'未到'};
/* 價目表：每人每堂費用 = 課程性質（一般課／體驗課）× 上課人數（1對1～1對4） */
const PRICEKIND={normal:'一般課',trial:'體驗課'};
// 一般課依 1對1～1對4，體驗課依 4～8 人；填的都是「整堂總價」
const PRICEHEADS={normal:[1,2,3,4],trial:[4,5,6,7,8]};
const headLabel=(k,h)=>k==='trial'?`${h} 人`:`1對${h}`;
const DEFAULT_PRICES={normal:{1:1000,2:1400,3:1800,4:2000},trial:{4:2000,5:2500,6:3000,7:3500,8:4000}};
const METHODS=['現金','轉帳','LINE Pay','街口支付','其他'];
const SOURCES=['朋友介紹','Instagram','Facebook','LINE 社群','體驗課','球場現場','其他'];
const LEADST={inquiry:['詢問中','mute'],trial:['已約體驗','ball'],won:['已成交','good'],lost:['未成交','bad']};
const COLORS=['#1E5D78','#2E7D55','#B86E12','#B23A3A','#6B4FA0','#0F8A8A','#A0527A','#5A6B70'];
const COLS=['students','lessons','payments','logs','leads'];
const DEFAULT_SETTINGS={coachName:'',brand:'',defaultLocation:'',defaultDuration:60,inactiveDays:21,singlePrice:1000,prices:null,skills:null,updatedAt:0};

/* ================== 小工具 ================== */
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>fmt(new Date());
const parse=s=>{const[y,m,d]=String(s||'').split('-').map(Number);return new Date(y||2000,(m||1)-1,d||1)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return fmt(d)};
const diffDays=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const weekStart=s=>{const d=parse(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return fmt(d)};
const WD='日一二三四五六';
const dlabel=s=>{if(!s)return '';const d=parse(s);return `${d.getMonth()+1}/${d.getDate()}（${WD[d.getDay()]}）`};
const toMin=t=>{const[h,m]=(t||'00:00').split(':').map(Number);return h*60+m};
const endTime=(t,m)=>{const x=toMin(t)+Number(m||60);return pad(Math.floor(x/60)%24)+':'+pad(x%60)};
const money=n=>'NT$'+Math.round(n||0).toLocaleString('zh-TW');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const fmtNum=n=>Number.isInteger(n)?String(n):n.toFixed(1);
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(_){}};

/* ================== 資料 ================== */
// 補上預設值；舊資料沒有價目表時，用原本的「單堂制預設單價」當 1對1 一般課的價格
function fillSettings(s){
  const o={...DEFAULT_SETTINGS,...(s||{})};
  const base=Number(o.singlePrice)>0?Number(o.singlePrice):DEFAULT_PRICES.normal[1];
  const src=o.prices&&typeof o.prices==='object'?o.prices:{normal:{...DEFAULT_PRICES.normal,1:base},trial:{...DEFAULT_PRICES.trial}};
  o.prices={};
  for(const k of Object.keys(PRICEKIND)){o.prices[k]={};for(const n of PRICEHEADS[k]){const v=Number(src[k]?.[n]||0);o.prices[k][n]=v>0?Math.round(v):0}}
  // skills 沒設定過＝用預設的 8 項；設成空陣列＝教練刻意不要評分功能
  o.skills=Array.isArray(o.skills)
    ? o.skills.map(x=>Array.isArray(x)?[String(x[0]||''),String(x[1]||'').trim()]:[String(x?.k||''),String(x?.n||'').trim()]).filter(x=>x[0]&&x[1])
    : DEFAULT_SKILLS.map(x=>[...x]);
  return o;
}
function emptyData(){return {schema:1,settings:fillSettings(),students:{},lessons:{},payments:{},logs:{},leads:{}}}
let D=emptyData();
const all=col=>Object.values(D[col]||{}).filter(r=>r&&!r.deleted);
const byId=(col,id)=>{const r=id&&D[col]?.[id];return r&&!r.deleted?r:null};
const SET=()=>fillSettings(D.settings);
const coachSign=()=>{const s=SET();return s.coachName?`— ${s.coachName}`:''};
const brandName=()=>SET().brand||CONFIG.APP_NAME;

function put(col,id,data){const o={...data,id,updatedAt:Date.now()};delete o.deleted;D[col][id]=o;changed();return o}
function del(col,id){if(D[col][id])D[col][id]={id,deleted:true,updatedAt:Date.now()};changed()}
function putSettings(s){D.settings={...SET(),...s,updatedAt:Date.now()};changed()}

function normalize(x){
  const d=emptyData();if(!x||typeof x!=='object')return d;
  for(const c of COLS){const v=x[c];if(Array.isArray(v))v.forEach(r=>{if(r&&r.id)d[c][r.id]=r});else if(v&&typeof v==='object')for(const[k,r]of Object.entries(v))if(r)d[c][k]={...r,id:r.id||k}}
  d.settings=fillSettings(x.settings);return d;
}
function merge(a,b){
  const out=emptyData();
  for(const c of COLS){const ids=new Set([...Object.keys(a[c]||{}),...Object.keys(b[c]||{})]);
    for(const id of ids){const x=a[c]?.[id],y=b[c]?.[id];out[c][id]=!x?y:!y?x:((y.updatedAt||0)>(x.updatedAt||0)?y:x)}}
  out.settings=fillSettings((b.settings?.updatedAt||0)>(a.settings?.updatedAt||0)?b.settings:a.settings);
  // 刪除超過 90 天的標記，避免檔案越長越大
  const cut=Date.now()-90*864e5;
  for(const c of COLS)for(const[id,r]of Object.entries(out[c]))if(r.deleted&&(r.updatedAt||0)<cut)delete out[c][id];
  return out;
}

/* ================== 計算 ================== */
/* ---- 課程收費 ---- */
const feeKindOf=l=>l&&l.feeKind==='trial'?'trial':'normal';
// 收費人數：有自己填就用填的（體驗課常有還沒建檔的人），否則用這堂的學生人數
const headsOf=l=>{const m=Math.round(Number((l&&l.payHeads)||0));return m>0?Math.min(m,99):Math.max(1,((l&&l.studentIds)||[]).length)};
// 計價用的人數：夾在該課程性質的級距內（體驗課最少以 4 人計）
const billHeads=(l)=>{const hs=PRICEHEADS[feeKindOf(l)];return Math.min(Math.max(headsOf(l),hs[0]),hs[hs.length-1])};
// 查價目表，回傳「整堂總價」
function totalPriceFor(kind,heads){
  const st=SET(),k=PRICEKIND[kind]?kind:'normal',hs=PRICEHEADS[k],P=(st.prices||{})[k]||{};
  const h=Math.min(Math.max(Math.round(Number(heads)||hs[0]),hs[0]),hs[hs.length-1]),i=hs.indexOf(h);
  for(let j=i;j>=0;j--){const v=Number(P[hs[j]]||0);if(v>0)return v}       // 先往人數少的找
  for(let j=i+1;j<hs.length;j++){const v=Number(P[hs[j]]||0);if(v>0)return v} // 再往人數多的找
  return Number(st.singlePrice||0);
}
// 這堂每人的價格：課程自己填的價格最優先（不同場地／特殊情況），否則查價目表
// 這堂自己填的總價（0＝沒填）；unitPrice 是舊版的「每人價格」，換算回總價
const ownTotal=l=>Number(l?.feeTotal)>0?Number(l.feeTotal):Number(l?.unitPrice)>0?Number(l.unitPrice)*headsOf(l):0;
const lessonFee=l=>Math.round(ownTotal(l)||totalPriceFor(feeKindOf(l),billHeads(l))); // 整堂總價
// 這位學生這堂應收：課程自訂總價 > 學生個人單價 > 價目表總價 ÷ 人數
function studentFee(l,s){
  const own=ownTotal(l);
  if(own>0)return Math.round(own/Math.max(1,headsOf(l)));
  if(Number(s?.price)>0)return Math.round(Number(s.price));
  return Math.round(totalPriceFor(feeKindOf(l),billHeads(l))/Math.max(1,headsOf(l)));
}
const perHead=l=>Math.round(lessonFee(l)/Math.max(1,headsOf(l)));          // 平均每人
const counted=(l,sid)=>l.status!=='cancelled'&&l.deduct!==false&&['present','noshow'].includes((l.attendance||{})[sid]);
const lessonsOf=sid=>all('lessons').filter(l=>(l.studentIds||[]).includes(sid));
const doneCount=sid=>lessonsOf(sid).filter(l=>(l.attendance||{})[sid]==='present').length; // 已上課堂數
// 某堂課、某位學生的「當場收費」紀錄（勾了已收費就會自動建立這一筆）
const lessonPayOf=(lid,sid)=>all('payments').find(p=>p.lessonId===lid&&(p.studentId||'')===(sid||'')&&p.type==='single')||null;
// 這堂課的狀態：off 已取消／paid 已收費／unpaid 完成但沒收錢／done 完成（沒有要收的錢）／todo 還沒上
function lessonPaid(l){const ch=(l.studentIds||[]).filter(sid=>counted(l,sid));
  return ch.length?ch.every(sid=>lessonPayOf(l.id,sid)):!!lessonPayOf(l.id,'')}
function lessonState(l){
  if(!l)return '';
  if(l.status==='cancelled')return 'off';
  if(lessonPaid(l))return 'paid';
  if(l.status==='done'){const ch=(l.studentIds||[]).filter(sid=>counted(l,sid));
    return (ch.length||((l.studentIds||[]).length===0&&l.deduct!==false))?'unpaid':'done'}
  return 'todo';
}
const paysOf=sid=>all('payments').filter(p=>p.studentId===sid).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
function owed(s){ // 待收款＝已點名計費的課 − 已收的課程費
  if(!s)return 0;
  const due=lessonsOf(s.id).filter(l=>counted(l,s.id)).reduce((a,l)=>a+studentFee(l,s),0);
  const paid=all('payments').filter(p=>p.studentId===s.id&&p.type==='single').reduce((a,p)=>a+Number(p.amount||0),0);
  return Math.round(due-paid);
}
function lastAttended(sid){const l=lessonsOf(sid).filter(l=>(l.attendance||{})[sid]==='present').sort((a,b)=>b.date.localeCompare(a.date))[0];return l?.date||''}
function nextLesson(sid){return lessonsOf(sid).filter(l=>l.date>=today()&&l.status==='scheduled').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]}
const lessonsOn=d=>all('lessons').filter(l=>l.date===d).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
const logsOf=sid=>all('logs').filter(l=>l.studentId===sid).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||0)-(a.createdAt||0));
const sname=id=>byId('students',id)?.name||'（已刪除）';
const names=l=>(l.studentIds||[]).map(sname).join('、')||'尚未指定學生';
const activeStudents=()=>all('students').filter(s=>(s.status||'active')==='active');
/* ---- 統計期間：月／季／年 ---- */
const PERIODS=[['month','月'],['quarter','季'],['year','年']];
const lastDayOf=(y,m)=>fmt(new Date(y,m,0));                 // 該月最後一天
// anchor 是 'YYYY-MM'，回傳這個期間的起訖日與標題
function periodRange(anchor,period){
  const [y,m]=String(anchor||today().slice(0,7)).split('-').map(Number);
  if(period==='year')return {from:`${y}-01-01`,to:`${y}-12-31`,title:`${y} 年`};
  if(period==='quarter'){const q=Math.floor((m-1)/3),s=q*3+1,e=q*3+3;
    return {from:`${y}-${pad(s)}-01`,to:lastDayOf(y,e),title:`${y} 年 第 ${q+1} 季（${s}–${e} 月）`}}
  return {from:`${y}-${pad(m)}-01`,to:lastDayOf(y,m),title:`${y} 年 ${m} 月`};
}
// 往前／往後移動一個期間
function shiftPeriod(anchor,period,d){
  const [y,m]=String(anchor||today().slice(0,7)).split('-').map(Number);
  const step=period==='year'?12:period==='quarter'?3:1;
  const x=new Date(y,m-1+d*step,1);return x.getFullYear()+'-'+pad(x.getMonth()+1);
}
function sumRange(from,to){let inc=0,exp=0;
  all('payments').filter(p=>(p.date||'')>=from&&(p.date||'')<=to).forEach(p=>{payType(p.type)[1]==='out'?exp+=Number(p.amount||0):inc+=Number(p.amount||0)});
  return{inc,exp}}
function monthSum(m){const r=periodRange(m,'month');return sumRange(r.from,r.to)}
function sColor(s){return s?.color||COLORS[0]}
const initial=n=>esc(String(n||'?').replace(/^範例・/,'').slice(0,1));

/* ================== 帳號、本機快取與同步 ================== */
// session: {mode:'google'|'demo', email, name, picture}
let session=lsGet('pcb:session');
let store={fileId:'',folderId:'',remoteVersion:'',editSeq:0,syncedSeq:0};
let token=null,tokenExp=0,syncState='idle',syncMsg='',pushTimer=null,syncing=false,syncAgain=false;
const storeKey=()=>session?.mode==='google'?'pcb:acct:'+session.email:'pcb:demo';

function saveLocal(){lsSet(storeKey(),{data:D,fileId:store.fileId,folderId:store.folderId,remoteVersion:store.remoteVersion,dirty:store.editSeq!==store.syncedSeq})}
function loadLocal(){
  const x=lsGet(storeKey());
  if(x){D=normalize(x.data);store.fileId=x.fileId||'';store.folderId=x.folderId||'';store.remoteVersion=x.remoteVersion||'';store.editSeq=x.dirty?1:0;store.syncedSeq=0}
  else{D=emptyData();store={fileId:'',folderId:'',remoteVersion:'',editSeq:0,syncedSeq:0}}
}
function changed(){store.editSeq++;saveLocal();render();if(session?.mode==='google'){clearTimeout(pushTimer);pushTimer=setTimeout(sync,1500)}}

function setSync(st,msg){syncState=st;syncMsg=msg||'';const n=document.getElementById('sync');if(!n)return;
  const t={idle:'',ok:'已同步',busy:'同步中…',off:'點此連線',err:'同步失敗',demo:'試用模式'}[st]||'';
  n.innerHTML=`<span class="dot ${st==='demo'?'':st}"></span><span>${esc(t)}</span>`;n.title=msg||t}

function loadGIS(){return new Promise((res,rej)=>{if(window.google?.accounts?.oauth2)return res();
  const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=()=>res();s.onerror=()=>rej(new Error('gis'));document.head.appendChild(s)})}
const clientReady=()=>!/PASTE_YOUR_CLIENT_ID/.test(CONFIG.GOOGLE_CLIENT_ID);

async function getToken(interactive){
  if(token&&Date.now()<tokenExp)return token;
  if(!clientReady())throw {code:'noclient'};
  await loadGIS();
  return new Promise((res,rej)=>{
    const c=google.accounts.oauth2.initTokenClient({client_id:CONFIG.GOOGLE_CLIENT_ID,scope:SCOPES,login_hint:session?.email||'',
      callback:r=>{if(r.error)return rej({code:'auth',detail:r.error});token=r.access_token;tokenExp=Date.now()+(Number(r.expires_in||3600)-120)*1000;res(token)},
      error_callback:e=>rej({code:'auth',detail:e?.type})});
    c.requestAccessToken({prompt:interactive==='consent'?'consent':''});
  });
}
async function gfetch(url,opt={}){
  if(!token||Date.now()>=tokenExp)throw {code:'auth'};
  const r=await fetch(url,{...opt,headers:{...(opt.headers||{}),Authorization:'Bearer '+token}});
  if(r.status===401){token=null;throw {code:'auth'}}
  if(!r.ok)throw {code:'http',status:r.status};
  return r;
}
async function driveFind(q){const r=await gfetch(`${DRIVE}/files?q=${encodeURIComponent(q)}&spaces=drive&fields=files(id,name,version,modifiedTime)&orderBy=modifiedTime desc`);return (await r.json()).files||[]}
async function ensureFile(){
  if(store.fileId){try{await gfetch(`${DRIVE}/files/${store.fileId}?fields=id,trashed`).then(r=>r.json()).then(m=>{if(m.trashed)store.fileId=''})}catch(e){if(e.code==='http')store.fileId='';else throw e}}
  if(store.fileId)return store.fileId;
  let folder;
  for(const nm of [CONFIG.DRIVE_FOLDER,...(CONFIG.LEGACY_FOLDERS||[])]){
    folder=(await driveFind(`name='${nm}' and mimeType='application/vnd.google-apps.folder' and trashed=false`))[0];
    if(folder)break;
  }
  if(!folder){folder=await (await gfetch(`${DRIVE}/files?fields=id`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:CONFIG.DRIVE_FOLDER,mimeType:'application/vnd.google-apps.folder'})})).json()}
  store.folderId=folder.id;
  let file=(await driveFind(`name='${CONFIG.DRIVE_FILE}' and '${folder.id}' in parents and trashed=false`))[0];
  if(!file){
    const b='pcb'+Date.now(),meta={name:CONFIG.DRIVE_FILE,parents:[folder.id],mimeType:'application/json',description:CONFIG.APP_NAME+' 的資料檔，請勿手動修改'};
    const body=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(D)}\r\n--${b}--`;
    file=await (await gfetch(`${UPLOAD}/files?uploadType=multipart&fields=id,version`,{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body})).json();
    store.remoteVersion=String(file.version);
  }
  store.fileId=file.id;saveLocal();return file.id;
}
async function sync(opts={}){
  if(session?.mode!=='google')return;
  if(syncing){syncAgain=true;return}
  syncing=true;setSync('busy');
  try{
    if(opts.interactive)await getToken(opts.interactive);
    else if(!token||Date.now()>=tokenExp){setSync('off','需要重新連線 Google');return}
    const id=await ensureFile();
    const meta=await (await gfetch(`${DRIVE}/files/${id}?fields=version`)).json();
    let pulled=false;
    if(String(meta.version)!==String(store.remoteVersion)){
      const txt=await (await gfetch(`${DRIVE}/files/${id}?alt=media`)).text();
      let remote={};try{remote=JSON.parse(txt||'{}')}catch(_){remote={}}
      const rem=normalize(remote);
      D=merge(D,rem);store.remoteVersion=String(meta.version);pulled=true;
      if(JSON.stringify(D)!==JSON.stringify(merge(rem,rem)))store.editSeq++; // 本機有雲端沒有的資料，合併後寫回
    }
    if(store.editSeq!==store.syncedSeq){
      const seq=store.editSeq;
      const r=await (await gfetch(`${UPLOAD}/files/${id}?uploadType=media&fields=version`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(D)})).json();
      store.remoteVersion=String(r.version);store.syncedSeq=seq;
    }
    saveLocal();setSync('ok','最後同步 '+new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'}));
    if(pulled)render();
  }catch(e){
    if(e?.code==='auth'){setSync('off','需要重新連線 Google')}
    else if(e?.code==='noclient'){setSync('err','尚未設定 Google 用戶端 ID')}
    else{setSync('err',e?.status?`Google 回應錯誤（${e.status}）`:'網路連線有問題，資料先存在這台裝置')}
  }finally{syncing=false;if(syncAgain){syncAgain=false;setTimeout(sync,300)}}
}
async function signInGoogle(){
  try{
    if(!clientReady()){toast('這個網站還沒設定 Google 登入金鑰，請先用試用模式');return}
    await getToken('consent');
    const info=await (await gfetch('https://www.googleapis.com/oauth2/v3/userinfo')).json();
    session={mode:'google',email:info.email,name:info.name||'',picture:info.picture||''};
    lsSet('pcb:session',session);loadLocal();
    if(!SET().coachName&&info.name){D.settings={...SET(),coachName:info.given_name||info.name}}
    boot();await sync();
    if(!all('students').length&&!all('lessons').length)ui.tab='today';render();
  }catch(e){
    if(e?.code==='auth')toast('沒有完成 Google 登入，請再試一次');
    else toast('登入失敗，請確認網路後再試');
  }
}
function startDemo(){session={mode:'demo'};lsSet('pcb:session',session);loadLocal();if(!all('students').length)seedDemo();boot()}
function signOut(){
  if(token&&window.google?.accounts?.oauth2)try{google.accounts.oauth2.revoke(token,()=>{})}catch(_){}
  token=null;session=null;lsDel('pcb:session');D=emptyData();closeSheet();showGate();
}
