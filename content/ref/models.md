---
description: "挑模型先看記憶體放不放得下, 再看授權, 最後才看能力."
---

# 模型建議 (含繁體中文)

::: info 本章屬性
- 等級: 參考資料
- 實機驗證: 未進行 (需實機確認: 各等級模型的實際記憶體用量與繁體中文表現)
:::

**結論**: 挑模型先看記憶體放不放得下, 再看授權, 最後才看能力. 8 至 12GB 顯示記憶體可從 8B 級模型開始; 16GB 放約 14B 級餘裕較大 (與 K3.1 節一致); 24B 至 32B 級要 24GB 以上, 其中 30B 級在 24GB 時上下文須壓低. 需要繁體中文表現時, TAIDE 與聯發創新基地的 Breeze 2 是以繁體中文資料訓練的選項, 但授權各有條件; 國際模型的模型卡多半沒有繁體中文評測, 導入前請用自己的題目實測.

::: tip 本頁常見名詞
| 詞 | 意思 |
|---|---|
| 模型卡 (model card) | 模型發布頁上的說明文件, 寫明參數量, 授權, 支援語言與評測 |
| 參數量 (B) | 模型的大小, 8B 約 80 億個參數 (見 [K1](/know/k1-basics)) |
| 量化 (Q4_K_M 等) | 把模型存得粗一點, 檔案變小; Q4_K_M 是常見的 4 位元 GGUF 格式 (見 [K2](/know/k2-quantization)) |
| MoE (混合專家) | 每次只啟用一部分參數的模型; 速度較快, 但權重仍要全部放進記憶體 |
| gated model | 下載前須登入並同意條款的模型 |
| `trust_remote_code` | 載入模型時執行模型倉庫附帶的程式碼, 須先審查 (見 [M3](/build/m3-model-intake)) |

完整詞彙見[術語對照](/ref/glossary).
:::

## 依硬體等級: 先算放不放得下

挑模型像搬家前量家具: 先確認放得進去, 再談好不好用. 下表把本手冊的硬體等級 (定義見[使用說明](/start/usage)與 [K3.1 節](/know/k3-hardware)) 對應到可以起步的模型. 「4 位元權重約」一欄依 K3 的算式估算: 參數量 x 4.8944 位元 / 8 (llama.cpp 以 Llama-3.1-8B 量測的 Q4_K_M 平均位元數, 套用到其他模型為近似). 這只是權重大小, 實際還要加上 KV cache 與執行環境, 所以記憶體要留餘裕 (推論, 信心: 中).

