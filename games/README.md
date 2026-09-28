# 月來月好玩：投影顯示模式

此 repo 的 `main` 是 Next.js 靜態匯出站點，Pages 工作流程直接上傳整個目錄；沒有遊戲的 `app`／`src`、`package.json` 或可重建這份匯出的建置指令。現有六種玩法由 `_next/static/chunks` 的匯出 bundle 執行。

投影模式的可維護來源是 `projection-mode.js` 和 `projection-mode.css`。`index.html` 載入它們；JS 在控制列加入切換鍵、保存顯示偏好，CSS 僅改背景與文字／按鈕色彩。切換不修改遊戲狀態、卡牌圖像或資料。若將來取得原始 Next.js 專案，應把此功能移入遊戲元件與 CSS module，重新匯出並確認 HTML 仍載入對應資產。

本機預覽：在 repo 根目錄執行 `python3 -m http.server 8000`，開啟 `http://localhost:8000/games/` 會因靜態資產使用 `/yue-card-maker/` 前綴而失敗；請將 repo 以 `yue-card-maker/` 子目錄提供，例如在上層目錄執行 `python3 -m http.server 8000`，開啟 `http://localhost:8000/yue-card-maker/games/`。
