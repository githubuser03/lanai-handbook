---
description: "衡量模型有兩種數字, 用途不同. 「實測」回答「這台機器跑這個模型有多快」, 只能在自己的硬體上量."
---

# 效能實測與基準分數

::: info 本章屬性
- 等級: 參考資料
- 狀態: 可閱讀
- 資料基準日: 2026-10-27
- 實機驗證: 未進行 (「實測」一節的結果表待實機填入, 測試指令依官方文件整理)
:::

**結論**: 衡量模型有兩種數字, 用途不同. 「實測」回答「這台機器跑這個模型有多快」, 只能在自己的硬體上量; 「基準分數」回答「這個模型在標準題目上答得多好」, 適合縮小候選範圍, 但不等於在自己工作上的表現. 選型時先用基準分數挑出兩三個候選, 再用自己的硬體實測速度, 最後用 [M6](/build/m6-observability) 的自建測試集比較品質.

::: tip 本頁常見名詞
| 詞 | 意思 |
|---|---|
| 首字延遲 (time to first token, TTFT) | 送出問題到看到第一個字所花的時間, 決定使用者覺得「有沒有反應」 |
| 每秒 token 數 (tokens/s) | 模型每秒產生多少 token, 決定回答寫完要多久 |
| 預填 (prompt processing) | 模型讀完輸入內容的階段; 輸入越長, 這段越久 |
| 解碼 (text generation) | 模型逐一產生輸出 token 的階段 |
| 並行 (concurrency) | 同時有多少個請求在處理 |
| 基準 (benchmark) | 一套固定題目與評分方式, 用來比較不同模型 |
| 榜單 (leaderboard) | 把各模型在同一個基準上的分數排成一張表 |

完整詞彙見[術語對照](/ref/glossary).
:::

## 實測只能在自己的硬體上做

同一個模型, 換一張顯示卡, 換一個推論引擎, 甚至換一種量化格式, 速度都可能差很多. 網路上的速度數字很少寫清楚測試條件, 拿來直接比較容易誤判, 因此本手冊不引用他人的速度數字, 只提供測試方法與記錄格式. 可以想成量體重: 別人家的體重計讀數參考價值有限, 最準的是用同一台體重計, 在同樣條件下自己量.

### 兩個測試工具: 一個量引擎本身, 一個量整套服務

**llama-bench** 是 llama.cpp 附帶的效能測試工具. 它直接載入 GGUF 模型檔, 不經過網路與 API, 量的是推論引擎本身在這台硬體上的極限速度, 適合比較「同一台機器上, 哪個模型或哪種量化比較快」. 對應架構中 [M1](/build/m1-inference) 的推論伺服器層. 它分兩項測試: 預填 (pp) 測「批次處理輸入」, 預設 512 個 token; 解碼 (tg) 測「逐一產生輸出」, 預設 128 個 token. 每項預設重複 5 次, 回報平均每秒 token 數與標準差, 可輸出 Markdown, CSV, JSON 或 SQL 格式 (來源: llama.cpp llama-bench README).

**vllm bench serve** 是 vLLM 附帶的服務端測試指令. 它對已經啟動的 vLLM 服務送出一批請求, 模擬多人同時使用, 量的是使用者實際感受到的速度, 適合回答「這台機器能同時服務幾個人」. 對應 [M1](/build/m1-inference) 的 vLLM 部署, 以及 [K3.4 節](/know/k3-hardware)的多人並行情境. 它回報首字延遲 (TTFT), 每個輸出 token 的平均時間 (TPOT, 計算時扣除第一個 token), token 之間的間隔 (ITL), 以及每秒請求數與每秒 token 數. 延遲在發出請求的測試端量測; `--max-concurrency` 限制同時進行的請求數, 不設定時不設上限 (來源: vLLM 文件 Benchmark CLI). 同一份文件建議, 正式環境的服務壓測可改用 GuideLLM; `vllm bench` 主要用於評估特定功能與回歸測試.

### 測試指令範例

