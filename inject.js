// Surge http-response 脚本：向 HTML 页面注入「抢票助手」浮动面板
// 用法：在模块的 [Script] 里用 http-response + requires-body=1 挂到目标页面

const headers = $response.headers || {};

// 只处理 HTML 文档，别去动 JS/CSS/图片
let ct = "";
for (const k in headers) {
  if (k.toLowerCase() === "content-type") ct = String(headers[k]);
}

if (ct.indexOf("text/html") === -1) {
  $done({});
} else {
  // 关键一步：删掉 CSP，否则浏览器会拒绝执行我们注入的 inline script
  for (const k in headers) {
    const lk = k.toLowerCase();
    if (lk === "content-security-policy" || lk === "content-security-policy-report-only") {
      delete headers[k];
    }
  }

  let body = $response.body;
  if (body.indexOf("__sg_panel") === -1) {
    const panel = P();
    const idx = body.lastIndexOf("</body>");
    body = idx === -1 ? body + panel : body.slice(0, idx) + panel + body.slice(idx);
  }

  $done({ body, headers });
}

// ============================================================
// 下面是注入到页面里的那一坨（HTML + CSS + JS）
// ============================================================
function P() {
  return `
<div id="__sg_panel" style="position:fixed;right:12px;bottom:12px;z-index:2147483647;font:13px/1.5 -apple-system,sans-serif;color:#111">
  <div id="__sg_ball" style="width:44px;height:44px;border-radius:22px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,.3);cursor:pointer;margin-left:auto">🎯</div>
  <div id="__sg_box" style="display:none;width:270px;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.25);padding:12px;margin-top:8px">
    <div id="__sg_clock" style="font:600 22px/1.2 ui-monospace,Menlo,monospace;text-align:center;letter-spacing:.5px">--:--:--.---</div>
    <div style="margin:8px 0 4px;font-size:11px;color:#888">目标时刻 (HH:MM:SS)</div>
    <input id="__sg_time" placeholder="10:00:00" style="width:100%;box-sizing:border-box;padding:7px;border:1px solid #ddd;border-radius:7px;font:14px ui-monospace,monospace">
    <div style="margin:8px 0 4px;font-size:11px;color:#888">要点击的元素</div>
    <input id="__sg_sel" placeholder="点右边「拾取」再点页面元素" style="width:100%;box-sizing:border-box;padding:7px;border:1px solid #ddd;border-radius:7px;font:11px ui-monospace,monospace">
    <div style="display:flex;gap:6px;margin-top:8px">
      <button id="__sg_pick" style="flex:1;padding:8px;border:0;border-radius:7px;background:#eee;font-size:12px">拾取</button>
      <button id="__sg_test" style="flex:1;padding:8px;border:0;border-radius:7px;background:#eee;font-size:12px">试点</button>
      <button id="__sg_arm" style="flex:1.4;padding:8px;border:0;border-radius:7px;background:#111;color:#fff;font-size:12px">武装</button>
    </div>
    <div style="margin:8px 0 4px;font-size:11px;color:#888">时间校准 (毫秒，可负)</div>
    <input id="__sg_off" value="0" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid #ddd;border-radius:7px;font:12px ui-monospace,monospace">
    <div id="__sg_log" style="margin-top:8px;max-height:80px;overflow:auto;font:10px/1.5 ui-monospace,monospace;color:#555;background:#fafafa;border-radius:6px;padding:6px"></div>
  </div>
</div>
<script>
(function(){
  if (window.__sgReady) return;
  window.__sgReady = 1;

  var $ = function(id){ return document.getElementById(id); };
  var box = $("__sg_box"), armed = null, picking = false;

  function log(m){
    var d = $("__sg_log");
    d.innerHTML = "<div>" + new Date().toTimeString().slice(0,8) + " " + m + "</div>" + d.innerHTML;
  }
  function off(){ return parseInt($("__sg_off").value, 10) || 0; }

  // ---- 折叠/展开 ----
  $("__sg_ball").onclick = function(){
    box.style.display = box.style.display === "none" ? "block" : "none";
  };

  // ---- 时钟 ----
  setInterval(function(){
    var d = new Date(Date.now() + off());
    var p = function(n,w){ return String(n).padStart(w||2,"0"); };
    $("__sg_clock").textContent = p(d.getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds())+"."+p(d.getMilliseconds(),3);
  }, 50);

  // ---- 生成 CSS 选择器 ----
  function pathOf(el){
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + CSS.escape(el.id);
    var parts = [], depth = 0;
    while (el && el.nodeType === 1 && depth++ < 5) {
      var s = el.tagName.toLowerCase();
      if (el.id) { parts.unshift("#" + CSS.escape(el.id)); break; }
      var cls = (el.getAttribute("class") || "").trim().split(/\\s+/).filter(Boolean).slice(0,2);
      if (cls.length) s += "." + cls.map(function(c){ return CSS.escape(c); }).join(".");
      var p = el.parentNode;
      if (p && p.children) {
        var sib = [].filter.call(p.children, function(c){ return c.tagName === el.tagName; });
        if (sib.length > 1) s += ":nth-of-type(" + (sib.indexOf(el) + 1) + ")";
      }
      parts.unshift(s);
      el = el.parentNode;
    }
    return parts.join(" > ");
  }

  // ---- 拾取模式 ----
  $("__sg_pick").onclick = function(){
    picking = !picking;
    this.style.background = picking ? "#ffd60a" : "#eee";
    log(picking ? "拾取中，点页面上的元素" : "已退出拾取");
  };
  document.addEventListener("click", function(e){
    if (!picking) return;
    if ($("__sg_panel").contains(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var sel = pathOf(e.target);
    $("__sg_sel").value = sel;
    picking = false;
    $("__sg_pick").style.background = "#eee";
    log("已拾取: " + sel);
  }, true);

  // ---- 试点 ----
  function fire(){
    var sel = $("__sg_sel").value.trim();
    var el = sel && document.querySelector(sel);
    if (!el) { log("✗ 找不到: " + sel); return false; }
    el.scrollIntoView({block:"center"});
    el.click();
    log("✓ 已点击 " + (el.textContent || el.tagName).trim().slice(0,20));
    return true;
  }
  $("__sg_test").onclick = fire;

  // ---- 武装：到点自动点 ----
  $("__sg_arm").onclick = function(){
    if (armed) { clearTimeout(armed); armed = null; this.textContent = "武装"; this.style.background = "#111"; log("已解除"); return; }
    var m = /^(\\d{1,2}):(\\d{2}):(\\d{2})$/.exec($("__sg_time").value.trim());
    if (!m) { log("✗ 时间格式应为 10:00:00"); return; }
    var t = new Date(); t.setHours(+m[1], +m[2], +m[3], 0);
    var target = t.getTime();
    if (target < Date.now() + off()) target += 86400000;
    this.textContent = "解除"; this.style.background = "#e5484d";
    log("已武装 → " + new Date(target).toTimeString().slice(0,8));

    var tick = function(){
      var left = target - (Date.now() + off());
      if (left <= 0) { fire(); armed = null; $("__sg_arm").textContent = "武装"; $("__sg_arm").style.background = "#111"; return; }
      armed = left > 300 ? setTimeout(tick, Math.min(left - 250, 1000)) : (requestAnimationFrame(tick), 1);
    };
    tick();
  };

  log("助手已注入");
})();
<\/script>`;
}
