/* ================== 表單抽屜 ================== */
let sheetSubmit=null;
function openSheet(title,html,onSubmit){
  sheetSubmit=onSubmit;
  document.getElementById('sheetRoot').innerHTML=`<div class="scrim" data-act="scrim"><form class="sheet" id="sf" autocomplete="off" novalidate><div class="hd"><h3>${title}</h3><button type="button" class="x" data-act="close" aria-label="關閉">×</button></div>${html}</form></div>`;
  const first=document.querySelector('#sf input:not([type=hidden]),#sf select');if(first&&matchMedia('(min-width:700px)').matches)first.focus();
}
function closeSheet(){const r=document.getElementById('sheetRoot');if(r)r.innerHTML='';sheetSubmit=null}
const fv=(fd,k)=>(fd.get(k)??'').toString().trim();
const delBtn=(col,id)=>id?`<button type="button" class="btn danger" data-act="del" data-col="${col}" data-id="${id}">刪除</button>`:'';
const byName=(a,b)=>(a.name||'').localeCompare(b.name||'','zh-Hant');
function studentOptions(sel,allowNone){return (allowNone?`<option value="">（不指定學生）</option>`:'')+all('students').filter(s=>(s.status||'active')!=='archived'||s.id===sel).sort(byName).map(s=>`<option value="${s.id}" ${s.id===sel?'selected':''}>${esc(s.name)}</option>`).join('')}
const srcList=()=>`<datalist id="srcs">${[...new Set([...SOURCES,...all('students').map(s=>s.source),...all('leads').map(l=>l.source)].filter(Boolean))].map(x=>`<option>${esc(x)}</option>`).join('')}</datalist>`;

