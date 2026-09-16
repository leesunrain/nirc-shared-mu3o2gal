let sex='male', dist=1000;
const $=id=>document.getElementById(id);
document.querySelectorAll('#sexSeg button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#sexSeg button').forEach(x=>x.classList.remove('active'));b.classList.add('active');sex=b.dataset.sex});
document.querySelectorAll('#distSeg button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#distSeg button').forEach(x=>x.classList.remove('active'));b.classList.add('active');dist=+b.dataset.dist;$('hh').value='0';$('mm').value='';$('ss').value='';});
function fmt(sec){sec=Math.round(sec);let h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function short(sec){sec=Math.round(sec);let m=Math.floor(sec/60),s=sec%60;return `${m}:${String(s).padStart(2,'0')}`}
function pace(sec,dKm){return short(sec/dKm)}
function vdotFor(distanceM, seconds){
  const t=seconds/60, v=distanceM/t;
  const vo2=-4.60+0.182258*v+0.000104*v*v;
  const pct=0.8+0.1894393*Math.exp(-0.012778*t)+0.2989558*Math.exp(-0.1932605*t);
  return vo2/pct;
}
function timeForVdot(distanceM, target){
  let lo=30,hi=600;
  for(let i=0;i<80;i++){let mid=(lo+hi)/2;let val=vdotFor(distanceM,mid*60); if(val>target) lo=mid; else hi=mid}
  return ((lo+hi)/2)*60;
}
function tenFromInput(sec){
  if(dist===1000) return (sec + (sex==='male'?40:30))*10;
  if(dist===5000) return sec*2+90;
  return sec;
}
function myFormula(ten){
  let addHalf=ten<=2400?480:(ten<=3000?540:600);
  let half=ten*2+addHalf;
  let full=half*2+(sex==='female'?600:780);
  return {half,full,addHalf};
}

function hrFractionForKm(km){
  if(km<=5) return .35;
  if(km<=10) return .40;
  if(km<=20) return .475;
  if(km<=30) return .525;
  if(km<=35) return .60;
  if(km<=40) return .70;
  return .80;
}
function hrTarget(lt1,lt2,km){
  if(!lt1 || !lt2 || lt2<=lt1) return null;
  return Math.round(lt1+(lt2-lt1)*hrFractionForKm(km));
}
function racePaceTable(baseFull,lt1,lt2){
  const base=baseFull/42.195;
  let cum=0, rows=[];
  for(let km=1;km<=42;km++){
    let adj=km<=5?4:km<=10?2:km<=30?0:km<=41?1:-2;
    let sec=base+adj; cum+=sec;
    rows.push({label:`${km}K`,km,sec,cum,hr:hrTarget(lt1,lt2,km),mark:km%5===0});
  }
  let lastPace=base-1, lastSec=lastPace*0.195; cum+=lastSec;
  rows.push({label:'FIN',km:42.195,sec:lastPace,cum,hr:hrTarget(lt1,lt2,42),finish:true});
  return rows;
}
function renderPaceTable(baseFull,lt1,lt2){
  const rows=racePaceTable(baseFull,lt1,lt2);
  let prev5Cum=0, groupHrs=[];
  const hasHr=lt1 && lt2 && lt2>lt1;
  let html=`<div class="pace-head" style="grid-template-columns:.55fr 1fr ${hasHr?'.85fr ':''}1.05fr">
    <span>거리</span><span>목표 페이스</span>${hasHr?'<span>목표심박</span>':''}<span style="text-align:right">누적</span></div>`;
  rows.forEach(r=>{
    if(r.hr && !r.finish) groupHrs.push(r.hr);
    let split='';
    const kmNum=parseInt(r.label,10);
    if(!r.finish && kmNum%5===0){
      const lap5=r.cum-prev5Cum; prev5Cum=r.cum;
      const avgP=lap5/5;
      const avgHr=groupHrs.length?Math.round(groupHrs.reduce((a,b)=>a+b,0)/groupHrs.length):null;
      groupHrs=[];
      split=`<div class="five-split">
        <span class="split-main">${kmNum-4}~${kmNum}K · 5K 랩</span>
        <span class="split-time">${fmt(lap5)}</span>
        <span class="split-sub">평균 ${pace(avgP,1)}/km${avgHr?` · 평균 목표심박 ${avgHr} bpm`:''}</span>
      </div>`;
    }
    html+=`<div class="pace-block">
      <div class="pace-row ${r.mark?'mark':''} ${r.finish?'finish':''}" style="grid-template-columns:.55fr 1fr ${hasHr?'.85fr ':''}1.05fr">
        <span class="pace-km">${r.label}</span>
        <span class="pace-big">${pace(r.sec,1)}/km</span>
        ${hasHr?`<span class="hr-big">${r.hr} <small>bpm</small></span>`:''}
        <span class="pace-cum">${fmt(r.cum)}</span>
      </div>${split}
    </div>`;
  });
  if(hasHr){
    html+=`<div class="hr-guide"><b>심박 운영 가이드</b><br>
    1~5K: LT1→LT2 간격의 35% · 6~10K: 40% · 11~20K: 약 48% · 21~30K: 약 53% · 31~35K: 60% · 36~40K: 70% · 마지막: 약 80%.<br>
    후반 심박 상승은 자연스러운 드리프트를 고려하되, LT2를 억지로 목표로 삼지 않습니다. 날씨·컨디션·개인차에 따라 실제 심박은 달라질 수 있습니다.</div>`;
  }
  $('paceTable').innerHTML=html;
}
$('calc').onclick=()=>{
  let h=+$('hh').value||0,m=+$('mm').value||0,s=+$('ss').value||0;
  let input=h*3600+m*60+s;
  let lt1=parseInt($('lt1').value,10)||0, lt2=parseInt($('lt2').value,10)||0;
  $('error').textContent='';
  if(!input || m>59 || s>59){$('error').textContent='올바른 기록을 입력해 주세요.';return}
  if((lt1||lt2) && (!lt1 || !lt2 || lt1<80 || lt2>220 || lt2<=lt1)){$('error').textContent='LT1·LT2를 모두 입력하고 LT2가 LT1보다 높게 입력해 주세요.';return}
  let plausible=(dist===1000?input<900:dist===5000?input<3600:input<7200);
  if(!plausible){$('error').textContent='입력 기록과 선택한 거리를 다시 확인해 주세요.';return}
  let ten=tenFromInput(input);
  let my=myFormula(ten);

  // VDOT은 사용자가 실제로 입력한 거리/기록 자체에서 계산
  let vd=vdotFor(dist,input);
  let vdFull=timeForVdot(42195,vd);
  let avg=(vdFull+my.full)/2;

  $('tenEq').textContent=fmt(ten);
  $('tenPace').textContent=`페이스 ${pace(ten,10)}/km`;
  $('vdotTime').textContent=fmt(vdFull);
  $('vdotPace').textContent=`${pace(vdFull,42.195)}/km`;
  $('vdotNum').textContent=`VDOT ${vd.toFixed(1)}`;
  $('myTime').textContent=fmt(my.full);
  $('myPace').textContent=`${pace(my.full,42.195)}/km`;
  $('avgTime').textContent=fmt(avg);
  $('avgPace').textContent=`${pace(avg,42.195)}/km`;
  let safe=avg+300;
  $('safeTarget').textContent=`${fmt(safe)} · ${pace(safe,42.195)}/km`;
  renderPaceTable(avg,lt1,lt2);

  let first = dist===1000
    ? `1000m → 10km: 1000m 페이스 + ${sex==='male'?'40':'30'}초/km = 10km ${fmt(ten)}`
    : dist===5000
    ? `5km → 10km: 5km × 2 + 1분 30초 = 10km ${fmt(ten)}`
    : `입력 10km 기록 = ${fmt(ten)}`;
  let band=my.addHalf===480?'40분 이내 → +8분':my.addHalf===540?'40분 초과~50분 → +9분':'50분 초과 → +10분';
  $('formulaText').innerHTML=`${first}<br>10km → 하프: 10km × 2 + 보정 (${band}) = <b>${fmt(my.half)}</b><br>하프 → 풀: 하프 × 2 + ${sex==='female'?'10분(여자)':'13분(남자)'} = <b>${fmt(my.full)}</b>`;
  $('results').classList.remove('hidden');
  $('results').scrollIntoView({behavior:'smooth',block:'start'});
};
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}