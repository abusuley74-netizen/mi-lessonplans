#!/usr/bin/env python3
import re

def test_html_content():
    """Simple test to check if the fix is working by examining the server.py file"""
    
    print("Testing lesson plan format fix...")
    print("=" * 50)
    
    # Read the server.py file
    with open('/app/backend/server.py', 'r') as f:
        content = f.read()
    
    # Find the _build_lesson_html function
    start = content.find('def _build_lesson_html')
    if start == -1:
        print("ERROR: Could not find _build_lesson_html function")
        return False
    
    # Extract a reasonable portion of the function
    end = content.find('\ndef ', start + 100)
    if end == -1:
        end = start + 5000
    
    func_content = content[start:end]
    
    print("Analyzing the _build_lesson_html function...")
    
    # Check if eval_table is defined inside Zanzibar block
    eval_in_zanzibar = "if syllabus == \"Zanzibar\":\n        eval_table = f\"\"\"" in func_content
    print(f"✓ eval_table defined inside Zanzibar block: {eval_in_zanzibar}")
    
    # Check if Tanzania Mainland includes eval_table
    mainland_has_eval = "else:\n        stages = content.get(\"stages\"" in func_content
    if mainland_has_eval:
        # Find the Tanzania Mainland body section
        mainland_start = func_content.find("else:\n        stages = content.get(\"stages\"")
        mainland_end = func_content.find("word_ns = '", mainland_start)
        if mainland_end == -1:
            mainland_end = mainland_start + 2000
        
        mainland_section = func_content[mainland_start:mainland_end]
        
        # Check if eval_table is included in Tanzania Mainland
        mainland_includes_eval = "{eval_table}" in mainland_section
        print(f"✗ Tanzania Mainland includes eval_table: {mainland_includes_eval}")
        
        # Check that Tanzania Mainland ends with realisation stage table
        ends_with_realisation = "REALISATION / UTEKELEZAJI</b></td>" in mainland_section
        print(f"✓ Tanzania Mainland ends with realisation stage: {ends_with_realisation}")
        
        mainland_ok = not mainland_includes_eval and ends_with_realisation
    else:
        print("✗ Could not find Tanzania Mainland section")
        mainland_ok = False
    
    # Check Zanzibar includes eval_table
    zanzibar_start = func_content.find("if syllabus == \"Zanzibar\":")
    zanzibar_end = func_content.find("else:", zanzibar_start)
    if zanzibar_end == -1:
        zanzibar_end = zanzibar_start + 2000
    
    zanzibar_section = func_content[zanzibar_start:zanzibar_end]
    zanzibar_includes_eval = "{eval_table}" in zanzibar_section
    print(f"✓ Zanzibar includes eval_table: {zanzibar_includes_eval}")
    
    zanzibar_ok = zanzibar_includes_eval
    
    print("\n" + "=" * 50)
    print("RESULTS:")
    print(f"Zanzibar format: {'✓ PASS' if zanzibar_ok else '✗ FAIL'}")
    print(f"Tanzania Mainland format: {'✓ PASS' if mainland_ok else '✗ FAIL'}")
    
    if zanzibar_ok and mainland_ok:
        print("\n✅ SUCCESS: Lesson plan formats are now correct!")
        print("- Zanzibar lesson plans include Teacher's Evaluation, Pupil's Work, and Remarks")
        print("- Tanzania Mainland lesson plans do NOT include these sections")
        print("- The fix has been applied successfully")
        return True
    else:
        print("\n❌ FAILED: Lesson plan format test failed")
        print("\nChecking the actual fix in the code...")
        
        # Show the key parts of the fix
        print("\nKey fix verification:")
        
        # Check that eval_table is only in Zanzibar
        if "eval_table = f\"\"\"<table><tr><th>TEACHER'S EVALUATION:" in func_content:
            print("1. eval_table definition found")
            
            # Check if it's inside the Zanzibar block
            lines = func_content.split('\n')
            eval_line = -1
            for i, line in enumerate(lines):
                if "eval_table = f\"\"\"<table><tr><th>TEACHER'S EVALUATION:" in line:
                    eval_line = i
                    break
            
            if eval_line > 0:
                # Check the line before to see if it's in Zanzibar block
                if eval_line > 1 and "if syllabus == \"Zanzibar\":" in lines[eval_line-2]:
                    print("2. eval_table is correctly inside Zanzibar block ✓")
                else:
                    print("2. eval_table is NOT inside Zanzibar block ✗")
        
        return False

if __name__ == "__main__":
    success = test_html_content()
    exit(0 if success else 1)