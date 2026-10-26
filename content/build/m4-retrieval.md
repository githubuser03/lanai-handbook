# M4 檢索增強生成 (RAG)

::: info 本章屬性
- 等級: ○ 依情境, 有「問自己文件」的需求才讀
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: 查無公開的繁體中文嵌入與重排序基準 (含 TAIDE 嵌入模型), 各嵌入模型卡也未列出繁體中文評測; 重排序模型未列具體型號 (來源待補); 多數嵌入模型的多語言總分在模型卡上無法直接對照 (來源待補); sqlite-vec 目前是否已提供近似最近鄰索引 (來源待補); 向量庫記憶體占用未引用公開實測; Chroma 與 LanceDB 的內嵌模式限制引自二手來源 (Actian 比較文); 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 家庭規模 (數萬至數十萬段落) 下, 向量庫的選擇差異遠小於嵌入模型與文件解析品質的差異, 因此以「備份是否簡單」當作主要選擇依據 (信心: 中高). 嵌入模型的排行榜名次不一定適用繁體中文, 請用自己的 50 題問答實測.

**這一塊在圖上的位置**: VM 入口區的 Docling 與 Qdrant, 嵌入模型跑在推論伺服器. **前置模組**: M1, M2. **完成後的狀態**: 使用者可以在介面中針對自己的文件提問, 回答附上出處.

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

嵌入模型決定意思座標畫得準不準, 是影響檢索品質最大的環節之一. 下表列出四個多語言嵌入模型.

| 模型 | 授權 | 參數量 | 上下文長度 | 多語言與輸出維度 |
|---|---|---|---|---|
| EmbeddingGemma-300m (Google) | Gemma 條款 | 約 3 億 | 2,048 token | 訓練資料涵蓋 100 種以上語言; 多語言 MTEB 平均 61.15 (Google 自報); Ollama 版約 622MB (二手來源: morphllm.com) |
| multilingual-e5-large-instruct (intfloat) | MIT | 約 6 億 (F16) | 512 token | 模型卡稱支援 100 種語言; 1,024 維 |
| snowflake-arctic-embed-l-v2.0 (Snowflake) | Apache 2.0 | 5.68 億 | 8,192 token | 模型卡標示 74 種語言; 預設 1,024 維, 可截短至 256 維 |
| nomic-embed-text-v2-moe (Nomic) | Apache 2.0 | 總計 4.75 億, 每次啟用 3.05 億 | 512 token | 模型卡標示約 100 種語言; 預設 768 維, 可截短至 256 維 |

來源為各模型的 Hugging Face 模型卡. 權重記憶體約為「參數量 x 每個參數的位元組數」(見 [K2](/know/k2-quantization)); 以 16 位元 (2 位元組) 估算, 四者依序約 0.6GB, 1.2GB, 1.1GB, 0.95GB (皆為算術結果, 非實測; nomic 的混合專家設計須載入全部 4.75 億參數). 各模型卡未提供可直接對照的多語言總分, 因此本手冊不列比較分數 (來源待補).

四份模型卡都沒有繁體中文的檢索評測, 多語言名單與名次不一定能轉移到繁體中文. 一篇高棉語檢索研究 (arXiv 2605.22099) 同樣顯示, 特定語言上的最佳模型與一般排行榜名次可能不同. **更換嵌入模型就必須重建整個向量庫, 不可混用** (整理者說明, 信心: 高).

### 向量庫

向量庫負責存放座標, 並在提問時找出最接近的段落. 家庭與小團隊的資料量下, 各向量庫的速度差異不大, 選擇重點在部署與備份是否簡單.

| 資料庫 | 授權 | 最新版 (來源) | 單機適用性 |
|---|---|---|---|
| Qdrant | Apache 2.0 | 1.19.2, 2026-10-05 (GitHub Releases) | 以 Docker 單一容器啟動, 內建量化, 支援稀疏向量與混合檢索; 官方範例的預設啟動方式無驗證, 且對所有網路介面開放, 須自行加上保護 (Qdrant README); 適合標準組合 |
| pgvector | PostgreSQL License (儲存庫 LICENSE 檔) | - | 支援 HNSW 與 IVFFlat 索引 (pgvector README); 已在用 PostgreSQL 者最省事, 備份一併處理 (整理者建議) |
| Chroma | Apache 2.0 | 1.5.9, 2026-05-05 (PyPI) | 內嵌式最易上手, 為 Open WebUI 預設的向量庫; 內嵌模式為單一寫入者, 不適合多個行程同時寫入 (Actian 比較文, 二手來源) |
| LanceDB | Apache 2.0 | 0.40.0, 2026-10-07 (PyPI) | 內嵌, 資料以 Lance 檔案存放在本機磁碟或物件儲存 (Actian 比較文, 二手來源) |
| sqlite-vec | Apache-2.0 與 MIT 雙授權 (GitHub 儲存庫標示) | - | SQLite 擴充套件, 資料存在 SQLite 檔案; 作者部落格表示目前專注於暴力搜尋 (逐筆比對), 近似最近鄰索引為規劃中 (2024 年文章, 現況來源待補); 資料量大時查詢時間會明顯變長 (推論), 請用自己的資料實測 |
| Milvus | Apache 2.0 | - | 分散式架構, 計算與儲存分離 (Milvus README); 單機讀者不需要 (整理者判斷) |

