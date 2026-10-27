---
description: "十個問題中, 答「是」越多, 維運前提越穩. 建議門檻為整理者推論 (信心: 低), 用意是找出缺口, 不是評分."
---

# 風險自評

::: info 本頁屬性
- 等級: 決策參考
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-27
- 待查證: 十題的選題, 結果門檻與優先順序為整理者設計 (推論); GGUF 官方文件沒有安全性聲明, 第 7 題把 GGUF 與 safetensors 並列屬推論
:::

**結論**: 十個問題中, 答「是」越多, 維運前提越穩. 建議門檻為整理者推論 (信心: 低), 用意是找出缺口, 不是評分.

## 十個問題

十個問題對應維運中最容易省略的環節: 安全公告, 網路暴露, 版本, 備份, 金鑰, 帳號, 模型來源與工具權限. 題目用到的名詞如下.

::: tip 本頁常見名詞
| 詞 | 意思 |
|---|---|
| 連接埠 (port) | 服務在網路上等待連線的編號; 開放給誰連, 決定誰能使用這個服務 |
| 映像 (image) 與容器 (container) | 映像是打包好的軟體與執行環境; 容器是由映像啟動的執行個體 |
| 浮動標籤 | 例如 latest, 發布者更新時會改指向新內容的映像標籤 |
| 資料卷 (volume) | 容器用來長期保存資料的儲存空間, 刪除容器後資料仍在 |
| 金鑰 (key) 與輪替 | 金鑰是服務之間存取用的密碼; 輪替是換上新金鑰, 讓舊金鑰失效 |
| safetensors 與 GGUF | 兩種常見的模型檔格式, 說明見 [M1.5 節](/build/m1-inference) |
| 代理 (agent) | 依模型的判斷自行呼叫工具, 連續執行多個步驟的程式 |
| MCP | Model Context Protocol, 讓模型連接外部工具的協定 |
| 沙箱 (sandbox) | 隔離的執行環境, 裡面的程式出錯或遭濫用時, 影響不會擴散到主機 |
:::

| # | 問題 | 對應章節 |
|---|---|---|
| 1 | 有具名的人, 每週檢查一次安全公告? | [O3](/ops/advisories) |
| 2 | 所有服務只綁本機或私有網路, 包含容器發布的連接埠? | [M2](/build/m2-ui-proxy) |
| 3 | 每個元件的版本已鎖定並有紀錄, 沒有使用 latest 之類的浮動標籤? | [O2](/ops/versioning) |
| 4 | 每週備份資料卷, 且做過一次還原演練? | [O1](/ops/backup) |
| 5 | 所有金鑰的存放位置已列出, 並確認能在短時間內輪替? | [O3.3 節](/ops/advisories) |
| 6 | 每位使用者有個別帳號, 且已關閉公開註冊? | [K6.1 節](/know/k6-security) |
| 7 | 模型檔來自可追溯的官方來源, 並優先使用 safetensors 或 GGUF? | [M1.5 節](/build/m1-inference) |
| 8 | 檢索用的文件來源只限可信資料夾? | [M4](/build/m4-retrieval) |
| 9 | 若有代理, MCP 或程式碼執行: 已放進沙箱, 且寫入與刪除需人工確認? | [K6.3 節](/know/k6-security), [M7](/build/m7-tools-sandbox) |
| 10 | 保留上一版映像與模型, 升級失敗時可回退? | [O2](/ops/versioning) |

## 結果判讀

| 答「是」的數量 | 建議 |
|---|---|
| 8 至 10 | 可進入 PoC 或小範圍試用; 其餘缺口列入待辦 |
| 5 至 7 | 先補齊缺口, 再開放給多人 |
| 4 以下 | 僅限單人本機使用, 不對外開放 |

答「否」的問題, 在對應章節都有可行做法. 優先補第 2, 3, 4 題, 因為這三項成本低, 且涵蓋 2026 年已知的主要事件起點 (見 [O3](/ops/advisories)). 第 2, 3 題的依據見參考來源; 第 4 題 (備份) 與事件起點的關聯屬整理者推論 (信心: 低).

