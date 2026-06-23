# HyperFrames Design System & Style Guide

Use this guide to configure Mintlify docs or any other platform to match the HyperFrames brand.

---

## Color Palette

### Light Mode

| Token              | Hex       | Usage                                            |
| ------------------ | --------- | ------------------------------------------------ |
| `--bg`             | `#f6f5f1` | Page background                                  |
| `--surface`        | `#ffffff` | Cards, panels, elevated surfaces                 |
| `--surface2`       | `#eeedea` | Secondary surfaces, timeline, subtle backgrounds |
| `--border`         | `#e0dfdb` | Default borders                                  |
| `--border-light`   | `#d0cfcb` | Hover/active borders                             |
| `--text`           | `#1a1a1a` | Primary body text                                |
| `--text-secondary` | `#6b6b6b` | Secondary/muted text                             |
| `--text-tertiary`  | `#999999` | Tertiary/placeholder text                        |
| `--heading`        | `#0a0a0a` | Headings, nav brand, buttons                     |
| `--code-bg`        | `#ffffff` | Code block backgrounds                           |

#### Accent Colors (Light)

| Token                    | Hex                     | Usage                        |
| ------------------------ | ----------------------- | ---------------------------- |
| `--accent-green`         | `#1a7a0a`               | Success, recommended badges  |
| `--accent-green-light`   | `rgba(26,122,10,0.07)`  | Green badge backgrounds      |
| `--accent-green-border`  | `rgba(26,122,10,0.25)`  | Green badge borders          |
| `--accent-blue`          | `#2563eb`               | Links, info badges           |
| `--accent-blue-light`    | `rgba(37,99,235,0.06)`  | Blue badge backgrounds       |
| `--accent-blue-border`   | `rgba(37,99,235,0.2)`   | Blue badge borders           |
| `--accent-purple`        | `#7c3aed`               | Highlights, special elements |
| `--accent-purple-light`  | `rgba(124,58,237,0.06)` | Purple badge backgrounds     |
| `--accent-purple-border` | `rgba(124,58,237,0.2)`  | Purple badge borders         |

#### Syntax Highlighting (Light)

| Token                  | Hex       | Usage                           |
| ---------------------- | --------- | ------------------------------- |
| `--syntax-keyword`     | `#9333ea` | Keywords (const, let, function) |
| `--syntax-function`    | `#0891b2` | Function names                  |
| `--syntax-string`      | `#16a34a` | Strings, values                 |
| `--syntax-number`      | `#d97706` | Numbers                         |
| `--syntax-property`    | `#6366f1` | Object properties               |
| `--syntax-punctuation` | `#aaaaaa` | Brackets, semicolons            |
| `--syntax-tag`         | `#b45309` | HTML/JSX tags                   |
| `--syntax-attribute`   | `#555555` | HTML attributes                 |
| `--syntax-comment`     | `#bbbbbb` | Comments                        |

---

### Dark Mode

| Token              | Hex       | Usage                            |
| ------------------ | --------- | -------------------------------- |
| `--bg`             | `#0a0a0a` | Page background                  |
| `--surface`        | `#141414` | Cards, panels, elevated surfaces |
| `--surface2`       | `#1a1a1a` | Secondary surfaces               |
| `--border`         | `#2a2a2a` | Default borders                  |
| `--border-light`   | `#3a3a3a` | Hover/active borders             |
| `--text`           | `#e5e5e5` | Primary body text                |
| `--text-secondary` | `#a0a0a0` | Secondary/muted text             |
| `--text-tertiary`  | `#666666` | Tertiary/placeholder text        |
| `--heading`        | `#f5f5f5` | Headings                         |
| `--code-bg`        | `#141414` | Code block backgrounds           |

#### Accent Colors (Dark)

| Token                    | Hex                     | Usage                        |
| ------------------------ | ----------------------- | ---------------------------- |
| `--accent-green`         | `#22c55e`               | Success, recommended badges  |
| `--accent-green-light`   | `rgba(34,197,94,0.1)`   | Green badge backgrounds      |
| `--accent-green-border`  | `rgba(34,197,94,0.3)`   | Green badge borders          |
| `--accent-blue`          | `#3b82f6`               | Links, info badges           |
| `--accent-blue-light`    | `rgba(59,130,246,0.1)`  | Blue badge backgrounds       |
| `--accent-blue-border`   | `rgba(59,130,246,0.3)`  | Blue badge borders           |
| `--accent-purple`        | `#a78bfa`               | Highlights, special elements |
| `--accent-purple-light`  | `rgba(167,139,250,0.1)` | Purple badge backgrounds     |
| `--accent-purple-border` | `rgba(167,139,250,0.3)` | Purple badge borders         |

