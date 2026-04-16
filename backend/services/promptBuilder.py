#!/usr/bin/env python3
"""
Intelligent Prompt Builder Service for Curriculum Intelligence System
The "Language Detective" that builds context-aware prompts based on syllabus, level, subject, etc.
"""

import json
import os
from typing import Dict, Any, Optional
from datetime import datetime

class PromptBuilder:
    def __init__(self, syllabus: str, level: str, subject: str, term: str, 
                 user_guidance: str = "", negative_constraints: str = ""):
        self.syllabus = syllabus
        self.level = level
        self.subject = subject
        self.term = term
        self.user_guidance = user_guidance
        self.negative_constraints = negative_constraints
        
    async def build(self, db) -> str:
        """Build the intelligent prompt based on syllabus rules and context"""
        
        # Step 1: Fetch syllabus rules from database
        syllabus_data = await self._fetch_syllabus_data(db)
        
        # Step 2: Determine level category
        level_category = self._get_level_category()
        
        # Step 3: Build the intelligent prompt
        return self._assemble_prompt(syllabus_data, level_category)
    
    async def _fetch_syllabus_data(self, db) -> Dict[str, Any]:
        """Fetch syllabus rules from database"""
        try:
            # Try to find exact match first
            query = {
                "country": self.syllabus,
                "level": self.level,
                "subject": self.subject,
                "term": self.term
            }
            
            syllabus_doc = await db.syllabus_knowledge_base.find_one(query)
            
            # If not found, try without term
            if not syllabus_doc:
                query.pop("term", None)
                syllabus_doc = await db.syllabus_knowledge_base.find_one(query)
            
            # If still not found, try with just country and subject
            if not syllabus_doc:
                query = {
                    "country": self.syllabus,
                    "subject": self.subject
                }
                syllabus_doc = await db.syllabus_knowledge_base.find_one(query)
            
            # Return default if nothing found
            if not syllabus_doc:
                return self._get_default_syllabus_data()
            
            # Convert MongoDB document to dict and handle ObjectId
            syllabus_doc.pop('_id', None)
            return syllabus_doc
            
        except Exception as e:
            print(f"Error fetching syllabus data: {e}")
            return self._get_default_syllabus_data()
    
    def _get_default_syllabus_data(self) -> Dict[str, Any]:
        """Return default syllabus data when no specific rules found"""
        is_zanzibar = self.syllabus == "Zanzibar"
        
        return {
            "country": self.syllabus,
            "level": self.level,
            "subject": self.subject,
            "term": self.term,
            "topics": [],
            "forbidden_topics": [],
            "required_verbs": [],
            "forbidden_verbs": [],
            "column_headers": self._get_default_column_headers(is_zanzibar),
            "terminology_map": {}
        }
    
    def _get_default_column_headers(self, is_zanzibar: bool) -> list:
        """Get default column headers based on syllabus"""
        if is_zanzibar:
            return [
                "Main Competence",
                "Specific Competences",
                "Learning Activities",
                "Specific Activities",
                "Month",
                "Week",
                "Number of Periods",
                "Teaching and Learning Methods",
                "Teaching and Learning Resources",
                "Assessment Tools",
                "References",
                "Remarks"
            ]
        else:
            return [
                "Main Competence (Umahiri Mkuu)",
                "Specific Competence (Umahiri Mahususi)",
                "Main Activity (Shughuli Kuu)",
                "Specific Activity (Shughuli Mahususi)",
                "Month",
                "Week",
                "Number of Periods",
                "Teaching & Learning Methods",
                "Teaching & Learning Resources",
                "Assessment Tools",
                "References",
                "Remarks"
            ]
    
    def _get_level_category(self) -> str:
        """Determine the level category for behavior rules"""
        level_lower = self.level.lower()
        
        if "standard 1" in level_lower or "standard 2" in level_lower:
            return "early_primary"
        elif "standard 3" in level_lower or "standard 4" in level_lower:
            return "mid_primary"
        elif "standard 5" in level_lower or "standard 6" in level_lower or "standard 7" in level_lower:
            return "upper_primary"
        elif "form 1" in level_lower or "form 2" in level_lower:
            return "lower_secondary"
        elif "form 3" in level_lower or "form 4" in level_lower:
            return "upper_secondary"
        elif "form 5" in level_lower or "form 6" in level_lower:
            return "advanced_preuniversity"
        else:
            return "unknown"
    
    def _assemble_prompt(self, syllabus_data: Dict[str, Any], level_category: str) -> str:
        """Assemble the complete intelligent prompt"""
        
        is_advanced = level_category == "advanced_preuniversity"
        is_zanzibar = self.syllabus == "Zanzibar"
        is_arabic = self.subject.lower() == "arabic"
        
        prompt = f"""You are a curriculum expert for {self.syllabus} education system in Tanzania.

=== CONTEXT ===
Syllabus: {self.syllabus}
Level: {self.level} ({level_category})
Subject: {self.subject}
Term: {self.term}

=== LEVEL BEHAVIOR ===
{self._get_level_behavior(level_category)}

=== SUBJECT-SPECIFIC RULES ===
{self._get_subject_rules(is_arabic, is_zanzibar, is_advanced)}

=== SYLLABUS FORMAT ===
Use these column headers:
{json.dumps(syllabus_data.get('column_headers', []), indent=2)}

=== REQUIRED TOPICS FOR THIS LEVEL ===
{json.dumps(syllabus_data.get('topics', []), indent=2)}

=== REQUIRED VERBS (Bloom's Taxonomy) ===
{json.dumps(syllabus_data.get('required_verbs', []), indent=2)}
"""
        
        if self.user_guidance:
            prompt += f"\n=== USER GUIDANCE (FOLLOW THIS) ===\n{self.user_guidance}\n"
        
        if self.negative_constraints:
            prompt += f"\n=== FORBIDDEN CONTENT (DO NOT GENERATE) ===\n{self.negative_constraints}\n"
        
        if syllabus_data.get('forbidden_topics'):
            prompt += f"\n=== SYSTEM FORBIDDEN TOPICS ===\n{json.dumps(syllabus_data['forbidden_topics'])}\n"
        
        if syllabus_data.get('forbidden_verbs'):
            prompt += f"\n=== SYSTEM FORBIDDEN VERBS ===\n{json.dumps(syllabus_data['forbidden_verbs'])}\n"
        
        prompt += """
=== OUTPUT FORMAT ===
Generate a FULL ACADEMIC YEAR scheme (30-40 weeks).
Return JSON with pagination support:
{
  "total_weeks": 36,
  "pages": [
    {
      "page_number": 1,
      "weeks": [1, 2, 3, ..., 15],
      "competencies": [ ... rows for weeks 1-15 ]
    },
    {
      "page_number": 2,
      "weeks": [16, 17, ..., 30],
      "competencies": [ ... rows for weeks 16-30 ]
    }
  ]
}

Each competency row must match the column headers exactly.
Use appropriate content for the level and subject.
"""
        
        return prompt
    
    def _get_level_behavior(self, category: str) -> str:
        """Get level-specific behavior instructions"""
        behaviors = {
            'early_primary': 'Use basic verbs: identify, name, point, match, color, trace. Focus on letter recognition, simple vocabulary, and oral repetition. Each activity should take 5-10 minutes.',
            'mid_primary': 'Use verbs: describe, explain, list, order, compare. Introduce simple sentences and basic reading comprehension. Activities: 10-15 minutes.',
            'upper_primary': 'Use verbs: summarize, classify, organize, demonstrate. Introduce paragraph writing and basic grammar. Activities: 15-20 minutes.',
            'lower_secondary': 'Use verbs: apply, analyze, differentiate, construct. Introduce essay structure and intermediate grammar. Activities: 20-30 minutes.',
            'upper_secondary': 'Use verbs: evaluate, justify, critique, synthesize. Advanced analysis and exam preparation. Activities: 30-40 minutes.',
            'advanced_preuniversity': "Use Bloom's levels 4-6 ONLY (analyze, evaluate, create). University preparatory content. No basic or intermediate content. Activities: 40-50 minutes with independent research.",
            'unknown': 'Use age-appropriate content for the specified level. Focus on progressive skill development.'
        }
        return behaviors.get(category, behaviors['unknown'])
    
    def _get_subject_rules(self, is_arabic: bool, is_zanzibar: bool, is_advanced: bool) -> str:
        """Get subject-specific rules"""
        if not is_arabic:
            return f"Standard {self.subject} curriculum following {self.syllabus} guidelines. Generate age-appropriate content for {self.level}."
        
        if is_zanzibar and is_advanced:
            return f"""ZANZIBAR FORM 6 ARABIC RULES:
- FORBIDDEN: Basic conversations, personal letters, simple paragraphs, role-play, read aloud activities
- REQUIRED: Prosody (العروض), Rhetoric (البلاغة: المعاني، البيان، البديع), Literary ages, Literary criticism, Classical poetry (مدح، رثاء، غزل، فخر، هجاء، وصف)
- VERBS: analyze, critique, evaluate, compose, scan, interpret, differentiate, justify
- This is FINAL YEAR before university. Generate university-level content."""
        
        if is_zanzibar and not is_advanced:
            return f"Zanzibar Arabic for {self.level}: Follow the Zanzibar curriculum progression. Focus on building foundational skills appropriate for this level. Include religious and cultural context where relevant."
        
        if not is_zanzibar and is_advanced:
            return f"Tanzania Mainland Form 6 Arabic: Focus on advanced grammar (Nahw), morphology (Sarf), classical text analysis, modern literature, and translation skills. Exam-oriented content for ACSEE."
        
        return f"Standard {self.subject} curriculum for {self.syllabus} at {self.level} level."


# Helper function to create prompt builder instance
async def create_prompt_builder(syllabus: str, level: str, subject: str, term: str,
                               user_guidance: str = "", negative_constraints: str = "",
                               db = None) -> PromptBuilder:
    """Factory function to create and initialize a PromptBuilder"""
    builder = PromptBuilder(syllabus, level, subject, term, user_guidance, negative_constraints)
    return builder