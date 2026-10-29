/* FIN / QUALITY STUDIO · research interactions v2
   Every numeric value is derived from the existing, user-generated experiment tables.
   This browser UI does not retrain the model or fabricate observations. */
(function(){
'use strict';
const DATA=window.STUDY_DATA;
if(!DATA||!Array.isArray(DATA.thresholds)||!Array.isArray(DATA.summary))return;
const base=DATA.baseline;
const pick=(id)=>document.getElementById(id);
const nf=(n,dec=0)=>Number(n).toLocaleString('ko-KR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const lookup=(type,rate)=>DATA.summary.find(x=>x.type===type&&x.rate===rate);
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const names=['결측값','시각 오류','중복 거래'];
const rates=[5,10,20];
const preferredScore=.8;

function addAuthor(){
 const bar=document.querySelector('.topbar-actions');
 if(bar && !pick('author-credit-top')){
  const tag=document.createElement('span');tag.className='author-credit-top';tag.id='author-credit-top';tag.textContent='2670344 이서정';bar.prepend(tag);
 }
 const bottom=document.querySelector('.sidebar-bottom');
 if(bottom && !pick('author-credit-rail')){
  const tag=document.createElement('div');tag.id='author-credit-rail';tag.className='author-credit-rail';tag.textContent='2670344 이서정';bottom.appendChild(tag);
 }
 const footer=document.querySelector('.footer');
 if(footer){let note=footer.querySelector('.student-credit');if(!note){note=document.createElement('span');note.className='student-credit';note.textContent='2670344 이서정';footer.appendChild(note)}note.classList.add('author-credit-bottom')}
 document.querySelectorAll('body *').forEach(el=>{if(el.children.length===0 && /교수님/.test(el.textContent||''))el.textContent=el.textContent.replace(/교수님\s*제출용\s*/g,'').replace(/교수님/g,'')});
}

function impactTone(row){
 const delta=row.f1-base.f1;
 if(delta<-.025)return {bg:'#ffdfdc',level:'심한 성능 저하'};
 if(delta<-.007)return {bg:'#ffefeb',level:'성능 저하'};
 if(delta<-.001)return {bg:'#f2f4ff',level:'작은 성능 변화'};
 return {bg:'#eaf8f3',level:'거의 변화 없음'};
}
function impactDetails(type,rate,row){
 const count=row.fn-base.fn;
 if(type==='중복 거래')return `평가 기록이 ${nf(row.n-base.n)}건 늘었습니다. FN도 ${nf(count)}건 추가 집계되지만, 기존 거래와 예측값을 복제한 결과로 새로운 모델 실패가 아닙니다.`;
 if(type==='결측값')return `승인금액·전월 매출·최종 이용 경과일수 3개 변수를 선택된 거래에서 동시에 비웠습니다. 원본보다 평균 FN이 ${nf(count)}건 증가했습니다.`;
 return `승인시간대 한 개 변수를 ±1~6시간 변경했습니다. 원본 대비 FN이 평균 ${nf(count)}건 증가했습니다. 복합 결측과 동일 조건의 비교는 아닙니다.`;
}
function buildObservatory(){
 const source=document.querySelector('#overview .kpi-grid');
 if(!source||pick('impact-observatory'))return;
 const shell=document.createElement('section');shell.className='impact-observatory';shell.id='impact-observatory';
 const labels=['오류 유형','5%','10%','20%'].map(t=>`<span>${t}</span>`).join('');
 const rows=names.map(type=>`<div class="impact-row"><div class="impact-row-title">${type}</div>${rates.map(rate=>{
   const r=lookup(type,rate);if(!r)return '';
   const diff=(r.f1-base.f1)*100,style=impactTone(r);
   const dText=(diff>0?'+':'')+nf(diff,2)+'%p';
   return `<button type="button" class="impact-tile" data-impact-type="${type}" data-impact-rate="${rate}" aria-pressed="false" style="--cell-color:${style.bg}" aria-label="${type} ${rate}%: F1 ${nf(r.f1,4)}, ${dText}"><small>F1-SCORE</small><strong>${nf(r.f1,4)}</strong><span class="${diff<-.00001?'down':diff>.00001?'up':'flat'}">${dText}</span></button>`;
  }).join('')}</div>`).join('');
 shell.innerHTML=`<div class="impact-head"><div><span class="eyebrow">INTERACTIVE · QUALITY IMPACT MAP</span><h3>데이터 품질 충격 지도</h3><p>9개 실험 조건을 선택해 성능 저하와 미탐 변화를 탐색하세요.</p></div><span class="impact-badge">27 RUNS · ACTUAL DATA</span></div>
 <div class="impact-layout"><div class="impact-grid-wrap"><div class="impact-grid-labels">${labels}</div>${rows}<div class="impact-legend"><span>낮은 영향</span><i></i><span>큰 F1 감소</span> <span>· 색상은 원본 대비 F1 변화 정도</span></div></div>
 <div class="impact-inspector" aria-live="polite"><span class="eyebrow">SELECTED SCENARIO</span><h4 id="impact-name"></h4><div class="impact-number" id="impact-f1"></div><div class="impact-delta" id="impact-delta"></div>
 <div class="impact-bars"><div><div class="impact-barline"><span>원본 F1-score</span><b>${nf(base.f1,4)}</b></div><div class="impact-track"><div class="impact-fill" style="width:${nf(base.f1*100,2)}%"></div></div></div><div><div class="impact-barline"><span>선택 실험 F1-score</span><b id="impact-bar-value"></b></div><div class="impact-track"><div id="impact-fill-selected" class="impact-fill selected"></div></div></div></div>
 <p class="impact-insight" id="impact-insight"></p><button class="impact-cta" type="button" id="impact-open-lab">오류 실험실에서 자세히 비교 →</button></div></div>`;
 source.insertAdjacentElement('afterend',shell);
 shell.querySelectorAll('.impact-tile').forEach(btn=>btn.addEventListener('click',()=>selectImpact(btn.dataset.impactType,Number(btn.dataset.impactRate))));
 pick('impact-open-lab').addEventListener('click',()=>{const sel=shell.querySelector('.impact-tile[aria-pressed=true]');if(sel){pick('lab-type').value=sel.dataset.impactType;pick('lab-rate').value=sel.dataset.impactRate;pick('lab-type').dispatchEvent(new Event('change',{bubbles:true}))}location.hash='lab';});
 selectImpact('결측값',20);
}
function selectImpact(type,rate){
 const r=lookup(type,rate);if(!r)return;
 document.querySelectorAll('.impact-tile').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.impactType===type&&Number(b.dataset.impactRate)===rate)));
 const change=(r.f1-base.f1)*100;
 pick('impact-name').textContent=`${type} · ${rate}% 주입`;
 pick('impact-f1').innerHTML=`${nf(r.f1,4)}<span>F1-SCORE</span>`;
 pick('impact-delta').textContent=`원본 대비 ${change>=0?'+':''}${nf(change,2)}%p · ${impactTone(r).level}`;
 pick('impact-bar-value').textContent=nf(r.f1,4);
 pick('impact-fill-selected').style.width=(clamp(r.f1,0,1)*100)+'%';
 pick('impact-insight').textContent=impactDetails(type,rate,r);
}

