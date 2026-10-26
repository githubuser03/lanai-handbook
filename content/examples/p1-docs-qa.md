# P1 問自己的文件

::: info 本章屬性
- 等級: ○ 依情境
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: 設定步驟與指令依 Open WebUI 官方文件整理, 未實機驗證; Open WebUI 的選單名稱會隨版本調整, 操作前請以所用版本的文件核對; 繁體中文的切塊大小與 Top K 建議值尚無公開實測
:::

**結論**: 個人只要組到里程碑 1 (M0 至 M2), 再加上 M4 的檢索功能, 就能把筆記, 手冊與論文放進 Open WebUI 的知識庫, 用自然語言提問並取得附出處的回答. 不需要閘道, 身分驗證或代理. 上線前用 M4.3 節的 50 題自測法確認檢索命中率, 之後每次換模型或調整設定都重跑一次.

**對象**: 個人. **需要的模組**: M1, M2, M4.

## 情境

讀者手上累積了數百份文件: 工作手冊, 會議簡報, 研究論文, 個人筆記. 原本找資料的方式是在資料夾裡用檔名搜尋, 或打開檔案逐一按 Ctrl+F. 這種做法有兩個限制: 關鍵字必須和原文一模一樣才找得到, 而且答案常分散在好幾份文件裡. 把文件上傳到雲端 AI 服務可以解決搜尋問題, 但私人筆記或工作文件不一定適合離開自己的電腦.

本範例的做法可以想成「替自己的書架請一位圖書館員」: 先把文件交給系統整理成可搜尋的段落, 之後用一般說話的方式提問, 系統找出最相關的幾段原文, 再請模型根據這幾段原文回答, 並列出答案出自哪份文件. 文件, 索引與模型都留在本機.

## 需要的模組

| 模組 | 里程碑 | 在本範例的用途 |
|---|---|---|
| [M0 基礎環境](/build/m0-foundation) | 里程碑 1 | 一台 Linux 或 Mac 加 Docker 即可; 設定資料卷的備份 |
| [M1 推論伺服器](/build/m1-inference) | 里程碑 1 | 以 Ollama 執行對話模型與嵌入模型 |
| [M2 使用者介面與反向代理](/build/m2-ui-proxy) | 里程碑 1 | Open WebUI 只綁 127.0.0.1, 單人使用不需要反向代理 |
| [M4 檢索 (RAG)](/build/m4-retrieval) | 里程碑 2 的模組 | 知識庫, Docling 文件解析, 嵌入模型; 個人使用可以只加 M4, 不必組 M3, M5, M6 |
| [M6 可觀測, 稽核與評估](/build/m6-observability) (只用 M6.1 節) | 里程碑 2 的模組 | 保存 50 題測試集, 不需要追蹤平台 |

硬體等級 A 與 C (16GB) 的讀者, [組裝總覽](/build/overview)建議改用 AnythingLLM 桌面版; 本頁以 Open WebUI 說明, 概念相同.

## 流程

```
匯入文件 (一次性, 之後有新文件再補)

[讀者電腦上的文件資料夾: PDF, Word, Markdown]
      | 在瀏覽器上傳 (Workspace > Knowledge > Add Content)
      v
[Open WebUI] --HTTP (Docker 內部網路)--> [docling-serve]
      |          <-- 解析後的文字與表格
      | 切成段落 (chunk)
      v
[Ollama 嵌入模型] --> 每段轉成向量 --> [Open WebUI 內建向量庫]

提問 (每次)

[讀者的瀏覽器] --http://127.0.0.1:3000--> [Open WebUI]
      | 1. 問題轉成向量, 在知識庫找出最相關的 K 段
      | 2. 問題 + K 段原文 + 提示範本, 送給對話模型
      v
[Ollama 對話模型]
      | 回答 + 出處 (文件名稱與段落)
      v
[讀者] --> 點開出處, 和原文核對
```

資料只在本機的三個地方流動: 文件資料夾, Open WebUI 的資料卷 (含向量庫), 以及 Ollama. 沒有任何連接埠對外開放.

## 設定要點

以下依 Open WebUI 與 Ollama 官方文件整理, 未實機驗證.

**1. 啟動 Docling 解析服務.** Open WebUI 官方文件提供的 CPU 版映像為 `quay.io/docling-project/docling-serve`, 服務埠為 5001; NVIDIA 顯示卡另有 `docling-serve-cu128` 映像. 依 M2.2 節的建議, 讓 Docling 與 Open WebUI 共用同一個 Docker 網路, 不發布 Docling 的連接埠:

```bash
docker network create localai
docker run -d --name docling --network localai \
  quay.io/docling-project/docling-serve:<固定版本標籤>
```

Open WebUI 的容器同樣加上 `--network localai` (其餘參數見 M2.2 節). 官方文件提醒, 除非另外設定 Redis 這類共享狀態機制, 否則 docling-serve 維持 `UVICORN_WORKERS=1`.

**2. 在 Open WebUI 指定文件解析引擎.** 到 **Settings > Admin > Documents**, 把內容解析引擎 (Content Extraction Engine) 設為 **Docling**, Docling Server URL 填 `http://docling:5001` (這也是官方預設值). 上傳第一份文件後, 先預覽解析出的文字; 官方疑難排解頁指出, 模型「看不到」文件內容通常是解析問題, 而不是模型問題.

**3. 設定嵌入模型.** 同一頁的嵌入設定選 Ollama, 模型例如 `qwen3-embedding:0.6b` 或 `bge-m3` (Ollama 模型庫的標籤). 兩者的取捨見 M4.2 節. 官方文件說明, 更換嵌入模型後必須重建所有知識庫的索引, 不同模型產生的向量不能混用.