#### Syntax Highlighting (Dark)

| Token                  | Hex       | Usage                |
| ---------------------- | --------- | -------------------- |
| `--syntax-keyword`     | `#c084fc` | Keywords             |
| `--syntax-function`    | `#22d3ee` | Function names       |
| `--syntax-string`      | `#4ade80` | Strings, values      |
| `--syntax-number`      | `#fbbf24` | Numbers              |
| `--syntax-property`    | `#818cf8` | Object properties    |
| `--syntax-punctuation` | `#666666` | Brackets, semicolons |
| `--syntax-tag`         | `#fb923c` | HTML/JSX tags        |
| `--syntax-attribute`   | `#a0a0a0` | HTML attributes      |
| `--syntax-comment`     | `#555555` | Comments             |

---

## Typography

### Font Families

| Token            | Stack                                                                         | Usage                  |
| ---------------- | ----------------------------------------------------------------------------- | ---------------------- |
| `--font-display` | `'ABC Solar Display', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif` | Headlines, nav brand   |
| `--font-body`    | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`          | Body text, UI elements |
| `--font-mono`    | `'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace`                          | Code, terminals        |

### Google Fonts Import

```css
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap");
```

### Type Scale

| Element    | Size                           | Weight | Letter Spacing | Line Height |
| ---------- | ------------------------------ | ------ | -------------- | ----------- |
| H1         | `clamp(2.6rem, 6vw, 4.5rem)`   | 400    | `-0.02em`      | 1.0         |
| H2         | `clamp(1.6rem, 3.5vw, 2.2rem)` | 400    | `-0.02em`      | 1.2         |
| H3         | `1rem`                         | 600    | `-0.01em`      | 1.4         |
| Body       | `1rem`                         | 400    | `normal`       | 1.6         |
| Body Small | `0.95rem`                      | 400    | `normal`       | 1.7         |
| Caption    | `0.82rem`                      | 400    | `normal`       | 1.6         |
| Code       | `0.75rem`                      | 400    | `normal`       | 1.9         |
| Mono Small | `0.65rem`                      | 500    | `normal`       | 1.6         |

---

## Spacing

| Token | Value           | Usage               |
| ----- | --------------- | ------------------- |
| `xs`  | `0.25rem` (4px) | Tight gaps          |
| `sm`  | `0.5rem` (8px)  | Small gaps          |
| `md`  | `1rem` (16px)   | Default gaps        |
| `lg`  | `1.5rem` (24px) | Section gaps        |
| `xl`  | `2rem` (32px)   | Large spacing       |
| `2xl` | `4rem` (64px)   | Section padding     |
| `3xl` | `8rem` (128px)  | Hero/footer padding |

---

## Border Radius

| Token | Value           | Usage                  |
| ----- | --------------- | ---------------------- |
| `sm`  | `4px`           | Badges, small elements |
| `md`  | `6px`           | Buttons, inputs        |
| `lg`  | `8px`           | Cards, panels          |
| `xl`  | `10px` - `12px` | Large cards            |

---

## Shadows & Effects

- **No heavy shadows** - HyperFrames uses a flat, minimal aesthetic
- **Borders over shadows** - Use `1px solid var(--border)` instead of box-shadows
- **Backdrop blur** for nav: `backdrop-filter: blur(12px)`
- **Selection color**: `rgba(128,128,128,0.2)` (light) / `rgba(255,255,255,0.15)` (dark)

---

## Mintlify Configuration

The docs site at `docs/docs.json` implements this design system. Key settings:

```json
{
  "theme": "maple",
  "colors": {
    "primary": "#0a0a0a",
    "light": "#f6f5f1",
    "dark": "#0a0a0a"
  },
  "background": {
    "color": {
      "light": "#f6f5f1",
      "dark": "#0a0a0a"
    }
  },
  "fonts": {
    "family": "Inter",
    "heading": { "family": "Inter" }
  },
  "appearance": {
    "default": "light"
  }
}
```

