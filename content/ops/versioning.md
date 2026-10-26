# O2 版本鎖定與升級流程

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (指令未實機驗證)
- 資料基準日: 2026-10-26
- 待查證: 容器映像摘要值的查詢指令 `docker image ls --digests` 已對照 Docker 文件, 但未實機驗證; 各應用程式是否支援資料庫降版, 須逐一查證 (Open WebUI 文件稱回退不會還原資料庫遷移); 升級流程的順序與緊急修補做法為整理者建議, 無來源; 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 鎖定版本不等於不升級. 做法是「固定在已知版本, 有公告或需求時, 先備份, 先在測試環境驗證, 再升級, 並保留回退的路」. 這樣能避開 2026 年已出現的浮動標籤事件, 又不會因久未更新而累積漏洞 (信心: 中, 屬推論).

## O2.1 版本記錄與固定方式

### 為什麼不用浮動標籤

容器映像的標籤 (tag) 是版本的名字, 可以是明確的版本號, 也可以是 `latest` 這類名稱. 後者會跟著發布者更新而改指向新內容, 稱為浮動標籤; 可以想成「最新一期」這個說法, 這個月和下個月指的是不同的雜誌.

LiteLLM 是統一轉送模型呼叫並管理金鑰的閘道 (見 [M5](/build/m5-gateway-identity)). 2026-10-21 的 LiteLLM 事件中, `v1.107.0`, `latest`, `main-latest`, `main-stable` 等標籤都曾指向惡意映像 (來源: LiteLLM 官方事故報告, 見 [M5.3 節](/build/m5-gateway-identity)). 浮動標籤隨時可能指向不同內容, 不能當作版本固定.

### 固定方式

摘要值 (digest) 是依映像內容算出的一串雜湊值, 內容只要有一點改變, 摘要值就不同, 因此能鎖定確切內容.

下表涵蓋本手冊架構中的常駐元件: Open WebUI 是使用者在瀏覽器裡和模型對話的介面, Ollama 是載入模型並提供 API 的推論伺服器, 兩者通常以 Docker 容器或系統服務的形式執行; Python 套件則是 LiteLLM 這類以 Python 撰寫的服務所依賴的程式庫.

| 對象 | 固定方式 |
|---|---|
| 容器映像 | 使用明確的版本標籤; 較嚴格者連同摘要值 (digest) 一起固定 (Open WebUI 文件建議正式環境固定版本標籤, 因 `:main` 可能含未預告的重大變更) |
| Ollama (Linux) | 安裝腳本加上 `OLLAMA_VERSION` 環境變數, 如 `curl -fsSL https://ollama.com/install.sh \| OLLAMA_VERSION=<版本> sh` (來源: Ollama 文件 Linux); 版本號從 GitHub releases 頁取得 (來源: Ollama 文件 Linux) |
| Python 套件 | 在需求檔中寫明確版本, 例如 `litellm==<版本>` |
| 模型檔 | 記錄來源庫與 revision (見 [M1.5 節](/build/m1-inference)) |

Docker 是建立與執行容器的工具. 查詢本機映像的摘要值 (來源: Docker 文件 docker image ls 的 `--digests` 選項, 未實機驗證):

```bash
docker image ls --digests
```

### 版本紀錄表

每個元件一列, 每次變動都更新. 這張表同時是還原與稽核時的依據.

| 元件 | 版本或摘要值 | 安裝或升級日期 | 來源 | 上一版 | 備註 |
|---|---|---|---|---|---|
| | | | | | |

## O2.2 升級流程

建議順序 (信心: 中, 屬推論):

1. **決定要不要升**: 讀發行說明與安全公告 ([O3](/ops/advisories)). 漏洞已有利用紀錄時列為優先; 純功能更新可以排到下個維護時段.
2. **備份**: 依 [O1](/ops/backup)備份資料卷, 並確認備份可用.
3. **在隔離環境先試**: 用另一組容器名稱與連接埠, 載入備份的資料, 先升級試跑.
4. **跑測試集**: 用 [M6](/build/m6-observability)的回歸測試集比較升級前後的結果與耗時.
5. **正式升級**: 以相同的啟動指令與環境變數重建容器; 密鑰類設定要沿用. 例如 Open WebUI 的 `WEBUI_SECRET_KEY` 若改變, 重建後所有人須重新登入 (來源: Open WebUI Quick Start). 另外, Open WebUI 標為 `ConfigVar` 的環境變數只在第一次啟動時生效, 之後使用內部儲存的值, 升級時改這類變數不會生效, 要在管理介面調整 (來源: Open WebUI 文件 Environment Variable Configuration).
6. **更新版本紀錄**: 填寫 O2.1 節的紀錄表.
7. **觀察**: 升級後一週內留意日誌 ([M1.7 節](/build/m1-inference)) 與使用者回報.

