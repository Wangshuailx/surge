// 补 current-server-time 响应头，修复 ONE PIECE BASE (jp.co.bandainamcoent.BNEI0432)
// 在 Surge MITM 解密下因该头缺失/格式异常导致的启动闪退。
// App 用默认 ISO8601DateFormatter 解析此头(UTC、Z 结尾、不带毫秒)，零容错，缺失即 fatalError。
let h = $response.headers;
for (const k of Object.keys(h)) {              // 清掉任何大小写变体，避免 Swift 字典按原 key 查不到
  if (k.toLowerCase() === "current-server-time") delete h[k];
}
h["current-server-time"] = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
$done({ headers: h });