Additional overrides (code font, CSS variables, heading tracking) live in `docs/custom.css`.

---

## Component Patterns

### Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--border-light);
}
```

### Buttons

```css
.btn-primary {
  font-size: 0.8rem;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  background: var(--heading);
  color: #fff;
  font-weight: 500;
}

[data-theme="dark"] .btn-primary {
  background: var(--heading);
  color: #0a0a0a;
}
```

### Code Blocks / Terminals

```css
.terminal {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.terminal-bar {
  display: flex;
  gap: 5px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.terminal-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-light);
}

.terminal-body {
  padding: 0.85rem 1.1rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.9;
}
```

### Badges

```css
.badge-green {
  color: var(--accent-green);
  background: var(--accent-green-light);
  border: 1px solid var(--accent-green-border);
}

.badge-blue {
  color: var(--accent-blue);
  background: var(--accent-blue-light);
  border: 1px solid var(--accent-blue-border);
}

.badge-purple {
  color: var(--accent-purple);
  background: var(--accent-purple-light);
  border: 1px solid var(--accent-purple-border);
}
```

---

## Animation Guidelines

- **Duration**: 0.15s - 0.2s for micro-interactions, 0.5s for reveals
- **Easing**: `ease` or `ease-out` for most transitions
- **Hover states**: Use `opacity: 0.85` or border color changes
- **Scroll reveals**: `translateY(20px)` with opacity fade

---

## Brand Assets

- **Logo**: "HyperFrames" in `--font-display` at 600 weight
- **Primary color**: `#0a0a0a` (near-black)
- **Warm neutral palette**: Beige/cream tones, not pure grays

---
---

# 🎬 AutoVideo - Thư viện Mẫu Design Video (Viral MXH)

> Phần này là **catalog các "design" của video đầu ra** (không phải design của trang docs ở trên).
> Mỗi mẫu định nghĩa **bảng màu + font + nền + viền/bo góc + lớp trang trí + kiểu tiêu đề**, được
> bơm vào composition khi render. Người dùng chọn mẫu ngay trên giao diện (lưới preview).

## Hai nhóm mẫu

| Nhóm | Số lượng | Đặc điểm | Vị trí định nghĩa |
| ---- | -------- | -------- | ----------------- |
| **Theme màu** (gốc) | 10 | Cùng cấu trúc "điện ảnh" (bokeh + vignette + grain), chỉ khác bảng màu - đều nền tối. | `THEMES[]` không có trường `style` |
| **Design Style** (mới) | 10 | Mỗi mẫu một **phong cách thị giác riêng**: đổi cả nền, font, viền, trang trí. Có sáng/tối. | `THEMES[]` có `style` + `designCss(style)` |

### Cơ chế (file liên quan)

```
src/themes.js        → bảng màu + style + font + fontLink của từng mẫu (trường mới:
                        style, light, strongFg, capFg, titleFill, font, fontLink)
src/composition.js   → designCss(style): khối CSS ghi đè theo .design-<style>;
                        nạp <link> Google Fonts; gắn class lên #stage
public/app.js        → previewBg()/themeSwatch(): dựng "ảnh preview" mini theo phong cách
public/style.css     → .th-screen.s-<style>: CSS preview cho từng mẫu
```

Biến chữ được tách thành CSS var để hỗ trợ **nền sáng** mà không vỡ chữ:
`--strong-fg` (tiêu đề/đậm), `--cap-fg` + `--cap-shadow` (phụ đề), `--title-fill` (nền clip-text tiêu đề).
10 theme màu gốc dùng giá trị mặc định nên **render y hệt như trước** (không hồi quy).

> **HeyGen:** các mẫu này CHỈ ảnh hưởng nửa khung "slide". Nhánh ghép avatar trong
> `pipeline.js` (supersample → lanczos downscale, `crf 18`, preset `slow`) **không bị đụng tới**,
> nên chất lượng video HeyGen giữ nguyên. Canvas/nền ghép vẫn lấy màu đặc qua `themeBg(theme)`.

---

## 10 Mẫu Design mới

Bảng tổng quan (sắp theo độ "viral" cho từng nền tảng):