本自評不涉及法規遵循. 該部分請由法務或資安負責人另行檢視.

## 參考來源

十個問題的選題, 結果判讀門檻 (8 至 10, 5 至 7, 4 以下) 與補題順序是整理者設計 (信心: 低, 屬推論), 用意是找出缺口. 第 1, 4, 5, 8, 10 題是維運做法建議, 沒有單一外部來源, 做法與依據見對應章節. 其餘各題可查證的外部事實如下.

- **第 2 題, 連接埠**: Docker 文件說明, 發布容器連接埠後, 服務不只對 Docker 主機開放, 也對外部開放; 在發布旗標加上 127.0.0.1 (例如 `-p 127.0.0.1:8080:80`), 才限制為主機本機存取. 另一份文件說明, 發布連接埠的流量會在進入 ufw 規則之前就轉往其他處理流程, 因此主機上的 ufw 規則未必管得到容器連接埠. [Docker 文件: Port publishing and mapping](https://docs.docker.com/engine/network/port-publishing/), [Docker 文件: Packet filtering and firewalls](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- **第 3 題, 版本鎖定**: Docker 文件指出映像標籤可變, 發布者可把標籤改指向新映像. LiteLLM 官方事故報告 (2026-10-21) 記載 v1.107.0, latest, main-latest, main-stable 在 11:46 至 14:20 (UTC) 曾遭污染, 並建議固定到 litellm==1.106.2 後重建映像; 報告註明 2026-10-23 的更新修正了部分先前假設, 細節以官方最新版為準. [Docker 文件: Building best practices](https://docs.docker.com/build/building/best-practices/), [LiteLLM: Security incident Oct 21 2026](https://docs.litellm.ai/blog/security-incident-oct-21-2026)
- **第 6 題, 帳號與註冊**: Open WebUI 文件列出 `ENABLE_SIGNUP` (預設 True, 說明為切換帳號建立) 與 `DEFAULT_USER_ROLE` (預設 pending). [Open WebUI 文件: Environment Variable Configuration](https://docs.openwebui.com/reference/env-configuration)
- **第 7 題, 模型檔格式**: Hugging Face 文件說明載入 pickle 檔可能執行任意程式碼, 建議不要反序列化不可信來源的資料, 且 Hub 的 Pickle Import 掃描並非萬無一失. Safetensors 文件稱其為以安全方式儲存張量的格式 (相對於 pickle). GGUF 文件只說明它是推論用的二進位格式, 供 llama.cpp, Ollama, LM Studio 等工具使用, 沒有安全性聲明 (2026-10-27 查詢). 題目把 GGUF 與 safetensors 並列, 理由是兩者都不以 pickle 序列化, 載入時不會像 pickle 那樣執行檔案中的程式 (推論, 信心: 中). 但 GGUF 的風險轉移到讀取它的程式: llama.cpp 的安全公告 GHSA-vgg9-87g3-85w8 (CVE-2025-53630) 指出, 經過設計的 GGUF 檔可觸發解析器的整數溢位, 造成記憶體越界讀寫; Cisco Talos 2024 年也通報過同類的 GGUF 解析漏洞 (CVE-2024-21825). 因此 GGUF 檔仍要取自可追溯的來源, 推論引擎也要保持更新. [Hugging Face 文件: Pickle scanning](https://huggingface.co/docs/hub/security-pickle), [Hugging Face 文件: Safetensors](https://huggingface.co/docs/safetensors/index), [Hugging Face 文件: GGUF](https://huggingface.co/docs/hub/gguf), [llama.cpp 安全公告 GHSA-vgg9-87g3-85w8](https://github.com/ggml-org/llama.cpp/security/advisories/GHSA-vgg9-87g3-85w8), [Cisco Talos: TALOS-2024-1912](https://talosintelligence.com/vulnerability_reports/TALOS-2024-1912)
- **第 9 題, 代理的權限與人工確認**: OWASP GenAI LLM01:2025 的緩解方向包含把模型權限限制在最小必要範圍, 以及對特權操作加入人工核准; 同頁指出目前不清楚是否存在萬無一失的提示注入防範方法. [OWASP GenAI: LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
