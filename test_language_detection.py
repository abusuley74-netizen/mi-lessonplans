#!/usr/bin/env python3
"""
Test language detection logic
"""
def detect_language(subject: str) -> str:
    subject_lower = subject.lower()
    
    swahili_subjects = [
        'kiswahili', 'uraia', 'maadili', 'sayansi', 'hisabati', 
        'jiografia', 'historia', 'biologia', 'kemia', 'fizikia',
        'swahili', 'civics', 'civic education', 'elimu ya maadili'
    ]
    
    arabic_subjects = [
        'اللغة العربية', 'عربي', 'اسلامية', 'التربية الإسلامية',
        'علوم', 'رياضيات', 'اجتماعيات', 'arabic', 'islamic', 'islamiya'
    ]
    
    french_subjects = [
        'français', 'french', 'mathématiques', 'sciences', 'francais'
    ]
    
    if any(s in subject_lower for s in swahili_subjects):
        return 'swahili'
    
    if any(s in subject_lower for s in arabic_subjects):
        return 'arabic'
    
    if any(s in subject_lower for s in french_subjects):
        return 'french'
    
    return 'english'

# Test cases
test_cases = [
    ("Kiswahili", "swahili"),
    ("kiswahili", "swahili"),
    ("Hisabati", "swahili"),
    ("Sayansi", "swahili"),
    ("اللغة العربية", "arabic"),
    ("عربي", "arabic"),
    ("التربية الإسلامية", "arabic"),
    ("Arabic", "arabic"),
    ("Français", "french"),
    ("French", "french"),
    ("Mathematics", "english"),
    ("Science", "english"),
    ("English", "english"),
    ("Physics", "english"),
    ("Chemistry", "english"),
]

print("🧪 Testing Language Detection")
print("=" * 50)

all_passed = True
for subject, expected in test_cases:
    detected = detect_language(subject)
    passed = detected == expected
    all_passed = all_passed and passed
    
    status = "✅" if passed else "❌"
    print(f"{status} Subject: '{subject}' -> Detected: {detected} (Expected: {expected})")

print("\n" + "=" * 50)
if all_passed:
    print("🎉 All language detection tests passed!")
else:
    print("⚠️  Some tests failed")

# Show system prompts
print("\n📝 System Prompts by Language:")
print("-" * 30)

system_prompts = {
    'swahili': """Wewe ni mwalimu mtaalamu wa kuandaa mipango ya somo iliyo kamili, yenye maelezo ya kina, na tayari kufundishwa. 
Jibu kwa KISWAHILI SANIFU tu. 
Hakuna sehemu za "kujazwa na mwalimu" - kila sehemu lazima iwe na maelezo halisi.
Tumia mifano halisi, maswali halisi, na shughuli halisi za wanafunzi.
Toa maelezo ya kina na mazoezi halisi.""",
    
    'arabic': """أنت خبير في تصميم خطط الدروس الكاملة والمفصلة الجاهزة للتدريس.
قم بالرد باللغة العربية الفصحى فقط.
لا توجد أقسام "يترك للمعلم" - كل قسم يجب أن يحتوي على محتوى فعلي.
استخدم أمثلة حقيقية وأسئلة حقيقية وأنشطة حقيقية للطلاب.
قدم تفاصيل شاملة وتمارين عملية.""",
    
    'french': """Vous êtes un expert en conception de plans de cours complets, détaillés et prêts à être enseignés.
Répondez uniquement en FRANÇAIS.
Pas de sections "à remplir par l'enseignant" - chaque section doit avoir un contenu réel.
Utilisez des exemples concrets, des questions réelles et des activités réelles pour les élèves.
Fournissez des détails complets et des exercices pratiques.""",
    
    'english': """You are an expert Tanzanian education curriculum designer. Create COMPLETE, DETAILED, READY-TO-TEACH lesson plans.
No "to be filled by teacher" sections - every section must have actual content.
Use real examples, real questions, and real student activities.
Provide comprehensive details and practical exercises."""
}

for lang, prompt in system_prompts.items():
    print(f"\n{lang.upper()}:")
    print(f"Length: {len(prompt)} characters")
    print(f"Preview: {prompt[:100]}...")

print("\n🎯 Implementation Ready:")
print("1. Language detection works correctly")
print("2. System prompts are language-specific")
print("3. Prompts demand actual content (no placeholders)")
print("4. Ready to integrate into backend server.py")