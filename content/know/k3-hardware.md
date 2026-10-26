# K3 硬體選購

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: 等級 E, F 的規格門檻尚未定義; 各等級可跑的模型大小為依 K2 公式的估算, 未實測; 價格見[硬體價格頁](/ref/hardware-prices), 本章不寫價格; K3.4 節的 KV 快取欄位語意與各配置的並行表現為推論, 未實測
:::

**結論**: 預算有限時, 先買「更大的顯示記憶體 (或統一記憶體)」, 再考慮運算速度. 記憶體決定能不能跑, 運算速度只決定跑得多快 (信心: 高).

## K3.1 等級 A 至 F 的能力邊界

下表依 [K2](/know/k2-quantization)的公式估算 4 位元量化模型的大致落點. 結果為推論 (信心: 中), 未實測; 實際能否執行, 還取決於上下文長度與同時使用人數.

| 等級 | 記憶體條件 | 較可能的落點 (4 位元量化, 推論) | 建議架構 |
|---|---|---|---|
| A | 無獨立顯示卡, 以系統記憶體運算 | 數十億參數以下的小模型, 速度較慢 | [最小組合](/build/overview) |
| B | 8 至 12GB 顯示記憶體 | 約 8B 級模型餘裕較大; 約 14B 級須壓低上下文 | 最小組合 |
| C | Apple Silicon, 統一記憶體 | 依記憶體容量而定, 16GB 與 32GB 以上差異大 | 16GB 用最小組合; 32GB 以上可用標準組合 |
| D | 16GB 顯示記憶體 | 約 14B 級餘裕較大; 約 30B 以上通常放不下 | 標準組合 |
| E | 待 K3 補充門檻 | 同 D, 並有餘裕同時載入嵌入模型 | 標準組合 |
| F | 待 K3 補充門檻 | 較大的模型或多人同時使用 | 進階組合 (須有人每週維運) |

## K3.2 記憶體優先的選購順序

1. **容量**: 先確認想跑的模型加 KV cache 放得進去 (K2).
2. **記憶體頻寬**: 產生文字的速度常受記憶體頻寬限制, 而非純運算能力 (信心: 中高, 屬一般經驗).
3. **驅動與軟體支援**: Ollama 的 NVIDIA 支援要求運算能力 (compute capability) 5.0 以上, 驅動版本 550 以上; 運算能力 5.0 至 6.2 的舊卡須驅動 570 以上 (來源: Ollama 文件 GPU). AMD 與 Apple 的支援見 [M1.4 節](/build/m1-inference).
4. **電源, 散熱與機殼空間**: 高階顯示卡對電源供應器與機殼有要求, 購買前核對規格書 (信心: 高, 屬一般經驗).
5. **價格時機**: DRAM 與 GPU 價格波動大, 以[價格頁](/ref/hardware-prices)的查價日期為準, 不憑舊資料決定.

升級既有電腦與另購整機之間, 差異主要在顯示記憶體能否增加. 若現有機器的主機板, 電源與機殼都能容納較大的顯示卡, 升級通常較省 (信心: 低, 屬推論).

## K3.3 台灣通路與二手風險

價格與通路資訊放在[硬體價格頁](/ref/hardware-prices), 每筆須有來源與查價日期, 目前該頁尚無內容.

購買二手顯示卡時, 建議逐項檢查 (信心: 中, 屬一般經驗):

- [ ] 收到後立即用 `nvidia-smi` 確認型號與顯示記憶體容量與賣方標示相符.
- [ ] 連續跑一段時間的推論或壓力測試, 觀察溫度與是否降頻或當機.
- [ ] 確認保固剩餘期間與可否退換.
- [ ] 確認驅動仍在支援清單內 (見上述 Ollama GPU 支援條件).
- [ ] 外觀與風扇狀況, 是否有拆修痕跡.
- [ ] 避免來源不明且價格明顯低於市場的商品.

## K3.4 範例: 同時常駐 3 個 30B 至 35B 級模型

**結論**: 單機要同時常駐 3 個約 35B 的模型, 目前最穩的選擇是 1 張 96GB 的 NVIDIA RTX PRO 6000 搭配 4 位元量化, 或 2 張同款卡搭配 FP8. 統一記憶體機種 (NVIDIA GB10 系列, AMD Strix Halo, Apple Mac Studio) 容量夠, 但記憶體頻寬較低, 較適合低併發; 多人同時使用時, 頻寬與推論軟體的成熟度比容量更常成為瓶頸 (信心: 中, 屬推論). 預算區間見[硬體價格頁](/ref/hardware-prices), 2026 年記憶體漲價使各選項價格都明顯上升, 且多數官方通路缺貨, 採購前請以當月報價為準.

