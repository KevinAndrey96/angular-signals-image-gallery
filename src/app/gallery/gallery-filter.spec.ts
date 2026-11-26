import {
  countByTag,
  filterPhotos,
  matchesQuery,
  normalizeText,
  searchTerms,
  wrapIndex,
} from './gallery-filter';
import { Photo } from './photo';

const photo = (overrides: Partial<Photo>): Photo => ({
  id: 1,
  title: 'Sin título',
  description: '',
  tags: [],
  author: 'Anónimo',
  sourceUrl: 'https://unsplash.com/photos/x',
  width: 300,
  height: 200,
  ...overrides,
});

const lake = photo({ id: 1, title: 'Lago en la montaña', tags: ['water', 'mountain'] });
const bridge = photo({ id: 2, title: 'Puente de noche', author: 'Johnny Lam', tags: ['city'] });
const forest = photo({ id: 3, title: 'Sendero', description: 'Bosque húmedo', tags: ['nature'] });
const catalog = [lake, bridge, forest];

describe('normalizeText', () => {
  it.each([
    ['Montaña', 'montana'],
    ['  CAMIÓN   azul ', 'camion azul'],
    ['Pingüino', 'pinguino'],
    ['', ''],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });
});

describe('searchTerms', () => {
  it('splits a query into normalized terms', () => {
    expect(searchTerms('  Río   BOSQUE ')).toEqual(['rio', 'bosque']);
  });

  it('returns no terms for a blank query', () => {
    expect(searchTerms('   ')).toEqual([]);
  });
});

describe('matchesQuery', () => {
  it.each([
    ['title', ['lago'], lake, true],
    ['accent-insensitive title', ['montana'], lake, true],
    ['author', ['lam'], bridge, true],
    ['description', ['humedo'], forest, true],
    ['tag label', ['ciudad'], bridge, true],
    ['every term', ['puente', 'noche'], bridge, true],
    ['missing term', ['puente', 'dia'], bridge, false],
    ['no terms', [], forest, true],
  ] as const)('matches by %s', (_case, terms, target, expected) => {
    expect(matchesQuery(target, terms)).toBe(expected);
  });
});

describe('filterPhotos', () => {
  it('keeps the catalog order when there is no filter', () => {
    expect(filterPhotos(catalog, { query: '', tag: null })).toEqual(catalog);
  });

  it('filters by tag', () => {
    expect(filterPhotos(catalog, { query: '', tag: 'water' })).toEqual([lake]);
  });

  it('combines tag and query', () => {
    expect(filterPhotos(catalog, { query: 'puente', tag: 'water' })).toEqual([]);
    expect(filterPhotos(catalog, { query: 'puente', tag: 'city' })).toEqual([bridge]);
  });
});

describe('countByTag', () => {
  it('counts every tag of the whole catalog', () => {
    expect(Object.fromEntries(countByTag(catalog, ''))).toEqual({
      water: 1,
      mountain: 1,
      city: 1,
      nature: 1,
    });
  });

  it('only counts photos matching the query', () => {
    expect(Object.fromEntries(countByTag(catalog, 'lago'))).toEqual({ water: 1, mountain: 1 });
  });
});

describe('wrapIndex', () => {
  it.each([
    [0, 1, 3, 1],
    [2, 1, 3, 0],
    [0, -1, 3, 2],
    [1, -4, 3, 0],
    [0, 1, 1, 0],
    [0, 1, 0, -1],
  ])('moves from %i by %i in %i items to %i', (index, delta, length, expected) => {
    expect(wrapIndex(index, delta, length)).toBe(expected);
  });
});
