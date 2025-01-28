from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime, timezone
import os
import json
import requests
from dotenv import load_dotenv
from dateutil.parser import parse
from enum import Enum
from verification import ClaimVerifier
import aiohttp
import logging
import traceback
import time

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Health Influencer Analysis API",
    description="API for analyzing and validating health influencers' content using Perplexity",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"

# Enums
class ResearchMode(str, Enum):
    SPECIFIC = "specific_influencer"
    DISCOVER = "discover_new"

class ScientificJournal(str, Enum):
    PUBMED = "PubMed Central"
    NATURE = "Nature"
    SCIENCE = "Science"
    CELL = "Cell"
    LANCET = "The Lancet"
    NEJM = "New England Journal of Medicine"
    JAMA = "JAMA Network"

# Pydantic models for request/response
class ContentSource(BaseModel):
    name: str
    url: Optional[str] = None

class DateRange(BaseModel):
    start_date: datetime
    end_date: datetime

class SpecificInfluencerRequest(BaseModel):
    influencer_name: str
    keywords: Optional[List[str]] = None
    content_sources: List[ContentSource]
    date_range: DateRange
    claims_to_analyze: int = Field(default=50, ge=10, le=100)
    selected_journals: List[ScientificJournal] = []

class DiscoverNewRequest(BaseModel):
    health_fields: List[str]
    date_range: DateRange
    claims_to_analyze: int = Field(default=50, ge=10, le=100)
    selected_journals: List[ScientificJournal] = []

class Claim(BaseModel):
    text: str
    context: str
    source: str
    date: datetime

class ExtractClaimsRequest(BaseModel):
    content: str
    deduplicate: bool = True

class VerifyClaimRequest(BaseModel):
    claim: str
    journals: List[ScientificJournal]

class VerificationResult(BaseModel):
    claim: str
    status: str
    confidence_score: float
    references: List[str]

class DiscoveredInfluencer(BaseModel):
    name: str
    platform: str
    followers: Optional[int]
    engagement_rate: Optional[float]
    topics: List[str]
    recent_claims: List[str]

class ResearchRequest(BaseModel):
    influencer_name: str
    date_range: DateRange
    include_revenue: bool
    verify_with_journals: bool
    selected_journals: List[str]
    claims_to_analyze: int
    notes: Optional[str] = None

class DiscoverRequest(BaseModel):
    categories: List[str]
    influencers_count: int = Field(default=10, ge=1, le=50)
    include_revenue: bool = True
    verify_with_journals: bool = True
    selected_journals: List[str] = []

# Initialize API key
perplexity_api_key = os.getenv("PERPLEXITY_API_KEY")
if not perplexity_api_key:
    raise ValueError("PERPLEXITY_API_KEY environment variable is not set")

class PerplexityClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    async def query(self, prompt: str) -> str:
        """Query Perplexity API with improved error handling"""
        try:
            messages = [
                {
                    "role": "system",
                    "content": "You are a JSON-focused API that always responds with valid JSON. Never include explanatory text outside the JSON structure. All analysis and explanations should be contained within the JSON fields."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            payload = {
                "model": "sonar-pro",
                "messages": messages
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(PERPLEXITY_API_URL, headers=self.headers, json=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise HTTPException(
                            status_code=response.status,
                            detail=f"Perplexity API error: {error_text}"
                        )
                    
                    result = await response.json()
                    if not result.get("choices") or not result["choices"][0].get("message"):
                        raise HTTPException(
                            status_code=500,
                            detail="Invalid response format from Perplexity API"
                        )
                    
                    return result["choices"][0]["message"]["content"]
                    
        except aiohttp.ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to connect to Perplexity API: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error querying Perplexity API: {str(e)}"
            )

# Initialize Perplexity client and claim verifier
perplexity_client = PerplexityClient(perplexity_api_key)
claim_verifier = ClaimVerifier(perplexity_client)

def query_perplexity(prompt: str) -> str:
    """Helper function to query Perplexity API"""
    # Add system message to enforce JSON response
    messages = [
        {
            "role": "system",
            "content": "You are a JSON-focused API that always responds with valid JSON. Never include explanatory text outside the JSON structure. All analysis and explanations should be contained within the JSON fields."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
    
    payload = {
        "model": "sonar-pro",
        "messages": messages
    }
    
    response = requests.post(PERPLEXITY_API_URL, headers=headers, json=payload)
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Perplexity API error: {response.text}"
        )
    
    result = response.json()
    return result["choices"][0]["message"]["content"]

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Health Influencer Analysis API is running"
    }

@app.post("/research/specific")
async def research_specific_influencer(request: SpecificInfluencerRequest):
    """Research a specific influencer"""
    try:
        query = (
            f"Research health influencer {request.influencer_name} "
            f"focusing on content from {request.date_range.start_date} to {request.date_range.end_date}. "
            f"Keywords to focus on: {', '.join(request.keywords) if request.keywords else 'all health topics'}. "
            f"Analyze up to {request.claims_to_analyze} claims. "
        )
        
        if request.selected_journals:
            query += f"Verify claims using: {', '.join(request.selected_journals)}. "
        
        response_text = await perplexity_client.query(query)
        return json.loads(response_text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/research/discover")
async def discover_new_influencers(request: DiscoverNewRequest):
    """Discover new health influencers"""
    try:
        query = (
            f"Discover new health influencers in these fields: {', '.join(request.health_fields)}. "
            f"Focus on content from {request.date_range.start_date} to {request.date_range.end_date}. "
            f"Analyze up to {request.claims_to_analyze} claims per influencer. "
        )
        
        if request.selected_journals:
            query += f"Verify claims using: {', '.join(request.selected_journals)}. "
        
        response_text = await perplexity_client.query(query)
        return json.loads(response_text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extractClaims")
async def extract_claims(request: ExtractClaimsRequest):
    """Extract claims from content"""
    try:
        query = (
            f"Extract health-related claims from this content: {request.content}\n"
            f"{'Remove duplicate claims. ' if request.deduplicate else ''}"
            f"Return as a JSON array of claim objects with text and context fields."
        )
        
        response_text = await perplexity_client.query(query)
        return json.loads(response_text)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verifyClaim")
async def verify_claim(request: VerifyClaimRequest):
    try:
        result = await claim_verifier.verify_claim(request.claim, request.journals)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Dictionary to store research status
research_status = {}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('research.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@app.get("/api/influencers/{influencer_id}")
async def get_influencer(influencer_id: str):
    """Get detailed information about a specific influencer"""
    try:
        logger.info(f"Getting influencer data for: {influencer_id}")
        
        # Check if research is still in progress
        if influencer_id in research_status:
            if research_status[influencer_id]["stage"] == "complete":
                # Return the stored research data if available
                if "data" in research_status[influencer_id]:
                    return research_status[influencer_id]["data"]
            
            # Return status if still in progress
            status_data = {
                "status": research_status[influencer_id]["stage"],
                "message": "Research in progress",
                "logs": research_status[influencer_id].get("logs", [])
            }
            if "error" in research_status[influencer_id]:
                status_data["error"] = research_status[influencer_id]["error"]
            return status_data
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/research")
async def start_research(request: ResearchRequest):
    """Start research on an influencer"""
    try:
        logger.info(f"Starting research for influencer: {request.influencer_name}")
        
        # Get current time in UTC
        current_time = datetime.now(timezone.utc)
        
        # Validate date range
        if request.date_range.start_date > request.date_range.end_date:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
            
        # Ensure dates are timezone aware and in UTC
        start_date = request.date_range.start_date.astimezone(timezone.utc)
        end_date = request.date_range.end_date.astimezone(timezone.utc)
        
        if end_date > current_time:
            raise HTTPException(status_code=400, detail="End date cannot be in the future")
        
        # Calculate date range duration in months
        duration_months = (end_date - start_date).days / 30
        if duration_months > 24:
            raise HTTPException(status_code=400, detail="Date range cannot exceed 24 months")
        
        # Update research status
        research_status[request.influencer_name] = {
            "stage": "gathering_claims",
            "started_at": datetime.now().isoformat(),
            "logs": []
        }
        
        def log_stage(stage: str, message: str):
            timestamp = datetime.now().isoformat()
            log_entry = {"timestamp": timestamp, "stage": stage, "message": message}
            research_status[request.influencer_name]["logs"].append(log_entry)
            research_status[request.influencer_name]["stage"] = stage
            logger.info(f"[{request.influencer_name}] {stage}: {message}")

        log_stage("gathering_claims", "Starting to gather influencer data and claims")
        
        # Format query for Perplexity with specific instructions
        query = (
            f"Return a detailed JSON object about health influencer {request.influencer_name}. "
            f"Include factual information only. Format exactly as follows:\n"
            f"{{\n"
            f'  "id": "{request.influencer_name}",\n'
            f'  "name": "{request.influencer_name}",\n'
            f'  "avatar": "PUBLIC_IMAGE_URL",\n'
            f'  "category": "Health & Wellness",\n'
            f'  "topics": ["Nutrition", "Fitness", "Mental Health"],\n'
            f'  "trustScore": 85.5,\n'
            f'  "yearlyRevenue": 2500000,\n'
            f'  "productsCount": 12,\n'
            f'  "followers": 1500000,\n'
            f'  "claims": [\n'
            f'    {{\n'
            f'      "id": "1",\n'
            f'      "text": "Specific health claim made by the influencer",\n'
            f'      "date": "2024-02-01T00:00:00Z",\n'
            f'      "category": "Nutrition",\n'
            f'      "status": "verified",\n'
            f'      "trustScore": 90\n'
            f'    }}\n'
            f'  ],\n'
            f'  "trustScoreHistory": [\n'
            f'    {{\n'
            f'      "date": "2024-01-01T00:00:00Z",\n'
            f'      "score": 82\n'
            f'    }}\n'
            f'  ]\n'
            f"}}\n\n"
            f"Important instructions:\n"
            f"1. Use real data about {request.influencer_name}\n"
            f"2. For the avatar field, find and include a publicly accessible profile image URL that:\n"
            f"   - Comes from their official website, YouTube channel, or other public platform\n"
            f"   - Is a permanent, direct link to the image file (not a CDN or temporary URL)\n"
            f"   - Prefers .jpg, .png, or .webp formats\n"
            f"   - Must be from a reliable source that allows direct image access\n"
            f"   - If no reliable image URL is found, return an empty string\n"
            f"3. Include at least 5 recent claims\n"
            f"4. Provide accurate follower count\n"
            f"5. Calculate trust score based on claim verification\n"
            f"6. Include real product count and revenue estimates\n"
            f"Focus on content from {request.date_range.start_date.strftime('%Y-%m-%d')} "
            f"to {request.date_range.end_date.strftime('%Y-%m-%d')}. "
            f"{'Include revenue analysis. ' if request.include_revenue else ''}"
            f"{'Verify claims with scientific journals. ' if request.verify_with_journals else ''}"
            f"Analyze up to {request.claims_to_analyze} claims. "
        )
        
        if request.verify_with_journals:
            log_stage("verifying_claims", f"Verifying claims using journals: {', '.join(request.selected_journals)}")
            query += f"Verify claims using these journals: {', '.join(request.selected_journals)}. "
        
        # Get response from Perplexity
        log_stage(research_status[request.influencer_name]["stage"], "Querying Perplexity API")
        response_text = await perplexity_client.query(query)
        
        try:
            research_data = json.loads(response_text)
            log_stage("processing", "Parsing and validating research data")
            
            # Validate and clean avatar URL
            if not research_data.get('avatar') or not isinstance(research_data['avatar'], str):
                log_stage("warning", "Invalid or missing avatar URL, using default")
                research_data['avatar'] = ""
            else:
                avatar_url = research_data['avatar'].lower()
                # Reject problematic domains and patterns
                blocked_patterns = [
                    'fbcdn.net', 'instagram.com', 'facebook.com',
                    'twimg.com', 't.co',  # Twitter CDN
                    'temporary', 'temp', 'cdn-cgi',  # Temporary/CDN URLs
                    'profile_images', 'avatars'  # Common dynamic paths
                ]
                if any(pattern in avatar_url for pattern in blocked_patterns):
                    log_stage("warning", "Avatar URL from unreliable domain, using default")
                    research_data['avatar'] = ""
                else:
                    # Validate URL format and image extension
                    valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
                    if not any(avatar_url.endswith(ext) for ext in valid_extensions):
                        log_stage("warning", "Avatar URL does not point to a valid image file, using default")
                        research_data['avatar'] = ""
                    else:
                        try:
                            # Test if URL is accessible
                            async with aiohttp.ClientSession() as session:
                                async with session.head(avatar_url, timeout=5) as response:
                                    if response.status != 200:
                                        log_stage("warning", f"Avatar URL not accessible (status {response.status}), using default")
                                        research_data['avatar'] = ""
                        except Exception as e:
                            log_stage("warning", f"Failed to validate avatar URL: {str(e)}, using default")
                            research_data['avatar'] = ""

            # Ensure required fields exist and have correct types
            required_fields = {
                'id': str,
                'name': str,
                'category': str,
                'topics': list,
                'trustScore': (int, float),
                'yearlyRevenue': (int, float),
                'productsCount': int,
                'followers': int,
                'claims': list,
                'trustScoreHistory': list
            }
            
            for field, expected_type in required_fields.items():
                if field not in research_data:
                    error_msg = f"Missing required field: {field}"
                    log_stage("error", error_msg)
                    raise ValueError(error_msg)
                if not isinstance(research_data[field], expected_type):
                    error_msg = f"Field {field} has incorrect type. Expected {expected_type}, got {type(research_data[field])}"
                    log_stage("error", error_msg)
                    raise ValueError(error_msg)
            
            # Validate and format claims
            for claim in research_data['claims']:
                if not all(k in claim for k in ['id', 'text', 'date', 'category', 'status', 'trustScore']):
                    raise ValueError("Claims missing required fields")
            
            # Ensure trustScoreHistory is properly formatted
            for history in research_data['trustScoreHistory']:
                if not all(k in history for k in ['date', 'score']):
                    raise ValueError("Trust score history missing required fields")
            
            # Store the complete data in research_status
            research_status[request.influencer_name]["data"] = research_data
            research_status[request.influencer_name]["stage"] = "complete"
            log_stage("complete", "Research completed successfully")
            
            # Add status and logs to response
            research_data["status"] = "complete"
            research_data["logs"] = research_status[request.influencer_name]["logs"]
            
            return research_data
            
        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse research results - invalid JSON: {str(e)}"
            log_stage("error", error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        except ValueError as e:
            log_stage("error", str(e))
            raise HTTPException(status_code=500, detail=str(e))
            
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Research failed: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        if request.influencer_name in research_status:
            research_status[request.influencer_name]["stage"] = "error"
            research_status[request.influencer_name]["error"] = error_msg
        raise HTTPException(status_code=500, detail=error_msg) 

@app.get("/api/research/status")
async def get_research_status():
    """Get the current status of ongoing research"""
    try:
        # Return the most recent research status
        if not research_status:
            return {
                "status": "no_research",
                "message": "No research in progress"
            }
        
        # Get the most recent research
        latest_research = max(research_status.values(), key=lambda x: x.get('started_at', ''))
        
        return {
            "status": latest_research.get('status', 'unknown'),
            "stage": latest_research.get('stage', 'unknown'),
            "logs": latest_research.get('logs', []),
            "influencers": latest_research.get('influencers', [])
        }
        
    except Exception as e:
        logger.error(f"Error getting research status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get research status: {str(e)}"
        )

@app.post("/api/research/discover")
async def discover_influencers(request: DiscoverRequest):
    """Discover new health influencers based on categories"""
    try:
        research_id = f"discover_{int(time.time())}"
        logger.info(f"Starting discovery research [{research_id}] for categories: {request.categories}")
        
        # Initialize research status
        research_status[research_id] = {
            "status": "in_progress",
            "stage": "searching",
            "started_at": datetime.now().isoformat(),
            "logs": []
        }
        
        def log_stage(stage: str, message: str):
            timestamp = datetime.now().isoformat()
            log_entry = {"timestamp": timestamp, "stage": stage, "message": message}
            research_status[research_id]["logs"].append(log_entry)
            research_status[research_id]["stage"] = stage
            logger.info(f"[{research_id}] {stage}: {message}")
        
        # Build the query for Perplexity with explicit JSON structure
        query = (
            f"Find {request.influencers_count} most influential health content creators "
            f"in these categories: {', '.join(request.categories)}.\n\n"
            f"Return the response in this exact JSON format:\n"
            f"{{\n"
            f'  "influencers": [\n'
            f'    {{\n'
            f'      "name": "Full Name",\n'
            f'      "platforms": ["Platform1", "Platform2"],\n'
            f'      "bio": "Brief professional bio",\n'
            f'      "followers": 1000000,\n'
            f'      "topics": ["Topic1", "Topic2"],\n'
            f'      "claims": [\n'
            f'        {{\n'
            f'          "text": "Health claim text",\n'
            f'          "date": "2024-01-01",\n'
            f'          "status": "verified"\n'
            f'        }}\n'
            f'      ],\n'
            f'      "trustScore": 85.5,\n'
            f'      "avatar": "https://example.com/image.jpg",\n'
            f'      "trustScoreHistory": [\n'
            f'        {{\n'
            f'          "date": "2024-01-01",\n'
            f'          "score": 85.5\n'
            f'        }}\n'
            f'      ]'
        )
        
        if request.include_revenue:
            query += ',\n      "yearlyRevenue": 1000000'
            
        query += "\n    }\n  ]\n}"
            
        query += (
            f"\n\nImportant instructions:\n"
            f"1. Return real data for {request.influencers_count} different health influencers\n"
            f"2. For each influencer's avatar field:\n"
            f"   - Use their official website or YouTube channel image URL\n"
            f"   - Must be a direct link to a .jpg, .png, or .webp file\n"
            f"   - If no reliable image found, use empty string\n"
            f"3. Calculate trust scores based on:\n"
            f"   - Professional credentials\n"
            f"   - Content accuracy\n"
            f"   - Scientific citations\n"
            f"4. Include at least 3 recent claims per influencer\n"
            f"5. Ensure all dates are in YYYY-MM-DD format\n"
            f"6. Use real follower counts\n"
        )
        
        if request.verify_with_journals:
            query += f"7. Verify claims using: {', '.join(request.selected_journals)}\n"
            
        log_stage("analyzing", "Analyzing influencer profiles and content")
        
        # Get response from Perplexity
        response_text = await perplexity_client.query(query)
        
        try:
            discovered_data = json.loads(response_text)
            
            # Validate the response structure
            if not isinstance(discovered_data, dict) or 'influencers' not in discovered_data:
                raise ValueError("Response missing 'influencers' array")
                
            if not isinstance(discovered_data['influencers'], list):
                raise ValueError("'influencers' must be an array")
                
            if len(discovered_data['influencers']) == 0:
                raise ValueError("No influencers found")
                
            for influencer in discovered_data['influencers']:
                required_fields = {
                    'name': str,
                    'platforms': list,
                    'bio': str,
                    'followers': int,
                    'topics': list,
                    'claims': list,
                    'trustScore': (int, float),
                    'avatar': str,
                    'trustScoreHistory': list
                }
                
                for field, expected_type in required_fields.items():
                    if field not in influencer:
                        raise ValueError(f"Influencer missing required field: {field}")
                    if not isinstance(influencer[field], expected_type):
                        raise ValueError(f"Field {field} has incorrect type")
                
                # Add additional fields if requested
                if request.include_revenue:
                    if 'yearlyRevenue' not in influencer:
                        raise ValueError("Missing yearly revenue data")
                    if not isinstance(influencer['yearlyRevenue'], (int, float)):
                        raise ValueError("Invalid yearly revenue type")
                
                # Clean and validate avatar URL
                if influencer['avatar']:
                    avatar_url = influencer['avatar'].lower()
                    blocked_patterns = [
                        'fbcdn.net', 'instagram.com', 'facebook.com',
                        'twimg.com', 't.co',
                        'temporary', 'temp', 'cdn-cgi',
                        'profile_images', 'avatars'
                    ]
                    if any(pattern in avatar_url for pattern in blocked_patterns):
                        influencer['avatar'] = ""
                    else:
                        valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
                        if not any(avatar_url.endswith(ext) for ext in valid_extensions):
                            influencer['avatar'] = ""
                
            log_stage("verifying", "Verifying influencer claims")
            
            # Store the results
            research_status[research_id]["status"] = "complete"
            research_status[research_id]["stage"] = "complete"
            research_status[research_id]["influencers"] = discovered_data["influencers"]
            log_stage("complete", f"Successfully discovered {len(discovered_data['influencers'])} influencers")
            
            return discovered_data
            
        except json.JSONDecodeError as e:
            log_stage("error", f"Failed to parse discovery results: {str(e)}")
            research_status[research_id]["status"] = "error"
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse discovery results: {str(e)}"
            )
        except ValueError as e:
            log_stage("error", str(e))
            research_status[research_id]["status"] = "error"
            raise HTTPException(
                status_code=500,
                detail=str(e)
            )
            
    except Exception as e:
        logger.error(f"Discovery research failed: {str(e)}\n{traceback.format_exc()}")
        if research_id in research_status:
            research_status[research_id]["status"] = "error"
            research_status[research_id]["stage"] = "error"
        raise HTTPException(
            status_code=500,
            detail=f"Discovery research failed: {str(e)}"
        ) 