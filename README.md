# ClaimMaster - Health Influencer Analysis Platform

A comprehensive platform for analyzing and verifying health influencers' claims using AI and scientific research validation.

## Features

- **Influencer Research Modes**:
  - Specific Influencer Analysis
  - Discover New Influencers
  - Real-time Research Progress Tracking
  - Trust Score Calculation

- **Claims Analysis**:
  - Automated Claim Extraction
  - Scientific Journal Verification
  - Trust Score History
  - Citation Tracking

- **Data Visualization**:
  - Trust Score Trends
  - Interactive Progress Indicators
  - Claim Status Distribution
  - Revenue and Engagement Analytics

## Tech Stack

### Frontend
- React.js
- Material-UI
- Chart.js
- React Router

### Backend
- FastAPI
- Redis (for caching)
- Perplexity AI API
- PubMed/Entrez API

## Prerequisites

- Python 3.8+
- Node.js 18+
- Redis Server
- Perplexity API Key
- PubMed/Entrez API Key

## Installation

### Backend Setup

1. Navigate to the API directory:
   ```bash
   cd API
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```env
   PERPLEXITY_API_KEY=your_api_key_here
   ENTREZ_EMAIL=your_email@example.com
   ENTREZ_API_KEY=your_entrez_api_key
   REDIS_URL=redis://localhost:6379
   REDIS_EXPIRE_TIME=86400
   PORT=8000
   HOST=0.0.0.0
   DEBUG=True
   ```

5. Start the backend server:
   ```bash
   python -m uvicorn app:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   NODE_VERSION=18.0.0
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Redis Setup

1. Using Docker:
   ```bash
   docker run --name redis -p 6379:6379 -d redis
   ```

   Or install Redis locally following the [official documentation](https://redis.io/docs/getting-started/).

## Deployment

### Backend Deployment (Render)

Render offers a free tier for web services that's perfect for hobby projects:

1. Create `render.yaml` in project root:
   ```yaml
   services:
     - type: web
       name: claimmaster-api
       env: python
       buildCommand: cd API && pip install -r requirements.txt
       startCommand: cd API && uvicorn app:app --host 0.0.0.0 --port $PORT
       envVars:
         - key: PYTHON_VERSION
           value: 3.8.0
         - key: PERPLEXITY_API_KEY
           sync: false
         - key: ENTREZ_EMAIL
           sync: false
         - key: ENTREZ_API_KEY
           sync: false
         - key: REDIS_URL
           sync: false
   ```

2. Create a `requirements.txt` in the API directory if not already present.

3. Deploy to Render:
   - Create account at [render.com](https://render.com)
   - Connect your GitHub repository
   - Click "New Web Service"
   - Choose "Build and deploy from a render.yaml"
   - Add environment variables in the Render dashboard:
     ```
     PERPLEXITY_API_KEY=your_api_key
     ENTREZ_EMAIL=your_email
     ENTREZ_API_KEY=your_key
     REDIS_URL=your_redis_url
     ```

4. Get your production URL from Render dashboard (e.g., `https://claimmaster-api.onrender.com`)

### Redis Deployment (Redis Cloud or Upstash)

For Redis, you have two free options:

1. **Upstash** (Recommended for hobby projects):
   - Create account at [upstash.com](https://upstash.com)
   - Create a new Redis database
   - Get your Redis URL
   - Free tier includes:
     - 1 database
     - 256MB storage
     - 10,000 requests/day

2. **Redis Cloud**:
   - Create account at [Redis Cloud](https://redis.com/try-free/)
   - Create a new subscription and database
   - Get your Redis URL
   - Free tier includes:
     - 30MB database
     - 30 connections

Add the Redis URL to your Render environment variables.

### Frontend Deployment (Netlify)

1. Create `netlify.toml` in project root:
   ```toml
   [build]
     base = "frontend/"
     command = "npm run build"
     publish = "build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [context.production.environment]
     REACT_APP_API_URL = "https://claimmaster-api.onrender.com"  # Your Render backend URL

   [context.deploy-preview.environment]
     REACT_APP_API_URL = "https://claimmaster-api-staging.onrender.com"
   ```

2. Update CORS settings in `app.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:3000",  # Local development
           "https://your-app.netlify.app",  # Production frontend
           "https://your-custom-domain.com",  # If using custom domain
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

3. Deploy to Netlify:
   - Connect your GitHub repository
   - Configure build settings:
     - Base directory: frontend
     - Build command: npm run build
     - Publish directory: build
   - Add environment variables in Netlify UI:
     ```
     NODE_VERSION: 18.0.0
     REACT_APP_API_URL: https://claimmaster-api.onrender.com
     ```

### Production Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend      │     │     Redis       │
│    (Netlify)    │────>│    (Render)      │────>│   (Upstash)     │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        ▲                        │
        │                        ▼
┌─────────────────┐     ┌──────────────────┐
│   User's        │     │  Perplexity AI   │
│   Browser       │     │      API         │
└─────────────────┘     └──────────────────┘
```

### Free Tier Limitations

1. **Backend (Render)**:
   - Free tier includes:
     - 750 hours/month of runtime
     - Spins down after 15 minutes of inactivity
     - Spins up automatically on new requests (may take 30s for cold starts)
     - 512MB RAM
     - Shared CPU

2. **Frontend (Netlify)**:
   - Free tier includes:
     - 100GB bandwidth/month
     - Unlimited sites
     - Build minutes
     - Continuous deployment

3. **Redis (Upstash)**:
   - Free tier includes:
     - 1 database
     - 256MB storage
     - 10,000 requests/day
     - No auto-sleep

### Performance Considerations

1. **Cold Starts**:
   - Render free tier has cold starts (30s spin-up time)
   - First request after inactivity will be slower
   - Consider implementing a warming mechanism

2. **Caching Strategy**:
   - Use Redis aggressively to minimize API calls
   - Implement client-side caching where appropriate
   - Consider browser caching for static assets

3. **Rate Limiting**:
   - Implement rate limiting to stay within free tiers
   - Monitor usage across all services
   - Set up alerts for approaching limits

## API Documentation

Access the API documentation at `/docs`