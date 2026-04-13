import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { Communities } from './pages/Communities.jsx';
import { CommunityFeed } from './pages/CommunityFeed.jsx';
import { Profile } from './pages/Profile.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/c/:slug" element={<CommunityFeed />} />
          <Route path="/user/:userId" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}
