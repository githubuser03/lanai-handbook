---
description: "後續每個模組都放在這一章準備的環境裡: 一台主機, 一個不對外開放的內網網段, 以及能還原的備份."
---

# M0 基礎環境

::: info 本章屬性
- 等級: ● 必要
- 狀態: 可閱讀 (指令未實機驗證)
- 資料基準日: 2026-10-26
- 待查證: 本章指令與設定檔依官方文件整理, 尚未在實機執行; Proxmox VE 與 Proxmox Backup Server 的版本請以官方文件為準, 本章不列版本號; Proxmox VE 防火牆 `policy_in` 與 `policy_out` 的預設值官方文件未列出, 本章一律寫成明確設定; 各區服務的連接埠除 vLLM, Proxmox VE, Proxmox Backup Server 與 SSH 外, 請以各模組章節為準; Docker Desktop 容器能否使用 Apple GPU 本輪未查證; 標示「推論」的段落沒有官方文件依據; 文中的類比為整理者所寫, 不代表技術上完全等同
:::

**結論**: 後續每個模組都放在這一章準備的環境裡: 一台主機, 一個不對外開放的內網網段, 以及能還原的備份. 單人單機可以只用一台 Linux 或 Mac 加 Docker (把每個服務包成容器執行的工具); 多人共用時, 改用 Proxmox VE (在實體主機上建立多台 VM 的虛擬化平台) 以 VM 劃分信任區, 並以 Proxmox Backup Server (Proxmox 的備份伺服器) 備份 VM. 不論哪一種起點, 進入 M1 之前都要先完成一次還原演練.

**這一塊在圖上的位置**: 實體主機 Proxmox VE, 各 VM 區的邊界, 以及備份伺服器. **前置模組**: 無. **完成後的狀態**: 主機, 網段與備份都已就位, 可以開始組裝 M1.

這一章是整棟房子的地基: 決定機器放在哪裡, 誰能從哪裡連進來, 壞掉時怎麼復原. 地基沒打好, 之後每個模組都要回頭補. 本章內容偏向網路與系統管理; 單人單機的讀者只需要讀 M0.1 節的「單機起點」, M0.3 節與 M0.5 節.

::: tip 本章常見名詞
| 詞 | 意思 |
|---|---|
| 主機 (host) | 實際的那台電腦, 所有服務都跑在上面 |
| VM (虛擬機) 與 LXC 容器 | VM 是在主機上切出的獨立電腦, 有自己的作業系統核心; LXC 容器較輕量, 但和主機共用核心 |
| Proxmox VE | 在一台實體主機上建立與管理多台 VM 的開源平台 |
| Docker 容器 | 把程式和它需要的檔案包成一包執行; 同樣和主機共用核心 |
| 網段與 VLAN | 網段是一群可以直接互通的位址; VLAN 是在同一組實體網路上切出多個互不相通的網段 |
| 防火牆 | 依規則決定哪些連線可以通過的機制 |
| 連接埠 (port) | 同一台機器上區分不同服務的編號, 例如 Proxmox VE 管理介面用 8006 |
| GPU 直通 (passthrough) | 把實體顯示卡直接交給某一台 VM 使用 |
| 摘要值 (digest) | 映像內容算出來的一串固定字元, 內容一變就不同, 可用來鎖定版本 |
| 雙因素驗證 (TFA) | 登入時除了密碼, 還要第二種證明, 例如手機驗證器 App 的動態碼 |
:::

## M0.1 兩種起點: 單機或 Proxmox VE

第一步是決定要用一台電腦直接跑所有服務, 還是先把主機切成多台 VM, 每台只放一類服務. 可以想成獨棟透天與分租公寓的差別: 透天一個人住最省事; 分租公寓每戶有自己的門鎖, 一戶出事比較不會波及其他戶, 但管理起來比較費工.

兩種起點的差別在於隔離的單位. 單機以容器隔離, Proxmox VE 以 VM 隔離; 後者成本較高, 但各區之間的網路規則可以在 VM 外部控管.

