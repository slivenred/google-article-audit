# Google 文章發布前審查工具包

同一份審查知識，提供 **Agent Skill、MCP、CLI** 三種使用方式。

**建議先用 Skill。** 如果你主要在本地 Codex、Claude Code 或 Cursor 審稿，把 Skill 放進工具的技能目錄即可。需要跨工具呼叫、取得規則或驗證 JSON 報告時，再加 MCP。Repo 是保存版本、更新和分享整套工具的地方。

這不是 Google 官方產品，也不提供 Google 分數、排名保證或自動事實查核。AI 工具負責閱讀文章、調查證據及寫出審查結果；本套件提供可追溯的審查方法和資料。

[English](README.en.md) · [架構與安全](docs/architecture.md) · [實際測試範圍](docs/verification.md)

## 包含什麼

- 117 筆官方來源紀錄：110 筆目前建議來源、7 筆歷史參考
- 44 個穩定的內部檢查 ID，並非 Google 官方規則編號
- 32 個依文章條件選用的模組；一般文章不需要逐一套用全部模組
- 原始 Skill、參考文件及 Python 選取工具，完整保留原有內容與證據狀態
- 6 個唯讀 MCP tools、7 個 resources、1 個 audit_article prompt
- 可選的 JSON 報告格式與結構驗證工具

來源快照截至 **2026-10-08**。打包沒有重新查核全部 117 個網址；執行審稿時仍須針對相關的現行規範與重要事實取得新證據。無法查到時，結果應保留 UNKNOWN。

## 取得工具包

下載本 repo 的 ZIP 並解壓，或在終端機執行：

```sh
git clone https://github.com/slivenred/google-article-audit.git
cd google-article-audit
```

以下步驟都在 repo 根目錄執行。GitHub repo 提供版本管理；使用 Skill 不必執行 MCP。

## 1. 最簡單：在本地 Codex 使用 Skill

將下載或 clone 的資料夾保留在固定位置，開啟終端機並進入本 repo。macOS / Linux 可用：

```sh
DEST="$HOME/.agents/skills/google-article-audit"
if [ -e "$DEST" ]; then
  printf '%s\n' '目的地已有同名 Skill。請先比較版本，不要直接覆蓋。'
else
  mkdir -p "$HOME/.agents/skills"
  cp -R skills/google-article-audit "$DEST"
fi
```

這些是由你自行執行的安裝步驟，套件不會自動改動你的設定。亦可只安裝在指定專案的 `.agents/skills/google-article-audit/`。

開啟新對話，確認技能清單可見，再輸入：

```text
請用 $google-article-audit 審查這篇文章。先只給我問題、證據、優先順序和最小修改建議，保留不知道的地方。

[貼上文章及已知的標題、摘要、作者與圖片資訊]
```

要實際改稿時：

```text
請用 $google-article-audit 審查並優化這篇文章，保留原意、語氣和段落結構。交付修改稿，再重新檢查修改後的版本。
```

Skill 本身不需要 npm、MCP server 或 API key。Python 3 只用於可選的規則選取 helper；AI 能直接讀取參考檔案時也能工作。Skill 不會替 AI 工具安裝瀏覽器或搜尋能力。

### 其他工具的 Skill 位置

- Codex / Cursor：使用者範圍 `~/.agents/skills/google-article-audit/`，或專案 `.agents/skills/google-article-audit/`
- Claude Code：使用者範圍 `~/.claude/skills/google-article-audit/`，或專案 `.claude/skills/google-article-audit/`
- Cursor 也接受 `.cursor/skills/`；不需同時安裝兩份
- Windows：把相同資料夾複製到使用者家目錄的對應位置，保留所有 references、scripts、assets、agents 檔案

同一個工具保留一份啟用的同名 Skill。若你已有安裝版，先確認要使用哪一版；不要盲目覆蓋。工具未顯示時，重新整理技能清單或開啟新對話確認。本地安裝不會自動出現在遠端或網頁版 AI 工具。

## 2. 需要 callable tools：加本地 MCP

需求：Node.js 20 以上、npm；已測試 Node 24.19.0。建議使用目前仍受支援的 Node 版本。

在 repo 根目錄安裝鎖定的依賴：

```sh
npm ci --ignore-scripts
npm run check
npm run smoke
```

`npm run smoke` 會暫時啟動 server，測試 MCP 後關閉。它不修改 AI 工具設定，不開 HTTP port。`npm test` 是額外的單元測試，其中一項需要 Python 3 來比較原始選取工具。

### Codex

在 repo 根目錄執行：