下列指令依官方文件整理, 未實機驗證; 角括號內換成自己的模型與參數.

llama-bench 範例: 同時測兩個量化版本, 預填 512 token, 解碼 128 token, 每項重複 5 次 (皆為預設值), 結果輸出成 JSON 以便留存.

```bash
./llama-bench -m <模型A.gguf> -m <模型B.gguf> -p 512 -n 128 -r 5 -o json > bench-$(date +%F).json
```

vllm bench serve 範例: 先在一個終端機啟動服務, 再從另一個終端機送出 200 個隨機請求, 輸入與輸出各 1,024 token, 同時最多 8 個請求. 隨機資料集在固定 `--seed` (預設 0) 下可以重現.

```bash
vllm serve <模型>

vllm bench serve \
    --model <模型> \
    --dataset-name random \
    --random-input-len 1024 \
    --random-output-len 1024 \
    --num-prompts 200 \
    --max-concurrency 8
```

`--max-concurrency` 建議依序測 1, 4, 8 等數值, 觀察首字延遲在幾個人同時使用時開始明顯變長; 這個拐點就是這台機器的實用並行上限 (推論, 信心: 中).

### 記錄格式

每次實測至少記下列欄位. 少了任何一欄, 數字就無法和下一次比較.

| 欄位 | 記什麼 | 為什麼需要 |
|---|---|---|
| 測試日期 | 年月日 | 驅動與引擎更新後, 速度可能改變 |
| 硬體 | 顯示卡或晶片型號, 顯示記憶體或統一記憶體容量, 驅動版本 | 速度主要由記憶體容量與頻寬決定 (見 [K3](/know/k3-hardware)) |
| 模型與量化 | 模型 ID 與 revision, 量化格式 (例如 Q4_K_M, FP8) | 同一模型不同量化, 速度與品質都不同 (見 [K2](/know/k2-quantization)) |
| 引擎與版本 | llama.cpp, Ollama 或 vLLM 的版本 | 不同版本的最佳化程度不同 |
| 上下文長度 | 輸入與輸出的 token 數 | 輸入越長, 首字延遲越長 (見 [K1](/know/k1-basics)) |
| 並行數 | 同時處理的請求數 | 多人同時使用時, 每人分到的速度會下降 |
| 首字延遲 | 平均值與 P95 (95% 的請求在此時間內完成) | 使用者感受最直接 |
| 每秒 token 數 | 預填與解碼分開記 | 預填影響長文件, 解碼影響回答長度 |
| 測試指令 | 完整指令原文 | 讓下一次能用同樣條件重測 |

### 結果表

| 日期 | 硬體 | 模型與量化 | 引擎與版本 | 上下文 (輸入/輸出) | 並行數 | 首字延遲 | 解碼每秒 token 數 | 備註 |
|---|---|---|---|---|---|---|---|---|
| 待實機驗證 | | | | | | | | |

## 基準分數: 先看它量什麼, 再看分數

基準分數是用同一套題目測量不同模型的成績. 可以想成標準化考試: 分數方便橫向比較, 但考的範圍未必是自己工作需要的能力, 因此仍需用自己的題目實測 (見 [M6](/build/m6-observability)). 讀任何榜單之前, 先確認三件事: 它考什麼能力, 題目是什麼語言, 分數是官方重測還是模型作者自報.

本頁引用的分數都取自官方榜單或模型卡自報, 未經第三方重測, 引用時要一併註明出處與擷取日期.

下表列出與本手冊各章直接相關的三個基準.

| 基準 | 角色 | 對應章節 | 題目語言 |
|---|---|---|---|
| BFCL | 評估模型「呼叫工具」的準確度 | [K5](/know/k5-tools-agents), [M8](/build/m8-agent-governance) | 以英文為主 |
| MTEB / MMTEB | 評估嵌入模型「依意思找資料」等能力 | [M4](/build/m4-retrieval) | 多語言, 偏重資源較多的語言 |
| TMMLU+ | 評估模型對繁體中文各科知識的理解 | 本頁, [模型建議](/ref/models) | 繁體中文 |