| 比較事項 | 單機 (Linux 或 macOS 加 Docker) | Proxmox VE (以 VM 劃分信任區) |
|---|---|---|
| 適用 | 里程碑 1, 單人 | 里程碑 2 以上, 多人共用 |
| 隔離單位 | 容器, 與主機共用核心 | VM, 各自有核心 |
| 網路控管 | 主機防火牆加 Docker 的連接埠綁定 | 每個 VM 網卡各自的防火牆規則, 加上 VLAN 分段 |
| 備份 | 資料卷與設定檔 (見 O1) | 整台 VM 排程備份到 Proxmox Backup Server |
| 維運負擔 | 低 | 中, 需要有人懂虛擬化與網路 |

以上取捨為整理者的歸納 (推論, 信心: 中).

### 單機起點

單機起點適合一個人在自己的電腦上使用.

- 作業系統用 Linux 或 macOS, 容器引擎用 Docker. 推論引擎依 M1.2 節安裝; macOS 上建議以 Ollama 原生應用程式執行推論引擎, 介面等其他元件再用 Docker (Docker Desktop 是在 Mac 與 Windows 上執行 Docker 的桌面應用程式, 其容器能否使用 Apple GPU 本輪未查證).
- 所有服務只綁 127.0.0.1, 不開放給其他裝置; Docker Engine 使用 28.0.0 以上版本 (見 M0.3 節).
- 主機若要讓內網其他裝置連入, 代表需求已接近里程碑 2, 建議同時規劃反向代理 (M2.3 節) 與主機防火牆.

### Proxmox VE 起點

Proxmox VE 是安裝在實體主機上的虛擬化平台, 裝好之後用瀏覽器就能建立與管理多台 VM. 下列是安裝前要確認的硬體條件與安裝步驟.

**硬體需求** (來源: Proxmox VE wiki System Requirements):

- x86 主機的 CPU 與主機板須支援 Intel VT 或 AMD-V; 官方也列出 64 位元 ARM 主機.
- 記憶體建議至少 2GB 給作業系統與 Proxmox VE 服務, 另加 VM 所需; 使用 ZFS (結合檔案系統與磁碟管理的儲存方式) 或 Ceph (跨多台主機的分散式儲存) 時, 每 TB 已用儲存空間約需 1GB 記憶體.
- 建議使用具斷電保護的 SSD, 不建議消費級 SSD; ZFS 與 Ceph 不相容於硬體 RAID 控制器.
- 要把 GPU 直通給推論區 VM, CPU 與主機板須支援 IOMMU (x86 為 Intel VT-d 或 AMD-Vi), 並通常要在 BIOS 或 UEFI 中開啟.

推論區 VM 需要使用顯示卡跑模型, 因此要把實體顯示卡「直通」給這台 VM. IOMMU 是 CPU 與主機板提供的硬體功能, 讓虛擬化平台能把一張實體裝置安全地交給單一 VM.

**GPU 直通的前提** (來源: Proxmox VE wiki PCI Passthrough 與 Proxmox VE 文件 Qemu/KVM Virtual Machines):

- 要直通的 PCI 裝置須位於獨立的 IOMMU 群組; 可用 `pvesh get /nodes/<節點名稱>/hardware/pci` 查看.
- 開機後可用 `dmesg | grep -e DMAR -e IOMMU` 確認 IOMMU 已啟用.
- 顯示卡的 ROM 支援 UEFI 時, 官方建議 VM 改用 OVMF (VM 用的 UEFI 韌體) 而非 SeaBIOS (VM 用的傳統 BIOS 韌體); 直通 PCIe 裝置時, Q35 機型 (VM 模擬的一種主機板晶片組) 提供虛擬 PCIe 匯流排.
- 有直通裝置的 VM 無法即時遷移 (live migration). 推論區因此要以「停機後重建或還原」規劃維護 (推論).

