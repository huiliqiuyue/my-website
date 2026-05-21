import { HashRouter, Routes, Route } from 'react-router';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import Home from './pages/Home';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import BlogEditor from './pages/BlogEditor';
import GamesHub from './pages/GamesHub';
import SnakeGame from './pages/SnakeGame';
import Game2048 from './pages/Game2048';
import MinesweeperGame from './pages/MinesweeperGame';
import RunnerGame from './pages/RunnerGame';
import AIChat from './pages/AIChat';
import MusicPlayer from './pages/MusicPlayer';
import HtmlShowcase from './pages/HtmlShowcase';
import HtmlProjectView from './pages/HtmlProjectView';
import HtmlProjectEditor from './pages/HtmlProjectEditor';
import About from './pages/About';
import Login from './pages/Login';
import ProfileSettings from './pages/ProfileSettings';
import AdminUsers from './pages/AdminUsers';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/new" element={<AuthGuard><BlogEditor /></AuthGuard>} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="blog/:slug/edit" element={<AuthGuard><BlogEditor /></AuthGuard>} />
          <Route path="music" element={<MusicPlayer />} />
          <Route path="games" element={<GamesHub />} />
          <Route path="games/snake" element={<SnakeGame />} />
          <Route path="games/2048" element={<Game2048 />} />
          <Route path="games/minesweeper" element={<MinesweeperGame />} />
          <Route path="games/runner" element={<RunnerGame />} />
          <Route path="ai" element={<AIChat />} />
          <Route path="showcase" element={<HtmlShowcase />} />
          <Route path="showcase/new" element={<AuthGuard><HtmlProjectEditor /></AuthGuard>} />
          <Route path="showcase/:id" element={<HtmlProjectView />} />
          <Route path="showcase/:id/edit" element={<AuthGuard><HtmlProjectEditor /></AuthGuard>} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />
          <Route path="profile" element={<AuthGuard><ProfileSettings /></AuthGuard>} />
          <Route path="admin/users" element={<AuthGuard><AdminUsers /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
