// Fichier de test pour vérifier que tous les composants sont correctement importés
import React from 'react';

// Test des imports des composants principaux
const testImports = () => {
  try {
    // Test des composants mis à jour
    const AssociationDeBoxe = require('./components/AssociationDeBoxe').default;
    const Activite = require('./components/Activite').default;
    const Contact = require('./components/Contact').default;
    const Apropos = require('./components/Apropos').default;
    const Actualite = require('./components/Actualite').default;
    const Equipe = require('./components/Equipe').default;
    const InfoPage = require('./components/InfoPage').default;
    const Navbar = require('./components/Navbar').default;
    const Footer = require('./components/Footer').default;
    
    console.log('✅ Tous les composants principaux sont correctement importés');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'import des composants:', error);
    return false;
  }
};

// Test des styles
const testStyles = () => {
  try {
    // Vérifier que les fichiers de styles existent
    const fs = require('fs');
    const path = require('path');
    
    const styleFiles = [
      'src/style/DesignSystem.scss',
      'src/style/Navbar.scss',
      'src/style/Home.scss',
      'src/style/Contact.scss',
      'src/style/Footer.scss',
      'src/style/Apropos.scss',
      'src/style/Activite.scss',
      'src/style/Actualite.scss',
      'src/style/Equipe.scss',
      'src/style/InfoPage.scss'
    ];
    
    styleFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} existe`);
      } else {
        console.log(`❌ ${file} manquant`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des styles:', error);
    return false;
  }
};

// Exécuter les tests
console.log('🧪 Test des composants et styles...');
testImports();
testStyles();
console.log('✅ Tests terminés');

export { testImports, testStyles };
