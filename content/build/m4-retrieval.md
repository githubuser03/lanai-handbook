# M4 檢索增強生成 (RAG)

::: info 本章屬性
- 等級: ○ 依情境, 有「問自己文件」的需求才讀
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-27
- 待查證: M4.5 節的架設步驟與驗收指令依官方文件整理, 未實機驗證; Qdrant 資料目錄路徑為訓練資料內資訊; 查無公開的繁體中文嵌入與重排序基準 (含 TAIDE 嵌入模型, 2026-10-27 查詢), 各嵌入模型卡也未列出繁體中文評測; 兩款重排序模型的模型卡均未列繁體中文評測; 四份嵌入模型卡各自採用不同的評測組合, 無法直接對照; sqlite-vec 的近似最近鄰索引仍為 alpha 預覽版, 正式版發布時間未定; 向量庫記憶體占用未引用公開實測; Chroma 與 LanceDB 的內嵌模式限制引自二手來源 (Actian 比較文); 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 家庭規模 (數萬至數十萬段落) 下, 向量庫的選擇差異遠小於嵌入模型與文件解析品質的差異, 因此以「備份是否簡單」當作主要選擇依據 (信心: 中). 嵌入模型的排行榜名次不一定適用繁體中文, 請用自己的 50 題問答實測.

**這一塊在圖上的位置**: VM 入口區的 Docling (文件解析工具) 與 Qdrant (向量庫), 嵌入模型跑在推論伺服器. **前置模組**: M1, M2. **完成後的狀態**: 使用者可以在介面中針對自己的文件提問, 回答附上出處.

檢索增強生成 (RAG) 讓模型回答前先查自己的文件, 像開書考試: 模型不必背下所有內容, 而是先翻到相關的那幾頁, 再根據那幾頁作答. 要做到這件事, 需要四個環節: 先把文件轉成文字 (文件解析), 替每一段文字標上意思座標 (嵌入模型), 把座標存起來方便查找 (向量庫), 必要時再從找到的段落中挑出最相關的幾段 (重排序). 「意思座標」的概念見 [K1](/know/k1-basics).

::: tip 本章常見名詞
| 詞 | 意思 |
|---|---|
| RAG (檢索增強生成) | 先從文件找出相關段落, 再交給模型回答 |
| 文件解析 | 把 PDF, Word 等檔案轉成模型能讀的純文字或 Markdown |
| 切塊 (chunking) | 把長文件切成較短的段落, 每段分別建立座標 |
| 嵌入模型 (embedding model) | 把一段文字轉成一串數字 (向量) 的模型, 意思相近的文字, 向量也相近 |
| 向量與維度 | 向量是一串數字; 維度是這串數字的個數, 例如 1,024 維 |
| 向量庫 (vector database) | 存放向量, 並能快速找出最相近向量的資料庫 |
| 重排序 (rerank) | 對初步找到的段落再精細評分, 把最相關的排到前面 |
| 命中率 | 測試題中, 正確段落出現在檢索結果前幾筆的比例 |
:::

## M4.1 文件解析

模型只能讀文字, 所以 PDF, 簡報與試算表要先轉成文字. 這一步的品質影響很大: 表格錯位, 段落順序顛倒或頁首頁尾混入內文, 之後的檢索都會跟著出錯.

| 工具 | 授權 | 特點 |
|---|---|---|
| Docling | MIT (程式碼; 個別模型授權另見各模型) | 可在本機執行, 支援 macOS, Linux, Windows (x86_64 與 arm64); 輸入格式涵蓋 PDF, DOCX, PPTX, XLSX, HTML, 圖片等 (來源: Docling GitHub README) |
| Marker (Datalab) | 程式碼 Apache 2.0; 模型權重為修改版 OpenRAIL-M, 研究, 個人及資金或營收 500 萬美元以下的新創可免費使用, 其他商業用途須另洽 | 可在 GPU, CPU 或 Apple MPS 執行; 輸出 Markdown, JSON 等; 作者表示支援所有語言 (來源: Marker GitHub README, 作者自報) |