由上表可知, 三個基準分別對應「代理能不能正確用工具」, 「檢索找不找得準」, 「繁體中文懂不懂」三個問題, 彼此不能互相取代.

### BFCL: 工具呼叫的準確度

Berkeley Function Calling Leaderboard (BFCL) 由 UC Berkeley 維護, 評估模型能否選對函式 (工具) 並填對參數. 在本手冊的架構中, 這項能力決定 [M7](/build/m7-tools-sandbox) 與 [M8](/build/m8-agent-governance) 的代理能不能可靠地操作工具. BFCL 歷經多版擴充: v1 引入以語法樹 (AST) 比對答案的評分方式, v2 加入企業與開源社群貢獻的函式, v3 加入多輪互動, v4 加入整體的代理任務評估. 總分 (Overall Accuracy) 是各子類別的未加權平均 (來源: BFCL 官方頁面, 頁面標示最後更新 2026-04-12, 2026-10-27 擷取).

讀 BFCL 時要留意兩點. 第一, 模型分成 FC (使用原生函式呼叫功能) 與 Prompt (以文字生成模擬函式呼叫) 兩類, 同一個模型的兩種模式分數不同; 第二, 總分把單步與多輪平均在一起, 單步高分不代表多輪可靠. 本手冊已整理的分數見 [K5.4 節](/know/k5-tools-agents)的表格 (取自官方資料檔 data_overall.csv), 其中通用小模型單步準確率約 78% 至 87%, 多輪只有約 6% 至 11%.

### MTEB 與 MMTEB: 嵌入模型的綜合考試

MTEB (Massive Text Embedding Benchmark) 是嵌入模型最常用的評測集合, MMTEB 是其多語言擴充版. 在本手冊的架構中, 嵌入模型負責 [M4](/build/m4-retrieval) 檢索的第一步, 所以 MTEB 分數是挑選嵌入模型時的起點. MMTEB 論文指出, 這套評測涵蓋 500 個以上的任務, 250 種以上的語言, 任務類別包含雙語配對, 分類, 分群, 語意相似度, 檢索與重排序等 (來源: MMTEB 論文, arXiv 2502.13595). 榜單以 Hugging Face Space 的形式公開.

MMTEB 論文也列出幾項限制: 只有英文版 MTEB(eng, v2) 設計為零樣本 (zero-shot) 評測, 也就是刻意排除模型可能在訓練時看過的資料集; 語言分布偏向資源較多的語言; 部分任務使用人工翻譯, 可能偏向英文或翻譯文本 (來源同上). 對繁體中文讀者的意義是: MTEB 總分高, 不保證繁體中文檢索也好 (推論, 信心: 中).

一個具體例子可以說明這個落差. TAIDE 發布的 embeddinggemma-GTAIDE-300m-2605, 以台灣法規文本微調 EmbeddingGemma-300m. 模型卡自報, 在台灣法規檢索測試 (30,651 個查詢) 上, Recall@5 (正確答案出現在前 5 筆檢索結果中的比例) 從基底模型的 82.77 提高到 94.81; 但在 MTEB (Multi, v2) 的平均分數, 反而從 61.15 降到 59.31 (來源: 模型卡自報, 2026-10-27 擷取). 也就是說, 針對自己領域調整過的模型, 在通用榜單上可能退步, 在自己的工作上卻明顯進步. 這正是 [M4.3 節](/build/m4-retrieval)建議用自己的 50 題自測的原因.

### TMMLU+: 繁體中文的知識測驗

TMMLU+ 是繁體中文的多選題測驗集, 由 iKala 等研究者發布, 用來評估模型對繁體中文各科知識的理解. 在選擇對話模型時, 它可以回答「這個模型懂不懂台灣的考試與專業知識」. 資料集涵蓋 66 個科目, 從小學到專業程度, 分為 STEM, 社會科學, 人文與其他四類; 測試集有 20,118 題, 加上開發與驗證集共 22,690 題 (來源: TMMLU+ 論文 arXiv 2403.01858 與 Hugging Face 資料集說明). 資料集授權為 CC BY-NC (非商業), 用於內部評估之外的用途前, 請先依 [K4](/know/k4-licenses) 確認授權.

