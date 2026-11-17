# GAME CENTER 遊戲選單入口

電玩機台風格的遊戲選單，支援直版與橫版畫面，遊戲清單由 `games.json` 控制。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 選單頁 |
| `style.css` | 樣式（機台風格、直/橫版排版） |
| `main.js` | 讀取 `games.json`、產生卡片、操作控制 |
| `play.html` | 遊戲外框頁：用 iframe 載入遊戲，並限制在設計比例內 |
| `games.json` | 遊戲清單 |
| `assets/` | 放封面圖，檔名為 `{gameName 小寫}.png` |
| `gameList/` | 放各遊戲的建置結果，資料夾名稱為 `gameName` |

## 新增遊戲

1. 把遊戲的建置結果放到 `gameList/{gameName}/`（裡面要有 `index.html`）
2. 把封面放到 `assets/{gameName 小寫}.png`（可省略）
3. 在 `games.json` 的 `games` 陣列加一筆：

```json
{
  "gameName": "FortuneGams",
  "id": "gs0002",
  "name": "FortuneGams",
  "tag": "SLOT",
  "orientation": "portrait",
  "design": "720x1280",
  "enabled": true
}
```

| 欄位 | 說明 |
|---|---|
| `gameName` | **必填**。等於 `gameList/` 底下的資料夾名稱（大小寫要一致），也是 `play.html?game=` 的值 |
| `path` | 選填。**有填就優先使用**；沒填時自動為 `./gameList/{gameName}/`。可填資料夾（`./xxx/`）或 html 檔（`./xxx/index.html`） |
| `id` | 遊戲編號，僅供參考，程式不使用 |
| `name` | 卡片上顯示的名稱；沒填就顯示 `gameName` |
| `cover` | 選填。**有填就優先使用**；沒填時自動抓 `./assets/{gameName 小寫}.png` |
| `tag` | 標籤，例如 `SLOT`、`TABLE`，可留空 |
| `orientation` | `portrait`（直）或 `landscape`（橫），顯示在卡片標籤列 |
| `design` | 選填，遊戲的設計解析度，例如 `720x1280`。外框頁會依這個比例限制遊戲畫面；沒填時直式用 720x1280、橫式用 1280x720 |
| `enabled` | `false` 時不顯示，不用刪資料就能下架 |

卡片順序就是陣列順序。

### 專案與封面的綁定規則

卡片要不要顯示，只看遊戲專案在不在：

| 遊戲專案（`path`，沒填則 `gameList/{gameName}/index.html`） | 封面（`cover`，沒填則 `assets/{gameName 小寫}.png`） | 前台 |
|---|---|---|
| 有 | 有 | 顯示卡片與封面 |
| 有 | 沒有 | 顯示卡片，封面位置為 NO IMAGE |
| 沒有 | 有 / 沒有 | 不顯示（Console 會印出提醒） |

**封面圖**：檔名一律用小寫的 gameName，例如 `FortuneGams` → `fortunegams.png`。尺寸請做成 **260×380**（直式），選單上會以 0.7 倍（182×266）顯示；螢幕較窄時會等比例縮小。比例不同的圖片也會完整顯示，只是旁邊會留黑邊。

> Mac 本機不分大小寫，檔名大小寫不一致時本機看起來正常，但 GitHub Pages 會區分大小寫，上線後就會抓不到。

**名稱**：建議最多 12 個半形英文字。放不下時字級會自動縮小，不會被截斷。

## 部署結構（GitHub Pages）

```
gh-pages 分支根目錄
├── index.html
├── style.css
├── main.js
├── games.json
├── assets/
└── gameList/
    ├── 7up7down/      ← build/web-mobile-gm0002-pro 的內容
    └── FortuneGams/   ← build/web-mobile-gs0002-pro 的內容
```

建議在根目錄放一個空的 `.nojekyll` 檔案，避免 GitHub Pages 擋掉部分檔案。

## 本機測試

直接雙擊 `index.html`（`file://`）會讀不到 `games.json`，這是瀏覽器的安全限制。請在此資料夾執行：

```bash
python3 -m http.server 8000
```

再開啟 http://localhost:8000

## 遊戲外框頁 play.html

點擊遊戲後會開啟 `play.html?game=<gameName>`，用 iframe 載入遊戲，並把遊戲區限制在 `design` 的比例內（多出來的空間補黑邊）。

Cocos 的 SHOW_ALL 在視窗比設計比例寬時，會把設計區外的內容也畫出來（例如藏在畫面外的側邊選單）；限制比例後就不會露出。

注意：直接開啟遊戲網址（例如 `./gameList/7up7down/`）不會經過外框，設計區外的內容仍會露出。

## 手機版面

手機直版一個畫面至少顯示 2×2 = 4 款遊戲：隱藏底部控制面板、拿掉 PLAY 按鈕（點整張卡片即可進入），封面依螢幕大小自動縮小。

## 操作

- 滑鼠 / 觸控：點擊卡片進入遊戲（經由 play.html）
- 鍵盤：方向鍵選擇，Enter 或空白鍵進入

## 注意

進入遊戲後是直接跳轉到遊戲頁面，遊戲內沒有返回選單的按鈕，需用瀏覽器的上一頁返回。