Marker 的基準分數為專案自行測得, 本手冊不引用; 解析品質請以自己的文件實測. 最小可行做法是先人工把文件轉成乾淨的文字或 Markdown, 再匯入 (整理者建議).

## M4.2 嵌入模型, 向量庫與重排序

這三者決定「找得準不準, 找得快不快」. 可以想成圖書館: 嵌入模型替每一段文字編上索書號, 而且意思相近的段落會編到相鄰的號碼; 向量庫是存放索書號的卡片櫃; 重排序像館員把櫃子裡找出的十幾張卡片再細看一遍, 挑出最貼近問題的幾張.

### 嵌入模型

嵌入模型決定意思座標畫得準不準, 是影響檢索品質最大的環節之一. 下表列出三個多語言嵌入模型.

| 模型 | 授權 | 參數量 | 上下文長度 | 多語言與輸出維度 |
|---|---|---|---|---|
| EmbeddingGemma-300m (Google) | Gemma 條款 | 約 3 億 | 2,048 token | 訓練資料涵蓋 100 種以上語言; 預設 768 維, 可截短至 512, 256 或 128 維; 多語言 MTEB 平均 61.15 (Google 自報); Ollama 版 622MB (Ollama 標籤頁) |
| multilingual-e5-large-instruct (intfloat) | MIT | 約 6 億 (F16) | 512 token | 模型卡稱支援 100 種語言; 1,024 維 |
| nomic-embed-text-v2-moe (Nomic) | Apache 2.0 | 總計 4.75 億, 每次啟用 3.05 億 | 512 token | 模型卡標示約 100 種語言; 預設 768 維, 可截短至 256 維 |

來源為各模型的 Hugging Face 模型卡. 權重記憶體約為「參數量 x 每個參數的位元組數」(見 [K2](/know/k2-quantization)); 以 16 位元 (2 位元組) 估算, 三者依序約 0.6GB, 1.2GB, 0.95GB (皆為算術結果, 非實測; nomic 的混合專家設計須載入全部 4.75 億參數). 各模型卡採用的評測不同 (例如 EmbeddingGemma 列多語言 MTEB 平均分, 其他模型卡列的評測項目與比較對象各不相同), 分數不能互相對照, 因此本手冊不列比較分數. 需要橫向比較時, 可到 MTEB 排行榜以同一組工作篩選 (見[效能實測與基準分數](/ref/benchmarks)), 但仍以 M4.3 節的自測為準.

三份模型卡都沒有繁體中文的檢索評測; 2026-10-27 查詢時, 也未找到由公部門或學術機構維護的公開繁體中文檢索基準. 多語言名單與名次不一定能轉移到繁體中文. 一篇高棉語檢索研究 (arXiv 2605.22099) 同樣顯示, 特定語言上的最佳模型與一般排行榜名次可能不同. **更換嵌入模型就必須重建整個向量庫, 不可混用** (整理者說明, 信心: 高).

### 向量庫

向量庫負責存放座標, 並在提問時找出最接近的段落. 家庭與小團隊的資料量下, 各向量庫的速度差異不大, 選擇重點在部署與備份是否簡單.

