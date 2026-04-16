// Test script for Scheme of Work language detection
const detectLanguage = (subject) => {
  if (!subject) return 'english';
  
  const subjectLower = subject.toLowerCase();
  
  const swahiliSubjects = [
    'kiswahili', 'uraia', 'maadili', 'sayansi', 'hisabati', 
    'jiografia', 'jigrafia', 'historia', 'biologia', 'kemia', 'fizikia',
    'swahili', 'civics', 'civic education', 'elimu ya maadili'
  ];
  
  const arabicSubjects = [
    'اللغة العربية', 'عربي', 'اسلامية', 'التربية الإسلامية',
    'علوم', 'رياضيات', 'اجتماعيات', 'arabic', 'islamic', 'islamiya'
  ];
  
  const frenchSubjects = [
    'français', 'french', 'mathématiques', 'sciences', 'francais'
  ];
  
  if (swahiliSubjects.some(s => subjectLower.includes(s))) {
    return 'swahili';
  }
  
  if (arabicSubjects.some(s => subjectLower.includes(s))) {
    return 'arabic';
  }
  
  if (frenchSubjects.some(s => subjectLower.includes(s))) {
    return 'french';
  }
  
  return 'english';
};

// Test cases
const testCases = [
  { subject: 'Kiswahili', expected: 'swahili' },
  { subject: 'kiswahili', expected: 'swahili' },
  { subject: 'KISWAHILI', expected: 'swahili' },
  { subject: 'Uraia na Maadili', expected: 'swahili' },
  { subject: 'Sayansi', expected: 'swahili' },
  { subject: 'Hisabati', expected: 'swahili' },
  { subject: 'Jigrafia', expected: 'swahili' },
  { subject: 'Historia', expected: 'swahili' },
  { subject: 'Biologia', expected: 'swahili' },
  { subject: 'Kemia', expected: 'swahili' },
  { subject: 'Fizikia', expected: 'swahili' },
  { subject: 'اللغة العربية', expected: 'arabic' },
  { subject: 'عربي', expected: 'arabic' },
  { subject: 'اسلامية', expected: 'arabic' },
  { subject: 'التربية الإسلامية', expected: 'arabic' },
  { subject: 'Arabic Language', expected: 'arabic' },
  { subject: 'Islamic Studies', expected: 'arabic' },
  { subject: 'français', expected: 'french' },
  { subject: 'French', expected: 'french' },
  { subject: 'FRENCH', expected: 'french' },
  { subject: 'Mathématiques', expected: 'french' },
  { subject: 'Sciences', expected: 'french' },
  { subject: 'English', expected: 'english' },
  { subject: 'Physics', expected: 'english' },
  { subject: 'Chemistry', expected: 'english' },
  { subject: 'Mathematics', expected: 'english' },
  { subject: 'Biology', expected: 'english' },
  { subject: '', expected: 'english' },
  { subject: null, expected: 'english' },
  { subject: undefined, expected: 'english' },
];

console.log('Testing Scheme of Work Language Detection Function\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = detectLanguage(testCase.subject);
  const status = result === testCase.expected ? '✓ PASS' : '✗ FAIL';
  
  if (result === testCase.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Subject: "${testCase.subject}"`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result}`);
  console.log('');
});

console.log('='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

// Test edge cases
console.log('\nEdge Cases:');
console.log('1. Mixed case: "KiSwAhIlI" ->', detectLanguage('KiSwAhIlI'));
console.log('2. Partial match: "Advanced Kiswahili Literature" ->', detectLanguage('Advanced Kiswahili Literature'));
console.log('3. Multiple languages in subject: "French and Arabic" ->', detectLanguage('French and Arabic'));
console.log('4. Swahili with English: "Hisabati (Mathematics)" ->', detectLanguage('Hisabati (Mathematics)'));