function studentSheet(id,preset={}){
  const s=id?byId('students',id):{status:'active',billing:'package',color:COLORS[all('students').length%COLORS.length],startDate:today(),...preset};
  const tags=[...new Set(all('students').flatMap(x=>x.tags||[]))];
  openSheet(id?'編輯學生':'新增學生',`
  <div class="f"><label for="s_name">姓名 *</label><input id="s_name" name="name" required value="${esc(s.name)}"></div>
  <div class="grid2"><div class="f"><label for="s_phone">電話</label><input id="s_phone" name="phone" inputmode="tel" value="${esc(s.phone)}"></div>
  <div class="f"><label for="s_line">LINE ID</label><input id="s_line" name="lineId" value="${esc(s.lineId)}"></div></div>
  <div class="grid2"><div class="f"><label for="s_level">程度</label><input id="s_level" name="level" list="levels" placeholder="例：2.5 / 初學" value="${esc(s.level)}"><datalist id="levels"><option>初學</option><option>2.0</option><option>2.5</option><option>3.0</option><option>3.5</option><option>4.0</option><option>4.5+</option></datalist></div>
  <div class="f"><label for="s_src">從哪裡來</label><input id="s_src" name="source" list="srcs" value="${esc(s.source)}" placeholder="朋友介紹、IG…">${srcList()}</div></div>
  <div class="f"><label for="s_goal">學習目標</label><input id="s_goal" name="goal" placeholder="例：三個月內穩定打 3.0 雙打" value="${esc(s.goal)}"></div>
  <div class="f"><label for="s_tags">標籤（用逗號分隔）</label><input id="s_tags" name="tags" list="tagl" value="${esc((s.tags||[]).join(', '))}" placeholder="例：週二班, 準備比賽"><datalist id="tagl">${tags.map(t=>`<option>${esc(t)}</option>`).join('')}</datalist></div>
  <div class="f"><span class="lb">代表色</span><div class="swatches">${COLORS.map(c=>`<label><input type="radio" name="color" value="${c}" ${s.color===c?'checked':''} aria-label="顏色 ${c}"><span style="background:${c}"></span></label>`).join('')}</div></div>
  <div class="grid2"><div class="f"><label for="s_bill">收費方式</label><select id="s_bill" name="billing"><option value="package" ${s.billing!=='perLesson'?'selected':''}>預購課程包</option><option value="perLesson" ${s.billing==='perLesson'?'selected':''}>單堂制（上一堂收一堂）</option></select></div>
  <div class="f"><label for="s_price">個人專屬單價（選填）</label><input id="s_price" type="number" min="0" name="price" value="${esc(s.price||'')}" placeholder="留空＝依人數價目表"></div></div>
  <p class="hint">單堂制學生的待收款，預設依「設定 › 課程價目表」用上課人數計算；填了專屬單價就一律用這個價格。排課時若單獨填了「本堂每人價格」，那一堂以課程上填的為準。</p>
  ${!id?`<div class="card" style="margin-top:12px"><span class="lab">同時登記購買課程包（選填）</span><div class="grid3"><div class="f"><label for="s_pn">堂數</label><input id="s_pn" type="number" min="0" name="pkgSessions" placeholder="10"></div><div class="f"><label for="s_pa">金額</label><input id="s_pa" type="number" min="0" name="pkgAmount"></div><div class="f"><label for="s_pe">到期日</label><input id="s_pe" type="date" name="pkgExpiry"></div></div></div>`:''}
  <div class="grid2"><div class="f"><label for="s_start">開始上課日</label><input id="s_start" type="date" name="startDate" value="${esc(s.startDate)}"></div>
  <div class="f"><label for="s_st">狀態</label><select id="s_st" name="status"><option value="active" ${(s.status||'active')==='active'?'selected':''}>上課中</option><option value="paused" ${s.status==='paused'?'selected':''}>暫停</option><option value="archived" ${s.status==='archived'?'selected':''}>封存（不再上課）</option></select></div></div>
  <div class="f"><label for="s_notes">備註（慣用手、傷病、習慣等）</label><textarea id="s_notes" name="notes">${esc(s.notes)}</textarea></div>
  <div class="actions"><button class="btn pri grow">儲存</button>${delBtn('students',id)}</div>`,
  fd=>{const o={...s,name:fv(fd,'name'),phone:fv(fd,'phone'),lineId:fv(fd,'lineId'),level:fv(fd,'level'),source:fv(fd,'source'),goal:fv(fd,'goal'),
      tags:fv(fd,'tags').split(/[,，、]/).map(x=>x.trim().replace(/^#/,'')).filter(Boolean),color:fv(fd,'color')||COLORS[0],billing:fv(fd,'billing'),price:Number(fv(fd,'price'))||0,
      startDate:fv(fd,'startDate'),status:fv(fd,'status'),notes:fv(fd,'notes'),createdAt:s.createdAt||Date.now()};
    delete o.leadId;
    if(!o.name)return toast('請填寫姓名');
    const nid=id||uid();put('students',nid,o);
    const pn=Number(fv(fd,'pkgSessions')||0);
    if(!id&&pn>0)put('payments',uid(),{type:'package',kind:'first',studentId:nid,sessions:pn,amount:Number(fv(fd,'pkgAmount')||0),expiry:fv(fd,'pkgExpiry'),date:today(),method:'轉帳',note:'',createdAt:Date.now()});
    if(preset.leadId&&byId('leads',preset.leadId))put('leads',preset.leadId,{...byId('leads',preset.leadId),status:'won',studentId:nid});
    closeSheet();toast(id?'已更新':'已新增學生');if(!id){ui.tab='stu';ui.sid=nid;ui.sub=null;render()}});
}

function lessonSheet(id,preset={}){
  const st=SET();
  const l=id?byId('lessons',id):{date:preset.d||ui.day||today(),time:'19:00',duration:st.defaultDuration||60,type:'private',capacity:4,feeKind:'normal',payHeads:0,unitPrice:0,deduct:true,status:'scheduled',studentIds:preset.sid?[preset.sid]:[],title:'一對一私人課',location:st.defaultLocation||''};
  const att=l.attendance||{};
  const locs=[...new Set([st.defaultLocation,...all('lessons').map(x=>x.location)].filter(Boolean))];
  const studs=all('students').filter(s=>(s.status||'active')==='active'||(l.studentIds||[]).includes(s.id)).sort(byName);
  openSheet(id?'課程內容':'排課',`
  <div class="grid3"><div class="f"><label for="l_date">日期</label><input id="l_date" type="date" name="date" required value="${esc(l.date)}"></div>
  <div class="f"><label for="l_time">開始</label><input id="l_time" type="time" name="time" required value="${esc(l.time)}"></div>
  <div class="f"><label for="l_dur">時長</label><select id="l_dur" name="duration">${[30,45,60,90,120,150,180].map(m=>`<option value="${m}" ${Number(l.duration)===m?'selected':''}>${m} 分</option>`).join('')}</select></div></div>
  <div class="f"><label for="l_title">課程名稱</label><input id="l_title" name="title" list="titles" value="${esc(l.title)}"><datalist id="titles">${[...new Set(['一對一私人課','雙人課','初學團體班','進階團體班','對打實戰課',...all('lessons').map(x=>x.title)].filter(Boolean))].map(x=>`<option>${esc(x)}</option>`).join('')}</datalist></div>
  <div class="grid2"><div class="f"><label for="l_type">類型</label><select id="l_type" name="type"><option value="private" ${l.type!=='group'?'selected':''}>一對一／小班</option><option value="group" ${l.type==='group'?'selected':''}>團體課（有名額）</option></select></div>
  <div class="f"><label for="l_cap">團體名額</label><input id="l_cap" type="number" min="1" max="40" name="capacity" value="${esc(l.capacity||4)}"></div></div>
  <div class="f"><label for="l_loc">地點</label><input id="l_loc" name="location" list="locs" value="${esc(l.location)}" placeholder="球場名稱、場地號"><datalist id="locs">${locs.map(x=>`<option>${esc(x)}</option>`).join('')}</datalist></div>
  <div class="f"><span class="lb">學生</span>${studs.length?`<div class="picks">${studs.map(s=>`<label class="pick"><input type="checkbox" name="sids" value="${s.id}" ${(l.studentIds||[]).includes(s.id)?'checked':''}><span><i class="cdot" style="background:${sColor(s)}"></i>${esc(s.name)}</span></label>`).join('')}</div>`:'<p class="hint">還沒有學生，可以先排課、之後再加入。</p>'}</div>
  <div class="grid3"><div class="f"><label for="l_fee">課程性質</label><select id="l_fee" name="feeKind">${Object.entries(PRICEKIND).map(([k,n])=>`<option value="${k}" ${feeKindOf(l)===k?'selected':''}>${n}</option>`).join('')}</select></div>
  <div class="f"><label for="l_heads">收費人數</label><input id="l_heads" type="number" min="0" max="20" step="1" inputmode="numeric" name="payHeads" value="${esc(l.payHeads||'')}" placeholder="依人數"></div>
  <div class="f"><label for="l_price">本堂每人價格</label><input id="l_price" type="number" min="0" step="10" inputmode="numeric" name="unitPrice" value="${esc(l.unitPrice||'')}" placeholder="依價目表"></div></div>
  <p class="hint" id="l_feeinfo"></p>
  <label class="check"><input type="checkbox" name="deduct" ${l.deduct!==false?'checked':''}> 出席或未到時扣堂（課程包）／計費（單堂制）</label>
  ${!id?`<div class="f"><label for="l_rep">每週重複</label><select id="l_rep" name="repeat">${[1,2,4,6,8,10,12].map(n=>`<option value="${n}">${n===1?'不重複':`共 ${n} 週`}</option>`).join('')}</select></div>`:''}
  ${id&&(l.studentIds||[]).length?`<div class="f"><span class="lb">點名</span>${l.studentIds.map(sid=>`<div class="att"><b>${esc(sname(sid))}</b><div class="seg">${[['present','出席'],['leave','請假'],['noshow','未到']].map(([v,n])=>`<label><input type="radio" name="att_${sid}" value="${v}" ${att[sid]===v?'checked':''}><span>${n}</span></label>`).join('')}</div></div>`).join('')}<p class="hint">請假不扣堂；未到會扣堂。${st.deductMode==='hours'?`這堂依時數扣 ${fmtNum(Number(l.duration||60)/60)} 堂。`:''}</p>${l.studentIds.length>1?'<button type="button" class="btn sm" data-act="all-present" style="margin-top:8px">全部出席</button>':''}</div>`:''}
  ${id?`<div class="f"><label for="l_st">狀態</label><select id="l_st" name="status"><option value="scheduled" ${l.status==='scheduled'?'selected':''}>已排定</option><option value="done" ${l.status==='done'?'selected':''}>已完成</option><option value="cancelled" ${l.status==='cancelled'?'selected':''}>已取消</option></select></div>`:''}
  <div class="f"><label for="l_note">備註</label><textarea id="l_note" name="note">${esc(l.note)}</textarea></div>
  <div class="actions"><button class="btn pri grow">儲存</button>${delBtn('lessons',id)}</div>
  ${id?`<div class="actions" style="margin-top:8px"><button type="button" class="btn line" data-act="remind-lesson" data-id="${id}">傳上課提醒</button><button type="button" class="btn" data-act="ics" data-id="${id}">加入手機行事曆</button>${(l.studentIds||[]).length===1?`<button type="button" class="btn" data-act="new-log" data-sid="${l.studentIds[0]}" data-lid="${id}">寫學習紀錄</button>`:''}<button type="button" class="btn" data-act="dup-lesson" data-id="${id}">複製到下週</button></div>`:''}`,
  fd=>{
    const sids=fd.getAll('sids').map(String);
    const o={...l,date:fv(fd,'date'),time:fv(fd,'time'),duration:Number(fv(fd,'duration')||60),title:fv(fd,'title')||'匹克球課',type:fv(fd,'type'),capacity:Number(fv(fd,'capacity')||4),location:fv(fd,'location'),studentIds:sids,feeKind:fv(fd,'feeKind')==='trial'?'trial':'normal',payHeads:Math.max(0,Math.round(Number(fv(fd,'payHeads')||0))),unitPrice:Math.max(0,Math.round(Number(fv(fd,'unitPrice')||0))),deduct:fd.get('deduct')==='on',note:fv(fd,'note')};
    if(!o.date||!o.time)return toast('請填寫日期和時間');
    if(o.type==='group'&&sids.length>o.capacity)return toast(`已選 ${sids.length} 位，超過名額 ${o.capacity}`);
    const clash=all('lessons').find(x=>x.id!==id&&x.date===o.date&&x.status!=='cancelled'&&toMin(x.time)<toMin(o.time)+o.duration&&toMin(o.time)<toMin(x.time)+Number(x.duration||60));
    if(id){const a={};sids.forEach(s=>{const v=fv(fd,'att_'+s);if(v)a[s]=v});o.attendance=a;o.status=fv(fd,'status')||'scheduled';
      if(o.status==='scheduled'&&Object.keys(a).length&&o.date<=today())o.status='done';
      put('lessons',id,o);closeSheet();toast(clash?`已儲存。注意：和 ${clash.time} 的課時間重疊`:'已儲存');
    }else{const n=Number(fv(fd,'repeat')||1);o.attendance={};o.status='scheduled';o.createdAt=Date.now();
      for(let i=0;i<n;i++)put('lessons',uid(),{...o,date:addDays(o.date,i*7)});
      ui.day=o.date;ui.week=weekStart(o.date);closeSheet();toast((n>1?`已排 ${n} 堂課`:'已排課')+(clash?`。注意：和 ${clash.time} 的課時間重疊`:''));
    }});
  feeInfo();
}
// 排課表單裡即時顯示這堂的收費（改人數、時長、課程性質時會重算）
function feeInfo(){
  const f=document.getElementById('sf'),box=document.getElementById('l_feeinfo');if(!f||!box)return;
  const kind=document.getElementById('l_fee')?.value==='trial'?'trial':'normal';
  const manual=Math.round(Number(document.getElementById('l_heads')?.value||0));
  const n=manual>0?manual:Math.max(1,f.querySelectorAll('input[name="sids"]:checked').length);
  const own=Math.max(0,Math.round(Number(document.getElementById('l_price')?.value||0)));
  const l={feeKind:kind,payHeads:n,unitPrice:own,duration:Number(document.getElementById('l_dur')?.value||60)};
  const per=Math.round(lessonUnitPrice(l)*unitsOf(l));
  box.textContent=`${PRICEKIND[kind]}${n>4?`${n} 人`:HEADLABEL[n]}：每人 ${money(per)}，整堂共 ${money(per*n)}。${own>0?'這堂是自訂價格，不受價目表影響。':'價格可到「更多 › 設定 › 課程價目表」調整，或在上面直接填這堂的價格。'}`;
}

function logSheet(id,preset={}){
  if(!all('students').length){toast('請先新增學生');return}
  const g=id?byId('logs',id):null;
  const sid=g?.studentId||preset.sid||activeStudents().sort(byName)[0]?.id||all('students')[0].id;
  const prev=g?null:logsOf(sid)[0];
  const sk=g?.skills||prev?.skills||Object.fromEntries(SKILLS.map(([k])=>[k,2]));
  const lid=g?.lessonId||preset.lid||'';
  const date=g?.date||(lid&&byId('lessons',lid)?.date)||today();
  openSheet(id?'編輯學習紀錄':'寫學習紀錄',`
  <div class="grid2"><div class="f"><label for="g_s">學生</label><select id="g_s" name="studentId">${studentOptions(sid)}</select></div>
  <div class="f"><label for="g_d">日期</label><input id="g_d" type="date" name="date" value="${esc(date)}"></div></div>
  <div class="f"><label for="g_l">對應課程</label><select id="g_l" name="lessonId">${lessonOptsHtml(sid,lid)}</select></div>
  <div class="f"><label for="g_f">本堂重點</label><input id="g_f" name="focus" value="${esc(g?.focus)}" placeholder="例：第三拍吊球落點、廚房區耐心"></div>
  <div class="f"><span class="lb">技術評分（1 入門 – 5 熟練）${prev?'　已帶入上次分數':''}</span>
  ${SKILLS.map(([k,n])=>`<div class="sk"><label for="sk_${k}">${n}</label><input type="range" id="sk_${k}" name="sk_${k}" min="1" max="5" step="1" value="${Number(sk[k]||2)}" data-out="o_${k}"><output id="o_${k}">${Number(sk[k]||2)}</output></div>`).join('')}</div>
  <div class="f"><label for="g_n">教練觀察</label><textarea id="g_n" name="note" placeholder="做得好的地方、需要修正的動作">${esc(g?.note)}</textarea></div>
  <div class="f"><label for="g_h">回家作業</label><input id="g_h" name="homework" value="${esc(g?.homework)}" placeholder="例：對牆 dink 每天 100 下"></div>
  <div class="actions"><button class="btn pri grow">儲存</button>${id?`<button type="button" class="btn line" data-act="feedback" data-id="${id}">傳回饋給學生</button>`:''}${delBtn('logs',id)}</div>`,
  fd=>{const skills=Object.fromEntries(SKILLS.map(([k])=>[k,Number(fd.get('sk_'+k)||1)]));
    const o={...(g||{}),studentId:fv(fd,'studentId'),date:fv(fd,'date')||today(),lessonId:fv(fd,'lessonId'),focus:fv(fd,'focus'),note:fv(fd,'note'),homework:fv(fd,'homework'),skills,createdAt:g?.createdAt||Date.now()};
    const nid=id||uid();put('logs',nid,o);closeSheet();ui.ntype='feedback';ui.nref=nid;
    toast('已儲存，可以到學生頁傳回饋');if(!id){ui.tab='stu';ui.sid=o.studentId;ui.sub=null;render()}});
}
function lessonOptsHtml(sid,sel){return '<option value="">（不指定）</option>'+lessonsOf(sid).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,20).map(l=>`<option value="${l.id}" ${l.id===sel?'selected':''}>${dlabel(l.date)} ${l.time} ${esc(l.title||'')}</option>`).join('')}

function paymentSheet(id,preset={}){
  const s=preset.sid?byId('students',preset.sid):null;
  const p=id?byId('payments',id):{type:preset.type||'package',kind:preset.sid&&hasPkg(preset.sid)?'renew':'first',studentId:preset.sid||'',date:today(),method:'轉帳',sessions:10,amount:preset.type==='single'&&s?Math.max(0,owed(s)):''};
  const carry=preset.sid&&!id&&p.type==='package'?remaining(preset.sid):null;
  openSheet(id?'編輯收支':(p.type==='package'&&preset.sid?'續約／購課':'記一筆'),`
  <div class="f"><label for="p_t">類別</label><select id="p_t" name="type">${Object.entries(PAYTYPES).map(([k,[n,d]])=>`<option value="${k}" ${p.type===k?'selected':''}>${d==='in'?'收入':'支出'}・${n}</option>`).join('')}</select></div>
  <div class="f"><label for="p_s">學生</label><select id="p_s" name="studentId">${studentOptions(p.studentId,true)}</select></div>
  <div class="f pkgonly"><span class="lb">購課類型</span><div class="picks">${Object.entries(PKGKIND).map(([k,n])=>`<label class="pick"><input type="radio" name="kind" value="${k}" ${(p.kind||'first')===k?'checked':''}><span>${n}</span></label>`).join('')}</div></div>
  <div class="grid2"><div class="f"><label for="p_a">金額（元）</label><input id="p_a" type="number" min="0" step="1" inputmode="numeric" name="amount" required value="${esc(p.amount)}"></div>
  <div class="f pkgonly"><label for="p_n">堂數</label><input id="p_n" type="number" min="0" step="0.5" name="sessions" value="${esc(p.sessions||'')}"></div></div>
  <div class="grid2"><div class="f"><label for="p_d">日期</label><input id="p_d" type="date" name="date" value="${esc(p.date)}"></div>
  <div class="f pkgonly"><label for="p_e">到期日（選填）</label><input id="p_e" type="date" name="expiry" value="${esc(p.expiry)}"></div></div>
  <div class="f"><label for="p_m">付款方式</label><select id="p_m" name="method">${METHODS.map(m=>`<option ${p.method===m?'selected':''}>${m}</option>`).join('')}</select></div>
  <div class="f"><label for="p_note">備註</label><input id="p_note" name="note" value="${esc(p.note)}" placeholder="例：10 堂方案、場地租借 2 小時"></div>
  ${carry!==null&&carry!==0?`<p class="hint">${carry>0?`目前還剩 ${fmtNum(carry)} 堂，新購的堂數會直接加上去（結轉）。`:`目前超上 ${fmtNum(-carry)} 堂，新購的堂數會先扣掉這些。`}</p>`:''}
  <p class="hint">課程包登記後，點名出席或未到時會自動扣堂。</p>
  <div class="actions"><button class="btn pri grow">儲存</button>${delBtn('payments',id)}</div>`,
  fd=>{const type=fv(fd,'type');const o={...p,type,studentId:fv(fd,'studentId'),amount:Number(fv(fd,'amount')||0),sessions:type==='package'?Number(fv(fd,'sessions')||0):0,kind:type==='package'?fv(fd,'kind')||'first':'',expiry:type==='package'?fv(fd,'expiry'):'',date:fv(fd,'date')||today(),method:fv(fd,'method'),note:fv(fd,'note'),createdAt:p.createdAt||Date.now()};
    if(type==='package'&&!o.studentId)return toast('課程包請選擇學生');
    if(type==='package'&&!o.sessions)return toast('請填寫堂數');
    put('payments',id||uid(),o);closeSheet();toast('已記帳')});
  togglePkg();
}
function togglePkg(){const t=document.getElementById('p_t');if(!t)return;document.querySelectorAll('#sf .pkgonly').forEach(n=>n.hidden=t.value!=='package')}

function leadSheet(id){
  const l=id?byId('leads',id):{status:'inquiry',date:today()};
  openSheet(id?'潛在客群':'新增潛在客群',`
  <div class="f"><label for="d_name">姓名 *</label><input id="d_name" name="name" required value="${esc(l.name)}"></div>
  <div class="grid2"><div class="f"><label for="d_c">電話／LINE</label><input id="d_c" name="contact" value="${esc(l.contact)}"></div>
  <div class="f"><label for="d_src">來源</label><input id="d_src" name="source" list="srcs" value="${esc(l.source)}">${srcList()}</div></div>
  <div class="grid2"><div class="f"><label for="d_d">詢問日期</label><input id="d_d" type="date" name="date" value="${esc(l.date)}"></div>
  <div class="f"><label for="d_s">狀態</label><select id="d_s" name="status">${Object.entries(LEADST).map(([k,[n]])=>`<option value="${k}" ${(l.status||'inquiry')===k?'selected':''}>${n}</option>`).join('')}</select></div></div>
  <div class="grid2"><div class="f"><label for="d_td">體驗課日期</label><input id="d_td" type="date" name="trialDate" value="${esc(l.trialDate)}"></div>
  <div class="f"><label for="d_tt">體驗課時間</label><input id="d_tt" type="time" name="trialTime" value="${esc(l.trialTime)}"></div></div>
  <div class="f"><label for="d_n">備註</label><textarea id="d_n" name="note" placeholder="想學什麼、程度、方便的時段">${esc(l.note)}</textarea></div>
  <div class="actions"><button class="btn pri grow">儲存</button>${delBtn('leads',id)}</div>
  ${id?`<div class="actions" style="margin-top:8px">${l.studentId&&byId('students',l.studentId)?`<button type="button" class="btn" data-act="open-student" data-id="${l.studentId}">查看學生資料</button>`:`<button type="button" class="btn cta" data-act="convert-lead" data-id="${id}">成交，轉成學生</button>`}<button type="button" class="btn line" data-act="trial-msg" data-id="${id}">傳體驗課訊息</button></div>`:''}`,
  fd=>{const o={...l,name:fv(fd,'name'),contact:fv(fd,'contact'),source:fv(fd,'source'),date:fv(fd,'date')||today(),status:fv(fd,'status'),trialDate:fv(fd,'trialDate'),trialTime:fv(fd,'trialTime'),note:fv(fd,'note'),createdAt:l.createdAt||Date.now()};
    if(!o.name)return toast('請填寫姓名');if(o.trialDate&&o.status==='inquiry')o.status='trial';
    put('leads',id||uid(),o);closeSheet();toast('已儲存')});
}

/* ================== 匯出 ================== */
function download(filename,text,type){
  try{const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
  catch(_){toast('這個瀏覽器無法下載檔案')}
}
function ics(l){
  const dt=(d,t)=>d.replace(/-/g,'')+'T'+t.replace(':','')+'00';
  const e=s=>String(s||'').replace(/[,;\\]/g,m=>'\\'+m).replace(/\n/g,'\\n');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PickleCoach//ZH','BEGIN:VEVENT',`UID:${l.id}@picklecoach`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}Z`,`DTSTART;TZID=Asia/Taipei:${dt(l.date,l.time)}`,`DTEND;TZID=Asia/Taipei:${dt(l.date,endTime(l.time,l.duration))}`,`SUMMARY:${e((l.title||'匹克球課')+'｜'+names(l))}`,`LOCATION:${e(l.location)}`,`DESCRIPTION:${e(l.note)}`,'BEGIN:VALARM','TRIGGER:-PT60M','ACTION:DISPLAY','DESCRIPTION:上課提醒','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
}
function csv(){
  const rows=[['日期','類別','購課類型','收支','學生','金額','堂數','到期日','方式','備註']];
  all('payments').filter(p=>(p.date||'').startsWith(ui.month)).sort((a,b)=>a.date.localeCompare(b.date)).forEach(p=>{const[n,d]=PAYTYPES[p.type]||['其他','in'];rows.push([p.date,n,PKGKIND[p.kind]||'',d==='in'?'收入':'支出',p.studentId?sname(p.studentId):'',p.amount,p.sessions||'',p.expiry||'',p.method||'',p.note||''])});
  return '﻿'+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
}
function importBackup(file){
  const rd=new FileReader();
  rd.onload=()=>{try{const x=normalize(JSON.parse(rd.result));const n=COLS.reduce((a,c)=>a+Object.keys(x[c]).length,0);if(!n)return toast('這個檔案裡沒有資料');
      for(const c of COLS)for(const r of Object.values(x[c]))r.updatedAt=Math.max(Number(r.updatedAt||0),Date.now());
      D=merge(D,x);changed();toast(`已匯入 ${n} 筆資料`)}catch(_){toast('檔案格式不正確，請選擇本系統下載的備份檔')}};
  rd.readAsText(file);
}

/* ================== 範例資料（試用模式） ================== */
function seedDemo(){
  const t=today(),ws=weekStart(t),now=Date.now();let k=0;const mk=o=>({...o,createdAt:now+(k++),updatedAt:now});
  D=emptyData();D.settings=fillSettings({coachName:'教練',brand:'範例匹克球教室',defaultLocation:'大安運動中心 B2',updatedAt:now});
  const S=(id,o)=>D.students[id]={id,status:'active',billing:'package',...mk(o)};
  S('s1',{name:'範例・王小明',level:'2.5',source:'朋友介紹',goal:'年底前穩定打 3.0 雙打',tags:['週二班'],color:COLORS[0],startDate:addDays(t,-45),phone:'0912-000-111',lineId:'xiaoming_pb',notes:'右手持拍，反手偏弱'});
  S('s2',{name:'範例・陳美玲',level:'初學',source:'Instagram',goal:'學會規則，能和朋友打休閒賽',tags:['週二班'],color:COLORS[1],startDate:addDays(t,-25)});
  S('s3',{name:'範例・林志豪',level:'3.0',source:'體驗課',goal:'參加下個月業餘賽',tags:['準備比賽'],color:COLORS[2],startDate:addDays(t,-60),notes:'網球轉匹克球，抽球習慣過重'});
  S('s4',{name:'範例・張雅婷',level:'2.0',source:'LINE 社群',goal:'增加運動量',color:COLORS[4],billing:'perLesson',startDate:addDays(t,-20)});
  const P=(id,o)=>D.payments[id]={id,...mk(o)};
  P('p1',{type:'package',kind:'first',studentId:'s1',amount:12000,sessions:10,date:addDays(t,-45),expiry:addDays(t,75),method:'轉帳',note:'10 堂方案'});
  P('p2',{type:'package',kind:'first',studentId:'s2',amount:6500,sessions:5,date:addDays(t,-25),expiry:addDays(t,10),method:'LINE Pay',note:'5 堂體驗方案'});
  P('p3',{type:'package',kind:'renew',studentId:'s3',amount:12000,sessions:10,date:addDays(t,-12),method:'現金',note:'第二期'});
  P('p3a',{type:'package',kind:'first',studentId:'s3',amount:12000,sessions:10,date:addDays(t,-60),method:'現金',note:'10 堂方案'});
  P('p4',{type:'venue',amount:1600,date:addDays(t,-8),method:'轉帳',note:'場地租借 4 小時'});
  P('p5',{type:'single',studentId:'s4',amount:900,date:addDays(t,-13),method:'現金'});
  const L=(id,d,time,o)=>D.lessons[id]={id,date:d,time,duration:60,title:'一對一私人課',type:'private',capacity:4,location:'大安運動中心 B2',deduct:true,attendance:{},status:'scheduled',note:'',...mk(o)};
  for(let i=1;i<=8;i++){const d=addDays(t,-i*7);if(i<=6)L('w3'+i,addDays(d,1),'10:00',{studentIds:['s3'],attendance:{s3:'present'},status:'done'});}
  for(let i=1;i<=5;i++)L('w1'+i,addDays(t,-i*7+2),'19:00',{studentIds:['s1'],attendance:{s1:i===3?'leave':'present'},status:'done'});
  L('g1',addDays(t,-7),'20:00',{title:'初學團體班',type:'group',duration:90,studentIds:['s1','s2','s4'],attendance:{s1:'present',s2:'present',s4:'present'},status:'done'});
  L('g0',addDays(t,-14),'20:00',{title:'初學團體班',type:'group',duration:90,studentIds:['s2','s4'],attendance:{s2:'present',s4:'present'},status:'done'});
  L('m1',addDays(t,-21),'19:00',{studentIds:['s2'],attendance:{s2:'present'},status:'done'});
  L('m2',addDays(t,-2),'19:00',{studentIds:['s2'],status:'scheduled'});
  L('t1',t,'19:00',{studentIds:['s3'],note:'練第三拍吊球'});
  L('t2',t,'20:00',{title:'初學團體班',type:'group',duration:90,studentIds:['s1','s2']});
  L('u1',addDays(t,2),'10:00',{studentIds:['s1'],location:'青年公園匹克球場'});
  L('u2',addDays(ws,12),'20:00',{title:'初學團體班',type:'group',duration:90,studentIds:['s1','s4']});
  L('tr1',addDays(t,-4),'10:00',{title:'體驗課',feeKind:'trial',payHeads:2,studentIds:[],status:'done',note:'黃先生帶朋友一起來體驗'});
  L('tr2',addDays(t,3),'10:00',{title:'體驗課',feeKind:'trial',payHeads:1,studentIds:[],note:'範例・黃先生，完全新手'});
  const G=(id,o)=>D.logs[id]={id,...mk(o)};
  G('l1',{studentId:'s1',date:addDays(t,-40),focus:'首次能力評估',note:'正手穩定，反手容易下網；站位太靠後，常停在無人區。',homework:'對牆反手推擋每天 50 下',skills:{serve:3,return:2,dink:2,drop:1,drive:3,volley:2,footwork:2,strategy:2}});
  G('l2',{studentId:'s1',date:addDays(t,-5),lessonId:'w11',focus:'第三拍吊球落點、上網時機',note:'吊球成功率從三成提升到六成，接發後能主動上網。反手 dink 還要放鬆手腕。',homework:'和球友練 dink 對打 10 分鐘，不急著攻擊',skills:{serve:3,return:3,dink:3,drop:3,drive:3,volley:3,footwork:3,strategy:3}});
  G('l3',{studentId:'s2',date:addDays(t,-21),lessonId:'m1',focus:'握拍與下手發球',note:'發球已能過網並大致落在區內，記分規則還在熟悉。',homework:'看一場雙打比賽，試著自己喊分',skills:{serve:2,return:2,dink:1,drop:1,drive:1,volley:1,footwork:2,strategy:1}});
  G('l4',{studentId:'s3',date:addDays(t,-50),focus:'把網球抽球改成控制型擊球',note:'力量足但太多平抽，廚房區耐心不夠。',homework:'三拍內不殺球，只 dink',skills:{serve:4,return:3,dink:2,drop:2,drive:5,volley:3,footwork:4,strategy:2}});
  G('l5',{studentId:'s3',date:addDays(t,-8),focus:'重置球與比賽節奏',note:'被壓制時能用 reset 回到廚房線，dink 對抗能撐 15 拍以上。',homework:'比賽中每局至少嘗試 3 次第三拍吊球',skills:{serve:4,return:4,dink:4,drop:3,drive:5,volley:4,footwork:4,strategy:3}});
  const Ld=(id,o)=>D.leads[id]={id,...mk(o)};
  Ld('d1',{name:'範例・黃先生',source:'Instagram',contact:'LINE: huang88',status:'trial',date:addDays(t,-3),trialDate:addDays(t,3),trialTime:'10:00',note:'完全新手，想週末上課'});
  Ld('d2',{name:'範例・李小姐',source:'朋友介紹',status:'inquiry',date:addDays(t,-1),note:'問團體班價格'});
  Ld('d3',{name:'範例・林志豪',source:'體驗課',status:'won',date:addDays(t,-62),studentId:'s3'});
  Ld('d4',{name:'範例・周先生',source:'Instagram',status:'lost',date:addDays(t,-30),note:'時間配合不上'});
  saveLocal();
}