| # | id (`style`) | Tên | Nền | Font tiêu đề | Hợp nội dung / nền tảng |
| - | ------------ | --- | --- | ------------ | ----------------------- |
| 1 | `neo-brutal` | Neo Brutal | Vàng điện (sáng) | Archivo 900 | Hook gây sốc, meme kiến thức · TikTok/Reels |
| 2 | `vaporwave`  | Vaporwave | Gradient hoàng hôn tím→cam | Orbitron | Aesthetic, retro, "vibe" · TikTok/IG |
| 3 | `y2k-aero`   | Y2K Aero | Aqua bóng kính (sáng) | Rubik | Gen-Z hoài niệm 2000s · IG/TikTok |
| 4 | `editorial`  | Editorial | Giấy kem (sáng) | Playfair Display | Nội dung sâu, "sang", thương hiệu · IG/LinkedIn |
| 5 | `aurora-mesh`| Aurora Mesh | Mesh cực quang (tối) | Inter | SaaS/AI/startup, công nghệ · LinkedIn/X |
| 6 | `pop-comic`  | Pop Comic | Vàng pop + halftone (sáng) | Bangers | Giải trí, hài, "gây cười" · TikTok/Reels |
| 7 | `neon-glow`  | Neon Glow | Đen + lưới neon (tối) | Orbitron | Tech/AI/crypto/gaming · YouTube/X |
| 8 | `swiss-mono` | Swiss Mono | Trắng tối giản (sáng) | Inter 800 | Designer, tối giản, trích dẫn · IG/LinkedIn |
| 9 | `frost-glass`| Frost Glass | Blob màu + kính mờ (tối) | Inter | App/sản phẩm hiện đại, lifestyle · IG |
| 10| `blueprint`  | Blueprint | Navy + lưới kỹ thuật (tối) | IBM Plex Mono | Giáo dục, kỹ thuật, "how-it-works" · YouTube |

> **Nguyên tắc giữ chữ luôn rõ:** mẫu nền sáng đặt `light:true` + `strongFg/capFg` tông tối;
> mẫu nền tối giữ chữ trắng. Phụ đề karaoke luôn tương phản với nền (kiểm tra contrast khi thêm mẫu).

### FORMAT đầy đủ - mỗi mẫu là một "format video" riêng

Mỗi design KHÔNG chỉ khác skin (màu/font/nền) mà khác cả **3 tầng chuyển động**, định nghĩa ở
`composition.js`: `FORMAT_TRANSITION` (chuyển cảnh), `CAPTION_FORMAT` (phụ đề chạy),
`ENTRANCE_PROFILE` (tiết tấu chữ/khối xuất hiện). 10 theme màu gốc giữ mặc định (crossfade /
caption trượt lên / tiết tấu chuẩn) → không hồi quy.

| Design | Chuyển cảnh (transition) | Phụ đề (caption) | Tiết tấu (entrance) |
| ------ | ------------------------ | ---------------- | ------------------- |
| `neo-brutal` | **slide** - trượt ngang dứt khoát | **slam** - đập chữ to→nhỏ | snappy (`back.out`, nhanh) |
| `vaporwave` | **zoom** - phóng + mờ mơ màng | **glitch** - RGB jitter | dreamy (`expo`, chậm-giãn) |
| `y2k-aero` | **iris** - mở ống kính tròn | **pill** - viên nang bóng | bouncy (`back.out`) |
| `editorial` | **crossfade-slow** - mờ chậm | **weight** - mảnh→đậm | gentle (`power2`, rất chậm) |
| `aurora-mesh` | **dissolve** - tan mờ mượt | default (trượt lên) | smooth (`power3`) |
| `pop-comic` | **flash** - chớp trắng "POW" | **slam** - đập kiểu comic | bouncy mạnh (`back.out 2.6`) |
| `neon-glow` | **glitch** - chớp cyan + giật khung | **neon** - phát sáng | techno (`power4`, nhanh) |
| `swiss-mono` | **wipe** - gạt clip-path | default (nhấn đỏ) | precise (`power3.inOut`) |
| `frost-glass` | **push-up** - đẩy dọc lên | **pill** - viên nang kính | soft (`power2`) |
| `blueprint` | **flip** - lật 3D quanh trục dọc | **typewriter** - gõ máy + con trỏ | mechanical (`steps()` robot) |

