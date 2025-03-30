const asciiEyes = {
    'happy': '^_^',
    'sad': 'T_T',
    'angry': '>_<',
    'surprised': 'O_O',
    'confused': 'o_O',
    'excited': '*_*',
    'tired': '-_-',
    'cool': '⌐■_■',
    'love': '♥_♥',
    'neutral': '•_•',
    'worried': '⊙_⊙',
    'scared': 'ⓧ_ⓧ',
    'evil': '⊗_⊗',
    'silly': 'x_x',
    'crying': 'இ_இ',
    'wink': ';)',
    'thinking': '?_?',
    'rolling': '◔_◔',
    'suspicious': '¬_¬',
    'eye': '◉',
    'eyes': '◉◉',
    'spiral': '@_@',
    'default': '◉_◉'
} as const;

// This automatically creates a union type of all the keys in asciiEyes
export type Mood = keyof typeof asciiEyes;

export const generateMood = (mood: Mood): string => {
    return asciiEyes[mood];
};

export const convertFileToBase64 = (file: File): Promise<{ imageData: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve({
        imageData: reader.result as string
      });
    };
    
    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};