/* ================== 提示訊息 ================== */
let tt;function toast(m){let n=document.querySelector('.toast');if(!n){n=document.createElement('div');n.className='toast';n.setAttribute('role','status');document.body.appendChild(n)}n.textContent=m;n.hidden=false;clearTimeout(tt);tt=setTimeout(()=>n.hidden=true,2800)}

/* ================== 登入畫面 ================== */
const G_ICON='<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
function showGate(){
  document.body.classList.add('gating');
  document.getElementById('shell').hidden=true;
  const g=document.getElementById('gate');g.hidden=false;
  const prev=lsGet('pcb:lastEmail');
  g.innerHTML=`<div class="gate">
    <img class="brandlogo" src="logo.png" alt="Pickle Battle" width="1100" height="393">
    <h1>${esc(CONFIG.APP_NAME)}</h1>
    <p class="sub">給匹克球教練的學生、課表、收費與學習紀錄管理工具。</p>
    <ul>
      <li><div><b>排課、點名、自動計費</b><small>依上課人數算錢，誰還沒付款一眼看到</small></div></li>
      <li><div><b>學生上課歷程與筆記</b><small>每堂教了什麼、狀況如何，技術評分與雷達圖</small></div></li>
      <li><div><b>收支記帳與分析</b><small>月收入、出席率、學生來源與成交率</small></div></li>
      <li><div><b>一鍵產生 LINE 訊息</b><small>課前提醒、本週課表、課後回饋、收款提醒</small></div></li>
    </ul>
    <button class="gbtn" data-act="signin">${G_ICON}使用 Google 帳號登入</button>
    ${prev?`<p class="hint" style="text-align:center">上次使用 ${esc(prev)}</p>`:''}
    <button class="btn block" style="margin-top:10px" data-act="demo">先用範例資料試用</button>
    <p class="fine">登入後，資料會存在<b>你自己的 Google 雲端硬碟</b>「${esc(CONFIG.DRIVE_FOLDER)}」資料夾，換手機、清除瀏覽器都不會不見。本系統只能存取它自己建立的檔案，看不到你雲端硬碟裡的其他資料，開發者也看不到你的內容。<a href="${esc(CONFIG.PRIVACY_URL)}" target="_blank" rel="noopener">隱私權政策</a></p>
  </div>`;
}
function boot(){
  document.body.classList.remove('gating');
  document.getElementById('gate').hidden=true;document.getElementById('shell').hidden=false;
  if(session.mode==='google')lsSet('pcb:lastEmail',session.email);
  setSync(session.mode==='demo'?'demo':token?'ok':'off');
  render();
}

