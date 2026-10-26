# 硬體價格

::: info 本章屬性
- 等級: 參考資料
- 狀態: 可閱讀 (部分資料待核對)
- 資料基準日: 2026-10-26
- 待查證: 台灣現價多數查無, 本頁以美元價為主並標示日期與性質; 部分價格為媒體轉引的二手來源; 主機其他零組件未查價; 價格變動快, 引用前請以當月報價為準
:::

**結論**: 單機同時常駐 3 個約 35B 的模型, 僅計 GPU 或整機本體的預算, 入門約 3,100 至 8,000 美元 (統一記憶體機種, 以 MoE 模型為主), 標準約 11,360 至 16,000 美元 (1 張 96GB 的 RTX PRO 6000), 進階約 22,720 至 32,000 美元 (2 張 RTX PRO 6000). 這些價格不含主機其他零組件, 且 2026 年 DRAM 與 GDDR7 漲價使各選項價格明顯上升 (信心: 高, 依據為 TrendForce 的 DRAM 與 GDDR7 價格報告); 表中多個品項的官方通路標示缺貨 (信心: 中, 依據為表中各列的來源). 配置的選擇邏輯見 [K3.4 節](/know/k3-hardware).

價格表中的統一記憶體機種, 指 CPU 與 GPU 共用同一池記憶體的整機; MoE (Mixture of Experts, 混合專家) 模型每次只啟用一部分參數, 對記憶體頻寬的需求較低, 因此常搭配這類機種 (見 [K3](/know/k3-hardware)). DRAM 是一般電腦的主記憶體, GDDR7 是新一代顯示卡使用的記憶體, 兩者的漲價都直接反映在硬體售價上.

表中品項依角色分為兩類. 第一類是插在主機裡負責模型運算的顯示卡: RTX PRO 系列是 NVIDIA 的工作站顯示卡, GeForce RTX 系列是消費級顯示卡, Radeon AI PRO 是 AMD 的工作站顯示卡. 第二類是本身就是一台完整電腦的統一記憶體整機: DGX Spark 與各廠的 GB10 機種採用 NVIDIA GB10 晶片, Strix Halo 迷你主機與 Framework Desktop 採用 AMD 整合 CPU 與 GPU 的晶片, Mac Studio 是 Apple 的桌上型電腦.

## 查價說明

- **台灣現價**: 本輪查證台灣的 RTX PRO 6000, RTX 5090, DGX Spark 現價皆查無公開資料; 下表以美元價為主, 台灣價只列查得到的項目並標示來源.
- **價格性質**: 「官方掛牌」指廠商官方商店的標價, 缺貨時不代表買得到; 「通路價」指零售或經銷商標價; 「二手刊登價」不是成交價; 「次級來源」指媒體或部落格轉引.
- **幣別**: 除註明新台幣 (NT$) 外一律為美元. 本頁不做匯率換算, 請依購買當日匯率自行換算.

## 價格表

### NVIDIA 工作站與消費級顯示卡