**Transition khả dụng:** `crossfade` (mặc định) · `crossfade-slow` · `slide` · `push-up` · `zoom` ·
`dissolve` · `wipe` · `iris` · `flash` · `glitch` · `flip`.
**Caption khả dụng:** `default` · `slam` · `pill` · `neon` · `weight` · `typewriter` · `glitch`.

> **Nâng cấp tương lai (từ catalog gốc HyperFrames):** transition **shader WebGL** thật
> (cinematic-zoom, grid-pixelate-wipe, cross-warp-morph, gravitational-lens - xem `registry/registry.json`)
> và caption nâng cao (matrix-decode, particle-burst, parallax-layers). Các bản hiện tại dùng CSS/GSAP
> nên render nhanh, ổn định, không cần WebGL.

---

### 1. `neo-brutal` - Neo Brutal

- **Concept:** Brutalism web - phẳng, thô, "đập vào mặt". Cực kỳ viral nhờ tương phản mạnh.
- **Palette:** nền `#ffe600` · thẻ `#fff` · viền `#0a0a0a` · accent đỏ `#ff2d55`, xanh `#1463ff`.
- **Typography:** Archivo 800-900, chữ to, tiêu đề có **đổ bóng cứng lệch** (`text-shadow:5px 5px 0`).
- **Nền & trang trí:** phẳng, **TẮT** bokeh/vignette/grain. Viền đen `4px`, **không bo góc**, bóng cứng `8px 8px 0`.
- **Kicker/Phụ đề:** kicker nền đỏ viền đen; phụ đề khối đen chữ trắng, bóng đỏ.

```
┌───────────────────────────┐  nền VÀNG
│  ▌CHỦ ĐỀ▐   (đỏ, viền đen) │
│  TIÊU ĐỀ NỔI BẬT          │  ← bóng cứng lệch
│  ┏━━━━━┓ ┏━━━━━┓          │  thẻ trắng viền đen 4px
│  ┃ ◆   ┃ ┃ ◆   ┃  ░bóng░  │  bóng đen 8px lệch phải-dưới
└───────────────────────────┘
```

### 2. `vaporwave` - Vaporwave / Retro 80s

- **Concept:** Thẩm mỹ synthwave: mặt trời gradient + lưới phối cảnh chạy về chân trời.
- **Palette:** nền gradient `#2a0b4d → #ff5fa2 → #ffb86b`; neon hồng `#ff4fd8`, cyan `#23e0ff`.
- **Typography:** Orbitron cho tiêu đề; chữ "chrome" có viền cyan/hồng nhiều lớp.
- **Nền & trang trí:** `::before` mặt trời tròn phát sáng; `::after` lưới perspective (`rotateX(72deg)`). Thẻ kính tím viền neon.

### 3. `y2k-aero` - Y2K Aero

- **Concept:** Frutiger Aero / bóng kính đầu 2000s - sạch, bóng, trong trẻo.
- **Palette:** nền sáng aqua `#dff1ff → #a9d8ff`; xanh `#0aa3ff`, ngọc `#33d6c0`.
- **Typography:** Rubik 700-900, chữ navy `#0b2236`.
- **Nền & trang trí:** vệt sáng góc trên; thẻ **gloss** trắng→aqua bo `24px`, highlight `inset 0 2px 0 #fff`, đổ bóng xanh nhạt.

### 4. `editorial` - Editorial / Tạp chí

- **Concept:** Trang tạp chí cao cấp (Kinfolk) - serif, giấy kem, nhiều khoảng thở. Tăng độ "uy tín".
- **Palette:** giấy `#f4efe6` · mực `#1c1814` · accent đồng `#9a6a2c`, đỏ gạch `#b8472f`.
- **Typography:** **Playfair Display** cho mọi tiêu đề/trích dẫn; kicker Inter giãn chữ, kẻ chỉ trên-dưới.
- **Nền & trang trí:** phẳng, không hiệu ứng; thẻ kem viền mảnh `#d8cdb8`, bo `4px`, bóng rất nhẹ.

### 5. `aurora-mesh` - Aurora Mesh

- **Concept:** Gradient mesh kiểu landing-page SaaS/AI - mượt, hiện đại, "đắt tiền".
- **Palette:** nền tối `#070a18` phủ 4 quầng màu (tím/hồng/ngọc/cam); chữ trắng.
- **Typography:** Inter; tiêu đề clip-text trắng→xanh nhạt.
- **Nền & trang trí:** 4 `radial-gradient` cực quang; thẻ **kính** `rgba(255,255,255,.07)` + `backdrop-filter: blur(12px)`.

