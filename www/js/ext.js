/* TaskHabit v2 — accounts & sync, English, search/filter/sort, drag reorder, reminders, JSON files */
const X=(a,e)=>S.set.lang==='en'?e:a;
let H,sy,busy,again,AC={};try{AC=JSON.parse(localStorage.getItem('habit.acc'))||{}}catch(e){}
const saveAC=()=>{try{localStorage.setItem('habit.acc',JSON.stringify(AC))}catch(e){}};
const Q={q:'',cat:'',sort:'ord'};
document.head.insertAdjacentHTML('beforeend',`<style>
.hd{touch-action:none;cursor:grab;color:var(--mute);width:22px;height:44px;font-size:20px;flex:none}
.nodrag .hd{display:none}.task.drag{box-shadow:0 8px 24px #0004;opacity:.9}
.pw{position:relative}.fld .pw input:not([type=checkbox]):not([type=radio]){padding-inline-end:52px}.pw .eye{position:absolute;inset-inline-end:6px;top:50%;transform:translateY(-50%);min-height:38px;min-width:42px;border:0;background:none;font-size:19px;cursor:pointer;border-radius:10px}
.fb{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 12px}
.fb input,.fb select{min-height:44px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);padding:0 12px}.fb input{flex:1;min-width:150px}
[dir=ltr] .dy i{background:linear-gradient(to right,var(--ok) calc(var(--p)*1%),var(--line) 0)}
[dir=ltr] .dy.on i{background:linear-gradient(to right,var(--on) calc(var(--p)*1%),#ffffff44 0)}
</style>`);

/* ---------- change tracking (per-record timestamps + tombstones, used for sync) ---------- */
const recs=()=>{const m={};S.tasks.forEach(t=>m['t:'+t.id]=JSON.stringify(t));for(const k in S.logs)m['l:'+k]=JSON.stringify(S.logs[k]);for(const k in S.notes)m['n:'+k]=S.notes[k];for(const k in S.mood||{})m['m:'+k]=JSON.stringify(S.mood[k]);return m};
function stamp(){const c=recs(),n=Date.now();H=H||{};
for(const k in c)if(H[k]!==c[k]){S.u[k]=n;delete S.x[k];H[k]=c[k]}
for(const k in H)if(!(k in c)){S.u[k]=n;S.x[k]=1;delete H[k]}}
const CL={l:'logs',n:'notes',m:'mood'};
function merge(r){r={tasks:[],logs:{},notes:{},mood:{},u:{},x:{},...r};S.mood=S.mood||{};
const put2=(k,del)=>{const p=k[0],id=k.slice(2);
if(p==='t'){S.tasks=S.tasks.filter(t=>t.id!==id);if(!del)S.tasks.push(r.tasks.find(t=>t.id===id))}
else{const m=CL[p];del?delete S[m][id]:S[m][id]=r[m][id]}};
for(const k in r.u)if(r.u[k]>(S.u[k]||0)){const del=!!r.x[k];if(del||(k[0]==='t'?r.tasks.some(t=>t.id===k.slice(2)):k.slice(2)in r[CL[k[0]]])){put2(k,del);S.u[k]=r.u[k];del?S.x[k]=1:delete S.x[k]}}
S.tasks.sort((a,b)=>(a.ord||0)-(b.ord||0));H=recs()}

