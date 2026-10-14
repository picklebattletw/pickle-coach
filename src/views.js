/* ================== 畫面狀態 ================== */
const ui={tab:'today',sub:null,sid:null,week:weekStart(today()),day:today(),month:today().slice(0,7),q:'',sfilter:'active',tagf:'',ntype:'remind',nref:'',leadf:'open'};
let msgDirty=false;

function render(){
  if(!session)return;
  const a=document.activeElement,fid=a&&a.id,ss=a&&a.selectionStart;
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===ui.tab));
  const app=document.getElementById('app');if(!app)return;
  let v;
  if(ui.tab==='more'){v={msg:vMsg,leads:vLeads,stats:vStats,settings:vSettings}[ui.sub]||vMore}
  else v={today:vToday,cal:vCal,stu:vStu,money:vMoney}[ui.tab];
  const keep=ui.tab==='more'&&ui.sub==='msg'&&msgDirty?document.getElementById('msgText')?.value:null;
  app.innerHTML=banners()+v();
  if(keep!=null){const ta=document.getElementById('msgText');if(ta)ta.value=keep}
  if(fid){const n=document.getElementById(fid);if(n&&n!==document.activeElement&&!n.closest('.sheet')){n.focus();try{n.setSelectionRange(ss,ss)}catch(_){}}}
  if(ui.sub==='msg')syncLineLink();
  document.getElementById('brandSub').textContent=session.mode==='demo'?'試用模式 · 資料只在這台裝置':(session.email||'');
}
function banners(){
  let h='';
  if(session.mode==='demo')h+=`<div class="banner info"><span style="flex:1;min-width:200px">試用模式：這些是範例資料，只存在這台裝置。登入 Google 後會建立你自己的資料，存在你的雲端硬碟。</span><button class="btn sm cta" data-act="gate">登入 Google</button></div>`;
  else if(syncState==='off')h+=`<div class="banner"><span style="flex:1;min-width:200px">尚未連線 Google 雲端硬碟。你的修改會先存在這台裝置，連線後自動同步。</span><button class="btn sm pri" data-act="connect">連線同步</button></div>`;
  else if(syncState==='err')h+=`<div class="banner"><span style="flex:1;min-width:200px">${esc(syncMsg||'同步失敗')}。</span><button class="btn sm" data-act="connect">重試</button></div>`;
  return h;
}
function empty(msg,btn,act,extra=''){return `<div class="empty"><p>${msg}</p>${btn?`<button class="btn pri" data-act="${act}" ${extra}>${btn}</button>`:''}</div>`}
function stLabel(l){
  if(l.status==='cancelled')return '<span class="tag mute">已取消</span>';
  if(l.status==='done')return '<span class="tag good">已完成</span>';
  return '';
}
function lessonCard(l){
  const n=headsOf(l),tk=feeKindOf(l);
  const tp=tk==='trial'?`<span class="tag ball">體驗 ${n} 人</span>`:`<span class="tag">${n>4?n+' 人':headLabel('normal',n)}</span>`;
  const col=(l.studentIds||[]).length===1?sColor(byId('students',l.studentIds[0])):'';
  return `<button class="lesson ${l.status||''}" data-act="edit-lesson" data-id="${l.id}">
    <div class="time" ${col&&l.status==='scheduled'?`style="border-color:${col}"`:''}><b>${esc(l.time)}</b><span>${endTime(l.time,l.duration)}</span></div>
    <div style="min-width:0"><div class="ltitle">${esc(l.title||'匹克球課')} ${tp}</div><div class="who">${esc(names(l))}</div>${l.location?`<div class="loc">${esc(l.location)}</div>`:''}</div>
    <div>${stLabel(l)}</div></button>`;
}
function stuRow(s,right,sub){
  return `<button class="row" data-act="open-student" data-id="${s.id}"><div class="av" style="background:${sColor(s)}22;color:${sColor(s)}">${initial(s.name)}</div><div class="main"><b>${esc(s.name)}</b><small>${sub}</small></div>${right||''}</button>`;
}
function remainRight(s){
  const o=owed(s),n=doneCount(s.id);
  if(o>0)return `<div class="right neg"><b>${money(o)}</b><small>待收款</small></div>`;
  if(o<0)return `<div class="right"><b>${money(-o)}</b><small>已預繳</small></div>`;
  return `<div class="right"><b>${n}</b><small>已上課</small></div>`;
}

