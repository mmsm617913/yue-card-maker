function renderQuestion(){
  showScreen("quiz");const q=quiz.questions[quiz.index];
  $("#qIndex").textContent=`${quiz.index+1} / ${quiz.questions.length}`;$("#timer").classList.toggle("hidden",quiz.kind!=="exam");$("#submitExamTop").classList.toggle("hidden",quiz.kind!=="exam");
  const prevCrossBlock=quiz.mode==="exam3block"&&quiz.index>0&&blockOfSubject(quiz.questions[quiz.index-1].subject_code)!==currentBlock();$("#prevBtn").classList.toggle("hidden",quiz.index===0||prevCrossBlock);
  $("#qMeta").innerHTML=`<span class="badge">${SUBJECT_NAMES[q.subject_code]}</span>${quiz.mode==="exam3block"?`<span class="badge core">第${currentBlock()}段 · 40分鐘</span>`:""}${q.core400?'<span class="badge core">核心400</span>':""}${["S","A"].includes(q.priority_tier)?`<span class="badge hot">${q.priority_tier}級高頻</span>`:""}`;
  $("#qText").textContent=q.stem;$("#choices").innerHTML=q.choices.map((c,i)=>`<button class="choice" onclick="answerChoice(${i+1})"><b>${String.fromCharCode(65+i)}.</b> ${escapeHtml(c)}</button>`).join("");
  $("#feedback").className="feedback hidden";$("#feedback").innerHTML="";$("#nextBtn").classList.remove("hidden");$("#nextBtn").textContent=quiz.index===quiz.questions.length-1?(quiz.kind==="exam"?"檢查／交卷":"完成"):`下一題 →`;
  $("#favoriteBtn").textContent=state.favorites[q.uid]?"★ 已收藏":"☆ 收藏";
  if(quiz.kind==="exam"){
    const picked=quiz.answers[quiz.index];if(picked!=null)[...document.querySelectorAll(".choice")].forEach((b,i)=>b.classList.toggle("selected",i===picked-1));
  }else if(quiz.answered){paintStudyAnswer(q,quiz.selected,quiz.results[quiz.index]);}
  persistQuiz();
}
function paintStudyAnswer(q,idx,correct){
  const btns=[...document.querySelectorAll(".choice")];btns.forEach((b,i)=>{if(i===q.official_answer_index-1)b.classList.add("correct");if(i===idx-1&&!correct)b.classList.add("wrong");b.disabled=true;});
  const fb=$("#feedback");fb.className=`feedback ${correct?"ok":"bad"}`;fb.innerHTML=correct?`<b>答對了 ✓</b><br>${escapeHtml(q.official_answer_text||"")}`:`<b>這題要再複習</b><br>正確答案：${q.official_answer_index}. ${escapeHtml(q.official_answer_text||"")}`;
}
function answerChoice(idx){
  if(!quiz)return;const q=quiz.questions[quiz.index];
  if(quiz.kind==="exam"){quiz.answers[quiz.index]=idx;[...document.querySelectorAll(".choice")].forEach((b,i)=>b.classList.toggle("selected",i===idx-1));persistQuiz();return;}
  if(quiz.answered)return;quiz.answered=true;quiz.selected=idx;const correct=idx===q.official_answer_index;quiz.results[quiz.index]=correct;if(correct)quiz.correct++;else{quiz.wrongUids.push(q.uid);scheduleSameSessionRetry(q.uid);}updateLearning(q,correct);paintStudyAnswer(q,idx,correct);renderHomeStatsOnly();persistQuiz();
}
function scheduleSameSessionRetry(uid){
  const target=quiz.index+8;if(quiz.questions.slice(quiz.index+1).some(q=>q.uid===uid))return;const original=Q.find(q=>q.uid===uid);if(!original)return;const insertAt=Math.min(target,quiz.questions.length);quiz.questions.splice(insertAt,0,original);quiz.results.splice(insertAt,0,null);
}
function prevQuestion(){if(!quiz||quiz.index<=0)return;quiz.index--;quiz.answered=quiz.kind==="study"&&quiz.results[quiz.index]!=null;quiz.selected=null;renderQuestion();}
function nextQuestion(){
  if(!quiz)return;
  if(quiz.kind==="study"&&!quiz.answered)return;
  if(quiz.index>=quiz.questions.length-1){if(quiz.kind==="exam")requestSubmitExam();else finishQuiz(false);return;}
  const oldBlock=currentBlock();quiz.index++;if(quiz.mode==="exam3block"&&currentBlock()!==oldBlock)quiz.blockStarted=Date.now();quiz.answered=quiz.kind==="study"&&quiz.results[quiz.index]!=null;quiz.selected=null;renderQuestion();
}
function requestSubmitExam(){
  if(!quiz||quiz.kind!=="exam")return;const unanswered=quiz.questions.length-Object.keys(quiz.answers).length;
  if(unanswered>0&&!confirm(`還有 ${unanswered} 題未作答，確定要交卷嗎？`))return;finishQuiz(false);
}
function finishQuiz(timedOut=false){
  if(!quiz||quiz.finished)return;clearInterval(timerInt);quiz.finished=true;
  if(quiz.kind==="exam"){
    quiz.correct=0;quiz.wrongUids=[];quiz.unansweredCount=0;quiz.questions.forEach((q,i)=>{const picked=quiz.answers[i];if(picked==null){quiz.unansweredCount++;return;}const correct=picked===q.official_answer_index;if(correct)quiz.correct++;else quiz.wrongUids.push(q.uid);updateLearning(q,correct);});
  }
  try{localStorage.removeItem(ACTIVE_KEY)}catch(e){}renderResult(timedOut);
}
function renderResult(timedOut=false){
  showScreen("result");const pct=Math.round(quiz.correct/quiz.questions.length*1000)/10;$("#score").textContent=`${pct}`;$("#scoreLabel").textContent=quiz.kind==="exam"?`${pct>=70?"及格 ✓":"未達70分"}${timedOut?" · 時間到":""}`:`答對 ${quiz.correct} / ${quiz.questions.length}`;
  const by={};quiz.questions.forEach((q,i)=>{by[q.subject_code]??={n:0,c:0};by[q.subject_code].n++;const correct=quiz.kind==="exam"?quiz.answers[i]===q.official_answer_index:quiz.results[i]===true;if(correct)by[q.subject_code].c++;});
  $("#subjectBars").innerHTML=Object.entries(by).map(([code,x])=>{const p=Math.round(x.c/x.n*100);return `<div class="subject-row"><span>${SUBJECT_NAMES[code]}</span><div class="bar"><i style="width:${p}%"></i></div><b>${p}%</b></div>`}).join("");
  const parts=[];if(quiz.wrongUids.length)parts.push(`錯答 ${quiz.wrongUids.length} 題已進入弱點／複習系統`);if(quiz.unansweredCount)parts.push(`未作答 ${quiz.unansweredCount} 題計入本次分數，但不寫入錯題紀錄`);$("#wrongSummary").textContent=parts.length?parts.join("；")+"。":"這次沒有錯題。";
}
function leaveQuiz(){if(!quiz){goHome();return}if(confirm("要離開目前進度嗎？系統會保留這場，回首頁可繼續。")){persistQuiz();clearInterval(timerInt);renderHome();}}
function resumeQuiz(){quiz=restoreQuiz();if(!quiz)return renderHome();if(quiz.kind==="exam")startTimer();renderQuestion();}
function goHome(){if(quiz&&!quiz.finished)persistQuiz();clearInterval(timerInt);quiz=null;renderHome();}

