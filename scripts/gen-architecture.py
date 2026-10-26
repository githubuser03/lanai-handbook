#!/usr/bin/env python3
"""產生 README 與第 9 章使用的部署架構圖 (SVG). 用法: python3 scripts/gen-architecture.py content/public/images/architecture.svg"""
import sys

W, H = 1220, 1410
FONT = "Inter, 'Noto Sans CJK TC', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif"
C = {
    "red": ("#fdeeea", "#e0a090", "#7a2e1c"),
    "purple": ("#ecebfb", "#9b96e0", "#2d2a7a"),
    "beige": ("#f0ede6", "#c9c2b3", "#3a3630"),
    "gov": ("#faf9f6", "#b8b1a3", "#3a3630"),
}
out = []


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def frame(x, y, w, h, label, kind):
    styles = {
        "zone": 'fill="#fafafa" stroke="#9a9a9a" stroke-width="1.5" stroke-dasharray="8 6"',
        "host": 'fill="#ffffff" stroke="#4a4640" stroke-width="2"',
        "vm": 'fill="#ffffff" stroke="#b5b0a6" stroke-width="1"',
        "dev": 'fill="#ffffff" stroke="#8a8a8a" stroke-width="1.5" stroke-dasharray="2 3"',
    }
    rx = 14 if kind == "zone" else 10
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" {styles[kind]}/>')
    size, weight, color = {"zone": (14, 700, "#555"), "host": (13, 700, "#3a3630"),
                           "vm": (12, 500, "#6b665c"), "dev": (12, 500, "#6b665c")}[kind]
    out.append(f'<text x="{x + 12}" y="{y + 19}" font-size="{size}" font-weight="{weight}" fill="{color}">{esc(label)}</text>')


def box(x, y, w, h, title, sub, color, dashed=False, sub2=None):
    fill, stroke, text = C[color]
    dash = ' stroke-dasharray="5 4"' if dashed else ""
    out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9" fill="{fill}" stroke="{stroke}" stroke-width="1"{dash}/>')
    cx = x + w / 2
    if sub2:
        out.append(f'<text x="{cx}" y="{y + h / 2 - 13}" text-anchor="middle" font-size="14" font-weight="700" fill="{text}">{esc(title)}</text>')
        out.append(f'<text x="{cx}" y="{y + h / 2 + 6}" text-anchor="middle" font-size="12" fill="{text}">{esc(sub)}</text>')
        out.append(f'<text x="{cx}" y="{y + h / 2 + 24}" text-anchor="middle" font-size="11" fill="#6b665c">{esc(sub2)}</text>')
    elif sub:
        out.append(f'<text x="{cx}" y="{y + h / 2 - 5}" text-anchor="middle" font-size="14" font-weight="700" fill="{text}">{esc(title)}</text>')
        out.append(f'<text x="{cx}" y="{y + h / 2 + 14}" text-anchor="middle" font-size="12" fill="{text}">{esc(sub)}</text>')
    else:
        out.append(f'<text x="{cx}" y="{y + h / 2 + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="{text}">{esc(title)}</text>')


def path(d, dashed=False, arrow=True, both=False):
    dash = ' stroke-dasharray="4 4"' if dashed else ""
    mk = ' marker-end="url(#ah)"' if arrow else ""
    if both:
        mk += ' marker-start="url(#ah)"'
    out.append(f'<path d="{d}" fill="none" stroke="#8a8a8a" stroke-width="1.3"{dash}{mk}/>')


def label(x, y, t, anchor="middle"):
    tw = sum(12 if ord(ch) > 0x2E80 else 6.6 for ch in t) + 12
    bx = x - tw / 2 if anchor == "middle" else (x - 5 if anchor == "start" else x - tw + 5)
    out.append(f'<rect x="{bx}" y="{y - 12}" width="{tw}" height="17" rx="3" fill="#ffffff"/>'
               f'<text x="{x}" y="{y + 1}" text-anchor="{anchor}" font-size="11.5" fill="#5f5a52">{esc(t)}</text>')


# ---------- zones and frames ----------
frame(20, 20, 1140, 120, "雲端", "zone")
frame(20, 165, 1140, 1015, "地端 · 只限內網使用", "zone")
frame(20, 1205, 760, 125, "使用者端 · 內網", "zone")

frame(780, 178, 360, 94, "實體主機 · 備份", "host")
frame(50, 285, 280, 95, "設備 · NAS", "dev")
frame(360, 285, 240, 95, "實體主機或 VM · 入庫檢查", "host")