**4. 調整切塊與檢索數量.** 官方疑難排解頁對「本機模型, 上下文 8K 以內」的建議是 Chunk Size 1000, Chunk Overlap 100, Top K 3 至 5. 同一頁也指出, Ollama 在顯示記憶體小於 24GiB 時預設上下文只有 4096 token, 建議到 **Settings > Admin > Models** 的 Advanced Params 把對話模型的上下文長度調到至少 8192. 這些值以英文文件為基礎, 繁體中文的最佳值請用 M4.3 節的測試比較 (推論, 信心: 中).

**5. 建立知識庫.** 到 **Workspace > Knowledge** 建立知識庫, 用 **Add Content** 上傳檔案或整個資料夾. 官方文件另有 **Sync directory** 功能, 可以增量同步本機資料夾. 建議依主題分成幾個知識庫 (例如「工作手冊」「研究論文」), 方便提問時指定範圍.

**6. 提問時指定知識庫.** 在對話框輸入 `#` 選擇知識庫; 或到 **Workspace > Models > Edit** 建立一個專用模型 (例如「我的文件助理」) 並附加知識庫. 官方文件說明, 模型若沒有限定知識庫, 會搜尋該使用者可存取的所有知識.

**7. 提示範本.** 在 **Settings > Admin > Documents** 可以改寫 RAG 範本. 官方文件規定以 `{{CONTEXT}}` 標示檢索內容的位置, 不要加 `{{QUERY}}`, 因為使用者的問題會自動附在後面, 加了會重複出現. 範例:

```
請只根據下列參考資料回答問題, 使用繁體中文.
規則:
1. 每個重點後面標出出處 (文件名稱).
2. 參考資料沒有提到的內容, 回答「文件中沒有相關內容」, 不要自行補充.
3. 不同文件說法不一致時, 分別列出並註明出處.

參考資料:
{{CONTEXT}}
```

**8. 環境變數只在第一次啟動時生效.** Open WebUI 文件中標為 `ConfigVar` 的環境變數, 第一次啟動後會存入內部設定; 之後再改環境變數不會生效, 須改在管理介面調整.

## 驗收方式

依 M4.3 節的 50 題自測法, 加上回答層級的檢查:

1. **檢索命中率**: 從自己的文件挑 50 個實際會問的問題, 每題記下正確答案所在的文件與段落. 逐題提問, 檢查回答附的出處是否包含正確段落 (前 K 段內出現即算命中). 若要比較兩個嵌入模型, 依 M4.3 節分別建立知識庫, 命中率差距小於 5 個百分點時選記憶體較小者.
2. **找不到的問題**: 另加 5 題文件中確定沒有答案的問題, 回答應該是「文件中沒有相關內容」, 而不是編出一個答案.
3. **出處核對**: 從 50 題中抽 10 題, 點開出處和原文逐句核對, 確認回答沒有扭曲原意.
4. **解析檢查**: 挑 3 份有代表性的文件 (含表格的 PDF, 掃描檔, 長篇 Word), 預覽解析結果, 確認沒有整段遺漏.
5. **保存基準**: 把 50 題與當次命中率存進 M6.1 節的測試集. 通過門檻由讀者自訂; 本手冊建議至少不低於第一次測得的基準值, 之後每次換模型, 換嵌入模型或調整切塊都重跑 (推論).

## 風險與限制

| 風險 | 影響 | 因應方式 |
|---|---|---|
| 文件內容變成兩份 | 原始檔之外, Open WebUI 的資料卷也保存了解析後的文字與向量, 備份檔同樣含有文件內容 | 資料卷納入 M0 的備份, 備份檔加密保存; 刪除原始檔時一併從知識庫移除 |
| 模型回答錯誤或扭曲原意 | 讀者若直接引用, 可能把錯誤帶進工作文件 | 提示範本要求標出處; 重要結論一律點開出處核對原文 |
| 檢索沒找到正確段落 | 模型只能根據錯誤段落回答, 看起來仍然很流暢 | 用 50 題自測找出弱點; 調整切塊, Top K 或改用其他嵌入模型 |
| 文件中夾帶指令 (間接提示注入) | 從網路下載的文件可能藏有誘導模型的文字 (OWASP LLM08, 見 K6.4 節) | 只匯入可信來源的文件; 本範例不給模型任何工具, 影響限於回答內容 |
| 上下文不足 | Ollama 預設上下文較短時, 超出長度的檢索段落會遺失 | 依設定要點第 4 點調高上下文長度, 並以測試題確認 |
| 介面帳號 | 其他人若能登入介面, 就能查詢所有知識庫 | 依 M2 只綁 127.0.0.1, 設管理者密碼並關閉公開註冊 |

需要人工確認的步驟只有一個: 讀者把回答用在重要決定或對外文件之前, 先核對出處原文.

## 參考來源

- [Open WebUI 文件: Knowledge](https://docs.openwebui.com/features/workspace/knowledge)
- [Open WebUI 文件: Docling Document Extraction](https://docs.openwebui.com/features/chat-conversations/rag/document-extraction/docling)
- [Open WebUI 文件: Retrieval Augmented Generation (RAG)](https://docs.openwebui.com/features/chat-conversations/rag)
- [Open WebUI 文件: RAG 疑難排解](https://docs.openwebui.com/troubleshooting/rag)
- [Open WebUI 文件: Environment Variable Configuration](https://docs.openwebui.com/reference/env-configuration)
- [Ollama 模型庫: qwen3-embedding](https://ollama.com/library/qwen3-embedding)
- [Ollama 模型庫: bge-m3](https://ollama.com/library/bge-m3)
- 站內: [M4 檢索 (RAG)](/build/m4-retrieval), [M2 使用者介面與反向代理](/build/m2-ui-proxy), [K6 安全基礎與風險控管](/know/k6-security)