**安裝要點** (來源: Proxmox VE Administration Guide 第 2 章; 目前版本依官方文件):

1. 從官方網站下載 ISO, 寫入 USB 隨身碟開機安裝; 官方指出 USB 安裝是建議做法, 速度較快.
2. 安裝程式的 Options 可選目標檔案系統, 預設為 ext4, 也可選 ZFS.
3. 安裝時設定主機名稱與管理用 IP; 安裝階段只能設定 IPv4 或 IPv6 其中一種, 雙堆疊須於安裝後再加. 這個 IP 應位於管理網段 (見 M0.2 節).
4. 安裝完成後, 以瀏覽器透過 HTTPS 連到 8006 連接埠, 用 `root` 帳號 (PAM realm) 與安裝時設定的密碼登入.

**VM 與 LXC 的選擇**: 接觸不可信內容的元件 (介面, 文件解析, 工具伺服器, 沙箱, 隔離模型) 一律放 VM, 不放 LXC 容器. LXC 與主機共用核心, 一旦逃逸, 影響範圍是整台 Proxmox VE 主機 (推論, 信心: 中). 各 VM 區放什麼, 見[組裝總覽](/build/overview)的部署分區表.

**由小到大**: 里程碑 2 不必一次建滿八個區. 可以先建入口區與推論區兩台 VM, 隨模組增加再拆出閘道區與稽核區. 還沒有閘道區時, 推論區暫時允許入口區直連 vLLM 的 8000 連接埠 (見 M0.2 節的對照表), 部署 M5 閘道後就收回這條規則, 改為「金鑰只在閘道區」與「推論區只接受閘道連線」 (推論, 信心: 中).

## M0.2 內網網段與防火牆

這一節決定「誰可以連到誰」. 可以想成辦公大樓的門禁: 訪客只能進大廳 (入口區), 機房 (推論區) 只有特定人員的門禁卡刷得開, 而大樓對外的大門根本不開. 網段負責把人分在不同樓層, 防火牆負責在每扇門前比對名單.

**原則**: 只開放內網. 公網路由器不做任何連接埠轉發, 也不使用 Tailscale 這類穿透服務; 遠端使用者須先接入公司既有的內網. 網段至少分成三類: 使用者網段, 管理網段, 以及 VM 各信任區.

### 以 VLAN 劃分信任區

VLAN 讓同一組實體網路線與交換器, 切成多個互不相通的網段, 每個信任區用一個 VLAN.

Proxmox VE 的軟體定義網路 (SDN) 以「區域 (zone)」劃分網路, 區域內再建立 VNet 指派給 VM (來源: Proxmox VE 文件 Software-Defined Network):

| SDN 區域類型 | 做法 | 適用 |
|---|---|---|
| VLAN zone | 使用各節點上既有的 Linux bridge 或 OVS (兩者都是主機內的虛擬交換器), 連到實體網卡; VNet 的 tag 就是 VLAN ID | 各區要跨實體交換器, 或要讓上游防火牆在 VLAN 之間過濾 |
| Simple zone | 建立不接實體網卡的獨立 bridge, 流量只留在該節點 | 單一節點, 而且區與區之間不需要經過實體網路 |

操作上要注意三點 (來源同上):

- Proxmox VE 8.1 起預設已安裝 SDN 核心套件; 由舊版升級者須自行安裝 `libpve-network-perl`.
- SDN 的變更先記為待套用 (pending), 須在 SDN 總覽頁面套用後才生效.
- VNet 的 Isolate Ports 選項可讓同一 VNet 內的 VM 彼此不能直接通訊, 只能和 bridge 本身通訊; 這項隔離只在單一主機內有效, 跨節點須靠防火牆.

建議每個信任區各用一個 VLAN, 區與區之間的路由由上游防火牆或 Proxmox VE 的 VM 防火牆控管 (推論, 信心: 中).

### Proxmox VE 防火牆的運作方式