| 資料庫 | 授權 | 最新版 (來源) | 單機適用性 |
|---|---|---|---|
| Qdrant | Apache 2.0 | 1.19.2, 2026-10-05 (GitHub Releases) | 獨立運作的向量資料庫伺服器; 以 Docker 單一容器啟動, 內建量化, 支援稀疏向量與混合檢索; 官方範例的預設啟動方式無驗證, 且對所有網路介面開放, 須自行加上保護 (Qdrant README); 適合標準組合 |
| pgvector | PostgreSQL License (儲存庫 LICENSE 檔) | - | PostgreSQL 資料庫的向量擴充套件; 支援 HNSW 與 IVFFlat 索引 (pgvector README); 已在用 PostgreSQL 者最省事, 備份一併處理 (整理者建議) |
| Chroma | Apache 2.0 | 1.5.9, 2026-05-05 (PyPI) | 內嵌式最易上手, 為 Open WebUI (M2 的對話介面) 預設的向量庫; 內嵌模式為單一寫入者, 不適合多個行程同時寫入 (Actian 比較文, 二手來源) |
| LanceDB | Apache 2.0 | 0.40.0, 2026-10-07 (PyPI) | 內嵌, 資料以 Lance 檔案存放在本機磁碟或物件儲存 (Actian 比較文, 二手來源) |
| sqlite-vec | Apache-2.0 與 MIT 雙授權 (GitHub 儲存庫標示) | - | SQLite 擴充套件, 資料存在 SQLite 檔案; 穩定版 (v0.1.9) 只提供暴力搜尋 (逐筆比對); 近似最近鄰索引 (rescore, DiskANN, 以及實驗性且預設未啟用的 IVF) 只出現在 v0.1.10 的 alpha 預覽版 (GitHub Releases, 2026-10-27 查詢). 正式環境建議先用穩定版, 資料量大時查詢時間會明顯變長 (推論), 請用自己的資料實測 |
| Milvus | Apache 2.0 | - | 分散式架構, 計算與儲存分離 (Milvus README); 單機讀者不需要 (整理者判斷) |

各向量庫的記憶體占用差異很大, 但公開實測多半未註明向量維度, 索引類型與參數, 無法互相對照, 因此本手冊不引用. 容量規劃可先算原始向量大小: 筆數 x 維度 x 4 位元組 (float32). 例如 10 萬筆 x 1,024 維 = 409,600,000 位元組, 約 410MB (計算值). 實際占用還會加上索引與中介資料, 請在自己的資料上實測.

### 重排序

重排序在向量庫找出候選段落之後, 再用另一個模型逐段比對問題, 調整先後順序. 可以想成初選與複選: 向量庫先快速挑出一批可能相關的段落, 重排序模型再把問題和每一段放在一起仔細比對, 重新排名. 重排序為選配, 會多花一次模型運算.

下列兩款授權允許商業使用, 模型卡都列出支援中文:

| 模型 | 授權 | 規模與上下文 | 語言與訓練資料 |
|---|---|---|---|
| nvidia/llama-nemotron-rerank-1b-v2 | OpenMDW-1.1; 另附 Llama 3.2 Community License; 模型卡標示可商用 | 1B 參數, 以 Llama-3.2-1B 微調; 評估至 8,192 token | 以 26 種語言評估, 含中文; 模型卡的評測為搭配同系列嵌入模型的整體結果, 未單獨列出重排序分數 |
| cross-encoder/mmarco-mMiniLMv2-L12-H384-v1 | Apache 2.0 | 以多語言 MiniLMv2 為基礎的小型模型 | 以 MMARCO 訓練 (MS MARCO 以 Google Translate 機器翻譯成 14 種語言), 語言清單含中文 |

兩款的模型卡都沒有繁體中文評測, 也沒有寫明是否涵蓋繁體中文, 導入前請用 M4.3 節的 50 題自測比較「有無重排序」的命中率. 單機讀者可先試 mMiniLMv2, 規模小, 對硬體要求較低; 有 GPU 且需要較長段落時, 再評估 Nemotron 重排序模型 (推論, 信心: 中). Nemotron 重排序模型附帶 Llama 3.2 授權, 對外提供服務前請依 [K4](/know/k4-licenses) 檢查條款.

## M4.3 繁體中文 50 題自測法

排行榜上的名次多以英文或其他語言測得, 不一定適用自己的繁體中文文件. 最可靠的做法, 是拿自己實際會問的問題來考. 由於缺乏公開的繁體中文檢索基準, 請依下列步驟自行評測 (信心: 中):

1. 從自己的文件中挑 50 個實際會問的問題, 每題記錄「正確答案所在的段落」.
2. 對兩個候選嵌入模型分別建立向量庫.
3. 每題檢索前 5 筆段落, 計算「正確段落出現在前 5 筆」的比例 (命中率).
4. 選命中率較高者; 差距小於 5 個百分點時, 選記憶體較小者.
5. 把這 50 題併入 M6 的回歸測試集, 之後每次換模型或調整切塊都重跑.