### 6. `pop-comic` - Pop Comic

- **Concept:** Pop-art/truyện tranh - halftone, viền đen dày, chữ Bangers. Rất "bắt trend" giải trí.
- **Palette:** nền `#fff2cc` · đỏ `#e8261c` · xanh `#0a6cff` · vàng `#ffcb00`.
- **Typography:** **Bangers** cho tiêu đề (viền đen `-webkit-text-stroke` + bóng cứng); body Inter dễ đọc.
- **Nền & trang trí:** `::before` chấm **halftone** đỏ; thẻ trắng viền đen `4px`, bóng cứng. Phụ đề chữ trắng viền đen.

### 7. `neon-glow` - Neon Glow / Cyberpunk

- **Concept:** Bảng hiệu neon trên nền đen - tech/AI/gaming/crypto.
- **Palette:** đen `#03040a`; neon cyan `#1de9ff`, tím `#bd00ff`, xanh `#39ff88`.
- **Typography:** Orbitron; tiêu đề **phát sáng** nhiều lớp `text-shadow` (giữ chữ đặc, không clip-text để glow hiện rõ).
- **Nền & trang trí:** lưới neon mờ dần ra rìa (mask radial); thẻ nền tối viền cyan, glow trong/ngoài.

### 8. `swiss-mono` - Swiss Mono

- **Concept:** Phong cách Quốc tế Thuỵ Sĩ - trắng/đen, một điểm nhấn đỏ, lưới chặt. Tối giản "designer".
- **Palette:** nền `#fafafa` · mực `#111` · đỏ `#ff2d2d`.
- **Typography:** Inter 800, giãn âm (`letter-spacing:-2px`).
- **Nền & trang trí:** phẳng tuyệt đối; thẻ trắng viền `1px` đen **vuông**, không bóng; kicker khối đỏ vuông; số/nhấn màu đỏ.

### 9. `frost-glass` - Frost Glass

- **Concept:** Glassmorphism (iOS/macOS) - kính mờ nổi trên các khối màu rực.
- **Palette:** nền `#0c1430` + blob `#5ad1ff/#b07bff/#ff8fd0/#ffd86b`; chữ trắng.
- **Typography:** Inter.
- **Nền & trang trí:** `::before` 4 blob `blur(70px)`; thẻ kính dày `backdrop-filter: blur(20px)`, viền sáng, highlight trên.

### 10. `blueprint` - Blueprint / Bản vẽ kỹ thuật

- **Concept:** Giấy can kỹ thuật - lưới cyan kép, font mono, viền nét đứt. Hợp nội dung "cơ chế/quy trình".
- **Palette:** navy `#0a1b2e`; cyan `#5cc8ff`, ngọc `#7fffd4`, vàng `#ffd86b`.
- **Typography:** **IBM Plex Mono** toàn bộ.
- **Nền & trang trí:** `::before` lưới 2 lớp (`32px` + `160px`); thẻ trong suốt nhẹ viền **nét đứt**; kicker khung viền cyan.

---

## Format LINH HOẠT (random) - chỉ MÀU là cố định

Nguyên tắc: **mẫu (template) = bảng MÀU + skin cố định**; còn **format thì NGẪU NHIÊN mỗi video**,
KHÔNG fix cứng theo mẫu. Nhờ vậy cùng một mẫu màu, mỗi lần render ra một phong cách trình bày khác.

`randomFormat()` trong [`themes.js`](tools/auto-video-studio/src/themes.js) chọn ngẫu nhiên 4 thứ:

| Trục | Pool (chọn ngẫu nhiên 1) |
| ---- | ------------------------ |
| **transition** | crossfade, crossfade-slow, slide, push-up, zoom, dissolve, wipe, iris, flash, glitch, flip (11) |
| **caption** | default, slam, pill, neon, weight, typewriter, glitch (7) |
| **entrance** (tiết tấu) | default, snappy, dreamy, bouncy, gentle, smooth, techno, precise, soft, mechanical (10) |
| **media** (bố cục) | mixed, image, diagram, stat, text (5) |

