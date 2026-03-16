export const fuzzyMatch = (query: string, text: string): boolean => {
  if (!query) return true;
  const normalizedQuery = query.toLowerCase().replace(/triceps/g, 'trizeps').replace(/biceps/g, 'bizeps');
  const normalizedText = text.toLowerCase();
  
  return normalizedText.includes(normalizedQuery);
};

export const inferMuscleGroup = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('trizeps') || lowerName.includes('triceps')) return 'Trizeps';
  if (lowerName.includes('bizeps') || lowerName.includes('biceps') || lowerName.includes('curl')) return 'Bizeps';
  if (lowerName.includes('brust') || lowerName.includes('bankdrücken') || lowerName.includes('chest')) return 'Brust';
  if (lowerName.includes('rücken') || lowerName.includes('pull') || lowerName.includes('row') || lowerName.includes('rudern')) return 'Rücken';
  if (lowerName.includes('bein') || lowerName.includes('squat') || lowerName.includes('leg') || lowerName.includes('kniebeuge')) return 'Beine';
  if (lowerName.includes('schulter') || lowerName.includes('shoulder') || lowerName.includes('press')) return 'Schultern';
  if (lowerName.includes('bauch') || lowerName.includes('core') || lowerName.includes('crunch')) return 'Bauch';
  return 'Ganzkörper/Andere';
};
