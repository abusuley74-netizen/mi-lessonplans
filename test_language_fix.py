#!/usr/bin/env python3
"""Test language detection fix"""

def detect_language(subject: str) -> str:
    """Detect language based on subject name"""
    subject_lower = subject.lower()
    
    swahili_subjects = [
        'kiswahili', 'uraia', 'maadili', 'sayansi', 'hisabati', 
        'jiografia', 'historia', 'biologia', 'kemia', 'fizikia',
        'swahili', 'civics', 'civic education', 'elimu ya maadili'
    ]
    
    arabic_subjects = [
        'اللغة العربية', 'عربي', 'اسلامية', 'التربية الإسلامية',
        'علوم', 'رياضيات', 'اجتماعيات', 'arabic', 'islamic', 'islamiya',
        'العربية', 'الضماير', 'القرآن', 'التجويد', 'الفقه', 'التفسير',
        'اللغة', 'عرب', 'اسلام', 'إسلامية', 'إسلام', 'قرآن', 'تجويد',
        'فقه', 'تفسير', 'عربية'
    ]
    
    french_subjects = [
        'français', 'french', 'mathématiques', 'sciences', 'francais'
    ]
    
    # Check for Arabic characters in the subject
    arabic_chars = any('\u0600' <= char <= '\u06FF' for char in subject)
    if arabic_chars:
        return 'arabic'
    
    if any(s in subject_lower for s in swahili_subjects):
        return 'swahili'
    
    if any(s in subject_lower for s in arabic_subjects):
        return 'arabic'
    
    if any(s in subject_lower for s in french_subjects):
        return 'french'
    
    return 'english'

# Test Arabic detection
arabic_tests = ['اللغة العربية', 'عربي', 'اسلامية', 'التربية الإسلامية', 'العربية', 'القرآن', 'التجويد']
print("Testing Arabic detection:")
for test in arabic_tests:
    result = detect_language(test)
    print(f'  {test}: {result}')
    assert result == 'arabic', f'Expected arabic for {test}, got {result}'

# Test Swahili detection
swahili_tests = ['kiswahili', 'uraia', 'maadili', 'sayansi', 'hisabati', 'jiografia']
print("\nTesting Swahili detection:")
for test in swahili_tests:
    result = detect_language(test)
    print(f'  {test}: {result}')
    assert result == 'swahili', f'Expected swahili for {test}, got {result}'

# Test English detection
english_tests = ['english', 'science', 'mathematics', 'geography', 'history']
print("\nTesting English detection:")
for test in english_tests:
    result = detect_language(test)
    print(f'  {test}: {result}')
    assert result == 'english', f'Expected english for {test}, got {result}'

print("\n✅ All language detection tests passed!")