const adjectives = [
    'ancient', 'bold', 'calm', 'dark', 'elegant', 
    'fierce', 'gentle', 'hidden', 'icy', 'jazzy',
    'kind', 'lofty', 'misty', 'noble', 'ornate',
    'peaceful', 'quiet', 'radiant', 'silent', 'tall',
    'urban', 'vast', 'warm', 'young', 'zealous'
  ];
  
  const nouns = [
    'arch', 'bridge', 'castle', 'dome', 'entrance',
    'facade', 'garden', 'hall', 'interior', 'junction',
    'keep', 'lobby', 'mansion', 'nook', 'obelisk',
    'palace', 'quarter', 'roof', 'spire', 'tower',
    'vault', 'wall', 'yard', 'zone', 'balcony'
  ];
  
  export function generateImageName(): string {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective}-${noun}`;
  }
  
  