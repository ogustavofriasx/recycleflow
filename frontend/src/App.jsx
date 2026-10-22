import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Materials from './pages/Materials.jsx';
import MapPage from './pages/MapPage.jsx';
import Projects from './pages/Projects.jsx';

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
          {/* Qualquer rota desconhecida volta pra Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
