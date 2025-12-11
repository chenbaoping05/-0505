import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import { GeminiLiveController } from './services/geminiLiveService';
import { HandGestureState } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Camera & Gesture State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gestureState, setGestureState] = useState<HandGestureState>({
    isUnleashed: false,
    handX: 0,
    handY: 0
  });

  const controllerRef = useRef<GeminiLiveController | null>(null);

  const handleStart = async () => {
    if (!apiKey) {
        alert("Please provide an API Key (automatically handled if in env)");
        // In a real env without process.env, we'd show an input. 
        // For this demo, we assume process.env or user needs to handle it.
        // Adding a fallback prompt just in case.
        const inputKey = prompt("Enter Google Gemini API Key (multimodal capable):");
        if(inputKey) setApiKey(inputKey);
        else return;
    }
    setLoading(true);
    
    // Start Webcam
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
        }
        
        // Connect to Gemini
        const controller = new GeminiLiveController(apiKey || process.env.API_KEY || '', (newState) => {
            setGestureState(prev => ({...prev, ...newState}));
        });
        
        await controller.connect(videoRef.current!);
        controllerRef.current = controller;
        setIsStarted(true);
    } catch (e) {
        console.error("Initialization failed", e);
        alert("Failed to access camera or connect to AI. Check console.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 4, 20], fov: 45 }} gl={{ antialias: false }}>
            <Scene gestureState={gestureState} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
        <header className="flex justify-between items-start">
            <div>
                <h1 className="text-4xl md:text-6xl text-amber-400 font-bold tracking-tighter drop-shadow-lg" style={{ fontFamily: 'Playfair Display' }}>
                    GRAND LUXURY
                </h1>
                <h2 className="text-xl md:text-2xl text-emerald-200 tracking-widest uppercase mt-2">
                    Interactive Christmas Tree
                </h2>
            </div>
            
            {isStarted && (
                <div className="bg-black/50 backdrop-blur-md p-4 border border-amber-500/30 rounded-lg text-amber-100 text-sm">
                    <p className="font-bold">STATUS: {gestureState.isUnleashed ? 'CHAOS UNLEASHED' : 'FORM PERFECT'}</p>
                    <div className="mt-2 flex gap-4">
                        <span>Hand X: {gestureState.handX.toFixed(2)}</span>
                        <span>Hand Y: {gestureState.handY.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </header>

        {/* Start Screen / Controls */}
        {!isStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto z-50">
                <div className="max-w-md text-center space-y-6">
                     <h3 className="text-amber-400 text-2xl font-serif">Welcome to the Experience</h3>
                     <p className="text-gray-300">
                        Allow camera access to control the tree with gestures.
                        <br/>
                        <span className="text-emerald-400 font-bold">Open Hand</span>: Unleash Chaos
                        <br/>
                        <span className="text-emerald-400 font-bold">Closed Hand</span>: Restore Form
                     </p>
                     
                     {!process.env.API_KEY && (
                        <input 
                           type="password" 
                           placeholder="Enter Gemini API Key" 
                           className="w-full p-2 bg-gray-900 border border-amber-600 text-white rounded"
                           onChange={(e) => setApiKey(e.target.value)}
                           value={apiKey}
                        />
                     )}

                     <button 
                        onClick={handleStart}
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-400 text-black font-bold text-lg rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                     >
                        {loading ? 'Initializing AI...' : 'ENTER THE GRAND HALL'}
                     </button>
                </div>
            </div>
        )}

        {/* Video Preview (Hidden or Small) */}
        <div className="absolute bottom-8 right-8 w-32 h-24 bg-black border-2 border-amber-600 rounded-lg overflow-hidden pointer-events-auto opacity-50 hover:opacity-100 transition">
             <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" muted playsInline />
        </div>
      </div>
    </div>
  );
};

export default App;
