import { useState } from 'react';

const FALLBACK = '/no-image.png';

/**
 * Imágenes remotas con respaldo local si falla la carga (sin conexión o URL rota).
 */
export function SafeImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  const effective = failed || !src ? FALLBACK : src;

  return (
    <img
      src={effective}
      alt={alt || ''}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
