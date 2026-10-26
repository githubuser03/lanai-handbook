# K1 模型如何運作

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: 上下文長度對回應速度的實際影響依引擎與硬體而異, 本章只寫定性描述; 推論伺服器的定位比較為整理者歸納; 「本機與雲端的取捨」各面向屬推論, 未引用實測資料; Ollama 預設上下文長度的說法 (M1.8 節與 Ollama 現行文件) 不一致, 待 M1 對照
:::

**結論**: 模型就是一組訓練出來的數字 (權重), 推論伺服器負責把它載入記憶體, 把文字切成 token, 計算出下一個 token, 再以 OpenAI 相容 API 提供給其他元件. 「問自己的文件」另外需要一個嵌入模型把文字轉成向量. 地端模型和雲端模型一樣帶著訓練時學到的知識, 也可能記住部分訓練資料; 兩者的差別在「在哪裡跑, 輸入交給誰」, 不在「知道什麼」. 地端不必然優於雲端, 取捨見 K1.8 節與[一頁決策摘要](/decide/summary).

## K1.1 模型是一組權重, 參數量決定檔案大小

模型 (model) 在本手冊指大型語言模型: 輸入一段文字, 輸出下一段文字的程式. 它的「能力」存放在權重 (weights) 裡. 權重是訓練過程調整出來的大量數字, 每一個數字稱為一個參數 (parameter); 「8B」代表約 80 億個參數.

參數量直接決定權重檔的大小. 以 16 位元精度存放時, 每個參數占 2 位元組, 因此 80 億參數約 16GB; 降低精度 (量化) 可以縮小檔案, 估算方法見 [K2](/know/k2-quantization). 參數量越大, 能力通常越好, 但需要的記憶體與運算也越多 (信心: 高, 屬一般經驗).

權重本身不是可讀的資料庫, 無法像查表一樣找出「某一筆知識存在哪裡」(信心: 中高, 屬一般理解). 這點會影響 K1.7 節的隱私判斷.

**對應架構圖**: VM 推論區載入的模型檔, 以及 NAS 上的 NFS 模型存放區 (見 [M3](/build/m3-model-intake)).

## K1.2 token 與上下文長度

token 是模型處理文字的最小單位. 模型不直接讀「字」, 而是讀一串 token 編號: 一個 token 可能是一個英文單字, 單字的一部分, 一個標點, 或一至數個中文字, 切法依模型而定.

上下文長度 (context length) 是模型一次能處理的 token 上限, 包含輸入與已產生的輸出. Ollama 文件的定義是「模型在記憶體中能存取的最大 token 數」, 並說明加大上下文會增加執行模型所需的記憶體 (來源: Ollama 文件 Context length). 記憶體的估算方式見 [K2](/know/k2-quantization) 的 KV cache 一節.

上下文越長, 回應通常越慢. 原因是 Transformer 架構的自注意力 (self-attention) 每層運算量隨序列長度的平方增加 (來源: Vaswani 等人 2017 年論文 Table 1), 輸入越長, 模型開始輸出第一個字之前要算的就越多. 實際的速度差距依推論引擎, 硬體與快取機制而異, 本章不給單一數字 (推論, 信心: 中). 實務上的做法是: 上下文只開到任務需要的長度, 並用 [M6](/build/m6-observability) 的耗時紀錄比較前後差異.

**對應架構圖**: 推論伺服器 (vLLM, Ollama 或 llama.cpp) 的上下文設定, 也就是 VM 推論區的 GPU 記憶體用量.

## K1.3 Tokenizer 與嵌入矩陣: 文字如何變成數字

Tokenizer 是把文字切成 token, 再對應成編號的規則. 它不在權重裡, 而是和權重一起發布的另一份設定. Hugging Face Tokenizers 程式庫的範例中, 同一段文字編碼後會得到兩組結果: `tokens` 是切分後的片段, `ids` 是每個片段在詞彙表中的編號 (來源: Hugging Face Tokenizers 文件 Quicktour).