各向量庫的記憶體占用差異很大, 但公開實測多半未註明向量維度, 索引類型與參數, 無法互相對照, 因此本手冊不引用. 容量規劃可先算原始向量大小: 筆數 x 維度 x 4 位元組 (float32). 例如 10 萬筆 x 1,024 維 = 409,600,000 位元組, 約 410MB (計算值). 實際占用還會加上索引與中介資料, 請在自己的資料上實測.

### 重排序

重排序在向量庫找出候選段落之後, 再用另一個模型逐段比對問題, 調整先後順序. 重排序為選配. 多語言重排序模型的授權與語言支援差異大, 繁體中文評測同樣無法確認, 因此導入前請先讀模型卡, 再用 M4.3 節的 50 題自測 (整理者建議; 具體型號來源待補).

## M4.3 繁體中文 50 題自測法

排行榜上的名次多以英文或其他語言測得, 不一定適用自己的繁體中文文件. 最可靠的做法, 是拿自己實際會問的問題來考. 由於缺乏公開的繁體中文檢索基準, 請依下列步驟自行評測 (信心: 中高):

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

Docling (CPU) 或 Marker (有 GPU) 解析 → EmbeddingGemma-300m, multilingual-e5-large-instruct 或 snowflake-arctic-embed-l-v2.0 → Qdrant (混合檢索) → 重排序 (選配) → 用 50 至 100 題自建繁體中文測試集評估命中率.

### 安全提醒

RAG 的文件來源就是攻擊面: 文件中若夾帶給模型的惡意指示, 模型讀到時可能照做. 只匯入可信資料夾, 對應 OWASP LLM08 與 ASI06 (見 [K6.4 節](/know/k6-security)).

## 參考來源

文件解析:

- [Docling GitHub 儲存庫 (README, 授權)](https://github.com/docling-project/docling)
- [Marker GitHub 儲存庫 (README, 授權, 硬體需求)](https://github.com/datalab-to/marker)

嵌入模型:

- [Hugging Face 模型卡: google/embeddinggemma-300m](https://huggingface.co/google/embeddinggemma-300m)
- [Hugging Face 模型卡: intfloat/multilingual-e5-large-instruct](https://huggingface.co/intfloat/multilingual-e5-large-instruct)
- [Hugging Face 模型卡: Snowflake/snowflake-arctic-embed-l-v2.0](https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0)
- [Hugging Face 模型卡: nomic-ai/nomic-embed-text-v2-moe](https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe)
- [morphllm.com: Ollama embedding models (二手來源, EmbeddingGemma 的 Ollama 下載大小)](https://www.morphllm.com/ollama-embedding-models)
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
- [Milvus GitHub 儲存庫 (分散式架構, 授權)](https://github.com/milvus-io/milvus)
- [Actian 部落格: Comparing embedded vector databases (二手來源, Chroma 與 LanceDB 的內嵌模式特性)](https://www.actian.com/blog/developer/comparing-embedded-vector-databases/)
- [Open WebUI 文件: Scaling Open WebUI (預設向量庫為 Chroma, 可改用 PGVector 等)](https://docs.openwebui.com/getting-started/advanced-topics/scaling/)
- [AnythingLLM GitHub 儲存庫 (預設向量庫為 LanceDB)](https://github.com/Mintplex-Labs/anything-llm)

安全對照:

- [OWASP GenAI Security Project: OWASP GenAI LLM Top 10 2026 (發布日 2026-08-03)](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
- [OWASP GenAI Security Project: Top 10 for Agentic Applications for 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)

- 文中的類比 (開書考試, 圖書館索書號與卡片櫃): 整理者所寫, 無外部來源, 不應當作技術定義引用.

整理者建議 (推論, 無外部來源): M4.3 節的 50 題自測流程與「差距小於 5 個百分點」的判定門檻, M4.4 節的最小可行與進階組合, 以及容量規劃的算式 (算術結果). 「備份是否簡單」作為選擇依據, 亦屬整理者判斷 (信心: 中高). 「查無繁體中文檢索評測」僅指上列四份模型卡未提供, 公開基準是否存在仍須另行查證 (來源待補).
