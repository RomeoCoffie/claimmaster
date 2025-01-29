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
     REACT_APP_API_URL = "YOUR_PRODUCTION_API_URL"
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Configure build settings:
     - Base directory: frontend
     - Build command: npm run build
     - Publish directory: build
   - Add environment variables in Netlify UI

### Backend Deployment

1. Set up your preferred hosting platform (e.g., Heroku, DigitalOcean)
2. Configure environment variables
3. Set up Redis instance (e.g., Redis Cloud)
4. Update CORS settings in `app.py` with your frontend domain

## API Documentation

Access the API documentation at `/docs` when running the backend server.

### Key Endpoints

- `POST /api/research`: Start research on specific influencer
- `GET /api/research/status`: Get current research status
- `POST /api/research/discover`: Discover new influencers
- `GET /api/influencers/{influencer_id}`: Get influencer details

## Caching System

The application uses Redis for caching research results:

- Cache Duration: 24 hours
- Cached Data: Complete research results
- Cache Key Format: `research:{influencer_name}`
- Graceful Fallback: System works without Redis

## Research Flow

1. **Initial Request**:
   - User submits research request
   - System checks Redis cache
   - If cached, returns immediate response

2. **Research Process**:
   - Gathering influencer data
   - Analyzing claims
   - Verifying with scientific journals
   - Calculating trust scores

3. **Progress Tracking**:
   - Real-time status updates
   - Stage progression
   - Error handling
   - Research logs

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 