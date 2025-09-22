import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Apropos from './components/Apropos';
import Activite from './components/Activite';
import Actualite from './components/Actualite';
import Equipe from './components/Equipe';
import Galerie from './components/Galerie';
import Horaire from './components/Horaire';
import Tarif from './components/Tarif';
import Contact from './components/Contact';
import Partenaire from './components/Partenaire';
import Palmares from './components/Palmares';
import AssociationDeBoxe from './components/AssociationDeBoxe';

import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.scss';
import InfoPage from './components/InfoPage';
import NewsPage from './components/NewsPage';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
       <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<AssociationDeBoxe />} />
        <Route path="/apropos" element={<Apropos />} />
        <Route path="/activite" element={<Activite />} />
        <Route path="/actualite" element={<Actualite />} />
        <Route path="/equipe" element={<Equipe />} />
        <Route path="/galerie" element={<Galerie />} />
        <Route path="/horaire" element={<Horaire />} />
        <Route path="/tarif" element={<Tarif />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/partenaire" element={<Partenaire />} />
        <Route path="/palmares" element={<Palmares />} />
        <Route path="/association" element={<AssociationDeBoxe />} />
        <Route path="/info/:type" element={<InfoPage />} />
        <Route path="/news" element={<NewsPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
