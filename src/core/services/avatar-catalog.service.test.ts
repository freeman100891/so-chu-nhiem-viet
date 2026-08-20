import { describe, it, expect } from 'vitest';
import { avatarCatalogService, resolveStudentAvatar } from './avatar-catalog.service';

describe('AvatarCatalogService Tests', () => {
  it('should build catalog and discover all avatars from src/assets/images/avatars', () => {
    const catalog = avatarCatalogService.getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(25);
    const defaultStudent = catalog.find((i) => i.key === 'default/default-student');
    expect(defaultStudent).toBeDefined();
    expect(defaultStudent?.category).toBe('default');
    expect(defaultStudent?.label).toBe('Học sinh tiêu chuẩn');
  });

  it('should filter avatars by category correctly', () => {
    const animals = avatarCatalogService.getByCategory('animals');
    expect(animals.length).toBeGreaterThanOrEqual(8);
    expect(animals.every((i) => i.category === 'animals')).toBe(true);

    const students = avatarCatalogService.getByCategory('students');
    expect(students.length).toBeGreaterThanOrEqual(6);

    const all = avatarCatalogService.getByCategory('all');
    expect(all.length).toBe(avatarCatalogService.getCatalog().length);
  });

  it('should search avatars by Vietnamese name or category', () => {
    const pandaResults = avatarCatalogService.search('Panda');
    expect(pandaResults.length).toBeGreaterThanOrEqual(1);
    expect(pandaResults[0]?.key).toBe('animals/animal-panda');

    const ethnicResults = avatarCatalogService.search('Tày');
    expect(ethnicResults.length).toBeGreaterThanOrEqual(1);
  });

  it('should resolve student avatar with correct cascading priority', () => {
    const panda = avatarCatalogService.getAvatarByKey('animals/animal-panda');
    const star = avatarCatalogService.getAvatarByKey('cartoons/cartoon-star');
    const sysDefault = avatarCatalogService.getSystemDefaultSrc();

    // Priority 1: Custom base64 avatar
    expect(resolveStudentAvatar('animals/animal-panda', 'cartoons/cartoon-star', 'data:image/png;base64,custom')).toBe(
      'data:image/png;base64,custom'
    );

    // Priority 2: Student avatarKey
    expect(resolveStudentAvatar('animals/animal-panda', 'cartoons/cartoon-star')).toBe(panda?.src);

    // Priority 3: Default system avatarKey
    expect(resolveStudentAvatar(null, 'cartoons/cartoon-star')).toBe(star?.src);

    // Priority 4: Built-in default fallback
    expect(resolveStudentAvatar(null, null)).toBe(sysDefault);

    // Invalid key falls back to default avatar
    expect(resolveStudentAvatar('invalid/nonexistent-key', 'cartoons/cartoon-star')).toBe(star?.src);
  });
});
