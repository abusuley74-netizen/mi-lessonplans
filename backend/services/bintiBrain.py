"""
Binti Hamdani Intelligence Engine (Python Version)
This gives Binti deep curriculum expertise for Tanzanian education
"""

import json
import os

class BintiBrain:
    def __init__(self):
        # Load the knowledge base
        self.knowledge = self._load_knowledge_base()
    
    def _load_knowledge_base(self):
        """Load the curriculum knowledge base"""
        # Since the knowledge base is in JavaScript format,
        # we'll create a Python dictionary with the same structure
        return {
            "LEVEL_MATRIX": {
                # PRIMARY SCHOOL (Standard 1-7)
                "standard 1": {
                    "category": "early_primary",
                    "bloom_verbs": ["identify", "name", "point to", "match", "color", "trace", "repeat", "recognize"],
                    "activity_duration": "5-10 minutes",
                    "teaching_methods": ["play-based", "singing", "games", "storytelling", "drawing"],
                    "assessment": ["observation", "oral response", "drawing", "matching"],
                    "forbidden": ["essays", "critical analysis", "independent research", "abstract concepts"]
                },
                "standard 2": {
                    "category": "early_primary",
                    "bloom_verbs": ["identify", "name", "describe", "list", "order", "compare", "sort"],
                    "activity_duration": "10-15 minutes",
                    "teaching_methods": ["guided discovery", "pair work", "hands-on", "visual aids"],
                    "assessment": ["oral questions", "picture labeling", "simple written answers"],
                    "forbidden": ["essays", "critical analysis", "research projects"]
                },
                "standard 3": {
                    "category": "mid_primary",
                    "bloom_verbs": ["describe", "explain", "summarize", "classify", "organize", "demonstrate"],
                    "activity_duration": "15-20 minutes",
                    "teaching_methods": ["group work", "demonstration", "inquiry-based", "role play simple"],
                    "assessment": ["short answer", "matching", "fill blanks", "oral presentation"],
                    "forbidden": ["complex essays", "formal debates", "statistical analysis"]
                },
                "standard 4": {
                    "category": "mid_primary",
                    "bloom_verbs": ["explain", "summarize", "classify", "compare", "differentiate", "solve"],
                    "activity_duration": "15-20 minutes",
                    "teaching_methods": ["collaborative learning", "experiments", "projects simple"],
                    "assessment": ["short paragraph", "multiple choice", "problem solving"],
                    "forbidden": ["long essays", "independent thesis", "advanced grammar"]
                },
                "standard 5": {
                    "category": "upper_primary",
                    "bloom_verbs": ["apply", "analyze", "differentiate", "construct", "investigate", "organize"],
                    "activity_duration": "20-25 minutes",
                    "teaching_methods": ["project-based", "peer teaching", "debates simple", "research basic"],
                    "assessment": ["paragraph writing", "simple reports", "presentations"],
                    "forbidden": ["complex citations", "abstract theories"]
                },
                "standard 6": {
                    "category": "upper_primary",
                    "bloom_verbs": ["apply", "analyze", "evaluate", "justify", "critique simple", "design"],
                    "activity_duration": "20-25 minutes",
                    "teaching_methods": ["inquiry-based", "case studies simple", "group investigation"],
                    "assessment": ["essays basic", "projects", "quizzes", "peer assessment"],
                    "forbidden": ["dissertation-level", "advanced statistics"]
                },
                "standard 7": {
                    "category": "upper_primary",
                    "bloom_verbs": ["analyze", "evaluate", "create", "design", "justify", "critique"],
                    "activity_duration": "25-30 minutes",
                    "teaching_methods": ["student-led", "research projects", "presentations", "debates"],
                    "assessment": ["essays", "reports", "oral exams", "portfolio"],
                    "forbidden": ["university-level theory"]
                },

                # SECONDARY SCHOOL (Form 1-4)
                "form 1": {
                    "category": "lower_secondary",
                    "bloom_verbs": ["apply", "analyze", "differentiate", "construct", "demonstrate", "solve"],
                    "activity_duration": "25-30 minutes",
                    "teaching_methods": ["inquiry-based", "cooperative learning", "demonstration", "guided practice"],
                    "assessment": ["short essays", "problem sets", "lab reports basic", "presentations"],
                    "forbidden": ["advanced literary criticism", "complex statistical analysis"]
                },
                "form 2": {
                    "category": "lower_secondary",
                    "bloom_verbs": ["apply", "analyze", "evaluate", "justify", "compare complex", "synthesize basic"],
                    "activity_duration": "30-35 minutes",
                    "teaching_methods": ["project-based", "case studies", "peer tutoring", "discussion"],
                    "assessment": ["essays", "lab reports", "research basic", "oral defense"],
                    "forbidden": ["thesis-level", "post-modern theory"]
                },
                "form 3": {
                    "category": "upper_secondary",
                    "bloom_verbs": ["analyze", "evaluate", "create", "justify", "critique", "synthesize"],
                    "activity_duration": "35-40 minutes",
                    "teaching_methods": ["seminar-style", "independent research", "debates advanced", "problem-based"],
                    "assessment": ["analytical essays", "research papers", "exams prep", "portfolio"],
                    "forbidden": ["PhD-level abstraction"]
                },
                "form 4": {
                    "category": "upper_secondary",
                    "bloom_verbs": ["evaluate", "create", "critique", "defend", "synthesize advanced", "theorize basic"],
                    "activity_duration": "35-40 minutes",
                    "teaching_methods": ["student-led seminars", "mock exams", "research projects", "peer review"],
                    "assessment": ["mock NECTA", "research papers", "presentations", "portfolios"],
                    "forbidden": ["university-level specialization"]
                },

                # ADVANCED LEVEL (Form 5-6)
                "form 5": {
                    "category": "advanced_preuniversity",
                    "bloom_verbs": ["critique", "evaluate", "synthesize advanced", "theorize", "deconstruct", "propose"],
                    "activity_duration": "40-45 minutes",
                    "teaching_methods": ["lecture-discussion", "independent study", "research intensive", "academic writing"],
                    "assessment": ["essays", "research proposals", "critical reviews", "presentations academic"],
                    "forbidden": ["basic conversations", "simple paragraphs", "rote memorization"]
                },
                "form 6": {
                    "category": "advanced_preuniversity",
                    "bloom_verbs": ["deconstruct", "evaluate critically", "synthesize across disciplines", "theorize advanced", "publish ready"],
                    "activity_duration": "45-50 minutes",
                    "teaching_methods": ["seminar", "tutorial", "independent thesis", "peer review academic"],
                    "assessment": ["dissertation chapters", "academic papers", "conference presentations", "comprehensive exams"],
                    "forbidden": ["high school level content", "basic skills"]
                }
            },
            
            "BINTI_QUICK_RULES": {
                "forbidden_for_advanced": [
                    "Basic conversation at the market",
                    "Personal letter writing", 
                    "Simple paragraph about my family",
                    "Role-play greetings",
                    "Read the text aloud as main activity",
                    "Match the words with pictures",
                    "Color the correct answer",
                    "Basic vocabulary list of 10 words"
                ],
                "required_for_advanced": [
                    "Analyze the rhetorical devices in...",
                    "Critique the author's argument using...",
                    "Evaluate the effectiveness of...",
                    "Compare and contrast the literary styles of...",
                    "Scan the poetic meter of...",
                    "Differentiate between the literary schools of...",
                    "Justify your interpretation using textual evidence",
                    "Synthesize information from multiple sources"
                ]
            }
        }
    
    def detectLevel(self, className):
        """Detect the educational level from a class name"""
        if not className:
            return { 
                "category": "unknown", 
                "bloom_verbs": ["learn", "understand"],
                "activity_duration": "30 minutes",
                "teaching_methods": ["general instruction"],
                "assessment": ["general assessment"],
                "forbidden": []
            }

        lower = className.lower().strip()
        
        # Check for exact matches first
        for level, data in self.knowledge["LEVEL_MATRIX"].items():
            if lower == level or lower in level:
                result = data.copy()
                result["level"] = level
                return result

        # Check for partial matches
        for level, data in self.knowledge["LEVEL_MATRIX"].items():
            level_parts = level.split(' ')
            if any(part in lower for part in level_parts):
                result = data.copy()
                result["level"] = level
                return result

        # Default for unknown levels
        if "form" in lower:
            return {
                "level": "form_generic",
                "category": "secondary",
                "bloom_verbs": ["apply", "analyze", "evaluate"],
                "activity_duration": "35-40 minutes",
                "teaching_methods": ["inquiry-based", "discussion", "practice"],
                "assessment": ["essays", "tests", "projects"],
                "forbidden": ["basic conversations", "simple matching"]
            }
        elif "standard" in lower:
            return {
                "level": "standard_generic",
                "category": "primary",
                "bloom_verbs": ["identify", "describe", "explain"],
                "activity_duration": "20-25 minutes",
                "teaching_methods": ["guided practice", "group work", "hands-on"],
                "assessment": ["oral questions", "worksheets", "observations"],
                "forbidden": ["complex analysis", "advanced theory"]
            }

        return { 
            "category": "unknown", 
            "bloom_verbs": ["learn", "understand"],
            "activity_duration": "30 minutes",
            "teaching_methods": ["general instruction"],
            "assessment": ["general assessment"],
            "forbidden": []
        }
    
    def isAdvancedLevel(self, className):
        """Check if level is advanced (Form 5-6)"""
        if not className:
            return False
        lower = className.lower()
        return "form 5" in lower or "form 6" in lower
    
    def getForbiddenTopics(self, className, subject, syllabus):
        """Get forbidden topics for a specific level, subject, and syllabus"""
        isAdvanced = self.isAdvancedLevel(className)
        subject_lower = subject.lower() if subject else ""
        
        # Advanced level forbidden topics
        if isAdvanced:
            advanced_forbidden = list(self.knowledge["BINTI_QUICK_RULES"]["forbidden_for_advanced"])
            
            # Special rules for Arabic in Zanzibar at advanced level
            if subject_lower == "arabic" and syllabus == "Zanzibar":
                # Add Arabic-specific forbidden topics
                arabic_forbidden = [
                    "Basic conversations at market",
                    "Personal letters",
                    "Simple paragraph writing",
                    "Role-play daily situations",
                    "Read aloud only"
                ]
                advanced_forbidden.extend(arabic_forbidden)
            
            return advanced_forbidden

        # Level-specific forbidden topics
        level_info = self.detectLevel(className)
        return level_info.get("forbidden", [])
    
    def getRequiredVerbs(self, className):
        """Get required Bloom's taxonomy verbs for a level"""
        level_info = self.detectLevel(className)
        return level_info.get("bloom_verbs", ["understand", "know"])
    
    def getTeachingMethods(self, className):
        """Get teaching methods for a level"""
        level_info = self.detectLevel(className)
        return level_info.get("teaching_methods", ["direct instruction", "guided practice"])
    
    def getAssessmentMethods(self, className):
        """Get assessment methods for a level"""
        level_info = self.detectLevel(className)
        return level_info.get("assessment", ["written test", "oral questions"])
    
    def getActivityDuration(self, className):
        """Get activity duration for a level"""
        level_info = self.detectLevel(className)
        return level_info.get("activity_duration", "30 minutes")
    
    def generateIntelligenceSummary(self, context):
        """Generate a curriculum intelligence summary for a teaching context"""
        subject = context.get("subject", "")
        grade = context.get("grade", "")
        syllabus = context.get("syllabus", "")
        topic = context.get("topic", "")
        
        level_info = self.detectLevel(grade)
        isAdvanced = self.isAdvancedLevel(grade)
        forbidden_topics = self.getForbiddenTopics(grade, subject, syllabus)
        required_verbs = self.getRequiredVerbs(grade)
        
        # Create quick guide based on subject and level
        if subject.lower() == "arabic" and grade.lower() == "form 6" and syllabus == "Zanzibar":
            quick_guide = "FORBID basic convos. REQUIRE prosody (العروض), rhetoric (البلاغة), literary ages, criticism"
        elif subject.lower() == "mathematics" and self.isAdvancedLevel(grade):
            quick_guide = "Calculus, Algebra, Geometry, Statistics - problem solving focus"
        elif subject.lower() == "english" and self.isAdvancedLevel(grade):
            quick_guide = "Literary criticism, advanced grammar, essay writing, research skills"
        elif subject.lower() == "kiswahili" and self.isAdvancedLevel(grade):
            quick_guide = "Fasihi (simulizi na andishi), uhakiki, isimu, tamthilia"
        elif subject.lower() == "science" and ("form 3" in grade.lower() or "form 4" in grade.lower()):
            quick_guide = "Cells, human body, plants, ecology, simple chemistry, physics basics"
        else:
            quick_guide = f"Teach {subject} at {grade} level following {syllabus} syllabus"
        
        return {
            "level": {
                "name": grade,
                "category": level_info.get("category", "unknown"),
                "isAdvanced": isAdvanced,
                "bloom_verbs": level_info.get("bloom_verbs", []),
                "activity_duration": level_info.get("activity_duration", "30 minutes"),
                "teaching_methods": level_info.get("teaching_methods", []),
                "assessment_methods": level_info.get("assessment", [])
            },
            "subject": {
                "name": subject,
                "language_of_instruction": "Arabic" if subject.lower() == "arabic" else "English/Kiswahili",
                "required_skills": ["General subject skills"],
                "required_structures": ["Standard lesson structure"]
            },
            "syllabus": {
                "type": syllabus,
                "focus_topics": [f"{subject} topics for {grade}"],
                "structure": {
                    "lesson_duration": "40 minutes" if "form" in grade.lower() else "30-35 minutes",
                    "scheme_columns": ["Week", "Topic", "Objectives", "Activities", "Assessment"]
                }
            },
            "constraints": {
                "forbidden_topics": forbidden_topics,
                "required_patterns": self.knowledge["BINTI_QUICK_RULES"]["required_for_advanced"] if isAdvanced else []
            },
            "assessment": {
                "preparation_focus": "General assessment principles"
            },
            "quick_guide": quick_guide
        }
    
    def validateLessonPlan(self, lessonPlan, context):
        """Validate a lesson plan against curriculum rules"""
        subject = context.get("subject", "")
        grade = context.get("grade", "")
        syllabus = context.get("syllabus", "")
        
        intelligence = self.generateIntelligenceSummary(context)
        issues = []
        warnings = []
        strengths = []

        # Check for forbidden content
        forbidden_topics = intelligence["constraints"]["forbidden_topics"]
        lesson_text = json.dumps(lessonPlan).lower()
        
        for topic in forbidden_topics:
            if topic.lower() in lesson_text:
                issues.append(f"Contains forbidden content: '{topic}'")

        # Check for required Bloom's verbs
        required_verbs = intelligence["level"]["bloom_verbs"]
        has_required_verbs = any(verb.lower() in lesson_text for verb in required_verbs)
        
        if not has_required_verbs and required_verbs:
            warnings.append(f"Consider using Bloom's verbs like: {', '.join(required_verbs[:3])}")
        elif has_required_verbs:
            strengths.append("Uses appropriate Bloom's taxonomy verbs")

        # Check for advanced level requirements
        if intelligence["level"]["isAdvanced"]:
            required_patterns = intelligence["constraints"]["required_patterns"]
            has_advanced_patterns = any(
                pattern.lower().split('...')[0] in lesson_text 
                for pattern in required_patterns
            )
            
            if not has_advanced_patterns and required_patterns:
                issues.append(f"Advanced level requires critical thinking patterns like: {required_patterns[0]}")
            elif has_advanced_patterns:
                strengths.append("Includes advanced critical thinking patterns")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "strengths": strengths,
            "intelligence_summary": intelligence
        }