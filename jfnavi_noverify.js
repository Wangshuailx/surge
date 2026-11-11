/*
 * 集英社 ジャンプフェスタNAVI —— 手机登录免验证码
 * 原理：App 登录后读 GET /api/v1/account 响应里的 is_need_verify 决定要不要弹手机验证。
 *       这里把响应里的 is_need_verify 改成 false、phone_number_verified 改成 true、
 *       during_ticket_registration 改成 false，App 就不会再去调 verification/request。
 * 用于 Surge http-response 脚本（requires-body=1）。
 */
let body = $response.body;
try {
  const obj = JSON.parse(body);

  // GET /api/v1/account —— 字段在 data.attributes 里
  if (obj.data && obj.data.attributes) {
    const a = obj.data.attributes;
    if ("is_need_verify" in a) a.is_need_verify = false;
    if ("phone_number_verified" in a) a.phone_number_verified = true;
    if ("during_ticket_registration" in a) a.during_ticket_registration = false;
  }

  // POST /api/v1/account/login —— 字段在顶层
  if ("is_need_verify" in obj) obj.is_need_verify = false;
  if ("phone_number_verified" in obj) obj.phone_number_verified = true;

  body = JSON.stringify(obj);
} catch (e) {
  // 解析失败就原样放行，不影响正常使用
}

$done({ body });