Proxmox VE 內建防火牆, 可以替主機與每台 VM 分別設定規則. 它的預設行為和直覺不同, 設定前先了解下列幾點.

下列行為取自 Proxmox VE 文件 Firewall 章:

- 防火牆分為主機 (Host), VM 與 VNet 三種區域, 方向分為 In, Out 與 Forward.
- **資料中心層級預設完全關閉**, 須手動設定 `enable` 才會生效.
- 啟用後, 預設會擋下送往所有主機的流量 (少數例外). 官方建議啟用前先開一個 SSH 連線, 以免設定錯誤後無法連回.
- **每張虛擬網卡各有自己的防火牆開關**, VM 層級的 `enable` 預設為 0; 資料中心層級也要啟用, VM 規則才會生效.
- 安全群組 (security group) 是在叢集層級定義的一組規則, 可以套用到任何 VM.
- Forward 方向的規則與 VNet 層級的規則, 只在 nftables (Linux 核心的封包過濾機制) 版的 `proxmox-firewall` 中有效; 官方文件目前將它標為技術預覽, 不適合正式環境. 因此本手冊以 VM 層級的 In 與 Out 規則控管各區 (推論, 信心: 中).
- `policy_in` 與 `policy_out` 的預設值官方文件未列出, 設定檔中請明確寫出.

### 各區允許連線對照表

下表依[組裝總覽](/build/overview)的部署分區表, 列出每一區「只允許」的連入來源. 未列出的連線一律拒絕 (預設拒絕). 表中的 LiteLLM 是統一轉送模型請求的模型閘道 (M5), MCP gateway 是控管工具呼叫的工具閘道 (M7), vLLM 是跑模型的推論伺服器 (M1), LangGraph 是串接代理步驟的框架 (M8), n8n 是流程自動化平台 (M9).

| 目的區 | 允許的來源 | 用途 |
|---|---|---|
| 入口區 | 使用者網段 | 只連反向代理的 HTTPS |
| 閘道區 | 入口區, 控制區, 隔離區, 自動化區 | 呼叫 LiteLLM 與 MCP gateway |
| 推論區 | 閘道區 | 呼叫 vLLM (預設 8000 連接埠, 見 M1.10 節) |
| 推論區 (僅限尚未部署閘道區時) | 入口區 | 里程碑 2 先只建入口區與推論區時, 介面直接呼叫 vLLM 的 8000 連接埠; 部署 M5 閘道後刪除這條, 改回只允許閘道區 |
| 隔離區 | 控制區 | LangGraph 呼叫隔離模型 |
| 工具區 | 閘道區 | MCP gateway 呼叫 MCP 伺服器 |
| 工具區 (僅 Open Terminal 的連接埠) | 入口區 | 例外: Open WebUI 的 Open Terminal 整合由 Open WebUI 伺服器直接連線, 官方文件只說明以網址加 API 金鑰直連, 未提供經 MCP gateway 的接法 (見 M7.4 節) |
| 控制區 | 入口區 | 介面呼叫代理服務 (依實際設計調整) |
| 稽核區 | 各區 | 接收紀錄 (OTLP 等) |
| 自動化區 | 入口區 (反向代理), 閘道區, 管理網段 | 入口區的反向代理轉送 n8n 編輯介面 (5678 連接埠, 見 M9); 閘道區的 MCP gateway 呼叫 n8n 的 MCP 端點 (MCP Server Trigger); 管理網段只連管理介面 |
| 所有 VM 與主機的管理連接埠 | 管理網段 | Proxmox VE 8006, SSH 22, Proxmox Backup Server 8007 |

連出方向同樣要限制 (推論, 信心: 中):

- 只有閘道區能連到網際網路, 而且只連必要的雲端 API 網域.
- 推論區只能連 NAS 的 NFS (見 M3.3 節) 與稽核區.
- 工具區的程式碼沙箱不給網路; MCP 伺服器只能連指定的內部系統.
- 自動化區只能連閘道區.
- Prometheus (定期收集數值指標的監控系統) 是由稽核區主動抓取各區的指標端點, 因此各區要額外允許「稽核區 → 指標連接埠」這一條.

