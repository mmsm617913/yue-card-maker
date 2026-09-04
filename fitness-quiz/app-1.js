const Q = window.YUE_QUESTIONS || [];
const SUBJECT_NAMES = {PHY:"運動生理",AGE:"發展老化",PATH:"病理風險",PSY:"運動心理",SAFE:"急救安全",NUT:"營養體控",EXRX:"運動處方"};
const STORE_KEY="yue_fit_quiz_state_v02";
const ACTIVE_KEY="yue_fit_active_quiz_v02";
const DATA_VERSION="2026-09-05-v04";
const EMPTY_LEARNING={attempts:0,correct:0,wrong:0,streak:0,mastery:"未學習",lastSeen:null,nextReview:null,lapses:0};
const defaultState={schema:2,dataVersion:DATA_VERSION,learning:{},favorites:{},settings:{sound:true},lastMode:null,currentSubject:"ALL"};

function clone(x){return JSON.parse(JSON.stringify(x));}
function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORE_KEY)||"null");
    if(!raw||raw.schema!==2) return clone(defaultState);
    return {...clone(defaultState),...raw,learning:raw.learning||{},favorites:raw.favorites||{},settings:{...defaultState.settings,...(raw.settings||{})}};
  }catch(e){return clone(defaultState)}
}
let state=loadState();
function saveState(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));return true}catch(e){showHomeNotice("這台裝置無法儲存進度，請先匯出備份或檢查Safari網站資料設定。","bad");return false}}
function getLearning(uid){return state.learning[uid]||EMPTY_LEARNING;}
function ensureLearning(uid){if(!state.learning[uid]) state.learning[uid]=clone(EMPTY_LEARNING);return state.learning[uid];}

