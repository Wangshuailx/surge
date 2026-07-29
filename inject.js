// Surge http-response 脚本：向 HTML 页面注入「抢票助手」浮动面板
// 页面顶部会有一条横幅显示注入状态，方便排查

var body = $response.body;
var headers = $response.headers || {};
var note = "";

try {
  var ct = "";
  for (var k in headers) {
    if (k.toLowerCase() === "content-type") ct = String(headers[k]);
  }

  if (String(ct).indexOf("text/html") === -1) {
    // 不是 HTML，原样放行
    $done({});
  } else {
    // 删掉 CSP，否则浏览器会拒绝执行注入的 inline script
    for (var k2 in headers) {
      var lk = k2.toLowerCase();
      if (lk === "content-security-policy" || lk === "content-security-policy-report-only") {
        delete headers[k2];
      }
    }

    body = String(body);
    if (body.indexOf("__sg_panel") === -1) {
      var stuff = banner("✅ Surge 注入成功", "#1a7f37") + panel();
      var i = body.lastIndexOf("</body>");
      body = i === -1 ? body + stuff : body.slice(0, i) + stuff + body.slice(i);
    }
    $done({ body: body, headers: headers });
  }
} catch (e) {
  // 出错也要让页面看得见，别静默失败
  var msg = banner("❌ 注入脚本报错: " + (e && e.message ? e.message : e), "#c92a2a");
  var j = String(body).lastIndexOf("</body>");
  var out = j === -1 ? String(body) + msg : String(body).slice(0, j) + msg + String(body).slice(j);
  $done({ body: out });
}

function banner(text, color) {
  return '<div style="position:fixed;top:0;left:0;right:0;z-index:2147483646;background:' +
    color + ';color:#fff;font:12px/1.6 -apple-system,sans-serif;padding:6px 10px;text-align:center">' +
    text + '</div>';
}

// ============================================================
// 注入到页面里的浮动面板
// ============================================================
function panel() {
  return '<div id="__sg_panel" style="position:fixed;right:12px;bottom:12px;z-index:2147483647;font:13px/1.5 -apple-system,sans-serif;color:#111">' +
'<div id="__sg_ball" style="width:44px;height:44px;border-radius:22px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(0,0,0,.3);cursor:pointer;margin-left:auto">🎯</div>' +
'<div id="__sg_box" style="display:none;width:270px;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.25);padding:12px;margin-top:8px">' +
'<div id="__sg_clock" style="font:600 22px/1.2 ui-monospace,Menlo,monospace;text-align:center">--:--:--.---</div>' +
'<div style="margin:8px 0 4px;font-size:11px;color:#888">目标时刻 (HH:MM:SS)</div>' +
'<input id="__sg_time" placeholder="10:00:00" style="width:100%;box-sizing:border-box;padding:7px;border:1px solid #ddd;border-radius:7px;font:14px ui-monospace,monospace">' +
'<div style="margin:8px 0 4px;font-size:11px;color:#888">要点击的元素</div>' +
'<input id="__sg_sel" placeholder="先点「拾取」再点页面元素" style="width:100%;box-sizing:border-box;padding:7px;border:1px solid #ddd;border-radius:7px;font:11px ui-monospace,monospace">' +
'<div style="display:flex;gap:6px;margin-top:8px">' +
'<button id="__sg_pick" style="flex:1;padding:8px;border:0;border-radius:7px;background:#eee;font-size:12px">拾取</button>' +
'<button id="__sg_test" style="flex:1;padding:8px;border:0;border-radius:7px;background:#eee;font-size:12px">试点</button>' +
'<button id="__sg_arm" style="flex:1.4;padding:8px;border:0;border-radius:7px;background:#111;color:#fff;font-size:12px">武装</button>' +
'</div>' +
'<div style="margin:8px 0 4px;font-size:11px;color:#888">时间校准 (毫秒，可负)</div>' +
'<input id="__sg_off" value="0" style="width:100%;box-sizing:border-box;padding:6px;border:1px solid #ddd;border-radius:7px;font:12px ui-monospace,monospace">' +
'<div id="__sg_log" style="margin-top:8px;max-height:80px;overflow:auto;font:10px/1.5 ui-monospace,monospace;color:#555;background:#fafafa;border-radius:6px;padding:6px"></div>' +
'</div></div>' +
'<' + 'script>(' + helper.toString() + ')();<' + '/script>';
}

