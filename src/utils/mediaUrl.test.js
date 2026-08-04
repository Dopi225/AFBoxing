import { describe, expect, it } from 'vitest';
import { isEphemeralMediaUrl, stripEphemeralMediaFields } from './mediaUrl.js'

describe('stripEphemeralMediaFields', () => {
  it('conserve les tableaux (ne pas convertir en objet indexé)', () => {
    const schedule = [
      { day: 'Lundi', activities: [{ time: '18h', activity: 'Boxe' }] },
      { day: 'Mardi', activities: [] },
    ]
    const out = stripEphemeralMediaFields(schedule)
    expect(Array.isArray(out)).toBe(true)
    expect(out).toHaveLength(2)
    expect(out.map((d) => d.day)).toEqual(['Lundi', 'Mardi'])
  })

  it('retire les data: URL sur un objet', () => {
    const out = stripEphemeralMediaFields({
      title: 'x',
      image: 'data:image/png;base64,aaa',
      photo: 'blob:http://localhost/1',
    })
    expect(out.image).toBe('')
    expect(out.photo).toBe('')
    expect(out.title).toBe('x')
  })

  it('nettoie les médias dans les éléments d’un tableau', () => {
    const out = stripEphemeralMediaFields([
      { name: 'A', photo: 'data:image/jpeg;base64,xx' },
      { name: 'B', photo: '/uploads/team/b.jpg' },
    ])
    expect(out[0].photo).toBe('')
    expect(out[1].photo).toBe('/uploads/team/b.jpg')
  })
})

describe('isEphemeralMediaUrl', () => {
  it('détecte data et blob', () => {
    expect(isEphemeralMediaUrl('data:image/png;base64,x')).toBe(true)
    expect(isEphemeralMediaUrl('blob:http://x/1')).toBe(true)
    expect(isEphemeralMediaUrl('/uploads/a.jpg')).toBe(false)
  })
})
