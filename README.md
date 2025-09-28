# Community Page with Sentiment Analysis

A full-stack social media application with real-time sentiment analysis and content moderation using deep learning.

## Features

- Real-time sentiment analysis of posts and comments
- Content moderation and warning system
- Topic detection and categorization
- User authentication and authorization
- Responsive UI with real-time updates
- Image upload and processing
- Advanced NLP using multiple models (Deepseek, AFINN, VADER)

## Tech Stack

### Frontend
- React.js
- TailwindCSS
- DaisyUI
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- Natural.js (NLP)
- Ollama (Local LLM)
- Sentiment Analysis Libraries

### ML/AI
- Deepseek-r1 model
- AFINN lexicon
- VADER sentiment analysis
- Custom content moderation

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd community-page
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:
Create `.env` files in both frontend and backend directories with the required configurations.

4. Start the development servers:
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd ../frontend
npm run dev
```

5. Set up Ollama:
- Install Ollama
- Pull the deepseek-r1 model:
```bash
ollama pull deepseek-r1
```

## Project Structure
community-page/
├── frontend/ # React frontend
├── backend/ # Node.js backend
│ ├── controllers/ # Route controllers
│ ├── models/ # MongoDB models
│ ├── utils/ # Utility functions
│ └── routes/ # API routes
├── .streamlit/ # Streamlit configuration
└── model_outputs/ # ML model outputs


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.