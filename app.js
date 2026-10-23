/* DemandIQ hackathon prototype
 * Synthetic data only. The fitted model is a transparent, in-browser
 * regularized linear regression with lag, calendar, promotion and context features.
 * This is a demonstration, not a validated production forecasting system.
 */
const $ = (id) => document.getElementById(id);
const SKU_COUNT = 500, DC_COUNT = 50, HISTORY_DAYS = 210;
let chart = null, current = null;

const products = Array.from({length:SKU_COUNT}, (_,i) => {
  const groups = ["Beverages","Snacks","Personal Care","Home Care","Packaged Foods"];
  const names = ["Sparkling Drink","Potato Chips","Shampoo","Laundry Liquid","Instant Noodles","Biscuit Pack","Toothpaste","Juice Box","Dishwash Gel","Breakfast Cereal"];
  return {id:`SKU-${String(i+1).padStart(4,"0")}`, name:names[i%names.length], category:groups[i%groups.length],
    base: 12 + (i*17%88), trend:0.88+((i*13)%28)/100, promoLift:1.12+((i*7)%35)/100,
    seed:i+17, popularity:15+((i*19)%115), inventory:70+((i*37)%480)};
});
const centers = Array.from({length:DC_COUNT},(_,i)=>({id:`DC-${String(i+1).padStart(2,"0")}`,region:["North","South","East","West","Central"][i%5],factor:.78+((i*11)%50)/100,seed:i+101}));

