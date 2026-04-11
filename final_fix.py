#!/usr/bin/env python3
import re

# Read the server.py file
with open('/app/backend/server.py', 'r') as f:
    content = f.read()

# Find the build_download_content function
func_start = content.find('def build_download_content(resource_type: str, resource: dict) -> tuple:')
if func_start == -1:
    print("ERROR: Could not find build_download_content function")
    exit(1)

# Find the lesson section start
lesson_start = content.find('    if resource_type == "lesson":', func_start)
if lesson_start == -1:
    print("ERROR: Could not find lesson section in build_download_content")
    exit(1)

# Find the note section start (to know where lesson section ends)
note_start = content.find('    elif resource_type == "note":', lesson_start)
if note_start == -1:
    print("ERROR: Could not find note section after lesson section")
    exit(1)

# Extract the entire lesson section
lesson_section = content[lesson_start:note_start]

print("Current lesson section (first 500 chars):")
print(lesson_section[:500])
print("\n" + "="*80 + "\n")

# Create the new lesson section
new_lesson_section = '''    if resource_type == "lesson":
        # Use the same _build_lesson_html function that export_lesson_txt uses
        # This ensures proper table formatting for both Zanzibar and Tanzania Mainland
        html = _build_lesson_html(resource, for_word=False)
        subject = resource.get("subject", "")
        topic = resource.get("topic", "")
        filename = f"{subject.replace(' ', '_')}_{topic.replace(' ', '_')}_lesson.pdf"
        pdf_bytes = _html_to_pdf(html)
        return pdf_bytes, "application/pdf", filename
'''

# Replace the lesson section
new_content = content[:lesson_start] + new_lesson_section + content[note_start:]

# Write back to file
with open('/app/backend/server.py', 'w') as f:
    f.write(new_content)

print("Successfully updated build_download_content function!")
print("Lesson plans in shared links will now use proper table formatting.")

# Verify the fix
print("\n" + "="*80)
print("Verifying the fix...")

# Check that the new content is valid
with open('/app/backend/server.py', 'r') as f:
    new_content = f.read()
    
# Check for syntax errors by trying to import
import sys
import os
sys.path.insert(0, '/app/backend')

try:
    # Try to import the module to check for syntax errors
    import importlib
    importlib.invalidate_caches()
    spec = importlib.util.spec_from_file_location("server", "/app/backend/server.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    print("✅ No syntax errors found in server.py")
    
    # Check that build_download_content exists
    if hasattr(module, 'build_download_content'):
        print("✅ build_download_content function exists")
    else:
        print("❌ build_download_content function not found")
        
except SyntaxError as e:
    print(f"❌ Syntax error in server.py: {e}")
    print(f"   Line {e.lineno}: {e.text}")
except Exception as e:
    print(f"❌ Error importing server.py: {e}")