## M4.4 組合建議

下列兩種組合分別對應「先求可用」與「追求檢索品質」.

### 最小可行組合

- 介面內建 RAG (Open WebUI 或 AnythingLLM)
- 嵌入模型: EmbeddingGemma-300m 或 multilingual-e5-large-instruct
- 向量庫: 介面內建的 (Open WebUI 預設為 Chroma, 可改用 pgvector; AnythingLLM 預設為 LanceDB)
- 文件先人工轉成乾淨的文字或 Markdown
- 額外記憶體約 1 至 2GB (推論)

### 進階組合

Docling (CPU) 或 Marker (有 GPU) 解析 → EmbeddingGemma-300m, multilingual-e5-large-instruct 或 nomic-embed-text-v2-moe → Qdrant (混合檢索) → 重排序 (選配, mMiniLMv2 或 Nemotron 重排序模型) → 用 50 至 100 題自建繁體中文測試集評估命中率.

### 安全提醒

RAG 的文件來源就是攻擊面: 文件中若夾帶給模型的惡意指示, 模型讀到時可能照做. 只匯入可信資料夾, 對應 OWASP LLM05, LLM09 與 ASI06 (見 [K6.4 節](/know/k6-security)).

## M4.5 架設與驗收

前四節決定用哪些元件, 本節把它們接起來並確認能用. 最小可行組合只需要第 1 步; 進階組合再加第 2, 3 步. 本節依下列官方文件整理, 未實機驗證.

### 1. 在 Open WebUI 設定嵌入模型

Open WebUI 的檢索設定在管理者介面的 Settings → Admin → Documents, 嵌入模型可以改用 Ollama 或 OpenAI 相容 API 提供的模型 (來源: Open WebUI 文件 RAG). 做法是先在推論伺服器載入 M4.2 節選定的嵌入模型, 再到這個頁面選擇對應的嵌入引擎與模型名稱.

官方文件提醒, 更換嵌入模型後, 所有知識庫都要重新建立索引: 在同一頁按 Reindex, 系統會刪除並以新模型重建每個知識庫的向量; 單獨上傳到對話中的檔案不在範圍內, 要重新上傳 (來源: 同上). 這與 M4.2 節「更換嵌入模型就必須重建整個向量庫」一致.

### 2. 啟動 Docling 文件解析服務 (進階組合)

docling-serve 是把 Docling 包成 API 服務的容器, Open WebUI 上傳文件時交給它把 PDF 等格式轉成文字. Open WebUI 官方範例以 `-p 5001:5001` 對所有位址開放; 下列寫法改為只綁本機, 映像以摘要值鎖定 (見 M0.3 節), 並不開啟網頁介面 (`DOCLING_SERVE_ENABLE_UI` 預設為 false) (來源: Open WebUI 文件 Docling Document Extraction; 改寫部分未實機驗證):

```bash
docker run -d --name docling --restart always \
  -p 127.0.0.1:5001:5001 \
  quay.io/docling-project/docling-serve@sha256:<摘要值>
```

接著在 Open WebUI 的 Settings → Admin → Documents, 把內容擷取引擎 (content extraction engine) 改為 Docling, 並填入 Docling Server URL: Open WebUI 跑在 Docker 時填 `http://host.docker.internal:5001`, 兩者在同一個 Docker 自訂網路時可填 `http://docling:5001` (來源: 同上). 大型文件可調高 `DOCLING_SERVE_MAX_SYNC_WAIT` (預設 120 秒) (來源: 同上).

### 3. 啟動 Qdrant 並設定 API 金鑰 (進階組合)

