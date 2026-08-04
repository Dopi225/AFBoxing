import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faUsers,
  faArrowUp,
  faArrowDown,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useAdminNotify } from '../../hooks/useAdminNotify';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useEntityTrash } from '../../hooks/useEntityTrash';
import { validateRequired } from '../../utils/formValidation';
import {
  NAV_ITEMS,
  TEAM_CATEGORIES,
  TEAM_ROLE_SUGGESTIONS,
} from '../../constants/adminCopy';
import { adminBreadcrumbs } from '../../utils/adminBreadcrumbs';
import { teamMembersApi, uploadApi } from '../../services/apiService';
import { logActivity } from '../../utils/activityLogger';
import ConfirmDialog from './ConfirmDialog';
import TrashPanel, { TrashTabs } from './TrashPanel';
import Modal from '../ui/Modal';
import PageHeader from '../ui/PageHeader';
import { TextInput, TextArea, SelectField } from '../ui/FormField';
import { LoadingState } from '../PageStates';
import {
  WizardModal,
  ImageUploadField,
  EmptyStateGuided,
  HighlightableCard,
} from './guided';
import HelpTip from './guided/HelpTip';
import './ManageTeam.scss';

const DRAFT_KEY = 'afboxing_draft_team';

const emptyForm = () => ({
  fullName: '',
  role: '',
  category: 'coaches',
  bio: '',
  photo: '',
  certifications: '',
  enabled: true,
});

const categoryLabel = (value) =>
  TEAM_CATEGORIES.find((c) => c.value === value)?.label || value;

