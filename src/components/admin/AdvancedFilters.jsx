import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes, faCalendarAlt, faTag } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import './AdvancedFilters.scss';

const AdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  availableCategories = [], 
  showDateRange = true,
  showCategory = true,
  showSearch = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {
    search: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = {
      search: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters = localFilters.search || 
    localFilters.category || 
    localFilters.dateFrom || 
    localFilters.dateTo ||
    localFilters.sortBy !== 'date' ||
    localFilters.sortOrder !== 'desc';

  return (
    <div className="advanced-filters">
      <button
        className={`filters-toggle ${hasActiveFilters ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FontAwesomeIcon icon={faFilter} />
        <span>Filtres</span>
        {hasActiveFilters && <span className="filter-badge">{Object.values(localFilters).filter(v => v && v !== 'date' && v !== 'desc').length}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="filters-content">
              {showSearch && (
                <div className="filter-group">
                  <label>Recherche</label>
                  <input
                    type="text"
                    value={localFilters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Rechercher..."
                  />
                </div>
              )}

              {showCategory && availableCategories.length > 0 && (
                <div className="filter-group">
                  <label>
                    <FontAwesomeIcon icon={faTag} />
                    Catégorie
                  </label>
                  <select
                    value={localFilters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">Toutes les catégories</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {showDateRange && (
                <div className="filter-group date-range">
                  <label>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    Période
                  </label>
                  <div className="date-inputs">
                    <input
                      type="date"
                      value={localFilters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      placeholder="Du"
                    />
                    <span>au</span>
                    <input
                      type="date"
                      value={localFilters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      placeholder="Au"
                    />
                  </div>
                </div>
              )}

              <div className="filter-group">
                <label>Trier par</label>
                <div className="sort-controls">
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="date">Date</option>
                    <option value="title">Titre</option>
                    <option value="created">Date de création</option>
                  </select>
                  <select
                    value={localFilters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button className="btn-clear-filters" onClick={clearFilters}>
                  <FontAwesomeIcon icon={faTimes} />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilters;

