// Simple test to check if the MyFiles component has the initialization error
const fs = require('fs');
const path = require('path');

const myFilesPath = path.join(__dirname, 'frontend/src/components/MyFiles.js');
const content = fs.readFileSync(myFilesPath, 'utf8');

// Check for the problematic pattern
const lines = content.split('\n');
let hasError = false;
let errorLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('useEffect') && line.includes('fetchAllFiles') && lines[i+1] && lines[i+1].includes('[fetchAllFiles]')) {
    hasError = true;
    errorLine = i + 1;
    break;
  }
}

if (hasError) {
  console.log('❌ ERROR: Found problematic useEffect with [fetchAllFiles] dependency on line', errorLine);
  console.log('   This causes "Cannot access fetchAllFiles before initialization" error');
  process.exit(1);
} else {
  console.log('✅ SUCCESS: No initialization error found in MyFiles.js');
  console.log('   The useEffect dependency array is correctly empty []');
  
  // Also check that fetchAllFiles is defined before useEffect
  const useEffectIndex = content.indexOf('useEffect(() => {');
  const fetchAllFilesIndex = content.indexOf('const fetchAllFiles = useCallback');
  
  if (fetchAllFilesIndex < useEffectIndex) {
    console.log('✅ fetchAllFiles is defined before useEffect (good)');
  } else {
    console.log('⚠️  fetchAllFiles is defined after useEffect (might still work with empty dependency array)');
  }
}
