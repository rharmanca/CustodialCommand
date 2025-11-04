import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { inspectionCategories } from '../../shared/custodial-criteria';

interface VoiceRatingInputProps {
  onRatingsUpdate: (ratings: Record<string, number>) => void;
  currentRatings?: Record<string, number>;
  disabled?: boolean;
}

// Speech recognition types
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceRatingInput({ onRatingsUpdate, currentRatings = {}, disabled = false }: VoiceRatingInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedRatings, setParsedRatings] = useState<Record<string, number>>({});
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check for browser support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece + ' ';
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);

        // Parse ratings from transcript
        if (finalTranscript) {
          const ratings = parseRatings(finalTranscript);
          if (Object.keys(ratings).length > 0) {
            setParsedRatings(prev => ({ ...prev, ...ratings }));
            onRatingsUpdate({ ...parsedRatings, ...ratings });
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setError(`Error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onRatingsUpdate, parsedRatings]);

  const parseRatings = (text: string): Record<string, number> => {
    const ratings: Record<string, number> = {};
    const lowerText = text.toLowerCase();

    // Category name mappings (spoken form -> database key)
    const categoryMappings: Record<string, string> = {
      'floor': 'floors',
      'floors': 'floors',
      'floor surface': 'floorSurfaces',
      'floor surfaces': 'floorSurfaces',
      'surfaces': 'floorSurfaces',
      'ceiling': 'ceilings',
      'ceilings': 'ceilings',
      'wall': 'walls',
      'walls': 'walls',
      'surface': 'surfaces',
      'horizontal surface': 'surfaces',
      'horizontal surfaces': 'surfaces',
      'fixture': 'fixtures',
      'fixtures': 'fixtures',
      'dispenser': 'dispensers',
      'dispensers': 'dispensers',
      'trash': 'trash',
      'trash can': 'trash',
      'trash cans': 'trash',
      'lighting': 'lighting',
      'light': 'lighting',
      'lights': 'lighting',
      'hvac': 'hvac',
      'air conditioning': 'hvac',
      'ac': 'hvac',
      'overall': 'overallAppearance',
      'overall appearance': 'overallAppearance',
      'appearance': 'overallAppearance'
    };

    // Number word mappings
    const numberWords: Record<string, number> = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'won': 1, 'to': 2, 'too': 2, 'for': 4, 'fore': 4
    };

    // Pattern: "floors 3", "ceiling four", "walls is 5"
    const patterns = [
      /\b(floor|ceiling|wall|surface|fixture|dispenser|trash|lighting|light|hvac|ac|overall|appearance)s?\s+(?:is\s+)?(\d|zero|one|two|three|four|five|won|to|too|for|fore)\b/gi,
      /\b(\d|zero|one|two|three|four|five|won|to|too|for|fore)\s+(?:for\s+)?(?:the\s+)?(floor|ceiling|wall|surface|fixture|dispenser|trash|lighting|light|hvac|ac|overall|appearance)s?\b/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(lowerText)) !== null) {
        const [, first, second] = match;

        // Determine which is category and which is number
        let categoryName = '';
        let ratingValue = 0;

        if (isNaN(Number(first))) {
          // first is category, second is number
          categoryName = first.trim();
          ratingValue = numberWords[second.toLowerCase()] ?? parseInt(second);
        } else {
          // first is number, second is category
          categoryName = second.trim();
          ratingValue = numberWords[first.toLowerCase()] ?? parseInt(first);
        }

        // Map spoken category to database key
        const dbKey = categoryMappings[categoryName];

        if (dbKey && ratingValue >= 0 && ratingValue <= 5) {
          ratings[dbKey] = ratingValue;
        }
      }
    });

    return ratings;
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const clearRatings = () => {
    setParsedRatings({});
    setTranscript('');
    onRatingsUpdate({});
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            Voice Input Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support voice recognition. Please use Chrome on Android or Safari on iOS.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={isListening ? 'border-green-500 bg-green-50' : 'border-gray-200'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isListening ? <Volume2 className="h-5 w-5 text-green-600 animate-pulse" /> : <Mic className="h-5 w-5" />}
            Voice Rating Input
          </span>
          {Object.keys(parsedRatings).length > 0 && (
            <Badge variant="secondary">{Object.keys(parsedRatings).length} ratings captured</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Speak your ratings naturally, for example: "floors 3, ceiling 4, walls 5"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Voice Input
              </>
            )}
          </Button>
          {Object.keys(parsedRatings).length > 0 && (
            <Button type="button" variant="outline" onClick={clearRatings}>
              Clear Ratings
            </Button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Transcript display */}
        {transcript && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm font-medium mb-1">Heard:</p>
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        )}

        {/* Parsed ratings display */}
        {Object.keys(parsedRatings).length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium mb-2">Recognized Ratings:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(parsedRatings).map(([key, value]) => {
                const category = inspectionCategories.find(c => c.key === key);
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{category?.label || key}:</span>
                    <Badge variant={value >= 3 ? 'default' : 'destructive'}>{value}/5</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Usage tips */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium mb-1">Tips:</p>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Speak clearly and at a normal pace</li>
            <li>Say category name followed by number (0-5)</li>
            <li>You can say multiple ratings in one sentence</li>
            <li>Examples: "floors 3", "ceiling is 4", "walls five"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