TMMLU+ 沒有官方維護的持續更新榜單, 分數多由模型作者在模型卡自報. 例如 TAIDE 的 Gemma-3-TAIDE-12b-Chat-2602 模型卡自報平均 58.02, 同一表中基底的 Gemma-3-12b-it 為 53.82 (2026-10-27 擷取). 讀這類自報分數時要注意: 各家的提示寫法與評分設定不一定相同, 不同模型卡之間的分數不宜直接比較 (推論, 信心: 中). 另外, TMMLU+ 是選擇題, 測的是知識, 不是寫作或對話能力.

### 讀分數的四個原則

1. **先確認角色**: 先看榜單考的能力是否就是自己要的能力; 嵌入模型看 MTEB, 工具呼叫看 BFCL, 不要拿對話模型的知識分數來挑嵌入模型.
2. **分清楚官方重測與自報**: BFCL 由維護單位統一執行; TMMLU+ 與多數模型卡的分數是作者自報, 條件可能不同.
3. **看子項目, 不只看總分**: 總分是平均值, 會把自己最在意的弱項藏起來, 例如 BFCL 的多輪分數.
4. **最後用自己的題目決定**: 基準分數只用來縮小範圍, 上線前以 [M6](/build/m6-observability) 的自建測試集比較 (整理者建議, 信心: 中).

## 參考來源

實測工具:

- [llama.cpp: llama-bench README](https://github.com/ggerganov/llama.cpp/blob/b8c1476e44cc1f3a1811613f65251cf779067636/examples/llama-bench) (測試項目, 預設值, 輸出格式; 此為舊版路徑的固定版本, 新版工具位於 tools/llama-bench)
- [vLLM 文件: Benchmark CLI (v0.32.0)](https://docs.vllm.ai/en/v0.32.0/benchmarking/cli/) (TTFT, TPOT, ITL 定義, 參數與範例)

基準與榜單:

- [Berkeley Function Calling Leaderboard (BFCL) V4](https://gorilla.cs.berkeley.edu/leaderboard.html): UC Berkeley 維護, 頁面標示最後更新 2026-04-12 (2026-10-27 擷取)
- [MTEB Leaderboard, Hugging Face Space](https://huggingface.co/spaces/mteb/leaderboard) (2026-10-27 擷取)
- [Enevoldsen 等人, MMTEB: Massive Multilingual Text Embedding Benchmark (arXiv 2502.13595)](https://arxiv.org/html/2502.13595v2)
- [Tam 等人, TMMLU+: An Improved Traditional Chinese Evaluation Suite for Foundation Models (arXiv 2403.01858)](https://arxiv.org/abs/2403.01858v3)
- [Hugging Face 資料集: ikala/tmmluplus (授權, 題數, 分類)](https://huggingface.co/datasets/ikala/tmmluplus/raw/2323a5de167616cb3f752ed16e0439f2d467aac5/README.md)

模型卡自報分數:

- [Hugging Face 模型卡: taide/embeddinggemma-GTAIDE-300m-2605](https://huggingface.co/taide/embeddinggemma-GTAIDE-300m-2605) (台灣法規檢索與 MTEB 分數)
- [Hugging Face 模型卡: taide/Gemma-3-TAIDE-12b-Chat-2602](https://huggingface.co/taide/Gemma-3-TAIDE-12b-Chat-2602) (TMMLU+ 分數)

整理者判斷 (無外部來源):

- 「不引用他人的速度數字」, 記錄格式的欄位設計, 並行數的測試順序與拐點判讀, 以及「讀分數的四個原則」, 為整理者建議.
- 文中的類比 (量體重, 標準化考試): 整理者所寫, 無外部來源, 不應當作技術定義引用.
