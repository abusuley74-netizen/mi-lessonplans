#!/usr/bin/env python3
"""
Lesson Plan Prompt Builder with Language Detection and Syllabus Awareness
"""
import re
import hashlib

class LessonPromptBuilder:
    def __init__(self, syllabus, subject, grade, topic, user_guidance=None, negative_constraints=None):
        self.syllabus = syllabus
        self.subject = subject
        self.grade = grade
        self.topic = topic
        self.user_guidance = user_guidance
        self.negative_constraints = negative_constraints
    
    def detect_language(self):
        """Detect language based on subject and topic"""
        subject_lower = self.subject.lower()
        topic_lower = self.topic.lower()
        
        # Check for Arabic
        if (subject_lower == 'arabic' or subject_lower == 'اللغة العربية' or 
            'arabic' in topic_lower or re.search(r'[\u0600-\u06FF]', self.topic)):
            return 'arabic'
        
        # Check for French
        if (subject_lower == 'french' or subject_lower == 'français' or 
            'french' in topic_lower or re.search(r'[éèêëçàù]', self.topic)):
            return 'french'
        
        # Check for Swahili
        if (subject_lower == 'kiswahili' or subject_lower == 'swahili' or
            'kiswahili' in topic_lower or 'swahili' in topic_lower):
            return 'swahili'
        
        # Check for English
        if subject_lower == 'english':
            return 'english'
        
        return 'generic'
    
    def get_level_category(self):
        """Get level category based on grade"""
        grade_lower = self.grade.lower()
        
        if 'standard 1' in grade_lower or 'standard 2' in grade_lower:
            return 'early_primary'
        if 'standard 3' in grade_lower or 'standard 4' in grade_lower:
            return 'mid_primary'
        if 'standard 5' in grade_lower or 'standard 6' in grade_lower or 'standard 7' in grade_lower:
            return 'upper_primary'
        if 'form 1' in grade_lower or 'form 2' in grade_lower:
            return 'lower_secondary'
        if 'form 3' in grade_lower or 'form 4' in grade_lower:
            return 'upper_secondary'
        if 'form 5' in grade_lower or 'form 6' in grade_lower:
            return 'advanced_preuniversity'
        
        return 'unknown'
    
    def get_level_behavior(self, category):
        """Get level-appropriate teaching behavior"""
        behaviors = {
            'early_primary': 'Use play-based learning. Activities: 5-10 minutes each. Verbs: identify, name, point, match, color, trace. No abstract concepts.',
            'mid_primary': 'Use guided discovery. Activities: 10-15 minutes. Verbs: describe, explain, list, order, compare.',
            'upper_primary': 'Use collaborative learning. Activities: 15-20 minutes. Verbs: summarize, classify, organize, demonstrate.',
            'lower_secondary': 'Use inquiry-based learning. Activities: 20-30 minutes. Verbs: apply, analyze, differentiate, construct.',
            'upper_secondary': 'Use problem-based learning. Activities: 30-40 minutes. Verbs: evaluate, justify, critique, synthesize.',
            'advanced_preuniversity': 'Use seminar/discussion method. Activities: 40-50 minutes. Verbs: analyze, evaluate, create, critique, defend.'
        }
        return behaviors.get(category, behaviors['lower_secondary'])
    
    def get_subject_rules(self, language, is_zanzibar_arabic, is_advanced):
        """Get subject-specific rules"""
        if is_zanzibar_arabic:
            return """ZANZIBAR FORM 6 ARABIC RULES:
- Lesson must be conducted in ARABIC language
- Focus on literary analysis, not basic conversation
- Include classical text (poetry or prose) as primary material
- Learning objectives must use: يحلل (analyzes), ينقد (critiques), يزن الشعر (scans poetry)
- Forbidden: role-play of daily situations, letter writing, basic greetings"""
        
        if language == 'arabic':
            return "Arabic language lesson. Use appropriate Arabic terminology. Include Quranic or classical examples where relevant."
        
        if language == 'swahili':
            return "Kiswahili lesson following Tanzania/Zanzibar curriculum. Include local cultural examples. Use standard Swahili pedagogical terms."
        
        if language == 'french':
            return "French language lesson. Focus on communicative competence. Include Francophone cultural references."
        
        return f"Standard {self.subject} lesson following {self.syllabus} curriculum. Age-appropriate content for {self.grade}."
    
    def build(self):
        """Build the complete prompt for lesson plan generation"""
        language = self.detect_language()
        level_category = self.get_level_category()
        is_advanced = level_category == 'advanced_preuniversity'
        is_zanzibar_arabic = (self.syllabus == 'Zanzibar' and 
                              self.subject.lower() == 'arabic' and 
                              is_advanced)
        
        prompt = f"""You are a lesson plan expert for {self.syllabus} education system in Tanzania.

=== CONTEXT ===
Syllabus: {self.syllabus}
Subject: {self.subject}
Grade: {self.grade} ({level_category})
Topic: {self.topic}
Language detected: {language}

=== LESSON PLAN STRUCTURE ===
Generate a complete 60-90 minute lesson plan with these sections:

1. LESSON TITLE: {self.topic}
2. DURATION: 1 lesson period (60-90 minutes)
3. LEARNING OBJECTIVES (3-5 objectives using appropriate Bloom's verbs for {level_category})
4. TEACHING/LEARNING MATERIALS & RESOURCES
5. PRIOR KNOWLEDGE (what students should already know)
6. LESSON DEVELOPMENT (3 phases):
   - Introduction (5-10 min): Hook/engagement
   - Main Activity (30-50 min): Core learning
   - Conclusion (5-10 min): Summary and assessment
7. DIFFERENTIATION (support for struggling learners + extension for advanced)
8. ASSESSMENT (formative + summative)
9. REMARKS/REFLECTION (for teacher use after lesson)

=== LEVEL BEHAVIOR ===
{self.get_level_behavior(level_category)}

=== SUBJECT-SPECIFIC RULES ===
{self.get_subject_rules(language, is_zanzibar_arabic, is_advanced)}

"""
        
        if self.user_guidance:
            prompt += f"\n=== USER GUIDANCE ===\n{self.user_guidance}\n"
        
        if self.negative_constraints:
            prompt += f"\n=== FORBIDDEN CONTENT ===\n{self.negative_constraints}\n"
        
        prompt += f"""
=== OUTPUT FORMAT ===
Return JSON exactly like this:
{{
  "lesson_title": "{self.topic}",
  "duration": "60 minutes",
  "learning_objectives": ["objective 1", "objective 2"],
  "materials": ["material 1", "material 2"],
  "prior_knowledge": "description of prior knowledge needed",
  "introduction": {{ "duration": "5 min", "activity": "description" }},
  "main_activity": {{ "duration": "40 min", "activity": "description" }},
  "conclusion": {{ "duration": "10 min", "activity": "description" }},
  "differentiation": {{ "support": "for struggling learners", "extension": "for advanced learners" }},
  "assessment": "description of assessment methods",
  "remarks": "optional teacher notes"
}}

Generate in {language.capitalize() if language != 'generic' else 'English'}.
"""
        
        return prompt
    
    def get_prompt_hash(self):
        """Generate hash for prompt normalization"""
        normalized = f"syllabus:{self.syllabus}|"
        normalized += f"subject:{self.subject.lower().strip()}|"
        normalized += f"grade:{self.grade}|"
        normalized += f"topic:{self.topic.lower().strip()}|"
        
        if self.user_guidance:
            cleaned = self.user_guidance.lower().replace('\s+', ' ').strip()
            normalized += f"guidance:{cleaned}|"
        
        if self.negative_constraints:
            cleaned = self.negative_constraints.lower().replace('\s+', ' ').strip()
            normalized += f"negative:{cleaned}|"
        
        return hashlib.sha256(normalized.encode()).hexdigest()