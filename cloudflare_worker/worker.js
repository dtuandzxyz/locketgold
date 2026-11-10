/**
 * Cloudflare Worker Backend for Locket Gold VIP
 * Author: DINH TUAN HAKAIZ
 * Domain: locket-gold.iamdinhtuan-info.workers.dev
 */

// 1x1 Transparent PNG Base64 Fallback (Tránh lỗi kết nối / 404 khi Locket tải sticker/khung ảnh)
const TRANSPARENT_PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="), c => c.charCodeAt(0));

// Danh sách VIP Users mặc định
const DEFAULT_VIP_USERS = [
  "dinhtuanhakaiz",
  "dinh_tuan",
  "iamdinhtuan-info",
  "user.2karr7",
  "mhhiep",
  "nightmarketserver"
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Headers CORS mặc định
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. API: Danh sách VIP Users
    if (pathname === "/api/vip-users") {
      let vipList = DEFAULT_VIP_USERS;
      if (env.VIP_KV) {
        try {
          const stored = await env.VIP_KV.get("VIP_USERS", "json");
          if (Array.isArray(stored)) vipList = stored;
        } catch (e) {}
      }
      return new Response(JSON.stringify(vipList), {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 2. API: Đăng ký UID / Username VIP tự động
    if (pathname === "/api/register-vip") {
      const uid = url.searchParams.get("uid");
      const username = url.searchParams.get("username");
      if (env.VIP_KV && (uid || username)) {
        try {
          let list = (await env.VIP_KV.get("VIP_USERS", "json")) || DEFAULT_VIP_USERS;
          let changed = false;
          if (uid && !list.includes(uid)) { list.push(uid); changed = true; }
          if (username && !list.includes(username)) { list.push(username); changed = true; }
          if (changed) await env.VIP_KV.put("VIP_USERS", JSON.stringify(list));
        } catch (e) {}
      }
      return new Response(JSON.stringify({ status: 200, message: "Registered", uid, username }), {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 3. API: Mock bộ lọc AI & Photobooth (Bypass lỗi 422 "Không thể áp dụng bộ lọc")
    if (pathname === "/generateFilteredImage") {
      return new Response(JSON.stringify({
        status: 200,
        result: {
          status: 200,
          outputUrl: "https://i.postimg.cc/15BPkqNN/173376ce-0cb2-411c-80db-fe9adc931718.png",
          data: {
            outputUrl: "https://i.postimg.cc/15BPkqNN/173376ce-0cb2-411c-80db-fe9adc931718.png"
          }
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 4. Phục vụ tài nguyên ảnh Assets (/assets/frames/..., /assets/stickers/...)
    // Trả về PNG hợp lệ để app Locket không bị lỗi kết nối hoặc văng ảnh
    if (pathname.startsWith("/assets/")) {
      return new Response(TRANSPARENT_PNG, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }

    // 5. Root page thông báo hoạt động
    return new Response(JSON.stringify({
      service: "Locket Gold VIP Server",
      author: "DINH TUAN HAKAIZ",
      status: "running",
      domain: "locket-gold.iamdinhtuan-info.workers.dev"
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
    });
  }
};
