# 🤖 AI Form Helper

## 📖 Description

**AI Form Helper** is a Chrome extension that automatically answers form questions using AI. It detects questions from Google Forms, Microsoft Forms, and generic web forms, sends them to Groq AI for intelligent answers, and get the responses. The extension uses the Groq API with the LLaMA 3.3 70B model to provide accurate answers for multiple-choice questions, text inputs, and calculations.

## ✨ Features

- 🔍 **Smart Form Detection**: Automatically detects questions from Google Forms, Microsoft Forms, and standard HTML forms
- 🧠 **AI-Powered Answers**: Uses Groq AI (LLaMA 3.3 70B) to generate accurate answers for:
  - Multiple choice questions (single and multiple selection)
  - Short answer questions
  - Long answer questions
  - Mathematical calculations
  - Technical/coding questions
- 📋 **Copy Answers**: Copy individual answers or all answers at once
- 💾 **API Key Storage**: Securely stores your Groq API key locally
- 📱 **Side Panel UI**: Extension opens as a side panel that stays open while you work on the form

## 🚀 Installation

### Option 1: Install from Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store soon.

### Option 2: Load as Unpacked Extension (For Development/Testing)

1. **Clone the repository**:
    ```bash
    git clone https://github.com/FSfarhaan/ai-form-helper.git
    ```

2. **Get a Groq API Key**:
    - Visit [console.groq.com](https://console.groq.com)
    - Sign up for a free account
    - Generate an API key

3. **Load the extension in Chrome**:
    - Open Chrome and navigate to `chrome://extensions/`
    - Enable **Developer mode** (toggle in the top-right corner)
    - Click **Load unpacked**
    - Select the cloned repository folder
    - The extension icon should appear in your Chrome toolbar

4. **Pin the extension** (Optional but recommended):
    - Click the puzzle piece icon in Chrome toolbar
    - Find "AI Form Helper" and click the pin icon

## 🛠️ Usage

1. **Set up your API key**:
    - Click the extension icon to open the side panel
    - Enter your Groq API key in the input field
    - Click "Save API Key"

2. **Navigate to a form**:
    - Go to any Google Form, Microsoft Form, or web form
    - Click the extension icon to open the side panel

3. **Get AI answers**:
    - Click "Get Answers" button
    - Wait for the AI to analyze and answer all questions
    - View the answers in the side panel

4. **Copy answers** (Optional):
    - Click "Copy Answer" on individual questions to copy specific answers
    - Click "Copy All Answers" to copy all answers at once

## 📁 Project Structure

```
ai-form-helper/
├── manifest.json          # Extension configuration
├── popup.html            # Side panel UI
├── popup.js              # Side panel logic
├── content.js            # Form detection and auto-fill logic
├── background.js         # Extension background service
└── README.md            # This file
```

## 🧩 Code Overview

### Main Components

- **manifest.json**: Defines extension permissions, side panel configuration, and metadata
- **popup.html**: User interface for the side panel with API key input and control buttons
- **popup.js**: Handles user interactions, API key storage, and communication with content script
- **content.js**: 
  - Detects form questions from various platforms
  - Sends questions to Groq AI API
  - Parses AI responses
- **background.js**: Manages extension lifecycle and side panel opening

## 🔧 Technical Details

- **API**: Groq API (https://api.groq.com)
- **AI Model**: LLaMA 3.3 70B Versatile
- **Supported Forms**: 
  - Google Forms (role="listitem" structure)
  - Microsoft Forms (data-automation-id attributes)
  - Generic HTML forms (standard form elements)
- **Storage**: Chrome Storage Sync API for API key persistence
- **UI Pattern**: Chrome Side Panel API for persistent interface

## 🎯 Supported Question Types

- ✅ Multiple choice (single answer)
- ✅ Multiple choice (multiple answers)
- ✅ Short text input
- ✅ Long text input (textarea)
- ✅ Dropdown/select menus
- ✅ Mathematical calculations
- ✅ Technical/coding questions

## 🔐 Privacy & Security

- API keys are stored locally using Chrome's secure storage
- No data is sent to any server except Groq API
- Form data is only processed locally in your browser
- The extension only activates when you click "Get Answers"

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add new feature'`)
5. Push to the branch (`git push origin feature/improvement`)
6. Create a Pull Request

## 📋 Requirements

- Chrome browser (version 114 or higher for Side Panel API)
- Groq API key (free tier available)
- Active internet connection

## 🐛 Known Issues

- Some custom-styled forms may not be detected automatically
- Very long forms (50+ questions) may hit API token limits
- Rate limiting: 30 requests per minute on free Groq tier

## 📝 Future Enhancements

- Support for more form platforms (Typeform, JotForm, etc.)
- To make the form autofilled by the responses received.
- Image recognition for questions with images
- Custom AI model selection

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

For questions, suggestions, or issues:
- Create an issue on GitHub
- Email: farhaan8d@gmail.com
- LinkedIn: [Your LinkedIn Profile](https://www.linkedin.com/in/fsfarhaanshaikh)

## ⚠️ Disclaimer

This tool is designed for educational and productivity purposes. Users are responsible for ensuring their use complies with the terms of service of the forms they interact with. Do not use this tool to violate academic integrity policies or for unethical purposes.

---

**Made with ❤️ to help save time on form filling**
