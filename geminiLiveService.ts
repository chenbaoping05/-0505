import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
  FunctionDeclaration,
  Schema
} from '@google/genai';
import { HandGestureState } from '../types';

// Define the tool for the model to call
const gestureTool: FunctionDeclaration = {
  name: 'updateGestureState',
  description: 'Updates the state of the 3D Christmas Tree based on the user\'s hand gesture.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      isUnleashed: {
        type: Type.BOOLEAN,
        description: 'True if hand is open/spread (chaos mode). False if hand is closed/fist or neutral (tree mode).',
      },
      handX: {
        type: Type.NUMBER,
        description: 'Horizontal position of the hand in the frame, from -1 (left) to 1 (right).',
      },
      handY: {
        type: Type.NUMBER,
        description: 'Vertical position of the hand in the frame, from -1 (bottom) to 1 (top).',
      },
    },
    required: ['isUnleashed', 'handX', 'handY'],
  } as Schema,
};

export class GeminiLiveController {
  private client: GoogleGenAI;
  private session: any = null; // Session type isn't fully exported, using any for safety
  private onStateUpdate: (state: HandGestureState) => void;

  constructor(apiKey: string, onStateUpdate: (state: HandGestureState) => void) {
    this.client = new GoogleGenAI({ apiKey });
    this.onStateUpdate = onStateUpdate;
  }

  async connect(videoElement: HTMLVideoElement) {
    try {
      // 1. Setup Live Session
      const sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO], // We mostly care about the tool calls
          tools: [{ functionDeclarations: [gestureTool] }],
          systemInstruction: `
            You are a real-time gesture controller for a 3D art installation.
            Analyze the video stream continuously.
            1. If the user's hand is OPEN WIDE or waving frantically, call updateGestureState with isUnleashed=true.
            2. If the user's hand is CLOSED, a FIST, or calm/neutral, call updateGestureState with isUnleashed=false.
            3. Track the hand's center position relative to the frame (-1 to 1).
            Do not speak. Just call the tool repeatedly to update the state.
          `,
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            this.startVideoStreaming(videoElement, sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Function Calling
             if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'updateGestureState') {
                  const args = fc.args as unknown as HandGestureState;
                  this.onStateUpdate(args);
                  
                  // Acknowledge the tool call
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                        functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: 'ok' }
                        }
                    });
                  });
                }
              }
            }
          },
          onclose: () => console.log('Gemini Live Closed'),
          onerror: (e) => console.error('Gemini Live Error', e),
        },
      });
      
      this.session = await sessionPromise;
    } catch (err) {
      console.error("Failed to connect to Gemini Live", err);
    }
  }

  private startVideoStreaming(videoEl: HTMLVideoElement, sessionPromise: Promise<any>) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const TARGET_FPS = 2; // Low FPS is sufficient for gesture state, preserves tokens/bandwidth
    const QUALITY = 0.5;

    if (!ctx) return;

    const sendFrame = async () => {
      if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
        canvas.width = videoEl.videoWidth / 4; // Downscale for speed
        canvas.height = videoEl.videoHeight / 4;
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', QUALITY).split(',')[1];
        
        sessionPromise.then(session => {
            session.sendRealtimeInput({
                media: {
                    mimeType: 'image/jpeg',
                    data: base64
                }
            });
        });
      }
      setTimeout(sendFrame, 1000 / TARGET_FPS);
    };

    sendFrame();
  }

  disconnect() {
    // Currently no explicit close on the client instance wrapper in strict TS type, 
    // but we can stop sending frames.
    // In a real app, we would cancel the timeout.
  }
}
