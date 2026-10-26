# M2 使用者介面與反向代理

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (指令未實機驗證)
- 資料基準日: 2026-10-27
- 待查證: M2.3 節 Nginx 與 Caddy 設定範例, M2.4 節驗收指令皆未實機驗證; 在 Open WebUI 前疊加基本驗證是否與其 `Authorization` 標頭衝突, 未實機確認; 瀏覽器介面的對話請求是否都經過 `/api/chat/completions`, 未確認; caddy-ratelimit 的維護狀態與設定語法僅依其 README (非 Caddy 官方模組); 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 介面讓使用者能在瀏覽器裡和模型對話, 反向代理讓連線加密, 並在介面前面多一道驗證與流量控制. 單人單機只需要介面, 而且只綁 127.0.0.1; 要讓內網其他人連入時, 才在前面加反向代理.

**這一塊在圖上的位置**: VM 入口區的 Open WebUI (對話介面) 與 Nginx 或 Caddy (反向代理). **前置模組**: M1. **完成後的狀態**: 里程碑 1 完成, 可以在瀏覽器裡和本機模型對話.

M1 的推論伺服器只能用指令操作; 這一章裝上一般人熟悉的聊天畫面. 介面像餐廳的外場與菜單, 讓客人不必走進廚房就能點菜. 反向代理則像門口的接待櫃台: 所有客人都先到櫃台, 櫃台確認對方是內部人員, 才帶到座位, 外人不會直接走進用餐區.

::: tip 本章常見名詞
| 詞 | 意思 |
|---|---|
| 使用者介面 (UI) | 在瀏覽器或桌面 App 裡和模型對話的畫面, 例如 Open WebUI, AnythingLLM |
| 反向代理 (reverse proxy) | 站在服務前面統一接收連線, 再轉給後面服務的程式, 例如 Nginx, Caddy |
| TLS 與 HTTPS | TLS 是加密連線的協定; HTTPS 是以 TLS 加密的 HTTP, 網址開頭是 https 時, 瀏覽器與伺服器之間的傳輸內容就經過加密 (來源: MDN) |
| 憑證與 CA | 憑證證明「這個網站就是它聲稱的那一個」; CA (憑證機構) 是簽發憑證的單位, 瀏覽器要信任 CA 才會接受它簽的憑證 |
| 速率限制 (rate limit) | 限制同一來源在一段時間內的請求次數, 避免單一使用者占滿資源 |
| 基本驗證 (basic auth) | 瀏覽器跳出帳號密碼視窗的簡易登入方式 |
| WebSocket 與串流 | 讓伺服器把回答一段一段即時送回瀏覽器的連線方式, 回答因此能逐字出現 |
:::

## M2.1 選擇介面

介面決定使用者看到的畫面與操作方式. AnythingLLM 桌面版像一般軟體一樣下載安裝即可使用; Open WebUI 以 Docker 容器執行, 透過瀏覽器操作, 之後要多人共用也比較容易. 等級 A 與 C 建議用 AnythingLLM 桌面版, 其他等級用 Open WebUI 單一容器. 不加閘道, 代理框架與 MCP. 下圖是單人使用時的連線關係:

```
[瀏覽器 / 桌面 App]
      | http://127.0.0.1:3000
      v
[Open WebUI 或 AnythingLLM] ----> [Ollama / llama-server]
      |
   (本機資料卷: 對話, 設定) --> 每週備份
   對外: 無開放連接埠
```

## M2.2 用 Docker 執行介面時的連接埠與位址

容器有自己的一套網路. 主機上的服務要讓容器內連得到, 容器內的服務也要選擇是否開放到主機上, 這兩個方向都容易設錯.

用容器跑介面時, 有兩件事容易做錯 (指令未實機驗證, 依下列官方文件整理):