Tokenizer 的存放方式依檔案格式不同:

| 格式 | Tokenizer 放在哪裡 | 來源 |
|---|---|---|
| Hugging Face 格式 (safetensors) | 獨立檔案, 常見為 `tokenizer.json` 與 `tokenizer_config.json`, 和 `model-*.safetensors` 權重檔放在同一個模型庫 | Hugging Face 模型庫檔案列表 (以 openai/gpt-oss-20b 為例) |
| GGUF | 和權重包在同一個檔案, 以 `tokenizer.ggml.model`, `tokenizer.ggml.tokens` 等中介資料存放; 對話範本也在檔內 (`tokenizer.chat_template`) | GGUF 規格文件 |

Tokenizer 必須和權重相符. Transformers 文件提到, 類別設定不相符時會產生錯誤的 token 編號 (來源: Transformers 文件 Tokenizers). 對話範本 (chat template) 也存放在 Tokenizer 設定中; vLLM 要求模型的 Tokenizer 設定內含對話範本, 否則對話請求會失敗, 須以 `--chat-template` 另外指定 (來源: vLLM 文件 Online serving). 因此, 自行轉檔或量化的模型, 要確認 Tokenizer 與對話範本隨權重一起正確轉出.

token 編號之後, 模型以嵌入矩陣 (embedding matrix) 把每個編號對應成一個向量, 也就是一串固定長度的數字. 這個矩陣是權重的一部分, 由訓練學出來: Transformer 原始論文以「學習而得的嵌入」把輸入與輸出 token 轉成固定維度的向量 (來源: Vaswani 等人 2017 年論文第 3.4 節). 模型各層的運算都以這些向量為輸入, 最後再換回 token 編號, 由 Tokenizer 還原成文字.

```
文字 → Tokenizer 切分 → token 編號 → 嵌入矩陣 → 向量
     → 模型各層運算 → 下一個 token 的機率 → 選出 token 編號
     → Tokenizer 還原 → 文字 (重複到結束)
```

讀者通常不必直接操作 Tokenizer; 推論伺服器會自動處理. 需要留意的情況只有兩種: 自行轉檔或量化模型, 以及更換對話範本 (見 [M1.10 節](/build/m1-inference)).

**對應架構圖**: 推論伺服器內部的處理步驟; 模型存放區裡和權重一起入庫的 Tokenizer 檔案.

## K1.4 推論伺服器: 載入權重, 計算輸出, 提供 API

推論伺服器 (inference server) 是讓其他程式能呼叫模型的服務. 它的工作有四件:

1. 從磁碟載入權重到 GPU 或 CPU 記憶體.
2. 收到請求時執行 Tokenizer, 套用對話範本.
3. 計算輸出, 逐一產生 token.
4. 以 HTTP API 回傳結果; 三個常見引擎都提供 OpenAI 相容 API, 因此介面, 閘道與自動化工具可以用同一種方式呼叫.

三個引擎的定位不同:

| 引擎 | 官方自述的重點 | 本手冊建議的用途 |
|---|---|---|
| Ollama | 支援 OpenAI API 的子集, 包含 `/v1/chat/completions` 與 `/v1/embeddings`, 本機預設位址 `http://localhost:11434/v1/` (Ollama 文件 OpenAI compatibility) | 個人, 最快開始 |
| llama.cpp (llama-server) | 以 C/C++ 撰寫的輕量 HTTP 伺服器, 在 GPU 與 CPU 執行 F16 與量化模型, 提供 OpenAI 相容的 chat completions, responses 與 embeddings 路徑, 支援多使用者平行解碼與 continuous batching (llama.cpp server README) | 個人或低階硬體, 想精細控制參數 |
| vLLM | 以 PagedAttention 管理注意力運算的記憶體, 持續批次處理請求, 官方標榜高吞吐量; 支援 NVIDIA, AMD GPU 與多種 CPU (vLLM 文件首頁) | 企業或多人並行 |