// 这个函数不会在 Surge 里执行，它会被转成字符串塞进页面
function helper() {
  if (window.__sgReady) return;
  window.__sgReady = 1;

  var $ = function (id) { return document.getElementById(id); };
  var box = $("__sg_box"), armed = null, picking = false;

  function log(m) {
    var d = $("__sg_log");
    d.innerHTML = "<div>" + new Date().toTimeString().slice(0, 8) + " " + m + "</div>" + d.innerHTML;
  }
  function off() { return parseInt($("__sg_off").value, 10) || 0; }
  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = "0" + n; return n; }

  $("__sg_ball").onclick = function () {
    box.style.display = box.style.display === "none" ? "block" : "none";
  };

  setInterval(function () {
    var d = new Date(Date.now() + off());
    $("__sg_clock").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + "." + pad(d.getMilliseconds(), 3);
  }, 50);

  function esc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : s; }

  function pathOf(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + esc(el.id);
    var parts = [], depth = 0;
    while (el && el.nodeType === 1 && depth++ < 5) {
      var s = el.tagName.toLowerCase();
      if (el.id) { parts.unshift("#" + esc(el.id)); break; }
      var raw = el.getAttribute("class") || "";
      var cls = raw.split(/\s+/).filter(function (c) { return c; }).slice(0, 2);
      if (cls.length) s += "." + cls.map(esc).join(".");
      var p = el.parentNode;
      if (p && p.children) {
        var sib = [].filter.call(p.children, function (c) { return c.tagName === el.tagName; });
        if (sib.length > 1) s += ":nth-of-type(" + (sib.indexOf(el) + 1) + ")";
      }
      parts.unshift(s);
      el = el.parentNode;
    }
    return parts.join(" > ");
  }

  $("__sg_pick").onclick = function () {
    picking = !picking;
    this.style.background = picking ? "#ffd60a" : "#eee";
    log(picking ? "拾取中，点页面元素" : "已退出拾取");
  };

  document.addEventListener("click", function (e) {
    if (!picking) return;
    if ($("__sg_panel").contains(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var sel = pathOf(e.target);
    $("__sg_sel").value = sel;
    picking = false;
    $("__sg_pick").style.background = "#eee";
    log("已拾取: " + sel);
  }, true);

  function fire() {
    var sel = $("__sg_sel").value.replace(/^\s+|\s+$/g, "");
    var el = null;
    try { el = sel && document.querySelector(sel); } catch (err) { log("✗ 选择器非法"); return false; }
    if (!el) { log("✗ 找不到: " + sel); return false; }
    el.scrollIntoView({ block: "center" });
    el.click();
    log("✓ 已点击 " + String(el.textContent || el.tagName).replace(/^\s+|\s+$/g, "").slice(0, 20));
    return true;
  }
  $("__sg_test").onclick = fire;

  $("__sg_arm").onclick = function () {
    var btn = this;
    if (armed) {
      clearTimeout(armed); armed = null;
      btn.textContent = "武装"; btn.style.background = "#111";
      log("已解除"); return;
    }
    var m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec($("__sg_time").value.replace(/^\s+|\s+$/g, ""));
    if (!m) { log("✗ 格式应为 10:00:00"); return; }
    var t = new Date(); t.setHours(+m[1], +m[2], +m[3], 0);
    var target = t.getTime();
    if (target < Date.now() + off()) target += 86400000;
    btn.textContent = "解除"; btn.style.background = "#e5484d";
    log("已武装 → " + new Date(target).toTimeString().slice(0, 8));

    var tick = function () {
      var left = target - (Date.now() + off());
      if (left <= 0) {
        fire(); armed = null;
        btn.textContent = "武装"; btn.style.background = "#111";
        return;
      }
      if (left > 300) armed = setTimeout(tick, Math.min(left - 250, 1000));
      else { armed = 1; requestAnimationFrame(tick); }
    };
    tick();
  };

  log("助手已注入");
}
