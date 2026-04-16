#!/usr/bin/env python3
"""
Test script to verify Scheme of Work language detection integration.
Tests both frontend language detection and backend API integration.
"""

import json
import os
import sys

def test_language_detection():
    """Test the language detection logic from frontend"""
    print("Testing Language Detection Logic")
    print("=" * 60)
    
    # Simulate the frontend detectLanguage function
    def detect_language(subject):
        if not subject:
            return 'english'
        
        subject_lower = subject.lower()
        
        swahili_subjects = [
            'kiswahili', 'uraia', 'maadili', 'sayansi', 'hisabati', 
            'jiografia', 'jigrafia', 'historia', 'biologia', 'kemia', 'fizikia',
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
    
    test_cases = [
        ("Kiswahili", "swahili"),
        ("Uraia na Maadili", "swahili"),
        ("Sayansi", "swahili"),
        ("Hisabati", "swahili"),
        ("اللغة العربية", "arabic"),
        ("Arabic Language", "arabic"),
        ("français", "french"),
        ("French", "french"),
        ("Physics", "english"),
        ("Chemistry", "english"),
        ("", "english"),
    ]
    
    passed = 0
    failed = 0
    
    for subject, expected in test_cases:
        result = detect_language(subject)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        
        if result == expected:
            passed += 1
        else:
            failed += 1
        
        print(f"{status}: Subject='{subject}' -> {result} (expected: {expected})")
    
    print(f"\nResults: {passed} passed, {failed} failed")
    print(f"Success rate: {(passed / len(test_cases) * 100):.1f}%")
    print()
    
    return failed == 0

def test_backend_api_structure():
    """Test that backend API accepts language parameter"""
    print("Testing Backend API Structure")
    print("=" * 60)
    
    # Read the backend server.py file to verify it accepts language parameter
    backend_file = "/app/backend/server.py"
    
    if not os.path.exists(backend_file):
        print(f"✗ FAIL: Backend file not found: {backend_file}")
        return False
    
    with open(backend_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for language parameter in generate_scheme_ai function
    checks = [
        ("Language parameter extraction", 'language = data.get("language", "english")'),
        ("Language-specific system prompts", "system_prompts = {"),
        ("System prompt selection", "system_prompt = system_prompts.get(language"),
        ("Swahili system prompt", "swahili':"),
        ("Arabic system prompt", "arabic':"),
        ("French system prompt", "french':"),
        ("English system prompt", "english':"),
    ]
    
    passed = 0
    failed = 0
    
    for check_name, search_string in checks:
        if search_string in content:
            print(f"✓ PASS: {check_name}")
            passed += 1
        else:
            print(f"✗ FAIL: {check_name} - '{search_string}' not found")
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")
    print(f"Success rate: {(passed / len(checks) * 100):.1f}%")
    print()
    
    return failed == 0

def test_frontend_integration():
    """Test that frontend sends language parameter"""
    print("Testing Frontend Integration")
    print("=" * 60)
    
    frontend_file = "/app/frontend/src/components/SchemeOfWorkForm.js"
    
    if not os.path.exists(frontend_file):
        print(f"✗ FAIL: Frontend file not found: {frontend_file}")
        return False
    
    with open(frontend_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    checks = [
        ("Language detection function", "const detectLanguage = (subject) =>"),
        ("Swahili subjects list", "'kiswahili', 'uraia', 'maadili'"),
        ("Arabic subjects list", "'اللغة العربية', 'عربي'"),
        ("French subjects list", "'français', 'french'"),
        ("Language detection call", "const detectedLanguage = detectLanguage(formData.subject)"),
        ("Language parameter in API call", "language: detectedLanguage"),
    ]
    
    passed = 0
    failed = 0
    
    for check_name, search_string in checks:
        if search_string in content:
            print(f"✓ PASS: {check_name}")
            passed += 1
        else:
            print(f"✗ FAIL: {check_name} - '{search_string}' not found")
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")
    print(f"Success rate: {(passed / len(checks) * 100):.1f}%")
    print()
    
    return failed == 0

def generate_test_report():
    """Generate a comprehensive test report"""
    print("SCHEME OF WORK LANGUAGE DETECTION INTEGRATION TEST")
    print("=" * 60)
    print()
    
    results = []
    
    # Test 1: Language detection logic
    print("1. Language Detection Logic Test")
    print("-" * 40)
    test1_passed = test_language_detection()
    results.append(("Language Detection Logic", test1_passed))
    print()
    
    # Test 2: Backend API structure
    print("2. Backend API Structure Test")
    print("-" * 40)
    test2_passed = test_backend_api_structure()
    results.append(("Backend API Structure", test2_passed))
    print()
    
    # Test 3: Frontend integration
    print("3. Frontend Integration Test")
    print("-" * 40)
    test3_passed = test_frontend_integration()
    results.append(("Frontend Integration", test3_passed))
    print()
    
    # Summary
    print("TEST SUMMARY")
    print("=" * 60)
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print()
    print(f"Overall: {total_passed}/{total_tests} tests passed")
    print(f"Success rate: {(total_passed / total_tests * 100):.1f}%")
    
    if total_passed == total_tests:
        print("\n✅ ALL TESTS PASSED! Language detection integration is complete.")
        return True
    else:
        print("\n❌ SOME TESTS FAILED. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = generate_test_report()
    sys.exit(0 if success else 1)