#!/usr/bin/env python3
"""
Test that shared link downloads for lesson plans use proper table formatting
"""
import sys
sys.path.insert(0, '/app/backend')

from server import build_download_content

def test_lesson_download_uses_tables():
    """Test that lesson plan downloads use _build_lesson_html for proper tables"""
    print("Testing shared link download formatting fix...")
    print("=" * 60)
    
    # Create a sample Zanzibar lesson
    zanzibar_lesson = {
        "syllabus": "Zanzibar",
        "subject": "Mathematics",
        "grade": "Form 1",
        "topic": "Algebra",
        "content": {
            "generalOutcome": "Students will understand basic algebra",
            "mainTopic": "Algebra",
            "subTopic": "Linear equations",
            "specificOutcome": "Solve simple linear equations",
            "learningResources": "Textbook, whiteboard",
            "references": "Math textbook",
            "introductionActivities": {
                "time": "10 minutes",
                "teachingActivities": "Introduce algebra concepts",
                "learningActivities": "Listen and take notes",
                "assessment": "Oral questions"
            },
            "newKnowledgeActivities": {
                "time": "25 minutes",
                "teachingActivities": "Explain linear equations",
                "learningActivities": "Practice solving equations",
                "assessment": "Worksheet"
            },
            "teacherEvaluation": "Good lesson",
            "pupilWork": "Complete worksheet",
            "remarks": "Students engaged well"
        },
        "form_data": {
            "dayDate": "01/04/2026",
            "session": "Morning",
            "class": "Form 1",
            "periods": "2",
            "time": "80",
            "enrolledGirls": "15",
            "enrolledBoys": "15",
            "presentGirls": "14",
            "presentBoys": "14"
        }
    }
    
    # Create a sample Tanzania Mainland lesson
    mainland_lesson = {
        "syllabus": "Tanzania Mainland",
        "subject": "Mathematics",
        "grade": "Form 1",
        "topic": "Algebra",
        "content": {
            "mainCompetence": "Solve algebraic equations",
            "specificCompetence": "Solve linear equations with one variable",
            "mainActivity": "Solving equations",
            "specificActivity": "Practice problems",
            "teachingResources": "Textbook, whiteboard",
            "references": "Math textbook",
            "stages": {
                "introduction": {
                    "time": "10 minutes",
                    "teachingActivities": "Review previous lesson",
                    "learningActivities": "Answer questions",
                    "assessment": "Oral questions"
                },
                "competenceDevelopment": {
                    "time": "20 minutes",
                    "teachingActivities": "Explain solving methods",
                    "learningActivities": "Practice solving",
                    "assessment": "Worksheet"
                },
                "design": {
                    "time": "15 minutes",
                    "teachingActivities": "Guide problem design",
                    "learningActivities": "Create own problems",
                    "assessment": "Peer review"
                },
                "realisation": {
                    "time": "15 minutes",
                    "teachingActivities": "Facilitate presentations",
                    "learningActivities": "Present solutions",
                    "assessment": "Presentation evaluation"
                }
            },
            "remarks": "Good lesson"
        },
        "form_data": {
            "dayDate": "01/04/2026",
            "session": "Morning",
            "class": "Form 1",
            "periods": "2",
            "time": "80",
            "enrolledGirls": "15",
            "enrolledBoys": "15",
            "presentGirls": "14",
            "presentBoys": "14"
        }
    }
    
    print("1. Testing Zanzibar lesson download...")
    pdf_bytes, media_type, filename = build_download_content("lesson", zanzibar_lesson)
    
    # Convert bytes to string for analysis
    html_content = pdf_bytes.decode('utf-8', errors='ignore') if isinstance(pdf_bytes, bytes) else str(pdf_bytes)
    
    # Check for table elements (should be present with proper formatting)
    has_tables = "<table>" in html_content and "</table>" in html_content
    has_zanzibar_evaluation = "TEACHER'S EVALUATION" in html_content
    has_proper_header = "LESSON PLAN (ANDALIO LA SOMO)" in html_content
    
    print(f"   ✓ Returns PDF: {media_type == 'application/pdf'}")
    print(f"   ✓ Has table elements: {has_tables}")
    print(f"   ✓ Includes Zanzibar evaluation section: {has_zanzibar_evaluation}")
    print(f"   ✓ Has proper lesson plan header: {has_proper_header}")
    print(f"   ✓ Filename includes .pdf: {'.pdf' in filename}")
    
    print("\n2. Testing Tanzania Mainland lesson download...")
    pdf_bytes2, media_type2, filename2 = build_download_content("lesson", mainland_lesson)
    
    html_content2 = pdf_bytes2.decode('utf-8', errors='ignore') if isinstance(pdf_bytes2, bytes) else str(pdf_bytes2)
    
    # Check for table elements
    has_tables2 = "<table>" in html_content2 and "</table>" in html_content2
    has_mainland_stages = "REALISATION / UTEKELEZAJI" in html_content2
    has_no_zanzibar_eval = "TEACHER'S EVALUATION" not in html_content2
    
    print(f"   ✓ Returns PDF: {media_type2 == 'application/pdf'}")
    print(f"   ✓ Has table elements: {has_tables2}")
    print(f"   ✓ Includes Mainland realisation stage: {has_mainland_stages}")
    print(f"   ✓ Does NOT include Zanzibar evaluation: {has_no_zanzibar_eval}")
    print(f"   ✓ Filename includes .pdf: {'.pdf' in filename2}")
    
    print("\n" + "=" * 60)
    print("RESULTS:")
    
    zanzibar_pass = (media_type == "application/pdf" and has_tables and 
                     has_zanzibar_evaluation and has_proper_header)
    mainland_pass = (media_type2 == "application/pdf" and has_tables2 and 
                     has_mainland_stages and has_no_zanzibar_eval)
    
    print(f"Zanzibar format: {'✓ PASS' if zanzibar_pass else '✗ FAIL'}")
    print(f"Tanzania Mainland format: {'✓ PASS' if mainland_pass else '✗ FAIL'}")
    
    if zanzibar_pass and mainland_pass:
        print("\n✅ SUCCESS: Shared link downloads now use proper table formatting!")
        print("- Both Zanzibar and Tanzania Mainland lesson plans include tables")
        print("- Zanzibar includes Teacher's Evaluation section")
        print("- Tanzania Mainland includes all 4 stages (no Zanzibar evaluation)")
        print("- The fix has been applied successfully")
        return True
    else:
        print("\n❌ FAILED: Shared link download test failed")
        return False

if __name__ == "__main__":
    success = test_lesson_download_uses_tables()
    sys.exit(0 if success else 1)