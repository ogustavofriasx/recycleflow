import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';

// Cada página vira um arquivo JS separado, baixado só quando a rota é aberta
// (o Leaflet, o Markdown e o painel admin não pesam no carregamento inicial).
const Home = lazy(() => import('./pages/Home.jsx'));
const Materials = lazy(() => import('./pages/Materials.jsx'));
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const Projects = lazy(() => import('./pages/Projects.jsx'));
const GamePage = lazy(() => import('./pages/Game.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Contents = lazy(() => import('./pages/Contents.jsx'));

// Toda vez que muda de página, volta pro topo (senão abre no meio da tela)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Layout base: navbar e footer fixos, só o miolo troca conforme a rota
export default function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      <main>
        <Suspense fallback={<p className="page-loading" role="status">Carregando...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/materiais" element={<Materials />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/projetos" element={<Projects />} />
          <Route path="/conteudos" element={<Contents />} />
          <Route path="/conteudos/:slug" element={<Contents />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/jogo" element={<GamePage />} />
          {/* Qualquer rota desconhecida volta pra Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
