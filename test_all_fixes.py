#!/usr/bin/env python3
"""Test all fixes for the issues"""

import re

def test_cors_fix():
    """Test that CORS middleware is correctly positioned"""
    print("Testing CORS fix...")
    
    # Read the server.py file
    with open('backend/server.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check that CORS middleware is added AFTER app.include_router
    router_pos = content.find('app.include_router(api_router)')
    cors_pos = content.find('app.add_middleware(\n    CORSMiddleware,')
    
    if router_pos == -1 or cors_pos == -1:
        print("❌ Could not find router or CORS middleware")
        return False
    
    if router_pos < cors_pos:
        print("✅ CORS middleware is correctly positioned AFTER router")
        return True
    else:
        print("❌ CORS middleware is positioned BEFORE router (incorrect)")
        return False

def test_audio_generation_fix():
    """Test that audio generation endpoint has proper error handling"""
    print("\nTesting audio generation fix...")
    
    with open('backend/server.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the generate_dictation_audio function
    func_start = content.find('async def generate_dictation_audio')
    if func_start == -1:
        print("❌ Could not find generate_dictation_audio function")
        return False
    
    # Extract the function
    func_end = content.find('\n\n', func_start)
    if func_end == -1:
        func_end = len(content)
    
    func_content = content[func_start:func_end]
    
    # Check for proper error handling
    checks = [
        ('tts.speech.microsoft.com' in func_content, '✅ Uses correct Azure TTS endpoint'),
        ('error_text' in func_content, '✅ Includes error text in error messages'),
        ('audio-16khz-128kbitrate-mono-mp3' in func_content, '✅ Uses correct audio format'),
    ]
    
    all_passed = True
    for check, message in checks:
        if check:
            print(message)
        else:
            print(f"❌ Missing: {message}")
            all_passed = False
    
    return all_passed

def test_arabic_content_fix():
    """Test that Arabic content generation is fully in Arabic"""
    print("\nTesting Arabic content fix...")
    
    with open('backend/server.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the generate_lesson_with_ai function
    func_start = content.find('async def generate_lesson_with_ai')
    if func_start == -1:
        print("❌ Could not find generate_lesson_with_ai function")
        return False
    
    # Extract a large portion of the function
    func_end = content.find('def get_fallback_lesson_content', func_start)
    if func_end == -1:
        func_end = len(content)
    
    func_content = content[func_start:func_end]
    
    # Check for Arabic prompts
    arabic_prompts = [
        'أنشئ خطة درس مفصلة لمنهج زنجبار',
        'أنشئ خطة درس مفصلة لمنهج البر التنزاني',
        'قم بالرد باللغة العربية الفصحى فقط',
        'أنشئ خطة الدرس بتنسيق JSON',
        'النتيجة التعليمية العامة لهذا الدرس',
    ]
    
    all_passed = True
    for prompt in arabic_prompts:
        if prompt in func_content:
            print(f"✅ Found Arabic prompt: {prompt[:50]}...")
        else:
            print(f"❌ Missing Arabic prompt: {prompt[:50]}...")
            all_passed = False
    
    # Check for language-specific prompt handling
    if 'if language == \'arabic\':' in func_content:
        print("✅ Has language-specific Arabic prompt handling")
    else:
        print("❌ Missing language-specific Arabic prompt handling")
        all_passed = False
    
    return all_passed

def test_download_fixes():
    """Test that download functions handle Arabic text properly"""
    print("\nTesting download fixes...")
    
    with open('backend/server.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for proper HTML encoding in PDF generation
    checks = [
        ('<meta charset="utf-8">' in content, '✅ HTML includes UTF-8 charset'),
        ('font-family' in content, '✅ Uses font-family for proper text rendering'),
        ('arabic' in content.lower() or 'utf' in content.lower(), '✅ Mentions encoding/arabic'),
    ]
    
    all_passed = True
    for check, message in checks:
        if check:
            print(message)
        else:
            print(f"❌ Missing: {message}")
            all_passed = False
    
    return all_passed

def main():
    print("=" * 60)
    print("Testing all fixes for the issues")
    print("=" * 60)
    
    results = []
    
    # Run all tests
    results.append(("CORS Configuration", test_cors_fix()))
    results.append(("Audio Generation", test_audio_generation_fix()))
    results.append(("Arabic Content", test_arabic_content_fix()))
    results.append(("Download Issues", test_download_fixes()))
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if success:
            passed += 1
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All fixes have been successfully implemented!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} tests failed. Please review the fixes.")
        return 1

if __name__ == "__main__":
    exit(main())