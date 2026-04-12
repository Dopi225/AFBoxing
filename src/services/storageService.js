// Service de stockage pour gérer les données en localStorage

const STORAGE_KEYS = {
  NEWS: 'afboxing_news',
  PALMARES: 'afboxing_palmares',
  SCHEDULE: 'afboxing_schedule',
  GALLERY: 'afboxing_gallery',
  CONTACTS: 'afboxing_contacts',
  ADMIN_AUTH: 'afboxing_admin_auth'
};

// Service pour les actualités
export const newsService = {
  getAll: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.NEWS);
    if (stored) {
      return JSON.parse(stored);
    }
    // Retourner les données par défaut si aucune donnée stockée
    return [];
  },
  
  save: (news) => {
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(news));
  },
  
  add: (newsItem) => {
    const news = newsService.getAll();
    const newId = news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1;
    news.push({ ...newsItem, id: newId });
    newsService.save(news);
    return news;
  },
  
  update: (id, updatedNews) => {
    const news = newsService.getAll();
    const index = news.findIndex(n => n.id === id);
    if (index !== -1) {
      news[index] = { ...news[index], ...updatedNews };
      newsService.save(news);
    }
    return news;
  },
  
  delete: (id) => {
    const news = newsService.getAll();
    const filtered = news.filter(n => n.id !== id);
    newsService.save(filtered);
    return filtered;
  }
};

// Service pour les palmarès
export const palmaresService = {
  getAll: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.PALMARES);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },
  
  save: (palmares) => {
    localStorage.setItem(STORAGE_KEYS.PALMARES, JSON.stringify(palmares));
  },
  
  add: (achievement) => {
    const palmares = palmaresService.getAll();
    const newId = palmares.length > 0 ? Math.max(...palmares.map(p => p.id)) + 1 : 1;
    palmares.push({ ...achievement, id: newId });
    palmaresService.save(palmares);
    return palmares;
  },
  
  update: (id, updatedAchievement) => {
    const palmares = palmaresService.getAll();
    const index = palmares.findIndex(p => p.id === id);
    if (index !== -1) {
      palmares[index] = { ...palmares[index], ...updatedAchievement };
      palmaresService.save(palmares);
    }
    return palmares;
  },
  
  delete: (id) => {
    const palmares = palmaresService.getAll();
    const filtered = palmares.filter(p => p.id !== id);
    palmaresService.save(filtered);
    return filtered;
  }
};

// Service pour le planning
export const scheduleService = {
  getAll: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },
  
  save: (schedule) => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  },
  
  updateDay: (day, activities) => {
    const schedule = scheduleService.getAll();
    const index = schedule.findIndex(s => s.day === day);
    if (index !== -1) {
      schedule[index].activities = activities;
    } else {
      schedule.push({ day, activities });
    }
    scheduleService.save(schedule);
    return schedule;
  }
};

// Service pour la galerie
export const galleryService = {
  getAll: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.GALLERY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },
  
  save: (gallery) => {
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(gallery));
  },
  
  add: (image) => {
    const gallery = galleryService.getAll();
    const newId = gallery.length > 0 ? Math.max(...gallery.map(g => g.id)) + 1 : 1;
    gallery.push({ ...image, id: newId });
    galleryService.save(gallery);
    return gallery;
  },
  
  update: (id, updatedImage) => {
    const gallery = galleryService.getAll();
    const index = gallery.findIndex(g => g.id === id);
    if (index !== -1) {
      gallery[index] = { ...gallery[index], ...updatedImage };
      galleryService.save(gallery);
    }
    return gallery;
  },
  
  delete: (id) => {
    const gallery = galleryService.getAll();
    const filtered = gallery.filter(g => g.id !== id);
    galleryService.save(filtered);
    return filtered;
  }
};

// Service pour les contacts
export const contactService = {
  getAll: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },
  
  save: (contacts) => {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  },
  
  add: (contact) => {
    const contacts = contactService.getAll();
    const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
    const newContact = {
      ...contact,
      id: newId,
      date: new Date().toISOString(),
      read: false
    };
    contacts.push(newContact);
    contactService.save(contacts);
    return contacts;
  },
  
  markAsRead: (id) => {
    const contacts = contactService.getAll();
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index].read = true;
      contactService.save(contacts);
    }
    return contacts;
  },
  
  delete: (id) => {
    const contacts = contactService.getAll();
    const filtered = contacts.filter(c => c.id !== id);
    contactService.save(filtered);
    return filtered;
  }
};

// Service d'authentification
export const authService = {
  login: (username, password) => {
    // Pour la démo, on utilise des identifiants simples
    // En production, il faudrait un vrai système d'authentification
    if (username === 'admin' && password === 'admin123') {
      const authData = {
        isAuthenticated: true,
        username: username,
        loginTime: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(authData));
      return true;
    }
    return false;
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  },
  
  isAuthenticated: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (stored) {
      const authData = JSON.parse(stored);
      return authData.isAuthenticated === true;
    }
    return false;
  },
  
  getAuthData: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }
};