1. **發布連接埠時要指定 127.0.0.1.** Docker 官方文件指出, `-p 8080:80` 會綁定在主機的任一位址, 要限制只有主機本身能存取, 須寫成 `-p 127.0.0.1:8080:80` (來源: Docker 文件 Port publishing and mapping). 此外, Docker 官方文件說明 Docker 與 ufw 的防火牆規則運作方式不相容, 已發布的連接埠可能不受 ufw 規則限制 (來源: Docker 文件 Packet filtering and firewalls). 因此「用 ufw 擋住」不能當作唯一防線, 發布時就要綁定 127.0.0.1.
2. **容器內的 127.0.0.1 指的是容器自己.** 要從容器連到主機上的 Ollama, Open WebUI 官方文件建議使用 `host.docker.internal`, 並在 Linux 加上 `--add-host=host.docker.internal:host-gateway` (來源: Open WebUI 文件 Quick Start).

範例 (以 Open WebUI 官方 Quick Start 的指令為基礎, 僅把發布位址改為 127.0.0.1, 並固定版本標籤). 這段指令啟動 Open WebUI 容器: 只在本機的 3000 連接埠提供服務, 讓容器連得到主機上的 Ollama, 把對話與設定存在名為 `open-webui` 的資料卷, 並產生一把登入用的加密金鑰:

```bash
docker run -d -p 127.0.0.1:3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  -e WEBUI_SECRET_KEY="$(openssl rand -hex 32)" \
  --name open-webui --restart always \
  ghcr.io/open-webui/open-webui:<固定版本標籤>
```

`WEBUI_SECRET_KEY` 請存入 `.env` 並沿用, 否則重建容器後所有人須重新登入 (來源: Open WebUI Quick Start). 官方範例使用浮動的 `:main` 標籤, 本手冊建議改用固定版本 (見 O2).

Open WebUI 文件中標為 `ConfigVar` 的環境變數只在第一次啟動時寫入設定, 之後再改環境變數不會生效, 要到管理介面調整 (來源: Open WebUI 文件 Environment Variable Configuration). 因此第一次啟動前就要決定好這類設定.

**尚待實機驗證的取捨 (推論, 信心: 中高)**: Ollama 預設只綁 127.0.0.1:11434 (來源: Ollama FAQ). 在 Linux 上, 容器經 `host-gateway` 連主機時, 流量不是從主機的 127.0.0.1 進入, 因此預設設定下可能連不到. 常見解法有三種, 各有取捨:

| 做法 | 作法 | 風險 |
|---|---|---|
| 讓 Ollama 也跑在容器, 與介面共用 Docker 網路 | 不發布 Ollama 的連接埠 | 最單純; 需設定 GPU 直通 (依 Ollama 與 Docker 官方文件) |
| 把 `OLLAMA_HOST` 改為 `0.0.0.0:11434` | 以 systemd 設定 (見 M1) | 區域網路內其他裝置也連得到 11434, 須搭配主機防火牆 |
| 介面容器改用主機網路 (`--network=host`) | 不經 Docker NAT | 容器與主機共用網路, 隔離變弱 |

建議優先採用第一種. 若採第二種, 請確認防火牆規則在 Docker 之外也有效, 並以另一台裝置實際掃描 11434 連接埠.

## M2.3 加上反向代理 (內網多人連入時)

只有自己使用時, 介面綁在 127.0.0.1 就夠安全. 要讓辦公室或家裡其他裝置連入時, 連線會經過區域網路, 這時需要加密, 也需要控管誰能連. 內網其他人要連入時, 在介面前面放一台反向代理. 反向代理負責 TLS 加密, 來源網段限制, 基本驗證與速率限制; 介面本身改為只接受反向代理的連線. 本節設定依下列官方文件整理, 未實機驗證.

### Nginx 與 Caddy 的取捨

