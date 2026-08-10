type Props = {
  url:   string
  title: string
  className?: string
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    // youtube.com/watch?v=ID
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return u.searchParams.get('v')
    }
    // youtu.be/ID
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('?')[0] || null
    }
    // youtube.com/embed/ID
    if (u.pathname.startsWith('/embed/')) {
      return u.pathname.split('/embed/')[1].split('?')[0] || null
    }
  } catch {
    return null
  }
  return null
}

export function YouTubeEmbed({ url, title, className = '' }: Props) {
  const videoId = extractVideoId(url)
  if (!videoId) return null

  // youtube-nocookie.com no carga cookies de rastreo de anuncios
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`

  return (
    <div className={['relative aspect-video w-full overflow-hidden rounded-xl', className].join(' ')}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
