import json
import os
from typing import List, Dict, Any
import redis
from Bio import Entrez
import aiohttp
import asyncio
from datetime import timedelta
import hashlib

# Initialize Redis for caching
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(REDIS_URL)
CACHE_EXPIRATION = timedelta(days=7)  # Cache results for 7 days

# Initialize PubMed
Entrez.email = os.getenv("ENTREZ_EMAIL", "your-email@example.com")
Entrez.api_key = os.getenv("ENTREZ_API_KEY")

class ClaimVerifier:
    def __init__(self, perplexity_client):
        self.perplexity = perplexity_client
        
    def _generate_cache_key(self, claim: str, journals: List[str]) -> str:
        """Generate a unique cache key for a claim verification request"""
        data = f"{claim}:{','.join(sorted(journals))}"
        return f"claim_verification:{hashlib.md5(data.encode()).hexdigest()}"
    
    async def _search_pubmed(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Search PubMed for relevant articles"""
        try:
            # Search PubMed
            handle = await asyncio.to_thread(
                Entrez.esearch,
                db="pubmed",
                term=query,
                retmax=max_results,
                sort="relevance"
            )
            results = await asyncio.to_thread(Entrez.read, handle)
            handle.close()
            
            if not results["IdList"]:
                return []
            
            # Fetch article details
            handle = await asyncio.to_thread(
                Entrez.efetch,
                db="pubmed",
                id=results["IdList"],
                rettype="medline",
                retmode="text"
            )
            
            articles = []
            records = await asyncio.to_thread(Entrez.read, handle)
            for record in records["PubmedArticle"]:
                article = {
                    "pmid": record["MedlineCitation"]["PMID"],
                    "title": record["MedlineCitation"]["Article"]["ArticleTitle"],
                    "journal": record["MedlineCitation"]["Article"]["Journal"]["Title"],
                    "publication_date": record["MedlineCitation"]["Article"]["Journal"]["JournalIssue"]["PubDate"],
                    "abstract": record["MedlineCitation"]["Article"].get("Abstract", {}).get("AbstractText", [""])[0],
                    "authors": [author["LastName"] + " " + author["ForeName"] 
                              for author in record["MedlineCitation"]["Article"]["AuthorList"]]
                    if "AuthorList" in record["MedlineCitation"]["Article"] else []
                }
                articles.append(article)
            
            handle.close()
            return articles
            
        except Exception as e:
            print(f"PubMed search error: {str(e)}")
            return []
    
    async def verify_claim(self, claim: str, journals: List[str]) -> Dict[str, Any]:
        """Verify a health claim using multiple sources and caching"""
        cache_key = self._generate_cache_key(claim, journals)
        
        # Check cache first
        cached_result = redis_client.get(cache_key)
        if cached_result:
            return json.loads(cached_result)
        
        try:
            # Step 1: Break down the claim
            claim_components = await self._analyze_claim_components(claim)
            
            # Step 2: Search for scientific evidence
            evidence = await self._gather_scientific_evidence(claim_components, journals)
            
            # Step 3: Analyze consensus
            consensus = await self._analyze_consensus(evidence)
            
            # Compile final result
            result = {
                "claim": claim,
                "status": consensus["overall_status"],
                "confidence_score": consensus["confidence_score"],
                "analysis": {
                    "claim_components": claim_components,
                    "evidence_quality": {
                        "supporting_studies": evidence["supporting_studies"],
                        "conflicting_studies": evidence["conflicting_studies"],
                        "consensus_strength": consensus["consensus_strength"],
                        "limitations": consensus["limitations"]
                    },
                    "recommendations": consensus["recommendations"]
                },
                "references": evidence["references"]
            }
            
            # Cache the result
            redis_client.setex(
                cache_key,
                CACHE_EXPIRATION,
                json.dumps(result)
            )
            
            return result
            
        except Exception as e:
            raise Exception(f"Claim verification failed: {str(e)}")
    
    async def _analyze_claim_components(self, claim: str) -> Dict[str, Any]:
        """Break down a claim into testable components"""
        query = (
            f"Break down this health claim into testable components: {claim}\n"
            f"Return a JSON object with:\n"
            f"- main_claim: the primary assertion\n"
            f"- sub_claims: array of component claims\n"
            f"- measurable_outcomes: specific measurable effects\n"
            f"- timeframe: any mentioned time periods\n"
            f"- keywords: array of key terms for scientific search\n"
        )
        
        response = await self.perplexity.query(query)
        return json.loads(response)
    
    async def _gather_scientific_evidence(self, claim_components: Dict[str, Any], journals: List[str]) -> Dict[str, Any]:
        """Gather scientific evidence from multiple sources"""
        # Prepare search queries from claim components
        search_terms = " AND ".join([
            claim_components["main_claim"],
            *claim_components.get("keywords", [])
        ])
        
        # Search PubMed
        pubmed_results = await self._search_pubmed(search_terms)
        
        # Query Perplexity for analysis of the studies
        evidence_query = (
            f"Analyze these scientific studies regarding the claim: {claim_components['main_claim']}\n"
            f"Studies: {json.dumps(pubmed_results)}\n"
            f"Return a JSON object with:\n"
            f"- supporting_studies: array of studies supporting the claim\n"
            f"- conflicting_studies: array of studies with different findings\n"
            f"- methodology_scores: object mapping study IDs to quality scores (0-100)\n"
            f"- sample_sizes: object mapping study IDs to participant numbers\n"
            f"- references: array of formatted citations\n"
        )
        
        evidence_analysis = await self.perplexity.query(evidence_query)
        return json.loads(evidence_analysis)
    
    async def _analyze_consensus(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze scientific consensus based on gathered evidence"""
        consensus_query = (
            f"Analyze the scientific consensus based on this evidence:\n"
            f"{json.dumps(evidence)}\n"
            f"Return a JSON object with:\n"
            f"- overall_status: [Verified, Questionable, Debunked]\n"
            f"- confidence_score: 0-100 based on evidence quality\n"
            f"- consensus_strength: strong/moderate/weak\n"
            f"- limitations: array of study limitations\n"
            f"- recommendations: suggestions for better evidence\n"
        )
        
        consensus_analysis = await self.perplexity.query(consensus_query)
        return json.loads(consensus_analysis) 