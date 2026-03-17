// OpenRouter API Configuration
const OPENROUTER_API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Conversation history for context
let conversationHistory = [
    {
        role: 'system',
        content: 'You are JARVIS, Tony Stark\'s AI assistant. You are helpful, intelligent, witty, and efficient. Keep responses very concise (1-2 sentences max). When asked to open websites, search, or perform actions, acknowledge briefly. Be professional but friendly. Address the user as "sir".'
    }
];

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

// Speech Synthesis Setup
const synth = window.speechSynthesis;

// DOM Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const voiceStatus = document.getElementById('voiceStatus');
const speechStatus = document.getElementById('speechStatus');
const commandCount = document.getElementById('commandCount');
const currentCommand = document.getElementById('currentCommand');
const activityLog = document.getElementById('activityLog');
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');

let commandCounter = 0;
let isListening = false;

// Update clock
function updateClock() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// Speak function
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    synth.speak(utterance);
}

// Add to activity log
function addToLog(text, type = 'user') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = text;
    activityLog.appendChild(entry);
    activityLog.scrollTop = activityLog.scrollHeight;
    
    if (type === 'user') {
        commandCounter++;
        commandCount.textContent = commandCounter;
    }
}

// Process commands with AI
async function processCommand(command) {
    const lowerCommand = command.toLowerCase();
    addToLog(`USER: ${command}`, 'user');
    currentCommand.textContent = 'Processing...';
    
    // Check for action commands first
    let actionTaken = false;
    
    // YouTube commands
    if (lowerCommand.includes('youtube') || lowerCommand.includes('play')) {
        handleYouTubeCommand(lowerCommand);
        actionTaken = true;
    }
    // Google search
    else if (lowerCommand.includes('search') || lowerCommand.includes('google')) {
        handleSearchCommand(lowerCommand);
        actionTaken = true;
    }
    // Open website
    else if (lowerCommand.includes('open') && lowerCommand.includes('.com')) {
        handleOpenWebsite(lowerCommand);
        actionTaken = true;
    }
    // Time
    else if (lowerCommand.includes('time')) {
        handleTimeCommand();
        return;
    }
    // Date
    else if (lowerCommand.includes('date') || lowerCommand.includes('today')) {
        handleDateCommand();
        return;
    }
    // Weather
    else if (lowerCommand.includes('weather')) {
        handleWeatherCommand();
        actionTaken = true;
    }
    
    // Only get AI response if no action was taken OR if it's a conversational command
    if (!actionTaken || lowerCommand.includes('jarvis') || lowerCommand.includes('tell me') || lowerCommand.includes('what') || lowerCommand.includes('how') || lowerCommand.includes('who')) {
        try {
            const aiResponse = await getAIResponse(command);
            speak(aiResponse);
            addToLog(`JARVIS: ${aiResponse}`, 'jarvis');
        } catch (error) {
            // Only show error for non-action commands
            if (!actionTaken) {
                const errorMsg = 'I apologize, sir. I am experiencing connectivity issues. Please check the console for details.';
                speak(errorMsg);
                addToLog(`JARVIS: ${errorMsg}`, 'system');
            } else {
                // For action commands, just acknowledge silently
                const ackMsg = 'Opening as requested, sir.';
                speak(ackMsg);
                addToLog(`JARVIS: ${ackMsg}`, 'jarvis');
            }
        }
    } else {
        // Action taken, just acknowledge
        const ackMsg = 'Opening as requested, sir.';
        speak(ackMsg);
        addToLog(`JARVIS: ${ackMsg}`, 'jarvis');
    }
    
    currentCommand.textContent = 'Listening for commands...';
}

function handleYouTubeCommand(command) {
    // Remove command keywords but preserve the actual search query
    let searchQuery = command
        .replace(/^jarvis/gi, '')
        .replace(/^hey jarvis/gi, '')
        .replace(/youtube/gi, '')
        .replace(/^play/gi, '')
        .replace(/^open/gi, '')
        .replace(/^go to/gi, '')
        .replace(/video/gi, '')
        .replace(/song/gi, '')
        .trim();
    
    // If there's a search query, use it
    if (searchQuery && searchQuery.length > 2) {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        window.open(url, 'youtube', 'width=1200,height=800,left=100,top=100');
        console.log('Opening YouTube with query:', searchQuery);
    } else {
        // Just open YouTube homepage if no clear query
        window.open('https://www.youtube.com', 'youtube', 'width=1200,height=800,left=100,top=100');
        console.log('Opening YouTube homepage');
    }
}

