// Load saved API key
chrome.storage.sync.get(['groqApiKey'], function(result) {
  if (result.groqApiKey) {
    document.getElementById('apiKey').value = result.groqApiKey;
  }
});

// Save API key
document.getElementById('saveKey').addEventListener('click', function() {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  chrome.storage.sync.set({ groqApiKey: apiKey }, function() {
    showStatus('✅ API Key saved successfully!', 'success');
    setTimeout(() => {
      hideStatus();
    }, 3000);
  });
});

// Get answers
document.getElementById('startBtn').addEventListener('click', async function() {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiKey) {
    showStatus('❌ Please enter and save your Groq API key first', 'error');
    return;
  }
  
  const startBtn = document.getElementById('startBtn');
  const answersContainer = document.getElementById('answersContainer');
  const controls = document.getElementById('controls');
  
  startBtn.disabled = true;
  startBtn.innerHTML = '<span class="loader"></span>Getting Answers...';
  
  // Clear previous answers
  answersContainer.innerHTML = '';
  answersContainer.style.display = 'none';
  controls.classList.remove('show');
  
  showStatus('🔍 Analyzing form...', 'info');
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log('Content script injected');
      // Wait for script to initialize
      await sleep(1000);
    } catch (e) {
      console.log('Content script might already be injected:', e.message);
      // Wait a bit anyway
      await sleep(300);
    }
    
    // Send message to content script to get answers
    chrome.tabs.sendMessage(tab.id, { 
      action: 'getAnswers',
      apiKey: apiKey
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        showStatus('❌ Error: Please refresh the page and try again', 'error');
        startBtn.disabled = false;
        startBtn.innerHTML = '🔍 Get Answers';
        return;
      }
      
      if (response && response.success) {
        displayAnswers(response.answers);
        showStatus(`✅ Found ${response.answers.length} questions!`, 'success');
        controls.classList.add('show');
      } else {
        const errorMsg = response?.error || 'Failed to get answers';
        
        if (errorMsg.includes('Rate limit')) {
          showStatus('⏱️ Rate limit reached. Please wait and try again.', 'error');
        } else {
          showStatus('❌ ' + errorMsg, 'error');
        }
      }
      
      startBtn.disabled = false;
      startBtn.innerHTML = '🔍 Get Answers';
    });
  } catch (error) {
    console.error('Error:', error);
    showStatus('❌ Error: ' + error.message, 'error');
    startBtn.disabled = false;
    startBtn.innerHTML = '🔍 Get Answers';
  }
});

// Copy all answers
document.getElementById('copyAllBtn').addEventListener('click', function() {
  const answersContainer = document.getElementById('answersContainer');
  const questionItems = answersContainer.querySelectorAll('.question-item');
  
  let textToCopy = '';
  questionItems.forEach((item, index) => {
    const questionText = item.querySelector('.question-text').textContent;
    const answerText = item.querySelector('.answer-text').textContent.replace('Answer: ', '');
    textToCopy += `Q${index + 1}: ${questionText}\nA${index + 1}: ${answerText}\n\n`;
  });
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    showStatus('✅ All answers copied to clipboard!', 'success');
    setTimeout(() => hideStatus(), 2000);
  }).catch(err => {
    showStatus('❌ Failed to copy', 'error');
  });
});

function displayAnswers(answers) {
  const container = document.getElementById('answersContainer');
  container.innerHTML = '';
  container.style.display = 'block';
  
  answers.forEach((qa, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    
    const questionNumber = document.createElement('div');
    questionNumber.className = 'question-number';
    questionNumber.innerHTML = `Question ${index + 1}`;
    
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.textContent = qa.question;
    
    const answerLabel = document.createElement('div');
    answerLabel.className = 'answer-label';
    answerLabel.textContent = 'Answer:';
    
    const answerText = document.createElement('div');
    answerText.className = 'answer-text';
    answerText.textContent = formatAnswer(qa);
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '📋 Copy Answer';
    copyBtn.onclick = () => copyAnswer(qa, copyBtn);
    
    questionDiv.appendChild(questionNumber);
    questionDiv.appendChild(questionText);
    questionDiv.appendChild(answerLabel);
    questionDiv.appendChild(answerText);
    questionDiv.appendChild(copyBtn);
    
    container.appendChild(questionDiv);
  });
}

function formatAnswer(qa) {
  if (qa.options && qa.options.length > 0) {
    // For MCQ questions, show the selected option(s)
    if (qa.selectedOptions && qa.selectedOptions.length > 0) {
      const selectedTexts = qa.selectedOptions.map(idx => qa.options[idx]);
      return selectedTexts.join(', ');
    }
  }
  return qa.answer;
}

function getTypeLabel(type) {
  const labels = {
    'radio': 'Single Choice',
    'checkbox': 'Multiple Choice',
    'select': 'Dropdown',
    'textarea': 'Long Answer',
    'text': 'Short Answer'
  };
  return labels[type] || type;
}

function copyAnswer(qa, button) {
  const answer = formatAnswer(qa);
  navigator.clipboard.writeText(answer).then(() => {
    const originalText = button.textContent;
    button.textContent = '✓ Copied!';
    button.style.background = 'rgba(76, 175, 80, 0.4)';
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
}

function hideStatus() {
  const status = document.getElementById('status');
  status.className = 'status';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}