function intervalDays(streak){if(streak<=1)return 1;if(streak===2)return 3;if(streak===3)return 7;if(streak===4)return 14;return 30;}
function updateLearning(q,correct){
  const s=ensureLearning(q.uid),now=Date.now();s.attempts++;s.lastSeen=now;
  if(correct){s.correct++;s.streak++;const acc=s.correct/s.attempts;s.mastery=(s.attempts>=3&&s.streak>=3&&acc>=.8)?"已熟悉":"學習中";s.nextReview=now+intervalDays(s.streak)*86400000;}
  else{s.wrong++;s.streak=0;s.lapses++;s.mastery="答錯待複習";s.nextReview=now+6*3600000;}
  saveState();
}
function questionScore(q){
  const s=getLearning(q.uid),now=Date.now(),isNew=s.attempts===0?1:0;let due=0;
  if(s.nextReview&&s.nextReview<=now) due=Math.min(1,.6+(now-s.nextReview)/(7*86400000)*.4);
  const weakness=Math.min(1,(s.attempts?s.wrong/s.attempts:0)*.65+Math.min(1,s.lapses/3)*.25+(s.mastery==="答錯待複習"?.1:0));
  const recent=s.lastSeen?Math.max(0,1-(now-s.lastSeen)/(2*86400000)):0;
  return 40*due+25*weakness+15*(q.exam_importance||.35)+10*isNew+5-15*recent;
}
function subjectFilter(q){return state.currentSubject==="ALL"||q.subject_code===state.currentSubject;}
function buildPool(mode){
  let arr=Q.filter(subjectFilter),now=Date.now();
  if(mode==="review") arr=arr.filter(q=>{const s=getLearning(q.uid);return s.mastery==="答錯待複習"||(s.nextReview&&s.nextReview<=now)});
  if(mode==="new") arr=arr.filter(q=>getLearning(q.uid).attempts===0);
  if(mode==="core") arr=arr.filter(q=>q.core400);
  return arr;
}
function chooseSession(mode,n=20){
  let arr=buildPool(mode).slice();
  if(!arr.length) return [];
  arr.sort((a,b)=>mode==="core"?((b.exam_importance||0)-(a.exam_importance||0)||questionScore(b)-questionScore(a)):questionScore(b)-questionScore(a));
  const top=arr.slice(0,Math.max(n*3,n));shuffle(top);return top.slice(0,Math.min(n,top.length));
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

let quiz=null,timerInt=null;
function serializeQuiz(){if(!quiz)return null;return {...quiz,questions:quiz.questions.map(q=>q.uid)};}
function persistQuiz(){try{if(quiz)localStorage.setItem(ACTIVE_KEY,JSON.stringify(serializeQuiz()));else localStorage.removeItem(ACTIVE_KEY);}catch(e){}}
function restoreQuiz(){
  try{
    const raw=JSON.parse(localStorage.getItem(ACTIVE_KEY)||"null");if(!raw||!Array.isArray(raw.questions))return null;
    const by=Object.fromEntries(Q.map(q=>[q.uid,q]));const qs=raw.questions.map(u=>by[u]).filter(Boolean);if(!qs.length)return null;
    return {...raw,questions:qs};
  }catch(e){return null}
}
function clearQuiz(){quiz=null;try{localStorage.removeItem(ACTIVE_KEY)}catch(e){}clearInterval(timerInt);}

function renderHome(){
  showScreen("home");renderHomeStatsOnly();renderSubjectChips();updateNetworkStatus();
  const saved=restoreQuiz();
  if(saved&&!saved.finished) showHomeNotice(`有一場尚未完成的${saved.kind==="exam"?"模擬考":"刷題"}（${saved.index+1}/${saved.questions.length}）。<button onclick="resumeQuiz()">繼續</button>`,"resume");
}
function renderHomeStatsOnly(){
  const vals=Object.values(state.learning),mastered=vals.filter(x=>x.mastery==="已熟悉").length,wrong=vals.filter(x=>x.mastery==="答錯待複習").length,touched=vals.filter(x=>x.attempts>0).length;
  const due=Q.filter(q=>{const s=getLearning(q.uid);return s.nextReview&&s.nextReview<=Date.now()}).length;
  if($("#mastered"))$("#mastered").textContent=mastered;if($("#wrongCount"))$("#wrongCount").textContent=wrong;if($("#dueCount"))$("#dueCount").textContent=due;
  if($("#coverage"))$("#coverage").textContent=`${touched} / 785`;if($("#coverageFill"))$("#coverageFill").style.width=`${Math.round(touched/785*100)}%`;
}
function renderSubjectChips(){const c=$("#subjectChips");c.innerHTML=`<button class="chip ${state.currentSubject==="ALL"?"active":""}" onclick="setSubject('ALL')">全部七科</button>`+Object.entries(SUBJECT_NAMES).map(([k,v])=>`<button class="chip ${state.currentSubject===k?"active":""}" onclick="setSubject('${k}')">${v}</button>`).join("");}
function setSubject(code){state.currentSubject=code;saveState();renderSubjectChips();}
function showHomeNotice(html,type=""){const n=$("#homeNotice");if(!n)return;n.className=`notice ${type||""}`;n.innerHTML=html;}
function hideHomeNotice(){const n=$("#homeNotice");if(n){n.className="notice hidden";n.innerHTML=""}}

function startStudy(mode){
  hideHomeNotice();const n=mode==="review"?15:20,qs=chooseSession(mode,n);
  if(!qs.length){
    const subject=state.currentSubject==="ALL"?"目前":"這個科目目前";
    showHomeNotice(mode==="review"?`${subject}沒有到期複習題。你可以先做新題學習。`:`${subject}沒有符合條件的題目。`);return;
  }
  quiz={kind:"study",mode,questions:qs,index:0,answered:false,selected:null,correct:0,results:[],wrongUids:[],started:Date.now(),finished:false};state.lastMode=mode;saveState();persistQuiz();renderQuestion();
}
function subjectQuota(n){return n===50?{PHY:9,AGE:7,PATH:6,PSY:9,SAFE:8,NUT:7,EXRX:4}:{PHY:18,AGE:14,PATH:12,PSY:17,SAFE:16,NUT:15,EXRX:8};}
function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function shuffleWith(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pickSubjectExam(candidates,count,usedClusters,rng){
  const cand=shuffleWith(candidates.slice(),rng),selected=[],topicCounts={},topicCap=Math.max(2,Math.ceil(count*.40));
  const add=q=>{selected.push(q);const t=q.topic||"__NONE__";topicCounts[t]=(topicCounts[t]||0)+1;if(q.repeat_cluster)usedClusters.add(q.repeat_cluster)};
  for(const q of cand){if(selected.length>=count)break;const t=q.topic||"__NONE__";if(q.repeat_cluster&&usedClusters.has(q.repeat_cluster))continue;if(t!=="__NONE__"&&(topicCounts[t]||0)>=topicCap)continue;add(q)}
  if(selected.length<count){const chosen=new Set(selected.map(q=>q.uid));for(const q of cand){if(selected.length>=count)break;if(chosen.has(q.uid))continue;if(q.repeat_cluster&&usedClusters.has(q.repeat_cluster))continue;add(q);chosen.add(q.uid)}}
  if(selected.length<count){const chosen=new Set(selected.map(q=>q.uid));for(const q of cand){if(selected.length>=count)break;if(chosen.has(q.uid))continue;add(q);chosen.add(q.uid)}}
  return selected;
}
function blockOfSubject(code){if(["PHY","AGE"].includes(code))return 1;if(["EXRX","PATH","PSY"].includes(code))return 2;return 3;}
function startExam(kind){
  const n=kind==="exam50"?50:100,arr=kind==="core100"?Q.filter(q=>q.core400):Q.slice(),quota=subjectQuota(n),selected=[],usedClusters=new Set();
  const seed=(Date.now()^(Math.random()*0xffffffff))>>>0,rng=mulberry32(seed);
  Object.entries(quota).forEach(([code,count])=>selected.push(...pickSubjectExam(arr.filter(q=>q.subject_code===code),count,usedClusters,rng)));
  if(kind==="exam3block"){
    selected.sort((a,b)=>blockOfSubject(a.subject_code)-blockOfSubject(b.subject_code));
    for(const b of [1,2,3]){const inds=selected.map((q,i)=>blockOfSubject(q.subject_code)===b?i:-1).filter(i=>i>=0),items=shuffleWith(inds.map(i=>selected[i]),rng);inds.forEach((ix,k)=>selected[ix]=items[k])}
  }else shuffleWith(selected,rng);
  quiz={kind:"exam",mode:kind,questions:selected,index:0,answers:{},correct:0,wrongUids:[],started:Date.now(),seed,timeLimit:(kind==="exam3block"?40:(n===50?60:120))*60,blockStarted:kind==="exam3block"?Date.now():null,finished:false};persistQuiz();startTimer();renderQuestion();
}
function startTimer(){clearInterval(timerInt);paintTimer();timerInt=setInterval(()=>{if(!quiz||quiz.kind!=="exam")return;paintTimer();const base=quiz.mode==="exam3block"?(quiz.blockStarted||quiz.started):quiz.started;const remain=Math.max(0,quiz.timeLimit-Math.floor((Date.now()-base)/1000));if(remain<=0){clearInterval(timerInt);onTimerExpired()}},1000)}
function paintTimer(){
  if(!quiz||quiz.kind!=="exam")return;
  const isBlocks=quiz.mode==="exam3block",base=isBlocks?(quiz.blockStarted||quiz.started):quiz.started;
  const elapsed=Math.floor((Date.now()-base)/1000),remain=Math.max(0,quiz.timeLimit-elapsed),el=$("#timer");
  if(el)el.textContent=`${String(Math.floor(remain/60)).padStart(2,"0")}:${String(remain%60).padStart(2,"0")}`;
}
function currentBlock(){return quiz&&quiz.mode==="exam3block"?blockOfSubject(quiz.questions[quiz.index].subject_code):null;}
function onTimerExpired(){
  if(quiz&&quiz.mode==="exam3block"){
    const b=currentBlock();if(b<3){const next=quiz.questions.findIndex((q,i)=>i>quiz.index&&blockOfSubject(q.subject_code)===b+1);if(next>=0){quiz.index=next;quiz.blockStarted=Date.now();persistQuiz();renderQuestion();return}}
  }
  finishQuiz(true);
}
