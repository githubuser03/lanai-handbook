# M2 使用者介面與反向代理

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (指令未實機驗證)
- 資料基準日: 2026-10-26
- 待查證: 反向代理一節僅有大綱
:::

**結論**: 介面讓使用者能在瀏覽器裡和模型對話, 反向代理讓連線加密, 並在介面前面多一道驗證與流量控制. 單人單機只需要介面, 而且只綁 127.0.0.1; 要讓內網其他人連入時, 才在前面加反向代理.

**這一塊在圖上的位置**: VM 入口區的 Open WebUI 與 Nginx 或 Caddy. **前置模組**: M1. **完成後的狀態**: 里程碑 1 完成, 可以在瀏覽器裡和本機模型對話.

## M2.1 選擇介面

等級 A 與 C 建議用 AnythingLLM 桌面版, 其他等級用 Open WebUI 單一容器. 不加閘道, 代理框架與 MCP.

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

用容器跑介面時, 有兩件事容易做錯 (指令未實機驗證, 依下列官方文件整理):

1. **發布連接埠時要指定 127.0.0.1.** Docker 官方文件指出, `-p 8080:80` 會綁定在主機的任一位址, 要限制只有主機本身能存取, 須寫成 `-p 127.0.0.1:8080:80` (來源: Docker 文件 Port publishing and mapping). 此外, Docker 官方文件說明 Docker 與 ufw 的防火牆規則運作方式不相容, 已發布的連接埠可能不受 ufw 規則限制 (來源: Docker 文件 Packet filtering and firewalls). 因此「用 ufw 擋住」不能當作唯一防線, 發布時就要綁定 127.0.0.1.
2. **容器內的 127.0.0.1 指的是容器自己.** 要從容器連到主機上的 Ollama, Open WebUI 官方文件建議使用 `host.docker.internal`, 並在 Linux 加上 `--add-host=host.docker.internal:host-gateway` (來源: Open WebUI 文件 Quick Start).

範例 (以 Open WebUI 官方 Quick Start 的指令為基礎, 僅把發布位址改為 127.0.0.1, 並固定版本標籤):

```bash
docker run -d -p 127.0.0.1:3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  -e WEBUI_SECRET_KEY="$(openssl rand -hex 32)" \
  --name open-webui --restart always \
  ghcr.io/open-webui/open-webui:<固定版本標籤>
```

`WEBUI_SECRET_KEY` 請存入 `.env` 並沿用, 否則重建容器後所有人須重新登入 (來源: Open WebUI Quick Start). 官方範例使用浮動的 `:main` 標籤, 本手冊建議改用固定版本 (見 O2).

**尚待實機驗證的取捨 (推論, 信心: 中高)**: Ollama 預設只綁 127.0.0.1:11434 (來源: Ollama FAQ). 在 Linux 上, 容器經 `host-gateway` 連主機時, 流量不是從主機的 127.0.0.1 進入, 因此預設設定下可能連不到. 常見解法有三種, 各有取捨:

| 做法 | 作法 | 風險 |
|---|---|---|
| 讓 Ollama 也跑在容器, 與介面共用 Docker 網路 | 不發布 Ollama 的連接埠 | 最單純; 需設定 GPU 直通 (依 Ollama 與 Docker 官方文件) |
| 把 `OLLAMA_HOST` 改為 `0.0.0.0:11434` | 以 systemd 設定 (見 M1) | 區域網路內其他裝置也連得到 11434, 須搭配主機防火牆 |
| 介面容器改用主機網路 (`--network=host`) | 不經 Docker NAT | 容器與主機共用網路, 隔離變弱 |

建議優先採用第一種. 若採第二種, 請確認防火牆規則在 Docker 之外也有效, 並以另一台裝置實際掃描 11434 連接埠.

## M2.3 加上反向代理 (內網多人連入時)

待撰寫要點:

- Nginx 與 Caddy 的取捨: Nginx 內建速率限制; Caddy 憑證設定較簡單, 速率限制須另裝外掛
- 內網憑證的取得方式 (公司內部憑證機構或 Caddy 的內部憑證)
- 只接受內網網段, 介面改綁 127.0.0.1 或 Docker 內部網路
- 基本驗證與速率限制的設定範例 (依官方文件驗證後補上)

## M2.4 驗收測試

待撰寫要點:

- 從本機瀏覽器完成一次對話
- 從內網另一台裝置只能經反向代理連入, 直接連介面的連接埠應失敗
- 以另一台裝置掃描主機, 確認沒有多餘的開放連接埠
