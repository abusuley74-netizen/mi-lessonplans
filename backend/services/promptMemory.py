#!/usr/bin/env python3
"""
Prompt Memory Service
Manages caching and retrieval of generated prompts to reduce API calls
"""

import hashlib
import json
from typing import Dict, Any, Optional, Callable, Awaitable
from datetime import datetime
from .promptNormalizer import PromptNormalizer

class PromptMemory:
    """Manages prompt memory caching and retrieval"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_or_generate(self, prompt_context: Dict[str, Any], 
                            generate_function: Callable[[], Awaitable[Dict]]) -> Dict[str, Any]:
        """Get from memory or generate fresh"""
        
        # Extract context
        syllabus = prompt_context.get('syllabus', '')
        level = prompt_context.get('level', '')
        subject = prompt_context.get('subject', '')
        term = prompt_context.get('term', '')
        total_weeks = prompt_context.get('total_weeks', 36)
        user_guidance = prompt_context.get('user_guidance', '')
        negative_constraints = prompt_context.get('negative_constraints', '')
        user_prompt = prompt_context.get('user_prompt', f"{syllabus} {level} {subject}")
        
        # Step 1: Normalize and hash
        normalized = PromptNormalizer.normalize(user_prompt, {
            'syllabus': syllabus,
            'level': level,
            'subject': subject,
            'term': term,
            'total_weeks': total_weeks,
            'user_guidance': user_guidance,
            'negative_constraints': negative_constraints
        })
        
        normalized_hash = PromptNormalizer.generate_hash(normalized)
        
        # Step 2: Check memory
        existing, match_type = await PromptNormalizer.find_similar_prompt(normalized_hash, self.db)
        
        if existing and match_type != 'none':
            # Update usage count
            await self.db.prompt_memory.update_one(
                {"prompt_hash": existing['prompt_hash']},
                {
                    "$inc": {"usage_count": 1},
                    "$set": {"last_used": datetime.utcnow().isoformat()}
                }
            )
            
            return {
                "source": "memory",
                "type": match_type,
                "data": existing.get('generated_pages', {}),
                "usage_count": existing.get('usage_count', 0) + 1,
                "prompt_hash": existing.get('prompt_hash')
            }
        
        # Step 3: No memory hit – generate
        generated_data = await generate_function()
        
        # Step 4: Store in memory
        memory_record = {
            "prompt_hash": normalized_hash,
            "prompt_text": user_prompt,
            "syllabus": syllabus,
            "level": level,
            "subject": subject,
            "term": term,
            "total_weeks": total_weeks,
            "user_guidance_hash": hashlib.sha256(user_guidance.encode()).hexdigest() if user_guidance else None,
            "negative_constraints_hash": hashlib.sha256(negative_constraints.encode()).hexdigest() if negative_constraints else None,
            "generated_pages": generated_data,
            "usage_count": 1,
            "last_used": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        try:
            await self.db.prompt_memory.insert_one(memory_record)
        except Exception as e:
            print(f"Error storing prompt in memory: {e}")
            # Continue even if storage fails
        
        return {
            "source": "generated",
            "type": "fresh",
            "data": generated_data,
            "usage_count": 1,
            "prompt_hash": normalized_hash
        }
    
    async def get_top_prompts(self, limit: int = 10) -> list:
        """Get most frequently used prompts (for analytics)"""
        try:
            cursor = self.db.prompt_memory.find(
                {},
                {
                    "_id": 0,
                    "syllabus": 1,
                    "level": 1,
                    "subject": 1,
                    "term": 1,
                    "usage_count": 1,
                    "last_used": 1,
                    "created_at": 1
                }
            ).sort("usage_count", -1).limit(limit)
            
            return await cursor.to_list(length=limit)
        except Exception as e:
            print(f"Error getting top prompts: {e}")
            return []
    
    async def get_suggestions(self, syllabus: str, level: str, subject: str, limit: int = 5) -> list:
        """Suggest prompts to users based on what others generated"""
        try:
            cursor = self.db.prompt_memory.find(
                {
                    "syllabus": syllabus,
                    "level": level,
                    "subject": subject
                },
                {
                    "_id": 0,
                    "user_guidance_hash": 1,
                    "negative_constraints_hash": 1,
                    "usage_count": 1,
                    "prompt_text": 1
                }
            ).sort("usage_count", -1).limit(limit)
            
            suggestions = await cursor.to_list(length=limit)
            
            # Add some sample guidance text
            for suggestion in suggestions:
                suggestion['sample_guidance'] = "Popular prompt used by other teachers"
                if 'prompt_text' in suggestion:
                    # Extract first 50 chars as preview
                    suggestion['preview'] = suggestion['prompt_text'][:50] + "..." if len(suggestion['prompt_text']) > 50 else suggestion['prompt_text']
            
            return suggestions
        except Exception as e:
            print(f"Error getting suggestions: {e}")
            return []
    
    async def clear_old_memory(self, days_old: int = 30) -> int:
        """Clear old memory entries to save space"""
        try:
            cutoff_date = datetime.utcnow().replace(tzinfo=None) - datetime.timedelta(days=days_old)
            result = await self.db.prompt_memory.delete_many({
                "last_used": {"$lt": cutoff_date.isoformat()},
                "usage_count": {"$lt": 3}  # Only delete rarely used entries
            })
            return result.deleted_count
        except Exception as e:
            print(f"Error clearing old memory: {e}")
            return 0
    
    async def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        try:
            total_count = await self.db.prompt_memory.count_documents({})
            total_usage = await self.db.prompt_memory.aggregate([
                {"$group": {"_id": None, "total_usage": {"$sum": "$usage_count"}}}
            ]).to_list(length=1)
            
            top_subjects = await self.db.prompt_memory.aggregate([
                {"$group": {"_id": "$subject", "count": {"$sum": 1}, "usage": {"$sum": "$usage_count"}}},
                {"$sort": {"usage": -1}},
                {"$limit": 5}
            ]).to_list(length=5)
            
            return {
                "total_prompts": total_count,
                "total_usage": total_usage[0]['total_usage'] if total_usage else 0,
                "top_subjects": top_subjects,
                "memory_size_mb": 0  # Would need actual collection stats
            }
        except Exception as e:
            print(f"Error getting memory stats: {e}")
            return {
                "total_prompts": 0,
                "total_usage": 0,
                "top_subjects": [],
                "memory_size_mb": 0
            }