| 比較事項 | Nginx | Caddy |
|---|---|---|
| 速率限制 | 標準模組 `ngx_http_limit_req_module` 提供 `limit_req_zone` 與 `limit_req`. 超過上限時預設回應 503, 可用 `limit_req_status` 改為 429 (來源: nginx.org) | 標準版不內建. 官方模組頁標示 `http.handlers.rate_limit` 「does not come with Caddy」, 須以 xcaddy 編譯 caddy-ratelimit 模組; 該儲存庫自述不是 Caddy 組織的官方儲存庫 (來源: caddyserver.com 模組頁, GitHub mholt/caddy-ratelimit) |
| 基本驗證 | `auth_basic` 與 `auth_basic_user_file`; 密碼檔以 `htpasswd` 或 `openssl passwd` 產生 (來源: nginx.org) | `basic_auth` (v2.8.0 之前名為 `basicauth`), 預設 bcrypt; 不接受明文密碼, 以 `caddy hash-password` 產生雜湊 (來源: caddyserver.com) |
| 憑證 | 自行準備憑證檔, 以 `ssl_certificate` 與 `ssl_certificate_key` 指定; 中繼憑證要接在伺服器憑證之後 (來源: nginx.org) | `tls internal` 由內建 CA 簽發; 也可用 `tls <憑證檔> <私鑰檔>` 載入公司憑證 (來源: caddyserver.com) |
| WebSocket | 須自行設定 `Upgrade` 與 `Connection` 標頭; 後端 60 秒沒有傳資料就會關閉連線, 以 `proxy_read_timeout` 調整 (來源: nginx.org) | `reverse_proxy` 官方文件說明支援 WebSocket, 會處理 HTTP upgrade 請求; 串流連線預設沒有逾時 (來源: caddyserver.com) |

**判斷 (推論, 信心: 中)**: 需要在反向代理上做速率限制, 又不想自行編譯時, 選 Nginx. 已有公司憑證, 或希望設定最少時, 選 Caddy, 速率限制改由 M5 的閘道負責.

### Open WebUI 對反向代理的要求

Open WebUI 官方文件列出幾個容易漏掉的設定:

- **WebSocket**: Open WebUI v0.5.0 起必須支援 WebSocket. 反向代理要正確設定 `Upgrade` 與 `Connection` 標頭, 並以 HTTP/1.1 連到後端 (來源: Open WebUI 文件 Connection Errors, HTTPS using Nginx).
- **串流緩衝**: Nginx 預設開啟的 `proxy_buffering` 會把 SSE 串流任意切段, 官方建議關閉 (來源: Open WebUI 文件 HTTPS using Nginx).
- **CORS**: `CORS_ALLOW_ORIGIN` 預設為 `*`, 官方標示必須設定, 否則可能出現 WebSocket 問題; 值為對外網址, 多個網址以分號分隔 (來源: Open WebUI 文件 Environment Variable Configuration).
- **對外網址**: 之後要接單一登入 (M5.4 節) 時, `WEBUI_URL` 必須在啟用 OAuth 之前設定 (來源: 同上).

### 內網憑證的兩種來源

HTTPS 需要一張憑證, 讓瀏覽器確認連到的確實是這台伺服器. 公開網站的憑證由公開 CA 簽發; 只在內網使用的伺服器, 通常改用下列兩種來源.

1. **公司內部憑證機構**: 公司已有內部 CA 時, 向它申請伺服器憑證, 憑證的主體別名 (SAN) 要涵蓋使用者輸入的主機名稱. 公司配發的裝置通常已信任公司根憑證, 使用者端不需額外設定 (推論, 信心: 中).
2. **Caddy 內部 CA (`tls internal`)**: Caddy 會用本機的內部 CA 簽發憑證. 根憑證預設效期 3600 天 (10 年), 中繼憑證 7 天, 網站憑證 12 小時, 由 Caddy 自動更新 (來源: Caddy 文件 tls). 根憑證存在 Caddy 資料目錄的 `pki/authorities/local` 之下. Caddy 只會嘗試把根憑證裝進本機的信任清單, 在容器內或以非特權使用者執行時可能失敗; 其他裝置要由系統管理者自行安裝根憑證 (來源: Caddy 文件 Automatic HTTPS). 資料目錄必須持續保存, 不能當成快取 (來源: Caddy 文件 Conventions). 容器重建後若資料目錄遺失, Caddy 會產生新的根憑證, 所有裝置都要重新安裝 (推論).

不建議使用每台伺服器各自的自簽憑證, 再要求使用者略過瀏覽器警告. 這會讓使用者習慣忽略憑證錯誤 (推論, 信心: 中).

### 只接受內網網段, 介面不直接對外

目標是讓使用者只能經由反向代理進入, 而且只有內網的裝置進得來. 建議同時做三層限制:

