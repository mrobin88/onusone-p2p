/**
 * Space Message Loader - Fun animation while messages travel through space
 */

import React, { useState, useEffect } from 'react';

interface SpaceMessageLoaderProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

export default function SpaceMessageLoader({ isVisible, message = "Message traveling through space...", onComplete }: SpaceMessageLoaderProps) {
  const [phase, setPhase] = useState(0);
  const [showRobot, setShowRobot] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setPhase(0);
      setShowRobot(false);
      return;
    }

    // Animation sequence
    const sequence = [
      () => setShowRobot(true), // Show robot
      () => setPhase(1), // Start space travel
      () => setPhase(2), // Message in transit
      () => setPhase(3), // Arriving at destination
      () => {
        setPhase(4); // Complete
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 500);
      }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < sequence.length) {
        sequence[currentStep]();
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => {
      clearInterval(interval);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-black p-8 rounded-3xl border border-blue-500/30 shadow-2xl max-w-md w-full mx-4">
        
        {/* Robot Animation */}
        <div className={`text-center mb-6 transition-all duration-500 ${showRobot ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="text-6xl mb-4 animate-bounce">
            {phase === 0 ? '🤖' : 
             phase === 1 ? '🚀' : 
             phase === 2 ? '⭐' : 
             phase === 3 ? '🌍' : 
             phase === 4 ? '✅' : '🤖'}
          </div>
          
          <div className="text-2xl font-bold text-blue-400 mb-2">
            {phase === 0 ? 'Robot Activated' : 
             phase === 1 ? 'Launching Message' : 
             phase === 2 ? 'Traveling Through Space' : 
             phase === 3 ? 'Approaching Destination' : 
             phase === 4 ? 'Message Delivered!' : 'Robot Activated'}
          </div>
        </div>

        {/* Space Travel Animation */}
        <div className="relative h-32 mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-500/30">
          {/* Stars Background */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Message Traveling */}
          <div className={`absolute top-1/2 transform -translate-y-1/2 transition-all duration-1000 ${
            phase === 0 ? 'left-0 opacity-0' :
            phase === 1 ? 'left-1/4 opacity-100' :
            phase === 2 ? 'left-1/2 opacity-100' :
            phase === 3 ? 'left-3/4 opacity-100' :
            'left-full opacity-0'
          }`}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              📨
            </div>
          </div>

          {/* Space Debris */}
          {phase >= 1 && phase <= 3 && (
            <div className="absolute top-1/3 right-1/4 animate-spin">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(phase / 4) * 100}%` }}
          />
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className="text-blue-300 text-sm mb-2">{message}</p>
          <p className="text-gray-400 text-xs">
            {phase === 0 ? 'Initializing quantum communication...' : 
             phase === 1 ? 'Establishing secure connection...' : 
             phase === 2 ? 'Message traversing wormhole...' : 
             phase === 3 ? 'Decrypting at destination...' : 
             phase === 4 ? 'All systems operational!' : 'Initializing quantum communication...'}
          </p>
        </div>

        {/* Fun Loading Dots */}
        <div className="flex justify-center mt-4 space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                phase >= i + 1 ? 'bg-blue-500 scale-100' : 'bg-gray-600 scale-75'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