```sh
codex mcp add google-article-audit -- "$(node -p 'process.execPath')" "$PWD/src/server.js"
codex mcp list
```

上面的 add 指令會把 server 加入你的本地 Codex 設定。也可參考 [Codex 設定範例](examples/clients/codex.toml)，合併到既有設定，勿覆蓋整份檔案。

### Claude Code

```sh
claude mcp add --transport stdio --scope user google-article-audit -- "$(node -p 'process.execPath')" "$PWD/src/server.js"
claude mcp list
```

### Cursor / 其他支援 stdio 的工具

參考 [Cursor 設定範例](examples/clients/cursor.mcp.json)，合併到 `~/.cursor/mcp.json` 或專案 `.cursor/mcp.json`。其他 MCP 工具可參考 [通用範例](examples/clients/generic.mcp.json)，但設定檔的外層格式由各工具決定。

所有範例中的路徑都必須換成你電腦上的**絕對路徑**。Node 路徑可用 `node -p 'process.execPath'` 查詢。Windows JSON 中使用雙反斜線或正斜線。GUI 工具可能無法讀到終端機的 PATH，因此範例使用 Node 的完整路徑。請保留 repo 在固定位置。

### 接好 MCP 後怎麼叫它

在 AI 工具的新對話輸入：

```text
請使用 google-article-audit MCP 審查以下文章。
先呼叫 prepare_audit，再依文章條件讀取需要的規範與來源。
由你查核文章的重要主張並交付審查結果；不要把取得規範當成完成審稿。
本次只審文稿和我提供的 metadata，尚未檢查網頁的項目請清楚標記。

[貼上文章]
```

支援 MCP prompts 的工具也可選擇 `audit_article`。支援程度依客戶端而異，因此主要流程同時提供普通 tools，不依賴 resources 或 prompts。

只看到 server 出現在清單，還不代表審稿流程已完成。請先用一篇非敏感測試文章，確認 AI 有呼叫工具、讀取適用規範、標示證據缺口並交付結果。沒搜尋能力的 AI 工具仍可審查已提供的內容，但不能把未查到的現行政策或外部事實寫成已驗證。

## 3. CLI：取得規範或驗證報告

```sh
node src/cli.js overview
node src/cli.js select --module core --module reviews
node src/cli.js select --source SRC-003 --full
node src/cli.js guidance findings
node src/cli.js schema
node src/cli.js validate examples/report.synthetic.json
```

`validate` 回傳 `structurally_valid`。它只檢查 JSON 形狀、ID、必要欄位及自行宣告狀態的一致性，**不驗證事實或發布資格**。範例報告是明確標示的合成範例，並非真實案例或測試成效。

若 AI 工具能直接讀本地檔案，也可使用原始無第三方依賴 helper：

```sh
python3 skills/google-article-audit/scripts/select_guidance.py --module core --summary
```

## 邊界、隱私與更新

- MCP 僅讀取內建且允許的資料；不提供任意檔案讀取、URL 抓取、發文、CMS 修改、帳戶連線或 shell 執行 tools
- server 無 API key、遙測、背景服務、網路監聽或自動更新；它由客戶端透過 stdio 啟動及關閉
- 本地 server 不代表整個審稿流程都離線。你使用的 AI 供應商可能處理文章和工具輸出；搜尋或瀏覽也可能連線到外部網站。敏感文章先確認宿主工具的資料政策
- 編輯結論、完整網頁結論、發布授權各自獨立。完成審稿不等於獲准發布
- JSON 格式只是可選介面；不要為了填表硬湊 44 個 PASS
- 更新時編輯唯一的 `skills/google-article-audit/` 資料來源，保留真正來源讀取日期、歷史狀態與版本紀錄。同步更新 `PROVENANCE.json` 的核對值並重跑測試；不要只是把日期改成今天
- 自製程式碼與原創審查流程採 [MIT 授權](LICENSE)，允許使用、修改與商用，須保留著作權及授權聲明。Google 官方文件與第三方內容保留原有權利。`private: true` 只防止誤發 npm，不影響公開 repo 或 MIT 授權。詳見 [NOTICE.md](NOTICE.md)

## 官方設定文件

以下介面文件於 2026-10-08 查閱；客戶端 UI 或路徑未來可能變動。

- [Codex Skills](https://learn.chatgpt.com/docs/build-skills)
- [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [Claude Code Skills](https://code.claude.com/docs/en/skills) / [MCP](https://code.claude.com/docs/en/mcp)
- [Cursor Skills](https://cursor.com/docs/skills) / [MCP](https://cursor.com/docs/mcp)
- [官方 MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) / [stdio server](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio.html)
