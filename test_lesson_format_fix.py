#!/usr/bin/env python3
import sys
sys.path.insert(0, '/app/backend')

# Test the _build_lesson_html function
from server import _build_lesson_html

def test_zanzibar_format():
    """Test Zanzibar lesson plan includes evaluation sections"""
    print("Testing Zanzibar lesson plan format...")
    
    lesson = {
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
    
    html = _build_lesson_html(lesson)
    
    # Check for evaluation sections
    has_teacher_evaluation = "TEACHER'S EVALUATION" in html
    has_pupil_work = "PUPIL'S WORK" in html
    has_remarks = "REMARKS" in html
    
    print(f"  ✓ Zanzibar includes Teacher's Evaluation: {has_teacher_evaluation}")
    print(f"  ✓ Zanzibar includes Pupil's Work: {has_pupil_work}")
    print(f"  ✓ Zanzibar includes Remarks: {has_remarks}")
    
    return has_teacher_evaluation and has_pupil_work and has_remarks

def test_tanzania_mainland_format():
    """Test Tanzania Mainland lesson plan does NOT include evaluation sections"""
    print("\nTesting Tanzania Mainland lesson plan format...")
    
    lesson = {
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
    
    html = _build_lesson_html(lesson)
    
    # Check that evaluation sections are NOT present
    has_teacher_evaluation = "TEACHER'S EVALUATION" in html
    has_pupil_work = "PUPIL'S WORK" in html
    has_remarks_table = "REMARKS: MAELEZO</th></tr><tr><td>" in html
    
    print(f"  ✗ Tanzania Mainland should NOT have Teacher's Evaluation: {not has_teacher_evaluation}")
    print(f"  ✗ Tanzania Mainland should NOT have Pupil's Work: {not has_pupil_work}")
    print(f"  ✗ Tanzania Mainland should NOT have Remarks table: {not has_remarks_table}")
    
    # Check that the lesson ends with the realisation stage table
    ends_with_realisation = "REALISATION / UTEKELEZAJI</b></td>" in html
    print(f"  ✓ Tanzania Mainland ends with realisation stage: {ends_with_realisation}")
    
    return (not has_teacher_evaluation and not has_pupil_work and not has_remarks_table and ends_with_realisation)

def main():
    print("Testing Lesson Plan Format Fix")
    print("=" * 50)
    
    zanzibar_ok = test_zanzibar_format()
    mainland_ok = test_tanzania_mainland_format()
    
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
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)