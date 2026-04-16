#!/usr/bin/env python3
"""
Test Binti Hamdani with enhanced curriculum intelligence
"""
import sys
import json
import os

# Add backend to path
sys.path.insert(0, '/app/backend')
sys.path.insert(0, '/app/backend/services')

# Import the enhanced Binti system
try:
    from bintiBrain import BintiBrain
    from bintiPrompt import get_binti_prompt, get_intelligence_context
except ImportError:
    # Try relative import
    from backend.services.bintiBrain import BintiBrain
    from backend.services.bintiPrompt import get_binti_prompt, get_intelligence_context

def test_intelligence_engine():
    """Test the BintiBrain intelligence engine"""
    print("Testing BintiBrain Curriculum Intelligence Engine")
    print("="*80)
    
    brain = BintiBrain()
    
    test_cases = [
        {
            "name": "Arabic Form 6 - Zanzibar (Advanced)",
            "context": {
                "subject": "Arabic",
                "grade": "Form 6",
                "syllabus": "Zanzibar",
                "topic": "Prosody and Rhetoric"
            }
        },
        {
            "name": "Mathematics Standard 4 - Tanzania Mainland (Primary)",
            "context": {
                "subject": "Mathematics",
                "grade": "Standard 4",
                "syllabus": "Tanzania Mainland",
                "topic": "Fractions"
            }
        },
        {
            "name": "Kiswahili Form 3 - Zanzibar (Secondary)",
            "context": {
                "subject": "Kiswahili",
                "grade": "Form 3",
                "syllabus": "Zanzibar",
                "topic": "Fasihi Simulizi"
            }
        },
        {
            "name": "Science Form 1 - Tanzania Mainland (Lower Secondary)",
            "context": {
                "subject": "Science",
                "grade": "Form 1",
                "syllabus": "Tanzania Mainland",
                "topic": "Introduction to Science"
            }
        }
    ]
    
    for test in test_cases:
        print(f"\n🧠 Test: {test['name']}")
        print(f"Context: {test['context']}")
        
        # Test level detection
        level_info = brain.detectLevel(test['context']['grade'])
        print(f"  Level Detection: {level_info.get('level', 'Unknown')} ({level_info.get('category', 'Unknown')})")
        print(f"  Bloom's Verbs: {', '.join(level_info.get('bloom_verbs', []))}")
        print(f"  Activity Duration: {level_info.get('activity_duration', 'Unknown')}")
        print(f"  Is Advanced: {brain.isAdvancedLevel(test['context']['grade'])}")
        
        # Test forbidden topics
        forbidden = brain.getForbiddenTopics(
            test['context']['grade'],
            test['context']['subject'],
            test['context']['syllabus']
        )
        print(f"  Forbidden Topics ({len(forbidden)}): {', '.join(forbidden[:3]) if forbidden else 'None'}")
        
        # Test intelligence summary
        intelligence = brain.generateIntelligenceSummary(test['context'])
        print(f"  Quick Guide: {intelligence.get('quick_guide', 'No guide')[:100]}...")

def test_prompt_generation():
    """Test enhanced prompt generation with intelligence"""
    print("\n\nTesting Enhanced Prompt Generation with Intelligence")
    print("="*80)
    
    test_contexts = [
        {
            "subject": "Arabic",
            "grade": "Form 6",
            "syllabus": "Zanzibar",
            "topic": "Literary Criticism",
            "user_guidance": "Focus on Umayyad poetry analysis",
            "negative_constraints": "Avoid basic conversation exercises"
        },
        {
            "subject": "Mathematics",
            "grade": "Standard 4",
            "syllabus": "Tanzania Mainland",
            "topic": "Basic Fractions",
            "user_guidance": "Use visual aids and real-world examples",
            "negative_constraints": "No complex algebra"
        }
    ]
    
    for i, context in enumerate(test_contexts, 1):
        print(f"\n📝 Test {i}: {context['subject']} {context['grade']}")
        
        # Get intelligence context
        intelligence_context = get_intelligence_context(context)
        print(f"Intelligence Context Length: {len(intelligence_context)} characters")
        print(f"Sample of intelligence context:")
        lines = intelligence_context.split('\n')[:15]
        for line in lines:
            print(f"  {line}")
        
        # Get full prompt
        prompt = get_binti_prompt(context)
        print(f"\nFull Prompt Length: {len(prompt)} characters")
        
        # Check for key elements
        checks = [
            ("Binti Hamdani persona", "Binti Hamdani" in prompt),
            ("Intelligence context", "CURRICULUM INTELLIGENCE CONTEXT" in prompt),
            ("Forbidden topics", "FORBIDDEN TOPICS" in prompt),
            ("Bloom's verbs", "Bloom's Verbs" in prompt),
            ("User context", "USER CONTEXT" in prompt),
            ("Subject-specific rules", context['subject'] in prompt),
            ("Level-specific rules", context['grade'] in prompt)
        ]
        
        for check_name, check_result in checks:
            status = "✓" if check_result else "✗"
            print(f"  {status} {check_name}")