### VM 防火牆設定範例

下列兩個設定檔示範推論區的規則: 第一個在叢集層級定義「管理網段」與「推論區允許的連入來源」, 第二個套用到推論區 VM, 預設拒絕其他所有連入. 範例依 Proxmox VE 文件 Firewall 章的語法整理, 未實機驗證. 位址與 VMID 為佔位符; VMID 是 Proxmox VE 為每台 VM 編的號碼.

```
# /etc/pve/firewall/cluster.fw
[OPTIONS]
enable: 1

[IPSET management]
<管理網段, 例如 10.0.99.0/24>

[group inference-in]
IN ACCEPT -source <閘道區網段> -p tcp -dport 8000
IN ACCEPT -source <稽核區網段> -p tcp -dport 8000
# 尚未部署閘道區時暫時加上, 部署 M5 後刪除:
# IN ACCEPT -source <入口區網段> -p tcp -dport 8000
```

```
# /etc/pve/firewall/<推論區 VMID>.fw
[OPTIONS]
enable: 1
policy_in: DROP

[RULES]
GROUP inference-in
IN SSH(ACCEPT) -source +management
```

vLLM 的 `/metrics` 與推論 API 共用同一個連接埠, 所以稽核區抓指標也連到 8000. 這條規則同時讓稽核區連得到 vLLM 其他不需驗證的端點; 要再縮小範圍時, 在推論區 VM 內加一層反向代理, 只把 `/metrics` 開給稽核區 (見 M1.10 節). 名為 `management` 的 IPSet 只套用到主機防火牆, 不套用到 VM 防火牆 (來源: Proxmox VE 文件 Firewall); VM 內的 SSH 因此仍要像上例一樣明確引用. 設定完成後, 別忘了在 VM 的每張網卡上打開防火牆開關.

### 管理介面: 獨立網段加雙因素驗證

管理介面能建立, 刪除與還原所有 VM, 是整個環境權限最高的入口, 因此要放在獨立的管理網段, 並要求密碼以外的第二種登入證明.

Proxmox VE 的 8006, SSH 22, SPICE 3128 與 VNC 主控台 5900 至 5999 連接埠都是管理用途 (SSH 是遠端登入主機的協定, SPICE 與 VNC 是遠端操作 VM 畫面的協定) (來源: Proxmox VE 文件 Firewall). 這些連接埠只對管理網段開放: 把管理網段的位址放進 `management` IPSet, 再讓主機防火牆只接受這個 IPSet.

管理帳號一律開啟雙因素驗證 (TFA). Proxmox VE 支援下列方式 (來源: Proxmox VE 文件 User Management):

| 方式 | 設定方式 | 注意事項 |
|---|---|---|
| TOTP | 使用者在使用者清單點 TFA, 以驗證器 App 掃描 QR code | 連續 8 次失敗後, 該使用者的 TOTP 會停用, 以復原金鑰登入後解除 |
| WebAuthn (以實體安全金鑰或裝置內建驗證登入的網頁標準) | Datacenter → Permissions → Two Factor | 需要可信任的 HTTPS 憑證與有效網域; 憑證不受信任時, 瀏覽器可能拒絕 |
| 復原金鑰 | 同上 | 每把只能用一次, 每位使用者同時只有一組; 用於其他因素全部遺失時 |
| Realm 強制 (TOTP 或 YubiKey OTP, 後者是 YubiKey 硬體金鑰產生的動態密碼) | 在 realm 的 TFA 下拉選單設定 | 啟用後, 沒有設定 TFA 的使用者無法登入 |

WebAuthn 與復原金鑰的失敗上限是 100 次, 超過後所有第二因素封鎖一小時; 管理者可用 `pveum user tfa unlock <使用者>@<realm>` 解除 (來源同上). 官方文件指出 `root` 使用者永遠可以經 Linux PAM realm 登入; 建議 `root` 也設定 TFA, 日常管理改用個人帳號, 並妥善保存復原金鑰 (推論, 信心: 中).

