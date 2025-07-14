# TrustBuddy - AI-Powered Fake Review Detection

TrustBuddy is a comprehensive fake review detection system that uses AI and machine learning to analyze review authenticity. The application consists of a FastAPI backend with ML models and a React frontend for user interaction.

## Features

- **AI-Powered Analysis**: Advanced text pattern analysis, sentiment analysis, and semantic coherence checking
- **ML Model Integration**: Machine learning models for authenticity prediction
- **Real-time Analysis**: Instant review analysis with confidence scoring
- **Visual Badge System**: Color-coded risk assessment (Green/Yellow/Red)
- **Detailed Breakdown**: Comprehensive analysis with specific recommendations
- **Multi-language Support**: Support for English, Hindi, Spanish, and French

## Project Structure

```
trustbuddy/
├── backend/                 # FastAPI backend with ML models
│   ├── core/               # Core analysis logic
│   ├── models/             # Pydantic models
│   ├── main.py             # FastAPI application
│   ├── review_analyzer.py  # ML model implementation
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── utils/          # Utility functions
│   └── package.json        # Node.js dependencies
└── README.md              # This file
```

## Quick Start

### Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server:**
   ```bash
   python main.py
   ```

   The backend will start on `http://localhost:8000`

### Frontend Setup

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm start
   ```

   The frontend will start on `http://localhost:3000`

## Usage

1. **Open your browser** and go to `http://localhost:3000`

2. **Navigate to the Trust Checker** page

3. **Enter review text** in the text area (minimum 5 characters)

4. **Click "Analyze Review"** to get instant results

5. **View the analysis results** including:
   - Confidence score and risk level
   - Text pattern analysis
   - Sentiment analysis
   - Coherence analysis
   - ML model predictions
   - Detailed recommendations

## API Endpoints

### Backend API (http://localhost:8000)

- `POST /analyze-review` - Analyze a review for authenticity
- `GET /health` - Health check endpoint
- `GET /api/info` - API information and capabilities
- `GET /docs` - Interactive API documentation (Swagger UI)

### Example API Request

```bash
curl -X POST "http://localhost:8000/analyze-review" \
  -H "Content-Type: application/json" \
  -d '{
    "review_text": "This product is absolutely amazing! I love it so much. Best purchase ever!",
    "product_name": "Sample Product",
    "language": "en"
  }'
```

## Analysis Features

### Text Pattern Analysis
- Grammar quality assessment
- Text length appropriateness
- Repetitive word detection
- Excessive punctuation analysis
- Spam keyword detection

### Sentiment Analysis
- Positive/negative/neutral sentiment scoring
- Extreme sentiment detection
- Sentiment variance analysis
- Dominant sentiment identification

### Coherence Analysis
- Semantic coherence scoring
- Product relevance checking
- Topic consistency analysis
- Sentence structure evaluation

### ML Model Analysis
- Authenticity prediction
- Model confidence scoring
- Overall assessment classification

## Development

### Backend Development

The backend uses FastAPI with the following key components:

- **FastAPI**: Modern web framework for building APIs
- **Pydantic**: Data validation and settings management
- **Transformers**: Hugging Face transformers for ML models
- **NLTK**: Natural language processing toolkit
- **TextBlob**: Sentiment analysis library

### Frontend Development

The frontend uses React with:

- **React 19**: Latest React version
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **Fetch API**: For backend communication

### Adding New Features

1. **Backend**: Add new endpoints in `main.py` and corresponding logic in `core/`
2. **Frontend**: Create new components in `src/components/` and integrate with API
3. **Models**: Update Pydantic models in `backend/models/` as needed

## Troubleshooting

### Common Issues

1. **Backend won't start:**
   - Check if Python 3.8+ is installed
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check if port 8000 is available

2. **Frontend won't start:**
   - Check if Node.js 16+ is installed
   - Ensure all dependencies are installed: `npm install`
   - Check if port 3000 is available

3. **API calls failing:**
   - Ensure backend is running on `http://localhost:8000`
   - Check browser console for CORS errors
   - Verify network connectivity

4. **ML models not loading:**
   - First run may take longer as models download
   - Check internet connection for model downloads
   - Ensure sufficient disk space for model files

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the API documentation at `http://localhost:8000/docs`
- Review the console logs for error messages
- Ensure both backend and frontend are running 