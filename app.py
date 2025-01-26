from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime
import os
import json
import requests
from dotenv import load_dotenv
from dateutil.parser import parse
from enum import Enum
from verification import ClaimVerifier
import aiohttp

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Health Influencer Analysis API",
    description="API for analyzing and validating health influencers' content using Perplexity",
    version="1.0.0"
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
        """Query Perplexity API with improved JSON handling"""
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
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"Perplexity API error: {await response.text()}"
                    )
                
                result = await response.json()
                return result["choices"][0]["message"]["content"]

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
    return {"message": "Health Influencer Analysis API is running"}

@app.post("/research/specific", response_model=dict)
async def research_specific_influencer(request: SpecificInfluencerRequest):
    try:
        # Format the query for Perplexity
        query = (
            f"Return a JSON object analyzing health influencer {request.influencer_name}'s content "
            f"with these fields:\n"
            f"- topics: array of main health topics discussed\n"
            f"- claims: array of up to {request.claims_to_analyze} specific health claims made\n"
            f"Each claim should include text, source, and date fields.\n"
        )
        if request.keywords:
            query += f"Focus on these topics: {', '.join(request.keywords)}.\n"
        
        # Get response from Perplexity
        response_text = query_perplexity(query)
        
        try:
            response_data = json.loads(response_text)
            return {
                "influencer": request.influencer_name,
                "topics": response_data.get("topics", []),
                "claims": response_data.get("claims", []),
                "analysis_date_range": {
                    "start": request.date_range.start_date,
                    "end": request.date_range.end_date
                }
            }
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail="Failed to parse JSON response from Perplexity API"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/research/discover", response_model=List[DiscoveredInfluencer])
async def discover_new_influencers(request: DiscoverNewRequest):
    try:
        # Format the query for Perplexity
        query = (
            f"Return a JSON array of emerging health influencers who post about: {', '.join(request.health_fields)}.\n"
            f"Each object in the array should have:\n"
            f"- name: influencer's name\n"
            f"- platform: main social media platform\n"
            f"- followers: approximate follower count\n"
            f"- engagement_rate: engagement rate as a float\n"
            f"- topics: array of their main topics\n"
            f"- recent_claims: array of their recent health claims\n"
        )
        
        # Get response from Perplexity
        response_text = query_perplexity(query)
        
        try:
            discovered_influencers = json.loads(response_text)
            if not isinstance(discovered_influencers, list):
                discovered_influencers = [discovered_influencers]
            return discovered_influencers
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail="Failed to parse JSON response from Perplexity API"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extractClaims")
async def extract_claims(request: ExtractClaimsRequest):
    try:
        query = (
            f"Return a JSON array of health claims extracted from this content:\n"
            f"{request.content}\n\n"
            f"Each object should have:\n"
            f"- claim: the exact claim text\n"
            f"- context: where the claim appears\n"
            f"- source: type of content or reference\n"
        )
        
        response_text = query_perplexity(query)
        
        try:
            claims = json.loads(response_text)
            return {"claims": claims}
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail="Failed to parse JSON response from Perplexity API"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verifyClaim")
async def verify_claim(request: VerifyClaimRequest):
    try:
        result = await claim_verifier.verify_claim(request.claim, request.journals)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 