Qdrant 官方 README 的啟動指令 `docker run -p 6333:6333 qdrant/qdrant` 會啟動一個沒有驗證, 對所有網路介面開放的實例 (來源: Qdrant GitHub README). 官方安全教學說明以環境變數 `QDRANT__SERVICE__API_KEY` 設定管理金鑰, `QDRANT__SERVICE__READ_ONLY_API_KEY` 設定唯讀金鑰, 用戶端以 `api-key` 標頭帶入; 並建議啟用 TLS, 否則同網段的人可以讀到金鑰與資料 (來源: Qdrant 文件 Secure a Self-Hosted Qdrant Instance). 下列寫法把金鑰放在權限 600 的 `qdrant.env` (內容為 `QDRANT__SERVICE__API_KEY=<高強度金鑰>`), 連接埠只綁本機; 資料目錄 `/qdrant/storage` 為訓練資料內資訊, 可能已過時, 請以 Qdrant 文件 Quickstart 確認:

```bash
docker run -d --name qdrant --restart always \
  -p 127.0.0.1:6333:6333 \
  --env-file ./qdrant.env \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant@sha256:<摘要值>
```

Open WebUI 連接外部向量庫的位置在 Settings → Admin → Integrations → External Knowledge Sources, 官方標示為實驗功能, 支援 Qdrant, Milvus 與 pgvector, 填入端點, API 金鑰與集合名稱; Open WebUI 映像中要有對應的 Python 用戶端 (Qdrant 為 `qdrant-client`), 而且資料庫中的向量必須與 Open WebUI 使用同一個嵌入模型與維度 (來源: Open WebUI 文件 RAG). 不需要外部向量庫時, 使用 Open WebUI 內建的 Chroma 即可 (見 M4.4 節最小可行組合).

### 4. 驗收

- [ ] 上傳一份已知內容的文件到知識庫, 提出只有這份文件才答得出的問題, 回答正確並附上出處.
- [ ] 依 M4.3 節跑完 50 題自測, 記錄命中率, 作為之後更換模型或設定時的基準.
- [ ] 從另一台電腦掃描 Docling 與 Qdrant 的連接埠, 確認連不到. `nmap` 是常用的連接埠掃描工具 (通用指令, 未實機驗證):

```bash
nmap -p 5001,6333,6334 <主機內網位址>
```

預期三個連接埠都不是 open 狀態.