**以 Open WebUI 為例** (來源: Open WebUI Quick Start; 該文件的範例使用浮動標籤 `:main`, 本手冊建議改用固定版本):

```bash
docker rm -f open-webui
docker pull ghcr.io/open-webui/open-webui:<新版本標籤>
# 以先前相同的 docker run 指令重新啟動, 並沿用同一個 WEBUI_SECRET_KEY
```

### 緊急修補

漏洞已有利用紀錄時, 時間比完整驗證重要. 縮短流程但不跳過備份: 備份 → 升級 → 跑核心測試題 → 視結果擴大. 若暫時無法修補, 先降低暴露面: 關閉對外連線, 停用受影響功能, 或暫停服務.

## O2.3 回退

回退是升級後發現問題時, 換回上一個可用版本的做法. 回退要事先準備, 事發後才準備會來不及.

| 對象 | 回退做法 |
|---|---|
| 容器映像 | 保留上一版映像與啟動指令, 以上一版標籤重新啟動 |
| 資料卷 | 部分應用程式升級時會轉換資料庫結構, 回退舊版可能無法讀取新結構 (Open WebUI 文件稱回退不會還原資料庫遷移; 一般化為其他應用程式屬推論, 信心: 中), 因此升級前的備份是回退的依據 |
| Ollama | 以 `OLLAMA_VERSION` 重新安裝指定的舊版 (Linux) |
| 模型 | 升級模型時保留舊模型, 確認新模型的測試結果後再移除 |

回退流程: 停止服務 → 以上一版重新啟動 → 若新版已轉換資料結構, 舊版無法讀取, 還原升級前的備份 → 跑核心測試題確認 → 記錄原因.

## O2.4 何時該縮減元件

- 無法每週檢查安全公告時, 移除非必要元件.
- 以[「架構地圖」分層圖](/start/map)檢視哪些層可以拿掉, 優先拿掉 ○ 與 ◇ 層中用量最低的.
- 元件的儲存庫已封存, 或長期沒有更新, 且沒有替代維護者時, 規劃替換 (例: LLM Guard 是檢查模型輸入與輸出的護欄工具, 其儲存庫已於 2026-07-09 封存, 來源: GitHub 儲存庫, 亦見版本頁).

## 參考來源

- [LiteLLM 官方部落格: Security incident Oct 21, 2026](https://docs.litellm.ai/blog/security-incident-oct-21-2026)
- [Ollama 文件: Linux (`OLLAMA_VERSION` 安裝指定版本)](https://docs.ollama.com/linux)
- [Docker 文件: docker image ls (`--digests`)](https://docs.docker.com/reference/cli/docker/image/ls/)
- [Open WebUI 文件: Quick Start (`WEBUI_SECRET_KEY`, `:main` 標籤, 更新步驟)](https://docs.openwebui.com/getting-started/quick-start/)
- [Open WebUI 文件: Updating (固定版本標籤, 回退與資料庫遷移)](https://docs.openwebui.com/getting-started/updating/)
- [Open WebUI 文件: Environment Variable Configuration (`ConfigVar`)](https://docs.openwebui.com/reference/env-configuration)
- [GitHub: protectai/llm-guard (2026-07-09 封存)](https://github.com/protectai/llm-guard)
- 手冊內部連結: [M1.5 節](/build/m1-inference), [M1.7 節](/build/m1-inference), [M5.3 節](/build/m5-gateway-identity), [M6](/build/m6-observability), [O1](/ops/backup), [O3](/ops/advisories), [架構地圖](/start/map)

整理者建議 (推論, 無外部來源): O2.2 的七步升級順序與「先在隔離環境試跑」的做法, 緊急修補的縮短流程, O2.3 的回退流程, 以及 O2.4 的縮減元件原則. 結論段「鎖定版本不等於不升級」已標註為推論 (信心: 中).

文中的類比 (「最新一期」雜誌): 整理者所寫, 無外部來源, 不應當作技術定義引用.