const memberInitials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const ManageTeam = () => {
  const { notifySuccess, notifyError } = useAdminNotify('team');
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [previewMember, setPreviewMember] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const formBaselineRef = useRef(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState(emptyForm());
  const [file, setFile] = useState(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teamMembersApi.list();
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      notifyError(err, 'Impossible de charger l\'équipe.');
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const trash = useEntityTrash(teamMembersApi, {
    onReload: loadMembers,
    notifySuccess,
    notifyError,
    entityLabel: 'Membre',
  });

  const { loadTrash } = trash;

  useEffect(() => {
    loadMembers();
    loadTrash();
  }, [loadMembers, loadTrash]);

  const isDirty =
    showModal &&
    (JSON.stringify({ ...formData, photo: formData.photo?.startsWith('blob:') || formData.photo?.startsWith('data:') ? '' : formData.photo }) !==
      JSON.stringify({ ...formBaselineRef.current, photo: formBaselineRef.current.photo || '' }) ||
      !!file);

  const { clearDraft } = useFormDraft(DRAFT_KEY, formData, {
    enabled: showModal && !editingMember && isDirty,
    onRestore: (data) => {
      setFormData({ ...emptyForm(), ...data });
    },
  });

  const validateField = (name, value, label) => {
    const err = validateRequired(value, label);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
    return err;
  };

  const getBlockedMessage = (step) => {
    if (step === 1) {
      if (!formData.fullName?.trim()) return 'Indiquez le nom complet pour continuer.';
      if (!formData.role?.trim()) return 'Indiquez le rôle ou la fonction pour continuer.';
      if (!formData.category) return 'Choisissez une catégorie pour continuer.';
    }
    return '';
  };

  const canProceed = (step) => {
    if (step === 1) {
      return formData.fullName?.trim() && formData.role?.trim() && formData.category;
    }
    return true;
  };

  const filtered = useMemo(() => {
    const list =
      filterCategory === 'all'
        ? members
        : members.filter((m) => m.category === filterCategory);
    return [...list].sort((a, b) => {
      if (a.category !== b.category) {
        const order = TEAM_CATEGORIES.map((c) => c.value);
        return order.indexOf(a.category) - order.indexOf(b.category);
      }
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }, [members, filterCategory]);

  const categoryCounts = useMemo(() => {
    const counts = { all: members.length };
    TEAM_CATEGORIES.forEach((c) => {
      counts[c.value] = members.filter((m) => m.category === c.value).length;
    });
    return counts;
  }, [members]);

  const handleAddNew = () => {
    setEditingMember(null);
    const empty = emptyForm();
    setFormData(empty);
    formBaselineRef.current = empty;
    setFile(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    const normalized = {
      ...emptyForm(),
      fullName: member.fullName || '',
      role: member.role || '',
      category: member.category || 'coaches',
      bio: member.bio || '',
      photo: member.photo || '',
      certifications: member.certifications || '',
      enabled: member.enabled !== false,
    };
    setFormData(normalized);
    formBaselineRef.current = normalized;
    setFile(null);
    setFieldErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setFile(null);
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    if (!formData.fullName?.trim() || !formData.role?.trim() || !formData.category) {
      notifyError('Le nom, le rôle et la catégorie sont obligatoires.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        role: formData.role.trim(),
        category: formData.category,
        bio: formData.bio?.trim() || null,
        certifications: formData.certifications?.trim() || null,
        enabled: formData.enabled !== false,
        photo: formData.photo && !formData.photo.startsWith('blob:') && !formData.photo.startsWith('data:')
          ? formData.photo
          : editingMember?.photo || null,
      };

      if (file) {
        const result = await uploadApi.uploadImage('team', file);
        payload.photo = result.url;
      }

      if (editingMember) {
        await teamMembersApi.update(editingMember.id, {
          ...payload,
          displayOrder: editingMember.displayOrder,
        });
        logActivity('update', 'team_member', `Membre « ${payload.fullName} » modifié`);
        notifySuccess(`Fiche de ${payload.fullName} enregistrée.`);
      } else {
        await teamMembersApi.create(payload);
        logActivity('create', 'team_member', `Membre « ${payload.fullName} » ajouté à l'équipe`);
        notifySuccess(`${payload.fullName} a été ajouté(e) à l'équipe.`);
      }
      await loadMembers();
      loadTrash();
      clearDraft();
      handleCloseModal();
      setFormData(emptyForm());
    } catch (err) {
      notifyError(err, 'Impossible d\'enregistrer cette fiche.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClick = (member) => {
    setToggleTarget(member);
    setShowToggleConfirm(true);
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      const nextEnabled = !toggleTarget.enabled;
      await teamMembersApi.update(toggleTarget.id, {
        ...toggleTarget,
        enabled: nextEnabled,
      });
      logActivity(
        'update',
        'team_member',
        nextEnabled
          ? `${toggleTarget.fullName} de nouveau visible sur le site`
          : `${toggleTarget.fullName} masqué(e) du site`
      );
      notifySuccess(
        nextEnabled
          ? `${toggleTarget.fullName} est de nouveau visible sur la page Notre équipe.`
          : `${toggleTarget.fullName} ne s'affiche plus sur la page Notre équipe.`
      );
      await loadMembers();
    } catch (err) {
      notifyError(err, 'Impossible de modifier la visibilité.');
    } finally {
      setToggleTarget(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await teamMembersApi.remove(deleteTarget.id);
      logActivity(
        'delete',
        'team_member',
        `Membre déplacé en corbeille : ${deleteTarget.fullName}`
      );
      notifySuccess(`${deleteTarget.fullName} a été déplacé(e) en corbeille.`);
      await loadMembers();
      loadTrash();
    } catch (err) {
      notifyError(err, 'Impossible de supprimer ce membre.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleMove = async (member, direction) => {
    setMovingId(member.id);
    try {
      await teamMembersApi.move(member.id, direction);
      notifySuccess(
        direction === 'up'
          ? `${member.fullName} a été remonté(e) dans la liste.`
          : `${member.fullName} a été descendu(e) dans la liste.`
      );
      await loadMembers();
    } catch (err) {
      notifyError(
        err,
        direction === 'up'
          ? 'Impossible de remonter ce membre (déjà en haut de sa catégorie ?).'
          : 'Impossible de descendre ce membre (déjà en bas de sa catégorie ?).'
      );
    } finally {
      setMovingId(null);
    }
  };

  const membersInCategory = (category) =>
    members
      .filter((m) => m.category === category)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const canMoveUp = (member) => {
    const list = membersInCategory(member.category);
    return list.findIndex((m) => m.id === member.id) > 0;
  };

  const canMoveDown = (member) => {
    const list = membersInCategory(member.category);
    const idx = list.findIndex((m) => m.id === member.id);
    return idx >= 0 && idx < list.length - 1;
  };

  const wizardSteps = [
    {
      title: 'Identité',
      description: 'Qui est cette personne et quel est son rôle dans le club ?',
      content: (
        <>
          <TextInput
            label="Nom complet"
            name="team-fullname"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            onBlur={() => validateField('fullName', formData.fullName, 'Le nom complet')}
            error={fieldErrors.fullName}
            required
            example="Marie Dupont"
            help="Prénom et nom tels qu'ils apparaîtront sur le site."
          />
          <TextInput
            label="Rôle ou fonction"
            name="team-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            onBlur={() => validateField('role', formData.role, 'Le rôle')}
            error={fieldErrors.role}
            required
            list="team-role-suggestions"
            example="Entraîneur principal"
            help="Vous pouvez choisir une suggestion ou écrire un rôle libre."
          />
          <datalist id="team-role-suggestions">
            {TEAM_ROLE_SUGGESTIONS.map((role) => (
              <option key={role} value={role} />
            ))}
          </datalist>
          <SelectField
            label="Catégorie d'affichage"
            name="team-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={TEAM_CATEGORIES}
            required
            help="Les membres sont regroupés par catégorie sur la page Notre équipe."
          />
        </>
      ),
    },
    {
      title: 'Présentation',
      description: 'Textes affichés sur la fiche du membre (facultatifs).',
      content: (
        <>
          <TextArea
            label="Courte biographie"
            name="team-bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            optionalLabel="(facultatif)"
            help="Quelques lignes sur le parcours ou le rôle de la personne."
            example="Encadrement des séances et suivi des pratiquants, du débutant au confirmé."
          />
          <TextArea
            label="Diplômes et certifications"
            name="team-certifications"
            value={formData.certifications}
            onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
            rows={3}
            optionalLabel="(facultatif)"
            help="Ex. : Diplôme d'État, BPJEPS. Une ligne par diplôme si vous en avez plusieurs."
            example="BPJEPS — Formation fédérale"
          />
        </>
      ),
    },
    {
      title: 'Photo',
      description: 'Ajoutez une photo pour que les visiteurs reconnaissent les membres.',
      content: (
        <ImageUploadField
          label="Photo du membre"
          name="team-photo"
          value={formData.photo}
          folder="team"
          help="Photo carrée recommandée. Formats : JPG, PNG. Taille conseillée : moins de 2 Mo."
          example="Portrait du coach ou du bénévole"
          onFileSelect={setFile}
          onChange={({ preview }) =>
            setFormData((prev) => ({ ...prev, photo: preview || prev.photo }))
          }
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="manage-team">
        <LoadingState label="Chargement de l'équipe…" />
      </div>
    );
  }

  return (
    <div className="manage-team">
      <PageHeader
        title="Équipe"
        subtitle="Présentez les coachs, le bureau et les bénévoles sur la page Notre équipe du site."
        breadcrumbs={adminBreadcrumbs(NAV_ITEMS.team)}
        actions={
          <button type="button" className="btn btn-primary" onClick={handleAddNew}>
            <FontAwesomeIcon icon={faPlus} />
            Ajouter un membre
          </button>
        }
      />

      <HelpTip text="Utilisez les boutons Monter / Descendre pour ranger l'ordre d'affichage dans chaque catégorie." />

      <TrashTabs
        view={trash.view}
        onViewChange={trash.setView}
        activeCount={members.length}
        trashCount={trash.trashItems.length}
      />

      {trash.view === 'active' ? (
        <>
          <div className="category-filters">
            <button
              type="button"
              className={`category-filter ${filterCategory === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCategory('all')}
            >
              Tous ({categoryCounts.all})
            </button>
            {TEAM_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`category-filter ${filterCategory === cat.value ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat.value)}
              >
                {cat.label} ({categoryCounts[cat.value] || 0})
              </button>
            ))}
          </div>

          <div className="team-list">
            {filtered.length === 0 ? (
              <EmptyStateGuided
                icon={faUsers}
                title="Aucun membre dans l'équipe"
                message="Ajoutez les coachs, dirigeants et bénévoles pour les afficher sur le site."
                actionLabel="Ajouter un membre"
                onAction={handleAddNew}
              />
            ) : (
              filtered.map((member) => (
                <HighlightableCard
                  key={member.id}
                  id={member.id}
                  className={`team-card ${member.enabled === false ? 'disabled' : ''}`}
                >
                  <div className="team-card__header">
                    <div className="team-card__identity">
                      <div className="team-card__thumb" aria-hidden>
                        {member.photo ? (
                          <img src={member.photo} alt="" />
                        ) : (
                          <span className="team-card__initials">
                            {memberInitials(member.fullName)}
                          </span>
                        )}
                      </div>
                      <div className="team-card__info">
                        <span className="team-card__badge">{categoryLabel(member.category)}</span>
                        <h3>{member.fullName}</h3>
                        <p className="team-card__role">{member.role}</p>
                        <p className="team-card__visibility">
                          {member.enabled !== false
                            ? 'Visible sur le site'
                            : 'Masqué(e) du site'}
                        </p>
                      </div>
                    </div>

                    <div className="team-card__actions">
                      <div className="team-card__order">
                        <button
                          type="button"
                          className="btn-order"
                          disabled={!canMoveUp(member) || movingId === member.id}
                          onClick={() => handleMove(member, 'up')}
                          aria-label={`Monter ${member.fullName}`}
                        >
                          <FontAwesomeIcon icon={faArrowUp} aria-hidden />
                          Monter
                        </button>
                        <button
                          type="button"
                          className="btn-order"
                          disabled={!canMoveDown(member) || movingId === member.id}
                          onClick={() => handleMove(member, 'down')}
                          aria-label={`Descendre ${member.fullName}`}
                        >
                          <FontAwesomeIcon icon={faArrowDown} aria-hidden />
                          Descendre
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => {
                          setPreviewMember(member);
                          setShowPreview(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} aria-hidden /> Aperçu
                      </button>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleEdit(member)}
                      >
                        <FontAwesomeIcon icon={faEdit} aria-hidden /> Modifier
                      </button>
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleToggleClick(member)}
                      >
                        {member.enabled !== false ? 'Masquer' : 'Afficher'}
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => {
                          setDeleteTarget(member);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} aria-hidden /> Supprimer
                      </button>
                    </div>
                  </div>
                </HighlightableCard>
              ))
            )}
          </div>
        </>
      ) : (
        <TrashPanel
          items={trash.trashItems}
          loading={trash.trashLoading}
          emptyMessage="Aucun membre en corbeille."
          getItemLabel={(item) => item.fullName || 'Membre'}
          getItemMeta={(item) => item.role}
          onRestore={trash.restoreItem}
          restoringId={trash.restoringId}
        />
      )}

      <WizardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingMember ? 'Modifier la fiche' : 'Ajouter un membre'}
        steps={wizardSteps}
        onComplete={handleSubmit}
        isEdit={!!editingMember}
        canProceed={canProceed}
        getBlockedMessage={getBlockedMessage}
        isDirty={isDirty}
        completing={saving}
        size="lg"
      />

      <Modal
        isOpen={showPreview && !!previewMember}
        onClose={() => setShowPreview(false)}
        size="md"
        title={previewMember ? `Aperçu : ${previewMember.fullName}` : 'Aperçu'}
      >
        {previewMember ? (
          <div className="team-preview">
            <div className="team-preview__photo">
              {previewMember.photo ? (
                <img src={previewMember.photo} alt={previewMember.fullName} />
              ) : (
                <div className="team-preview__placeholder">
                  <FontAwesomeIcon icon={faUser} aria-hidden />
                  <span>{memberInitials(previewMember.fullName)}</span>
                </div>
              )}
            </div>
            <span className="team-preview__badge">
              {categoryLabel(previewMember.category)}
            </span>
            <h3>{previewMember.fullName}</h3>
            <h4>{previewMember.role}</h4>
            {previewMember.bio ? <p className="team-preview__bio">{previewMember.bio}</p> : null}
            {previewMember.certifications ? (
              <div className="team-preview__certs">
                <strong>Diplômes et certifications</strong>
                <p>{previewMember.certifications}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={showToggleConfirm}
        onClose={() => {
          setShowToggleConfirm(false);
          setToggleTarget(null);
        }}
        onConfirm={confirmToggle}
        title={
          toggleTarget?.enabled !== false
            ? 'Masquer ce membre du site ?'
            : 'Réafficher ce membre sur le site ?'
        }
        itemLabel={toggleTarget?.fullName}
        consequences={
          toggleTarget?.enabled !== false
            ? [
                `${toggleTarget?.fullName || 'Ce membre'} ne sera plus visible sur la page Notre équipe.`,
                'La fiche reste modifiable et pourra être réaffichée plus tard.',
              ]
            : [
                `${toggleTarget?.fullName || 'Ce membre'} sera de nouveau visible sur la page Notre équipe.`,
              ]
        }
        confirmText={toggleTarget?.enabled !== false ? 'Masquer' : 'Afficher'}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Supprimer ce membre ?"
        itemLabel={deleteTarget?.fullName}
        consequences={[
          `Vous allez déplacer ${deleteTarget?.fullName || 'ce membre'} en corbeille pendant 30 jours.`,
          'La fiche disparaîtra de la page Notre équipe pendant ce délai.',
          'Vous pourrez la restaurer depuis la corbeille.',
        ]}
        type="danger"
        confirmText="Supprimer"
        danger
      />
    </div>
  );
};

export default ManageTeam;