/* ---------- 今日 ---------- */
function alertsList(){
  const t=today(),st=SET(),out=[];
  activeStudents().forEach(s=>{
    const o=owed(s);if(o>0)out.push({s,kind:'owe',txt:`尚未收款 ${money(o)}`,tag:'bad',rank:0});
    const la=lastAttended(s.id);
    if(la&&!nextLesson(s.id)){const d=diffDays(la,t);if(d>=st.inactiveDays)out.push({s,kind:'idle',txt:`${d} 天沒上課，也沒有排下一堂`,tag:'mute',rank:2})}
  });
  return out.sort((a,b)=>a.rank-b.rank);
}
function groupAlerts(al){const m=new Map();al.forEach(a=>{if(!m.has(a.s.id))m.set(a.s.id,{s:a.s,items:[]});m.get(a.s.id).items.push(a)});return [...m.values()]}
function vToday(){
  const t=today(),ls=lessonsOn(t).filter(l=>l.status!=='cancelled');
  const {inc,exp}=monthSum(t.slice(0,7));
  const up=all('lessons').filter(l=>l.status!=='cancelled'&&l.date>t&&l.date<=addDays(t,7)).length;
  const pending=all('lessons').filter(l=>l.status==='scheduled'&&l.date<t&&(l.studentIds||[]).length).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  const al=alertsList();
  const hello=SET().coachName?`${esc(SET().coachName)}，`:'';
  if(!all('students').length&&!all('lessons').length){
    return `<p class="eyebrow">${dlabel(t)}</p><h1>歡迎使用${esc(CONFIG.APP_NAME)}</h1><p class="sub">學生、課表、收費和學習紀錄都放在這裡，資料存在你自己的 Google 雲端硬碟。</p>
    <h2>先做這三件事</h2><div class="list">
    <button class="row" data-act="settings"><div class="av">1</div><div class="main"><b>填寫教練資料</b><small>你的稱呼、品牌名稱，會出現在 LINE 訊息裡</small></div></button>
    <button class="row" data-act="new-student"><div class="av">2</div><div class="main"><b>新增學生</b><small>填姓名就好，其他可以之後再補</small></div></button>
    <button class="row" data-act="new-lesson"><div class="av">3</div><div class="main"><b>排第一堂課</b><small>可設定每週重複</small></div></button></div>
    <p class="hint">建議把這個網頁「加入主畫面」，用起來就像 App。</p>`;
  }
  return `<p class="eyebrow">${dlabel(t)}</p><h1>${hello}今天有 ${ls.length} 堂課</h1><p class="sub">未來 7 天還有 ${up} 堂</p>
  <div class="stats"><div class="stat"><span>本月收入</span><b>${money(inc)}</b></div><div class="stat"><span>本月支出</span><b>${money(exp)}</b></div><div class="stat"><span>本月淨額</span><b>${money(inc-exp)}</b></div></div>
  <h2>今日課表 <button class="btn sm more" data-act="goto" data-tab="cal">看整週</button></h2>
  <div class="list">${ls.length?ls.map(lessonCard).join(''):empty('今天沒有排課','排一堂課','new-lesson')}</div>
  ${pending.length?`<h2>還沒點名的課 <span class="tag warn">${pending.length}</span></h2><div class="list">${pending.map(lessonCard).join('')}</div><p class="hint">點進去標記出席，才會算進收費。</p>`:''}
  <h2>需要處理 ${al.length?`<span class="tag warn">${groupAlerts(al).length}</span>`:''}</h2>
  <div class="list">${al.length?groupAlerts(al).slice(0,12).map(g=>stuRow(g.s,`<div class="chips" style="justify-content:flex-end;max-width:110px">${g.items.map(a=>`<span class="tag ${a.tag}">${{owe:'待收款',idle:'流失風險'}[a.kind]}</span>`).join('')}</div>`,g.items.map(a=>esc(a.txt)).join('<br>'))).join(''):'<div class="empty">目前沒有待收款、也沒有太久沒上課的學生</div>'}</div>`;
}

/* ---------- 行事曆 ---------- */
function vCal(){
  const t=today(),ws=ui.week,days=[...Array(7)].map((_,i)=>addDays(ws,i)),we=days[6];
  const strip=days.map(d=>{const n=lessonsOn(d).filter(l=>l.status!=='cancelled').length;const dd=parse(d);
    return `<button class="day ${d===ui.day?'sel':''} ${d===t?'today':''}" data-act="pick-day" data-d="${d}" aria-label="${dlabel(d)} ${n} 堂"><small>${WD[dd.getDay()]}</small><b>${dd.getDate()}</b><i>${n?'●'.repeat(Math.min(n,4)):''}</i></button>`}).join('');
  const body=days.map(d=>{const ls=lessonsOn(d);if(!ls.length&&d!==ui.day)return '';
    return `<div class="dayhead ${d===t?'is-today':''}" id="d-${d}">${dlabel(d)}${d===t?' · 今天':''}</div><div class="list">${ls.length?ls.map(lessonCard).join(''):`<div class="empty"><p>這天沒有課</p><button class="btn pri sm" data-act="new-lesson" data-d="${d}">在 ${dlabel(d)} 排課</button></div>`}</div>`}).join('');
  const total=all('lessons').filter(l=>l.date>=ws&&l.date<=we&&l.status!=='cancelled');
  const hrs=total.reduce((a,l)=>a+Number(l.duration||60),0)/60;
  return `<p class="eyebrow">行事曆</p><h1>這週 ${total.length} 堂課</h1><p class="sub">共 ${fmtNum(hrs)} 小時</p>
  <div class="weekbar"><button class="btn sm" data-act="week" data-n="-7">‹ 上週</button><div class="t num">${dlabel(ws)} – ${dlabel(we)}</div><button class="btn sm" data-act="week" data-n="7">下週 ›</button></div>
  <div class="days">${strip}</div>
  <div class="btns" style="margin-top:12px"><button class="btn pri" data-act="new-lesson" data-d="${ui.day}">＋ 排課</button><button class="btn" data-act="week-today">回到本週</button><button class="btn" data-act="share-week">傳本週課表到 LINE</button></div>
  ${body||'<div class="empty" style="margin-top:14px">這週還沒有任何課程</div>'}`;
}

