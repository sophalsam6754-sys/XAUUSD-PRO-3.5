/* XAUUSD PRO V3.4
   Upgrade from V3.3: real 15M + 1H confirmation, weighted signal score,
   swing/ATR Smart SL, TP1/2/3, ATR trailing stop, Entry Zone, R:R.
*/
const $=id=>document.getElementById(id);
let candles=[],tf='5min',apiKey=localStorage.getItem('xau_v34_key')||'',symbol=localStorage.getItem('xau_v34_symbol')||'XAU/USD';
let confirm15=[],confirm1h=[],lastAnalysis=null;
if($('apiKey'))$('apiKey').value=apiKey;if($('symbol'))$('symbol').value=symbol;
const n=v=>Number(v); const fmt=v=>Number.isFinite(v)?v.toFixed(2):'—';
function ema(a,p){if(!a.length)return 0;const k=2/(p+1);let e=a[0];for(let i=1;i<a.length;i++)e=a[i]*k+e*(1-k);return e}
function emaSeries(a,p){let out=[],e=0,k=2/(p+1);a.forEach((v,i)=>{e=i?v*k+e*(1-k):v;out.push(e)});return out}
function rsi(a,p=14){if(a.length<p+1)return 50;let g=0,l=0;for(let i=a.length-p;i<a.length;i++){let d=a[i]-a[i-1];g+=Math.max(d,0);l+=Math.max(-d,0)}return l?100-100/(1+g/l):g?100:50}
function atr(cs,p=14){if(cs.length<p)return 0;let s=0;for(let i=cs.length-p;i<cs.length;i++)s+=cs[i].h-cs[i].l;return s/p}
function macd(a){return ema(a,12)-ema(a,26)}
function trend(cs){if(!cs.length)return {bull:false,bear:false,ema9:0,ema21:0,rsi:50,macd:0};let c=cs.map(x=>x.c),e9=ema(c,9),e21=ema(c,21),m=macd(c),R=rsi(c);return {bull:e9>e21&&m>=0,bear:e9<e21&&m<=0,ema9:e9,ema21:e21,rsi:R,macd:m}}
function demoSeries(start=4180){let p=start,a=[];for(let i=0;i<180;i++){let o=p,c=o+(Math.random()-.47)*3,h=Math.max(o,c)+Math.random()*2,l=Math.min(o,c)-Math.random()*2;a.push({o,c,h,l});p=c}return a}
async function fetchSeries(interval,bars=180){const url='https://api.twelvedata.com/time_series?symbol='+encodeURIComponent(symbol)+'&interval='+encodeURIComponent(interval)+'&outputsize='+encodeURIComponent(bars)+'&apikey='+encodeURIComponent(apiKey);const r=await fetch(url);const j=await r.json();if(!j.values)throw Error(j.message||'API error');return j.values.reverse().map(v=>({o:n(v.open),c:n(v.close),h:n(v.high),l:n(v.low),time:v.datetime}))}
function set(id,v){if($(id))$(id).textContent=v} function width(id,v){if($(id))$(id).style.width=Math.max(0,Math.min(100,v))+'%'}
function signalStyle(s){if(!$('signal'))return;$('signal').textContent='● '+s;$('signal').className='signal '+s.toLowerCase();if($('sig2')){$('sig2').textContent=s;$('sig2').style.color=s==='BUY'?'#65e2ad':s==='SELL'?'#ff7884':'#ffe38b'}}
function calc(){if(!candles.length)return null;const c=candles.map(x=>x.c),last=c.at(-1),A=atr(candles)||last*.001,e9=ema(c,9),e21=ema(c,21),R=rsi(c),M=macd(c),t15=trend(confirm15.length?confirm15:candles),t1=trend(confirm1h.length?confirm1h:candles);
 let buy=0,sell=0;
 if(e9>e21)buy+=18;else if(e9<e21)sell+=18;
 if(R>55)buy+=12;else if(R<45)sell+=12;else if(R>=50)buy+=6;else sell+=6;
 if(M>0)buy+=12;else if(M<0)sell+=12;
 if(last>e21)buy+=10;else sell+=10;
 if(t15.bull)buy+=16;else if(t15.bear)sell+=16;
 if(t1.bull)buy+=22;else if(t1.bear)sell+=22;
 buy=Math.round(Math.min(100,buy));sell=Math.round(Math.min(100,sell));
 const signal=buy>=60&&buy>sell?'BUY':sell>=60&&sell>buy?'SELL':'WAIT',recent=candles.slice(-12),swingLow=Math.min(...recent.map(x=>x.l)),swingHigh=Math.max(...recent.map(x=>x.h));
 let dir=signal==='SELL'?-1:1,sl;
 if(signal==='BUY'){sl=Math.min(swingLow,last-A*1.25)}else if(signal==='SELL'){sl=Math.max(swingHigh,last+A*1.25)}else{dir=buy>=sell?1:-1;sl=last-dir*A*1.25}
 let risk=Math.max(Math.abs(last-sl),A),tp1=last+dir*risk,tp2=last+dir*risk*2,tp3=last+dir*risk*3,trail=last-dir*A;
 return {last,A,e9,e21,R,M,buy,sell,signal,dir,sl,risk,tp1,tp2,tp3,trail,t15,t1,zoneLow:last-A*.35,zoneHigh:last+A*.35};
}
function update(){const a=calc();if(!a)return;lastAnalysis=a;set('buy',a.buy+'%');set('sell',a.sell+'%');width('buyBar',a.buy);width('sellBar',a.sell);signalStyle(a.signal);set('entry',fmt(a.last));set('entryZone',fmt(a.zoneLow)+' – '+fmt(a.zoneHigh));set('sl',fmt(a.sl));set('tp1',fmt(a.tp1));set('tp2',fmt(a.tp2));set('tp3',fmt(a.tp3));set('trail',fmt(a.trail));set('atr',fmt(a.A));set('rr','1 : 1 / 2 / 3');set('ema',fmt(a.e9)+' / '+fmt(a.e21));set('rsi',a.R.toFixed(1));set('price',fmt(a.last));set('c15',a.t15.bull?'BULLISH':a.t15.bear?'BEARISH':'NEUTRAL');set('c1h',a.t1.bull?'BULLISH':a.t1.bear?'BEARISH':'NEUTRAL');}
function draw(){const c=$('chart');if(!c||!candles.length)return;const x=c.getContext('2d'),d=devicePixelRatio||1,w=c.clientWidth||600,h=c.clientHeight||360;c.width=w*d;c.height=h*d;x.setTransform(d,0,0,d,0,0);x.fillStyle='#06162d';x.fillRect(0,0,w,h);const hi=Math.max(...candles.map(v=>v.h)),lo=Math.min(...candles.map(v=>v.l)),pad=20,sy=(h-pad*2)/(hi-lo||1),sx=(w-pad*2)/Math.max(candles.length-1,1);for(let i=0;i<6;i++){let y=pad+i*(h-pad*2)/5;x.strokeStyle='#17314f';x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke()}candles.forEach((v,i)=>{let xx=pad+i*sx,yo=pad+(hi-v.o)*sy,yc=pad+(hi-v.c)*sy,yh=pad+(hi-v.h)*sy,yl=pad+(hi-v.l)*sy;x.strokeStyle=v.c>=v.o?'#35d39a':'#f06a75';x.beginPath();x.moveTo(xx,yh);x.lineTo(xx,yl);x.stroke();x.fillStyle=x.strokeStyle;x.fillRect(xx-2,Math.min(yo,yc),4,Math.max(2,Math.abs(yc-yo)))});let cs=candles.map(v=>v.c);[[emaSeries(cs,9),'#f4c542'],[emaSeries(cs,21),'#7da7ff']].forEach(([vals,col])=>{x.strokeStyle=col;x.lineWidth=2;x.beginPath();vals.forEach((v,i)=>{let xx=pad+i*sx,yy=pad+(hi-v)*sy;i?x.lineTo(xx,yy):x.moveTo(xx,yy)});x.stroke()})}
async function live(){try{if(!apiKey){candles=demoSeries();confirm15=demoSeries();confirm1h=demoSeries();update();draw();set('updated','DEMO mode');return}const bars=($('bars')?.value||150);const main=await fetchSeries(tf,bars);const [m15,h1]=await Promise.all([fetchSeries('15min',Math.max(80,Math.min(180,bars))),fetchSeries('1h',Math.max(80,Math.min(180,bars)))]);candles=main;confirm15=m15;confirm1h=h1;update();draw();set('updated','Updated '+new Date().toLocaleTimeString())}catch(e){console.error(e);candles=demoSeries();confirm15=demoSeries();confirm1h=demoSeries();update();draw();set('updated','DEMO — '+e.message)}}
function save(){apiKey=($('apiKey')?.value||'').trim();symbol=($('symbol')?.value||'XAU/USD').trim()||'XAU/USD';localStorage.setItem('xau_v34_key',apiKey);localStorage.setItem('xau_v34_symbol',symbol);live()}
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.tf button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tf button').forEach(x=>x.classList.remove('active'));b.classList.add('active');tf=b.dataset.tf||'5min';if($('tf'))$('tf').value=tf;live()});if($('tf'))$('tf').onchange=e=>{tf=e.target.value;document.querySelectorAll('.tf button').forEach(x=>x.classList.toggle('active',x.dataset.tf===tf));live()};if($('update'))$('update').onclick=save;window.onresize=draw;live();setInterval(live,30000)});
