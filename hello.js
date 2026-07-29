// Surge http-response 脚本示例
// $response.body 是原始响应体字符串，改完用 $done 交回去

let body = $response.body;

try {
  const obj = JSON.parse(body);
  obj.injected_by = "my-first-module";
  obj.timestamp = new Date().toISOString();
  body = JSON.stringify(obj);
} catch (e) {
  // 不是 JSON 就做个纯文本替换
  body = body.replace(/httpbin/g, "🎉");
}

// 只想放行不改：$done({});
// 想连状态码/头一起改：$done({ status: 200, headers: {...}, body });
$done({ body });
