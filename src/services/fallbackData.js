/** Respaldo embebido si no se puede cargar /mock-data.json (sin red ni caché). */
export const FALLBACK_PAYLOAD = {
  communities: [
    { id: 'tech', name: 'Tecnología', slug: 'tech', members: 1, description: 'Tecnología' },
    { id: 'gaming', name: 'Videojuegos', slug: 'gaming', members: 1, description: 'Juegos' },
    { id: 'news', name: 'Noticias', slug: 'news', members: 1, description: 'Noticias' },
  ],
  user: {
    id: 'u1',
    username: 'Eddier_Lopez',
    displayName: 'Eddier Lopez',
    bio: 'Perfil de respaldo sin conexión.',
    karma: 0,
    joined: '—',
  },
  posts: [
    {
      id: 'offline-1',
      title: 'Sin conexión',
      content: 'Conéctate para cargar todos los datos de demostración, o vuelve tras instalar el shell de la app.',
      author: 'dext.io',
      userId: 'u1',
      communityId: 'tech',
      recommendations: 0,
      publishedAt: null,
      imageUrl: null,
    },
  ],
};