→ ~11×7×10×5 = **3.850 tổ hợp format**, dùng chung cho mọi mẫu màu.

Luồng: [`pipeline.js`](tools/auto-video-studio/src/pipeline.js) gọi `randomFormat()` **một lần / video**:
- `media` đẩy vào prompt AI ([`openrouter.js`](tools/auto-video-studio/src/openrouter.js)) → chọn bố cục
  (image = nhiều ảnh thật, diagram = nhiều sơ đồ, stat = số liệu, text = cô đọng, mixed = cân bằng);
  `preferForMedia(media)` cho danh sách layout ưu tiên.
- `transition/caption/entrance` truyền vào `buildComposition({ format })`.

Ép cứng (nếu cần test/đặc thù): `randomFormat({ transition:"flip", media:"diagram" })`.
Màu của mẫu vẫn cố định qua `THEMES` (bg/panel/accent/skin) - không random.

> Trang `/live-preview/` random một format mỗi lần dựng (mỗi lần chạy `make-previews.mjs` ra khác);
> đây chỉ là minh hoạ - khi render thật, mỗi video tự random.

---

## Thư viện layout (bố cục cảnh)

Bộ layout (định nghĩa trong `sceneHtml`/CSS ở [`composition.js`](tools/auto-video-studio/src/composition.js),
AI chọn theo `media`). Tất cả đã kiểm tra chống tràn chữ/viền ở cả 16:9 và 9:16
(`overflow-wrap:break-word`, `min-width:0` cho flex, `max-width` trong vùng stage, giới hạn số phần tử, có bản dọc).

| Nhóm | Layout |
| ---- | ------ |
| Mở/đóng | `title`, `section`, `outro` |
| Chữ | `statement`, `quote`, `definition`, `checklist`, `bullets`, `point` |
| Thẻ/lưới | `cards`, `icongrid`, `popup` |
| Số liệu | `stat`, `bignum`, `kpi`, `bars`, `gauge` |
| Sơ đồ/tiến trình | `flow`, `steps`, `timeline`, `roadmap`, `compare`, `pros`, `formula` |
| Ảnh thật | `photo` (Ken Burns), `split`, `gallery` |
| Mẫu/mã | `prompt` |

Layout mới bổ sung gần đây: **bignum** (1 con số khổng lồ), **kpi** (thẻ chỉ số + mũi tên tăng/giảm),
**gauge** (vòng tròn %), **definition** (thuật ngữ + định nghĩa), **checklist** (danh sách tick),
**icongrid** (lưới icon), **pros** (ưu/nhược), **roadmap** (timeline ngang).

### "Dẫn chứng thực tế" dựng bằng HTML (thay ảnh stock)

Thay vì tải ảnh ngoài chung chung, ưu tiên 3 layout DỰNG bằng HTML cho sát nội dung:

- **`code`** - khung code tô màu cú pháp + số dòng + tên file (kiểu `ralph.sh`). Field: `kicker` (tên file), `code` (nhiều dòng).
- **`browser`** - "ảnh chụp" trang web/bài báo: thanh URL + tiêu đề + trích đoạn + callout nổi bật. Field: `url`, `heading`, `text`, `tag`.
- **`loop`** - sơ đồ vòng lặp tròn: các bước quanh vòng + nhãn giữa. Field: `steps:[{title}]`, `center`.

Lệ thuộc ảnh ngoài đã GIẢM: `MAX_AUTO_IMAGES` mặc định **4** (trước 8); media "image" ưu tiên
`code/browser` hơn `photo/gallery`; prompt dặn chỉ dùng `photo` 1-2 cảnh khi có vật thể thật.

### Layout `custom` - gọi Claude/AI sinh HTML tự do

Có. AI (qua OpenRouter, có thể chọn model Claude) trả về trường `html` cho layout `custom`;
composition **lọc an toàn** (bỏ `script/iframe/handler`, thay em-dash) rồi đặt trong khung
`overflow:hidden` nên **không tràn**. HTML có thể dùng biến theme (`var(--teal)`, `var(--panel)`...)
để đồng bộ màu. Dùng cho bố cục đặc biệt ngoài 31 layout dựng sẵn.

---

## Ảnh thật tự động + Sơ đồ + Color grade

Ngoài 3 tầng motion, video còn có thể **trực quan hoá bằng ảnh thật** và **sơ đồ**, và phủ
**màu phim** theo design.