/* ---------- accounts & cloud sync ---------- */
const SERVER='https://taskhabit-server.onrender.com',DEF=()=>window.Capacitor||location.protocol==='file:'?SERVER:'';/* web = same origin; phone/desktop apps use the hosted server automatically */
const api=async(p,o={})=>{const base=(AC.url||DEF()).replace(/\/+$/,'');
const r=await fetch(base+'/api/'+p,{...o,headers:{'Content-Type':'application/json',...(AC.tok?{Authorization:'Bearer '+AC.tok}:{})}});
const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||r.status);return j};
async function cloud(){if(!AC.tok)return;if(busy){again=1;return}busy=1;
try{stamp();const r=await api('data');merge(r.data||{});
await api('data',{method:'PUT',body:JSON.stringify({tasks:S.tasks,logs:S.logs,notes:S.notes,mood:S.mood||{},u:S.u,x:S.x})});
try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}AC.last=Date.now();AC.err='';saveAC();render()}
catch(e){if(e.message==='auth'){AC.tok='';AC.err=X('انتهت الجلسة، سجّل الدخول من جديد.','Session expired. Please sign in again.')}else AC.err=X('المزامنة متوقفة (لا اتصال).','Sync paused (offline).');saveAC()}
busy=0;if(again){again=0;cloud()}}
const EM=c=>({exists:X('هذا البريد مسجّل مسبقًا.','This email is already registered.'),bad:X('بريد إلكتروني غير صالح.','Invalid email address.'),pw:X('كلمة المرور قصيرة (8 أحرف على الأقل).','Password is too short (8+ characters).'),creds:X('البريد أو كلمة المرور غير صحيحة.','Wrong email or password.'),rate:X('محاولات كثيرة، حاول بعد قليل.','Too many attempts. Try again shortly.')})[c]||(c==='Failed to fetch'?X('تعذّر الوصول إلى الخادم.','Can’t reach the server.'):c);
function afterSave(){clearTimeout(sy);sy=setTimeout(()=>{cloud();native()},1500)}

/* ---------- search / filter / sort / drag reorder ---------- */
const nodrag=()=>Q.sort!=='ord'||Q.q||Q.cat?'nodrag':'';
function filt(a){const q=Q.q.trim().toLowerCase();a=a.filter(t=>(!Q.cat||t.cat===Q.cat)&&(!q||(t.name+' '+(t.desc||'')+' '+(t.cat||'')).toLowerCase().includes(q)));
if(Q.sort==='name')a=[...a].sort((p,r)=>p.name.localeCompare(r.name,S.set.lang));if(Q.sort==='new')a=[...a].sort((p,r)=>r.created.localeCompare(p.created));return a}
function bar(){const cats=[...new Set(S.tasks.filter(t=>!t.arch).map(t=>t.cat).filter(Boolean))];
return`<div class="fb"><input id="sq" type="search" placeholder="🔍 ${X('بحث في المهام…','Search tasks…')}" value="${esc(Q.q)}" aria-label="${X('بحث','Search')}"><select id="sc" aria-label="${X('الفئة','Category')}"><option value="">${X('كل الفئات','All categories')}</option>${cats.map(c=>`<option ${c===Q.cat?'selected':''}>${esc(c)}</option>`).join('')}</select><select id="ss" aria-label="${X('الفرز','Sort')}">${[['ord',X('ترتيبي','My order')],['name',X('الاسم','Name')],['new',X('الأحدث','Newest')]].map(([v,l])=>`<option value="${v}" ${v===Q.sort?'selected':''}>${l}</option>`).join('')}</select></div>`}
const relist=()=>{const l=$('#lst');if(l){l.className=nodrag();l.innerHTML=list(day);afterRender(l)}};
document.addEventListener('input',e=>{if(e.target.id==='sq'){Q.q=e.target.value;relist()}});
document.addEventListener('change',e=>{const i=e.target.id;if(i==='sc'){Q.cat=e.target.value;relist()}if(i==='ss'){Q.sort=e.target.value;relist()}});
let dr;
document.addEventListener('pointerdown',e=>{const h=e.target.closest('.hd');if(!h)return;dr=h.closest('.task');dr.classList.add('drag');h.setPointerCapture(e.pointerId);e.preventDefault()});
document.addEventListener('pointermove',e=>{if(!dr)return;const o=document.elementFromPoint(e.clientX,e.clientY)?.closest('.task[data-tid]');
if(o&&o!==dr&&o.parentNode===dr.parentNode){const r=o.getBoundingClientRect();o.parentNode.insertBefore(dr,e.clientY<r.top+r.height/2?o:o.nextSibling)}});
document.addEventListener('pointerup',()=>{if(!dr)return;dr.classList.remove('drag');
const ids=$$('.task[data-tid]',$('#lst')).map(a=>a.dataset.tid),ts=ids.map(T),pos=ts.map(t=>S.tasks.indexOf(t)).sort((a,b)=>a-b);
pos.forEach((p,i)=>S.tasks[p]=ts[i]);S.tasks.forEach((t,i)=>t.ord=i);dr=null;save();render()});

