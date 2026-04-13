import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './NotFound.scss';

/**
 * Page 404 — navigation claire vers l’accueil et le contact.
 */
const NotFound = () => (
  <main className="not-found-page" role="main" aria-labelledby="not-found-title">
    <Helmet>
      <title>Page introuvable — AF BOXING CLUB 86</title>
      <meta name="robots" content="noindex, follow" />
    </Helmet>
    <div className="not-found-page__inner">
      <p className="not-found-page__eyebrow" aria-hidden="true">Erreur 404</p>
      <h1 id="not-found-title" className="not-found-page__title">
        Cette page n’existe pas
      </h1>
      <p className="not-found-page__lead">
        Le lien est peut-être incorrect ou la page a été déplacée.
      </p>
      <div className="not-found-page__actions">
        <Link to="/" className="btn btn-primary">
          Retour à l’accueil
        </Link>
        <Link to="/contact" className="btn btn-outline">
          Nous contacter
        </Link>
      </div>
    </div>
  </main>
);

export default NotFound;