function toggleFavorite(){const q=quiz.questions[quiz.index];state.favorites[q.uid]=!state.favorites[q.uid];saveState();$("#favoriteBtn").textContent=state.favorites[q.uid]?"★ 已收藏":"☆ 收藏";}
function showFavorites(){showScreen("list");$("#listTitle").textContent="收藏題";const arr=Q.filter(q=>state.favorites[q.uid]);$("#listBody").innerHTML=arr.length?arr.map(q=>`<div class="list-card"><h3>${SUBJECT_NAMES[q.subject_code]} · ${q.uid}</h3><p>${escapeHtml(q.stem)}</p></div>`).join(""):`<div class="notice">目前還沒有收藏題。</div>`;}
function showWeak(){showScreen("list");$("#listTitle").textContent="錯題／待複習";const arr=Q.filter(q=>getLearning(q.uid).mastery==="答錯待複習").sort((a,b)=>(getLearning(b.uid).wrong||0)-(getLearning(a.uid).wrong||0));$("#listBody").innerHTML=arr.length?arr.map(q=>`<div class="list-card"><h3>${SUBJECT_NAMES[q.subject_code]} · 錯 ${getLearning(q.uid).wrong} 次</h3><p>${escapeHtml(q.stem)}</p></div>`).join(""):`<div class="notice">目前沒有待複習錯題。</div>`;}
function showStats(){showScreen("statsScreen");const data=Object.entries(SUBJECT_NAMES).map(([code,name])=>{const qs=Q.filter(q=>q.subject_code===code),learned=qs.filter(q=>getLearning(q.uid).attempts>0),mastered=qs.filter(q=>getLearning(q.uid).mastery==="已熟悉"),correct=learned.reduce((s,q)=>s+getLearning(q.uid).correct,0),attempts=learned.reduce((s,q)=>s+getLearning(q.uid).attempts,0);return{code,name,total:qs.length,touched:learned.length,mastered:mastered.length,acc:attempts?Math.round(correct/attempts*100):0}});$("#statsBody").innerHTML=data.map(x=>`<div class="list-card"><h3>${x.name}</h3><p>已接觸 ${x.touched}/${x.total} · 已熟悉 ${x.mastered} · 作答正確率 ${x.acc}%</p><div class="bar" style="margin-top:8px"><i style="width:${Math.round(x.touched/x.total*100)}%"></i></div></div>`).join("");}
function showSettings(){showScreen("settingsScreen");}
function exportProgress(){const blob=new Blob([JSON.stringify({schema:2,dataVersion:DATA_VERSION,exportedAt:new Date().toISOString(),state,activeQuiz:serializeQuiz()},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`月月體適能_學習進度_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importProgress(ev){const file=ev.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const x=JSON.parse(reader.result);if(!x.state||x.state.schema!==2)throw new Error();state=x.state;saveState();if(x.activeQuiz)try{localStorage.setItem(ACTIVE_KEY,JSON.stringify(x.activeQuiz))}catch(e){}alert("學習進度已匯入");renderHome()}catch(e){alert("這個檔案不是相容的月月體適能進度備份")}};reader.readAsText(file);}
function resetProgress(){if(confirm("確定要清除這台裝置的學習紀錄嗎？題庫本身不會刪除。")){state=clone(defaultState);saveState();try{localStorage.removeItem(ACTIVE_KEY)}catch(e){}renderHome();}}

function updateNetworkStatus(){const el=$("#deviceStatus");if(!el)return;const on=navigator.onLine;el.textContent=on?"● 已連線 · 離線快取啟用":"● 離線模式";el.className=`device-status ${on?"online":"offline"}`;}
function showScreen(id){document.querySelectorAll(".screen").forEach(x=>x.classList.add("hidden"));const el=$("#"+id);if(el)el.classList.remove("hidden");const nav=document.querySelector(".bottom-nav");if(nav)nav.classList.toggle("hidden",id==="quiz");}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function $(sel){return document.querySelector(sel)}

window.addEventListener("online",updateNetworkStatus);window.addEventListener("offline",updateNetworkStatus);
window.addEventListener("beforeunload",()=>{if(quiz&&!quiz.finished)persistQuiz()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&quiz&&!quiz.finished)persistQuiz()});

async function bootYueFitApp(){
  if(Q.length!==785){document.body.innerHTML='<div style="padding:30px;font-family:sans-serif">題庫載入失敗，請重新整理或清除舊快取。</div>';return;}
  if("serviceWorker" in navigator){try{await navigator.serviceWorker.register("./sw.js")}catch(e){console.warn("SW register failed",e)}}
  try{if(navigator.storage&&navigator.storage.persist)await navigator.storage.persist()}catch(e){}
  renderHome();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bootYueFitApp,{once:true}); else bootYueFitApp();
