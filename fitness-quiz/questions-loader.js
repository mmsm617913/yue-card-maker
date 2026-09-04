(async()=>{
try{
 if(typeof DecompressionStream!=="function")throw new Error("請更新 Safari / Chrome 後再試");
 const b64=(window.YUE_QB64||[]).join("");
 const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
 const text=await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
 const compact=JSON.parse(text);
 const tierI={S:.90,A:.75,B:.58,C:.40,D:.25};
 window.YUE_QUESTIONS=compact.map(x=>({uid:x.u,subject_code:x.s,stem:x.q,choices:x.c,official_answer_index:x.a,official_answer_text:x.c[x.a-1],core400:!!x.k,priority_tier:x.p,exam_importance:tierI[x.p]||.35,topic:"",repeat_cluster:null}));
 if(window.YUE_QUESTIONS.length!==785)throw new Error("題庫題數驗證失敗");
 const a=document.createElement("script");a.src="app-1.js?v=20260905-04";a.onload=()=>{const b=document.createElement("script");b.src="app-2.js?v=20260905-04";document.body.appendChild(b)};document.body.appendChild(a);
}catch(e){console.error(e);document.body.innerHTML=`<div style="padding:28px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6"><h2>題庫載入失敗</h2><p>${String(e.message||e)}</p><p>請先連網重新整理；若仍失敗，請更新瀏覽器。</p></div>`}
})();
