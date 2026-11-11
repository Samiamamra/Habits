/* TaskHabit — advanced analytics: ranges & comparison, dashboard, behaviour patterns,
   per-task and per-category analysis, rule-based insights, CSV / printable reports,
   daily mood & energy, achievement badges.
   Loaded after ext.js. Everything lives in an IIFE so it cannot clash with the app's globals. */
(()=>{
const AN={sec:'ov',rng:'30',task:'',rep:{k:'week',o:0}};
const RNG=[['7','أسبوع','Week'],['30','شهر','Month'],['90','3 أشهر','3 months'],['365','سنة','Year'],['all','الكل','All']];
const SEC=[['ov','نظرة عامة','Overview'],['pt','الأنماط','Patterns'],['tk','المهام','Tasks'],['ct','الفئات','Categories'],['mb','المزاج والشارات','Mood & badges'],['rp','التقارير','Reports']];
const WD=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const WN=i=>X(DN[i],WD[i]),SN=i=>X(SH[i],WD[i].slice(0,3));
const pc=(a,b)=>b?Math.round(a/b*100):0,avg=a=>a.length?a.reduce((p,q)=>p+q,0)/a.length:0;
const dB=(a,b)=>Math.round((P(b)-P(a))/864e5);
const sd=(ds,o)=>fmt(ds,o||{day:'numeric',month:'short'}),sdy=ds=>fmt(ds,{day:'numeric',month:'short',year:'numeric'});
const hf=h=>(h%12||12)+' '+(h<12?X('ص','AM'):X('م','PM'));
const dur=m=>{m=Math.round(m);return m>=60?Math.floor(m/60)+X(' س',' h')+(m%60?' '+m%60+X(' د',' m'):''):m+X(' د',' min')};
const unitOf=t=>t.type==='duration'?X('دقيقة','min'):t.unit||'';
const csvq=v=>{v=String(v??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return'"'+v.replace(/"/g,'""')+'"'};
const num=v=>Math.round(v*10)/10;
const MO=['😞','😕','😐','🙂','😄'];
const logId=k=>k.slice(0,k.lastIndexOf('|')),logDay=k=>k.slice(k.lastIndexOf('|')+1);

document.head.insertAdjacentHTML('beforeend',`<style>
.rg,.tb{display:flex;gap:6px;overflow-x:auto;padding:2px 0;margin:14px 0 4px;scrollbar-width:none}.rg::-webkit-scrollbar,.tb::-webkit-scrollbar{display:none}
.rg button,.tb button{flex:none;min-height:40px;padding:0 14px;border-radius:12px;background:var(--card);border:1.5px solid var(--line);font-weight:500;font-size:14px;white-space:nowrap}
.rg button[aria-pressed=true],.tb button[aria-pressed=true]{background:var(--pri);color:var(--on);border-color:var(--pri);font-weight:600}
.tb button{background:none;border-color:transparent;color:var(--mute)}.tb button[aria-pressed=true]{background:var(--soft);color:var(--pri);border-color:var(--soft)}
.dl{display:inline-block;font-size:12px;font-weight:700;margin-top:2px;padding:1px 7px;border-radius:8px;unicode-bidi:isolate}
.dl.up{color:var(--ok);background:color-mix(in srgb,var(--ok) 14%,transparent)}.dl.dn{color:var(--bad);background:color-mix(in srgb,var(--bad) 14%,transparent)}.dl.eq{color:var(--mute);background:var(--soft)}
.ds{display:block}.cap{font-size:13px;color:var(--mute);margin:6px 0 0}
.nts{list-style:none;margin:0;padding:0;display:grid;gap:8px}.nts li{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:var(--soft)}
.ch{width:100%;height:auto;display:block;direction:ltr}.ch .gl{stroke:var(--line);stroke-width:1}.ch .gt{fill:var(--mute);font-size:11px}
.ch .ma{fill:none;stroke:var(--pri);stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round}.ch .dt{fill:var(--ok);opacity:.5}.ch .rf{stroke:var(--mute);stroke-dasharray:4 4;stroke-width:1.4}.ch .mk{fill:var(--pri)}
.lg{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--mute);margin-top:6px}.lg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:5px;vertical-align:middle}
.wr{display:grid;grid-template-columns:84px 1fr 46px;gap:10px;align-items:center;margin:8px 0;font-size:14px}.wr .pb{margin:0}.wr b{text-align:end}.wr .pb i{background:var(--pri);opacity:.85}.wr.best .pb i{background:var(--ok);opacity:1}.wr.worst .pb i{background:var(--bad);opacity:1}
.wr.wide{grid-template-columns:130px 1fr 56px}
.hrs{display:grid;grid-template-columns:repeat(24,1fr);gap:3px;align-items:end;height:100px;direction:ltr}.hrs i{background:var(--pri);opacity:.5;border-radius:4px 4px 1px 1px;min-height:2px}.hrs i.top{background:var(--ok);opacity:1}
.hax{display:grid;grid-template-columns:repeat(24,1fr);gap:3px;direction:ltr;font-size:10px;color:var(--mute);margin-top:4px}.hax span{text-align:center;white-space:nowrap;overflow:visible}
.hmw{overflow-x:auto;direction:ltr;padding-bottom:6px}
.hm{display:grid;grid-template-rows:14px repeat(7,13px);grid-auto-flow:column;grid-template-columns:30px;grid-auto-columns:13px;gap:3px;width:max-content}
.hm small{font-size:10px;color:var(--mute);line-height:13px;white-space:nowrap}.hm>small:nth-child(8n+1){line-height:14px}
.hm button,.hm i{width:13px;height:13px;padding:0;border-radius:3px;background:var(--line);opacity:.45}.hm i.f{visibility:hidden}
.hm .l0{background:var(--bad);opacity:.4}.hm .l1{background:var(--ok);opacity:.3}.hm .l2{background:var(--ok);opacity:.55}.hm .l3{background:var(--ok);opacity:.78}.hm .l4{background:var(--ok);opacity:1}
.hl{display:flex;gap:5px;align-items:center;font-size:12px;color:var(--mute);margin-top:6px;flex-wrap:wrap}.hl i{display:inline-block;width:12px;height:12px;border-radius:3px;background:var(--line);opacity:.45}
.hl .l0{background:var(--bad);opacity:.4}.hl .l1{background:var(--ok);opacity:.3}.hl .l2{background:var(--ok);opacity:.55}.hl .l3{background:var(--ok);opacity:.78}.hl .l4{background:var(--ok);opacity:1}
.sl{max-height:280px;overflow:auto;display:grid;gap:6px}.sr{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 12px;border-radius:10px;background:var(--soft);font-size:14px}.sr.cur{outline:2px solid var(--ok)}.sr.top{outline:2px solid var(--pri)}
.wk{display:flex;gap:4px;align-items:flex-end;height:130px;direction:ltr}.wk>div{flex:1;position:relative;height:100%;display:flex;align-items:flex-end}.wk i{display:block;width:100%;background:var(--pri);opacity:.8;border-radius:5px 5px 1px 1px;min-height:2px}.wk i.ok{background:var(--ok);opacity:1}
.wk .tg{display:block;position:absolute;left:0;right:0;height:0;border-top:2px dashed var(--mute)}
.wkx{display:flex;justify-content:space-between;font-size:11px;color:var(--mute);direction:ltr;margin-top:4px}
.cg{margin-bottom:10px}.cg h4{margin:0 0 8px;font-size:16px;display:flex;justify-content:space-between;gap:10px}.cg .mt{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--mute);margin-top:8px}.cg .mt b{color:var(--ink)}
.sh{display:flex;height:14px;border-radius:8px;overflow:hidden;background:var(--line);direction:ltr}.sh i{display:block;height:100%}
.mood{display:flex;gap:6px}.mood button{flex:1;min-height:44px;border-radius:12px;background:var(--card);border:1.5px solid var(--line);font-size:22px}.mood button[aria-pressed=true]{background:var(--soft);border-color:var(--pri);color:var(--pri);font-weight:700}
.bds{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.bdg{text-align:center;padding:14px 8px}.bdg .em{font-size:36px;line-height:1.2}.bdg b{display:block;font-size:14px;margin-top:4px}.bdg small{color:var(--mute)}.bdg.lock{opacity:.5;filter:grayscale(1)}
.tr2{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px}.tr2:last-child{border:0}
.rpt{max-width:760px;margin:0 auto;font-size:14px;line-height:1.55;color:var(--ink)}.rpt h1{font-size:24px;margin:0 0 4px}.rpt h2{font-size:16px;margin:20px 0 8px;border-bottom:2px solid var(--line);padding-bottom:4px;color:var(--ink)}.rpt .sb{color:var(--mute);margin:0 0 12px}
.rpt .kg{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.rpt .kc{border:1px solid var(--line);border-radius:10px;padding:8px 10px}.rpt .kc b{display:block;font-size:20px}.rpt .kc span{font-size:12px;color:var(--mute)}
.rpt table{width:100%;border-collapse:collapse}.rpt th,.rpt td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:start;font-size:13px}.rpt th{color:var(--mute);font-weight:600}
.rpt .db{display:flex;gap:3px;align-items:flex-end;height:96px;direction:ltr}.rpt .db div{flex:1;text-align:center;font-size:10px;color:var(--mute);display:flex;flex-direction:column;justify-content:flex-end;height:100%;min-width:0}
.rpt .db i{display:block;background:var(--ok);border-radius:3px 3px 0 0;min-height:2px;margin-bottom:2px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rpt .tbar{height:6px;background:var(--line);border-radius:4px;overflow:hidden;min-width:60px}.rpt .tbar i{display:block;height:100%;background:var(--ok);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rpt .dl{margin-inline-start:6px}.rpt ul{margin:6px 0;padding-inline-start:20px}
#prt{display:none}
@media print{html,body{background:#fff!important}body>*:not(#prt){display:none!important}#prt{display:block!important;padding:0;
--ink:#111;--mute:#555;--line:#d4d7e6;--card:#fff;--soft:#f1f2f8;--ok:#1fa971;--bad:#d64536;--pri:#3b4cca;color:#111;background:#fff}#prt .rpt{max-width:none}@page{margin:14mm}}
@media(max-width:760px){.wr{grid-template-columns:72px 1fr 42px}.wr.wide{grid-template-columns:100px 1fr 50px}.hm{grid-auto-columns:12px;grid-template-rows:14px repeat(7,12px)}.hm button,.hm i{width:12px;height:12px}}
</style>`);
document.body.insertAdjacentHTML('beforeend','<div id="prt" aria-hidden="true"></div>');
addEventListener('afterprint',()=>{const p=document.getElementById('prt');if(p)p.innerHTML=''});

/* =====================  data engine  ===================== */
/* Only active (not archived / paused) tasks count, exactly like the rest of the app. */
function build(){
 const ts=S.tasks.filter(t=>!t.arch&&!t.pause),e=TD(),days=[],bt={};ts.forEach(t=>bt[t.id]=[]);
 if(!ts.length)return{ts,days,bt};
 let s=e;const ids=new Set(ts.map(t=>t.id));
 ts.forEach(t=>[t.created,t.rec.start,...(t.rec.custom||[])].forEach(x=>{if(x&&x<s)s=x}));
 for(const k in S.logs){const d=logDay(k);if(d<s&&ids.has(logId(k)))s=d}
 const lim=iso(add(new Date(),-3650));if(s<lim)s=lim;
 for(let d=P(s);iso(d)<=e;d=add(d,1)){const ds=iso(d),dl=ts.filter(t=>due(t,d)),dn=dl.filter(t=>isDone(t,ds));
  days.push({ds,wd:wi(d),n:dl.length,c:dn.length,dl,dn});dl.forEach(t=>bt[t.id].push({ds,d:dn.includes(t)}))}
 return{ts,days,bt}}
/* every scheduled occurrence of one task (works for paused tasks too) */
function occOf(t){const e=TD();let s=[t.created,t.rec.start,...(t.rec.custom||[])].filter(Boolean).sort()[0]||e;
 for(const k in S.logs)if(k.startsWith(t.id+'|')){const d=logDay(k);if(d<s)s=d}
 const o=[];for(let d=P(s),n=0;iso(d)<=e&&n<4000;d=add(d,1),n++)if(due(t,d)){const ds=iso(d);o.push({ds,d:isDone(t,ds)})}return o}
function win(D,k){const N=k==='all'?0:+k,n=D.length;if(!N)return{cur:D,prev:null};return{cur:D.slice(Math.max(0,n-N)),prev:n>N?D.slice(Math.max(0,n-2*N),n-N):null}}
function met(a){let n=0,c=0,perf=0,act=0,dd=0;const r=[];
 a.forEach(x=>{n+=x.n;c+=x.c;if(x.n){dd++;r.push(x.c/x.n);if(x.c===x.n)perf++}if(x.c)act++});
 const m=avg(r),sdv=r.length?Math.sqrt(avg(r.map(v=>(v-m)**2))):0;
 return{n,c,rate:pc(c,n),perf,act,dd,cons:Math.round(m*(1-sdv)*100),days:a.length}}
/* consecutive completions of scheduled occurrences. A still-pending "today" never breaks a streak. */
function tiers(o){const e=TD(),earned={};let r=0,best=0;
 o.forEach((x,i)=>{if(x.d){r++;best=Math.max(best,r);[7,30,100].forEach(n=>{if(r===n&&!earned[n])earned[n]=x.ds})}else if(!(x.ds===e&&i===o.length-1))r=0});
 return{cur:r,best,earned}}
function streaks(o){const out=[],e=TD();let r=null;
 o.forEach((x,i)=>{if(x.d){if(!r)r={s:x.ds,e:x.ds,n:0};r.e=x.ds;r.n++}else{if(x.ds===e&&i===o.length-1)return;if(r){out.push(r);r=null}}});
 if(r){r.cur=true;out.push(r)}return out}
function wdAgg(a){const g=[0,1,2,3,4,5,6].map(i=>({i,n:0,c:0,days:0}));a.forEach(x=>{if(x.n){const o=g[x.wd];o.n+=x.n;o.c+=x.c;o.days++}});g.forEach(o=>o.r=pc(o.c,o.n));return g}
function wdBW(g){const v=g.filter(o=>o.days>=2);if(v.length<2)return{};const b=v.reduce((p,q)=>q.r>p.r||q.r===p.r&&q.c>p.c?q:p),w=v.reduce((p,q)=>q.r<p.r||q.r===p.r&&q.c<p.c?q:p);return b.i===w.i?{}:{b,w}}
function hours(A,from,to){const ids=new Set(A.ts.map(t=>t.id)),h=Array(24).fill(0);
 for(const k in S.logs){const l=S.logs[k];if(l.s!=='c'||!l.t)continue;const d=logDay(k);if(d<from||d>to||!ids.has(logId(k)))continue;h[+l.t.slice(0,2)]++}return h}
function lapse(A,from,to){const e=TD(),runs=[];
 A.ts.forEach(t=>{let o=A.bt[t.id];if(o.length&&o[o.length-1].ds===e&&!o[o.length-1].d)o=o.slice(0,-1);
  for(let i=0;i<o.length;){if(o[i].d){i++;continue}let j=i;while(j<o.length&&!o[j].d)j++;
   if(o[i].ds>=from&&o[i].ds<=to)runs.push({t,len:j-i,ret:j<o.length?o[j].ds:null,gap:j<o.length?dB(o[i].ds,o[j].ds):null});i=j}});
 return runs}
function cats(a,from,to){const m={},tot={c:0};
 a.forEach(x=>x.dl.forEach(t=>{const k=t.cat||'',g=m[k]=m[k]||{k,n:0,c:0,min:0,ts:new Set(),col:t.color};g.n++;g.ts.add(t.id);if(x.dn.includes(t)){g.c++;tot.c++}}));
 for(const k in S.logs){const t=T(logId(k));if(!t||t.arch||t.type!=='duration')continue;const d=logDay(k);if(d<from||d>to)continue;const v=+S.logs[k].v;if(!v)continue;const g=m[t.cat||'']=m[t.cat||'']||{k:t.cat||'',n:0,c:0,min:0,ts:new Set(),col:t.color};g.min+=v}
 return{list:Object.values(m).sort((p,q)=>q.c-p.c||q.n-p.n),total:tot.c}}
function taskRates(a){const m={};a.forEach(x=>x.dl.forEach(t=>{const g=m[t.id]=m[t.id]||{n:0,c:0};g.n++;if(x.dn.includes(t))g.c++}));return m}

/* =====================  small UI helpers  ===================== */
const chg=v=>v==null?'':v===0?`<span class="dl eq" dir="ltr">＝ 0%</span>`:`<span class="dl ${v>0?'up':'dn'}" dir="ltr" aria-label="${v>0?X('ارتفاع','Up'):X('انخفاض','Down')} ${Math.abs(v)}%">${v>0?'↑':'↓'}${Math.abs(v)}%</span>`;
const rel=(a,b)=>b?Math.round((a-b)/b*100):null;
const kp=(v,l,d,s)=>`<div class="card stat"><b>${v}</b><span>${l}</span>${d?`<div>${d}</div>`:''}${s?`<small class="mute ds">${s}</small>`:''}</div>`;
const empty=(ic,t,p)=>`<div class="card empty"><div class="big">${ic}</div><b>${t}</b><p class="mute">${p}</p></div>`;
const rowBar=(lab,p,val,cls='',wide='')=>`<div class="wr ${cls} ${wide}"><span>${lab}</span><div class="pb"><i style="width:${Math.max(0,Math.min(100,p))}%"></i></div><b>${val}</b></div>`;
function chart(o){const W=640,H=200,Lm=42,R=10,Tm=12,B=24,iw=W-Lm-R,ih=H-Tm-B,xs=o.x||o.ser[0].v.map((_,i)=>i),x0=xs[0],x1=xs[xs.length-1];
 const px=i=>Lm+(x1>x0?iw*(xs[i]-x0)/(x1-x0):iw/2),py=v=>Tm+ih*(1-(v-o.lo)/((o.hi-o.lo)||1));
 let s=`<svg viewBox="0 0 ${W} ${H}" class="ch" role="img" aria-label="${esc(o.label)}"><title>${esc(o.label)}</title>`;
 [0,.5,1].forEach(f=>{const v=o.lo+(o.hi-o.lo)*f;s+=`<line class="gl" x1="${Lm}" x2="${W-R}" y1="${py(v).toFixed(1)}" y2="${py(v).toFixed(1)}"/><text class="gt" x="${Lm-6}" y="${(py(v)+4).toFixed(1)}" text-anchor="end">${o.yf(v)}</text>`});
 (o.ref||[]).forEach(v=>{s+=`<line class="rf" x1="${Lm}" x2="${W-R}" y1="${py(v).toFixed(1)}" y2="${py(v).toFixed(1)}"/>`});
 o.ser.forEach(se=>{if(se.line){let d='',pen=false;se.v.forEach((v,i)=>{if(v==null){pen=false;return}d+=(pen?'L':'M')+px(i).toFixed(1)+' '+py(v).toFixed(1);pen=true});s+=`<path class="ma" d="${d}"/>`}
  if(se.dots)se.v.forEach((v,i)=>{if(v!=null)s+=`<circle class="${se.mk?'mk':'dt'}" cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="${se.mk?3.4:2.6}"/>`})});
 (o.xl||[]).forEach(([i,t],k,a)=>{s+=`<text class="gt" x="${px(i).toFixed(1)}" y="${H-6}" text-anchor="${k===0?'start':k===a.length-1?'end':'middle'}">${esc(t)}</text>`});
 return s+'</svg>'}

/* =====================  overview  ===================== */
function trendChart(a){
 if(a.length<2)return`<p class="mute">${X('لا بيانات كافية لرسم المنحنى.','Not enough data to draw the trend.')}</p>`;
 const daily=a.map(x=>x.n?x.c/x.n:null),ma=a.map((_,i)=>{let n=0,c=0;for(let j=Math.max(0,i-6);j<=i;j++){n+=a[j].n;c+=a[j].c}return n?c/n:null});
 const mid=Math.floor((a.length-1)/2);
 return chart({lo:0,hi:1,yf:v=>Math.round(v*100)+'%',label:X('منحنى الالتزام اليومي ومتوسطه المتحرك لـ7 أيام','Daily adherence and its 7-day moving average'),
  ser:[...(a.length<=120?[{v:daily,dots:1}]:[]),{v:ma,line:1}],xl:[[0,sd(a[0].ds)],[mid,sd(a[mid].ds)],[a.length-1,sd(a[a.length-1].ds)]]})
  +`<div class="lg">${a.length<=120?`<span><i style="background:var(--ok);opacity:.6"></i>${X('نسبة اليوم','Daily rate')}</span>`:''}<span><i style="background:var(--pri)"></i>${X('متوسط متحرك 7 أيام','7-day moving average')}</span></div>`}

function notes(A){
 const out=[],D=A.days,e=TD(),Y=D.slice(0,-1),nm=t=>'«'+esc(t.name)+'»',nmE=t=>'“'+esc(t.name)+'”',push=(ic,h)=>out.push([ic,h]);
 /* 1. this week vs the previous one (both ending yesterday, so an unfinished today can't distort it) */
 if(Y.length>=14){const w1=met(Y.slice(-7)),w0=met(Y.slice(-14,-7));if(w0.n&&w1.n){const d=w1.rate-w0.rate;
  if(Math.abs(d)>=8)push(d<0?'⚠️':'📈',d<0?X(`التزامك انخفض ${-d}% عن الأسبوع الماضي`,`Your adherence dropped ${-d}% compared with last week`):X(`التزامك ارتفع ${d}% عن الأسبوع الماضي`,`Your adherence rose ${d}% compared with last week`))}}
 /* 2. tasks that haven't been done for a while */
 const idle=[];A.ts.forEach(t=>{const o=A.bt[t.id].filter(x=>x.ds<e||x.d);if(!o.length)return;const last=[...o].reverse().find(x=>x.d);
  if(last){const g=dB(last.ds,e);if(g>=7&&!(o[o.length-1].d))idle.push({t,g,never:0})}else{const g=dB(o[0].ds,e);if(g>=7)idle.push({t,g,never:1})}});
 idle.sort((p,q)=>q.g-p.g).slice(0,3).forEach(({t,g,never})=>push('⏰',never?X(`مهمة ${nm(t)} لم تُنجَز منذ إنشائها (${g} يومًا)`,`Task ${nmE(t)} hasn't been done since it was created (${g} days)`):X(`مهمة ${nm(t)} لم تُنجَز منذ ${g} أيام`,`Task ${nmE(t)} hasn't been done for ${g} days`)));
 /* 3. best weekday per task (last 120 days, needs enough evidence) */
 const from=iso(add(new Date(),-120)),wdn=[];
 A.ts.forEach(t=>{const o=A.bt[t.id].filter(x=>x.ds>=from&&x.ds<e);if(o.length<21)return;const g=[0,1,2,3,4,5,6].map(()=>({n:0,c:0}));
  o.forEach(x=>{const w=wi(P(x.ds));g[w].n++;g[w].c+=x.d?1:0});const tot=pc(o.filter(x=>x.d).length,o.length);
  let b=-1,br=-1;g.forEach((q,i)=>{if(q.n>=3){const r=pc(q.c,q.n);if(r>br){br=r;b=i}}});if(b>=0&&br>=50&&br-tot>=20)wdn.push({t,w:b,r:br,m:br-tot})});
 wdn.sort((p,q)=>q.m-p.m).slice(0,2).forEach(({t,w,r})=>push('📅',X(`تنجز ${nm(t)} أكثر يوم ${WN(w)} (${r}%)`,`You complete ${nmE(t)} most on ${WN(w)} (${r}%)`)));
 /* 4. streaks */
 const hot=A.ts.map(t=>({t,s:tiers(A.bt[t.id])})).filter(x=>x.s.cur>=5&&x.s.cur===x.s.best).sort((p,q)=>q.s.cur-p.s.cur)[0];
 if(hot)push('🔥',X(`أنت الآن في أطول سلسلة لـ${nm(hot.t)}: ${hot.s.cur} متتالية — واصل!`,`You're on your longest streak for ${nmE(hot.t)}: ${hot.s.cur} in a row — keep going!`));
 /* 5. weakest / strongest weekday overall (last 90 days) */
 const r90=D.slice(-91,-1);if(r90.length>=28){const {b,w}=wdBW(wdAgg(r90));if(b&&b.r-w.r>=10)push('📊',X(`أقوى أيامك ${WN(b.i)} (${b.r}%) وأضعفها ${WN(w.i)} (${w.r}%)`,`Your strongest day is ${WN(b.i)} (${b.r}%) and your weakest is ${WN(w.i)} (${w.r}%)`))}
 /* 6. best hour */
 if(D.length){const h=hours(A,D[0].ds,e),t=h.reduce((p,q)=>p+q,0);if(t>=10){const b=h.indexOf(Math.max(...h));push('🕗',X(`أفضل ساعة للإنجاز عندك حوالي ${hf(b)} (${pc(h[b],t)}% من إنجازاتك)`,`Your best hour for getting things done is around ${hf(b)} (${pc(h[b],t)}% of completions)`))}}
 /* 7. mood / energy link */
 const me=moodLink(A);if(me.sentence)push('🔋',me.sentence);
 if(!out.length)push('💡',X('سجّل إنجازاتك لبضعة أسابيع وستظهر هنا ملاحظات تلقائية عن أنماطك.','Log your tasks for a few weeks and automatic insights about your habits will show up here.'));
 return out.slice(0,9)}

function secOv(A,W){
 const m=met(W.cur),p=W.prev&&W.prev.some(x=>x.n)?met(W.prev):null,full=!!p;
 const lab=m.cons>=75?X('ممتاز','Excellent'):m.cons>=55?X('جيد','Good'):m.cons>=35?X('متوسط','Fair'):X('يحتاج تحسينًا','Needs work');
 const cards=kp(m.rate+'%',X('نسبة الالتزام','Adherence'),p?chg(m.rate-p.rate):'',`${m.c} / ${m.n}`)
  +kp(m.perf,X('أيام مثالية','Perfect days'),full?chg(rel(m.perf,p.perf)):'',X(`من ${m.dd} يومًا مجدولًا`,`of ${m.dd} scheduled days`))
  +kp(m.act,X('أيام نشطة','Active days'),full?chg(rel(m.act,p.act)):'',X(`من ${m.days} يومًا`,`of ${m.days} days`))
  +kp(m.c,X('مجموع الإنجازات','Total completions'),full?chg(rel(m.c,p.c)):'')
  +kp(m.cons,X('درجة الاتساق','Consistency score'),p?chg(m.cons-p.cons):'',lab);
 const nt=notes(A);
 return`<div class="grid" style="margin-top:12px">${cards}</div>
<p class="cap">${W.prev?X('الأسهم: التغيّر مقارنة بالفترة السابقة المماثلة (نقاط مئوية للنسب، وتغيّر نسبي للأعداد).','Arrows: change vs. the previous equal period (percentage points for rates, relative change for counts).'):AN.rng==='all'?X('لا مقارنة عند اختيار «الكل».','No comparison when “All” is selected.'):X('لا توجد فترة سابقة كافية للمقارنة بعد.','Not enough earlier data to compare yet.')}
 ${X('درجة الاتساق = متوسط الالتزام اليومي × (1 − تذبذبه)، فتُكافئ الثبات لا القفزات.','Consistency = mean daily adherence × (1 − its variability), so steadiness is rewarded over spikes.')}</p>
<h2>${X('اتجاه الالتزام','Adherence trend')}</h2><div class="card">${trendChart(W.cur)}</div>
<h2>${X('ملاحظات تلقائية','Automatic insights')}</h2><div class="card"><ul class="nts">${nt.map(([ic,h])=>`<li><span aria-hidden="true">${ic}</span><span>${h}</span></li>`).join('')}</ul><p class="cap">${X('تُحسب بقواعد بسيطة من كل بياناتك، دون ذكاء اصطناعي.','Computed with simple rules from all your data — no AI involved.')}</p></div>`}

/* =====================  patterns  ===================== */
function heat(A){const mp={};A.days.forEach(x=>mp[x.ds]=x);const e=TD(),w0=add(wstart(new Date()),-52*7),o=order();
 let h='<small></small>'+[0,1,2,3,4,5,6].map(r=>`<small>${r%2===1?SN(o[r]):''}</small>`).join(''),pm=-1;
 for(let c=0;c<53;c++){const f=add(w0,c*7),m=f.getMonth();h+=`<small>${m!==pm?f.toLocaleDateString(LOC(),{month:'short'}):''}</small>`;pm=m;
  for(let r=0;r<7;r++){const ds=iso(add(f,r));if(ds>e){h+='<i class="f"></i>';continue}const x=mp[ds];let cl='';
   if(x&&x.n){const q=x.c/x.n;cl=q===0?'l0':q<.34?'l1':q<.67?'l2':q<1?'l3':'l4'}
   h+=`<button class="${cl}" data-a="hm" data-d="${ds}" aria-label="${sdy(ds)}: ${x&&x.n?x.c+'/'+x.n:X('لا مهام','nothing scheduled')}" title="${sdy(ds)}: ${x&&x.n?x.c+'/'+x.n:'—'}"></button>`}}
 return`<div class="hmw"><div class="hm" role="group" aria-label="${X('خريطة حرارية للسنة','Year heatmap')}">${h}</div></div>
<div class="hl"><span>${X('أقل','Less')}</span><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>${X('أكثر','More')}</span><span style="margin-inline-start:12px"><i class="l0"></i> ${X('فات كل شيء','All missed')}</span><span><i></i> ${X('غير مجدول','Not scheduled')}</span></div>`}
function secPt(A,W){
 const a=W.cur,g=wdAgg(a),{b,w}=wdBW(g),f=a[0].ds,l=a[a.length-1].ds;
 const wdH=a.some(x=>x.n)?order().map(i=>{const o=g[i];return rowBar(WN(i),o.r,o.days?o.r+'%':'—',b&&o.i===b.i?'best':w&&o.i===w.i?'worst':'')}).join(''):'';
 const hh=hours(A,f,l),ht=hh.reduce((p,q)=>p+q,0),hm=Math.max(...hh),hb=hh.indexOf(hm);
 const hrs=ht?`<div class="hrs" role="img" aria-label="${X('توزيع الإنجازات على ساعات اليوم','Completions by hour of day')}">${hh.map((v,i)=>`<i class="${i===hb?'top':''}" style="height:${Math.max(2,v/hm*100)}%" title="${hf(i)}: ${v}"></i>`).join('')}</div><div class="hax">${hh.map((_,i)=>`<span>${i%6===0?hf(i):''}</span>`).join('')}</div>
<p style="margin:10px 0 0"><b>${X('أفضل ساعة للإنجاز:','Best hour to get things done:')}</b> ${hf(hb)} – ${hf((hb+1)%24)} <span class="mute">(${hh[hb]} ${X('إنجازًا','completions')} · ${pc(hh[hb],ht)}%)</span></p>`:`<p class="mute">${X('لا توجد أوقات إنجاز مسجّلة في هذا النطاق.','No completion times recorded in this range.')}</p>`;
 const runs=lapse(A,f,l),tot=runs.length,quick=runs.filter(r=>r.len===1&&r.ret).length,ong=runs.filter(r=>!r.ret).length,ret=runs.filter(r=>r.ret);
 const bk=[[X('عادت من أول فرصة','Back at the very next chance'),runs.filter(r=>r.ret&&r.len===1).length],[X('بعد فرصتين','After 2 chances'),runs.filter(r=>r.ret&&r.len===2).length],[X('بعد 3–4 فرص','After 3–4 chances'),runs.filter(r=>r.ret&&r.len>=3&&r.len<=4).length],[X('بعد 5 فرص أو أكثر','After 5+ chances'),runs.filter(r=>r.ret&&r.len>=5).length],[X('لم تعد بعد','Not back yet'),ong]];
 const qr=pc(quick,tot),per={};runs.forEach(r=>{const q=per[r.t.id]=per[r.t.id]||{t:r.t,n:0,q:0,m:0};q.n++;q.m+=r.len;if(r.len===1&&r.ret)q.q++});
 const top=Object.values(per).sort((p,q)=>q.m-p.m).slice(0,5);
 const lap=tot?`<div class="grid" style="margin-bottom:12px">${kp(tot,X('عدد الفوات','Lapses'),'',X('سلسلة فوات متتالية = فوات واحد','a run of consecutive misses counts once'))}${kp(qr+'%',X('عودة فورية','Immediate comebacks'),'',X('تعود في أول موعد تالٍ','you return at the next due date'))}${kp(ret.length?num(avg(ret.map(r=>r.gap)))+X(' يوم',' d'):'—',X('متوسط أيام العودة','Avg. days to return'))}${kp(ong,X('فوات مستمر','Ongoing lapses'))}</div>
${bk.map(([l,n])=>rowBar(l,pc(n,tot),n,'','wide')).join('')}
<p style="margin:12px 0 4px"><b>${qr>=70?X('ترجع بسرعة 👏 — معظم فواتك لا يتكرر.','You bounce back fast 👏 — most misses don’t repeat.'):qr>=40?X('ترجع في الغالب خلال فرصتين. جرّب قاعدة «لا تفوّت مرتين».','You usually return within two chances. Try the “never miss twice” rule.'):X('فواتك تميل إلى الامتداد — الهدف: لا تفوّت مرتين متتاليتين.','Your misses tend to drag on — aim to never miss twice in a row.')}</b></p>
${top.length?`<h3>${X('مهام تتعثر فيها أكثر','Tasks you lapse on most')}</h3>${top.map(q=>`<div class="tr2"><span>${esc(q.t.icon)} ${esc(q.t.name)}</span><span class="mute">${q.n} ${X('فوات','lapses')} · ${X('عودة فورية','instant return')} ${pc(q.q,q.n)}%</span></div>`).join('')}`:''}`
 :`<p class="mute">${X('لا فوات في هذا النطاق 🎉','No lapses in this range 🎉')}</p>`;
 return`<h2 style="margin-top:20px">${X('أقوى وأضعف يوم في الأسبوع','Strongest & weakest weekday')}</h2><div class="card">${wdH||`<p class="mute">${X('لا بيانات.','No data.')}</p>`}${b?`<p style="margin:10px 0 0">${X('الأقوى:','Strongest:')} <b style="color:var(--ok)">${WN(b.i)} (${b.r}%)</b> · ${X('الأضعف:','Weakest:')} <b style="color:var(--bad)">${WN(w.i)} (${w.r}%)</b></p>`:''}</div>
<h2>${X('أفضل ساعة للإنجاز','Best hour of the day')}</h2><div class="card">${hrs}</div>
<h2>${X('خريطة السنة','Year heatmap')}</h2><div class="card">${heat(A)}</div>
<h2>${X('تحليل الفوات','Lapse analysis')}</h2><div class="card">${lap}</div>`}

/* =====================  per-task analysis  ===================== */
function panel(t,W){
 const o=occOf(t),a=W.cur,f=a.length?a[0].ds:'0000',l=a.length?a[a.length-1].ds:'9999',wo=o.filter(x=>x.ds>=f&&x.ds<=l);
 const done=wo.filter(x=>x.d).length,st=streaks(o),ti=tiers(o),u=unitOf(t),uw=t.rec.type==='daily'?X('يوم','days'):X('مرة','times');
 let h=`<div class="grid">${kp(pc(done,wo.length)+'%',X('الالتزام في النطاق','Adherence in range'),'',`${done} / ${wo.length}`)}${kp(ti.cur,X('السلسلة الحالية','Current streak'))}${kp(ti.best,X('أطول سلسلة','Longest streak'))}</div>`;
 const logs=Object.entries(S.logs).filter(([k])=>k.startsWith(t.id+'|')).map(([k,x])=>({ds:logDay(k),v:x.v,s:x.s})).filter(p=>p.ds>=f&&p.ds<=l).sort((p,q)=>p.ds<q.ds?-1:1);
 if(t.type==='value'){
  const pts=logs.filter(p=>p.v!=null&&p.v!==''&&!isNaN(+p.v)).map(p=>({ds:p.ds,v:+p.v}));
  h+=`<h3>${X('منحنى القيم','Value over time')}${u?' ('+esc(u)+')':''}</h3>`;
  if(pts.length){const vs=pts.map(p=>p.v),mx=pts.reduce((p,q)=>q.v>p.v?q:p),mn=pts.reduce((p,q)=>q.v<p.v?q:p),av=avg(vs),pad_=(mx.v-mn.v)*.1||Math.max(1,Math.abs(mx.v)*.1);
   h+=`<div class="grid" style="margin-bottom:12px">${kp(num(av)+' '+esc(u),X('المتوسط','Average'))}${kp(num(mx.v)+' '+esc(u),X('الأعلى','Highest'),'',sd(mx.ds))}${kp(num(mn.v)+' '+esc(u),X('الأدنى','Lowest'),'',sd(mn.ds))}${kp(num(pts[pts.length-1].v)+' '+esc(u),X('آخر قيمة','Latest'),pts.length>1?chg(null):'',pts.length>1?X('التغيّر منذ أول قيمة: ','Change since first: ')+(pts[pts.length-1].v-pts[0].v>0?'+':'')+num(pts[pts.length-1].v-pts[0].v):'')}</div>`
   +(pts.length>1?chart({lo:Math.max(0,mn.v-pad_),hi:mx.v+pad_,yf:v=>num(v),x:pts.map(p=>dB(pts[0].ds,p.ds)),ref:[av],label:X('منحنى قيم المهمة مع خط المتوسط','Task values with the average line'),
    ser:[{v:vs,line:1},{v:vs,dots:1,mk:1}],xl:[[0,sd(pts[0].ds)],[pts.length-1,sd(pts[pts.length-1].ds)]]})+`<div class="lg"><span><i style="background:var(--pri)"></i>${X('القيمة','Value')}</span><span>- - ${X('المتوسط','Average')}</span></div>`:`<p class="mute">${X('سجّل قيمتين على الأقل لرسم المنحنى.','Log at least two values to draw the curve.')}</p>`)}
  else h+=`<p class="mute">${X('لا قيم مسجّلة في هذا النطاق.','No values logged in this range.')}</p>`}
 else{
  const val=ds=>t.type==='normal'?(isDone(t,ds)?1:0):(+L(t,ds).v||0),goal=t.type==='normal'?1:t.goal;
  if(t.type!=='normal'){const vs=wo.map(x=>val(x.ds)),tot=vs.reduce((p,q)=>p+q,0),hit=vs.filter(v=>goal?v>=goal:v>0).length,bi=vs.indexOf(Math.max(0,...vs));
   h+=`<div class="grid" style="margin:12px 0">${goal?kp(pc(hit,wo.length)+'%',X('تحقيق الهدف','Goal achieved'),'',X(`${hit} من ${wo.length} موعدًا · الهدف ${goal} ${esc(u)}`,`${hit} of ${wo.length} days · goal ${goal} ${esc(u)}`)):''}${kp(t.type==='duration'?dur(tot):num(tot)+' '+esc(u),X('المجموع','Total'))}${kp(t.type==='duration'?dur(avg(vs)):num(avg(vs))+' '+esc(u),X('المتوسط لكل موعد','Average per day'))}${kp(vs.length&&vs[bi]?(t.type==='duration'?dur(vs[bi]):num(vs[bi])+' '+esc(u)):'—',X('أفضل يوم','Best day'),'',vs[bi]?sd(wo[bi].ds):'')}</div>`}
  const wk={};wo.forEach(x=>{const k=iso(wstart(P(x.ds))),g=wk[k]=wk[k]||{k,v:0,tg:0,n:0};g.v+=val(x.ds);g.n++;if(goal)g.tg+=goal});
  let ws=Object.values(wk).sort((p,q)=>p.k<q.k?-1:1);ws=ws.slice(-(AN.rng==='all'||AN.rng==='365'?52:26));
  if(ws.length){const mx=Math.max(1,...ws.map(q=>Math.max(q.v,q.tg)));
   h+=`<h3>${t.type==='normal'?X('الإنجازات الأسبوعية','Weekly completions'):X('المجاميع الأسبوعية','Weekly totals')}${goal?` <span class="mute sm">(${X('الخط المتقطع = المطلوب','dashed line = target')})</span>`:''}</h3>
<div class="wk" role="img" aria-label="${X('أعمدة المجاميع الأسبوعية','Weekly totals bars')}">${ws.map(q=>`<div title="${sd(q.k)}: ${t.type==='duration'?dur(q.v):num(q.v)}${goal?' / '+(t.type==='duration'?dur(q.tg):q.tg):''}"><i class="${goal&&q.v>=q.tg?'ok':''}" style="height:${q.v/mx*100}%"></i>${goal?`<b class="tg" style="bottom:${q.tg/mx*100}%"></b>`:''}</div>`).join('')}</div><div class="wkx"><span>${sd(ws[0].k)}</span><span>${sd(ws[ws.length-1].k)}</span></div>`}}
 h+=`<h3>${X('سجل كل السلاسل','All streaks log')} <span class="mute sm">(${X('كل الوقت','all time')}${st.length?` · ${st.length}`:''})</span></h3>`;
 if(st.length){const mx=Math.max(...st.map(q=>q.n));
  h+=`<div class="sl">${[...st].reverse().map(q=>`<div class="sr ${q.cur?'cur':''} ${q.n===mx&&mx>1?'top':''}"><span>${sdy(q.s)}${q.s!==q.e?' → '+sdy(q.e):''}</span><span><b>${q.n}</b> ${uw}${q.cur?' 🔥':''}${q.n===mx&&mx>1?' 🏆':''}</span></div>`).join('')}</div><p class="cap">🔥 ${X('جارية','ongoing')} · 🏆 ${X('الأطول','longest')}</p>`}
 else h+=`<p class="mute">${X('لا سلاسل بعد.','No streaks yet.')}</p>`;
 return h}
function secTk(A,W){
 const act=S.tasks.filter(t=>!t.arch);if(!act.length)return empty('🗂️',X('لا مهام','No tasks'),X('أضف مهمة لتظهر تحليلاتها.','Add a task to see its analysis.'));
 if(!AN.task||!T(AN.task)||T(AN.task).arch)AN.task=act[0].id;const t=T(AN.task),R=taskRates(W.cur);
 const rows=A.ts.map(q=>({q,r:R[q.id]||{n:0,c:0}})).filter(x=>x.r.n).sort((p,q)=>pc(q.r.c,q.r.n)-pc(p.r.c,p.r.n));
 return`<div class="fld" style="margin-top:14px"><label for="an-t">${X('اختر مهمة','Choose a task')}</label><select id="an-t">${act.map(q=>`<option value="${q.id}" ${q.id===AN.task?'selected':''}>${esc(q.icon)} ${esc(q.name)}${q.pause?' ('+X('متوقفة','paused')+')':''}</option>`).join('')}</select></div>
<div class="card"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:26px">${esc(t.icon)}</span><div><b style="font-size:18px">${esc(t.name)}</b><div class="mute sm">${X(TY[t.type],{normal:'Done / not done',counter:'Counter',duration:'Duration',value:'Value'}[t.type])}${t.cat?' · '+esc(t.cat):''}</div></div></div>${panel(t,W)}</div>
<h2>${X('ترتيب المهام في هذا النطاق','Task ranking in this range')}</h2>${rows.length?rows.map(({q,r})=>`<button class="lst" data-a="tsel" data-id="${q.id}"><div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(q.icon)} ${esc(q.name)}</b><b>${pc(r.c,r.n)}%</b></div><div class="pb"><i style="width:${pc(r.c,r.n)}%;background:${q.color}"></i></div><small class="mute">${r.c} / ${r.n}</small></button>`).join(''):`<div class="card empty mute">${X('لا بيانات في هذا النطاق.','No data in this range.')}</div>`}`}

/* =====================  categories  ===================== */
function secCt(A,W){
 const a=W.cur,{list,total}=cats(a,a[0].ds,a[a.length-1].ds);if(!list.length)return empty('🗂️',X('لا بيانات','No data'),'');
 const col=i=>COL[i%COL.length];
 return`<h2 style="margin-top:20px">${X('حصة الجهد (الإنجازات)','Share of effort (completions)')}</h2><div class="card">${total?`<div class="sh" role="img" aria-label="${X('حصة كل فئة من الإنجازات','Each category’s share of completions')}">${list.filter(g=>g.c).map(g=>`<i style="width:${g.c/total*100}%;background:${col(list.indexOf(g))}" title="${esc(g.k||X('بدون فئة','No category'))}: ${pc(g.c,total)}%"></i>`).join('')}</div><div class="lg">${list.filter(g=>g.c).map(g=>`<span><i style="background:${col(list.indexOf(g))}"></i>${esc(g.k||X('بدون فئة','No category'))} ${pc(g.c,total)}%</span>`).join('')}</div>`:`<p class="mute">${X('لا إنجازات في هذا النطاق.','No completions in this range.')}</p>`}</div>
<h2>${X('تفصيل الفئات','Category breakdown')}</h2>${list.map((g,i)=>`<div class="card cg"><h4><span><span style="color:${col(i)}">●</span> ${esc(g.k||X('بدون فئة','No category'))}</span><span>${pc(g.c,g.n)}%</span></h4><div class="pb"><i style="width:${pc(g.c,g.n)}%;background:${col(i)}"></i></div>
<div class="mt"><span>${X('النسبة','Ratio')}: <b>${g.c}/${g.n}</b></span><span>${X('الجهد','Effort')}: <b>${g.c}</b> ${X('إنجازًا','completions')} (${pc(g.c,total)}%)</span><span>${X('المدة','Time')}: <b>${g.min?dur(g.min):'—'}</b></span><span>${X('المهام','Tasks')}: <b>${g.ts.size}</b></span></div></div>`).join('')}
<p class="cap">${X('المدة = مجموع الدقائق المسجّلة في مهام «المدة» ضمن الفئة.','Time = the sum of minutes logged in “Duration” tasks within the category.')}</p>`}

/* =====================  mood & energy, badges  ===================== */
function moodLink(A){
 const M=S.mood||{},byD={};A.days.forEach(x=>byD[x.ds]=x);const e=TD(),res={m:[1,2,3,4,5].map(()=>({n:0,c:0,d:0})),e:[1,2,3,4,5].map(()=>({n:0,c:0,d:0})),days:0};
 Object.keys(M).forEach(ds=>{const x=byD[ds];if(!x||!x.n||(ds===e&&x.c<x.n))return;res.days++;['m','e'].forEach(k=>{const v=M[ds][k];if(v>=1&&v<=5){const g=res[k][v-1];g.n+=x.n;g.c+=x.c;g.d++}})});
 const grp=(k,lo,hi)=>res[k].slice(lo-1,hi).reduce((p,q)=>({n:p.n+q.n,c:p.c+q.c,d:p.d+q.d}),{n:0,c:0,d:0});
 for(const k of['e','m']){const H_=grp(k,4,5),L_=grp(k,1,2);if(H_.d>=2&&L_.d>=2){const hi=pc(H_.c,H_.n),lo=pc(L_.c,L_.n);if(Math.abs(hi-lo)>=8)
  res.sentence=k==='e'?X(`في أيام طاقتك العالية تنجز ${hi}% مقابل ${lo}% في أيام طاقتك المنخفضة`,`On high-energy days you complete ${hi}% vs ${lo}% on low-energy days`):X(`في أيام مزاجك الجيد تنجز ${hi}% مقابل ${lo}% في أيام مزاجك المنخفض`,`On good-mood days you complete ${hi}% vs ${lo}% on low-mood days`);if(res.sentence)break}}
 return res}
const mc=ds=>{const v=(S.mood||{})[ds]||{},row=(k,ic,lab)=>`<div class="fld"><span class="lab">${ic} ${lab}</span><div class="mood" role="group" aria-label="${lab}">${[1,2,3,4,5].map(i=>`<button type="button" data-a="mood" data-k="${k}" data-v="${i}" data-d="${ds}" aria-pressed="${v[k]===i}" aria-label="${lab} ${i}/5">${k==='m'?MO[i-1]:i}</button>`).join('')}</div></div>`;
 return`<section class="card" style="margin-top:16px"><h3 style="margin-top:0">${X('كيف مزاجك وطاقتك؟','How are your mood & energy?')}${ds===TD()?'':` <span class="mute sm">· ${sd(ds)}</span>`}</h3>${row('m','🙂',X('المزاج','Mood'))}${row('e','⚡',X('الطاقة','Energy'))}</section>`};
function secMb(A,W){
 const ml=moodLink(A),M=S.mood||{},a=W.cur,inW=Object.keys(M).filter(ds=>ds>=a[0].ds&&ds<=a[a.length-1].ds),av=k=>{const v=inW.map(ds=>M[ds][k]).filter(Boolean);return v.length?num(avg(v)):'—'};
 const lvl=(k,ic)=>ml[k].map((g,i)=>rowBar(`${ic(i)} ${i+1}`,pc(g.c,g.n),g.d?pc(g.c,g.n)+'%':'—','','')).join('');
 const mood=`<div class="card"><p class="mute" style="margin-top:0">${X('سجّل مزاجك وطاقتك يوميًا (هنا أو في شاشة «اليوم») ليُربط بنسبة إنجازك.','Rate your mood and energy daily (here or on the Today screen) to link them to your completion rate.')}</p>${mc(TD()).replace('<section class="card" style="margin-top:16px">','<section>')}
${ml.days>=5?`<div class="grid" style="margin:8px 0 14px">${kp(av('m'),X('متوسط المزاج','Avg. mood'),'','/5')}${kp(av('e'),X('متوسط الطاقة','Avg. energy'),'','/5')}${kp(ml.days,X('أيام مقيَّمة','Rated days'))}</div>
<h3>${X('نسبة الإنجاز بحسب المزاج','Completion by mood')}</h3>${lvl('m',i=>MO[i])}<h3>${X('نسبة الإنجاز بحسب الطاقة','Completion by energy')}</h3>${lvl('e',()=>'⚡')}
<p style="margin:10px 0 0"><b>${ml.sentence||X('لا فرق واضح بين الأيام حتى الآن.','No clear difference between days yet.')}</b></p>`:`<p class="mute" style="margin:6px 0 0">${X(`لديك ${ml.days} من 5 أيام مقيَّمة على الأقل — بعدها تظهر العلاقة هنا.`,`You have ${ml.days} of the 5 rated days needed — then the link appears here.`)}</p>`}</div>`;
 /* badges */
 const pf=tiers(A.days.filter(x=>x.n).map(x=>({ds:x.ds,d:x.c===x.n}))),TI=[[7,'🥉',X('برونزية','Bronze')],[30,'🥈',X('فضية','Silver')],[100,'🥇',X('ذهبية','Gold')]];
 const tiles=TI.map(([n,ic,nmz])=>{const got=pf.earned[n];return`<div class="card bdg ${got?'':'lock'}"><div class="em">${got?ic:'🔒'}</div><b>${n} ${X('أيام مثالية متتالية','perfect days in a row')}</b><small>${nmz} · ${got?X('حُصل عليها: ','Earned: ')+sdy(got):X(`سلسلتك الحالية ${pf.cur} من ${n}`,`current streak ${pf.cur} of ${n}`)}</small></div>`}).join('');
 const tr=A.ts.map(t=>({t,s:tiers(A.bt[t.id])})).filter(x=>x.s.best>=3).sort((p,q)=>q.s.best-p.s.best||q.s.cur-p.s.cur);
 const trl=tr.length?tr.map(({t,s})=>{const nx=[7,30,100].find(n=>n>s.cur),got=TI.filter(([n])=>s.earned[n]);
  return`<div class="tr2"><span>${esc(t.icon)} ${esc(t.name)}<br><small class="mute">${X('أفضل سلسلة','Best streak')} ${s.best}${nx&&s.cur>0?' · '+X(`الحالية ${s.cur}/${nx}`,`now ${s.cur}/${nx}`):''}</small></span><span style="font-size:22px" aria-label="${got.map(g=>g[2]).join(', ')}">${got.length?got.map(g=>g[1]).join(' '):'<span class="mute sm">'+X('في الطريق','on the way')+'</span>'}</span></div>`}).join(''):`<p class="mute">${X('أنجز مهمة 3 مرات متتالية لتظهر هنا.','Complete a task 3 times in a row and it shows up here.')}</p>`;
 return`<h2 style="margin-top:20px">${X('المزاج والطاقة','Mood & energy')}</h2>${mood}<h2>${X('شارات الإنجاز','Achievement badges')}</h2><div class="bds">${tiles}</div><h3>${X('شارات المهام (إنجازات متتالية: 7 · 30 · 100)','Task badges (consecutive completions: 7 · 30 · 100)')}</h3><div class="card">${trl}</div>`}

/* =====================  export & reports  ===================== */
async function saveFile(name,text,type,bom){const f=new File([(bom?'﻿':'')+text],name,{type});
 if(navigator.canShare?.({files:[f]})&&/Android|iPhone|iPad/.test(navigator.userAgent)){try{await navigator.share({files:[f]});return}catch(e){}}
 const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
const range=()=>{const A=build(),W=win(A.days,AN.rng);return W.cur.length?[W.cur[0].ds,W.cur[W.cur.length-1].ds]:[TD(),TD()]};
function csvTasks(){const[f,l]=range(),e=TD(),H_=[X('التاريخ','date'),X('المهمة','task'),X('الفئة','category'),X('النوع','type'),X('مجدولة','scheduled'),X('الحالة','status'),X('القيمة','value'),X('الوحدة','unit'),X('الوقت','time')],rows=[H_.join(',')];
 const ST={done:X('مكتملة','done'),partial:X('جزئية','partial'),missed:X('فائتة','missed'),pending:X('قيد الانتظار','pending')};
 S.tasks.forEach(t=>{for(let d=P(f),n=0;iso(d)<=l&&n<4000;d=add(d,1),n++){const ds=iso(d),lg=S.logs[t.id+'|'+ds],sc=due(t,d);if(t.arch&&!lg)continue;if(!sc&&!lg)continue;
  const st=lg?(lg.s==='c'?'done':'partial'):ds<e?'missed':'pending';
  rows.push([ds,csvq(t.name),csvq(t.cat||''),t.type,sc?1:0,ST[st],lg&&lg.v!=null?lg.v:'',csvq(unitOf(t)),lg&&lg.t?lg.t.slice(0,5):''].join(','))}});
 return rows.join('\r\n')}
function csvDaily(){const A=build(),[f,l]=range(),H_=[X('التاريخ','date'),X('اليوم','weekday'),X('مجدولة','scheduled'),X('منجزة','done'),X('النسبة %','rate %'),X('المزاج','mood'),X('الطاقة','energy'),X('ملاحظة','note')],rows=[H_.join(',')];
 A.days.filter(x=>x.ds>=f&&x.ds<=l).forEach(x=>{const m=(S.mood||{})[x.ds]||{};rows.push([x.ds,csvq(WN(x.wd)),x.n,x.c,x.n?pc(x.c,x.n):'',m.m||'',m.e||'',csvq((S.notes||{})[x.ds]||'')].join(','))});
 return rows.join('\r\n')}
function repRange(k,o){const n=new Date();let s,e;if(k==='week'){s=add(wstart(n),o*7);e=add(s,6)}else{s=new Date(n.getFullYear(),n.getMonth()+o,1);e=new Date(s.getFullYear(),s.getMonth()+1,0)}return[iso(s),iso(e)]}
function reportHTML(A,k,o){
 const[s,e]=repRange(k,o),t0=TD(),ee=e>t0?t0:e,full=ee===e;
 const cur=A.days.filter(x=>x.ds>=s&&x.ds<=ee),[ps,pe]=k==='week'?[iso(add(P(s),-7)),iso(add(P(s),-1))]:repRange('month',o-1),prev=A.days.filter(x=>x.ds>=ps&&x.ds<=pe);
 const m=met(cur),p=prev.some(x=>x.n)?met(prev):null,title=k==='week'?X('التقرير الأسبوعي','Weekly report'):X('التقرير الشهري','Monthly report');
 const sub=`${sdy(s)} – ${sdy(e)}${full?'':' · '+X('حتى اليوم','up to today')}`;
 if(!cur.length)return`<div class="rpt"><h1>${title}</h1><p class="sb">${sub}</p><p class="mute">${X('لا بيانات في هذه الفترة.','No data in this period.')}</p></div>`;
 const kc=(v,l,d)=>`<div class="kc"><b>${v}${d||''}</b><span>${l}</span></div>`;
 const bars=cur.map(x=>`<div title="${sd(x.ds)}: ${x.c}/${x.n}"><i style="height:${x.n?Math.max(2,x.c/x.n*80):2}px"></i>${k==='week'?SN(x.wd):P(x.ds).getDate()}</div>`).join('');
 const R=taskRates(cur),trs=A.ts.filter(t=>R[t.id]).map(t=>{const r=R[t.id],o_=A.bt[t.id].filter(x=>x.ds>=s&&x.ds<=ee),vs=o_.map(x=>+L(t,x.ds).v).filter(v=>v>0),ti=tiers(A.bt[t.id]);
  const sm=t.type==='value'?(vs.length?X('متوسط ','avg ')+num(avg(vs))+' '+esc(unitOf(t)):'—'):t.type==='counter'?num(vs.reduce((p,q)=>p+q,0))+' '+esc(unitOf(t)):t.type==='duration'?dur(vs.reduce((p,q)=>p+q,0)):'—';
  return`<tr><td>${esc(t.icon)} ${esc(t.name)}</td><td>${esc(t.cat||'—')}</td><td>${r.c}/${r.n}</td><td><div class="tbar"><i style="width:${pc(r.c,r.n)}%"></i></div></td><td>${pc(r.c,r.n)}%</td><td>${ti.cur}</td><td>${sm}</td></tr>`}).join('');
 const{list,total}=cats(cur,s,ee),{b,w}=cur.length>=14?wdBW(wdAgg(cur)):{};
 const md=Object.keys(S.mood||{}).filter(ds=>ds>=s&&ds<=ee),am=kk=>{const v=md.map(ds=>S.mood[ds][kk]).filter(Boolean);return v.length?num(avg(v)):null};
 return`<div class="rpt"><h1>${title}</h1><p class="sb">${sub}</p>
<div class="kg">${kc(m.rate+'%',X('نسبة الالتزام','Adherence'),p?chg(m.rate-p.rate):'')}${kc(m.perf,X('أيام مثالية','Perfect days'),full&&p?chg(rel(m.perf,p.perf)):'')}${kc(m.act,X('أيام نشطة','Active days'))}${kc(`${m.c}/${m.n}`,X('الإنجازات','Completions'))}${kc(m.cons,X('درجة الاتساق','Consistency'))}</div>
${p?`<p class="sb" style="margin-top:6px">${X('الأسهم مقارنة بـ','Arrows compare with ')}${k==='week'?X('الأسبوع السابق','the previous week'):X('الشهر السابق','the previous month')}.</p>`:''}
<h2>${X('الالتزام اليومي','Daily adherence')}</h2><div class="db">${bars}</div>
<h2>${X('المهام','Tasks')}</h2><table><thead><tr><th>${X('المهمة','Task')}</th><th>${X('الفئة','Category')}</th><th>${X('تمت','Done')}</th><th></th><th>%</th><th>${X('سلسلة','Streak')}</th><th>${X('ملخص','Summary')}</th></tr></thead><tbody>${trs}</tbody></table>
${list.length?`<h2>${X('الفئات','Categories')}</h2><table><thead><tr><th>${X('الفئة','Category')}</th><th>${X('النسبة','Ratio')}</th><th>${X('الجهد','Effort')}</th><th>${X('المدة','Time')}</th></tr></thead><tbody>${list.map(g=>`<tr><td>${esc(g.k||X('بدون فئة','No category'))}</td><td>${pc(g.c,g.n)}% (${g.c}/${g.n})</td><td>${g.c} (${pc(g.c,total)}%)</td><td>${g.min?dur(g.min):'—'}</td></tr>`).join('')}</tbody></table>`:''}
${b?`<h2>${X('الأنماط','Patterns')}</h2><ul><li>${X('أقوى يوم:','Strongest day:')} <b>${WN(b.i)}</b> (${b.r}%)</li><li>${X('أضعف يوم:','Weakest day:')} <b>${WN(w.i)}</b> (${w.r}%)</li></ul>`:''}
${am('m')||am('e')?`<h2>${X('المزاج والطاقة','Mood & energy')}</h2><ul>${am('m')?`<li>${X('متوسط المزاج:','Avg. mood:')} <b>${am('m')}</b>/5</li>`:''}${am('e')?`<li>${X('متوسط الطاقة:','Avg. energy:')} <b>${am('e')}</b>/5</li>`:''}</ul>`:''}
<p class="sb" style="margin-top:18px">${X('أُنشئ بتاريخ','Generated on')} ${sdy(t0)} — ${X('عادات','Habits')}</p></div>`}
const RCSS=`:root{--ink:#111;--mute:#555;--line:#d4d7e6;--card:#fff;--soft:#f1f2f8;--ok:#1fa971;--bad:#d64536;--pri:#3b4cca}body{font-family:"IBM Plex Sans Arabic",Tahoma,system-ui,sans-serif;margin:24px;color:#111;background:#fff}.dl.up{color:var(--ok)}.dl.dn{color:var(--bad)}.dl{font-size:12px;font-weight:700;unicode-bidi:isolate}`;
function repDlg(){const A=build(),k=AN.rep.k,o=AN.rep.o,[s,e]=repRange(k,o);
 show(`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="margin:0">${X('تقرير قابل للطباعة','Printable report')}</h2><button class="btn" data-a="close" aria-label="${X('إغلاق','Close')}">✕</button></div>
<div class="rg" role="group"><button data-a="rk" data-v="week" aria-pressed="${k==='week'}">${X('أسبوعي','Weekly')}</button><button data-a="rk" data-v="month" aria-pressed="${k==='month'}">${X('شهري','Monthly')}</button></div>
<div class="mh"><button class="btn" data-a="ro" data-n="-1" aria-label="${X('الفترة السابقة','Previous period')}">›</button><b>${sd(s)} – ${sd(e)}</b><button class="btn" data-a="ro" data-n="1" ${o>=0?'disabled':''} aria-label="${X('الفترة التالية','Next period')}">‹</button></div>
<div class="card" id="rp-body" style="margin-bottom:12px">${reportHTML(A,k,o)}</div>
<div class="acts"><button class="btn pri" data-a="rprint">🖨️ ${X('طباعة / حفظ PDF','Print / Save as PDF')}</button><button class="btn" data-a="rdl">${X('تنزيل HTML','Download HTML')}</button></div>
<p class="cap">${X('لحفظ PDF اختر «حفظ كـ PDF» في نافذة الطباعة. إن لم تعمل الطباعة على هاتفك فنزّل ملف HTML وافتحه في المتصفح.','To save a PDF choose “Save as PDF” in the print dialog. If printing doesn’t work on your phone, download the HTML file and open it in a browser.')}</p>`)}
function secRp(){const A=build(),[f,l]=range();
 return`<h2 style="margin-top:20px">${X('التقارير','Reports')}</h2><div class="card"><p class="mute" style="margin-top:0">${X('تقرير ملخّص جاهز للطباعة أو الحفظ كـ PDF، أسبوعيًا أو شهريًا.','A summary report ready to print or save as PDF, weekly or monthly.')}</p><div class="acts" style="margin:0"><button class="btn pri" data-a="rep" data-v="week">${X('تقرير أسبوعي','Weekly report')}</button><button class="btn pri" data-a="rep" data-v="month">${X('تقرير شهري','Monthly report')}</button></div></div>
<h2>${X('تصدير CSV','CSV export')}</h2><div class="card"><p class="mute" style="margin-top:0">${X(`يغطي النطاق المحدد: ${sdy(f)} → ${sdy(l)}. الملف بترميز UTF-8 ويفتح مباشرة في Excel.`,`Covers the selected range: ${sdy(f)} → ${sdy(l)}. UTF-8 encoded, opens directly in Excel.`)}</p><div class="acts" style="margin:0"><button class="btn" data-a="csv1">${X('سجل المهام (CSV)','Task log (CSV)')}</button><button class="btn" data-a="csv2">${X('ملخص يومي (CSV)','Daily summary (CSV)')}</button></div></div>`}

/* =====================  stats view  ===================== */
const VS={ov:secOv,pt:secPt,tk:secTk,ct:secCt,mb:secMb};
views.stats=()=>{
 const A=build();let h=`<h1>${X('الإحصائيات','Statistics')}</h1>`;
 if(!S.tasks.length)return h+empty('📊',X('لا بيانات بعد','No data yet'),X('أنشئ مهمة وسجّل إنجازاتك لتظهر التحليلات هنا.','Create a task and log it to see analytics here.'));
 h+=`<nav class="tb" aria-label="${X('أقسام الإحصائيات','Statistics sections')}">${SEC.map(([k,a,e])=>`<button data-a="sec" data-v="${k}" aria-pressed="${AN.sec===k}">${X(a,e)}</button>`).join('')}</nav>`;
 if(AN.sec!=='rp'&&AN.sec!=='tk'||AN.sec==='tk')h+=`<div class="rg" role="group" aria-label="${X('النطاق الزمني','Time range')}">${RNG.map(([k,a,e])=>`<button data-a="rg" data-v="${k}" aria-pressed="${AN.rng===k}">${X(a,e)}</button>`).join('')}</div>`;
 if(AN.sec==='rp')return h+secRp();
 if(!A.days.length)return h+empty('⏸️',X('لا مهام نشطة','No active tasks'),X('كل مهامك مؤرشفة أو متوقفة مؤقتًا.','All your tasks are archived or paused.'));
 return h+VS[AN.sec](A,win(A.days,AN.rng))};

/* =====================  wiring  ===================== */
Object.assign(ACT,{
 sec:(t,d,b)=>{AN.sec=b.dataset.v;render();scrollTo(0,0)},
 rg:(t,d,b)=>{AN.rng=b.dataset.v;render()},
 tsel:t=>{AN.task=t.id;AN.sec='tk';render();scrollTo(0,0)},
 hm:(t,d)=>{const[a,b]=dayRatio(d);toast(sd(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'})+': '+(b?a+'/'+b:X('لا مهام مجدولة','nothing scheduled')))},
 mood:(t,d,b)=>{S.mood=S.mood||{};const k=b.dataset.k,v=+b.dataset.v,o={...(S.mood[d]||{})};o[k]===v?delete o[k]:o[k]=v;Object.keys(o).length?S.mood[d]=o:delete S.mood[d];save();render()},
 an:t=>{dlg.close();tab='stats';AN.sec='tk';AN.task=t.id;render();scrollTo(0,0)},
 rep:(t,d,b)=>{AN.rep={k:b.dataset.v==='month'?'month':'week',o:0};repDlg()},
 rk:(t,d,b)=>{AN.rep={k:b.dataset.v,o:0};repDlg()},
 ro:(t,d,b)=>{AN.rep.o=Math.min(0,AN.rep.o+ +b.dataset.n);repDlg()},
 rprint:()=>{const p=document.getElementById('prt'),r=document.getElementById('rp-body');if(!p||!r)return;p.innerHTML=r.innerHTML;setTimeout(()=>window.print(),50)},
 rdl:()=>{const r=document.getElementById('rp-body');if(!r)return;const[s]=repRange(AN.rep.k,AN.rep.o),en=S.set.lang==='en';
  saveFile(`taskhabit-${AN.rep.k}-${s}.html`,`<!doctype html><html lang="${en?'en':'ar'}" dir="${en?'ltr':'rtl'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${AN.rep.k==='week'?X('التقرير الأسبوعي','Weekly report'):X('التقرير الشهري','Monthly report')}</title><style>${RCSS}</style><style>${REPSTYLE()}</style></head><body>${r.innerHTML}</body></html>`,'text/html;charset=utf-8')},
 csv1:()=>saveFile('taskhabit-tasks-'+TD()+'.csv',csvTasks(),'text/csv;charset=utf-8',true),
 csv2:()=>saveFile('taskhabit-daily-'+TD()+'.csv',csvDaily(),'text/csv;charset=utf-8',true)});
/* the report's own rules, extracted from this file's stylesheet so the downloaded copy looks the same */
function REPSTYLE(){let s='';for(const st of document.querySelectorAll('style'))if(st.textContent.includes('.rpt{')){const m=st.textContent.match(/\.rpt[^@]*?(?=#prt\{display:none\})/s);if(m)s+=m[0]}return s}
document.addEventListener('change',e=>{if(e.target.id==='an-t'){AN.task=e.target.value;render()}});
/* mood card on Today and Calendar */
const wrap=k=>{const b=views[k];views[k]=()=>{const h=b();return S.tasks.length&&day<=TD()?h+mc(day):h}};wrap('today');wrap('calendar');
/* "detailed analysis" shortcut inside the task dialog */
const d0=window.detail;window.detail=t=>{d0(t);const a=dlg.querySelector('.acts');if(a)a.insertAdjacentHTML('afterbegin',`<button class="btn" data-a="an" data-id="${t.id}">📊 ${X('تحليل مفصل','Detailed analysis')}</button>`)};
/* heatmap opens scrolled to today */
const ar0=window.afterRender;window.afterRender=function(root){ar0.apply(this,arguments);if(root===undefined||root===document.body){const h=document.querySelector('.hmw');if(h)h.scrollLeft=h.scrollWidth}};
if(tab==='stats')render();
})();
