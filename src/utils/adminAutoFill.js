/** Automatisation côté front — valeurs déduites avant envoi API */

export { todayISO } from './dateFormat';

export function slugify(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function generateActivityId(title, existingIds = []) {
  const base = slugify(title) || 'activite';
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function generatePriceKey(label, category = 'boxing', existingKeys = []) {
  const slug = slugify(label) || 'tarif';
  const base = `${category}.${slug}`;
  if (!existingKeys.includes(base)) return base;
  let i = 2;
  while (existingKeys.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function defaultScheduleActivityName(title) {
  return (title || '').trim();
}

export function defaultActivityIcon(kind) {
  return kind === 'social' ? 'faGraduationCap' : 'faFistRaised';
}

export function inferPricingCategory(activityId, activities = []) {
  if (!activityId) return 'boxing';
  const act = activities.find((a) => a.id === activityId);
  return act?.kind || 'boxing';
}

export function prepareActivityPayload(form, existingIds = []) {
  const title = (form.title || '').trim();
  const id = form.id || generateActivityId(title, existingIds.filter((x) => x !== form.id));
  return {
    ...form,
    id,
    title,
    scheduleActivityName: (form.scheduleActivityName || '').trim() || defaultScheduleActivityName(title),
    icon: form.icon || defaultActivityIcon(form.kind),
    enabled: form.enabled !== false,
  };
}

export function preparePricingPayload(form, activities = [], existingKeys = [], isEdit = false) {
  const label = (form.label || '').trim();
  const category = form.activityId
    ? inferPricingCategory(form.activityId, activities)
    : (form.category || 'boxing');
  const price_key = isEdit
    ? form.price_key
    : generatePriceKey(label, category, existingKeys);
  return {
    price_key,
    label,
    amount: form.amount,
    period: form.period || 'an',
    note: form.note || '',
    category,
    enabled: form.enabled !== false,
    activityId: form.activityId || '',
  };
}