frame(40, 400, 1100, 760, "實體主機 · Proxmox VE", "host")
frame(60, 430, 320, 125, "VM 推論區 (GPU 直通)", "vm")
frame(400, 430, 300, 125, "VM 稽核區 (○)", "vm")
frame(720, 430, 400, 125, "VM 工具區 (◇)", "vm")
frame(60, 580, 1060, 125, "VM 閘道區 · API 金鑰只放這裡", "vm")
frame(60, 750, 520, 390, "VM 入口區", "vm")
frame(600, 750, 520, 125, "VM 控制區 (◇)", "vm")
frame(600, 900, 520, 135, "VM 隔離區 (◇)", "vm")
frame(600, 1045, 360, 105, "VM 自動化區 (○)", "vm")
frame(80, 1225, 300, 90, "設備", "dev")

# ---------- edges (drawn before boxes so boxes sit on top) ----------
path("M 230 1245 V 1116")                         # device -> reverse proxy
path("M 210 1050 V 860")                          # reverse proxy -> UI
path("M 330 822 H 376")                           # UI -> Keycloak
path("M 300 856 V 931 H 376")                     # UI -> Docling
path("M 270 856 V 1031 H 376")                    # UI -> Qdrant
path("M 160 790 V 692")                           # UI -> LiteLLM
path("M 290 790 V 728 H 660 V 786")               # UI -> LangGraph (adapter)
path("M 720 790 V 712 H 330 V 692")               # LangGraph -> LiteLLM
path("M 620 990 H 590 V 712", arrow=False)        # quarantine model joins the LiteLLM line
path("M 680 1072 V 1040 H 590 V 990", arrow=False)  # n8n joins the same LiteLLM line
path("M 864 1105 H 1130 V 655 H 1104", both=True)  # n8n <-> MCP gateway
path("M 860 822 H 886")                           # LangGraph -> OPA
path("M 660 728 H 840", arrow=False)              # UI -> MCP gateway (shares trunk, merges at x=840)
path("M 840 790 V 692")                           # LangGraph -> MCP gateway
path("M 770 790 V 565 H 640 V 532", dashed=True)  # LangGraph -> audit (OTLP)
path("M 700 856 V 942")                           # LangGraph -> quarantine (call)
path("M 800 946 V 860")                           # quarantine -> LangGraph (JSON)
path("M 1000 1220 V 977 H 864")                   # untrusted -> quarantine
path("M 860 622 V 532")                           # MCP gateway -> MCP servers
path("M 1030 622 V 532")                          # MCP gateway -> sandbox
path("M 220 622 V 546")                           # LiteLLM -> vLLM
path("M 360 652 H 550 V 532", dashed=True)        # LiteLLM -> audit (OTLP)
path("M 360 500 H 416", dashed=True)              # vLLM -> audit (/metrics)
path("M 80 655 H 30 V 82 H 96", dashed=True)      # LiteLLM -> cloud API
path("M 660 462 V 266")                           # audit -> SIEM
path("M 960 400 V 266")                           # host -> backup
path("M 560 114 V 308")                           # model source -> intake
path("M 375 341 H 319")                           # intake -> NAS
path("M 190 368 V 454")                           # NAS -> vLLM (read-only)

# ---------- boxes ----------
box(100, 50, 220, 64, "雲端 API (可選)", "外部模型服務", "beige")
box(380, 50, 220, 64, "Hugging Face 等", "模型來源", "beige")

box(60, 195, 380, 62, "● 維運 (固定工作)", "版本鎖定與回退 · 機密管理 · 每週檢查安全公告 · ○ promptfoo", "gov", dashed=True)
box(590, 200, 170, 62, "既有 SIEM", "資安監控平台", "beige")
box(800, 208, 320, 52, "● Proxmox Backup Server 或 NAS", "備份伺服器", "beige")
box(65, 312, 250, 56, "● NFS 共享", "NAS 內建或 TrueNAS 等 · 模型存放區", "beige")
box(375, 312, 210, 58, "○ ModelScan 等", "模型入庫檢查 · 雜湊紀錄", "beige")

box(80, 458, 280, 84, "● vLLM", "推論伺服器", "beige", sub2="個人或低階硬體: Ollama / llama.cpp")
box(420, 462, 260, 66, "○ Langfuse · OTel · Prometheus", "可觀測與稽核平台", "beige")
box(740, 462, 180, 66, "◇ 官方或自建 MCP", "工具伺服器", "beige")
box(940, 462, 160, 66, "◇ Docker + gVisor", "程式碼沙箱", "beige")