### Ảnh thật (auto-search, miễn phí, không key)

- Module [`src/images.js`](tools/auto-video-studio/src/images.js): tìm ảnh qua **Openverse**
  (ảnh Creative Commons) → fallback **Wikimedia Commons**, rồi **tải về** `workdir/task-*/img/`.
  Best-effort: lỗi mạng → bỏ ảnh, layout tự degrade (photo→section, split→point).
- Pipeline ([`pipeline.js`](tools/auto-video-studio/src/pipeline.js) → `resolveSceneImages`) chạy
  TRƯỚC khi dựng composition, cho **cả 2 chế độ** (slide & HeyGen). Giới hạn `MAX_AUTO_IMAGES`
  (mặc định 8); tắt bằng env `DISABLE_AUTO_IMAGES=1`.
- Layout ảnh: **`photo`** (ảnh nền full-khung + Ken Burns GSAP), **`split`** (nửa ảnh|nửa chữ),
  **`gallery`** (2-3 ảnh). Ghi nguồn/giấy phép ở góc khung (`.img-credit`).
- AI cấp **`query` bằng TIẾNG ANH** (vd `"solar panels on rooftop"`) để khớp ảnh tốt; pipeline
  tự tải và đặt `scene.image`/`scene.images` (đường dẫn `img/sN.ext`).

### Sơ đồ (thuần SVG/CSS, không cần ảnh)

- **`bars`** - biểu đồ cột động (`items:[{label,value}]`, value % hoặc số), cột mọc bằng `scaleX`.
- **`timeline`** - dòng thời gian dọc (`items:[{time,title,body}]`), chấm + đường nối, vào lần lượt.
- Bổ sung cho các "sơ đồ" sẵn có: `flow` (cơ chế), `compare` (A/B), `formula` (quan hệ), `steps` (các bước).

### Color grade bằng ffmpeg (chất phim theo design)

- Map `GRADE` trong `pipeline.js`: mỗi design một bộ lọc `eq`/`colorbalance` **nhẹ** (vaporwave rực,
  editorial ấm, neon tương phản, blueprint lạnh…), áp ở `muxFinal` qua `-vf` (re-encode x264 crf 18).
- **CHỈ áp ở chế độ chỉ-slide.** Chế độ **HeyGen KHÔNG grade** (giữ nguyên độ trung thực avatar) - `compositeHeygen` không gọi `gradeFor`.
- Tắt toàn cục bằng env `DISABLE_GRADE=1`.

---

## Thêm một mẫu design mới (checklist)

1. **`src/themes.js`** → thêm object vào `THEMES[]`: `id`, `name`, `desc`, `style` (id phong cách),
   `light` nếu nền sáng, bảng màu (`bg/panel/panel2/line/muted/text`, `a1..a3`, `hl`, `glowHex/stageHex`),
   và khi cần: `font`, `fontLink`, `strongFg`, `capFg`, `titleFill`.
2. **`src/composition.js`** → thêm nhánh `case "<style>":` trong `designCss()` (ghi đè `#stage` + `.design-<style> …`).
   Dùng helper `on(style, [selectors], rule)` và `hideDecor(style)`; trang trí bằng `::before/::after`
   trên `#stage` (không thêm DOM). Áp font hiển thị cho **tiêu đề**, giữ body dễ đọc.
3. **`public/app.js`** → thêm nhánh nền trong `previewBg()` (nếu nền đặc biệt).
4. **`public/style.css`** → thêm `.th-screen.s-<style> …` để preview mini giống thật.
5. **DESIGN.md** → thêm mục mô tả như trên.
6. Test: `node -e` dựng `buildComposition({theme:"<id>"})` cho cả `16:9` và `9:16`; soi `workdir/.../index.html`.

> **Lưu ý nền sáng:** nếu `light:true`, kiểm tra mọi chữ trắng hardcode cũ đã chuyển sang
> `--strong-fg`/`--cap-fg` chưa, và chọn `--cap-shadow` đủ tương phản với nền.
> **Lưu ý font:** font hiển thị (Orbitron/Bangers/Playfair) chỉ nên áp cho tiêu đề; body dùng
> Inter/serif/mono dễ đọc. Khi render offline, font fallback theo stack - vẫn chạy, chỉ kém "chất".
