// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  
  if (request.action === 'getAnswers') {
    getAnswers(request.apiKey)
      .then(answers => sendResponse({ success: true, answers: answers }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function getAnswers(apiKey) {
  try {
    // Detect form type and get questions
    const questions = detectAndExtractQuestions();
    
    if (questions.length === 0) {
      throw new Error('No form questions found on this page');
    }
    
    console.log('Found questions:', questions.length);
    console.log('Questions data:', questions);
    
    // Process all questions in one batch
    const answers = await processAllQuestionsAtOnce(questions, apiKey);
    
    console.log('All questions processed successfully');
    return answers;
  } catch (error) {
    console.error('Error getting answers:', error);
    throw error;
  }
}

async function processAllQuestionsAtOnce(questions, apiKey) {
  console.log('Processing all questions in single API call...');
  
  // Build combined prompt with all questions
  let combinedPrompt = 'Please answer all the following questions. For multiple choice questions, provide the COMPLETE TEXT of the correct answer option, not just the number. For open-ended questions, provide brief accurate answers.\n\nFormat your response as:\nQ1: [complete answer text]\nQ2: [complete answer text]\n...\n\n';
  
  questions.forEach((q, index) => {
    combinedPrompt += `Q${index + 1}: ${q.text}\n\n`;
  });
  
  console.log('Combined prompt:\n', combinedPrompt);
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable assistant. For multiple choice questions, provide the COMPLETE TEXT of the correct answer, not just a number. Be concise and accurate.'
          },
          {
            role: 'user',
            content: combinedPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      throw new Error(`API error: ${errorMessage}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    console.log('AI Response:\n', aiResponse);
    
    // Parse the AI response to extract individual answers
    const answers = parseAIResponse(aiResponse, questions);
    
    return answers;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw new Error(`Failed to get AI answers: ${error.message}`);
  }
}

function parseAIResponse(aiResponse, questions) {
  const answers = [];
  
  // Try to match Q[number]: format
  const answerMap = {};
  const lines = aiResponse.split('\n');
  
  let currentQ = null;
  let currentAnswer = '';
  
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    
    // Check if this line starts with Q[number]:
    const match = line.match(/^Q(\d+):\s*(.*)$/i);
    if (match) {
      // Save previous answer if exists
      if (currentQ !== null) {
        answerMap[currentQ] = currentAnswer.trim();
      }
      // Start new answer
      currentQ = parseInt(match[1]);
      currentAnswer = match[2];
    } else if (currentQ !== null) {
      // Continue current answer
      currentAnswer += ' ' + line;
    }
  });
  
  // Save last answer
  if (currentQ !== null) {
    answerMap[currentQ] = currentAnswer.trim();
  }
  
  console.log('Parsed answer map:', answerMap);
  
  // Build answers array
  questions.forEach((q, index) => {
    const qNum = index + 1;
    let answer = answerMap[qNum] || 'No answer provided';
    
    answers.push({
      question: q.cleanText || q.text,
      answer: answer,
      element: q.element
    });
  });
  
  return answers;
}

function detectAndExtractQuestions() {
  const questions = [];
  
  // Google Forms detection
  const googleFormQuestions = document.querySelectorAll('[role="listitem"]');
  if (googleFormQuestions.length > 0) {
    console.log('Detected Google Forms - found', googleFormQuestions.length, 'list items');
    googleFormQuestions.forEach((item, index) => {
      const questionData = extractGoogleFormQuestion(item);
      if (questionData) {
        console.log(`Question ${index + 1}:`, questionData.cleanText.substring(0, 100) + '...');
        questions.push({
          index: index,
          text: questionData.text,
          cleanText: questionData.cleanText,
          element: item,
          platform: 'google'
        });
      }
    });
  }
  
  // Microsoft Forms detection
  const msFormQuestions = document.querySelectorAll('[data-automation-id="questionItem"]');
  if (msFormQuestions.length > 0) {
    console.log('Detected Microsoft Forms - found', msFormQuestions.length, 'questions');
    msFormQuestions.forEach((item, index) => {
      const questionData = extractMSFormQuestion(item);
      if (questionData) {
        console.log(`Question ${index + 1}:`, questionData.cleanText.substring(0, 100) + '...');
        questions.push({
          index: index,
          text: questionData.text,
          cleanText: questionData.cleanText,
          element: item,
          platform: 'microsoft'
        });
      }
    });
  }
  
  // Generic form detection (any form with inputs)
  if (questions.length === 0) {
    console.log('Attempting generic form detection');
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input:not([type="submit"]):not([type="hidden"]):not([type="button"]), textarea, select');
      inputs.forEach((input, index) => {
        const label = findLabelForInput(input);
        if (label) {
          const cleanLabel = label.replace(/\*/g, '').trim();
          questions.push({
            index: index,
            text: label,
            cleanText: cleanLabel,
            element: input,
            platform: 'generic'
          });
        }
      });
    });
  }
  
  console.log(`\nTotal questions found: ${questions.length}`);
  return questions;
}

function extractGoogleFormQuestion(item) {
  const questionDiv = item.querySelector('[role="heading"]');
  if (!questionDiv) {
    return null;
  }
  
  // Get the entire text content including options
  let text = item.innerText.trim();
  
  // Clean up text: remove asterisks and excessive whitespace
  let cleanText = text
    .replace(/\*/g, '')  // Remove asterisks
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with 2
    .trim();
  
  return {
    text: text,
    cleanText: cleanText
  };
}

function extractMSFormQuestion(item) {
  const questionDiv = item.querySelector('[data-automation-id="questionTitle"]');
  if (!questionDiv) {
    return null;
  }
  
  // Get the entire question item text including options
  let text = item.innerText.trim();
  
  // Clean up text: remove asterisks and excessive whitespace
  let cleanText = text
    .replace(/\*/g, '')  // Remove asterisks
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with 2
    .trim();
  
  return {
    text: text,
    cleanText: cleanText
  };
}

function findLabelForInput(input) {
  // Try to find associated label
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.innerText.trim();
  }
  
  // Try to find parent label
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.innerText.trim();
  
  // Try to find previous sibling label
  let prev = input.previousElementSibling;
  while (prev) {
    if (prev.tagName === 'LABEL' || prev.innerText) {
      return prev.innerText.trim();
    }
    prev = prev.previousElementSibling;
  }
  
  // Try placeholder
  if (input.placeholder) return input.placeholder;
  
  // Try name attribute
  if (input.name) return input.name.replace(/_/g, ' ');
  
  return null;
}