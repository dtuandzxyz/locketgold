/**
 * Cloudflare Worker Backend for Locket Gold VIP
 * Author: DINH TUAN HAKAIZ
 * Domain: locket-gold.iamdinhtuan-info.workers.dev
 */

// 1x1 Transparent PNG Fallback (Chống lỗi mạng / 404 khi Locket tải sticker/khung ảnh)
const TRANSPARENT_PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="), c => c.charCodeAt(0));

// Danh sách VIP Users mặc định
const DEFAULT_VIP_USERS = [
  "dinhtuanhakaiz",
  "dinh_tuan",
  "iamdinhtuan-info",
  "user.2karr7"
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Phục vụ file Script JS cho Shadowrocket (Chuyển tiếp trực tiếp từ GitHub của DINH TUAN HAKAIZ)
    if (pathname.startsWith("/js/")) {
      let filename = pathname.replace("/js/", "").split("?")[0];
      if (filename === "deleteHeader.js") filename = "deleteHeader_RC.js";
      if (filename === "Locket_Unlocked.js") filename = "locketfix.js";
      if (filename === "Locket_Photobooth.js") filename = "locket_pb_req.js";
      if (filename === "locket_filter_unlock.js") filename = "locket_filter_resp.js";
      if (filename === "Locket_minhhiep08.js") filename = "evenuecat.js";

      try {
        const githubUrl = `https://raw.githubusercontent.com/dtuandzxyz/locketgold/main/js/${filename}`;
        const ghRes = await fetch(githubUrl);
        if (ghRes.ok) {
          const jsCode = await ghRes.text();
          return new Response(jsCode, {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "public, max-age=60"
            }
          });
        }
      } catch (err) {}
    }

    // 2. API: Danh sách VIP Users
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

    // 3. API: Đăng ký UID / Username VIP tự động
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

    // 4. API: Mock bộ lọc AI & Photobooth (Chống triệt để lỗi "Không thể áp dụng bộ lọc")
    if (pathname === "/generateFilteredImage") {
      let outputUrl = "https://i.postimg.cc/15BPkqNN/173376ce-0cb2-411c-80db-fe9adc931718.png";
      try {
        if (request.method === "POST") {
          const body = await request.json();
          outputUrl = body.download_url || body.image_url || body.input_url || body.url || body.imageUrl || (body.data && (body.data.download_url || body.data.url)) || outputUrl;
        }
      } catch (e) {}

      return new Response(JSON.stringify({
        status: 200,
        result: {
          status: 200,
          outputUrl: outputUrl,
          output_url: outputUrl,
          url: outputUrl,
          imageUrl: outputUrl,
          image_url: outputUrl,
          data: {
            outputUrl: outputUrl,
            output_url: outputUrl,
            url: outputUrl,
            imageUrl: outputUrl,
            image_url: outputUrl
          }
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    // 5. Trả về ảnh Assets (/assets/frames/..., /assets/stickers/...) từ GitHub chính chủ DINH TUAN HAKAIZ
    if (pathname.startsWith("/assets/")) {
      const assetPath = pathname.replace("/assets/", "");
      try {
        const ghUrl = `https://raw.githubusercontent.com/dtuandzxyz/locketgold/main/assets/${assetPath}`;
        const ghRes = await fetch(ghUrl);
        if (ghRes.ok) {
          const imgBuffer = await ghRes.arrayBuffer();
          return new Response(imgBuffer, {
            headers: {
              ...corsHeaders,
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=86400"
            }
          });
        }
      } catch (err) {}

      return new Response(TRANSPARENT_PNG, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60"
        }
      });
    }

    // 6. Trang chủ xác nhận Worker hoạt động
    return new Response(JSON.stringify({
      service: "Locket Gold VIP Server",
      author: "DINH TUAN HAKAIZ",
      status: "online",
      domain: "locket-gold.iamdinhtuan-info.workers.dev"
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
    });
  }
};
