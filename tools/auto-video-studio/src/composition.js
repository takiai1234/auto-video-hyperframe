// Sinh composition HyperFrames từ một "kịch bản phân cảnh" đa layout.
// Mỗi scene có `layout` (title|statement|bullets|cards|formula|flow|compare|stat|steps|outro)
// và dữ liệu riêng. Giọng đọc liền mạch; frame chỉ minh hoạ, chuyển cảnh crossfade.

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function arr(x) {
  return Array.isArray(x) ? x : [];
}
const ACCENTS = ["teal", "amber", "violet"];

function initials(s) {
  const w = String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!w.length) return "▶";
  if (w.length === 1) return w[0].slice(0, 3).toUpperCase();
  return w
    .slice(0, 3)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

// ---------- HTML cho từng layout ----------
function sceneHtml(s, i) {
  const acc = ACCENTS[i % ACCENTS.length];
  const p = `s${i}`;
  const kicker = s.kicker ? `<div class="kicker" id="${p}_k">${esc(s.kicker)}</div>` : "";
  const heading = s.heading ? `<h2 class="heading" id="${p}_h">${esc(s.heading)}</h2>` : "";
  let inner = "";

  switch (s.layout) {
    case "title":
      inner = `<div class="badge" id="${p}_badge">${esc(s.initials || initials(s.title || s.heading))}</div>
        <h1 class="title-h" id="${p}_h">${esc(s.title || s.heading)}</h1>
        ${s.subtitle ? `<div class="title-sub" id="${p}_sub">${esc(s.subtitle)}</div>` : ""}`;
      break;

    case "statement":
      inner = `${kicker}<div class="statement" id="${p}_st"><span class="bar"></span><div class="statement-text">${esc(s.text || s.heading)}</div></div>`;
      break;

    case "bullets":
      inner =
        `${kicker}${heading}<div class="blist">` +
        arr(s.items)
          .slice(0, 5)
          .map(
            (it, j) =>
              `<div class="bitem" id="${p}_i${j}"><span class="bic">${esc(it.icon || "▹")}</span><span class="btext">${esc(it.text || it.title || it)}</span></div>`,
          )
          .join("") +
        `</div>`;
      break;

    case "cards":
      inner =
        `${kicker}${heading}<div class="card-row">` +
        arr(s.items)
          .slice(0, 3)
          .map(
            (it, j) =>
              `<div class="vcard" id="${p}_i${j}"><div class="ic">${esc(it.icon || "◆")}</div><h3>${esc(it.title || "")}</h3><p>${esc(it.body || "")}</p></div>`,
          )
          .join("") +
        `</div>`;
      break;

    case "formula":
      inner =
        `${kicker}${heading}<div class="formula">` +
        arr(s.terms)
          .map((t, j) => {
            if (t.op) return `<div class="op" id="${p}_i${j}">${esc(t.op)}</div>`;
            return `<div class="pill ${esc(t.kind || "")}" id="${p}_i${j}">${esc(t.label)}</div>`;
          })
          .join("") +
        `</div>`;
      break;

    case "flow": {
      const steps = arr(s.steps).slice(0, 5);
      inner =
        `${kicker}${heading}<div class="flow">` +
        steps
          .map((st, j) => {
            const box = `<div class="fbox ${st.hot ? "hot" : ""}" id="${p}_i${j}"><div class="ic">${esc(st.icon || "■")}</div><div class="t">${esc(st.title || "")}</div>${st.desc ? `<div class="d">${esc(st.desc)}</div>` : ""}</div>`;
            const arrow = j < steps.length - 1 ? `<div class="arrow" id="${p}_a${j}">→</div>` : "";
            return box + arrow;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "compare": {
      const L = s.left || {},
        R = s.right || {};
      const col = (c, side) =>
        `<div class="cmp-col ${side}"><div class="cmp-title">${esc(c.title || "")}</div>` +
        arr(c.points)
          .slice(0, 4)
          .map((pt) => `<div class="cmp-pt">${esc(pt)}</div>`)
          .join("") +
        `</div>`;
      inner = `${kicker}${heading}<div class="cmp"><div class="cmp-wrap" id="${p}_L">${col(L, "l")}</div><div class="cmp-vs" id="${p}_vs">VS</div><div class="cmp-wrap" id="${p}_R">${col(R, "r")}</div></div>`;
      break;
    }

    case "stat":
      inner =
        `${kicker}${heading}<div class="stat-row">` +
        arr(s.stats)
          .slice(0, 4)
          .map(
            (st, j) =>
              `<div class="stat" id="${p}_i${j}"><div class="stat-val">${esc(st.value)}</div><div class="stat-label">${esc(st.label || "")}</div></div>`,
          )
          .join("") +
        `</div>`;
      break;

    case "steps":
      inner =
        `${kicker}${heading}<div class="steps">` +
        arr(s.items)
          .slice(0, 5)
          .map(
            (it, j) =>
              `<div class="step" id="${p}_i${j}"><div class="step-num">${j + 1}</div><div class="step-body"><div class="step-title">${esc(it.title || "")}</div>${it.body ? `<div class="step-desc">${esc(it.body)}</div>` : ""}</div></div>`,
          )
          .join("") +
        `</div>`;
      break;

    case "outro":
      inner =
        `${kicker}<h2 class="outro-h" id="${p}_h">${esc(s.heading || "Cảm ơn bạn đã theo dõi")}</h2>` +
        (arr(s.chips).length
          ? `<div class="chips">` +
            arr(s.chips)
              .slice(0, 4)
              .map((c, j) => `<div class="chip" id="${p}_i${j}">${esc(c)}</div>`)
              .join("") +
            `</div>`
          : "") +
        (s.subtitle ? `<div class="outro-sub" id="${p}_sub">${esc(s.subtitle)} 🎬</div>` : "");
      break;

    default: // fallback = statement
      inner = `${kicker}${heading}${s.body ? `<div class="point-body" id="${p}_b">${esc(s.body)}</div>` : ""}`;
  }

  return `      <section class="scene acc-${acc} layout-${esc(s.layout || "point")}" id="scene-${i}">\n        ${inner}\n      </section>`;
}

// ---------- Entrance animations cho từng layout ----------
function sceneEntrances(s, i, start) {
  const p = `s${i}`;
  const t = (x) => (start + x).toFixed(3);
  const L = [];
  const headIn = () => {
    if (s.kicker)
      L.push(
        `tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.05)});`,
      );
    if (s.heading && s.layout !== "title")
      L.push(
        `tl.from("#scene-${i} .heading", { y: 38, opacity: 0, duration: 0.55, ease: "expo.out" }, ${t(0.25)});`,
      );
  };
  const stagger = (sel, from, base = 0.5, step = 0.12) =>
    L.push(
      `tl.from("${sel}", { ${from}, duration: 0.5, ease: "back.out(1.4)", stagger: ${step} }, ${t(base)});`,
    );

  switch (s.layout) {
    case "title":
      L.push(
        `tl.from("#${p}_badge", { scale: 0, rotation: -18, opacity: 0, duration: 0.7, ease: "back.out(1.7)" }, ${t(0.1)});`,
      );
      L.push(
        `tl.from("#${p}_h", { y: 70, opacity: 0, duration: 0.8, ease: "expo.out" }, ${t(0.55)});`,
      );
      if (s.subtitle)
        L.push(
          `tl.from("#${p}_sub", { y: 28, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(1.05)});`,
        );
      break;
    case "statement":
      if (s.kicker)
        L.push(
          `tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.05)});`,
        );
      L.push(
        `tl.from("#${p}_st .bar", { scaleY: 0, opacity: 0, duration: 0.5, ease: "power3.out", transformOrigin: "top center" }, ${t(0.2)});`,
      );
      L.push(
        `tl.from("#${p}_st .statement-text", { y: 30, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.4)});`,
      );
      break;
    case "bullets":
      headIn();
      stagger(`#scene-${i} .bitem`, "x: -40, opacity: 0", 0.7, 0.13);
      break;
    case "cards":
      headIn();
      stagger(`#scene-${i} .vcard`, "y: 55, opacity: 0", 0.7, 0.15);
      break;
    case "formula":
      headIn();
      stagger(`#scene-${i} .formula > *`, "scale: 0.5, opacity: 0", 0.7, 0.12);
      break;
    case "flow":
      headIn();
      stagger(`#scene-${i} .fbox`, "y: 45, opacity: 0", 0.7, 0.18);
      L.push(
        `tl.from("#scene-${i} .arrow", { opacity: 0, scale: 0, duration: 0.3, ease: "power2.out", stagger: 0.18 }, ${t(0.95)});`,
      );
      break;
    case "compare":
      headIn();
      L.push(
        `tl.from("#${p}_L", { x: -50, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.7)});`,
      );
      L.push(
        `tl.from("#${p}_R", { x: 50, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.9)});`,
      );
      L.push(
        `tl.from("#${p}_vs", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)" }, ${t(1.2)});`,
      );
      break;
    case "stat":
      headIn();
      stagger(`#scene-${i} .stat`, "scale: 0.6, opacity: 0", 0.7, 0.16);
      break;
    case "steps":
      headIn();
      stagger(`#scene-${i} .step`, "x: -45, opacity: 0", 0.7, 0.14);
      break;
    case "outro":
      if (s.kicker)
        L.push(
          `tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.05)});`,
        );
      L.push(
        `tl.from("#${p}_h", { scale: 0.82, opacity: 0, duration: 0.7, ease: "back.out(1.6)" }, ${t(0.3)});`,
      );
      if (arr(s.chips).length) stagger(`#scene-${i} .chip`, "y: 30, opacity: 0", 0.9, 0.12);
      if (s.subtitle)
        L.push(
          `tl.from("#${p}_sub", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(1.3)});`,
        );
      break;
    default:
      headIn();
      if (s.body)
        L.push(
          `tl.from("#${p}_b", { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(0.7)});`,
        );
  }
  return L;
}

export function buildComposition({
  id,
  scenes,
  starts,
  total,
  aspectRatio = "16:9",
  captureWidth,
  captureHeight,
}) {
  const TOTAL = Number(total.toFixed(3));
  const sectionsHtml = scenes.map((s, i) => sceneHtml(s, i)).join("\n");

  const tweens = [];
  tweens.push(
    `tl.to("#bg-glow", { opacity: 0.5, scale: 1.12, duration: 2, ease: "sine.inOut", yoyo: true, repeat: Math.max(0, Math.floor(${TOTAL} / 4) - 1), transformOrigin: "center center" }, 0);`,
  );
  tweens.push(`tl.set("#scene-0", { opacity: 1 }, 0);`);

  scenes.forEach((s, i) => {
    if (i > 0) {
      const tt = Math.max(0, starts[i] - 0.35).toFixed(3);
      tweens.push(`transition(${tt}, "#scene-${i - 1}", "#scene-${i}");`);
    }
    tweens.push(...sceneEntrances(s, i, starts[i]));
  });

  const lastIdx = scenes.length - 1;
  const fadeAt = Math.max(0, TOTAL - 1.0).toFixed(3);
  tweens.push(
    `tl.to("#scene-${lastIdx}", { opacity: 0, duration: 0.9, ease: "power2.in" }, ${fadeAt});`,
  );

  const isPortrait = aspectRatio === "9:16";
  // Kích thước "canvas thiết kế" (mọi px trong CSS được tinh chỉnh theo cỡ này).
  const width = isPortrait ? 1080 : 1920;
  const height = isPortrait ? 1920 : 1080;
  // Kích thước khung CHỤP thật. Mặc định = canvas thiết kế (không đổi gì so với trước).
  // Khi ghép HeyGen, Hyperframe chỉ chiếm một nửa khung -> truyền captureWidth/Height của nửa đó,
  // canvas thiết kế được thu nhỏ kiểu "contain" (giữ trọn nội dung, viền tối hoà với nền).
  const capW = Math.round(captureWidth || width);
  const capH = Math.round(captureHeight || height);
  const scale = Math.min(capW / width, capH / height);
  const glowLeft = isPortrait ? "-10px" : "410px";
  const glowTop = isPortrait ? "410px" : "-120px";
  const bgSize = isPortrait ? "600px 900px" : "900px 600px";

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>${esc(id)}</title>
    <style>
      :root {
        --bg:#03070f; --panel:#0d1b2a; --panel2:#122236; --line:#2a3f5a; --muted:#aebfd2;
        --text:#eef3f9; --amber:#ffc300; --teal:#2ec4b6; --violet:#9b8cff; --red:#ff5a6a;
      }
      html,body{margin:0;padding:0;width:${capW}px;height:${capH}px;background:var(--bg);overflow:hidden;
        font-family:"Inter","Segoe UI",system-ui,sans-serif;color:var(--text);}
      /* Khung chụp thật (nền tối để viền letterbox hoà liền khi thu nhỏ canvas). */
      #frame{position:relative;width:${capW}px;height:${capH}px;overflow:hidden;background:var(--bg);}
      #stage{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(${scale.toFixed(5)});
        transform-origin:center center;width:${width}px;height:${height}px;overflow:hidden;
        background:radial-gradient(${bgSize} at 50% 36%,rgba(20,60,110,0.35),transparent 70%),
          radial-gradient(circle at center,rgba(255,255,255,0.06) 1px,transparent 1px) 0 0/46px 46px,var(--bg);}
      #bg-glow{position:absolute;width:1100px;height:1100px;left:${glowLeft};top:${glowTop};border-radius:50%;
        background:radial-gradient(circle,rgba(46,196,182,0.16),transparent 65%);filter:blur(20px);z-index:0;}
      .scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
        box-sizing:border-box;padding:110px 150px;opacity:0;z-index:5;text-align:center;gap:0;}
      .kicker{font-size:26px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:var(--teal);margin-bottom:26px;}
      .acc-amber .kicker{color:var(--amber);} .acc-violet .kicker{color:var(--violet);}
      .heading{font-size:62px;font-weight:800;letter-spacing:-1px;margin:0;max-width:1500px;line-height:1.1;}

      /* title */
      .badge{width:168px;height:168px;border-radius:30px;background:linear-gradient(150deg,#16324f,#0a1626);
        border:1px solid var(--line);box-shadow:0 30px 80px rgba(46,196,182,0.25);display:flex;align-items:center;
        justify-content:center;font-size:58px;font-weight:900;color:var(--amber);margin-bottom:40px;letter-spacing:-1px;}
      .title-h{font-size:112px;font-weight:900;letter-spacing:-3px;margin:0;max-width:1500px;line-height:1.04;
        background:linear-gradient(120deg,#fff,#aebfd2);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .title-sub{font-size:38px;font-weight:600;color:var(--teal);margin-top:22px;}

      /* statement */
      .statement{display:flex;align-items:stretch;gap:34px;max-width:1480px;text-align:left;}
      .statement .bar{width:8px;border-radius:6px;background:linear-gradient(180deg,var(--teal),var(--amber));flex:none;}
      .statement-text{font-size:60px;font-weight:800;line-height:1.18;letter-spacing:-0.5px;}

      /* bullets */
      .blist{display:flex;flex-direction:column;gap:22px;margin-top:42px;max-width:1300px;width:100%;text-align:left;}
      .bitem{display:flex;align-items:center;gap:22px;background:var(--panel);border:1px solid var(--line);
        border-radius:18px;padding:24px 30px;}
      .bitem .bic{font-size:40px;flex:none;width:56px;text-align:center;}
      .bitem .btext{font-size:32px;line-height:1.35;color:var(--text);}

      /* cards */
      .card-row{display:flex;gap:38px;margin-top:48px;justify-content:center;}
      .vcard{width:560px;background:var(--panel);border:1px solid var(--line);border-radius:24px;padding:40px 40px 44px;box-sizing:border-box;text-align:left;}
      .vcard .ic{font-size:54px;}
      .vcard h3{font-size:38px;margin:18px 0 12px;font-weight:700;}
      .vcard p{font-size:27px;line-height:1.45;color:var(--muted);margin:0;}

      /* formula */
      .formula{display:flex;align-items:center;gap:28px;margin-top:54px;flex-wrap:wrap;justify-content:center;}
      .pill{font-size:38px;font-weight:700;padding:26px 40px;border-radius:20px;background:var(--panel);border:1px solid var(--line);}
      .pill.r{color:var(--teal);border-color:rgba(46,196,182,0.55);} .pill.g{color:var(--amber);border-color:rgba(255,195,0,0.5);}
      .pill.result{font-size:46px;font-weight:900;color:#fff;background:linear-gradient(120deg,#16324f,#0a1626);}
      .op{font-size:58px;font-weight:300;color:var(--muted);}

      /* flow */
      .flow{display:flex;align-items:center;gap:18px;margin-top:54px;flex-wrap:nowrap;justify-content:center;}
      .fbox{width:248px;min-height:182px;background:var(--panel);border:1px solid var(--line);border-radius:22px;
        padding:24px 16px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
      .fbox.hot{border-color:rgba(255,195,0,0.6);box-shadow:0 0 0 1px rgba(255,195,0,0.2);}
      .fbox .ic{font-size:52px;line-height:1;} .fbox .t{font-size:26px;font-weight:700;margin-top:14px;}
      .fbox .d{font-size:19px;color:var(--muted);margin-top:7px;line-height:1.3;}
      .arrow{font-size:44px;color:var(--amber);font-weight:300;}

      /* compare */
      .cmp{display:flex;align-items:stretch;gap:30px;margin-top:48px;justify-content:center;}
      .cmp-wrap{flex:1;max-width:620px;}
      .cmp-col{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:34px 34px 38px;text-align:left;height:100%;box-sizing:border-box;}
      .cmp-col.l{border-color:rgba(155,140,255,0.5);} .cmp-col.r{border-color:rgba(46,196,182,0.55);}
      .cmp-title{font-size:36px;font-weight:800;margin-bottom:20px;}
      .cmp-col.l .cmp-title{color:var(--violet);} .cmp-col.r .cmp-title{color:var(--teal);}
      .cmp-pt{font-size:27px;line-height:1.4;color:var(--muted);padding:10px 0 10px 28px;position:relative;}
      .cmp-pt::before{content:"›";position:absolute;left:6px;color:var(--amber);font-weight:700;}
      .cmp-vs{align-self:center;font-size:34px;font-weight:900;color:#fff;background:var(--panel2);border:1px solid var(--line);
        border-radius:50%;width:84px;height:84px;display:flex;align-items:center;justify-content:center;flex:none;}

      /* stat */
      .stat-row{display:flex;gap:50px;margin-top:48px;justify-content:center;flex-wrap:wrap;}
      .stat{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:36px 44px;min-width:260px;}
      .stat-val{font-size:88px;font-weight:900;letter-spacing:-2px;
        background:linear-gradient(120deg,var(--amber),var(--teal));-webkit-background-clip:text;background-clip:text;color:transparent;
        font-variant-numeric:tabular-nums;}
      .stat-label{font-size:26px;color:var(--muted);margin-top:10px;}

      /* steps */
      .steps{display:flex;flex-direction:column;gap:20px;margin-top:42px;max-width:1300px;width:100%;text-align:left;}
      .step{display:flex;align-items:flex-start;gap:24px;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:24px 30px;}
      .step-num{flex:none;width:58px;height:58px;border-radius:50%;background:linear-gradient(150deg,#16324f,#0a1626);
        border:1px solid var(--line);color:var(--amber);font-size:30px;font-weight:900;display:flex;align-items:center;justify-content:center;}
      .step-title{font-size:32px;font-weight:700;} .step-desc{font-size:25px;color:var(--muted);margin-top:6px;line-height:1.4;}

      /* outro */
      .outro-h{font-size:82px;font-weight:900;letter-spacing:-1px;margin:0;max-width:1500px;line-height:1.08;}
      .chips{display:flex;gap:24px;margin-top:46px;flex-wrap:wrap;justify-content:center;}
      .chip{font-size:30px;font-weight:600;padding:20px 32px;border-radius:16px;background:var(--panel);border:1px solid rgba(46,196,182,0.4);}
      .outro-sub{font-size:32px;color:var(--muted);margin-top:22px;}

      /* point fallback */
      .point-body{font-size:33px;line-height:1.5;color:var(--muted);margin-top:30px;max-width:1280px;
        background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:36px 44px;}

      /* Portrait overrides (9:16) */
      .portrait .scene { padding: 120px 80px; }
      .portrait .heading { font-size: 52px; max-width: 920px; }
      .portrait .title-h { font-size: 80px; max-width: 920px; }
      .portrait .title-sub { font-size: 32px; }
      .portrait .statement-text { font-size: 44px; }
      .portrait .point-body { font-size: 26px; padding: 28px 36px; max-width: 900px; }
      .portrait .badge { width: 140px; height: 140px; font-size: 48px; margin-bottom: 30px; }
      .portrait .kicker { font-size: 22px; margin-bottom: 20px; }
      .portrait .card-row { flex-direction: column; gap: 24px; align-items: center; margin-top: 30px; }
      .portrait .vcard { width: 900px; padding: 24px 30px; }
      .portrait .vcard h3 { font-size: 30px; margin: 10px 0 6px; }
      .portrait .vcard p { font-size: 22px; }
      .portrait .vcard .ic { font-size: 40px; }
      .portrait .pill { font-size: 30px; padding: 18px 28px; border-radius: 16px; }
      .portrait .op { font-size: 44px; }
      .portrait .flow { flex-direction: column; gap: 14px; }
      .portrait .fbox { width: 800px; min-height: auto; padding: 16px 24px; flex-direction: row; justify-content: flex-start; text-align: left; gap: 20px; }
      .portrait .fbox .ic { font-size: 38px; }
      .portrait .fbox .t { font-size: 24px; margin-top: 0; }
      .portrait .fbox .d { font-size: 18px; margin-top: 4px; }
      .portrait .arrow { transform: rotate(90deg); font-size: 32px; margin: 0; }
      .portrait .cmp { flex-direction: column; gap: 24px; align-items: center; width: 100%; }
      .portrait .cmp-wrap { width: 900px; max-width: 900px; }
      .portrait .cmp-vs { display: none; }
      .portrait .stat-row { gap: 24px; }
      .portrait .stat { padding: 24px 30px; min-width: 420px; }
      .portrait .stat-val { font-size: 72px; }
      .portrait .steps { max-width: 900px; gap: 16px; }
      .portrait .step { padding: 18px 24px; gap: 18px; }
      .portrait .step-num { width: 48px; height: 48px; font-size: 24px; }
      .portrait .step-title { font-size: 26px; }
      .portrait .step-desc { font-size: 20px; }
      .portrait .outro-h { font-size: 64px; }
      .portrait .chips { gap: 16px; margin-top: 30px; }
      .portrait .chip { font-size: 24px; padding: 14px 24px; }
      .portrait .outro-sub { font-size: 26px; }
    </style>
  </head>
  <body>
    <div id="frame" data-composition-id="${esc(id)}" data-width="${capW}" data-height="${capH}" data-start="0" data-duration="${TOTAL}">
    <div id="stage" class="${isPortrait ? "portrait" : ""}">
      <div id="bg-glow"></div>
${sectionsHtml}

      <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
      <script>
        (function () {
          const tl = gsap.timeline({ paused: true });

          // Crossfade mượt giữa các cảnh (giọng đọc liền mạch bên dưới).
          function transition(t, prevSel, nextSel) {
            tl.to(nextSel, { opacity: 1, duration: 0.6, ease: "power1.inOut" }, t);
            if (prevSel) tl.to(prevSel, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, t);
          }

          ${tweens.join("\n          ")}

          window.__timelines = window.__timelines || {};
          window.__timelines["${esc(id)}"] = tl;
        })();
      </script>
    </div>
    </div>
  </body>
</html>
`;
}