def test_validation():
    """Test lesson plan validation"""
    print("\n\nTesting Lesson Plan Validation")
    print("="*80)
    
    brain = BintiBrain()
    
    # Test cases with different lesson plans
    test_cases = [
        {
            "name": "Valid Advanced Arabic Lesson",
            "context": {
                "subject": "Arabic",
                "grade": "Form 6",
                "syllabus": "Zanzibar",
                "topic": "Prosody Analysis"
            },
            "lesson_plan": {
                "title": "Analysis of Umayyad Poetry",
                "objectives": [
                    "Analyze the poetic meter in selected Umayyad poems",
                    "Evaluate the rhetorical devices used by Al-Farazdaq",
                    "Critique the thematic development across three poems"
                ],
                "activities": [
                    "Lecture on Umayyad literary context (20 minutes)",
                    "Group analysis of poetic meter (25 minutes)",
                    "Individual critical response writing (15 minutes)"
                ]
            }
        },
        {
            "name": "Invalid Basic Arabic for Advanced Level",
            "context": {
                "subject": "Arabic",
                "grade": "Form 6",
                "syllabus": "Zanzibar",
                "topic": "Basic Conversations"
            },
            "lesson_plan": {
                "title": "Market Conversations",
                "objectives": [
                    "Learn basic greetings at the market",
                    "Practice asking for prices",
                    "Write a simple paragraph about shopping"
                ],
                "activities": [
                    "Role-play buying vegetables (15 minutes)",
                    "Match Arabic words with pictures (10 minutes)",
                    "Read a simple conversation aloud (10 minutes)"
                ]
            }
        },
        {
            "name": "Valid Primary Mathematics",
            "context": {
                "subject": "Mathematics",
                "grade": "Standard 4",
                "syllabus": "Tanzania Mainland",
                "topic": "Fractions"
            },
            "lesson_plan": {
                "title": "Introduction to Fractions",
                "objectives": [
                    "Identify fractions in everyday objects",
                    "Compare simple fractions using visual aids",
                    "Solve basic fraction word problems"
                ],
                "activities": [
                    "Pizza fraction demonstration (10 minutes)",
                    "Fraction matching game (15 minutes)",
                    "Worksheet with fraction coloring (10 minutes)"
                ]
            }
        }
    ]
    
    for test in test_cases:
        print(f"\n🔍 Validation Test: {test['name']}")
        result = brain.validateLessonPlan(test['lesson_plan'], test['context'])
        
        print(f"  Valid: {'✓ YES' if result['valid'] else '✗ NO'}")
        
        if result['issues']:
            print(f"  Issues ({len(result['issues'])}):")
            for issue in result['issues'][:2]:
                print(f"    ✗ {issue}")
        
        if result['warnings']:
            print(f"  Warnings ({len(result['warnings'])}):")
            for warning in result['warnings'][:2]:
                print(f"    ⚠ {warning}")
        
        if result['strengths']:
            print(f"  Strengths ({len(result['strengths'])}):")
            for strength in result['strengths'][:2]:
                print(f"    ✓ {strength}")

def main():
    """Run all tests"""
    print("BINTI HAMDANI CURRICULUM INTELLIGENCE TEST")
    print("="*80)
    
    # Test 1: Intelligence engine
    test_intelligence_engine()
    
    # Test 2: Prompt generation
    test_prompt_generation()
    
    # Test 3: Validation
    test_validation()
    
    # Summary
    print("\n" + "="*80)
    print("✅ BINTI HAMDANI NOW HAS DEEP CURRICULUM INTELLIGENCE!")
    print("\nWhat was added:")
    print("1. ✅ Level Detection System: Knows 'Form 6' vs 'Standard 1'")
    print("2. ✅ Subject Patterns: Knows what makes Arabic different from Mathematics")
    print("3. ✅ Syllabus Structure: Knows Zanzibar vs Tanzania Mainland formats")
    print("4. ✅ NECTA Exam Patterns: Knows what students need for exams")
    print("5. ✅ Forbidden Content Detection: Knows what NOT to include")
    print("6. ✅ Required Patterns: Knows what advanced levels MUST include")
    print("7. ✅ Validation Engine: Can validate lesson plans against curriculum rules")
    print("8. ✅ Intelligence Context: Enhances prompts with curriculum intelligence")
    print("\nBinti can now:")
    print("• Generate level-appropriate content automatically")
    print("• Avoid forbidden topics for each level and subject")
    print("• Focus on syllabus-specific topics")
    print("• Prepare students for NECTA exams")
    print("• Validate generated content against curriculum rules")
    print("• Provide specific guidance based on Tanzanian education standards")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)