function rand(seed){let x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function round(n){return Math.round(n)}
function dateOffset(days){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return d}
function fmtDate(d){return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
function isHoliday(d){return (d.getMonth()===0&&d.getDate()===26)||(d.getMonth()===7&&d.getDate()===15)||(d.getMonth()===9&&d.getDate()>=20&&d.getDate()<=31)||(d.getMonth()===11&&d.getDate()>=20)}
function isPromo(day,seed){return rand(seed+day*3.7)>.84}
function signals(day,seed){const d=dateOffset(day);return {promo:isPromo(day,seed),holiday:isHoliday(d),web:0.75+rand(seed+day*5.1)*.65,macro:.92+rand(seed+day*2.9)*.18,price:1+(rand(seed+day*8.3)-.5)*.08,weekday:d.getDay()}}
function makeActual(day,p,dc){const s=signals(day,p.seed+dc.seed);const dow=[.82,.9,.94,.98,1.06,1.2,1.14][s.weekday];const seasonal=1+.12*Math.sin((dateOffset(day).getMonth()/12)*Math.PI*2);const expected=p.popularity*dc.factor*dow*seasonal*p.trend*s.web*s.macro*(s.promo?p.promoLift:1)*(s.holiday?1.25:1)/s.price;return Math.max(0,round(expected+(rand(day*13+p.seed*9+dc.seed)*2-1)*Math.sqrt(expected)*.8))}
function generateHistory(p,dc){const arr=[];for(let i=-HISTORY_DAYS;i<0;i++){const s=signals(i,p.seed+dc.seed);arr.push({day:i,y:makeActual(i,p,dc),...s})}return arr}
function featureRow(day,history,p,dc){const d=dateOffset(day);const last=history.length?history[history.length-1].y:p.popularity*dc.factor;const lag7=history.length>=7?history[history.length-7].y:last;const lag28=history.length>=28?history[history.length-28].y:last;const recent=history.slice(-7);const avg7=recent.length?recent.reduce((a,b)=>a+b.y,0)/recent.length:last;const s=signals(day,p.seed+dc.seed);return {day,lag7,lag28,avg7,trend:day/30,weekSin:Math.sin(2*Math.PI*d.getDay()/7),weekCos:Math.cos(2*Math.PI*d.getDay()/7),monthSin:Math.sin(2*Math.PI*d.getMonth()/12),promo:+s.promo,holiday:+s.holiday,web:s.web,macro:s.macro,price:s.price}}
const FEATURE_NAMES=["lag7","lag28","avg7","trend","weekSin","weekCos","monthSin","promo","holiday","web","macro","price"];
function rawFeatures(f){return [f.lag7,f.lag28,f.avg7,f.trend,f.weekSin,f.weekCos,f.monthSin,f.promo,f.holiday,f.web,f.macro,f.price]}
function fitLinear(history,p,dc){
  // Use a chronological holdout for a simple, transparent model quality check.
  const start=35, split=history.length-28, rows=[];
  for(let i=start;i<split;i++){const h=history.slice(0,i);const f=featureRow(history[i].day,h,p,dc);rows.push({x:rawFeatures(f),y:history[i].y})}
  const means=[],scales=[];for(let j=0;j<FEATURE_NAMES.length;j++){const vals=rows.map(r=>r.x[j]);const m=vals.reduce((a,b)=>a+b,0)/vals.length;const sd=Math.sqrt(vals.reduce((a,b)=>a+(b-m)**2,0)/vals.length)||1;means.push(m);scales.push(sd)}
  const X=rows.map(r=>[1,...r.x.map((v,j)=>(v-means[j])/scales[j])]);const ys=rows.map(r=>r.y);let w=Array(FEATURE_NAMES.length+1).fill(0);w[0]=ys.reduce((a,b)=>a+b,0)/ys.length;
  // Batch gradient descent on standardized features, with mild coefficient shrinkage.
  const lr=.025,lambda=.015,n=X.length;
  for(let epoch=0;epoch<650;epoch++){const grad=Array(w.length).fill(0);for(let i=0;i<n;i++){let pred=0;for(let j=0;j<w.length;j++)pred+=w[j]*X[i][j];const err=pred-ys[i];for(let j=0;j<w.length;j++)grad[j]+=err*X[i][j]}for(let j=0;j<w.length;j++){grad[j]=grad[j]/n+(j?lambda*w[j]:0);w[j]-=lr*grad[j]}}
  const hold=[];for(let i=split;i<history.length;i++){const f=featureRow(history[i].day,history.slice(0,i),p,dc);const x=rawFeatures(f);let pred=w[0];for(let j=0;j<x.length;j++)pred+=w[j+1]*(x[j]-means[j])/scales[j];hold.push({actual:history[i].y,pred:Math.max(0,pred)})}
  const denom=hold.reduce((a,r)=>a+r.actual,0)||1;const wape=100*hold.reduce((a,r)=>a+Math.abs(r.actual-r.pred),0)/denom;
  return {w,means,scales,wape}
}
function predict(f,model){const x=rawFeatures(f);let pred=model.w[0];for(let j=0;j<x.length;j++)pred+=model.w[j+1]*(x[j]-model.means[j])/model.scales[j];return Math.max(0,pred)}
function buildForecast(p,dc,horizon){
  const history=generateHistory(p,dc),model=fitLinear(history,p,dc),extended=history.slice(),forecast=[];
  for(let k=0;k<horizon;k++){const day=k;const f=featureRow(day,extended,p,dc);const predicted=round(predict(f,model));const row={date:dateOffset(day),demand:predicted,promo:!!f.promo,holiday:!!f.holiday};forecast.push(row);extended.push({day,y:predicted,...f})}
  const total=forecast.reduce((a,r)=>a+r.demand,0),daily=total/horizon;
  const stock=round(p.inventory*dc.factor);
  const safety=round(daily*1.65),order=Math.max(0,round(total+safety-stock));
  const risk=stock<total?"High":stock<total+safety?"Medium":"Low";
  const recent=history.slice(-35);
  const driverScores=[
    {name:"Recent sales (7-day lag)",value:Math.abs(model.w[1]||0),label:"Sales momentum"},
    {name:"Promotion calendar",value:Math.abs(model.w[8]||0),label:"Promotion effect"},
    {name:"Seasonality / weekday",value:Math.abs(model.w[4]||0)+Math.abs(model.w[5]||0)+Math.abs(model.w[7]||0),label:"Calendar pattern"},
    {name:"Web interest",value:Math.abs(model.w[10]||0),label:"Online demand signal"},
    {name:"Price & macro context",value:Math.abs(model.w[11]||0)+Math.abs(model.w[12]||0),label:"Market context"}
  ];
  const max=Math.max(...driverScores.map(x=>x.value),.01);driverScores.forEach(x=>x.score=100*x.value/max);
  return {p,dc,history,model,forecast,total,stock,safety,order,risk,wape:model.wape,recent,driverScores}
}
function initSelects(){for(const p of products){const o=document.createElement("option");o.value=p.id;o.textContent=`${p.id} · ${p.name} (${p.category})`; $("skuSelect").append(o)}for(const dc of centers){const o=document.createElement("option");o.value=dc.id;o.textContent=`${dc.id} · ${dc.region} region`; $("dcSelect").append(o)}$("skuSelect").value=products[16].id;$("dcSelect").value=centers[3].id}
function render(){
  const p=products.find(x=>x.id===$("skuSelect").value),dc=centers.find(x=>x.id===$("dcSelect").value),h=Number($("horizonSelect").value);
  current=buildForecast(p,dc,h);
  $("todayLabel").textContent=`Updated ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`;
  $("forecastTotal").textContent=current.total.toLocaleString("en-IN");
  $("inventoryValue").textContent=current.stock.toLocaleString("en-IN");
  $("inventoryFoot").textContent=`${Math.max(0,round(current.stock/(current.total/h||1)))} forecast-demand days of cover`;
  $("riskValue").textContent=current.risk;
  $("riskValue").style.color=current.risk==="High"?"var(--red)":current.risk==="Medium"?"var(--orange)":"var(--green)";
  $("riskFoot").textContent=current.risk==="High"?"Potential stockout within horizon":current.risk==="Medium"?"Limited safety-stock coverage":"Stock covers projected horizon";
  $("wapeValue").textContent=`${current.wape.toFixed(1)}%`;
  $("orderQty").textContent=current.order.toLocaleString("en-IN");
  $("statusPill").textContent=current.order>0?(current.risk==="High"?"Replenish soon":"Order recommended"):"Stock appears sufficient";
  $("statusPill").className="status"+(current.risk==="High"?" danger":current.risk==="Medium"?" warning":"");
  const coverage=clamp(current.stock/(current.total+current.safety||1)*100,0,100);
  $("coverageText").textContent=`${coverage.toFixed(0)}% of demand + safety stock`;
  $("coverageBar").style.width=`${coverage}%`;
  $("coverageBar").style.background=current.risk==="High"?"var(--red)":current.risk==="Medium"?"var(--orange)":"var(--blue)";
  $("recommendationText").textContent=current.order>0?`Suggested order = forecast demand (${current.total.toLocaleString("en-IN")}) + safety buffer (${current.safety.toLocaleString("en-IN")}) − estimated stock (${current.stock.toLocaleString("en-IN")}). Confirm supplier lead time, minimum order quantities and actual on-hand stock before acting.`:"Current estimated stock covers this horizon and the safety buffer. Recheck if lead times or demand signals change.";
  $("drivers").innerHTML=current.driverScores.sort((a,b)=>b.score-a.score).map(d=>`<div><div class="driver-head"><span>${d.name}</span><strong>${Math.round(d.score)} / 100</strong></div><div class="driver-track"><div class="driver-fill" style="width:${d.score}%"></div></div></div>`).join("");
  $("forecastRows").innerHTML=current.forecast.slice(0,7).map(r=>{const risk=r.demand>current.stock/Math.max(1,h)*1.35?"High":r.demand>current.stock/Math.max(1,h)*.8?"Watch":"Low";return `<tr><td>${fmtDate(r.date)}</td><td><strong>${r.demand.toLocaleString("en-IN")}</strong></td><td><span class="tag ${r.promo?"yes":""}">${r.promo?"Active":"—"}</span></td><td><span class="risk ${risk.toLowerCase()==="watch"?"medium":risk.toLowerCase()}">${risk}</span></td></tr>`}).join("");
  drawChart(current);
}
function drawChart(data){
  const hist=data.history.slice(-35),labels=hist.map(x=>fmtDate(dateOffset(x.day))).concat(data.forecast.map(x=>fmtDate(x.date)));
  const actual=hist.map(x=>x.y).concat(Array(data.forecast.length).fill(null));
  const pred=Array(hist.length-1).fill(null).concat([hist[hist.length-1].y],data.forecast.map(x=>x.demand));
  const ctx=$("demandChart").getContext("2d");if(chart)chart.destroy();
  chart=new Chart(ctx,{type:"line",data:{labels,datasets:[{label:"Actual sales",data:actual,borderColor:"#4968e8",backgroundColor:"#4968e8",borderWidth:2,pointRadius:0,tension:.28},{label:"Forecast",data:pred,borderColor:"#9daaf7",backgroundColor:"#9daaf7",borderWidth:2,borderDash:[5,4],pointRadius:0,tension:.28}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:"#172033",padding:11}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8,color:"#929bad",font:{size:10}}},y:{beginAtZero:true,grid:{color:"#eff1f6"},ticks:{color:"#929bad",font:{size:10}}}}}});
}
$("refreshBtn").addEventListener("click",render);$("skuSelect").addEventListener("change",render);$("dcSelect").addEventListener("change",render);$("horizonSelect").addEventListener("change",render);
initSelects();render();