- [ ] 在主機上以不帶金鑰的請求連 Qdrant, 預期遭拒; 帶上 `api-key` 標頭後才有回應:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:6333/collections
curl -s -o /dev/null -w "%{http_code}\n" -H "api-key: <金鑰>" http://127.0.0.1:6333/collections
```

- [ ] 更換嵌入模型後按 Reindex, 再跑一次 50 題自測, 確認命中率沒有異常下降.

## 參考來源

架設與驗收:

- [Open WebUI 文件: RAG (嵌入模型設定, Reindex, 外部向量庫)](https://docs.openwebui.com/features/chat-conversations/rag.md)
- [Open WebUI 文件: Docling Document Extraction](https://docs.openwebui.com/features/chat-conversations/rag/document-extraction/docling.md)
- [docling-serve GitHub 儲存庫](https://github.com/docling-project/docling-serve)
- [Qdrant 文件: Secure a Self-Hosted Qdrant Instance](https://qdrant.tech/documentation/tutorials-operations/secure-qdrant/)

文件解析:

- [Docling GitHub 儲存庫 (README, 授權)](https://github.com/docling-project/docling)
- [Marker GitHub 儲存庫 (README, 授權, 硬體需求)](https://github.com/datalab-to/marker)

嵌入模型:

- [Hugging Face 模型卡: google/embeddinggemma-300m](https://huggingface.co/google/embeddinggemma-300m)
- [Hugging Face 模型卡: intfloat/multilingual-e5-large-instruct](https://huggingface.co/intfloat/multilingual-e5-large-instruct)
- [Hugging Face 模型卡: nomic-ai/nomic-embed-text-v2-moe](https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe)
- [Ollama: embeddinggemma 標籤頁 (Ollama 版大小 622MB)](https://ollama.com/library/embeddinggemma/tags)
- [Ros 等人, A Comparative Study of Language Models for Khmer Retrieval-Augmented Question Answering (arXiv 2605.22099)](https://arxiv.org/abs/2605.22099)

向量庫與介面內建 RAG:

- [Qdrant GitHub 儲存庫 (授權, 功能, 啟動方式)](https://github.com/qdrant/qdrant)
- [Qdrant GitHub Releases (1.19.2)](https://github.com/qdrant/qdrant/releases)
- [pgvector GitHub 儲存庫 (索引類型)](https://github.com/pgvector/pgvector)
- [pgvector LICENSE](https://github.com/pgvector/pgvector/blob/master/LICENSE)
- [PyPI: chromadb (版本, 授權)](https://pypi.org/project/chromadb/)
- [PyPI: lancedb (版本, 授權)](https://pypi.org/project/lancedb/)
- [LanceDB GitHub 儲存庫](https://github.com/lancedb/lancedb)
- [sqlite-vec GitHub 儲存庫 (授權)](https://github.com/asg017/sqlite-vec)
- [sqlite-vec 作者部落格: sqlite-vec stable release (暴力搜尋)](https://alexgarcia.xyz/blog/2024/sqlite-vec-stable-release/index.html)
- [sqlite-vec GitHub Releases (v0.1.9 穩定版; v0.1.10 alpha 加入 rescore, DiskANN 與實驗性 IVF 索引)](https://github.com/asg017/sqlite-vec/releases)
- [Milvus GitHub 儲存庫 (分散式架構, 授權)](https://github.com/milvus-io/milvus)
- [Actian 部落格: Comparing embedded vector databases (二手來源, Chroma 與 LanceDB 的內嵌模式特性)](https://www.actian.com/blog/developer/comparing-embedded-vector-databases/)
- [Open WebUI 文件: Scaling Open WebUI (預設向量庫為 Chroma, 可改用 PGVector 等)](https://docs.openwebui.com/getting-started/advanced-topics/scaling/)
- [AnythingLLM GitHub 儲存庫 (預設向量庫為 LanceDB)](https://github.com/Mintplex-Labs/anything-llm)

安全對照:

- [OWASP GenAI Security Project: OWASP GenAI LLM Top 10 2026 (發布日 2026-08-03)](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
- [OWASP GenAI Security Project: Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)

重排序模型:

- [Hugging Face 模型卡: nvidia/llama-nemotron-rerank-1b-v2 (授權, 語言, 上下文, 評測)](https://huggingface.co/nvidia/llama-nemotron-rerank-1b-v2)
- [NVIDIA NeMo AutoModel 文件: llama-nemotron-rerank-1b-v2 (以 Llama 3.2 1B 訓練的 cross-encoder)](https://docs.nvidia.com/nemo/automodel/model-coverage/reranking-models/nvidia/llama-nemotron-rerank-1b-v2)
- [Hugging Face 模型卡: cross-encoder/mmarco-mMiniLMv2-L12-H384-v1 (授權, 基礎模型, 訓練資料, 語言)](https://huggingface.co/cross-encoder/mmarco-mMiniLMv2-L12-H384-v1/blob/265d6fb9678e8fc6b1adeda526533b2a1f1a7f07/README.md)

- 文中的類比 (開書考試, 圖書館索書號與卡片櫃, 初選與複選): 整理者所寫, 無外部來源, 不應當作技術定義引用.

整理者建議 (推論, 無外部來源): M4.3 節的 50 題自測流程與「差距小於 5 個百分點」的判定門檻, M4.4 節的最小可行與進階組合, 以及容量規劃的算式 (算術結果); 重排序兩款模型的使用順序建議. 「備份是否簡單」作為選擇依據, 亦屬整理者判斷 (信心: 中). 「查無繁體中文檢索評測」指上列模型卡未提供, 且 2026-10-27 以網路搜尋未找到由公部門或學術機構維護的公開繁體中文檢索基準; 查詢範圍有限, 不排除有未收錄的資料集.
