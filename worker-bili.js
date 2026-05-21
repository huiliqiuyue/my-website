// Cloudflare Worker — B站音频解析代理
// 部署: npx wrangler deploy 或在 Cloudflare Dashboard 创建 Worker 粘贴此代码

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const bvid = url.searchParams.get('bvid');
    const type = url.searchParams.get('type') || 'info'; // 'info' | 'audio'

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (!bvid) {
      return new Response(JSON.stringify({ error: '缺少 bvid 参数' }), { status: 400, headers });
    }

    try {
      if (type === 'info') {
        // 获取视频信息
        const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
          headers: {
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        const data = await res.json();
        if (data.code !== 0) {
          return new Response(JSON.stringify({ error: data.message || '获取失败' }), { status: 400, headers });
        }
        return new Response(JSON.stringify({
          title: data.data.title,
          artist: data.data.owner?.name || 'B站UP主',
          cid: data.data.cid,
          cover: data.data.pic,
        }), { headers });

      } else if (type === 'audio') {
        // 获取音频流
        const cid = url.searchParams.get('cid');
        if (!cid) {
          return new Response(JSON.stringify({ error: '缺少 cid 参数' }), { status: 400, headers });
        }
        const res = await fetch(
          `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&fnval=16&fnver=0&fourk=1`,
          {
            headers: {
              Referer: 'https://www.bilibili.com',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );
        const data = await res.json();
        if (data.code !== 0 || !data.data?.dash?.audio?.length) {
          return new Response(JSON.stringify({ error: '未找到音频流' }), { status: 400, headers });
        }
        const audio = data.data.dash.audio[0];
        return new Response(JSON.stringify({
          url: audio.baseUrl || audio.base_url,
          backupUrl: audio.backupUrl || audio.backup_url || null,
          duration: data.data.timelength / 1000,
        }), { headers });
      }

      return new Response(JSON.stringify({ error: '无效的 type' }), { status: 400, headers });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  },
};
