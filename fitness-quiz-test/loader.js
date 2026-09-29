(async()=>{
  try{
    if(typeof DecompressionStream!=="function") throw new Error("這個瀏覽器不支援題庫解壓縮，請更新 Safari / Chrome。");
    const chunks=window.YUE_QB64||[];
    if(chunks.length!==6) throw new Error(`題庫資料不完整（${chunks.length}/6），請重新整理。`);
    const b64=chunks.join("");
    const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    const text=await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    window.YUE_QUESTIONS=JSON.parse(text);
    if(window.YUE_QUESTIONS.length!==785) throw new Error("題庫題數驗證失敗");
    const byUid=new Map(window.YUE_QUESTIONS.map(q=>[q.uid,q]));
    for(const q of window.YUE_OFFICIAL_SUPPLEMENT||[]){
      if(byUid.has(q.uid)){Object.assign(byUid.get(q.uid),{official_mock_seen:q.official_mock_seen});if(q.screenshot_choices){byUid.get(q.uid).choices=q.screenshot_choices.slice();byUid.get(q.uid).screenshot_correction=q.screenshot_correction;}}
      else {window.YUE_QUESTIONS.push(q);byUid.set(q.uid,q);}
    }
    if(window.YUE_QUESTIONS.length!==843||byUid.size!==843)throw new Error("補練題庫驗證失敗");
    window.YUE_QB64=[];
    const s=document.createElement("script");s.src="app.js?v=20260929-v17";s.defer=false;document.body.appendChild(s);
  }catch(e){console.error(e);document.body.innerHTML=`<div style="padding:28px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6"><h2>題庫載入失敗</h2><p>${String(e.message||e)}</p><p>請先連網重新整理；若仍失敗，請更新 Safari / Chrome。</p></div>`;}
})();