1. **介面只對反向代理開放.** 反向代理與 Open WebUI 放在同一個 Docker 自訂網路時, Open WebUI 不必發布連接埠: Docker 官方文件說明, bridge 網路上的容器連接埠, 主機與同網路的其他容器都能存取, 但主機外部無法存取 (來源: Docker 文件 Port publishing and mapping). 反向代理裝在主機上時, 則以 `-p 127.0.0.1:3000:8080` 發布 (見 M2.2 節). 同一份文件也提醒, Docker Engine 28.0.0 之前的版本, 同一個 L2 網段的主機可以連到發布在 localhost 的連接埠, 因此 Docker Engine 至少要 28.0.0.
2. **反向代理只接受內網網段.** Nginx 以 `allow` 與 `deny` 限制, 規則由上往下比對, 第一條符合者生效 (來源: nginx.org ngx_http_access_module). Caddy 以 `remote_ip` 比對直接連線端的位址; 前面還有其他代理時, 改用 `client_ip` 並設定 `trusted_proxies`; `private_ranges` 代表所有私有 IPv4 與 IPv6 網段 (來源: Caddy 文件 Request matchers). 建議寫明實際網段, 不要直接放行所有私有網段 (推論).
3. **主機防火牆.** 如 M2.2 節所述, Docker 發布的連接埠可能不受 ufw 規則限制, 因此防火牆只能當作其中一層.

反向代理本身的連接埠也只發布在內網介面的位址上, 例如 `-p 192.168.10.5:443:443`, 不要發布在 `0.0.0.0` (推論, 信心: 中高).

### 基本驗證的適用範圍

Open WebUI 有自己的帳號與登入. 在它前面再疊一層基本驗證時, 瀏覽器與 Open WebUI 前端都會用到 `Authorization` 標頭, 可能互相衝突 (推論, 信心: 中, 須實機驗證). 本手冊建議, 基本驗證只用在沒有自帶登入的服務, 例如讓內部腳本經反向代理呼叫 llama-server 的 API (見 M5.1 節). Open WebUI 本身則依賴介面帳號, 多人時再改用單一登入 (M5.4 節).

### 最小設定範例: Nginx

下列設定檔讓 Nginx 在內網位址的 443 連接埠提供 HTTPS, 只接受 192.168.10.0/24 網段, 把請求轉給 Open WebUI, 並對對話請求加上速率限制. 檔案中的註解說明各段的作用.

依 nginx.org 的 limit_req, auth_basic, access, WebSocket proxying, HTTPS 文件與 Open WebUI 的 Nginx 範例整理, 未實機驗證. 主機名稱, 網段與路徑為佔位值.

```nginx
# /etc/nginx/conf.d/open-webui.conf (未實機驗證)
limit_req_zone $binary_remote_addr zone=owui_chat:10m rate=2r/s;

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 192.168.10.5:443 ssl;
    server_name ai.example.internal;

    # 伺服器憑證在前, 中繼憑證接在後面
    ssl_certificate     /etc/nginx/tls/ai.example.internal.chained.crt;
    ssl_certificate_key /etc/nginx/tls/ai.example.internal.key;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # 只接受內網網段 (依實際網段修改), 第一條符合者生效
    allow 192.168.10.0/24;
    deny  all;

    client_max_body_size 20M;

    # 以下代理設定由各 location 繼承
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 1800;
    proxy_send_timeout 1800;

    # Open WebUI (同一個 Docker 網路, 不發布連接埠)
    location / {
        proxy_pass http://open-webui:8080;
    }

    # 對話請求另加速率限制, 超過時回應 429
    location = /api/chat/completions {
        limit_req zone=owui_chat burst=10 nodelay;
        limit_req_status 429;
        proxy_pass http://open-webui:8080;
    }

    # 選用: 沒有自帶登入的推論 API, 加基本驗證
    location /inference/ {
        auth_basic           "inference";
        auth_basic_user_file /etc/nginx/htpasswd;
        proxy_pass http://llama-server:8080/;
    }
}
```

說明:

- `limit_req` 的速率與 `burst` 是示意值. 官方文件說明, 超過 `burst` 的請求會以 `limit_req_status` 回應 (預設 503). 實際值請依使用人數與 M6 的紀錄調整 (推論).
- `/api/chat/completions` 是 Open WebUI 官方 API 文件列出的對話端點 (來源: Open WebUI 文件 API Endpoints). 瀏覽器介面送出對話時是否都經過這個路徑, 本輪未實機確認.
- `/inference/` 的 `proxy_pass` 結尾有斜線, 轉送時會去掉 `/inference/` 前綴 (Nginx 一般行為, 此為訓練資料內資訊, 可能已過時).
- 密碼檔以 `htpasswd` 或 `openssl passwd` 產生. 官方文件說明不加鹽的 `{SHA}` 格式只為移轉舊系統而保留, 新密碼不要使用 (來源: nginx.org ngx_http_auth_basic_module).

### 最小設定範例: Caddy

Caddy 的設定檔較短, 下列範例做到和上面 Nginx 範例相近的效果 (速率限制除外).

依 caddyserver.com 的 reverse_proxy, tls, basic_auth 與 Request matchers 文件整理, 未實機驗證.

```caddy
# Caddyfile (未實機驗證)
ai.example.internal {
	tls internal
	# 改用公司憑證時:
	# tls /etc/caddy/tls/ai.example.internal.crt /etc/caddy/tls/ai.example.internal.key

	# 只接受內網網段, 其他來源直接中斷連線
	@outside not remote_ip 192.168.10.0/24
	abort @outside

	# reverse_proxy 會處理 WebSocket 的 HTTP upgrade
	reverse_proxy open-webui:8080
}

# 選用: 沒有自帶登入的推論 API, 加基本驗證
inference.example.internal {
	tls internal

	@outside not remote_ip 192.168.10.0/24
	abort @outside

	basic_auth {
		# 以 caddy hash-password 產生的 bcrypt 雜湊
		ops <bcrypt 雜湊值>
	}
	reverse_proxy llama-server:8080
}
```

需要速率限制時, 先以 xcaddy 編譯含 caddy-ratelimit 的 Caddy (`xcaddy build --with github.com/mholt/caddy-ratelimit`), 再加入 `rate_limit` 區塊; 用 Docker 時, 官方建議以 `caddy:<version>-builder` 映像建置, 再複製到 `caddy:<version>` 映像 (來源: Caddy 文件 Build from source, GitHub mholt/caddy-ratelimit). caddy-ratelimit README 的範例如下, 未實機驗證:

```caddy
rate_limit {
	zone per_client {
		key    {remote_host}
		events 10
		window 10s
	}
}
```

這個模組不是 Caddy 官方模組, 採用前須自行評估維護狀態, 並把它納入版本追蹤 (見 O2) (推論, 信心: 中).

## M2.4 驗收測試

驗收分成兩類: 該通的路要通 (內網使用者能順利對話), 不該通的路要擋住 (直接連介面, 外部網段, 超量請求). `curl` 是在終端機送出網頁請求的工具, `openssl s_client` 用來檢查伺服器送出的憑證.

以下步驟以 Nginx 範例的主機名稱與網段為例. `curl`, `nmap` 與 `openssl` 為通用工具, 指令未實機驗證.

**1. 從內網裝置完成一次對話**

1. 在測試裝置安裝根憑證 (公司 CA, 或 Caddy 內部 CA 的根憑證).
2. 以瀏覽器開啟 `https://ai.example.internal`, 登入後送出一則訊息.
3. 確認回應是逐字串流出現, 而不是等很久才整段出現. 整段出現時, 檢查 `proxy_buffering` 是否已關閉.
4. 開啟瀏覽器開發者工具, 確認主控台沒有 WebSocket 連線錯誤. 若 Open WebUI 日誌出現「is not an accepted origin」, 依官方文件調整 `CORS_ALLOW_ORIGIN` (來源: Open WebUI 文件 Environment Variable Configuration).

**2. 直接連介面的連接埠應失敗**

在內網另一台裝置執行:

```bash
# 直接連 Open WebUI 的連接埠, 預期連線遭拒或逾時
curl -sS -m 5 http://192.168.10.5:3000/
# 經反向代理, 預期取得頁面 (200 或轉址)
curl -sS -o /dev/null -w "%{http_code}\n" --cacert root.crt https://ai.example.internal/
```

