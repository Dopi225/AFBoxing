import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faListUl, faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import { TextInput, TextArea } from '../../ui/FormField';
import HelpTip from './HelpTip';

const emptyBlock = () => ({
  title: '',
  type: 'paragraphs',
  paragraphs: [''],
  bullets: [''],
});

export default function ContentBlockEditor({ sections = [], onChange }) {
  const updateSection = (index, patch) => {
    const next = sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  };

  const addSection = () => {
    onChange([...sections, emptyBlock()]);
  };

  const removeSection = (index) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const updateParagraph = (sIdx, pIdx, value) => {
    const sec = sections[sIdx];
    const paragraphs = [...(sec.paragraphs || [''])];
    paragraphs[pIdx] = value;
    updateSection(sIdx, { paragraphs });
  };

  const addParagraph = (sIdx) => {
    const sec = sections[sIdx];
    updateSection(sIdx, { paragraphs: [...(sec.paragraphs || []), ''] });
  };

  const updateBullet = (sIdx, bIdx, value) => {
    const sec = sections[sIdx];
    const bullets = [...(sec.bullets || [''])];
    bullets[bIdx] = value;
    updateSection(sIdx, { bullets });
  };

  const addBullet = (sIdx) => {
    const sec = sections[sIdx];
    updateSection(sIdx, { bullets: [...(sec.bullets || []), ''] });
  };

  return (
    <div className="content-block-editor">
      <HelpTip
        text="Ajoutez des blocs pour détailler l'activité sur le site. Chaque bloc a un titre et du texte ou une liste."
        example="Bloc « Pour qui ? » avec une liste : Débutants, Ados, Adultes"
      />

      {sections.map((section, sIdx) => (
        <div key={sIdx} className="content-block-editor__block">
          <div className="content-block-editor__block-header">
            <span className="content-block-editor__block-num">Bloc {sIdx + 1}</span>
            <button
              type="button"
              className="content-block-editor__remove"
              onClick={() => removeSection(sIdx)}
              aria-label={`Supprimer le bloc ${sIdx + 1}`}
            >
              <FontAwesomeIcon icon={faTrash} /> Supprimer
            </button>
          </div>

          <TextInput
            label="Titre du bloc"
            name={`section-title-${sIdx}`}
            value={section.title || ''}
            onChange={(e) => updateSection(sIdx, { title: e.target.value })}
            placeholder="Ex. : Ce que l'on apprend"
          />

          <div className="content-block-editor__type">
            <span className="form-label">Type de contenu</span>
            <div className="content-block-editor__type-btns">
              <button
                type="button"
                className={section.type !== 'bullets' ? 'active' : ''}
                onClick={() => updateSection(sIdx, { type: 'paragraphs', paragraphs: section.paragraphs || [''] })}
              >
                <FontAwesomeIcon icon={faAlignLeft} /> Texte
              </button>
              <button
                type="button"
                className={section.type === 'bullets' ? 'active' : ''}
                onClick={() => updateSection(sIdx, { type: 'bullets', bullets: section.bullets || [''] })}
              >
                <FontAwesomeIcon icon={faListUl} /> Liste à puces
              </button>
            </div>
          </div>

          {section.type === 'bullets' ? (
            <div className="content-block-editor__items">
              {(section.bullets || ['']).map((bullet, bIdx) => (
                <TextInput
                  key={bIdx}
                  label={bIdx === 0 ? 'Éléments de la liste' : ''}
                  name={`bullet-${sIdx}-${bIdx}`}
                  value={bullet}
                  onChange={(e) => updateBullet(sIdx, bIdx, e.target.value)}
                  placeholder="Ex. : Respect des règles"
                />
              ))}
              <button type="button" className="content-block-editor__add-line" onClick={() => addBullet(sIdx)}>
                + Ajouter une ligne
              </button>
            </div>
          ) : (
            <div className="content-block-editor__items">
              {(section.paragraphs || ['']).map((para, pIdx) => (
                <TextArea
                  key={pIdx}
                  label={pIdx === 0 ? 'Texte' : ''}
                  name={`para-${sIdx}-${pIdx}`}
                  value={para}
                  onChange={(e) => updateParagraph(sIdx, pIdx, e.target.value)}
                  rows={3}
                  placeholder="Décrivez en quelques phrases…"
                />
              ))}
              <button type="button" className="content-block-editor__add-line" onClick={() => addParagraph(sIdx)}>
                + Ajouter un paragraphe
              </button>
            </div>
          )}
        </div>
      ))}

      <button type="button" className="content-block-editor__add" onClick={addSection}>
        <FontAwesomeIcon icon={faPlus} /> Ajouter un bloc de contenu
      </button>
    </div>
  );
}

/** Normalise les sections pour l'API */
export function normalizeSectionsForApi(sections) {
  return (sections || [])
    .filter((s) => (s.title || '').trim())
    .map((s) => {
      if (s.type === 'bullets') {
        return {
          title: s.title.trim(),
          bullets: (s.bullets || []).map((b) => b.trim()).filter(Boolean),
        };
      }
      return {
        title: s.title.trim(),
        paragraphs: (s.paragraphs || []).map((p) => p.trim()).filter(Boolean),
      };
    });
}