「本手冊建議的用途」一欄依架構決定整理 (信心: 中高, 屬整理者判斷). 安裝與加固步驟見 [M1](/build/m1-inference).

**對應架構圖**: VM 推論區的 vLLM (個人或低階硬體用 Ollama 或 llama.cpp), 只接受閘道區連線.

## K1.5 嵌入模型與向量: 「問自己的文件」需要另一個模型

對話模型不知道讀者自己的文件內容. 要讓它依文件回答, 系統要先找出相關段落, 再把段落放進上下文, 這就是檢索增強生成 (RAG). 找段落這一步需要嵌入模型 (embedding model).

嵌入模型的輸出不是文字, 而是向量. Ollama 文件說明, 嵌入會把文字轉成數值向量, 可存入向量資料庫, 用於語意搜尋與檢索; 向量長度依模型而定, 常見為 384 至 1,024 維, 並建議以餘弦相似度 (cosine similarity) 比較 (來源: Ollama 文件 Embeddings). 意思相近的兩段文字, 向量也會相近, 因此用問題的向量去找最接近的段落向量, 就能找出可能含有答案的段落.

```
建庫: 文件 → 切段 → 嵌入模型 → 向量 → 存入向量庫 (Qdrant)
提問: 問題 → 嵌入模型 → 向量 → 向量庫找出相近段落
     → 段落與問題一起交給對話模型 → 附出處的回答
```

兩點限制要先知道:

- **建庫與查詢必須用同一個嵌入模型** (來源: Ollama 文件 Embeddings). 更換嵌入模型就要重建整個向量庫, 見 [M4](/build/m4-retrieval).
- **嵌入模型通常比對話模型小很多**, 可以和對話模型放在同一台推論伺服器 (推論, 信心: 中高; 大小比較見 M4.2 節).

**對應架構圖**: 推論區的嵌入模型, 入口區的 Docling (文件解析) 與 Qdrant (向量庫), 組裝見 [M4](/build/m4-retrieval).

## K1.6 推論, 微調與預訓練的差異

三者都會用到權重, 但做的事與成本差距很大.

| 工作 | 做什麼 | 成本與硬體 | 誰需要 |
|---|---|---|---|
| 推論 (inference) | 用既有權重產生回答, 權重不變 | 只需放得下權重與上下文的記憶體 (K2) | 幾乎所有讀者 |
| 微調 (fine-tuning) | 以少量資料調整既有模型, 權重會改變 | LoRA 論文指出, 相較於以 Adam 完整微調 GPT-3 175B, LoRA 可把可訓練參數減少 10,000 倍, GPU 記憶體需求減為三分之一 (Hu 等人 2021 年論文) | 少數讀者, 有固定格式或領域用語需求時 |
| 預訓練 (pretraining) | 從零開始以大量文字訓練出權重 | Meta 公布 Llama 3.1 系列約使用 15 兆 token 的公開資料, 三個尺寸合計約 3,930 萬 H100 GPU 小時, 其中 8B 模型約 146 萬 GPU 小時 (Llama 3.1 模型卡) | 極少數組織 |

多數需求用提示與檢索 (K1.5 節) 即可解決, 仍不足時才考慮微調 (信心: 中高). 判斷流程見 [T1](/train/t1-decide).

**對應架構圖**: 架構圖只涵蓋推論. 微調與預訓練不在圖上; 微調後的權重仍要經過模型入庫流程 (M3) 才能上線.

## K1.7 權重會記住部分訓練資料, 地端模型也一樣

模型在訓練時學到的知識存在權重裡, 而權重也可能記住部分訓練資料的原文. Carlini 等人 2021 年發表於 USENIX Security 的論文, 只靠查詢 GPT-2 就擷取出數百段逐字相同的訓練文字, 內容包含公開的個人識別資訊 (姓名, 電話, 電子郵件), IRC 對話, 程式碼與 128 位元 UUID; 有些序列在訓練資料中只出現在一份文件裡, 而且較大的模型比較小的模型更容易洩漏 (來源: 該論文摘要).