這個範例對應[架構地圖](/start/map)的情境: LiteLLM 同時接雲端模型與地端模型, 地端常駐 3 個約 35B 的模型, 推論伺服器的做法見 [M1.11 節](/build/m1-inference), 路由與備援見 [M5.5 節](/build/m5-gateway-identity).

### 先決定三件事

| 決定 | 選項 | 對硬體的影響 |
|---|---|---|
| 模型型態 | 密集 (dense) 或 MoE (混合專家) | MoE 每個 token 只讀取啟用的參數 (例如總參數 30B 左右, 啟用 3B 至 4B), 對頻寬的需求低很多; 但權重仍須全部放進記憶體, 容量以總參數計 |
| 精度 | BF16, FP8, 4 位元 | 每降一級, 權重約減半; 4 位元的品質損失依模型與任務而異, 上線前須用自己的測試集比較 (M6) |
| 並行與上下文 | 同時多少人, 單次多長 | 決定 KV 快取大小, 常是容量的第二大項 |

### 約 30B 至 35B 級的候選模型

下表只列官方模型卡可核對的資料 (2026-10-26 擷取); 實際選型應考慮授權, 語言能力與任務表現, 並以自己的測試集驗證.

| 模型 | 型態 | 總參數 / 啟用參數 | 授權 | 備註 |
|---|---|---|---|---|
| google/gemma-4-31B-it | 密集 | 30.7B | Apache-2.0 | 60 層, 上下文 262,144 |
| Gemma 4 26B A4B (同一張模型卡所列變體) | MoE | 25.2B / 3.8B | Apache-2.0 | 128 個專家, 每 token 啟用 8 個加 1 個共享專家 |
| nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | Mamba2 與 Transformer 混合的 MoE | 30B / 3.5B | NVIDIA Open Model License (模型卡稱可商用, 其餘條款須讀授權全文) | 支援至 1M 上下文, 預設設定 256K |
| mistralai/Magistral-Small-2509 | 模型卡未載明 | 24B | Apache 2.0 | 低於 30B 範圍, 供對照; 上下文 128k |
| openai/gpt-oss-20b | MoE | 21B / 3.6B | Apache 2.0 | 低於 30B 範圍, 供對照; MoE 權重為 MXFP4, 模型卡稱可在 16GB 記憶體執行 |

資料來源: 各模型的 Hugging Face 官方模型卡 (見本章參考來源). 授權欄只是摘要, 對外提供服務前請讀授權全文並對照[授權紅旗](/decide/license-flags).

### 權重需要多少記憶體

公式: 權重 (GB) = 參數量 x 每個參數的位元數 / 8 / 10^9. 下表以 35B 為上限估算 (實際的 30B 至 32B 級模型約再小一成); GGUF 的 Q4_K_M 與 Q8_0 約為每參數 4.8944 與 8.5008 位元 (來源: llama.cpp 量化說明, 該數字以 Llama-3.1-8B 量測, 套用到其他模型為近似).

| 精度 | 算式 | 1 個 35B | 3 個 35B |
|---|---|---|---|
| BF16 / FP16 | 35 x 16 / 8 | 70GB | 210GB |
| FP8 / INT8 | 35 x 8 / 8 | 35GB | 105GB |
| GGUF Q8_0 | 35 x 8.5008 / 8 | 37.2GB | 111.6GB |
| GGUF Q4_K_M | 35 x 4.8944 / 8 | 21.4GB | 64.2GB |
| AWQ / GPTQ 4 位元 | 35 x 4 / 8 (理論下限) | 17.5GB, 另加縮放與零點資料 | 52.5GB |

AWQ 與 GPTQ 的實際額外開銷, 以及 FP8 的縮放係數開銷, 本輪查無官方數字, 上表為未含開銷的下限. 以單張 96GB 的卡檢視: 3 個 FP8 共 105GB, 放不下; 3 個 Q4_K_M 共 64.2GB, 剩約 31.8GB, 還要再扣 CUDA 執行環境與啟用記憶體 (推算, 信心: 中).

### KV 快取需要多少記憶體

公式 (來源: PagedAttention 論文對 KV 快取大小的計算, 並依分組查詢注意力 GQA 的定義, 把隱藏維度換成 KV heads 與 head_dim 的乘積; 換算為整理者推導): 每個 token 的 KV 位元組數 = 2 x 層數 x KV heads x head_dim x 每個元素的位元組數; 總量 = 該值 x 上下文長度 x 同時處理的序列數.

下表以官方 `config.json` 的欄位計算 FP16 的 KV 快取; 同一表也示範混合注意力架構, 只有完整注意力層的 KV 會隨上下文長度成長.