/* ---------- 學生 ---------- */
function vStu(){
  if(ui.sid&&byId('students',ui.sid))return vStudent(byId('students',ui.sid));
  const q=ui.q.trim().toLowerCase();
  const tags=[...new Set(all('students').flatMap(s=>s.tags||[]))].sort();
  const counts={active:0,paused:0,archived:0};all('students').forEach(s=>counts[s.status||'active']++);
  const list=all('students').filter(s=>(s.status||'active')===ui.sfilter).filter(s=>!ui.tagf||(s.tags||[]).includes(ui.tagf))
    .filter(s=>!q||[s.name,s.phone,s.lineId,s.level,(s.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)).sort((a,b)=>(a.name||'').localeCompare(b.name||'','zh-Hant'));
  return `<p class="eyebrow">學生</p><h1>${counts.active} 位上課中</h1>
  <input class="search" id="q" placeholder="搜尋姓名、電話、LINE ID、程度、標籤" value="${esc(ui.q)}" data-input="q" aria-label="搜尋學生">
  <div class="filters">${[['active','上課中'],['paused','暫停'],['archived','封存']].map(([k,n])=>`<button class="chip ${ui.sfilter===k?'on':''}" data-act="sfilter" data-k="${k}">${n} ${counts[k]}</button>`).join('')}
  ${tags.map(t=>`<button class="chip ${ui.tagf===t?'on':''}" data-act="tagf" data-k="${esc(t)}"># ${esc(t)}</button>`).join('')}</div>
  <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="new-student">＋ 新增學生</button></div>
  <div class="list" style="margin-top:12px">${list.length?list.map(s=>{const la=lastAttended(s.id);return stuRow(s,remainRight(s),`${esc(s.level||'未填程度')}${(s.tags||[]).length?' · '+s.tags.map(t=>'#'+esc(t)).join(' '):''}${la?` · 上次上課 ${dlabel(la)}`:''}`)}).join(''):empty(q||ui.tagf?'找不到符合的學生':ui.sfilter==='active'?'還沒有學生':'這裡沒有學生',ui.sfilter==='active'&&!q?'新增學生':'','new-student')}</div>`;
}
function radarSVG(cur,base){
  const cx=160,cy=128,R=88,n=SKILLS.length;
  const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R*v/5;return[cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  let g='';
  for(let k=1;k<=5;k++)g+=`<polygon points="${SKILLS.map((_,i)=>pt(i,k).join(',')).join(' ')}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
  SKILLS.forEach((s,i)=>{const[x,y]=pt(i,5);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`;const[lx,ly]=pt(i,6.15);g+=`<text x="${lx}" y="${ly}" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="var(--muted)">${s[1]}</text>`});
  const poly=(o,stroke,fill,dash)=>`<polygon points="${SKILLS.map((s,i)=>pt(i,Number(o[s[0]]||0)).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${dash?'stroke-dasharray="4 4"':''}/>`;
  if(base)g+=poly(base,'var(--muted)','none',true);
  g+=poly(cur,'var(--court)','var(--court-soft)');
  g+=SKILLS.map((s,i)=>{const[x,y]=pt(i,Number(cur[s[0]]||0));return `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--ball)" stroke="var(--court)" stroke-width="1.5"/>`}).join('');
  return `<svg class="radar" viewBox="0 0 320 256" role="img" aria-label="技術雷達圖">${g}</svg>`;
}
function vStudent(s){
  const used=doneCount(s.id);
  const paid=all('payments').filter(p=>p.studentId===s.id&&payType(p.type)[1]==='in').reduce((a,p)=>a+Number(p.amount||0),0);
  const logs=logsOf(s.id),latest=logs[0],first=logs.length>1?logs[logs.length-1]:null;
  const loggedLessons=new Set(logs.map(l=>l.lessonId).filter(Boolean));
  const past=lessonsOf(s.id).filter(l=>l.status!=='cancelled'&&l.date<=today()&&!loggedLessons.has(l.id));
  const items=[...logs.map(l=>({k:'log',d:l.date,o:l})),...past.map(l=>({k:'att',d:l.date,o:l}))].sort((a,b)=>(b.d||'').localeCompare(a.d||'')||(b.o.time||'').localeCompare(a.o.time||''));
  const marked=lessonsOf(s.id).filter(l=>l.status!=='cancelled'&&(l.attendance||{})[s.id]);
  const rate=marked.length?Math.round(marked.filter(l=>l.attendance[s.id]==='present').length/marked.length*100):null;
  const pays=paysOf(s.id);
  const nl=nextLesson(s.id),o=owed(s);
  const st={active:'',paused:'<span class="tag warn">暫停中</span>',archived:'<span class="tag mute">已封存</span>'}[s.status||'active'];
  const firstStat=`<div class="stat"><span>${o<0?'已預繳':'待收款'}</span><b style="color:${o>0?'var(--bad)':'inherit'}">${money(Math.abs(o))}</b><small>${Number(s.price)>0?'個人單價 '+money(s.price):'依人數價目表'}</small></div>`;
  return `<button class="back" data-act="back">‹ 學生列表</button>
  <div class="profile"><div class="av" style="background:${sColor(s)}22;color:${sColor(s)}">${initial(s.name)}</div><div style="min-width:0"><h1>${esc(s.name)} ${st}</h1>
  <div class="kv">${s.level?`<span>程度 ${esc(s.level)}</span>`:''}${s.phone?`<span>${esc(s.phone)}</span>`:''}${s.lineId?`<span>LINE ${esc(s.lineId)}</span>`:''}${s.source?`<span>來源 ${esc(s.source)}</span>`:''}${s.startDate?`<span>${esc(s.startDate)} 起</span>`:''}</div>
  ${(s.tags||[]).length?`<div class="chips" style="margin-top:6px">${s.tags.map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div>`:''}</div></div>
  ${s.goal?`<p class="sub" style="margin-top:10px"><span class="lab">目標</span>　${esc(s.goal)}</p>`:''}
  <div class="stats four">${firstStat}<div class="stat"><span>已上課</span><b>${used} 堂</b><small>${rate===null?'&nbsp;':'出席率 '+rate+'%'}</small></div><div class="stat"><span>累計繳費</span><b>${money(paid)}</b><small>${pays.length?`${pays.length} 筆`:'&nbsp;'}</small></div><div class="stat"><span>下一堂</span><b style="font-size:18px">${nl?dlabel(nl.date):'未排'}</b><small>${nl?esc(nl.time):'&nbsp;'}</small></div></div>
  <div class="btns" style="margin-top:14px"><button class="btn pri" data-act="new-log" data-sid="${s.id}">寫上課筆記</button><button class="btn" data-act="new-payment" data-sid="${s.id}" data-type="single">收款</button><button class="btn" data-act="new-lesson" data-sid="${s.id}">排課</button><button class="btn line" data-act="share-report" data-sid="${s.id}">傳學習報告</button><button class="btn" data-act="edit-student" data-id="${s.id}">編輯資料</button></div>
  <h2>技術能力</h2>
  ${latest?`<div class="card radarwrap"><div>${radarSVG(latest.skills||{},first?.skills)}<div class="legend"><span><i style="background:var(--court)"></i>最新 ${dlabel(latest.date)}</span>${first?`<span><i style="background:var(--muted)"></i>第一次 ${dlabel(first.date)}</span>`:''}</div></div>
  <div class="bars">${SKILLS.map(([k,n])=>{const v=Number(latest.skills?.[k]||0),b=first?Number(first.skills?.[k]||0):null,d=b!==null?v-b:0;return `<div class="bar"><span>${n}${d>0?` <span class="tag good">+${d}</span>`:''}</span><div class="track"><div class="fill" style="width:${v*20}%"></div></div><span class="v">${v}</span></div>`}).join('')}</div></div>`:empty('還沒有學習紀錄，寫下第一次評估後就會出現雷達圖','寫學習紀錄','new-log',`data-sid="${s.id}"`)}
  <h2>上課歷程與筆記 <span class="tag mute">${items.length}</span></h2>
  ${items.length?`<div class="timeline">${items.map(it=>it.k==='log'?logCard(s,it.o):lessonNoteCard(s,it.o)).join('')}</div>`:empty('每上完一堂課寫一段筆記，這裡就會留下完整的上課歷程','寫上課筆記','new-log',`data-sid="${s.id}"`)}
  ${s.notes?`<h2>備註</h2><div class="card" style="white-space:pre-wrap">${esc(s.notes)}</div>`:''}
  <h2>收費紀錄 ${pays.length?`<span class="tag mute">${pays.length}</span>`:''}</h2><div class="list">${pays.length?pays.map(txRow).join(''):empty('還沒有收費紀錄','記一筆收款','new-payment',`data-sid="${s.id}" data-type="single"`)}</div>`;
}
// 有筆記的那一堂
function logCard(s,g){
  const l=g.lessonId?byId('lessons',g.lessonId):null;
  const att=l?(l.attendance||{})[s.id]:'';
  const head=[l?esc(l.title||'課程'):'',l?esc(l.time||''):'',att&&att!=='present'?ATTLABEL[att]:''].filter(Boolean).join(' · ');
  return `<div class="tl"><div class="d">${dlabel(g.date)}${head?`　<span class="sub2">${head}</span>`:''}</div>
  <div class="c" data-act="edit-log" data-id="${g.id}" role="button" tabindex="0">
  ${g.focus?`<div class="lab">今天教了什麼</div><b>${esc(g.focus)}</b>`:''}
  ${g.note?`<p>${esc(g.note)}</p>`:''}
  ${g.homework?`<p><span class="lab">回家作業</span>　${esc(g.homework)}</p>`:''}
  ${l&&l.note?`<p><span class="lab">課程備註</span>　${esc(l.note)}</p>`:''}
  ${!g.focus&&!g.note&&!g.homework&&!(l&&l.note)?'<p class="hint" style="margin:0">這筆筆記是空的，點一下補寫</p>':''}</div></div>`;
}
// 還沒寫筆記的那一堂
function lessonNoteCard(s,l){
  const att=(l.attendance||{})[s.id];
  return `<div class="tl att"><div class="d">${dlabel(l.date)}　<span class="sub2">${esc(l.title||'課程')} ${esc(l.time||'')}</span></div>
  <div class="c" data-act="new-log" data-sid="${s.id}" data-lid="${l.id}" role="button" tabindex="0">
  <span class="lab">${att?ATTLABEL[att]:'還沒點名'}</span>${l.feeKind==='trial'?' · 體驗課':''}
  ${l.note?`<p>${esc(l.note)}</p>`:''}
  <p class="hint" style="margin:2px 0 0">這堂還沒寫筆記，點一下補寫</p></div></div>`;
}
function txRow(p){
  const [lab,dir]=payType(p.type);
  return `<button class="tx" data-act="edit-payment" data-id="${p.id}"><div class="main"><b>${esc(lab)}${p.studentId?` · ${esc(sname(p.studentId))}`:''}</b><small>${dlabel(p.date)}${p.method?' · '+esc(p.method):''}${p.note?' · '+esc(p.note):''}</small></div><span class="amt ${dir}">${dir==='out'?'−':'+'}${money(p.amount)}</span></button>`;
}

/* ---------- 收支 ---------- */
function vMoney(){
  const m=ui.month,[y,mo]=m.split('-').map(Number);
  const list=all('payments').filter(p=>(p.date||'').startsWith(m)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const {inc,exp}=monthSum(m);
  const cats={};list.forEach(p=>{cats[p.type]=(cats[p.type]||0)+Number(p.amount||0)});
  const max=Math.max(1,...Object.values(cats));
  const ym=d=>{const x=new Date(y,mo-1+d,1);return x.getFullYear()+'-'+pad(x.getMonth()+1)};
  const done=all('lessons').filter(l=>l.date.startsWith(m)&&l.status!=='cancelled'&&l.date<=today()).length;
  const owes=activeStudents().map(s=>({s,o:owed(s)})).filter(x=>x.o>0);
  return `<p class="eyebrow">收支</p><h1>${y} 年 ${mo} 月</h1>
  <div class="weekbar"><button class="btn sm" data-act="month" data-m="${ym(-1)}">‹ 上月</button><div class="t"></div><button class="btn sm" data-act="month" data-m="${ym(1)}">下月 ›</button></div>
  <div class="stats"><div class="stat"><span>收入</span><b style="color:var(--good)">${money(inc)}</b></div><div class="stat"><span>支出</span><b style="color:var(--bad)">${money(exp)}</b></div><div class="stat"><span>淨額</span><b>${money(inc-exp)}</b></div></div>
  <p class="hint">本月已上 ${done} 堂${done?`，平均每堂淨收入 ${money((inc-exp)/done)}`:''}</p>
  <div class="btns" style="margin-top:12px"><button class="btn pri" data-act="new-payment">＋ 記一筆</button><button class="btn" data-act="export-csv">匯出本月 CSV</button></div>
  ${owes.length?`<h2>單堂制待收款 <span class="tag bad">${owes.length}</span></h2><div class="list">${owes.map(({s,o})=>stuRow(s,`<div class="right neg"><b>${money(o)}</b><small>待收</small></div>`,'點進去登記收款')).join('')}</div>`:''}
  ${Object.keys(cats).length?`<h2>分類</h2><div class="card" style="display:flex;flex-direction:column;gap:8px">${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="cat"><span>${esc(payType(k)[0])}</span><div class="track"><div class="fill" style="width:${v/max*100}%;background:${payType(k)[1]==='out'?'var(--bad)':'var(--good)'}"></div></div><span class="num" style="font-weight:600">${money(v)}</span></div>`).join('')}</div>`:''}
  <h2>明細</h2><div class="list">${list.length?list.map(txRow).join(''):empty('這個月還沒有收支紀錄','記一筆','new-payment')}</div>`;
}

/* ---------- 更多 ---------- */
function vMore(){
  const leadsOpen=all('leads').filter(l=>['inquiry','trial'].includes(l.status||'inquiry')).length;
  return `<p class="eyebrow">更多</p><h1>工具</h1>
  <div class="menu">
  <button data-act="sub" data-k="msg"><b>LINE 訊息</b><small>課前提醒、課表、課後回饋、收款提醒</small></button>
  <button data-act="sub" data-k="leads"><b>潛在客群${leadsOpen?` <span class="tag ball">${leadsOpen}</span>`:''}</b><small>詢問、體驗課、成交率</small></button>
  <button data-act="sub" data-k="stats"><b>分析</b><small>收入趨勢、出席率、排行</small></button>
  <button data-act="sub" data-k="settings"><b>設定與備份</b><small>教練資料、課程價目表、帳號</small></button></div>
  <p class="hint" style="margin-top:20px">${esc(CONFIG.APP_NAME)} 版本 ${CONFIG.VERSION}</p>`;
}
const subBack='<button class="back" data-act="sub" data-k="">‹ 更多</button>';

/* ---------- 潛在客群 ---------- */
function vLeads(){
  const ls=all('leads').sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const shown=ls.filter(l=>ui.leadf==='open'?['inquiry','trial'].includes(l.status||'inquiry'):ui.leadf==='all'?true:l.status===ui.leadf);
  const won=ls.filter(l=>l.status==='won').length,closed=ls.filter(l=>['won','lost'].includes(l.status)).length;
  return `${subBack}<p class="eyebrow">潛在客群</p><h1>${ls.filter(l=>['inquiry','trial'].includes(l.status||'inquiry')).length} 位跟進中</h1>
  <p class="sub">記錄詢問和體驗課的人，成交後一鍵轉成學生。${closed?`目前成交率 ${Math.round(won/closed*100)}%（${won}/${closed}）`:''}</p>
  <div class="filters">${[['open','跟進中'],['won','已成交'],['lost','未成交'],['all','全部']].map(([k,n])=>`<button class="chip ${ui.leadf===k?'on':''}" data-act="leadf" data-k="${k}">${n}</button>`).join('')}</div>
  <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="new-lead">＋ 新增潛在客群</button></div>
  <div class="list" style="margin-top:12px">${shown.length?shown.map(l=>{const[n,c]=LEADST[l.status||'inquiry'];return `<button class="row" data-act="edit-lead" data-id="${l.id}"><div class="av">${initial(l.name)}</div><div class="main"><b>${esc(l.name)}</b><small>${esc(l.source||'未填來源')} · ${dlabel(l.date)}${l.trialDate?` · 體驗 ${dlabel(l.trialDate)}`:''}${l.note?' · '+esc(l.note):''}</small></div><span class="tag ${c}">${n}</span></button>`}).join(''):empty('這裡沒有資料','新增潛在客群','new-lead')}</div>`;
}

/* ---------- 分析 ---------- */
function vStats(){
  const t=today(),months=[...Array(6)].map((_,i)=>{const d=parse(t);d.setDate(1);d.setMonth(d.getMonth()-5+i);return d.getFullYear()+'-'+pad(d.getMonth()+1)});
  const sums=months.map(m=>monthSum(m));
  const maxV=Math.max(1000,...sums.map(s=>Math.max(s.inc,s.exp)));
  const W=320,H=170,L=44,B=24,bw=(W-L-8)/6;
  const nice=(()=>{const raw=maxV/4,p=10**Math.floor(Math.log10(raw)),s=[1,2,2.5,5,10].find(x=>x*p>=raw)*p;return s})();
  const top=nice*4,yv=v=>H-B-(v/top)*(H-B-10);
  let svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="近六個月收支">`;
  for(let i=0;i<=4;i++){const v=nice*i,y=yv(v);svg+=`<line x1="${L}" x2="${W-4}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${y}" font-size="10" text-anchor="end" dominant-baseline="middle" fill="var(--muted)">${v>=10000?(v/10000)+'萬':v.toLocaleString()}</text>`}
  months.forEach((m,i)=>{const x=L+i*bw+bw*.18,w=bw*.3;const s=sums[i];
    svg+=`<rect x="${x}" y="${yv(s.inc)}" width="${w}" height="${H-B-yv(s.inc)}" rx="2" fill="var(--good)"/><rect x="${x+w+2}" y="${yv(s.exp)}" width="${w}" height="${H-B-yv(s.exp)}" rx="2" fill="var(--bad)" opacity=".75"/>`;
    svg+=`<text x="${L+i*bw+bw/2}" y="${H-8}" font-size="11" text-anchor="middle" fill="${m===t.slice(0,7)?'var(--ink)':'var(--muted)'}">${Number(m.slice(5))}月</text>`});
  svg+='</svg>';
  const since=addDays(t,-90);
  const marks=[];all('lessons').filter(l=>l.date>=since&&l.date<=t&&l.status!=='cancelled').forEach(l=>Object.values(l.attendance||{}).forEach(v=>marks.push(v)));
  const rate=marks.length?Math.round(marks.filter(v=>v==='present').length/marks.length*100):null;
  const year=t.slice(0,4),byMonth={};all('lessons').filter(l=>l.date.startsWith(year)&&l.status!=='cancelled').forEach(l=>{const k=l.date.slice(0,7);byMonth[k]=(byMonth[k]||0)+1});
  const busiest=Object.entries(byMonth).sort((a,b)=>b[1]-a[1])[0];
  const lessonInc=all('payments').filter(p=>p.date?.startsWith(year)&&p.type==='single').reduce((a,p)=>a+Number(p.amount||0),0);
  let heads=0;all('lessons').filter(l=>l.date.startsWith(year)).forEach(l=>(l.studentIds||[]).forEach(sid=>{if(counted(l,sid))heads++}));
  const perSession=heads?lessonInc/heads:0;
  const dueAll=activeStudents().reduce((a,s)=>a+Math.max(0,owed(s)),0);
  const rank={};all('payments').filter(p=>p.studentId&&payType(p.type)[1]==='in').forEach(p=>rank[p.studentId]=(rank[p.studentId]||0)+Number(p.amount||0));
  const top5=Object.entries(rank).filter(([id])=>byId('students',id)).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const rmax=Math.max(1,...top5.map(x=>x[1]));
  const src={};all('leads').forEach(l=>{const k=l.source||'未填';src[k]=src[k]||{n:0,w:0,c:0};src[k].n++;if(l.status==='won')src[k].w++;if(['won','lost'].includes(l.status))src[k].c++});
  all('students').filter(s=>s.source&&!all('leads').some(l=>l.studentId===s.id)).forEach(s=>{const k=s.source;src[k]=src[k]||{n:0,w:0,c:0}});
  const stuSrc={};all('students').forEach(s=>{const k=s.source||'未填';stuSrc[k]=(stuSrc[k]||0)+1});
  const smax=Math.max(1,...Object.values(stuSrc));
  return `${subBack}<p class="eyebrow">分析</p><h1>${year} 年經營概況</h1>
  <div class="stats four"><div class="stat"><span>出席率</span><b>${rate===null?'—':rate+'%'}</b><small>近 90 天</small></div><div class="stat"><span>每人次均價</span><b>${perSession?money(perSession):'—'}</b><small>今年收入 ÷ 人次</small></div><div class="stat"><span>待收款合計</span><b style="color:${dueAll>0?'var(--bad)':'inherit'}">${money(dueAll)}</b><small>上課中的學生</small></div><div class="stat"><span>最忙月份</span><b>${busiest?Number(busiest[0].slice(5))+' 月':'—'}</b><small>${busiest?busiest[1]+' 堂':'&nbsp;'}</small></div></div>
  <h2>近六個月收支</h2><div class="card">${svg}<div class="legend"><span><i style="background:var(--good)"></i>收入</span><span><i style="background:var(--bad)"></i>支出</span></div></div>
  <p class="hint">今年課程收入合計 ${money(lessonInc)}</p>
  <h2>學生繳費排行</h2>${top5.length?`<div class="card" style="display:flex;flex-direction:column;gap:8px">${top5.map(([id,v],i)=>`<div class="cat"><span>${i+1}. ${esc(sname(id))}</span><div class="track"><div class="fill" style="width:${v/rmax*100}%;background:var(--court)"></div></div><span class="num" style="font-weight:600">${money(v)}</span></div>`).join('')}</div>`:'<div class="empty">還沒有繳費紀錄</div>'}
  <h2>學生來源</h2>${all('students').length?`<div class="card" style="display:flex;flex-direction:column;gap:8px">${Object.entries(stuSrc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="cat"><span>${esc(k)}</span><div class="track"><div class="fill" style="width:${v/smax*100}%;background:var(--ball)"></div></div><span class="num" style="font-weight:600">${v} 位</span></div>`).join('')}</div>`:'<div class="empty">還沒有學生</div>'}
  <h2>各來源成交率</h2>${Object.values(src).some(x=>x.n)?`<div class="list">${Object.entries(src).filter(([,x])=>x.n).sort((a,b)=>b[1].n-a[1].n).map(([k,x])=>`<div class="row" style="cursor:default"><div class="main"><b>${esc(k)}</b><small>${x.n} 位潛在客群，成交 ${x.w} 位</small></div><div class="right"><b>${x.c?Math.round(x.w/x.c*100)+'%':'—'}</b><small>成交率</small></div></div>`).join('')}</div>`:'<div class="empty">到「潛在客群」記錄詢問和體驗課的人，這裡就會算出各來源的成交率</div>'}`;
}

/* ---------- 設定 ---------- */
function vSettings(){
  const s=SET();
  const acct=session.mode==='google'?`<div class="row" style="cursor:default">${session.picture?`<img src="${esc(session.picture)}" alt="" width="38" height="38" style="border-radius:50%" referrerpolicy="no-referrer">`:`<div class="av">${initial(session.name||session.email)}</div>`}<div class="main"><b>${esc(session.name||'Google 帳號')}</b><small>${esc(session.email)}</small></div></div>
    <p class="hint">資料檔存在你的 Google 雲端硬碟「${esc(CONFIG.DRIVE_FOLDER)}」資料夾。${syncMsg?esc(syncMsg):''}</p>
    <div class="btns" style="margin-top:8px"><button class="btn pri" data-act="connect">立即同步</button>${store.folderId?`<a class="btn" href="https://drive.google.com/drive/folders/${esc(store.folderId)}" target="_blank" rel="noopener">在雲端硬碟中開啟</a>`:''}<button class="btn danger" data-act="signout">登出</button></div>`
    :`<p class="sub">目前是試用模式，資料只存在這台裝置。</p><div class="btns" style="margin-top:8px"><button class="btn cta" data-act="gate">登入 Google 開始正式使用</button><button class="btn danger" data-act="signout">離開試用</button></div>`;
  return `${subBack}<p class="eyebrow">設定</p><h1>設定與備份</h1>
  <h2>帳號</h2>${acct}
  <h2>教練資料</h2>
  <form id="setForm" class="card" autocomplete="off">
  <div class="grid2"><div class="f" style="margin-top:0"><label for="st_coach">你的稱呼</label><input id="st_coach" name="coachName" value="${esc(s.coachName)}" placeholder="例：Ken 教練"></div>
  <div class="f" style="margin-top:0"><label for="st_brand">品牌／球隊名稱</label><input id="st_brand" name="brand" value="${esc(s.brand)}" placeholder="例：Pickle Battle"></div></div>
  <div class="f"><label for="st_loc">常用上課地點</label><input id="st_loc" name="defaultLocation" value="${esc(s.defaultLocation)}"></div>
  <div class="f"><label for="st_dur">預設課程長度</label><select id="st_dur" name="defaultDuration">${[30,60,90,120].map(m=>`<option value="${m}" ${Number(s.defaultDuration)===m?'selected':''}>${m} 分鐘</option>`).join('')}</select></div>
  <div class="f"><span class="lb">課程價目表（一堂課的總價）</span>
  <p class="hint" style="margin:0">填的是整堂課的總收費，不是每人。一般課依 1對1～1對4，體驗課依 4～8 人。留空的格子會沿用相鄰人數的價格。</p>
  ${Object.entries(PRICEKIND).map(([k,n])=>`<div class="pricerow"><span class="lb">${n}${k==='trial'?'（4 人起算）':''}</span><div class="priceg">${PRICEHEADS[k].map(h=>`<div class="f"><label for="pr_${k}_${h}">${headLabel(k,h)}</label><input id="pr_${k}_${h}" type="number" min="0" step="10" inputmode="numeric" name="price_${k}_${h}" value="${esc(s.prices[k][h]||'')}" placeholder="${totalPriceFor(k,h)}"></div>`).join('')}</div></div>`).join('')}
  <p class="hint" style="margin:0">學生的待收款＝這堂總價 ÷ 上課人數。學生資料若填了「個人單價」，則以個人單價為準；排課時也可以單獨指定「本堂總價」（例如場租較高的球場），那一堂就以課程上填的為準。</p></div>
  <div class="f"><label for="st_idle">幾天沒上課就提醒（流失風險）</label><input id="st_idle" type="number" min="1" name="inactiveDays" value="${esc(s.inactiveDays)}"></div>
  <div class="actions"><button class="btn pri grow">儲存設定</button></div></form>
  <h2>備份</h2>
  <p class="sub" style="margin:0">雲端硬碟會自動保留檔案的歷史版本。你也可以另外下載一份備份檔，或匯入之前的備份。</p>
  <div class="btns" style="margin-top:10px"><button class="btn" data-act="export-json">下載備份檔</button><label class="btn" for="importFile">匯入備份檔</label><input type="file" id="importFile" accept="application/json,.json" hidden></div>
  <h2>加到手機主畫面</h2>
  <p class="sub" style="margin:0">iPhone：用 Safari 開啟，點下方分享鈕，選「加入主畫面」。Android：Chrome 右上角選單，選「加到主畫面」或「安裝應用程式」。</p>
  <p class="fine"><a href="${esc(CONFIG.PRIVACY_URL)}" target="_blank" rel="noopener">隱私權政策</a></p>`;
}

/* ---------- LINE 訊息 ---------- */
const stars=v=>'●'.repeat(v)+'○'.repeat(5-v);
function buildMsg(){
  const t=ui.ntype,ref=ui.nref,B=brandName(),sign=coachSign();
  if(t==='remind'){const l=byId('lessons',ref);if(!l)return '';
    return `【${B} 上課提醒】\n${names(l)} 您好！\n提醒您的課程時間：\n📅 ${dlabel(l.date)} ${l.time}–${endTime(l.time,l.duration)}\n📍 ${l.location||'（地點另行通知）'}\n🏓 ${l.title||'匹克球課'}\n\n請攜帶球拍、水和毛巾，提早 10 分鐘到場暖身。\n如需請假，請在課前 24 小時告知，謝謝！\n\n${sign}`.trim()}
  if(t==='week'){const ws=ui.week,we=addDays(ws,6);const ls=all('lessons').filter(l=>l.date>=ws&&l.date<=we&&l.status!=='cancelled').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    if(!ls.length)return `【${B} 本週課表】${dlabel(ws)}–${dlabel(we)}\n本週暫無課程。`;
    return (`【${B} 本週課表】\n${dlabel(ws)} – ${dlabel(we)}\n\n`+ls.map(l=>`${dlabel(l.date)} ${l.time}　${l.title||'匹克球課'}${l.location?'｜'+l.location:''}`).join('\n')+`\n\n${sign}`).trim()}
  if(t==='feedback'){const g=byId('logs',ref);if(!g)return '';const s=byId('students',g.studentId);
    const prev=logsOf(g.studentId).find(x=>x.id!==g.id&&((x.date||'')<(g.date||'')||(x.date===g.date&&(x.createdAt||0)<(g.createdAt||0))));
    const up=prev?SKILLS.filter(([k])=>Number(g.skills?.[k]||0)>Number(prev.skills?.[k]||0)).map(([k,n])=>`${n} ${prev.skills?.[k]||0}→${g.skills[k]}`):[];
    return `【今日學習回饋】\n${s?.name||''} 您好，今天辛苦了！\n📅 ${dlabel(g.date)}\n\n🏓 本堂重點：${g.focus||'—'}\n${up.length?`📈 進步項目：${up.join('、')}\n`:''}${g.note?`📝 教練觀察：${g.note}\n`:''}${g.homework?`🏠 回家練習：${g.homework}\n`:''}\n下次見！${sign}`.trim()}
  if(t==='owe'){const s=byId('students',ref);if(!s)return '';const o=owed(s),nl=nextLesson(s.id),f=logsOf(s.id)[0]?.focus;
    const when=nl?`${dlabel(nl.date)} ${nl.time}–${endTime(nl.time,nl.duration)}`:'';
    return `${s.name} 您好！\n跟您核對一下課程費用：${when?`目前預約 ${when} 的課程，`:''}尚有 ${money(Math.max(0,o))} 未結。\n${f?`這陣子在「${f}」進步很明顯，繼續保持！`:''}`.trim()}
  if(t==='report'){const s=byId('students',ref);if(!s)return '';const ls=logsOf(s.id),g=ls[0],f=ls.length>1?ls[ls.length-1]:null;
    let txt=`【學習報告】${s.name}\n${s.goal?`目標：${s.goal}\n`:''}累計上課：${doneCount(s.id)} 堂｜學習紀錄：${ls.length} 筆\n`;
    if(g){txt+=`\n技術評估（${dlabel(g.date)}）\n`+SKILLS.map(([k,n])=>{const v=Number(g.skills?.[k]||0),b=f?Number(f.skills?.[k]||0):null;return `${n}　${stars(v)}${b!==null&&v>b?`  ↑${v-b}`:''}`}).join('\n');if(g.homework)txt+=`\n\n下一階段練習：${g.homework}`}
    return (txt+`\n\n${sign}`).trim()}
  if(t==='trial'){const l=byId('leads',ref);if(!l)return '';const st=SET(),tp=Math.round(totalPriceFor('trial',PRICEHEADS.trial[0])/PRICEHEADS.trial[0]);
    return `${l.name} 您好！歡迎來體驗匹克球 🏓\n\n📅 ${l.trialDate?dlabel(l.trialDate):'（時間確認中）'}${l.trialTime?' '+l.trialTime:''}\n📍 ${st.defaultLocation||'（地點另行通知）'}\n${tp>0?`💰 體驗課 ${money(tp)}／人（多人同行另有優惠）\n`:''}\n請穿運動鞋、帶水，球拍現場可借用。\n有任何問題都可以直接回覆這則訊息！\n${sign}`.trim()}
  if(t==='custom')return `【${B} 公告】\n\n\n${sign}`;
  return '';
}
function vMsg(){
  const types=[['remind','課前提醒'],['week','本週課表'],['feedback','課後回饋'],['owe','收款提醒'],['report','學習報告'],['trial','體驗課邀約'],['custom','自訂公告']];
  let pick='';
  const sel=(label,opts)=>opts.length?`<div class="f"><label for="nref">${label}</label><select id="nref" data-input="nref">${opts.map(([v,n])=>`<option value="${v}" ${v===ui.nref?'selected':''}>${esc(n)}</option>`).join('')}</select></div>`:'';
  if(ui.ntype==='remind'){const ls=all('lessons').filter(l=>l.date>=addDays(today(),-1)&&l.status!=='cancelled').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,40);
    if(!byId('lessons',ui.nref))ui.nref=ls[0]?.id||'';pick=sel('選擇課程',ls.map(l=>[l.id,`${dlabel(l.date)} ${l.time} ${l.title||''}｜${names(l)}`]))||'<div class="empty">沒有即將到來的課程</div>'}
  if(ui.ntype==='feedback'){const gs=all('logs').sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,40);
    if(!byId('logs',ui.nref))ui.nref=gs[0]?.id||'';pick=sel('選擇學習紀錄',gs.map(g=>[g.id,`${dlabel(g.date)}｜${sname(g.studentId)}｜${g.focus||''}`]))||'<div class="empty">還沒有學習紀錄</div>'}
  if(ui.ntype==='owe'||ui.ntype==='report'){const ss=activeStudents().sort((a,b)=>owed(b)-owed(a));
    if(!byId('students',ui.nref))ui.nref=ss[0]?.id||'';pick=sel('選擇學生',ss.map(s=>[s.id,`${s.name}${owed(s)>0?`（待收 ${money(owed(s))}）`:''}`]))||'<div class="empty">還沒有學生</div>'}
  if(ui.ntype==='trial'){const ls=all('leads').filter(l=>['inquiry','trial'].includes(l.status||'inquiry'));
    if(!byId('leads',ui.nref))ui.nref=ls[0]?.id||'';pick=sel('選擇潛在客群',ls.map(l=>[l.id,`${l.name}${l.trialDate?'｜'+dlabel(l.trialDate):''}`]))||'<div class="empty">沒有跟進中的潛在客群</div>'}
  if(ui.ntype==='week')pick=`<div class="weekbar"><button class="btn sm" data-act="week" data-n="-7">‹ 上週</button><div class="t num">${dlabel(ui.week)} – ${dlabel(addDays(ui.week,6))}</div><button class="btn sm" data-act="week" data-n="7">下週 ›</button></div>`;
  return `${subBack}<p class="eyebrow">LINE 訊息</p><h1>訊息產生器</h1><p class="sub">系統自動帶入學生、時間和學習內容。可以先修改文字，再傳到 LINE 個人或群組。</p>
  <div class="filters" style="margin-top:6px">${types.map(([k,n])=>`<button class="chip ${ui.ntype===k?'on':''}" data-act="ntype" data-k="${k}">${n}</button>`).join('')}</div>
  ${pick}
  <div class="f"><label for="msgText">訊息內容（可直接編輯）</label><textarea class="msg" id="msgText">${esc(buildMsg())}</textarea></div>
  <div class="actions"><a class="btn line grow" id="lineLink" href="#" target="_blank" rel="noopener">用 LINE 傳送</a><button class="btn grow" data-act="copy">複製文字</button></div>
  <p class="hint">「用 LINE 傳送」會開啟 LINE，讓你選好友或群組。如果沒有反應，請按「複製文字」再貼到 LINE。</p>`;
}
function syncLineLink(){const ta=document.getElementById('msgText'),a=document.getElementById('lineLink');if(ta&&a)a.href='https://line.me/R/share?text='+encodeURIComponent(ta.value)}