這對地端部署有兩個意涵:

- **地端模型帶著同樣的知識與記憶**. 下載到本機的權重, 和在雲端執行時是同一組數字. 自架不會讓模型「忘記」訓練資料, 也不會讓它自動知道讀者的內部資料.
- **地端與雲端的差別在「在哪裡跑」**. 自架改變的是輸入 (提示, 文件, 對話紀錄) 由誰處理, 存在哪裡, 而不是模型知道什麼 (信心: 高).

因應方向: 模型輸出若可能含個人資料或第三方內容, 無論地端或雲端都要保留人工檢視; 輸入端的保護則靠存取控制與紀錄保存政策 (見 [K6](/know/k6-security) 與 [M6](/build/m6-observability)).

**對應架構圖**: 整張圖的資料流; 稽核區 (Langfuse) 保存的是輸入與輸出紀錄, 不是權重內的知識.

## K1.8 本機與雲端的取捨

地端不預設優於雲端. 下表整理四個面向的判斷方向, 屬整理者推論 (信心: 中):

| 面向 | 地端較有利的情況 | 雲端較有利的情況 |
|---|---|---|
| 隱私 | 內部規範或合約要求輸入資料留在自己的環境內 | 資料可交給具備相應合約保證的雲端服務 |
| 成本 | 用量長期穩定且高, 能攤提硬體 | 用量小或波動大, 按量計費較划算 |
| 品質 | 開放權重模型的能力已足以完成自己的任務 | 任務需要雲端旗艦模型的能力 |
| 維運負擔 | 有人每週檢查安全公告, 備份與升級 | 沒有固定維運人員 |

品質的差距要用自己的題目實測, 不要只看排行榜 (見 [M6](/build/m6-observability)). 維運負擔容易低估 (推論, 信心: 中): 自架之後, 安全公告, 版本鎖定與備份都由讀者自己負責 (見 [O1 至 O3](/ops/backup)). 混合做法也可行: 機敏任務走地端模型, 其餘任務經閘道轉送雲端 API.

完整判斷見[一頁決策摘要](/decide/summary), [決策樹](/decide/should-self-host)與[成本試算表](/decide/tco).

**對應架構圖**: 閘道區的 LiteLLM 同時連接地端推論區與雲端 API, 是混合做法的切換點 (見 [M5](/build/m5-gateway-identity)).

## 參考來源

- [Hugging Face Tokenizers 文件: Quicktour](https://huggingface.co/docs/tokenizers/quicktour)
- [Hugging Face Transformers 文件: Tokenizers (fast tokenizers)](https://huggingface.co/docs/transformers/main/en/fast_tokenizers)
- [Hugging Face Transformers 文件: GGUF](https://huggingface.co/docs/transformers/main/en/gguf)
- [Hugging Face 模型庫檔案列表: openai/gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b/tree/main)
- [GGUF 規格文件 (ggml-org/ggml)](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md)
- [Vaswani 等人 (2017), Attention Is All You Need](https://arxiv.org/html/1706.03762v7)
- [Ollama 文件: Context length](https://docs.ollama.com/context-length)
- [Ollama 文件: OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility)
- [Ollama 文件: Embeddings](https://docs.ollama.com/capabilities/embeddings)
- [llama.cpp server README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [vLLM 文件首頁](https://docs.vllm.ai/en/latest/)
- [vLLM 文件: Online serving](https://docs.vllm.ai/en/latest/serving/online_serving/)
- [Hu 等人 (2021), LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
- [Llama 3.1 模型卡 (meta-llama/llama-models)](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md)
- [Carlini 等人 (2021), Extracting Training Data from Large Language Models, USENIX Security 2021](https://www.usenix.org/conference/usenixsecurity21/presentation/carlini-extracting)
- [同上論文 arXiv 版](https://arxiv.org/abs/2012.07805)