/* ================== 事件 ================== */
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-act],[data-tab]');if(!b)return;
  if(b.matches('#tabs [data-tab]')){ui.tab=b.dataset.tab;ui.sub=null;if(ui.tab!=='stu')ui.sid=null;msgDirty=false;render();scrollTo(0,0);return}
  const act=b.dataset.act,ds=b.dataset;
  if(!['copy','close','scrim','all-present'].includes(act))msgDirty=false;
  if(act==='scrim'){if(e.target===b)closeSheet();return}
  const toMsg=(type,ref)=>{closeSheet();ui.tab='more';ui.sub='msg';ui.ntype=type;ui.nref=ref||'';ui.sid=null;render();scrollTo(0,0)};
  switch(act){
    case 'signin':signInGoogle();break;
    case 'demo':startDemo();break;
    case 'gate':closeSheet();showGate();break;
    case 'signout':signOut();break;
    case 'connect':sync({interactive:'silent'});break;
    case 'close':closeSheet();break;
    case 'goto':ui.tab=ds.tab;ui.sub=null;render();scrollTo(0,0);break;
    case 'sub':ui.sub=ds.k||null;render();scrollTo(0,0);break;
    case 'settings':ui.tab='more';ui.sub='settings';render();scrollTo(0,0);break;
    case 'new-student':studentSheet();break;
    case 'edit-student':studentSheet(ds.id);break;
    case 'open-student':closeSheet();ui.tab='stu';ui.sub=null;ui.sid=ds.id;render();scrollTo(0,0);break;
    case 'back':ui.sid=null;render();break;
    case 'sfilter':ui.sfilter=ds.k;render();break;
    case 'tagf':ui.tagf=ui.tagf===ds.k?'':ds.k;render();break;
    case 'leadf':ui.leadf=ds.k;render();break;
    case 'new-lesson':lessonSheet(null,{d:ds.d,sid:ds.sid});break;
    case 'edit-lesson':lessonSheet(ds.id);break;
    case 'dup-lesson':{const f=document.getElementById('sf');if(f&&sheetSubmit)sheetSubmit(new FormData(f));dupSheet(ds.id);break}
    case 'all-present':document.querySelectorAll('#sf input[type=radio][value=present]').forEach(r=>r.checked=true);document.querySelectorAll('#sf input[name^=paid_]').forEach(c=>c.disabled=false);break;
    case 'all-paid':document.querySelectorAll('#sf input[name^=paid_]:not([disabled])').forEach(c=>c.checked=true);break;
    case 'rate':closeSheet();logSheet(null,{sid:ds.sid,rate:true});break;
    case 'new-log':{const f=document.getElementById('sf');if(f&&ds.lid&&sheetSubmit)sheetSubmit(new FormData(f));closeSheet();logSheet(null,{sid:ds.sid,lid:ds.lid});break}
    case 'edit-log':logSheet(ds.id);break;
    case 'new-payment':paymentSheet(null,{sid:ds.sid,type:ds.type});break;
    case 'edit-payment':paymentSheet(ds.id);break;
    case 'new-lead':leadSheet();break;
    case 'edit-lead':leadSheet(ds.id);break;
    case 'convert-lead':{const l=byId('leads',ds.id);if(l){closeSheet();studentSheet(null,{name:l.name,source:l.source,phone:/^[\d\-+ ]+$/.test(l.contact||'')?l.contact:'',lineId:/line/i.test(l.contact||'')?l.contact.replace(/^line[:：\s]*/i,''):'',notes:l.note||'',leadId:l.id})}break}
    case 'trial-msg':toMsg('trial',ds.id);break;
    case 'pick-day':ui.day=ds.d;render();document.getElementById('d-'+ds.d)?.scrollIntoView({block:'start',behavior:'smooth'});break;
    case 'week':ui.week=addDays(ui.week,Number(ds.n));ui.day=ui.week;render();break;
    case 'week-today':ui.week=weekStart(today());ui.day=today();render();break;
    case 'month':ui.month=ds.m;render();break;
    case 'period':ui.period=ds.k;render();break;
    case 'ntype':ui.ntype=ds.k;ui.nref='';render();break;
    case 'share-week':toMsg('week');break;
    case 'share-report':toMsg('report',ds.sid);break;
    case 'remind-lesson':toMsg('remind',ds.id);break;
    case 'feedback':toMsg('feedback',ds.id);break;
    case 'copy':{const ta=document.getElementById('msgText');try{await navigator.clipboard.writeText(ta.value);toast('已複製，可以貼到 LINE')}catch(_){ta.focus();ta.select();toast('已選取文字，請長按複製')}break}
    case 'ics':{const l=byId('lessons',ds.id);if(l)download(`匹克球課_${l.date}.ics`,ics(l),'text/calendar');break}
    case 'export-csv':{const R=periodRange(ui.month,ui.period);download(`收支_${R.from}_${R.to}.csv`,csv(),'text/csv');break}
    case 'export-json':download(`${CONFIG.APP_NAME}_備份_${today()}.json`,JSON.stringify(D),'application/json');break;
    case 'add-skill':{const box=document.getElementById('skList');if(box){box.insertAdjacentHTML('beforeend',skillRow(uid(),''));box.lastElementChild.querySelector('input').focus()}break}
    case 'del-skill':b.closest('.skrow')?.remove();break;
    case 'del':{
      if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='再按一次確認刪除';setTimeout(()=>{if(b.isConnected){b.classList.remove('arm');b.textContent='刪除'}},3000);break}
      del(ds.col,ds.id);if(ds.col==='students'&&ui.sid===ds.id)ui.sid=null;closeSheet();toast('已刪除');render();break}
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button][data-act]')){e.preventDefault();e.target.click()}});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.out){const o=document.getElementById(t.dataset.out);if(o)o.textContent=t.value}
  if(t.dataset.input==='q'){ui.q=t.value;if(!e.isComposing)render()}
  if(t.id==='msgText'){msgDirty=true;syncLineLink()}
  if(['l_heads','l_price'].includes(t.id))feeInfo();
});
document.addEventListener('compositionend',e=>{if(e.target.dataset?.input==='q'){ui.q=e.target.value;render()}});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.input==='nref'){ui.nref=t.value;msgDirty=false;render()}
  if(t.id==='g_s'){document.getElementById('g_l').innerHTML=lessonOptsHtml(t.value,'');const pv=logsOf(t.value)[0];
    skillList().forEach(([k])=>{const r=document.getElementById('sk_'+k);if(r){r.value=pv?.skills?.[k]||2;document.getElementById('o_'+k).textContent=r.value}})}
  if(['l_fee','l_heads','l_price','l_dur'].includes(t.id)||t.name==='sids')feeInfo();
  // 改點名時，連動「已收費」能不能勾（請假就不能收費）
  if(t.name&&t.name.startsWith('att_')){const cb=document.querySelector(`#sf [name="paid_${t.name.slice(4)}"]`);
    if(cb){const on=['present','noshow'].includes(t.value);cb.disabled=!on;if(!on)cb.checked=false}}
  if(t.id==='importFile'&&t.files[0]){importBackup(t.files[0]);t.value=''}
});
document.addEventListener('submit',e=>{
  e.preventDefault();
  if(e.target.id==='setForm'){const fd=new FormData(e.target);const num=k=>Number(fv(fd,k)||0);
    const skills=[...e.target.querySelectorAll('#skList [data-skill]')].map(i=>[i.dataset.skill,i.value.trim()]).filter(x=>x[1]);
    const prices={};for(const k of Object.keys(PRICEKIND)){prices[k]={};for(const h of PRICEHEADS[k])prices[k][h]=Math.max(0,num(`price_${k}_${h}`))}
    putSettings({coachName:fv(fd,'coachName'),brand:fv(fd,'brand'),defaultLocation:fv(fd,'defaultLocation'),defaultDuration:num('defaultDuration')||60,prices,skills,singlePrice:prices.normal[1]||SET().singlePrice,inactiveDays:num('inactiveDays')||21});toast('設定已儲存');return}
  if(e.target.id==='sf'&&sheetSubmit)sheetSubmit(new FormData(e.target));
});
document.getElementById('fab').addEventListener('click',()=>{
  if(ui.tab==='stu')return ui.sid?logSheet(null,{sid:ui.sid}):studentSheet();
  if(ui.tab==='money')return paymentSheet();
  if(ui.tab==='more'&&ui.sub==='leads')return leadSheet();
  lessonSheet(null,{d:ui.tab==='cal'?ui.day:undefined});
});
document.getElementById('sync').addEventListener('click',()=>{if(session?.mode==='google')sync({interactive:'silent'});else if(session?.mode==='demo')showGate()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&session?.mode==='google'&&token)sync()});
setInterval(()=>{if(document.visibilityState==='visible'&&session?.mode==='google'&&token)sync()},120000);
// 日期跨日時更新畫面
let lastDay=today();setInterval(()=>{if(today()!==lastDay){lastDay=today();render()}},60000);

/* ================== 啟動 ================== */
if(session&&(session.mode==='demo'||session.email)){loadLocal();if(session.mode==='demo'&&!all('students').length)seedDemo();boot()}else showGate();
if('serviceWorker' in navigator&&location.protocol==='https:'&&!/claude\.ai|claudeusercontent/.test(location.hostname)){navigator.serviceWorker.register('sw.js').catch(()=>{})}
