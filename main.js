/* =========================================================
   GAME CENTER 選單入口
   讀取 games.json → 產生遊戲卡片 → 點擊跳轉到遊戲
   ========================================================= */
(function () {
  "use strict";

  // 遊戲清單的位置（相對於 index.html）
  var GAMES_JSON = "./games.json";
  // 遊戲專案與封面的固定位置
  var GAME_DIR = "./gameList/";
  var COVER_DIR = "./assets/";

  // 遊戲路徑：有填 path 就優先使用，否則自動用 ./gameList/{gameName}/
  function gamePath(game) {
    if (game.path) return game.path;
    return GAME_DIR + encodeURIComponent(game.gameName) + "/";
  }

  // 實際要檢查的入口檔：路徑是資料夾就補上 index.html
  function entryUrl(game) {
    var path = gamePath(game);
    if (/\.html?(\?.*)?$/i.test(path)) return path;
    return path.replace(/\/?$/, "/") + "index.html";
  }

  // 封面：有填 cover 就優先使用，否則自動用 ./assets/{gameName 小寫}.png
  function coverUrl(game) {
    if (game.cover) return game.cover;
    return COVER_DIR + encodeURIComponent(String(game.gameName).toLowerCase()) + ".png";
  }

  // 檢查遊戲專案是否存在
  function projectExists(game) {
    var url = entryUrl(game);
    return fetch(url, { method: "HEAD", cache: "no-store" })
      .then(function (res) {
        // 少數伺服器不支援 HEAD，改用 GET 再確認一次
        if (res.status === 405 || res.status === 501) {
          return fetch(url, { cache: "no-store" }).then(function (r) { return r.ok; });
        }
        return res.ok;
      })
      .catch(function () { return false; });
  }

  var grid = document.getElementById("gameGrid");
  var statusEl = document.getElementById("status");
  var titleEl = document.getElementById("title");
  var subtitleEl = document.getElementById("subtitle");
  var countEl = document.getElementById("count");
  var stick = document.querySelector(".stick");

  var cards = [];
  var selected = 0;

  // ---------- 狀態訊息 ----------
  function showStatus(title, html) {
    statusEl.hidden = false;
    statusEl.innerHTML = '<span class="status-title"></span>' + (html || "");
    statusEl.querySelector(".status-title").textContent = title;
  }

  function hideStatus() {
    statusEl.hidden = true;
  }

  // ---------- 產生卡片 ----------
  function createCard(game, index) {
    var li = document.createElement("li");
    li.className = "game-card";
    li.setAttribute("role", "option");
    li.setAttribute("tabindex", "-1");
    li.style.setProperty("--i", index);
    li.dataset.index = index;

    // 封面：只放圖片，不疊任何標籤
    var screen = document.createElement("div");
    screen.className = "card-screen";

    // 標籤列（在封面下方）
    var meta = document.createElement("div");
    meta.className = "card-meta";

    if (game.tag) {
      var tag = document.createElement("span");
      tag.className = "card-tag";
      tag.textContent = game.tag;
      meta.appendChild(tag);
    }

    if (game.orientation === "portrait" || game.orientation === "landscape") {
      var orient = document.createElement("span");
      orient.className = "card-orient";
      orient.title = game.orientation === "portrait" ? "直版遊戲" : "橫版遊戲";
      orient.innerHTML = '<i class="orient-icon ' + game.orientation + '"></i>';
      orient.appendChild(document.createTextNode(game.orientation === "portrait" ? "直" : "橫"));
      meta.appendChild(orient);
    }

    // 封面：找得到就顯示，找不到就留空白框（不自動補圖）
    var img = document.createElement("img");
    img.src = coverUrl(game);
    img.alt = game.name || game.gameName;
    img.loading = "lazy";
    img.onerror = function () {
      img.remove();
      screen.appendChild(noImage());
    };
    screen.appendChild(img);

    var name = document.createElement("h2");
    name.className = "card-name";
    name.textContent = game.name || game.gameName;

    var play = document.createElement("span");
    play.className = "card-play";
    play.textContent = "PLAY";

    li.appendChild(screen);
    li.appendChild(meta);
    li.appendChild(name);
    li.appendChild(play);

    // 只有真的滑鼠移入才選取；手指點擊時不觸發，
    // 否則 iOS Safari 會把第一下點擊當成「移入」而不跳轉
    li.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "mouse") select(index, false);
    });
    li.addEventListener("click", function () { launch(index); });

    return li;
  }

  function noImage() {
    var box = document.createElement("div");
    box.className = "no-image";
    box.textContent = "NO IMAGE";
    return box;
  }

  // ---------- 選取與跳轉 ----------
  function select(index, scroll) {
    if (!cards.length) return;
    selected = (index + cards.length) % cards.length;
    cards.forEach(function (c, i) {
      var on = i === selected;
      c.el.classList.toggle("is-selected", on);
      c.el.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (scroll !== false) {
      cards[selected].el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function launch(index) {
    var game = cards[index] && cards[index].game;
    if (!game || !game.gameName) return;
    // 透過 play.html 外框開啟，限制遊戲畫面比例，避免設計區外的內容露出
    window.location.href = "./play.html?game=" + encodeURIComponent(game.gameName);
  }

  // 名稱放不下時縮小字級，確保完整顯示（12 個半形字在手機也放得下）
  function fitNames() {
    cards.forEach(function (c) {
      var el = c.el.querySelector(".card-name");
      el.style.fontSize = "";
      var avail = el.clientWidth;
      var need = el.scrollWidth;
      if (avail > 0 && need > avail) {
        var size = parseFloat(getComputedStyle(el).fontSize) * (avail / need);
        el.style.fontSize = Math.floor(size * 10) / 10 + "px";
      }
    });
  }

  var fitTimer;
  window.addEventListener("resize", function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitNames, 100);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitNames);
  }

  // 依目前畫面實際排版算出一列有幾張卡片（直/橫版欄數不同）
  function columns() {
    if (cards.length < 2) return 1;
    var top = cards[0].el.offsetTop;
    var n = 0;
    for (var i = 0; i < cards.length && cards[i].el.offsetTop === top; i++) n++;
    return Math.max(n, 1);
  }

  function nudgeStick(dx, dy) {
    if (!stick) return;
    stick.style.transform = "translate(calc(-50% + " + dx * 6 + "px), calc(-70% + " + dy * 6 + "px))";
    clearTimeout(nudgeStick.t);
    nudgeStick.t = setTimeout(function () { stick.style.transform = ""; }, 140);
  }

  document.addEventListener("keydown", function (e) {
    if (!cards.length) return;
    var cols = columns();
    switch (e.key) {
      case "ArrowRight": select(selected + 1); nudgeStick(1, 0); break;
      case "ArrowLeft":  select(selected - 1); nudgeStick(-1, 0); break;
      case "ArrowDown":  select(Math.min(selected + cols, cards.length - 1)); nudgeStick(0, 1); break;
      case "ArrowUp":    select(Math.max(selected - cols, 0)); nudgeStick(0, -1); break;
      case "Enter":
      case " ":
        launch(selected); break;
      default: return;
    }
    e.preventDefault();
  });

  // ---------- 讀取 games.json ----------
  // 先檢查每款遊戲的專案是否存在，只顯示存在的（封面有沒有不影響）
  function load(data) {
    if (data.title) {
      titleEl.textContent = data.title;
      document.title = data.title;
    }
    if (data.subtitle) subtitleEl.textContent = data.subtitle;

    var listed = (Array.isArray(data.games) ? data.games : []).filter(function (g) {
      return g && g.enabled !== false && g.gameName;
    });

    return Promise.all(listed.map(projectExists)).then(function (exists) {
      var games = listed.filter(function (g, i) {
        if (!exists[i]) {
          console.warn("[GameEntry] 找不到遊戲專案，已隱藏：" + entryUrl(g));
        }
        return exists[i];
      });
      render(games);
    });
  }

  function render(games) {
    grid.innerHTML = "";
    cards = games.map(function (game, i) {
      var el = createCard(game, i);
      grid.appendChild(el);
      return { game: game, el: el };
    });

    countEl.textContent = String(games.length).padStart(2, "0");

    if (!games.length) {
      showStatus("NO GAMES", "沒有可顯示的遊戲。請確認 games.json 的 gameName 與 gameList/ 底下的資料夾名稱一致（或 path 設定正確），且資料夾內有 index.html。");
      return;
    }
    hideStatus();
    fitNames();
    select(0, false);
  }

  showStatus("LOADING...");

  fetch(GAMES_JSON, { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(load)
    .catch(function (err) {
      var hint = location.protocol === "file:"
        ? "目前是直接開啟檔案（file://），瀏覽器不允許讀取 games.json。<br>請在此資料夾執行 <code>python3 -m http.server</code>，再開啟 <code>http://localhost:8000</code>。"
        : "請確認 <code>games.json</code> 與 index.html 在同一個資料夾，且 JSON 格式正確。";
      showStatus("LOAD ERROR", hint + "<br><br>錯誤：<code></code>");
      statusEl.querySelector("code:last-of-type").textContent = err.message;
    });
})();