function handleSearchCommand(command) {
    const searchQuery = command
        .replace(/search/gi, '')
        .replace(/google/gi, '')
        .replace(/for/gi, '')
        .replace(/about/gi, '')
        .trim();
    
    if (searchQuery) {
        const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        window.open(url, 'search', 'width=1200,height=800,left=100,top=100');
    }
}

function handleOpenWebsite(command) {
    const urlMatch = command.match(/([a-z0-9]+\.com)/i);
    if (urlMatch) {
        const url = `https://${urlMatch[1]}`;
        window.open(url, 'website', 'width=1200,height=800,left=100,top=100');
    }
}

function handleTimeCommand() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    const response = `It is currently ${timeString}, sir.`;
    speak(response);
    addToLog(`JARVIS: ${response}`, 'jarvis');
    currentCommand.textContent = 'Listening for commands...';
}

function handleDateCommand() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const response = `Today is ${dateString}, sir.`;
    speak(response);
    addToLog(`JARVIS: ${response}`, 'jarvis');
    currentCommand.textContent = 'Listening for commands...';
}

function handleWeatherCommand() {
    window.open('https://www.weather.com', 'weather', 'width=1200,height=800,left=100,top=100');
}

// Call OpenRouter AI
async function getAIResponse(userMessage) {
    try {
        // Add user message to history
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        console.log('Sending request to OpenRouter API...');
        console.log('Model: qwen/qwen-2-7b-instruct:free');
        console.log('Message:', userMessage);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost',
                'X-Title': 'JARVIS-OS'
            },
            body: JSON.stringify({
                model: 'qwen/qwen-2-7b-instruct:free',
                messages: conversationHistory,
                max_tokens: 100,
                temperature: 0.7
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Unexpected API response structure:', data);
            throw new Error('Invalid API response format');
        }
        
        const aiResponse = data.choices[0].message.content;
        console.log('AI Response:', aiResponse);

        // Add AI response to history
        conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });

        // Keep conversation history manageable (last 10 messages)
        if (conversationHistory.length > 11) {
            conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-10)];
        }

        return aiResponse;
    } catch (error) {
        console.error('AI Error Details:', error);
        
        // Remove the failed user message from history
        conversationHistory.pop();
        
        throw error;
    }
}

let isRecognitionActive = false;
let restartTimeout = null;

// Recognition event handlers
recognition.onstart = () => {
    isRecognitionActive = true;
    isListening = true;
    statusText.textContent = 'LISTENING';
    statusDot.classList.add('active');
    voiceStatus.textContent = 'Online';
};

recognition.onresult = (event) => {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript;
    
    if (event.results[last].isFinal) {
        console.log('Final transcript:', transcript);
        processCommand(transcript);
        currentCommand.textContent = 'Listening for commands...';
    } else {
        // Show interim results
        currentCommand.textContent = transcript;
        console.log('Interim transcript:', transcript);
    }
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isRecognitionActive = false;
    
    if (event.error === 'no-speech') {
        // Silently restart on no-speech
        return;
    }
    
    if (event.error === 'aborted') {
        return;
    }
    
    addToLog(`Error: ${event.error}`, 'system');
};

recognition.onend = () => {
    isRecognitionActive = false;
    
    // Auto-restart to keep listening continuously
    if (isListening) {
        clearTimeout(restartTimeout);
        restartTimeout = setTimeout(() => {
            if (!isRecognitionActive && isListening) {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition restart error:', e);
                    // Try again after a longer delay
                    setTimeout(() => {
                        if (!isRecognitionActive && isListening) {
                            recognition.start();
                        }
                    }, 1000);
                }
            }
        }, 300);
    }
};

// Auto-start on load
window.addEventListener('load', () => {
    statusText.textContent = 'INITIALIZING';
    speechStatus.textContent = 'Online';
    addToLog('J.A.R.V.I.S OS initialized', 'system');
    
    // Request microphone permission and start
    setTimeout(() => {
        try {
            recognition.start();
            setTimeout(() => {
                speak('JARVIS operating system online. All systems operational.');
            }, 500);
        } catch (e) {
            addToLog('Please allow microphone access and refresh', 'system');
            statusText.textContent = 'AWAITING PERMISSION';
        }
    }, 1000);
});
