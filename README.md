# TrustBuddy

**AI-Powered Trust Verification for Bharat**  
*Your one-stop solution for safe, smart, and confident online shopping.*

---

## 🚀 Overview

TrustBuddy is a full-stack hackathon prototype designed to empower Indian consumers with AI-driven tools for verifying product authenticity, analyzing reviews, checking images, and comparing prices across multiple retailers. With multilingual support, voice input, and a beautiful modern UI, TrustBuddy is built to help users from Tier 2/3 cities shop online with confidence.

---

## ✨ Features

- **🔐 User Authentication:**  
  Modern login/signup with secure session management and a beautiful UI.

- **🌐 Multilingual Support:**  
  Full support for English, Hindi, Gujarati, Marathi, and Kannada. All analysis and UI elements are translated in real time.

- **🗣️ Voice Input:**  
  Users can speak their queries and reviews in their preferred language for analysis.
  - Verify: [View Voice Input Screenshot](./screenshots/Voice_Input.jpeg)

- **🔊 Listen to Recommendations:**  
  Users can listen to AI-generated recommendations and analysis results using built-in voice synthesis, making the platform accessible and convenient for everyone.

- **📝 Review Analysis:**  
  - Detects fake, spammy, or suspicious reviews using advanced AI.
  - Provides sentiment, grammar, and authenticity breakdowns.
  - Shows both real and fake review examples for demo and education.
  - Verify: [View Fake review analysis Screenshot](./screenshots/Fake_review_analysis.jpeg), [View Real review analysis Screenshot](./screenshots/Genuine_Reviews_analysis.jpeg)

- **🖼️ Image Verification:**  
  - Detects AI-generated or manipulated product images.
  - Flags suspicious images and confirms authentic ones.
  - Shows both real and fake image examples.
  - Verify: [View Fake image analysis Screenshot](./screenshots/Fake_image_analysis.jpeg), [View Real image analysis Screenshot](./screenshots/Real_image_analysis.jpeg)

- **🔗 Product Link Analysis:**  
  - Paste any product URL to analyze the entire product page.
  - Extracts reviews, checks seller credibility, and provides a comprehensive trust score.
  - Gives clear risk level, recommendations, and highlights issues.
  - Handles unsupported sites (e.g., with CAPTCHA) gracefully, informing users and suggesting alternatives.
  - Verify: [View Product link analysis Screenshot](./screenshots/Product_link_analysis.jpeg)

- **🏷️ Product Name Context:**  
  - Product name is used as context to improve the accuracy of review and image analysis.

- **💸 Price Comparison:**  
  - Compares prices across multiple Indian retailers.
  - Detects inflated, fair, or bargain prices.
  - Suggests alternate products within your budget.
  - Provides direct links to retailer websites for easy verification and purchase.
  - Verify: [View Price Comparison Screenshot](./screenshots/Price_comparison.jpeg), [View Alternate Price Screenshot](./screenshots/Alternate_price.jpeg)

- **📊 Analytics & User History:**  
  - Logged-in users can view their analysis history.
  - Visualizes confidence score trends and risk level distribution.

- **📱 Mobile Responsive:**  
  - Fully responsive design for seamless use on any device.

- **⚡ Modern UI/UX:**  
  - Glass-morphism, smooth animations, and intuitive navigation.

---

## 🏆 Why TrustBuddy is a Hackathon Winner

- **Solves a real, large-scale problem for Indian consumers.**
- **Inclusive:** Multilingual and voice support for Bharat’s diverse population.
- **AI-first:** Uses state-of-the-art models for review, image, and price analysis.
- **User-centric:** Friendly error handling, analytics, and actionable recommendations.
- **Demo-ready:** Real and fake examples, clear flows, and beautiful design.

---

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, Chart.js, Lucide Icons, i18n
- **Backend:** FastAPI, Python, MongoDB, Gradio Client, Gemini API, PIL, requests, httpx
- **AI/ML:** Custom review analyzer, image authenticity detection, Gemini for translation
- **Other:** Netlify (for deployment), REST APIs, JWT/localStorage for auth

---

## 🖥️ Setup & Installation

### **1. Clone the repository**
```bash
git clone https://github.com/yourusername/trustbuddy.git
cd trustbuddy
```

### **2. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Set up your .env file with Gemini API key and MongoDB URI
uvicorn main:app --reload
```
  
### **3. Frontend Setup**
```bash
cd ../frontend
npm install
npm start
```

### **4. Access the App**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

**If the backend is not running, please refresh this link: [https://trustbuddy-backend.onrender.com/](https://trustbuddy-backend.onrender.com/)**

---

## 🧑‍💻 Usage

1. **Sign up or log in.**
2. **Select your preferred language.**
3. **Choose a feature tab:**
   - Review Analysis
   - Image Verification
   - Product Link Analysis
   - Price Comparison
4. **Enter product name for context (recommended).**
5. **Paste reviews, upload images, or enter URLs as needed.**
6. **View results, recommendations, and analytics.**
7. **Try voice input or switch languages for a personalized experience.**

---

## 🎥 Demo

Demo Video: https://youtu.be/3t3K_N9F_0A

---

## ⚠️ Limitations

- Product link analysis may not work on sites with strict anti-bot/CAPTCHA protection (user is informed gracefully).
- AI models are optimized for Indian e-commerce but may have edge cases.
- Prototype: Some features may be rate-limited or use free-tier APIs.

---

## 🗺️ Roadmap

- Add support for more e-commerce platforms.
- Integrate more Indian languages.
- Enhance AI models for even better accuracy.
- Add browser extension and WhatsApp bot integration.
- Enable user feedback and crowdsourced trust signals.

---

## 🤝 Contributing

Pull requests and suggestions are welcome!  
Please open an issue to discuss your ideas or report bugs.

---

## 👥 Team

- TeameName : Team TrustIQ
- Akshita Chauhan

---

## 📄 License

MIT License

---

## 📬 Contact

For questions, feedback, or partnership inquiries:  
**Email:** aakshita_be22@thapar.edu
**GitHub:** [github.com/Akshita1414/Team-TrustBuddy](https://github.com/Akshita1414/Team-TrustBuddy)

---

**Let’s make online shopping safer for everyone in Bharat!** 