## M0.3 Docker 與容器的共同設定

Docker 把每個元件和它需要的檔案包成一個容器執行, 安裝與移除都很乾淨. 但 Docker 的預設值偏向「方便連線」, 不偏向「安全」, 所以每個容器都要套用同一組設定. 不論單機或 VM 內, 用 Docker 執行的每個元件都套用下列四項設定.

| 設定 | 做法 | 依據 |
|---|---|---|
| 連接埠只綁本機 | 寫成 `-p 127.0.0.1:<主機連接埠>:<容器連接埠>`; IPv6 寫成 `-p '[::1]:<主機連接埠>:<容器連接埠>'`; Docker Engine 使用 28.0.0 以上版本 | 只寫 `-p 8080:80` 會綁定主機的任一位址; 28.0.0 之前的版本, 同一個 L2 網段 (例如接在同一台交換器) 的主機連得到綁在 localhost 的連接埠 (來源: Docker 文件 Port publishing and mapping) |
| 不以 ufw (Ubuntu 常用的主機防火牆設定工具) 當唯一防線 | 發布時就綁定 127.0.0.1 或內部網路 | Docker 與 ufw 的防火牆規則不相容, 已發布的連接埠可能不受 ufw 限制 (來源: Docker 文件 Packet filtering and firewalls; 見 M2.2 節) |
| 映像以摘要值鎖定 | 寫成 `<映像>@sha256:<摘要值>` | 摘要值把映像固定在特定版本; Docker 文件同時提醒, 這樣不會自動取得安全更新, 須依 O2 升級 (來源: Docker 文件 docker image pull) |
| 機密放 `.env`, 權限 600 | `chmod 600 .env`, 不進版本控制 | 見 K6.3 節 |

在 Proxmox VE 上, VM 防火牆在 VM 外部執行, 不受 VM 內 Docker 改寫的封包規則影響. 這是改用 VM 劃分信任區的另一個理由 (推論, 信心: 中).

**共同範本** (依上述 Docker 文件整理, 未實機驗證): 第一行把 `.env` 設為只有擁有者能讀寫; 第二段啟動容器, 依序設定只綁本機的連接埠, 可寫的資料卷, 唯讀的目錄, 容器名稱與自動重啟, 最後以摘要值指定映像. 角括號內的文字要換成實際值.

```bash
chmod 600 .env

docker run -d \
  -p 127.0.0.1:<主機連接埠>:<容器連接埠> \
  -v <資料卷>:<容器內路徑> \
  -v <唯讀目錄>:<容器內路徑>:ro \
  --name <名稱> --restart always \
  <映像>@sha256:<摘要值>
```

最後一個 `-v` 示範唯讀掛載: 在第三欄加上 `ro`, 容器內就無法寫入 (來源: Docker 文件 Bind mounts). M3 與 M1.10 節的模型目錄都用這個方式掛載. 查詢摘要值的指令見 O2.1 節.

## M0.4 備份伺服器

備份的價值不在「有沒有備份」, 而在「需要時能不能還原」. 可以想成消防演練: 平常演練過一次, 真的出事時才知道逃生門在哪, 要花多久.

**原則**: 單機起點依 [O1](/ops/backup) 備份資料卷到 NAS 或另一台裝置. Proxmox VE 起點用 Proxmox Backup Server 排程備份整台 VM, 再加上 O1 的資料層備份. 兩者都要先還原成功一次, 才算完成.

### 安裝位置

Proxmox Backup Server 的官方建議安裝方式是 ISO 安裝程式. 官方文件也說明可以裝在 Proxmox VE 主機上, 但不建議; 備份應放在另一台實體伺服器, 主機故障時備份才拿得到 (來源: Proxmox Backup Server 文件 Installation). 網頁介面使用 HTTPS 的 8007 連接埠 (來源同上), 這個連接埠只對管理網段與 Proxmox VE 主機開放.