/* ---------- reminders ---------- */
const FR=(()=>{try{return JSON.parse(localStorage.getItem('habit.fr'))||{}}catch(e){return{}}})();
function notify(t){const m=X('حان وقت مهمتك','Time for your task');toast(t.name+' — '+m);
if(window.Notification&&Notification.permission==='granted'){const o={body:m,icon:'icon-192.png',tag:t.id};
navigator.serviceWorker?.ready.then(r=>r.showNotification(t.name,o)).catch(()=>new Notification(t.name,o))||new Notification(t.name,o)}}
setInterval(()=>{const n=new Date(),ds=iso(n),cur=n.getHours()*60+n.getMinutes();
dayTasks(ds).forEach(t=>{if(!t.rem||isDone(t,ds)||FR[ds+t.id])return;const d=cur-(+t.rem.slice(0,2)*60+ +t.rem.slice(3));
if(d>=0&&d<5){FR[ds+t.id]=1;try{localStorage.setItem('habit.fr',JSON.stringify(Object.fromEntries(Object.entries(FR).filter(([k])=>k.startsWith(ds)))))}catch(e){}notify(t)}})},20000);
const askPerm=()=>window.Notification?Notification.requestPermission().then(p=>toast(p==='granted'?X('تم تفعيل الإشعارات','Notifications enabled'):X('الإشعارات غير مفعّلة في المتصفح','Notifications are off'))):toast(X('الإشعارات غير مدعومة هنا','Notifications aren’t supported here'));
document.addEventListener('submit',e=>{if(e.target.id==='f'&&e.target.rem?.value)askPerm()});
async function native(){const N=window.Capacitor?.Plugins?.LocalNotifications;if(!N)return;
try{await N.requestPermissions();const p=await N.getPending();if(p.notifications.length)await N.cancel(p);const ns=[];let id=1;
for(let i=0;i<14;i++){const d=add(new Date(),i);S.tasks.forEach(t=>{if(t.rem&&!t.arch&&!t.pause&&due(t,d)){const[h,m]=t.rem.split(':'),at=new Date(d.getFullYear(),d.getMonth(),d.getDate(),+h,+m);
if(at>new Date()&&!(i===0&&isDone(t,iso(d))))ns.push({id:id++,title:t.name,body:X('حان وقت مهمتك','Time for your task'),schedule:{at}})}})}
if(ns.length)await N.schedule({notifications:ns})}catch(e){}}

