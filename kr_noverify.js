/*
 * KidsRepublic (iAEON) 手机登录免验证码
 * iaeonconnect/login 遇风控返回 HTTP 400 + {error_code:"10021", error:"interaction_required"}，
 * 手机前端(gate.aeon.com)据此跳 /auth/checkcode 验证码页。但服务器并不强制 SMS——
 * 协议直接走 agreement 即可拿 token。这里把 10021 响应改成「成功响应」(状态 200 + body 仅留 session_id)，
 * 前端就以为登录成功、不跳验证码页，直接继续 agreement→code→token。
 * 用于 Surge http-response 脚本（requires-body=1）。
 */
let status = $response.status;
let body = $response.body;
try {
  const o = JSON.parse(body);
  if (o && o.error_code === "10021" && o.session_id) {
    status = 200;                                   // 400 → 200
    body = JSON.stringify({ session_id: o.session_id });  // 去掉 error* 字段，和成功响应同形
  }
} catch (e) {
  // 解析失败原样放行
}
$done({ status, body });
