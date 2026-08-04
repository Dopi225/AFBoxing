import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardModal from './guided/WizardModal';
import HelpTip from './guided/HelpTip';

const STORAGE_KEY = 'afboxing_admin_guide_seen_v1';

function GuideSection({ title, items }) {
  return (
    <section className="admin-onboarding__section">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function AdminOnboardingGuide({ isOpen, onClose, role = 'editor' }) {
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  const steps = useMemo(
    () => [
      {
        title: 'Avant de commencer',
        description: 'Les bases pour travailler sereinement.',
        content: (
          <div className="admin-onboarding">
            <GuideSection
              title="Prérequis"
              items={[
                "Utilisez toujours le bouton 'Enregistrer' avant de quitter une page.",
                'Préparez vos textes et photos à l’avance (titre, description, date).',
                'Vérifiez que vous êtes bien connecté avec le bon compte.',
              ]}
            />
            <HelpTip
              text="En cas de doute, commencez par une petite modification test, puis contrôlez le résultat sur le site public."
              example="corriger une faute d’orthographe puis vérifier la page."
            />
          </div>
        ),
      },
      {
        title: 'Se repérer dans le panel',
        description: 'Comprendre rapidement où cliquer.',
        content: (
          <div className="admin-onboarding">
            <GuideSection
              title="Navigation simple"
              items={[
                "Menu gauche : choisissez la section à modifier (Actualités, Galerie, Planning...).",
                "Tableau de bord : 'Actions fréquentes' pour gagner du temps.",
                "Recherche : retrouvez rapidement un contenu existant.",
              ]}
            />
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
              Ouvrir le tableau de bord
            </button>
          </div>
        ),
      },
      {
        title: 'Publier du contenu',
        description: 'La méthode la plus sûre pour ajouter ou modifier.',
        content: (
          <div className="admin-onboarding">
            <GuideSection
              title="Cycle conseillé"
              items={[
                "1) Ouvrez la bonne section (ex: Actualités).",
                "2) Ajoutez ou modifiez le contenu.",
                "3) Utilisez l’aperçu quand il est disponible.",
                "4) Enregistrez puis relisez sur le site public.",
              ]}
            />
            <div className="admin-onboarding__actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/news')}>
                Gérer les actualités
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/gallery')}>
                Gérer la galerie
              </button>
            </div>
          </div>
        ),
      },
      {
        title: 'Erreurs courantes',
        description: 'Que faire en cas de souci.',
        content: (
          <div className="admin-onboarding">
            <GuideSection
              title="Réactions utiles"
              items={[
                "Si un bouton ne répond pas : rechargez la page puis réessayez.",
                "Si une image ne s’affiche pas : vérifiez le format et la taille.",
                "Si un contenu disparaît : ouvrez l’Historique des modifications.",
              ]}
            />
            {isAdmin ? (
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/history')}>
                Ouvrir l’historique
              </button>
            ) : null}
          </div>
        ),
      },
      {
        title: 'Bonnes pratiques finales',
        description: 'Valider avant de terminer.',
        content: (
          <div className="admin-onboarding">
            <GuideSection
              title="Checklist rapide"
              items={[
                'Relire les titres et dates.',
                'Vérifier le rendu sur mobile.',
                'Contrôler les textes en mode clair et sombre.',
                'Se déconnecter après vos modifications.',
              ]}
            />
            <HelpTip text="Vous pouvez rouvrir ce guide à tout moment via le bouton Aide." />
          </div>
        ),
      },
    ],
    [isAdmin, navigate],
  );

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose?.();
  };

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Guide de prise en main"
      steps={steps}
      onComplete={handleComplete}
      size="lg"
    />
  );
}
