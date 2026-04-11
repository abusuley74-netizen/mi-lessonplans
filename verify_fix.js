const fs = require('fs');
const path = require('path');

const myFilesPath = path.join(__dirname, 'frontend/src/components/MyFiles.js');
const content = fs.readFileSync(myFilesPath, 'utf8');

console.log('=== Verification of MyFiles.js Fix ===\n');

// Check 1: Is fetchAllFiles defined before useEffect?
const useEffectIndex = content.indexOf('useEffect(() => {');
const fetchAllFilesIndex = content.indexOf('const fetchAllFiles = useCallback');

if (fetchAllFilesIndex < useEffectIndex) {
  console.log('✅ PASS: fetchAllFiles is defined BEFORE useEffect');
} else {
  console.log('❌ FAIL: fetchAllFiles is defined AFTER useEffect');
}

// Check 2: Does useEffect have fetchAllFiles in dependency array?
const useEffectMatch = content.match(/useEffect\(\(\) => \{[^}]*fetchAllFiles\(\);[^}]*\}, \[([^\]]*)\]\);/);
if (useEffectMatch) {
  const deps = useEffectMatch[1];
  if (deps.includes('fetchAllFiles')) {
    console.log('✅ PASS: useEffect has fetchAllFiles in dependency array');
  } else if (deps.trim() === '') {
    console.log('⚠️  WARNING: useEffect has empty dependency array (might be okay)');
  } else {
    console.log('❓ UNKNOWN: useEffect has different dependencies:', deps);
  }
} else {
  console.log('❌ FAIL: Could not find useEffect pattern');
}

// Check 3: Is fetchAllFiles created with useCallback?
if (content.includes('const fetchAllFiles = useCallback(async () => {')) {
  console.log('✅ PASS: fetchAllFiles is created with useCallback');
} else {
  console.log('❌ FAIL: fetchAllFiles is not created with useCallback');
}

// Check 4: Does useCallback have empty dependency array?
const useCallbackMatch = content.match(/const fetchAllFiles = useCallback\(async \(\) => \{[\s\S]*?\}, \[([^\]]*)\]\);/);
if (useCallbackMatch) {
  const deps = useCallbackMatch[1];
  if (deps.trim() === '') {
    console.log('✅ PASS: useCallback has empty dependency array (fetchAllFiles is stable)');
  } else {
    console.log('⚠️  WARNING: useCallback has dependencies:', deps);
  }
} else {
  console.log('❌ FAIL: Could not find useCallback pattern');
}

console.log('\n=== Summary ===');
console.log('The fix addresses the "Cannot access fetchAllFiles before initialization" error by:');
console.log('1. Defining fetchAllFiles with useCallback BEFORE the useEffect that uses it');
console.log('2. Making fetchAllFiles stable (empty dependency array in useCallback)');
console.log('3. Including fetchAllFiles in useEffect dependency array (optional but good practice)');