const marks=[{key:'precision',title:'Precision',color:'#6679f6'},{key:'recall',title:'Recall',color:'#ee7b6c'},{key:'f1',title:'F1-score',color:'#18b79d'}];
function thresholdSvg(selected){
 const data=DATA.thresholds,w=850,h=300,l=62,r=24,t=30,b=46,pw=w-l-r,ph=h-t-b;
 const X=i=>l+i/(data.length-1)*pw,Y=v=>t+(1-v)/1*ph;
 const idx=clamp(selected,0,data.length-1),x=X(idx),row=data[idx];
 const path=key=>data.map((a,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(a[key]).toFixed(1)).join(' ');
 let out=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="임계값별 Precision, Recall, F1-score 곡선과 현재 ${nf(row.threshold,1)} 선택점"><defs><linearGradient id="f1-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1cb69f" stop-opacity=".23"/><stop offset="100%" stop-color="#1cb69f" stop-opacity="0"/></linearGradient></defs>`;
 out+=`<rect x="${(x-27).toFixed(1)}" y="${t-8}" width="54" height="${ph+16}" rx="9" fill="#e6f7f3" opacity=".9"/>`;
 for(let n=0;n<=5;n++){const v=n/5,cy=Y(v);out+=`<line x1="${l}" x2="${w-r}" y1="${cy}" y2="${cy}" stroke="#e7edf3" stroke-dasharray="3 5"/><text x="${l-10}" y="${cy+4}" fill="#8b9bb0" font-size="11" text-anchor="end">${nf(v,1)}</text>`;}
 for(let i=0;i<data.length;i++){out+=`<text x="${X(i)}" y="${h-15}" fill="${i===idx?'#0f9a8c':'#8597a9'}" font-size="${i===idx?'14':'11'}" font-weight="${i===idx?'800':'500'}" text-anchor="middle">${nf(data[i].threshold,1)}</text>`;}
 out+=`<path d="${path('f1')} L${X(data.length-1)},${Y(0)} L${X(0)},${Y(0)} Z" fill="url(#f1-area)"/>`;
 marks.forEach(m=>{out+=`<path d="${path(m.key)}" fill="none" stroke="${m.color}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
   data.forEach((d,i)=>out+=`<circle cx="${X(i)}" cy="${Y(d[m.key])}" r="3.2" fill="${m.color}" stroke="#fff" stroke-width="1.6"><title>${m.title} · ${nf(d.threshold,1)}: ${nf(d[m.key]*100,2)}%</title></circle>`);
 });
 out+=`<line x1="${x}" x2="${x}" y1="${t-7}" y2="${t+ph+8}" stroke="#178e81" stroke-width="2" stroke-dasharray="4 5"/>`;
 marks.forEach(m=>out+=`<circle cx="${x}" cy="${Y(row[m.key])}" r="9" fill="${m.color}" fill-opacity=".14" stroke="${m.color}" stroke-width="2"/><circle cx="${x}" cy="${Y(row[m.key])}" r="4.8" fill="${m.color}" stroke="#fff" stroke-width="2"/>`);
 out+=`<rect x="${clamp(x-42,l-1,w-r-84)}" y="${t-28}" rx="10" width="84" height="25" fill="#173c50"/><text x="${clamp(x,l+41,w-r-41)}" y="${t-11}" fill="#fff" font-size="12" text-anchor="middle" font-weight="700">선택 ${nf(row.threshold,1)}</text>`;
 for(let i=0;i<data.length;i++)out+=`<rect class="threshold-hit" tabindex="0" role="button" aria-label="${nf(data[i].threshold,1)} 임계값 선택" data-threshold-index="${i}" x="${X(i)-pw/(data.length-1)/2}" y="${t}" width="${pw/(data.length-1)}" height="${ph+10}" fill="transparent"/>`;
 return out+'</svg>';
}
function initThreshold(){
 const slider=pick('threshold-slider'),chart=pick('threshold-chart'),metrics=pick('threshold-metrics');
 if(!slider||!chart||!metrics)return;
 const panel=chart.closest('.panel');if(panel)panel.classList.add('threshold-panel');
 const legend=document.createElement('div');legend.className='threshold-legend';legend.innerHTML=marks.map(m=>`<span><i style="background:${m.color}"></i>${m.title}</span>`).join('');chart.insertAdjacentElement('afterend',legend);
 const trade=document.createElement('div');trade.className='threshold-tradeoff';trade.id='threshold-tradeoff';legend.insertAdjacentElement('afterend',trade);
 const note=document.createElement('div');note.className='threshold-note';note.id='threshold-note';metrics.insertAdjacentElement('afterend',note);
 const cm=document.createElement('div');cm.id='threshold-mini-matrix';cm.className='threshold-mini-matrix';note.insertAdjacentElement('afterend',cm);
 slider.addEventListener('input',updateInteractiveThreshold);
 slider.addEventListener('change',updateInteractiveThreshold);
 chart.classList.add('threshold-canvas');
 updateInteractiveThreshold();
}
function updateInteractiveThreshold(){
 const slider=pick('threshold-slider');if(!slider)return;
 const idx=clamp(Number(slider.value),0,DATA.thresholds.length-1),row=DATA.thresholds[idx];
 pick('threshold-chart').innerHTML=thresholdSvg(idx);
 pick('threshold-chart').querySelectorAll('[data-threshold-index]').forEach(hit=>{
  const choose=()=>{slider.value=hit.dataset.thresholdIndex;slider.dispatchEvent(new Event('input',{bubbles:true}))};
  hit.addEventListener('click',choose);
  hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}});
 });
 pick('threshold-value').textContent=nf(row.threshold,1);
 pick('threshold-metrics').innerHTML=[['Precision',nf(row.precision*100,2)+'%'],['Recall',nf(row.recall*100,2)+'%'],['F1-score',nf(row.f1,4)],['FP',nf(row.fp)],['FN',nf(row.fn)]].map(([name,value])=>`<div><span>${name}</span><strong>${value}</strong></div>`).join('');
 pick('threshold-tradeoff').innerHTML=marks.map(m=>`<div class="bar-stat"><span class="bar-stat-label">${m.title}</span><strong class="bar-stat-value">${nf(row[m.key]*100,2)}%</strong><div class="bar-stat-track"><div class="bar-stat-fill" style="width:${nf(row[m.key]*100,2)}%;background:${m.color}"></div></div></div>`).join('');
 const best=DATA.thresholds.reduce((a,b)=>b.f1>a.f1?b:a);
 let explanation=`선택한 임계값 ${nf(row.threshold,1)} · 2023년 검증 데이터의 사전 계산 결과를 조회하고 있습니다. `;
 if(Math.abs(row.threshold-best.threshold)<1e-6)explanation+='시험한 후보 중 F1-score가 가장 높았습니다. 2024년 최종 평가도 0.8을 고정했습니다.';
 else if(row.threshold<best.threshold)explanation+='임계값을 낮추면 일반적으로 재현율이 높아지는 대신 오탐이 늘어납니다.';
 else explanation+='임계값을 높이면 정밀도는 높아지지만 실제 이상거래를 놓치는 경우가 늘어납니다.';
 pick('threshold-note').textContent=explanation;
 const fraud=14713,normal=DATA.baseline.validation_rows-fraud, tp=fraud-row.fn,tn=normal-row.fp;
 const counts=[{n:'TN',v:tn},{n:'FP',v:row.fp,bad:true},{n:'FN',v:row.fn,bad:true},{n:'TP',v:tp}];
 pick('threshold-mini-matrix').innerHTML=`<div><strong>2023년 검증 혼동행렬 · 선택 임계값 ${nf(row.threshold,1)}</strong><span class="note">검증 총 ${nf(DATA.baseline.validation_rows)}건</span></div><div class="threshold-count-grid">${counts.map(c=>`<div class="threshold-count-cell ${c.bad?'bad':''}"><small>${c.n}</small><b>${nf(c.v)}</b></div>`).join('')}</div>`;
}
function initialize(){
 addAuthor();buildObservatory();initThreshold();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
