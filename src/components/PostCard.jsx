import { Link } from 'react-router-dom';
import { SafeImage } from './SafeImage.jsx';
import { routes } from '../router/routes.js';
import { useState } from 'react';

function formatPublished(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRelative(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const h = Math.floor(diffMs / 3600000);
  if (h < 1) return 'ahora';
  if (h < 24) return `${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `hace ${days} d`;
  return formatPublished(iso);
}

function formatCompactCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} k`;
  return String(n);
}

function commentCountFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 20 + (h % 220);
}

/**
 * @param {{ post: object, communitySlug?: string, variant?: 'lead' | 'rail' | 'grid' | 'default', sectionName?: string, imageGrayscale?: boolean }} props
 */
export function PostCard({
  post,
  communitySlug,
  variant = 'default',
  sectionName,
  imageGrayscale = false,
}) {
  const initial = post.recommendations ?? post.votes ?? 0;
  const [score, setScore] = useState(initial);
  const slug = communitySlug || post.communityId;
  const kicker = sectionName || slug?.toUpperCase?.() || '';
  const rel = formatRelative(post.publishedAt);
  const comments = commentCountFromId(String(post.id));
  const cardClass = [
    'post-card',
    `post-card--${variant}`,
    imageGrayscale ? 'post-card--mono-img' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClass}>
      <div className="post-card-inner">
        {kicker ? (
          <Link to={routes.community(slug)} className="post-kicker">
            {kicker}
          </Link>
        ) : null}
        <h2 className="post-title">{post.title}</h2>
        <p className="post-byline">
          <span className="post-byline-author">Por </span>
          <Link to={routes.user(post.userId)} className="post-byline-name">
            @{post.author}
          </Link>
          {rel ? <span className="post-byline-sep"> · </span> : null}
          {rel ? <span className="post-byline-time">{rel}</span> : null}
          <span className="post-byline-sep"> · </span>
          <Link to={routes.community(slug)} className="post-byline-channel">
            /c/{slug}
          </Link>
        </p>
        <p className="post-summary">{post.content}</p>
        {post.imageUrl ? (
          <figure className="post-figure">
            <SafeImage src={post.imageUrl} alt="" className="post-image" />
          </figure>
        ) : null}
        <div className="post-foot">
          <div className="post-interaction" aria-label="Votos y comentarios">
            <button
              type="button"
              className="inter-arrow"
              onClick={() => setScore((s) => s + 1)}
              aria-label="Votar a favor"
            >
              ▲
            </button>
            <span className="inter-score">{formatCompactCount(score)}</span>
            <button
              type="button"
              className="inter-arrow"
              onClick={() => setScore((s) => Math.max(0, s - 1))}
              aria-label="Votar en contra"
            >
              ▼
            </button>
            <Link to={routes.community(slug)} className="inter-comments">
              {comments} comentarios
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
