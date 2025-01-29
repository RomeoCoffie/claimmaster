# Health Influencer Analysis API

An API that leverages the Perplexity API to analyze and validate health influencers' content, extracting and verifying health-related claims.

## Features

- Content gathering from health influencers
- Health claim extraction and analysis
- Claim verification against scientific sources
- Influencer content summarization and insights

## Prerequisites

- Python 3.8+
- Perplexity API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd claimmaster
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Unix or MacOS
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory and add your Perplexity API key:
```
PERPLEXITY_API_KEY=your_api_key_here
```

## Running the API

Start the API server:
```bash
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### 1. Gather Content
```http
POST /gatherContent
```
Retrieves and summarizes content from a specified health influencer.

### 2. Extract Claims
```http
POST /extractClaims
```
Extracts and processes health-related claims from gathered content.

### 3. Verify Claim
```http
POST /verifyClaim
```
Validates a health claim using trusted sources.

### 4. Summarize Influencer
```http
POST /summarizeInfluencer
```
Provides contextual insights into an influencer's health claims and focus areas.

## Example Usage

### Gather Content
```python
import requests

response = requests.post(
    "http://localhost:8000/gatherContent",
    json={
        "influencer_name": "health_expert",
        "keywords": ["nutrition", "fitness"],
        "content_sources": [
            {"name": "Twitter", "url": "https://twitter.com/health_expert"}
        ],
        "date_range": {
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-02-01T00:00:00Z"
        }
    }
)
print(response.json())
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 500: Internal Server Error

Each error response includes a detail message explaining the error.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 