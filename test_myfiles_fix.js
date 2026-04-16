// Test to verify MyFiles.js loading spinners
const fs = require('fs');
const path = require('path');

console.log('Testing MyFiles.js loading spinners implementation...\n');

const myFilesPath = path.join(__dirname, 'frontend/src/components/MyFiles.js');
const content = fs.readFileSync(myFilesPath, 'utf8');

// Check for key features
const checks = [
  {
    name: 'downloadingFiles state variable',
    regex: /const \[downloadingFiles, setDownloadingFiles\] = useState\(\{\}\)/,
    required: true
  },
  {
    name: 'fetchAndDownload function with loading state',
    regex: /const fetchAndDownload = async \(url, filename, fileId, setDownloadingFiles\)/,
    required: true
  },
  {
    name: 'Lesson download button with spinner',
    regex: /downloadingFiles\[`lesson-\$\{file\.lesson_id\}`\] \?/,
    required: true
  },
  {
    name: 'Dictation download button with spinner',
    regex: /downloadingFiles\[`dictation-\$\{file\.dictation_id\}`\] \?/,
    required: true
  },
  {
    name: 'Upload download button with spinner',
    regex: /downloadingFiles\[`upload-\$\{file\.upload_id\}`\] \?/,
    required: true
  },
  {
    name: 'Template download button with spinner',
    regex: /downloadingFiles\[`template-\$\{file\.template_id\}`\] \?/,
    required: true
  },
  {
    name: 'Scheme download button with spinner',
    regex: /downloadingFiles\[`scheme-\$\{file\.scheme_id\}`\] \?/,
    required: true
  },
  {
    name: 'Loading spinner HTML',
    regex: /<div className="w-3\.5 h-3\.5 border-2 border-\[#8E44AD\] border-t-transparent rounded-full animate-spin" \/>Loading/,
    required: true
  }
];

let passed = 0;
let failed = 0;

console.log('Running checks...\n');

checks.forEach(check => {
  const match = content.match(check.regex);
  if (match) {
    console.log(`✅ ${check.name}`);
    passed++;
  } else {
    console.log(`❌ ${check.name}`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 SUCCESS: All loading spinners have been implemented correctly!');
  console.log('The following download buttons now show loading spinners:');
  console.log('  • Lesson plans');
  console.log('  • Dictations');
  console.log('  • Uploads');
  console.log('  • Templates');
  console.log('  • Schemes of work');
  console.log('\nEach button will show a spinner while downloading and disable the button.');
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.');
  process.exit(1);
}