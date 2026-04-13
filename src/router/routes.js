export const routes = {
  home: '/',
  communities: '/communities',
  community: (slug) => `/c/${encodeURIComponent(slug)}`,
  user: (userId) => `/user/${encodeURIComponent(userId)}`,
};