**3. 不在允許網段的裝置應遭拒絕**

從允許網段以外的裝置連線 (或暫時把測試裝置移出 `allow` 清單). 預期 Nginx 回應 403, Caddy 直接中斷連線.

**4. 速率限制生效 (Nginx)**

```bash
# 連續送出 30 個請求, 統計回應碼; 預期出現 429
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}\n" --cacert root.crt \
    -X POST https://ai.example.internal/api/chat/completions
done | sort | uniq -c
```

未帶權杖的請求會由 Open WebUI 回應 401 等錯誤; 超過速率上限的請求則在反向代理就回應 429, 兩者會混在一起出現 (推論, 信心: 中).

**5. 基本驗證生效 (若有啟用)**

```bash
# 未帶帳密, 預期 401
curl -s -o /dev/null -w "%{http_code}\n" --cacert root.crt https://ai.example.internal/inference/health
# 帶帳密, 預期 200
curl -s -o /dev/null -w "%{http_code}\n" --cacert root.crt -u ops https://ai.example.internal/inference/health
```

llama-server 的 `/health` 端點不檢查 API 金鑰 (來源: llama.cpp server README), 因此適合當作這一步的測試對象.

**6. 確認憑證鏈完整**

```bash
openssl s_client -connect ai.example.internal:443 -servername ai.example.internal -showcerts </dev/null
```

nginx.org 文件指出, 有些瀏覽器會快取中繼憑證, 因此缺少中繼憑證時瀏覽器不一定報錯, 建議以 `openssl s_client` 確認伺服器送出完整憑證鏈 (來源: nginx.org Configuring HTTPS servers).

**7. 掃描主機, 確認沒有多餘的開放連接埠**

在內網另一台裝置執行:

```bash
nmap -p- 192.168.10.5
```

預期只看到 443 (以及管理用的 SSH, 若有開放). 若看到 3000, 11434 或 8080, 回到 M2.2 節與本節檢查連接埠發布位址.

## 參考來源

- [Docker 文件: Port publishing and mapping](https://docs.docker.com/engine/network/port-publishing/)
- [Docker 文件: Packet filtering and firewalls](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Open WebUI 文件: Quick Start](https://docs.openwebui.com/getting-started/quick-start)
- [Open WebUI 文件: HTTPS using Nginx](https://docs.openwebui.com/reference/https/nginx)
- [Open WebUI 文件: Connection Errors](https://docs.openwebui.com/troubleshooting/connection-error)
- [Open WebUI 文件: Environment Variable Configuration](https://docs.openwebui.com/reference/env-configuration)
- [Open WebUI 文件: API Endpoints](https://docs.openwebui.com/reference/api-endpoints)
- [Ollama 文件: FAQ](https://docs.ollama.com/faq)
- [nginx.org: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- [nginx.org: ngx_http_auth_basic_module](https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html)
- [nginx.org: ngx_http_access_module](https://nginx.org/en/docs/http/ngx_http_access_module.html)
- [nginx.org: WebSocket proxying](https://nginx.org/en/docs/http/websocket.html)
- [nginx.org: Configuring HTTPS servers](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Caddy 文件: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Caddy 文件: basic_auth](https://caddyserver.com/docs/caddyfile/directives/basic_auth)
- [Caddy 文件: tls](https://caddyserver.com/docs/caddyfile/directives/tls)
- [Caddy 文件: Request matchers](https://caddyserver.com/docs/caddyfile/matchers)
- [Caddy 文件: Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Caddy 文件: Conventions](https://caddyserver.com/docs/conventions)
- [Caddy 文件: Build from source](https://caddyserver.com/docs/build)
- [Caddy 文件: http.handlers.rate_limit 模組頁](https://caddyserver.com/docs/modules/http.handlers.rate_limit)
- [GitHub: mholt/caddy-ratelimit](https://github.com/mholt/caddy-ratelimit)
- [llama.cpp server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [MDN Web Docs: HTTPS (詞彙表, 以 TLS 加密 HTTP 通訊)](https://developer.mozilla.org/docs/Glossary/https)
- 文中的類比 (餐廳外場與菜單, 接待櫃台): 整理者所寫, 無外部來源, 不應當作技術定義引用.
