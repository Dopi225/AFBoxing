import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFistRaised,
  faGraduationCap,
  faHeart,
  faUsers,
  faEnvelope,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SectionHeader from './SectionHeader';
import { LoadingState, ErrorState, EmptyState } from './PageStates';
import { teamMembersApi } from '../services/apiService';
import { TEAM_CATEGORIES } from '../constants/adminCopy';
import '../style/Equipe.scss';

const memberInitials = (name) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const parseCertifications = (raw) => {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(/\n|•|;/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const Equipe = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await teamMembersApi.list();
        if (!cancelled) {
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setError('Impossible de charger l\'équipe pour le moment. Réessayez dans un instant.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const active = members.filter((m) => m.enabled !== false);
    return TEAM_CATEGORIES.map((cat) => ({
      ...cat,
      members: active
        .filter((m) => m.category === cat.value)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    })).filter((group) => group.members.length > 0);
  }, [members]);

  const totalActive = grouped.reduce((sum, g) => sum + g.members.length, 0);

  return (
    <div className="container-fluid">
      <SectionHeader
        title="L'équipe"
        subtitle="Des professionnels passionnés (sport & socio-éducatif) pour vous accompagner avec exigence, bienveillance et sécurité."
        eyebrow="Encadrement qualifié"
        actions={[
          {
            label: 'Activités',
            to: '/activite',
            className: 'btn-primary',
            icon: <FontAwesomeIcon icon={faFistRaised} />,
          },
          {
            label: 'Contact',
            to: '/contact',
            className: 'btn-secondary',
            icon: <FontAwesomeIcon icon={faEnvelope} />,
          },
        ]}
      />

      <section className="content-section">
        <div className="container">
          {loading ? <LoadingState label="Chargement de l'équipe…" /> : null}

          {!loading && error ? (
            <ErrorState
              title="Équipe indisponible"
              message={error}
              onRetry={() => window.location.reload()}
            />
          ) : null}

          {!loading && !error && totalActive === 0 ? (
            <EmptyState title="L'équipe sera bientôt présentée">
              Les fiches des coachs, du bureau et des bénévoles seront publiées ici.
            </EmptyState>
          ) : null}

          {!loading && !error && totalActive > 0
            ? grouped.map((group) => (
                <div key={group.value} className="team-category-block">
                  <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    {group.label}
                  </motion.h2>

                  <div className="team-grid">
                    {group.members.map((member, index) => {
                      const certs = parseCertifications(member.certifications);
                      return (
                        <motion.div
                          key={member.id}
                          className="member-card"
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.08 }}
                          viewport={{ once: true }}
                        >
                          <div className="member-photo">
                            {member.photo ? (
                              <img
                                src={member.photo}
                                alt={member.fullName}
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className="member-photo-placeholder"
                                aria-label={`Photo non disponible pour ${member.fullName}`}
                              >
                                <FontAwesomeIcon icon={faUser} aria-hidden />
                                <span>{memberInitials(member.fullName)}</span>
                              </div>
                            )}
                            <div className="photo-overlay">
                              <FontAwesomeIcon icon={faFistRaised} />
                            </div>
                          </div>

                          <div className="member-info">
                            <h3>{member.fullName}</h3>
                            <h4>{member.role}</h4>
                            {member.bio ? (
                              <p className="description">{member.bio}</p>
                            ) : null}

                            {certs.length > 0 ? (
                              <div className="certifications">
                                <h5>Diplômes et certifications</h5>
                                <ul>
                                  {certs.map((cert) => (
                                    <li key={cert}>{cert}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            : null}
        </div>
      </section>

      <section className="team-values">
        <div className="container">
          <motion.div
            className="values-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Nos Valeurs d'Équipe</h2>
            <div className="values-grid">
              <div className="value-item">
                <FontAwesomeIcon icon={faHeart} className="value-icon" />
                <h3>Passion</h3>
                <p>Une équipe passionnée par le sport et l'éducation</p>
              </div>
              <div className="value-item">
                <FontAwesomeIcon icon={faGraduationCap} className="value-icon" />
                <h3>Formation</h3>
                <p>Des éducateurs diplômés et en formation continue</p>
              </div>
              <div className="value-item">
                <FontAwesomeIcon icon={faUsers} className="value-icon" />
                <h3>Bienveillance</h3>
                <p>Un encadrement bienveillant et adapté à chacun</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="team-cta">
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Rejoignez notre équipe</h2>
            <p>Vous souhaitez nous rejoindre ou devenir bénévole ? Contactez-nous !</p>
            <button className="btn btn-primary" type="button" onClick={() => navigate('/contact')}>
              <FontAwesomeIcon icon={faEnvelope} />
              Nous contacter
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Equipe;
