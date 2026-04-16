#!/usr/bin/env python3
"""
Prompt Normalizer Service
Creates canonical form of prompts for hashing and similarity matching
"""

import hashlib
import json
from typing import Dict, Any, Optional, Tuple

class PromptNormalizer:
    """Normalize prompts to their canonical form for hashing and matching"""
    
    @staticmethod
    def normalize(user_prompt: str, context: Dict[str, Any]) -> str:
        """Normalize a prompt to its canonical form for hashing"""
        normalized = ''
        
        # Extract only the meaningful parts
        normalized += f"syllabus:{context.get('syllabus', '')}|"
        normalized += f"level:{context.get('level', '')}|"
        normalized += f"subject:{context.get('subject', '')}|"
        normalized += f"term:{context.get('term', 'any')}|"
        normalized += f"weeks:{context.get('total_weeks', 36)}|"
        
        # Normalize user guidance (lowercase, remove extra spaces, sort key phrases)
        if context.get('user_guidance'):
            cleaned = PromptNormalizer._clean_text(context['user_guidance'])
            normalized += f"guidance:{cleaned}|"
        
        # Normalize negative constraints
        if context.get('negative_constraints'):
            cleaned = PromptNormalizer._clean_text(context['negative_constraints'])
            normalized += f"negative:{cleaned}|"
        
        return normalized
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """Clean and normalize text for hashing"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove punctuation (optional, but helps with matching)
        import string
        text = text.translate(str.maketrans('', '', string.punctuation))
        
        # Sort words alphabetically (makes order irrelevant)
        words = text.split()
        words.sort()
        
        return ' '.join(words)
    
    @staticmethod
    def generate_hash(normalized_text: str) -> str:
        """Generate SHA256 hash of normalized text"""
        return hashlib.sha256(normalized_text.encode('utf-8')).digest().hex()
    
    @staticmethod
    async def find_similar_prompt(normalized_hash: str, db, threshold: float = 0.8) -> Tuple[Optional[Dict], str]:
        """Find similar prompts in memory"""
        
        # First try exact hash match
        exact_match = await db.prompt_memory.find_one({"prompt_hash": normalized_hash})
        
        if exact_match:
            exact_match.pop('_id', None)
            return exact_match, 'exact'
        
        # Try to find similar prompts based on syllabus, level, subject
        context_parts = normalized_hash[:100]  # Use part of hash for lookup
        
        # Look for prompts with same syllabus, level, subject
        similar_query = {
            "syllabus": {"$exists": True},
            "level": {"$exists": True},
            "subject": {"$exists": True}
        }
        
        # We'll parse the normalized text to get these fields
        # For now, return None - we'll implement proper similarity matching later
        return None, 'none'
    
    @staticmethod
    def calculate_similarity(text1: str, text2: str) -> float:
        """Calculate similarity between two texts (0.0 to 1.0)"""
        if not text1 or not text2:
            return 0.0
        
        # Simple word overlap similarity
        words1 = set(PromptNormalizer._clean_text(text1).split())
        words2 = set(PromptNormalizer._clean_text(text2).split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0