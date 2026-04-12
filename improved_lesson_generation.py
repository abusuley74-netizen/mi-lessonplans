#!/usr/bin/env python3
"""
Improved lesson generation with language detection and better prompts
"""
import os
import sys
import asyncio
import httpx
import json
import re

async def test_improved_generation():
    """Test the improved lesson generation with language detection"""
    # Load environment
    env_file = "/app/backend/.env"
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
    
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    
    if not api_key:
        print("❌ DEEPSEEK_API_KEY not found")
        return False
    
    print(f"Testing with API key: {api_key[:15]}...")
    
    # Test cases with different languages
    test_cases = [
        {"subject": "Kiswahili", "grade": "Darasa la 3", "topic": "Ngeli za Kiswahili", "syllabus": "Zanzibar", "expected_lang": "swahili"},
        {"subject": "اللغة العربية", "grade": "الصف الثالث", "topic": "أنواع الجموع", "syllabus": "Zanzibar", "expected_lang": "arabic"},
        {"subject": "Mathematics", "grade": "Standard 1", "topic": "Odd Numbers", "syllabus": "Zanzibar", "expected_lang": "english"},
        {"subject": "Hisabati", "grade": "Darasa la 4", "topic": "Ushuru na Asilimia", "syllabus": "Tanzania Mainland", "expected_lang": "swahili"},
        {"subject": "Français", "grade": "Classe 5", "topic": "Les verbes", "syllabus": "Zanzibar", "expected_lang": "french"},
    ]
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }
    
    for i, test in enumerate(test_cases):
        print(f"\n{'='*60}")
        print(f"Test {i+1}: {test['subject']} - {test['topic']}")
        print(f"Expected language: {test['expected_lang']}")
        print(f"Syllabus: {test['syllabus']}")
        
        # Detect language
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
        
        detected_lang = detect_language(test['subject'])
        print(f"Detected language: {detected_lang}")
        
        # Get system prompt
        def get_system_prompt(language: str) -> str:
            prompts = {
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
            return prompts.get(language, prompts['english'])
        
        # Build prompt
        def build_prompt(syllabus: str, subject: str, grade: str, topic: str, language: str) -> str:
            if language == 'swahili':
                return f"""Tengeneza MPANGIO KAMILI WA SOMO kwa mtaala wa {"Zanzibar" if syllabus == "Zanzibar" else "Tanzania Bara"}:
- Somo: {subject}
- Darasa: {grade}
- Mada: {topic}
- Muda: dakika 45

MAELEKEZO:
1. Jaza kila sehemu kwa MAELEZO HALISI (hakuna sehemu tupu)
2. Andika MANENO HALISI ambayo mwalimu atasema
3. Toa mifano na nambari halisi
4. Jumuisha shughuli za wanafunzi kwa vitendo
5. Andika maswali halisi ya tathmini pamoja na majibu
6. Ongeza shughuli ya wanafunzi wawili wawili
7. Ongeza muhtasari wa mwisho

HARAMU:
- Hakuna "Kujazwa na mwalimu"
- Hakuna maneno ya jumla kama "Eleza dhana"
- Hakuna jedwali tupu

Toa mpangio ambao mwalimu anaweza kufundisha mara moja bila maandalizi ya ziada."""
            
            elif language == 'arabic':
                return f"""قم بإنشاء خطة درس كاملة ومفصلة لمنهج {"زنجبار" if syllabus == "Zanzibar" else "تنزانيا القارية"}:
- المادة: {subject}
- الصف: {grade}
- الموضوع: {topic}
- المدة: ٤٥ دقيقة

المتطلبات:
1. املأ كل قسم بمحتوى فعلي (بدون أقسام فارغة)
2. اكتب الحوار الفعلي الذي سيقوله المعلم
3. قدم أمثلة وأرقامًا حقيقية
4. قم بتضمين أنشطة عملية للطلاب
5. اكتب أسئلة تقييم فعلية مع الإجابات
6. أضف نشاطًا ثنائيًا للطلاب
7. أضف ملخصًا ختاميًا

ممنوع:
- لا توجد أقسام "يترك للمعلم"
- لا توجد عبارات عامة مثل "شرح المفاهيم"
- لا توجد جداول فارغة

قدم خطة درس جاهزة للتدريس الفوري دون تحضير إضافي."""
            
            elif language == 'french':
                return f"""Créez un PLAN DE LEÇON COMPLET et DÉTAILLÉ pour le programme de {"Zanzibar" if syllabus == "Zanzibar" else "Tanzanie continentale"}:
- Matière: {subject}
- Classe: {grade}
- Sujet: {topic}
- Durée: 45 minutes

EXIGENCES:
1. Remplissez chaque section avec du CONTENU RÉEL (pas de sections vides)
2. Écrivez le DIALOGUE RÉEL que l'enseignant dira
3. Fournissez des exemples et des nombres concrets
4. Incluez des activités pratiques pour les élèves
5. Écrivez de vraies questions d'évaluation avec réponses
6. Ajoutez une activité en binôme
7. Ajoutez un résumé de clôture

INTERDIT:
- Pas de sections "À remplir par l'enseignant"
- Pas de phrases génériques comme "Expliquer les concepts"
- Pas de tableaux vides

Fournissez un plan de cours prêt à être enseigné immédiatement."""
            
            else:  # English
                return f"""Create a COMPLETE, DETAILED, READY-TO-TEACH lesson plan for the {"Zanzibar" if syllabus == "Zanzibar" else "Tanzania Mainland"} syllabus:
- Subject: {subject}
- Grade: {grade}
- Topic: {topic}
- Duration: 45 minutes

REQUIREMENTS:
1. Fill EVERY section with ACTUAL content (no empty sections)
2. Write the ACTUAL DIALOGUE the teacher will say
3. Provide concrete examples and numbers
4. Include hands-on student activities
5. Write real assessment questions with answers
6. Add a pair activity for students
7. Add a closing summary

FORBIDDEN:
- No "To be filled by teacher" sections
- No generic phrases like "Explain concepts"
- No empty tables

Provide a lesson plan ready to teach immediately with zero additional preparation."""
        
        prompt = build_prompt(test['syllabus'], test['subject'], test['grade'], test['topic'], detected_lang)
        system_prompt = get_system_prompt(detected_lang)
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                print("Sending request to DeepSeek API...")
                response = await client.post(
                    "https://api.deepseek.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    message = data["choices"][0]["message"]["content"]
                    print(f"✅ Success! Generated lesson plan in {detected_lang}")
                    
                    # Check if content is detailed (not just template)
                    if len(message) > 500:
                        print(f"📝 Content length: {len(message)} characters (Good detail)")
                    else:
                        print(f"⚠️  Content length: {len(message)} characters (May be too brief)")
                    
                    # Show first 300 characters
                    preview = message[:300].replace('\n', ' ')
                    print(f"Preview: {preview}...")
                    
                    # Check for forbidden phrases
                    forbidden_phrases = ["to be filled", "kujazwa na", "يترك للمعلم", "à remplir"]
                    found_forbidden = any(phrase in message.lower() for phrase in forbidden_phrases)
                    if found_forbidden:
                        print("❌ Found forbidden placeholder phrases!")
                    else:
                        print("✅ No placeholder phrases found")
                        
                else:
                    print(f"❌ API error: {response.status_code}")
                    print(f"Response: {response.text[:200]}")
                    
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    return True

async def main():
    print("🧪 Testing Improved Lesson Generation with Language Detection")
    print("=" * 70)
    
    await test_improved_generation()
    
    print("\n" + "=" * 70)
    print("📋 Summary of Improvements:")
    print("1. ✅ Language detection based on subject name")
    print("2. ✅ Language-specific system prompts")
    print("3. ✅ Detailed, content-rich prompts (no placeholders)")
    print("4. ✅ Multiple language support: Swahili, Arabic, French, English")
    print("5. ✅ Syllabus-aware prompts (Zanzibar vs Tanzania Mainland)")
    print("\n🎯 The improved prompts will generate:")
    print("   - Actual teacher dialogue (not 'explain concepts')")
    print("   - Real examples and numbers")
    print("   - Hands-on student activities")
    print("   - Assessment questions with answers")
    print("   - Pair/group activities")
    print("   - Ready-to-teach content (no additional preparation needed)")

if __name__ == "__main__":
    asyncio.run(main())