| 等級 | 記憶體條件 | 起步模型 | 參數量 | 4 位元權重約 | 授權 |
|---|---|---|---|---|---|
| A | 無獨立顯示卡 | [microsoft/Phi-4-mini-instruct](https://huggingface.co/microsoft/Phi-4-mini-instruct/blob/main/README.md) | 3.8B | 2.3GB | MIT |
| A | 同上 | [google/gemma-4-E2B-it](https://huggingface.co/google/gemma-4-E2B-it) | 有效 2.3B (含嵌入層 5.1B) | 3.1GB (以 5.1B 計) | Apache 2.0 |
| B | 8 至 12GB 顯示記憶體 | [meta-llama/Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct) | 8B | 4.9GB | Llama 3.1 Community License |
| B | 同上 (繁體中文) | [MediaTek-Research/Llama-Breeze2-8B-Instruct](https://huggingface.co/MediaTek-Research/Llama-Breeze2-8B-Instruct) | 8B | 4.9GB | Llama 3.2 Community License |
| C | Apple Silicon 16GB | 同等級 B | - | - | - |
| D | 16GB 顯示記憶體 (或 Apple Silicon 32GB 以上) | [taide/Gemma-3-TAIDE-12b-Chat-2602](https://huggingface.co/taide/Gemma-3-TAIDE-12b-Chat-2602) (繁體中文) | 12.4B | 7.6GB | (Gemma 版次)-TAIDE 模型授權條款 |
| D | 同上 | [google/gemma-4-12B-it](https://huggingface.co/google/gemma-4-12B-it) | 11.95B | 7.3GB | Apache 2.0 |
| D | 同上 | [openai/gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b) | 21B, 每 token 啟用 3.6B (MoE) | 模型卡稱 MoE 權重以 MXFP4 (一種 4 位元浮點量化格式) 訓練後量化, 可在 16GB 記憶體內執行 | Apache 2.0 |
| E | 24GB 以上, 未滿 48GB 顯示記憶體 | [mistralai/Mistral-Small-3.2-24B-Instruct-2506](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506) | 24B | 14.7GB | Apache 2.0 |
| E | 同上 | Gemma 4 26B A4B (見 [Gemma 4 模型卡](https://huggingface.co/google/gemma-4-31B-it)) | 25.2B, 每 token 啟用 3.8B (MoE) | 15.4GB | Apache 2.0 |
| E | 同上 | [ibm-granite/granite-4.0-h-small](https://huggingface.co/ibm-granite/granite-4.0-h-small) | 32B, 每 token 啟用 9B (MoE) | 19.6GB | Apache 2.0 |
| E | 同上 | [google/gemma-4-31B-it](https://huggingface.co/google/gemma-4-31B-it) | 30.7B | 18.8GB | Apache 2.0 |
| F | 48GB 以上或多卡; 此模型須 80GB | gpt-oss-120b (見 [gpt-oss-20b 模型卡](https://huggingface.co/openai/gpt-oss-20b)) | 117B, 每 token 啟用 5.1B (MoE) | 模型卡稱可放進單張 80GB GPU | Apache 2.0 |

資料來源: 參數量, 授權與記憶體說明取自各模型的 Hugging Face 模型卡 (2026-10-27 擷取); 4 位元權重為整理者依上述算式推算. 等級與模型的對應為整理者推論 (信心: 中), 與 [K3.1 節](/know/k3-hardware)的估算一致: B 級放 8B 級餘裕較大, D 級放約 14B 級餘裕較大, 約 30B 以上通常放不下 16GB. E 級中約 30B 至 32B 級的模型 (權重約 18.4 至 19.6GB) 在 24GB 時已接近或超過 K2 建議的八成上限 (約 19.2GB), 上下文須壓低, 或改用 32GB 以上的配置.

由上表可見, 每升一個等級, 可選的模型大約大一倍. 等級 F 在 48GB 時可讓一個約 30B 至 35B 級的模型保留充足的上下文並服務多人; 同時常駐多個這類模型, 或跑約 70B 級, 需要 64GB 至 96GB 以上 (見 [K3.1 節](/know/k3-hardware)與 K3.4 節, 推論). 實際挑選時要再看三件事:

- **授權**: Llama, Gemma (TAIDE 沿用) 的自訂授權各有條件, 對外提供服務前請依 [K4](/know/k4-licenses) 與[授權速查](/ref/licenses)檢查. Apache 2.0 與 MIT 的限制最少.
- **MoE 的取捨**: MoE 模型每次只啟用一小部分參數, 產生文字較快, 但權重仍要全部放進記憶體, 容量以總參數計 (見 [K3.4 節](/know/k3-hardware)).
- **工具呼叫**: 要讓模型操作工具時, 另看 [K5](/know/k5-tools-agents) 的 BFCL 分數; 通用小模型的多輪表現普遍偏低.

30B 至 35B 級模型的細部比較 (層數, 上下文, KV cache 用量) 見 [K3.4 節](/know/k3-hardware); 資安用途的小型分類與檢索模型 (提示注入偵測, 個資偵測等) 見[開源模型選型](/decide/model-selection); 嵌入與重排序模型見 [M4](/build/m4-retrieval).

## 繁體中文: 模型卡有寫才算數

多數國際模型以英文為主要訓練語言, 模型卡上的「支援語言」清單差異很大, 而且「支援中文」通常沒有區分簡體與繁體. 判斷繁體中文能力時, 本手冊只採用模型卡或官方文件明載的內容, 其餘以自己的題目實測為準.

### 以繁體中文資料訓練的模型

**TAIDE** 是以繁體中文資料訓練的台灣模型系列, 在 Hugging Face 的 taide 組織下發布. 目前最新的對話模型是 Gemma-3-TAIDE-12b-Chat-2602, 以 google/gemma-3-12b-pt 為基底, 約 12.4B 參數, 上下文 128K; 模型卡說明以約 220 億個繁體中文 token 持續預訓練, 並在 NVIDIA H200 上訓練 1,520 GPU 小時. 輸入只接受文字. 模型卡自報 TMMLU+ 平均 58.02, 同表的 Gemma-3-12b-it 為 53.82; 台灣地理與台灣用語兩個子科目分別為 70.05 與 76.11 (來源: 模型卡自報, 2026-10-27 擷取; TMMLU+ 的讀法見[基準分數](/ref/benchmarks)).

取得方式: 模型為 gated model, 須登入 Hugging Face 並接受「(Gemma 版次)-TAIDE 模型授權條款」才能下載, 另附個人資料蒐集告知. 模型卡提供 transformers 與 vLLM 的載入範例, 建議以 bfloat16 執行. 國研院 TAIDE 網站公布的 Gemma-TAIDE 條款授予非專屬, 全球, 無償的使用授權, 條文未設使用者數或營收門檻; 散布時須附 Gemma Terms of Use 聲明並標示源自 TAIDE, 不得用於軍事或非法目的, 條款修訂於發布時立即生效. 條款要點與連結見[授權速查](/ref/licenses). 同一組織也發布 Llama-3.1-TAIDE-LX-8B-Chat 等較早版本, 以及以台灣法規文本微調的嵌入模型 embeddinggemma-GTAIDE-300m-2605 (見[基準分數](/ref/benchmarks)的例子).

**Breeze 2** 是聯發創新基地 (MediaTek Research) 以 Llama 3.2 為基底, 以繁體中文資料持續預訓練的模型系列, 有 3B 與 8B 兩種大小, 並加入影像理解與函式呼叫能力 (來源: Breeze 2 論文 arXiv 2501.13921). 模型卡標示授權為 Llama 3.2 Community License. 要注意的是, 模型卡的載入範例須開啟 `trust_remote_code`, 函式呼叫還須搭配聯發創新基地的 `mtkresearch` 套件; 依 [M3](/build/m3-model-intake) 的入庫流程, 須先審查模型倉庫附帶的程式碼才能使用. 模型卡本身沒有列出評測分數.

### 國際模型的中文支援 (依模型卡)

| 模型 | 模型卡對語言的說明 |
|---|---|
| Phi-4-mini-instruct | 列出 23 種語言, 含中文; 同時說明英文以外的語言表現較差 |
| Llama-3.1-8B-Instruct | 正式支援 8 種語言, 不含中文; 說明訓練資料涵蓋更多語言 |
| Gemma 4 系列 | 開箱支援 35 種以上語言, 以 140 種以上語言預訓練; 未列出語言清單 |
| granite-4.0-h-small | 列出 12 種語言, 含中文 |
| Mistral-Small-3.2-24B | 標示 24 種語言, 未列出清單 |
| gpt-oss-20b / 120b | 模型卡未說明支援語言 |

資料來源: 各模型的 Hugging Face 模型卡 (2026-10-27 擷取). 由上表可見, 國際模型即使列出中文, 也沒有區分簡體與繁體, 更沒有繁體中文評測. 需要繁體中文輸出的應用, 建議在 TAIDE 或 Breeze 2 與一個國際模型之間, 用自己的 50 題 (做法同 [M4.3 節](/build/m4-retrieval)) 比較用詞是否符合台灣習慣與答案是否正確 (整理者建議, 信心: 中).

## 參考來源

模型卡 (官方, 2026-10-27 擷取):

- [Hugging Face 模型卡: microsoft/Phi-4-mini-instruct](https://huggingface.co/microsoft/Phi-4-mini-instruct/blob/main/README.md)
- [Hugging Face 模型卡: google/gemma-4-E2B-it](https://huggingface.co/google/gemma-4-E2B-it)
- [Hugging Face 模型卡: google/gemma-4-31B-it](https://huggingface.co/google/gemma-4-31B-it) (Gemma 4 家族表: E2B, E4B, 12B, 26B A4B, 31B)
- [Hugging Face 模型卡: google/gemma-4-12B-it](https://huggingface.co/google/gemma-4-12B-it) (Google 發布, Apache 2.0, 11.95B 參數, 基底為 google/gemma-4-12B; 2026-10-27 擷取)
- [Hugging Face 模型卡: meta-llama/Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct)
- [Hugging Face 模型卡: openai/gpt-oss-20b](https://huggingface.co/openai/gpt-oss-20b) (含 gpt-oss-120b 的參數與記憶體說明)
- [Hugging Face 模型卡: mistralai/Mistral-Small-3.2-24B-Instruct-2506](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506)
- [Hugging Face 模型卡: ibm-granite/granite-4.0-h-small](https://huggingface.co/ibm-granite/granite-4.0-h-small)

繁體中文模型:

- [Hugging Face 模型卡: taide/Gemma-3-TAIDE-12b-Chat-2602](https://huggingface.co/taide/Gemma-3-TAIDE-12b-Chat-2602) (授權名稱, 取得方式, 訓練資料, TMMLU+ 自報分數)
- [國研院 TAIDE 模型下載與授權條款頁 (Gemma-TAIDE 條款全文)](https://taide.stpi.niar.org.tw/public/download-model)
- [Hugging Face: taide 組織頁](https://huggingface.co/taide) (TAIDE 模型清單)
- [Hugging Face 模型卡: taide/embeddinggemma-GTAIDE-300m-2605](https://huggingface.co/taide/embeddinggemma-GTAIDE-300m-2605)
- [Hugging Face 模型卡: MediaTek-Research/Llama-Breeze2-8B-Instruct](https://huggingface.co/MediaTek-Research/Llama-Breeze2-8B-Instruct) (授權, `trust_remote_code`, 函式呼叫)
- [Hugging Face: Breeze 2 模型集合](https://huggingface.co/collections/MediaTek-Research/breeze-2-family-67863158443a06a72dd29900)
- [Hsu 等人, The Breeze 2 Herd of Models (arXiv 2501.13921)](https://arxiv.org/abs/2501.13921)
- [iThome: 聯發創新基地開源 Breeze 2 (2025-02-17)](https://www.ithome.com.tw/news/167427) (3B 與 8B 的定位)

算式依據:

- 4 位元權重的位元數: [llama.cpp: quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md), 算式見 [K3.4 節](/know/k3-hardware)

整理者判斷 (無外部來源):

- 硬體等級與模型的對應, 4 位元權重的推算值, 「每升一級可選模型約大一倍」, 繁體中文的實測建議, 為整理者推論.
- 文中的類比 (搬家前量家具): 整理者所寫, 無外部來源, 不應當作技術定義引用.
