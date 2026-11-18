import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Robust NLP converter to parse spoken financial numbers (including word values and Indian scales)
const extractNumberFromTranscript = (text) => {
  if (!text) return '';
  
  // Lowercase and clean
  let cleaned = text.toLowerCase()
    .replace(/[^a-z0-9\s\.]/g, '') // remove special characters except letters, numbers, spaces, dots
    .trim();
    
  // Check if it's already just a clean digit/decimal number
  if (/^\d+(\.\d+)?$/.test(cleaned)) {
    return cleaned;
  }
  
  const wordToNumber = {
    // English words
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
    'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
    // Hinglish / Hindi words
    'ek': 1, 'do': 2, 'teen': 3, 'chaar': 4, 'char': 4, 'paanch': 5, 'panch': 5, 'chhe': 6, 'che': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'no': 9, 'das': 10,
    'gyarah': 11, 'baarah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15, 'solah': 16, 'satrah': 17, 'atharah': 18, 'unnis': 19, 'bees': 20,
    'tees': 30, 'chalis': 40, 'pachaas': 50, 'saath': 60, 'sattar': 70, 'assi': 80, 'nabbe': 90
  };
  
  const scales = {
    'thousand': 1000, 'thousands': 1000, 'k': 1000, 'hazaar': 1000, 'hazar': 1000,
    'lakh': 100000, 'lakhs': 100000, 'lac': 100000, 'lacs': 100000,
    'crore': 10000000, 'crores': 10000000,
    'million': 1000000, 'millions': 1000000,
    'billion': 1000000000, 'billions': 1000000000
  };
  
  const words = cleaned.split(/\s+/);
  let total = 0;
  let currentVal = 0;
  let isDecimal = false;
  let decimalPlace = 0.1;
  let hasNumberWords = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check if the word itself is a raw number (e.g. "10", "10.5")
    const parsedNum = parseFloat(word);
    if (!isNaN(parsedNum)) {
      currentVal = parsedNum;
      hasNumberWords = true;
      continue;
    }
    
    if (word === 'point' || word === 'dot') {
      isDecimal = true;
      continue;
    }
    
    if (wordToNumber[word] !== undefined) {
      const num = wordToNumber[word];
      hasNumberWords = true;
      if (isDecimal) {
        currentVal += num * decimalPlace;
        decimalPlace *= 0.1;
      } else {
        currentVal += num;
      }
      continue;
    }
    
    if (scales[word] !== undefined) {
      const scale = scales[word];
      hasNumberWords = true;
      // If currentVal is 0 but we have a scale, assume 1 (e.g. "lakh" -> 100000)
      if (currentVal === 0) currentVal = 1;
      total += currentVal * scale;
      currentVal = 0;
      isDecimal = false;
      decimalPlace = 0.1;
      continue;
    }
  }
  
  total += currentVal;
  
  if (hasNumberWords && total > 0) {
    return String(total);
  }
  
  // Fallback: search for first occurrence of digits/decimals in the original transcript and apply scales
  const rawMatch = text.match(/\d+(\.\d+)?/);
  if (rawMatch) {
    let matchedNum = parseFloat(rawMatch[0]);
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('lakh') || lowerText.includes('lac')) {
      matchedNum *= 100000;
    } else if (lowerText.includes('crore')) {
      matchedNum *= 10000000;
    } else if (lowerText.includes('thousand') || lowerText.includes('hazaar') || lowerText.includes('hazar')) {
      matchedNum *= 1000;
    } else if (lowerText.includes('million')) {
      matchedNum *= 1000000;
    }
    return String(matchedNum);
  }
  
  return '';
};

const VoiceInput = ({ onResult, label }) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);

  // Keep the latest callback reference in a mutable ref
  // This completely stops constant SpeechRecognition re-creations when parents re-render
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const initSpeechRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    try {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true; // Real-time feedback
      recog.lang = 'en-US';

      recog.onstart = () => {
        setIsListening(true);
        setInterimText('');
        try {
          navigator.vibrate?.(15);
        } catch (e) {}
      };

      recog.onend = () => {
        setIsListening(false);
        setInterimText('');
        try {
          navigator.vibrate?.(10);
        } catch (e) {}
      };

      recog.onerror = (event) => {
        console.error('[VoiceInput] Speech recognition error:', event.error);
        setIsListening(false);
        setInterimText('');
        
        if (event.error === 'not-allowed') {
          alert('Microphone permission is required for voice input. Please enable microphone access in your browser or device settings.');
        } else if (event.error === 'network') {
          alert('Network error: Voice input requires an active internet connection.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          alert(`Voice input error: ${event.error}`);
        }
      };

      recog.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (interimTranscript) {
          setInterimText(interimTranscript);
        }

        if (finalTranscript) {
          console.log('[VoiceInput] Final Transcript:', finalTranscript);
          const parsedNumber = extractNumberFromTranscript(finalTranscript);
          if (parsedNumber) {
            onResultRef.current(parsedNumber);
            try {
              // Delightful double success vibrate
              navigator.vibrate?.([20, 50, 20]);
            } catch (e) {}
          } else {
            console.warn('[VoiceInput] No valid numeric value could be extracted:', finalTranscript);
          }
          setInterimText('');
        }
      };

      recognitionRef.current = recog;
      return recog;
    } catch (e) {
      console.error('[VoiceInput] SpeechRecognition instantiation failed:', e);
      return null;
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = async () => {
    const recognition = initSpeechRecognition();
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please try Chrome, Safari, or ensure your browser has speech features enabled.');
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch (err) {
        console.error('[VoiceInput] Stop failed:', err);
      }
      return;
    }

    // Smart Permission Pre-check
    let isGranted = false;
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' });
        if (result.state === 'granted') {
          isGranted = true;
        }
      }
    } catch (e) {
      // Query not supported in some browsers
    }

    if (isGranted) {
      try {
        recognition.start();
        return;
      } catch (err) {
        console.error('[VoiceInput] Fast start failed, falling back:', err);
      }
    }

    // Full authorization & media spin-up flow
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // release immediately
        recognition.start();
      } catch (err) {
        console.error('[VoiceInput] Microphone authorization failed:', err);
        alert('Microphone permission is required for voice input. Please allow microphone access in your settings.');
        setIsListening(false);
      }
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error('[VoiceInput] Fallback start failed:', err);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={toggleListening}
        className={`relative p-2 rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center ${
          isListening 
            ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        title={`Speak ${label}`}
      >
        {isListening ? (
          <div className="flex items-center gap-[3px] justify-center h-4 w-4">
            <motion.span
              animate={{ scaleY: [0.4, 1.4, 0.4] }}
              transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
              className="w-[2px] h-3 bg-white rounded-full origin-center"
            />
            <motion.span
              animate={{ scaleY: [0.3, 1.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.15, ease: "easeInOut" }}
              className="w-[2px] h-3 bg-white rounded-full origin-center"
            />
            <motion.span
              animate={{ scaleY: [0.4, 1.4, 0.4] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.3, ease: "easeInOut" }}
              className="w-[2px] h-3 bg-white rounded-full origin-center"
            />
          </div>
        ) : (
          <Mic size={15} />
        )}
      </button>
      
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className="absolute right-10 whitespace-nowrap bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-[11px] px-3 py-1.5 rounded-xl shadow-xl z-50 pointer-events-none flex items-center gap-2 font-semibold"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="max-w-[160px] overflow-hidden text-ellipsis italic">
              {interimText ? `"${interimText}"` : `Listening for ${label}...`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;
