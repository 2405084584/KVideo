import { NextResponse } from 'next/server';

export const runtime = 'edge';

const REQUEST_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    Accept: 'image/jpeg,image/png,image/gif,*/*;q=0.8',
    Referer: 'https://movie.douban.com/',
};

// 豆瓣的 imgN.doubanio.com 互为镜像,但各自解析到不同线路。部分线路(例如 img1
// 的国内 IP)在境外主机上不可达,fetch 会直接抛错而不是返回状态码,海报因此变成
// 500。同一路径换个镜像通常就能取到,所以失败时按顺序回退。
const DOUBAN_IMAGE_HOSTS = ['img9.doubanio.com', 'img3.doubanio.com', 'img2.doubanio.com'];

function buildCandidates(rawUrl: string): string[] {
    const candidates = [rawUrl];

    try {
        const parsed = new URL(rawUrl);
        if (!/^img\d+\.doubanio\.com$/.test(parsed.hostname)) {
            return candidates;
        }

        for (const host of DOUBAN_IMAGE_HOSTS) {
            if (host === parsed.hostname) continue;
            const alternate = new URL(parsed.toString());
            alternate.hostname = host;
            candidates.push(alternate.toString());
        }
    } catch {
        // 非法 URL 留给 fetch 去报错
    }

    return candidates;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    let lastStatus = 502;
    let lastError = 'Error fetching image';

    for (const candidate of buildCandidates(imageUrl)) {
        let imageResponse: Response;

        try {
            imageResponse = await fetch(candidate, { headers: REQUEST_HEADERS });
        } catch {
            // 线路不可达,换下一个镜像
            continue;
        }

        if (!imageResponse.ok) {
            lastStatus = imageResponse.status;
            lastError = imageResponse.statusText || 'Error fetching image';
            continue;
        }

        if (!imageResponse.body) {
            lastStatus = 500;
            lastError = 'Image response has no body';
            continue;
        }

        const headers = new Headers();
        const contentType = imageResponse.headers.get('content-type');
        if (contentType) {
            headers.set('Content-Type', contentType);
        }
        headers.set('Cache-Control', 'public, max-age=15720000, s-maxage=15720000');

        return new Response(imageResponse.body, {
            status: 200,
            headers,
        });
    }

    return NextResponse.json({ error: lastError }, { status: lastStatus });
}