box(80, 622, 280, 66, "○ LiteLLM", "模型閘道", "beige")
box(780, 622, 320, 66, "◇ MCP gateway (ToolHive 等)", "工具閘道 · 可由 LiteLLM 兼任", "beige")

box(80, 790, 250, 66, "● Open WebUI 等", "使用者介面", "purple")
box(380, 790, 180, 66, "○ Keycloak", "身分驗證伺服器", "beige")
box(380, 900, 180, 62, "○ Docling", "文件解析服務", "beige")
box(380, 1000, 180, 62, "○ Qdrant", "向量資料庫", "beige")
box(80, 1050, 260, 62, "● Nginx 或 Caddy", "反向代理伺服器", "beige")

box(620, 790, 240, 66, "◇ LangGraph", "代理流程控制", "purple")
box(890, 790, 210, 66, "◇ OPA", "政策引擎", "purple")
box(620, 946, 240, 62, "◇ 自建程式 + 本地模型", "隔離模型 · 處理不可信內容", "red")
box(620, 1072, 240, 70, "○ n8n", "流程自動化", "beige", sub2="排程 · Webhook 觸發")

box(100, 1247, 260, 58, "瀏覽器或桌面 App", "使用者裝置", "beige")
box(820, 1220, 330, 62, "log · 郵件 · 外部情資 · 上傳文件", "不可信內容來源", "red")

for jx, jy in [(660, 728), (840, 728), (590, 990)]:
    out.append(f'<circle cx="{jx}" cy="{jy}" r="3.2" fill="#8a8a8a"/>')

# ---------- protocol labels ----------
label(240, 1182, "HTTPS (僅限內網)", "start")
label(220, 960, "HTTP", "start")
label(354, 810, "OIDC")
label(312, 900, "HTTP", "start")
label(282, 1020, "Qdrant API", "start")
label(170, 742, "OpenAI 相容 API", "start")
label(470, 740, "OpenAI 相容 API *")
label(530, 706, "OpenAI 相容 API")
label(745, 728, "MCP")
label(1130, 1000, "MCP (雙向)")
label(873, 810, "REST")
label(850, 740, "MCP · HTTP", "start")
label(706, 576, "OTLP")
label(710, 905, "呼叫", "start")
label(810, 905, "JSON 欄位", "start")
label(1010, 1030, "syslog · IMAP · API", "start")
label(870, 580, "MCP · stdio", "start")
label(1040, 580, "MCP", "start")
label(230, 582, "OpenAI 相容 API", "start")
label(455, 644, "OTLP")
label(388, 489, "/metrics")
label(36, 153, "HTTPS", "start")
label(670, 392, "OTLP · syslog", "start")
label(970, 392, "PBS · HTTPS", "start")
label(570, 153, "HTTPS 下載", "start")
label(347, 330, "NFS 寫入")
label(200, 392, "NFS 唯讀", "start")

# ---------- legend ----------
ly = 1366
items = [("red", "接觸不可信內容"), ("purple", "可信控制區"), ("beige", "基礎設施")]
x = 40
for col, t in items:
    fill, stroke, text = C[col]
    out.append(f'<rect x="{x}" y="{ly}" width="16" height="16" rx="3" fill="{fill}" stroke="{stroke}"/>')
    out.append(f'<text x="{x + 24}" y="{ly + 13}" font-size="12.5" fill="#555">{t}</text>')
    x += 150
out.append(f'<text x="{x + 10}" y="{ly + 13}" font-size="12.5" fill="#555">'
           f'粗框 實體主機 · 細框 VM · 點線框 設備 · 虛線大框 區域 · 虛線箭頭 紀錄或對外流量 · ● 必要 ○ 依情境 ◇ 進階 · * 需自建轉接</text>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
       f'font-family="{FONT}" role="img" aria-labelledby="t d">'
       '<title id="t">地端 AI 部署架構</title>'
       '<desc id="d">雲端, 地端, 使用者端三區的部署架構, 標示實體主機, VM, 設備與各連線協定.</desc>'
       '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
       '<path d="M1 1 L9 5 L1 9 z" fill="#8a8a8a"/></marker></defs>'
       f'<rect width="{W}" height="{H}" fill="#ffffff"/>' + "".join(out) + "</svg>")
open(sys.argv[1], "w", encoding="utf-8").write(svg)