/* ---------- JSON file export / import ---------- */
ACT.exp=async()=>{const f=new File([JSON.stringify({app:'taskhabit',v:2,...S},null,1)],'taskhabit-'+TD()+'.json',{type:'application/json'});
if(navigator.canShare?.({files:[f]})&&/Android|iPhone|iPad/.test(navigator.userAgent)){try{await navigator.share({files:[f]});return}catch(e){}}
const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
ACT.imp=()=>$('#fi').click();
document.addEventListener('change',e=>{if(e.target.id!=='fi')return;const f=e.target.files[0];e.target.value='';if(!f)return;
f.text().then(s=>{try{const d=JSON.parse(s);if(!Array.isArray(d.tasks))throw 0;
if(!confirm(X('سيحلّ هذا الملف محلّ بياناتك الحالية. المتابعة؟','This file will replace your current data. Continue?')))return;
const keep=S.set,n=Date.now();S={notes:{},logs:{},mood:{},u:{},x:{},...d,set:keep};S.u={};Object.keys(recs()).forEach(k=>S.u[k]=n);H=recs();save();render();toast(X('اكتمل الاستيراد','Import complete'))}
catch(er){toast(X('الملف غير صالح. اختر ملف نسخة احتياطية بصيغة JSON.','Invalid file. Choose a JSON backup file.'))}})});

/* ---------- settings screen additions ---------- */
ACT.auth=async(t,d,b)=>{const g=i=>$('#'+i).value.trim(),e=$('#e-ac');e.textContent='';
try{const r=await api(b.dataset.m,{method:'POST',body:JSON.stringify({email:g('ae'),password:$('#ap').value})});AC.tok=r.token;AC.email=r.email;saveAC();await cloud();render()}catch(er){e.textContent=EM(er.message)}};
ACT.showpw=(t,d,b)=>{const i=$('#ap');if(!i)return;const sh=i.type==='password';i.type=sh?'text':'password';b.textContent=sh?'🙈':'👁️';b.setAttribute('aria-pressed',sh);b.setAttribute('aria-label',sh?X('إخفاء كلمة المرور','Hide password'):X('إظهار كلمة المرور','Show password'));i.focus()};
ACT.logout=()=>{AC={url:AC.url};saveAC();render()};ACT.syncnow=()=>{cloud().then(()=>toast(X('تمت المزامنة','Synced')))};ACT.perm=askPerm;
views.settings=(base=>()=>{const ok=!!AC.tok;return base().replace('<h2>بياناتك</h2>',`<h2>${X('اللغة','Language')}</h2><div class="card fld">${seg('lang',[['ar','العربية'],['en','English']],S.set.lang)}</div>
<h2>${X('الحساب والمزامنة','Account & sync')}</h2><div class="card">`+(ok?`<p style="margin:0 0 8px">${X('متصل بالحساب','Signed in as')} <b>${esc(AC.email)}</b></p><p class="mute sm">${AC.last?X('آخر مزامنة: ','Last sync: ')+new Date(AC.last).toLocaleString(LOC()):''} ${esc(AC.err||'')}</p><div class="acts" style="margin:0"><button class="btn pri" data-a="syncnow">${X('مزامنة الآن','Sync now')}</button><button class="btn" data-a="logout">${X('تسجيل الخروج','Sign out')}</button></div>`
:`<p class="mute" style="margin-top:0">${X('سجّل الدخول لمزامنة مهامك بين الهاتف والحاسوب والموقع.','Sign in to sync your tasks across phone, desktop and web.')}</p>${AC.err?`<p class="err">${esc(AC.err)}</p>`:''}<div class="fld"><label for="ae">${X('البريد الإلكتروني','Email')}</label><input id="ae" type="email" dir="ltr" autocomplete="email"></div><div class="fld"><label for="ap">${X('كلمة المرور','Password')}</label><div class="pw"><input id="ap" type="password" dir="ltr" autocomplete="current-password"><button type="button" class="eye" data-a="showpw" aria-pressed="false" aria-label="${X('إظهار كلمة المرور','Show password')}">👁️</button></div></div><div class="err" id="e-ac"></div><div class="acts" style="margin:0"><button class="btn pri" data-a="auth" data-m="login">${X('تسجيل الدخول','Sign in')}</button><button class="btn" data-a="auth" data-m="register">${X('إنشاء حساب','Create account')}</button></div>`)+`</div>
<h2>${X('التذكيرات','Reminders')}</h2><div class="card"><p class="mute" style="margin-top:0">${X('حدّد وقت التذكير داخل كل مهمة. فعّل الإشعارات ليصلك التنبيه.','Set a reminder time inside each task. Turn on notifications to get alerts.')}</p><button class="btn" data-a="perm">${X('تفعيل الإشعارات','Enable notifications')}</button></div><h2>بياناتك</h2>`).replace('</div></div>',m=>m)+'<input type="file" id="fi" accept=".json,application/json" hidden>'})(views.settings);

/* ---------- English (DOM translation of the Arabic templates) ---------- */
const EN={'عادات':'Habits','مهام اليوم':'Today','التقويم':'Calendar','الإحصائيات':'Statistics','الأرشيف':'Archive','الإعدادات':'Settings','＋ مهمة جديدة':'＋ New task','مهمة جديدة':'New task','التنقل الرئيسي':'Main navigation',
'صباح الخير':'Good morning','مساء الخير':'Good evening','عرض يوم آخر':'Viewing another day','العودة إلى اليوم':'Back to today','لا مهام مجدولة':'Nothing scheduled','أنجزت كل المهام 🎉':'All done 🎉','لا مهام في هذا اليوم':'No tasks on this day','استمتع بوقتك، أو أضف مهمة جديدة.':'Enjoy your time, or add a new task.','＋ أضف مهمة':'＋ Add task','أهلًا بك في عادات':'Welcome to Habits','أنشئ أول مهمة لتبدأ بتتبّع يومك، أو جرّب أمثلة جاهزة لترى كيف يبدو التطبيق.':'Create your first task to start tracking your day, or try sample data to see how it looks.','＋ أنشئ أول مهمة':'＋ Create your first task','جرّب أمثلة جاهزة':'Try sample data','لم يحن بعد':'Not yet','تراجع':'Undo','القيمة':'Value','دقيقة':'min','إلغاء إنجاز':'Undo completion','إنجاز':'Complete','إنقاص':'Decrease','زيادة':'Increase','تفاصيل':'Details','اسحب لإعادة الترتيب':'Drag to reorder','مكتملة':'completed',
'الشهر السابق':'Previous month','الشهر التالي':'Next month','›':'‹','‹':'›','ملاحظة اليوم':'Note for the day','كيف كان يومك؟':'How was your day?',
'أنجزت اليوم':'Done today','الالتزام آخر 30 يومًا':'Adherence, last 30 days','أفضل سلسلة حالية':'Best current streak','مهمة نشطة':'Active tasks','آخر 14 يومًا':'Last 14 days','نسبة الإنجاز اليومية':'Daily completion rate','كل مهمة':'Each task','لا توجد بيانات بعد.':'No data yet.',
'المهام المؤرشفة لا تظهر في اليوم ولا في الإحصائيات، وتبقى سجلاتها محفوظة.':'Archived tasks are hidden from Today and Statistics, but their history is kept.','بدون فئة':'No category','استعادة':'Restore','حذف':'Delete','الأرشيف فارغ':'Archive is empty','عندما تؤرشف مهمة ستجدها هنا.':'Archived tasks will show up here.',
'المظهر':'Appearance','تلقائي':'Auto','فاتح':'Light','داكن':'Dark','بداية الأسبوع':'Week starts on','السبت':'Saturday','الأحد':'Sunday','الإثنين':'Monday','بياناتك':'Your data','كل شيء محفوظ على جهازك فقط، دون إنترنت أو حساب.':'Everything is stored on this device. No internet or account needed.','تصدير نسخة احتياطية':'Export backup (.json)','استيراد نسخة':'Import backup (.json)','مسح كل البيانات':'Erase all data',
'تعديل':'Edit','إلغاء التثبيت':'Unpin','تثبيت':'Pin','إيقاف مؤقت':'Pause','استئناف':'Resume','نسخ':'Duplicate','أرشفة':'Archive','إغلاق':'Close','متوقفة مؤقتًا':'paused','نسبة الالتزام':'Adherence','السلسلة الحالية':'Current streak','أطول سلسلة':'Longest streak','أفضل أسبوع':'Best week','أفضل شهر':'Best month','متوسط المدة':'Average duration','متوسط القيمة':'Average value','متوسط وقت الإنجاز':'Average completion time','آخر 12 أسبوعًا':'Last 12 weeks','ملوّن: أُنجز · أحمر: فاتك · رمادي: غير مجدول':'Colored: done · Red: missed · Gray: not scheduled',
'تمت / لم تتم':'Done / not done','عدّاد':'Counter','مدة':'Duration','قيمة':'Value','مهمة تُنجز أو لا':'Either done or not','مثل 8 أكواب ماء':'e.g. 8 glasses of water','مثل 30 دقيقة قراءة':'e.g. 30 minutes of reading','مثل الوزن أو المصروف':'e.g. weight or spending',
'كل يوم':'Every day','أيام محددة من الأسبوع':'Specific weekdays','كل عدد من الأيام':'Every N days','أيام محددة من الشهر':'Specific days of the month','شهريًا في يوم ثابت':'Monthly on a fixed day','أول يوم من الشهر':'First day of the month','آخر يوم من الشهر':'Last day of the month','سنويًا':'Yearly','مرة واحدة':'Once','تواريخ مخصصة':'Custom dates',
'تعديل المهمة':'Edit task','إضافة المهمة':'Add task','حفظ التعديلات':'Save changes','إلغاء':'Cancel','ما الذي تريد إنجازه؟':'What do you want to get done?','مثال: شرب الماء':'e.g. Drink water','كيف تتابعها؟':'How do you track it?','الهدف':'Goal','اختياري':'Optional','الوحدة':'Unit','كوب، صفحة…':'cup, page…','متى تتكرر؟':'How often?','كل كم يوم؟':'Every how many days?','الأيام':'Days','أيام الشهر':'Days of the month','يوم الشهر':'Day of the month','الشهر':'Month','اليوم':'Day','أضف تاريخًا':'Add a date','إضافة':'Add','التاريخ':'Date','تبدأ من':'Starts on','اللون':'Color','الأيقونة':'Icon','الفئة':'Category','اختياري: صحة، عمل…':'Optional: health, work…','ملاحظة':'Note','تذكير':'Reminder',
'اكتب اسمًا للمهمة.':'Enter a name for the task.','اختر يومًا واحدًا على الأقل.':'Pick at least one day.','اختر يومًا واحدًا من الشهر على الأقل.':'Pick at least one day of the month.','أضف تاريخًا واحدًا على الأقل.':'Add at least one date.','اختر تاريخ البدء.':'Pick a start date.',
'أحد':'Sun','إثنين':'Mon','ثلاثاء':'Tue','أربعاء':'Wed','خميس':'Thu','جمعة':'Fri','سبت':'Sat','الاثنين':'Monday','الثلاثاء':'Tuesday','الأربعاء':'Wednesday','الخميس':'Thursday','الجمعة':'Friday',
'شرب الماء':'Drink water','قراءة':'Reading','تمارين رياضية':'Workout','مراجعة المصروف':'Review spending','كوب':'glass','صحة':'Health','تعلّم':'Learning','مال':'Money','دج':'DZD','نُسخت المهمة':'Task duplicated','نُقلت إلى الأرشيف':'Moved to archive','سُجّلت القيمة':'Value saved','حُفظت التعديلات':'Changes saved','أُضيفت المهمة':'Task added','(نسخة)':'(copy)','سيُمسح كل شيء نهائيًا. هل تريد المتابعة؟':'Everything will be erased permanently. Continue?'};
const KEYS=Object.keys(EN).sort((a,b)=>b.length-a.length);
const RX=[[/^أنجزت (\S+) من (\S+) · أطول سلسلة (\S+)$/,'Done $1 of $2 · longest streak $3'],[/^(\S+) من (\S+) مكتملة$/,'$1 of $2 completed'],[/^تبقّى (\S+) من (\S+)$/,'$1 of $2 left'],[/^أُنجزت \((\d+)\)$/,'Done ($1)'],[/^🔥 (\d+) أيام متتالية$/,'🔥 $1-day streak'],[/^اليوم، (.*)$/,'Today, $1'],[/^أسبوع (.*)$/,'Week of $1'],[/^الهدف (.*)$/,'Goal $1'],[/^أحسنت! أنجزت «(.*)»$/,'Well done! Completed “$1”'],[/^أُلغي إنجاز «(.*)»$/,'Undid “$1”'],[/^استُعيدت «(.*)»$/,'Restored “$1”'],[/^حذف «(.*)» نهائيًا.*$/,'Delete “$1” permanently with all its history? This can’t be undone.'],[/^(\S+)% مكتمل$/,'$1% done']];
function tx(s){const k=s.trim();if(!k)return s;if(EN[k])return s.replace(k,EN[k]);for(const[r,v]of RX)if(r.test(k))return s.replace(k,k.replace(r,v));
if(!/[\u0600-\u06FF]/.test(k))return s;let o=s;for(const a of KEYS)if(o.includes(a))o=o.split(a).join(EN[a]);return o}
function tr(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>/^(TEXTAREA|SCRIPT|STYLE)$/.test(n.parentNode.tagName)?2:1}),a=[];
while(w.nextNode())a.push(w.currentNode);a.forEach(n=>{const v=tx(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v});
(root.querySelectorAll?root:document).querySelectorAll('[aria-label],[placeholder]').forEach(e=>['aria-label','placeholder'].forEach(k=>{const v=e.getAttribute(k);if(v){const z=tx(v);if(z!==v)e.setAttribute(k,z)}}))}
function afterRender(root=document.body){const en=S.set.lang==='en';document.documentElement.lang=en?'en':'ar';document.documentElement.dir=en?'ltr':'rtl';
document.title=en?'Habits — daily tasks & habits':'عادات — مهامك وعاداتك اليومية';if(en)tr(root)}
const _cf=window.confirm;window.confirm=m=>_cf(S.set.lang==='en'?tx(m):m);

/* ---------- init ---------- */
S.u=S.u||{};S.x=S.x||{};S.mood=S.mood||{};S.set.lang=S.set.lang||(/^ar/i.test(navigator.language)?'ar':'en');
S.tasks.forEach((t,i)=>{if(t.ord==null)t.ord=i});H=recs();render();
if('serviceWorker'in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
addEventListener('online',cloud);document.addEventListener('visibilitychange',()=>{if(!document.hidden)cloud()});setInterval(cloud,60000);cloud();native();