| 模型 (config.json) | 欄位 | 算式 | 每個 token | 每 1K token |
|---|---|---|---|---|
| Mistral-Small-3.2-24B-Instruct-2506 | 40 層, 8 KV heads, head_dim 128 | 2 x 40 x 8 x 128 x 2 | 160 KiB | 160 MiB |
| gemma-4-31B-it, 完整注意力層 | 10 層 (共 60 層, 其餘 50 層為滑動視窗), 全域 KV heads 4, 全域 head_dim 512 | 2 x 10 x 4 x 512 x 2 | 80 KiB | 80 MiB |
| gemma-4-31B-it, 滑動視窗層 | 50 層, KV heads 16, head_dim 256, 視窗 1,024 token | 2 x 50 x 16 x 256 x 2 | 800 KiB, 但超過視窗後不再增加 | 每條序列固定約 800 MiB |

Gemma 4 的欄位 (`global_head_dim`, `num_global_key_value_heads`) 語意為整理者依欄位名稱解讀, 推論引擎實際的配置方式須實測 (信心: 中低). 以 Mistral 的數字示範容量: 4 條序列各 32K token, 共 131,072 token, FP16 約 20GiB; 若 vLLM 的 KV 快取改用 FP8 (`--kv-cache-dtype fp8`), 每個元素 1 位元組, 約減半為 10GiB. vLLM 文件說明, 預設 FP8 在沒有校準時縮放係數為 1.0, 建議用 llm-compressor 校準, 並未提供準確度數字 (來源: vLLM 文件 Quantized KV Cache).

### 硬體選項與適合度

下表比較能同時容納 3 個 35B 級模型的配置. 價格見[硬體價格頁](/ref/hardware-prices); 適合度為整理者依規格的推論, 不是實測.

| 配置 | 記憶體與頻寬 | 3 個 35B 級的放法 | 多人並行 | 主要限制 |
|---|---|---|---|---|
| 1 張 RTX PRO 6000 Blackwell | 96GB GDDR7, 1,792GB/s, Workstation 版 600W, Max-Q 版 300W | 3 個 4 位元可放入, 餘約 32GB 給 KV 快取; 3 個 FP8 放不下 | 高 (信心: 中) | 價格高且缺貨; 支援 MIG 最多 4 個實例 (NVIDIA 官方頁面, 每個實例的記憶體大小查無) |
| 2 張 RTX PRO 6000 Blackwell | 共 192GB | 3 個 FP8 (105GB) 可放入, 餘約 87GB 給 KV 快取 | 高 | 電源與機箱要求更高; 兩卡間的通訊走 PCIe, 張量平行的效率須實測 |
| 2 張 RTX PRO 5000 72GB | 共 144GB, 單卡 1,344GB/s, 300W | 3 個 FP8 可放入, 餘約 39GB | 中 | 72GB 版本的價格查無 |
| NVIDIA GB10 整機 (DGX Spark 與各家 OEM) | 128GB 統一記憶體, 273GB/s | 3 個 MoE 的 4 位元可放入; 密集模型不適合 | 中 (MoE) 至低 (密集) | 頻寬低: 第三方評測 (LMSYS, 轉引自 issoh) 的 70B 密集 FP8 解碼僅約 2.7 tokens/s; 無 MIG |
| AMD Ryzen AI Max+ 395 (Strix Halo) 128GB | 統一記憶體, 理論 256GB/s, 實測約 212 至 215GB/s | 3 個 MoE 的 4 位元可放入 | 低至中 | vLLM 支援靠社群維護的 toolbox, 盡力支援; Vulkan 後端在提示超過約 4,000 token 時明顯變慢 |
| Apple Mac Studio M5 Ultra 256GB 或 512GB | 統一記憶體, 約 1.2TB/s | 容量充裕 | 中 (推論, Ultra 的並行基準查無) | vllm-metal 的並行服務於 2026-09 才推出, 其基準只測到 M5 Pro 且最大 64GB |
| 3 張 RTX 5090 32GB | 共 96GB, 單卡 TGP 575W | 每個模型一張卡, 4 位元可放入, 但 KV 空間小 | 低 | 無 NVLink, GeForce 50 系列的 GPU 之間 P2P 不支援 (NVIDIA 論壇代表), 三卡共約 1,725W |
| 二手 RTX 3090 / 4090 (24GB) | 單卡 24GB | 需 3 張以上, 且 24GB 放不下 35B 的 FP8 | 低 | 功耗與機箱成本高; 4090 的 48GB 改版卡來源不明, 保固與可靠度無保障, 不建議 |