### 加入 Proxmox VE 並設定加密

在 Proxmox VE 的 Datacenter → Storage 加入 Proxmox Backup Server, 或用命令列. 下列指令依序新增備份儲存, 設定登入帳號, 設定憑證指紋 (確認連到的是正確的備份伺服器), 最後確認連線 (來源: Proxmox Backup Server 文件 Proxmox VE Integration, 未實機驗證):

```bash
# 在 Proxmox VE 節點: 新增備份儲存
pvesm add pbs <儲存名稱> --server <備份伺服器位址> --datastore <datastore 名稱>

# 設定登入帳號; 不寫密碼值時會提示輸入, 避免密碼留在命令列紀錄
pvesm set <儲存名稱> --username <帳號>@pbs --password

# 備份伺服器使用自簽憑證時, 先在備份伺服器查詢指紋
proxmox-backup-manager cert info | grep Fingerprint
# 再回到 Proxmox VE 節點設定
pvesm set <儲存名稱> --fingerprint <指紋>

# 確認連線
pvesm status --storage <儲存名稱>
```

**客戶端加密**: 儲存設定的 `encryption-key` 設為 `autogen` 時, 會產生新金鑰, 存放在 `/etc/pve/priv/storage/<儲存名稱>.enc`, 只有 root 能讀取. 官方文件提醒: 沒有金鑰, 備份就無法存取; 金鑰應另外保存在與資料分開的地方, 例如密碼管理工具, USB 隨身碟或紙本 (來源: Proxmox VE wiki Storage: Proxmox Backup Server). 金鑰副本的保存方式與 O1.5 節的「備份本身的安全」一併規劃.

### 排程備份

備份工作在 Datacenter → Backup 管理, 排程格式近似 systemd (Linux 管理服務與排程的系統元件) 的 calendar events (來源: Proxmox VE 文件 Backup and Restore). 模式的取捨如下 (來源同上):

| 模式 | 官方說明 | 建議用途 (推論) |
|---|---|---|
| stop | 一致性最高, 代價是 VM 短暫停機 | 有資料庫的 VM (閘道區存放金鑰等設定的 PostgreSQL 資料庫, 稽核區) |
| snapshot | 停機時間最短, 代價是少量不一致的風險 | 無狀態或可重建的 VM (推論區) |
| suspend | 為相容性保留, 官方建議改用 snapshot | 不建議 |

**保留與清理**: 保留規則用 `keep-last`, `keep-daily`, `keep-weekly` 等選項 (來源: Proxmox VE 文件 Backup and Restore). 在 Proxmox Backup Server 端, prune 只刪除快照的中繼資料, 實際資料區塊要等垃圾回收 (garbage collection) 才會刪除; 官方建議排定垃圾回收, 起點可設為每週一次 (來源: Proxmox Backup Server 文件 Maintenance Tasks).

**驗證**: 設定驗證工作 (verification job) 定期檢查備份資料; 官方建議至少每月重新驗證全部備份一次, 以發現位元衰減 (來源同上). 驗證通過仍不等於還原成功, 所以 M0.5 節另外要求實際還原.

要再把備份同步到第二台 Proxmox Backup Server 時, 見官方文件 Managing Remotes & Sync 章節 (本輪未核對內容).

### 還原

備份可以從 Proxmox VE 網頁介面還原, 也可以用 `qmrestore` (VM) 或 `pct restore` (容器) (來源: Proxmox VE 文件 Backup and Restore). 另有 live-restore: VM 在還原開始時就啟動, 資料在背景複製; 官方文件指出這段期間磁碟讀取較慢, 而且 live-restore 失敗時 VM 可能處於不確定的狀態. 還原演練因此建議用一般還原, 還原到新的 VMID (推論, 信心: 中).

## M0.5 驗收測試

