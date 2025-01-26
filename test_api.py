import requests
import json
from datetime import datetime, timedelta

# API base URL
BASE_URL = "http://localhost:8000"

def test_root():
    """Test the root endpoint"""
    response = requests.get(f"{BASE_URL}/")
    print("\n=== Testing Root Endpoint ===")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

def test_specific_influencer_research():
    """Test the specific influencer research endpoint"""
    data = {
        "influencer_name": "Dr. Mark Hyman",
        "keywords": ["nutrition", "gut health"],
        "content_sources": [
            {"name": "Twitter", "url": "https://twitter.com/drmarkhyman"},
            {"name": "Blog", "url": "https://drhyman.com"}
        ],
        "date_range": {
            "start_date": (datetime.now() - timedelta(days=30)).isoformat(),
            "end_date": datetime.now().isoformat()
        },
        "claims_to_analyze": 50,
        "selected_journals": ["PubMed Central", "Nature", "Science"]
    }
    
    response = requests.post(f"{BASE_URL}/research/specific", json=data)
    print("\n=== Testing Specific Influencer Research Endpoint ===")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_discover_new_influencers():
    """Test the discover new influencers endpoint"""
    data = {
        "health_fields": ["nutrition", "functional medicine", "gut health"],
        "date_range": {
            "start_date": (datetime.now() - timedelta(days=30)).isoformat(),
            "end_date": datetime.now().isoformat()
        },
        "claims_to_analyze": 50,
        "selected_journals": ["PubMed Central", "Nature", "JAMA Network"]
    }
    
    response = requests.post(f"{BASE_URL}/research/discover", json=data)
    print("\n=== Testing Discover New Influencers Endpoint ===")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_extract_claims():
    """Test the extract claims endpoint"""
    data = {
        "content": """
        In my latest video, I discussed how intermittent fasting can boost metabolism by 15%.
        Studies show that consuming probiotics daily can improve gut health and reduce inflammation.
        I've seen remarkable results with patients who eliminated processed sugars, experiencing
        significant weight loss within just 30 days.
        """,
        "deduplicate": True
    }
    
    response = requests.post(f"{BASE_URL}/extractClaims", json=data)
    print("\n=== Testing Extract Claims Endpoint ===")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_verify_claim():
    """Test the verify claim endpoint"""
    data = {
        "claim": "Intermittent fasting increases metabolism by 15% and promotes weight loss",
        "journals": ["PubMed Central", "Nature", "Science"]
    }
    
    response = requests.post(f"{BASE_URL}/verifyClaim", json=data)
    print("\n=== Testing Verify Claim Endpoint ===")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    print("Starting API Tests...")
    print("Make sure the API server is running (uvicorn app:app --reload)")
    
    # Run all tests
    test_root()
    test_specific_influencer_research()
    test_discover_new_influencers()
    test_extract_claims()
    test_verify_claim() 