| 品項 | 價格 | 查價日期 | 性質與來源 |
|---|---|---|---|
| RTX PRO 6000 Blackwell Workstation | 16,000 (缺貨) | 2026-08-12 | 官方商店掛牌, 非正式建議售價 (letsdatascience 轉引 PCMag 與 Tom's Hardware) |
| 同上 | 13,250 | 2026-06-13 | NVIDIA 商店 (IT之家轉引 Tom's Hardware, 二手來源); 上市價 8,565 (2025-03) |
| 同上 (PNY / Newegg 通路) | 11,359.99 / 12,099.99 | 2026-06-13 | 通路價 (IT之家, 二手來源) |
| RTX PRO 6000 Blackwell Server Edition | 14,999 | 2026-06-13 | 通路價 (IT之家, 二手來源) |
| RTX PRO 6000 台灣 | 現價查無; 2025 年上市前傳聞散裝約 NT$200,000, 盒裝約 NT$270,000 | 2025 | 已過時, 僅供對照 (Techbang) |
| RTX PRO 5000 Blackwell 48GB | 4,199.99 (上市刊價); 二手最低三筆均價 7,040 | 2025-12-28; 2026-10 | 前者通路 (TechRadar), 後者二手 (GPU Poet); 兩者差距大 |
| RTX PRO 5000 72GB | 價格查無 | - | - |
| RTX PRO 4500 Blackwell 32GB | 6,209 (建議售價 5,499) | 日期查無 | 通路 (SHI) |
| GeForce RTX 5090 32GB | 新品 4,288 至 4,381; 二手刊登 3,590 至 4,304 (建議售價 1,999) | 2026-08-07 至 08 | 刊登價非成交價 (BuySellRAM) |
| 同上 (美國網購第三方賣家) | 6,500 至 9,500 開價 (官方通路缺貨) | 2026-09-16 | 次級來源, 開價非成交價; 文中的新台幣金額為美元換算, 不是台灣售價 (科技新報) |
| RTX 3090 二手 | 1,095 至 1,181 (8 月); 1,200 至 1,400 (9 月) | 2026-08 至 09 | 二手刊登價 (BuySellRAM; OpenClawDC) |
| RTX 4090 二手 | 2,350 至 2,500 | 2026-08 至 09 | 二手刊登價 (InsiderLLM) |

### 統一記憶體整機

| 品項 | 價格 | 查價日期 | 性質與來源 |
|---|---|---|---|
| DGX Spark 128GB | 6,950 (缺貨); 上市價 3,999, 2026-02 調為 4,699 | 2026-10-02 | 官方 Marketplace 掛牌 (The Register; implicator; 三處交叉) |
| DGX Spark 64GB | 起價 4,999, 10 月 23 日起僅經 Acer, ASUS, Dell, Gigabyte, HP, MSI 供應 | 2026-10-02 | NVIDIA 公告 (The Register) |
| GB10 OEM 機種 | ASUS GX10 5,999 (1TB) / 7,999 (4TB), 皆缺貨; Dell 5,903; Lenovo 起 5,859; MSI EdgeXpert 7,999; Acer GN100 4,699.99 (缺貨) | 2026-10-16 | 美國通路 (issoh) |
| ASUS GX10 台灣 | NT$97,900 起, 接單生產; 現價查無 | 2025-10-15 | 已過時 (Techbang) |
| Mac Studio M5 Max / M5 Ultra (美國) | M5 Max 起 2,499; M5 Ultra 起 5,499; 256GB 加 16TB 為 18,299 | 2026-08-25 | 官方建議售價 (Macworld) |
| Mac Studio M5 (台灣) | M5 Max 起 NT$84,900; M5 Ultra 起 NT$199,900; 512GB 價格查無 | 2026-09-02 | 次級來源 (mrmad); Apple 台灣規格頁抓取時未顯示價格 |
| Mac Studio M3 Ultra | 512GB 選項已於 2026-03 停售, 最高 256GB; 現是否仍在售查無 | 2026-03-06 | Notebookcheck 轉引 MacRumors |
| Strix Halo 128GB 迷你主機 | BOSGAME M5 約 3,100; Beelink GTR9 Pro 約 4,350; Minisforum MS-S1 MAX 3,799; GMKtec EVO-X3 3,799.99 | 2026-09 | 通路 (starryhope); EVO-X2 現價查無 |
| Framework Desktop 128GB | 2,459 (較前調漲 460); 現價查無 | 2026-01-13 | 官方調價 (Notebookcheck) |
| Radeon AI PRO R9700 32GB | 約 1,950 (經銷商); 上市約 1,299 | 2026-10 | 次級來源 (ComputingForGeeks; Club386) |

## 3 個 35B 級模型的配置預算

表中的 FP8 是以 8 位元浮點數存放權重的格式, 品質接近原始的 16 位元, 但記憶體需求約為 4 位元量化的兩倍 (見 [K2](/know/k2-quantization)). 以下為上表價格的算術加總, 僅含 GPU 或整機本體, 不含 CPU, 主機板, 系統記憶體, 電源, 機箱與儲存 (這些項目未查價, 系統記憶體同樣受 DRAM 漲價影響). 配置的容量與頻寬分析見 [K3.4 節](/know/k3-hardware).

| 檔位 | 配置 | 價格區間 (美元) | 算式 | 適用 |
|---|---|---|---|---|
| 入門 | GB10 整機或 Strix Halo 128GB, 3 個 MoE 模型的 4 位元 | 約 3,100 至 8,000 | Strix Halo 3,100 至 4,350; GB10 OEM 4,699.99 至 7,999 | 個人或 2 至 3 人 PoC, 同時使用人數少 |
| 標準 | 1 張 RTX PRO 6000 (96GB), 4 位元量化 | 11,360 至 16,000 (卡本體) | PNY 11,359.99 (2026-06) 至官方掛牌 16,000 (2026-08, 缺貨) | 小團隊日常使用 |
| 進階 | 2 張 RTX PRO 6000, FP8 | 22,720 至 32,000 (卡本體) | 標準檔的 2 倍 | 要 FP8 品質, 長上下文, 或較多人同時使用 |
| 大容量統一記憶體 | Mac Studio M5 Ultra | 5,499 起; 256GB 加 16TB 為 18,299 | 官方建議售價 (美國); 台灣 M5 Ultra 起 NT$199,900 (次級來源) | 容量需求大, 並行需求低到中 |

這些區間只涵蓋地端硬體. 雲端模型的 API 費用依用量計算, 不在本頁範圍.

## 價格為什麼波動

- TrendForce (追蹤記憶體與半導體價格的市場研究機構) 2026-09-30 的報導指出, 2026 年第 4 季一般 DRAM 合約價季增 10% 至 15%, GDDR7 持續上行, 原因是 AI 晶片採購壓縮 GDDR7 產能.
- TrendForce 2026-08-04 的報導指出, 韓國 RTX 50 系列 8 月最多漲 30%, 2026 年 DRAM 供給缺口約 1% 至 2%, 2027 年擴大.
- 整機實例: DGX Spark 128GB 自 3,999 調到 6,950 (約 +75%, The Register 歸因於記憶體成本); RTX PRO 6000 自上市價 8,565 到掛牌價 16,000.
- 因應方向: 引用價格時標註查價日期, 採購前以當月報價為準; 預算有彈性時, 可先以較低檔位驗證需求 (M1, M6), 再決定是否升級.

## 更新紀錄

| 日期 | 內容 |
|---|---|
| 2026-10-26 | 首次建立: NVIDIA 工作站與消費級顯示卡, 統一記憶體整機, 3 個 35B 級模型的配置預算 |

## 參考來源

官方與廠商公告:

- [NVIDIA: RTX PRO 6000 Blackwell 家族](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000-family/)
- [NVIDIA: RTX PRO 5000 Blackwell](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-5000/)
- [Apple: Mac Studio 技術規格](https://www.apple.com/tw/mac-studio/specs/)
- [TrendForce 新聞稿 (2026-09-30)](https://www.trendforce.com/presscenter/news/20260930-13258.html)
- [TrendForce: NVIDIA RTX 50 價格在韓國 8 月可能上漲最多 30% (2026-08-04)](https://www.trendforce.com/news/2026/08/04/news-nvidia-rtx-50-prices-in-korea-may-rise-up-to-30-from-aug-on-higher-tsmc-wafer-and-gddr7-memory-costs/)

媒體與通路 (二手來源):

- [letsdatascience: NVIDIA raises RTX PRO 6000 Blackwell price again](https://letsdatascience.com/news/nvidia-raises-rtx-pro-6000-blackwell-price-again-6d1ae9ff)
- [IT之家 (ithome.com, 非台灣的 iThome): RTX PRO 6000 價格報導 (二手來源, 轉引 Tom's Hardware)](https://www.ithome.com/0/963/977.htm)
- [TechSpot: NVIDIA raises RTX PRO 6000 Blackwell price](https://techspot.com/news/113460-nvidia-raises-rtx-pro-6000-blackwell-price-staggering.html)
- [鉅亨: RTX PRO 6000 價格報導](https://hao.cnyes.com/post/263122)
- [Techbang: NVIDIA Blackwell RTX PRO 6000](https://www.techbang.com/posts/122132-nvidia-blackwellrtx-pro-6000)
- [科技新報: RTX 5090 價格](https://technews.tw/2026/09/16/rtx-5090-price-past-190000/)
- [Techbang: RTX 50 系列價格上漲](https://www.techbang.com/posts/132927-nvidia-rtx-50-series-price-surge-rtx-5090)
- [BuySellRAM: NVIDIA consumer GPU price report (2026-08)](https://www.buysellram.com/blog/nvidia-consumer-gpu-price-report-august-2026/)
- [OpenClawDC: 二手 RTX 3090](https://openclawdc.com/blog/how-to-buy-a-used-rtx-3090-safely/)
- [InsiderLLM: multi-GPU local AI](https://insiderllm.com/guides/multi-gpu-local-ai/)
- [TechRadar: RTX PRO 5000 72GB](https://www.techradar.com/pro/great-news-nvidia-finally-has-a-72gb-graphics-card-but-since-its-the-rtx-pro-5000-blackwell-it-will-probably-cost-you-just-a-bit-more-than-a-64gb-ddr5-stick-sarcasm)
- [GPU Poet: RTX PRO 5000 價格 (2026-10)](https://gpupoet.com/gpu/learn/price/october-2026/nvidia-rtx-pro-5000-blackwell)
- [SHI: RTX PRO 4500 Blackwell](https://www.shidirect.com/product/50313203/NVIDIA-RTX-PRO-4500-Blackwell)
- [The Register: DGX Spark 價格](https://www.theregister.com/a/5300622)
- [implicator: NVIDIA adds 64GB DGX Spark](https://www.implicator.ai/nvidia-adds-64gb-dgx-spark-at-4-999-as-128gb-model-climbs-to-6-950)
- [AceCloud: NVIDIA DGX Spark price](https://acecloud.ai/blog/nvidia-dgx-spark-price/)
- [issoh: GB10 機種價格與評測](https://www.issoh.co.jp/tech/details/9498/)
- [Techbang: ASUS GX10](https://www.techbang.com/posts/125918-asus-gx10-mini-pc-nvidia-gb10)
- [Macworld: Mac Studio M5 Ultra](https://macworld.com/article/3220024/apple-announces-the-m5-ultra-mac-studio-with-up-to-512gb-of-ram.html)
- [mrmad: Mac Studio 2026 規格與價格](https://mrmad.com.tw/apple-mac-studio-2026-specs-price)
- [Notebookcheck: M3 Ultra Mac Studio 停售 512GB 選項](https://www.notebookcheck.net/Apple-increases-RAM-upgrade-pricing-for-M3-Ultra-Mac-Studio-retires-512-GB-option.1244246.0.html)
- [starryhope: Strix Halo local LLM inference 2026](https://www.starryhope.com/minipcs/strix-halo-local-llm-inference-2026/)
- [Notebookcheck: Framework Desktop 因 RAM 短缺漲價](https://www.notebookcheck.net/Framework-Desktop-now-cost-up-to-460-more-due-to-RAM-shortage.1203235.0.html)
- [ComputingForGeeks: Arc Pro B70 vs R9700](https://computingforgeeks.com/arc-pro-b70-vs-r9700/)
