/** Parse a YouTube or Vimeo page URL into an embed URL. */
export function videoEmbedUrlFromLink(url: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

    const host = u.hostname.replace(/^www\./, '');

    const youtubeId = parseYouTubeVideoId(host, u);
    if (youtubeId) {
      return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`;
    }

    const vimeoId = parseVimeoVideoId(host, u);
    if (vimeoId) {
      return `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`;
    }
  } catch {
    return null;
  }

  return null;
}

function parseYouTubeVideoId(host: string, u: URL): string | null {
  if (host === 'youtu.be') {
    const id = u.pathname.replace(/^\//, '').split('/')[0];
    return id || null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (u.pathname.startsWith('/watch')) {
      return u.searchParams.get('v');
    }
    if (u.pathname.startsWith('/embed/')) {
      return u.pathname.slice('/embed/'.length).split('/')[0] || null;
    }
    if (u.pathname.startsWith('/shorts/')) {
      return u.pathname.slice('/shorts/'.length).split('/')[0] || null;
    }
  }

  return null;
}

function parseVimeoVideoId(host: string, u: URL): string | null {
  if (host === 'player.vimeo.com') {
    const match = u.pathname.match(/^\/video\/(\d+)/);
    return match?.[1] ?? null;
  }

  if (host === 'vimeo.com') {
    const segments = u.pathname.split('/').filter(Boolean);
    const numeric = segments.find((segment) => /^\d+$/.test(segment));
    return numeric ?? null;
  }

  return null;
}
