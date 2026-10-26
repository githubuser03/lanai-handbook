# 第 12 章 檢索增強生成 (RAG)

::: info 本章屬性
- 等級: ○ 依情境, 有「問自己文件」的需求才讀
- 狀態: 草稿, 待人工審閱
- 資料基準日: 2026-10-26
- 待查證: 查無公開的繁體中文嵌入與重排序基準 (含 TAIDE 嵌入模型); pgvector 與 sqlite-vec 授權為訓練資料內資訊, 可能已過時
:::

**結論**: 家庭規模 (數萬至數十萬段落) 下, 向量庫的選擇差異遠小於嵌入模型與文件解析品質的差異, 因此以「備份是否簡單」作為主要選擇依據 (信心: 中高). 嵌入模型的排行榜名次不一定適用繁體中文, 請用自己的 50 題問答實測.

## 12.1 文件解析

| 工具 | 授權 | 特點 |
|---|---|---|
| Docling (IBM) | MIT | 可在純 CPU 執行, 格式涵蓋最廣; 2026 年中為 v2.111 (Medium 比較文) |
| MinerU (OpenDataLab) | 3.1.0 起改為自訂授權: 月活躍使用者超過 1 億或月營收超過 2,000 萬美元須另取商業授權, 線上服務須標示使用 MinerU (docsumo.com) | 中文與表格公認最強; pipeline 後端 (CPU) 在 OmniDocBench 約 86 分, VLM 後端 (GPU) 約 95 分以上 |

OmniDocBench 由 MinerU 同一團隊維護, 評測結果須保留一分懷疑. 最小可行做法是先人工把文件轉成乾淨的文字或 Markdown, 再匯入.

## 12.2 嵌入模型, 向量庫與重排序

### 嵌入模型

| 模型 | MMTEB (多語) | C-MTEB (中文) | 大小 | 來源 |
|---|---|---|---|---|
| Qwen3-Embedding-0.6B | 64.33 | 66.33 | Ollama 版 639MB | Qwen 官方 GitHub, morphllm.com |
| Qwen3-Embedding-4B | 69.45 | 72.27 | 權重約 7,671MB (16-bit) | Qwen 官方, supermemory.ai |
| Qwen3-Embedding-8B | 70.58 | 73.84 | 權重約 14,433MB | 同上 |
| bge-m3 | 59.56 | - | 約 1.2GB; 支援稠密, 稀疏, 多向量 | Qwen 官方比較表, morphllm.com |
| EmbeddingGemma-300m | 61.15 (Google 自報) | - | 622MB (Ollama); 上下文 2,048 token; Gemma 條款 | surrealdb.com, supermemory.ai |

C-MTEB 以簡體中文為主, 無法直接代表繁體中文表現. 一篇高棉語研究 (arXiv 2605.22099) 中 bge-m3 反而勝過 Qwen3-Embedding, 顯示排行榜名次不一定能轉移到特定語言. **更換嵌入模型就必須重建整個向量庫, 不可混用. **

### 向量庫

| 資料庫 | 授權 | 最新版 (來源) | 單機適用性 |
|---|---|---|---|
| Qdrant | Apache 2.0 | 1.19.2, 2026-10-05 (vdf.ai) | 單一執行檔, 支援量化與混合檢索; 適合標準組合 |
| pgvector | PostgreSQL License (待核對) | - | 已在用 PostgreSQL 者最省事, 備份一併處理 |
| Chroma | Apache 2.0 | 1.5.9, 2026-05-05 | 內嵌式最易上手; 內嵌模式不支援並行寫入 (Actian) |
| LanceDB | Apache 2.0 | 0.39.0, 2026-09-17 | 內嵌, 以磁碟為主, 適合大於記憶體的資料 |
| sqlite-vec | 待核對 | - | 單一檔案, 暴力搜尋; 10 萬筆 1024 維約 85MB RAM, 但查詢約 1.7 秒 (shaharia.com 自測) |
| Milvus | - | - | 分散式設計, 單機讀者不需要 |

AIMultiple 以 5 萬筆向量實測峰值記憶體: Weaviate 1,201MB, LanceDB 1,574MB, Chroma 1,800MB, pgvector 2,024MB, Milvus 3,300MB.

### 重排序

Qwen 官方提供 Qwen3-Reranker 系列; 繁體中文評測同樣無法確認.

## 12.3 繁體中文 50 題自測法

由於缺乏公開的繁體中文檢索基準, 請依下列步驟自行評測 (信心: 中高):

1. 從自己的文件中挑 50 個實際會問的問題, 每題記錄「正確答案所在的段落」.
2. 對兩個候選嵌入模型分別建立向量庫.
3. 每題檢索前 5 筆段落, 計算「正確段落出現在前 5 筆」的比例 (命中率).
4. 選命中率較高者; 差距小於 5 個百分點時, 選記憶體較小者.
5. 把這 50 題併入第 14 章的回歸測試集, 之後每次換模型或調整切塊都重跑.

## 12.4 組合建議

### 最小可行組合

- 介面內建 RAG (Open WebUI 或 AnythingLLM)
- 嵌入模型: Qwen3-Embedding-0.6B 或 bge-m3
- 向量庫: 介面內建的 (Chroma 或 pgvector)
- 文件先人工轉成乾淨的文字或 Markdown
- 額外記憶體約 1 至 2GB (推論)

### 進階組合

Docling (CPU) 或 MinerU (有 GPU) 解析 → Qwen3-Embedding-0.6B 或 4B → Qdrant (混合檢索) → Qwen3-Reranker 重排序 → 用 50 至 100 題自建繁體中文測試集評估命中率.

### 安全提醒

RAG 的文件來源就是攻擊面. 只匯入可信資料夾, 對應 OWASP LLM08 與 ASI06 (見第 11.4 節).
