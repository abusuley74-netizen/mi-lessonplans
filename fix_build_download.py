#!/usr/bin/env python3
import re

# Read the server.py file
with open('/app/backend/server.py', 'r') as f:
    content = f.read()

# Find the build_download_content function
# Look for the lesson section within build_download_content
# We need to find the exact pattern

# First find the build_download_content function
func_start = content.find('def build_download_content(resource_type: str, resource: dict) -> tuple:')
if func_start == -1:
    print("ERROR: Could not find build_download_content function")
    exit(1)

# Find the lesson section within this function
# Look for 'if resource_type == "lesson":' after the function start
lesson_start = content.find('    if resource_type == "lesson":', func_start)
if lesson_start == -1:
    print("ERROR: Could not find lesson section in build_download_content")
    exit(1)

# Find the end of the lesson section (next elif or return)
# Look for the next 'elif resource_type ==' or a line with just 'elif' at same indentation
lines = content[lesson_start:].split('\n')
end_line_idx = 0
for i, line in enumerate(lines[1:], 1):  # Start from line after 'if resource_type == "lesson":'
    if line.strip().startswith('elif resource_type ==') or line.strip().startswith('elif ') or line.strip().startswith('else:'):
        end_line_idx = i
        break
    # Also check for end of function (blank line with less indentation)
    if line.strip() == '' and lines[i-1].strip().startswith('return '):
        end_line_idx = i
        break

if end_line_idx == 0:
    # If we didn't find an elif, look for the end of the function
    # Find the next function definition
    next_func = content.find('\ndef ', lesson_start + 1)
    if next_func != -1:
        lesson_section = content[lesson_start:next_func]
    else:
        lesson_section = content[lesson_start:]
else:
    # Reconstruct the lesson section
    lesson_section = '\n'.join(lines[:end_line_idx])

print("Current lesson section in build_download_content:")
print(lesson_section)
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
        return pdf_bytes, "application/pdf", filename'''

# Replace the section in the content
new_content = content[:lesson_start] + new_lesson_section + content[lesson_start + len(lesson_section):]

# Write back to file
with open('/app/backend/server.py', 'w') as f:
    f.write(new_content)

print("Successfully updated build_download_content function!")
print("Lesson plans in shared links will now use proper table formatting.")

# Also need to fix the syntax error in resolve_resource function
print("\n" + "="*80)
print("Fixing syntax error in resolve_resource function...")

# Find the resolve_resource function
resolve_start = content.find('async def resolve_resource(resource_type: str, resource_id: str, teacher_id: str)')
if resolve_start != -1:
    # Read the file again since we modified it
    with open('/app/backend/server.py', 'r') as f:
        new_content = f.read()
    
    # Find the problematic line
    problem_line = '        return pdf_bytes, "application/pdf", filename    elif resource_type == "note":'
    if problem_line in new_content:
        # Fix the line
        fixed_line = '        return pdf_bytes, "application/pdf", filename"\n    elif resource_type == "note":'
        new_content = new_content.replace(problem_line, fixed_line)
        
        with open('/app/backend/server.py', 'w') as f:
            f.write(new_content)
        print("Fixed syntax error in resolve_resource function!")
    else:
        print("No syntax error found in resolve_resource function.")
else:
    print("Could not find resolve_resource function.")