驗收的方法是站在不同位置, 實際嘗試連線: 該連得到的要連得到, 不該連得到的要連不到. Nmap 是常用的開源連接埠掃描工具, 會列出一台機器開放了哪些連接埠. 完成 M0 前, 逐項確認下列結果. 掃描指令為 Nmap 的通用用法, 未實機驗證; Nmap 預設只掃描每種協定最常見的 1,000 個連接埠, 加上 `-p-` 才會掃描 1 至 65535 (來源: Nmap 文件 Port Specification).

```bash
# 從使用者網段的另一台裝置掃描主機或入口區 VM
nmap -p- <主機或 VM 位址>

# 從自動化區 VM 嘗試連推論區 (應失敗)
nmap -p 8000 <推論區 VM 位址>
```

- [ ] 從公網位址掃描, 沒有任何開放的連接埠
- [ ] 從使用者網段掃描, 單機起點沒有開放的連接埠 (里程碑 1); Proxmox VE 起點只看得到入口區的 HTTPS
- [ ] 從使用者網段連不到 Proxmox VE 的 8006, Proxmox Backup Server 的 8007 與 SSH
- [ ] 從自動化區或入口區直接連推論區的 8000 連接埠失敗, 從閘道區連線成功
- [ ] Proxmox VE 管理帳號沒有第二因素時無法登入; 復原金鑰已離線保存
- [ ] 還原一台測試 VM: 還原到新的 VMID, 先接到隔離的 VNet 以免 IP 衝突 (推論), 開機後確認服務啟動, 記錄還原所需時間, 完成後刪除
- [ ] Proxmox Backup Server 的加密金鑰副本已另外保存, 並確認副本可讀
- [ ] 依 [O1.3 節](/ops/backup)記錄還原耗時與遇到的問題, 並更新還原步驟

## 參考來源

- [Proxmox VE wiki: System Requirements](https://pve.proxmox.com/wiki/System_Requirements)
- [Proxmox VE Administration Guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.html)
- [Proxmox VE 文件: Firewall](https://pve.proxmox.com/pve-docs/chapter-pve-firewall.html)
- [Proxmox VE 文件: Software-Defined Network](https://pve.proxmox.com/pve-docs/chapter-pvesdn.html)
- [Proxmox VE 文件: User Management (Two-Factor Authentication)](https://pve.proxmox.com/pve-docs/chapter-pveum.html)
- [Proxmox VE 文件: Qemu/KVM Virtual Machines](https://pve.proxmox.com/pve-docs/chapter-qm.html)
- [Proxmox VE wiki: PCI Passthrough](https://pve.proxmox.com/wiki/PCI_Passthrough)
- [Proxmox VE 文件: Backup and Restore](https://pve.proxmox.com/pve-docs/chapter-vzdump.html)
- [Proxmox VE wiki: Storage: Proxmox Backup Server](https://pve.proxmox.com/wiki/Storage:_Proxmox_Backup_Server)
- [Proxmox Backup Server 文件](https://pbs.proxmox.com/docs/)
- [Proxmox Backup Server 文件: Installation](https://pbs.proxmox.com/docs/installation.html)
- [Proxmox Backup Server 文件: Proxmox VE Integration](https://pbs.proxmox.com/docs/pve-integration.html)
- [Proxmox Backup Server 文件: Maintenance Tasks](https://pbs.proxmox.com/docs/maintenance.html)
- [Docker 文件: Port publishing and mapping](https://docs.docker.com/engine/network/port-publishing/)
- [Docker 文件: Packet filtering and firewalls](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Docker 文件: docker image pull](https://docs.docker.com/reference/cli/docker/image/pull/)
- [Docker 文件: Bind mounts](https://docs.docker.com/engine/storage/bind-mounts/)
- [Nmap 文件: Port Specification and Scan Order](https://nmap.org/book/man-port-specification.html)
- 文中的類比 (地基, 透天與分租公寓, 辦公大樓門禁, 消防演練): 整理者所寫, 無外部來源, 不應當作技術定義引用.
