import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Materials from './pages/Materials.jsx';
import MapPage from './pages/MapPage.jsx';
import Projects from './pages/Projects.jsx';
import GamePage from './pages/Game.jsx';



import Admin from './pages/Admin.jsx';
import Contents from './pages/Contents.jsx';

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/materiais" element={<Materials />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/projetos" element={<Projects />} />
          <Route path="/conteudos" element={<Contents />} />
          <Route path="/conteudos/:slug" element={<Contents />} />
          <Route path="/admin" element={<Admin />} />
          {/* Qualquer rota desconhecida volta pra Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/jogo" element={<GamePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