資料來源: NVIDIA 與 Apple 官方規格頁, 第三方評測與媒體 (見本章參考來源). 此表的適合度評級屬整理者推論.

### 依情境的建議

| 情境 | 建議配置 | 理由 (推論, 信心: 中) |
|---|---|---|
| 個人或 2 至 3 人的 PoC, 以 MoE 為主 | GB10 整機, Strix Halo 128GB, 或 Mac Studio | 容量夠, 預算較低; 低併發下頻寬限制較不明顯 |
| 小團隊日常使用, 3 個模型常駐 | 1 張 RTX PRO 6000 (96GB), 4 位元量化或 MoE | 單機即可常駐, 頻寬高, vLLM 支援最完整 |
| 要 FP8 品質, 或長上下文, 或較多人同時使用 | 2 張 RTX PRO 6000, 或把 3 個模型分到 2 台機器 | 容量與 KV 空間充裕; 分機可避免同時預填互相拖慢 |

三個模型分在不同機器時, LiteLLM 依 `model_name` 分流 (M5.5 節), 單機故障時只影響其中一個模型. 主機其他零組件 (CPU, 主機板, 系統記憶體, 電源, 機箱, 儲存) 不在本節估算內; 使用 vLLM 的 sleep mode Level 1 時, CPU 記憶體須容納被移出的權重 (來源: vLLM 文件 Sleep Mode).

## 研究 1 的分級依據

等級定義來自研究 1 (待以第一手報價核對): A 無獨顯筆電; B 8 至 12GB 顯示記憶體的遊戲電腦; C Apple Silicon Mac; D 16GB 顯示卡升級; E, F 依預算區分. 預算區間見價格頁.

## 參考來源

模型卡與設定 (官方):

- [google/gemma-4-31B-it](https://huggingface.co/google/gemma-4-31B-it) 與其 [config.json](https://huggingface.co/google/gemma-4-31B-it/raw/main/config.json)
- [nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16](https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16)
- [mistralai/Magistral-Small-2509](https://huggingface.co/mistralai/Magistral-Small-2509)
- [mistralai/Mistral-Small-3.2-24B-Instruct-2506 config.json](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506/raw/main/config.json)
- [openai/gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b)

軟體文件 (官方):

- [vLLM 文件: Quantized KV Cache](https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache/)
- [vLLM 文件: Sleep Mode](https://docs.vllm.ai/features/sleep_mode.html)
- [llama.cpp: quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md)
- [llama.cpp: multi-GPU](https://github.com/ggml-org/llama.cpp/blob/master/docs/multi-gpu.md)
- [Ollama 文件: GPU support](https://docs.ollama.com/gpu)
- [PagedAttention 論文 (arXiv 2309.06180)](https://arxiv.org/pdf/2309.06180)
- [GQA 論文 (arXiv 2305.13245)](https://arxiv.org/abs/2305.13245)

硬體規格 (廠商官方):

- [NVIDIA: RTX PRO 6000 Blackwell 家族](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000-family/)
- [NVIDIA: RTX PRO 6000 Blackwell 工作站](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/)
- [NVIDIA: RTX PRO 5000 Blackwell](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-5000/)
- [NVIDIA: GeForce RTX 5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/)
- [Apple: Mac Studio 技術規格](https://www.apple.com/tw/mac-studio/specs/)
- [NVIDIA 開發者論壇: P2P issue using two RTX 5090 GPUs](https://forums.developer.nvidia.com/t/p2p-issue-using-two-rtx-5090-gpus/326776) (廠商代表回覆, 非正式規格文件)

第三方評測與媒體 (二手來源):

- [issoh: DGX Spark 與 GB10 機種評測](https://www.issoh.co.jp/tech/details/9498/) (轉引 LMSYS 的解碼速度)
- [starryhope: Strix Halo local LLM inference 2026](https://www.starryhope.com/minipcs/strix-halo-local-llm-inference-2026/)
- [kyuz0: amd-strix-halo-vllm-toolboxes](https://github.com/kyuz0/amd-strix-halo-vllm-toolboxes)
- [vLLM 部落格: vllm-metal v0.28.0](https://vllm.ai/blog/2026-09-22-vllm-metal-v0-28-0)
- [InsiderLLM: multi-GPU local AI](https://insiderllm.com/guides/multi-gpu-local-ai/)
- [HotHardware: GeForce RTX 4090 48GB 改版卡](https://hothardware.com/news/geforce-rtx-4090-48gb-vram-mod)

等級定義 (A 至 F) 與前三節的選購原則屬整理者依研究 1 與一般經驗的判斷 (內部研究紀錄, 非公開來源); 價格來源見[硬體價格頁](/ref/hardware-prices).
