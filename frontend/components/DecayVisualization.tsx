import React from 'react';

interface DecayVisualizationProps {
  decayScore: number;
  stakedTokens: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  ageInHours: number;
}

export default function DecayVisualization({ 
  decayScore, 
  stakedTokens, 
  engagement, 
  ageInHours 
}: DecayVisualizationProps) {
  const totalEngagement = engagement.likes + engagement.comments + engagement.shares;
  const currentValue = Math.floor(stakedTokens * (decayScore / 100));
  const burnedValue = stakedTokens - currentValue;

  const getDecayColor = () => {
    if (decayScore >= 80) return 'bg-green-500';
    if (decayScore >= 60) return 'bg-yellow-500';
    if (decayScore >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDecayStatus = () => {
    if (decayScore >= 80) return 'Excellent';
    if (decayScore >= 60) return 'Good';
    if (decayScore >= 40) return 'Declining';
    if (decayScore >= 20) return 'Critical';
    return 'Burning';
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-md font-semibold text-purple-400">⚡ Decay Analysis</h4>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          decayScore >= 60 ? 'bg-green-900 text-green-300' : 
          decayScore >= 40 ? 'bg-yellow-900 text-yellow-300' : 
          'bg-red-900 text-red-300'
        }`}>
          {getDecayStatus()}
        </div>
      </div>

      {/* Decay Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Content Value</span>
          <span className="text-white font-medium">{decayScore}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getDecayColor()}`}
            style={{ width: `${decayScore}%` }}
          />
        </div>
      </div>

      {/* Token Economics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{stakedTokens}</div>
          <div className="text-xs text-gray-500">Staked</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{currentValue}</div>
          <div className="text-xs text-gray-500">Current</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">{burnedValue}</div>
          <div className="text-xs text-gray-500">Burned</div>
        </div>
      </div>

      {/* Engagement Impact */}
      <div className="bg-gray-800 p-3 rounded mb-3">
        <div className="text-sm text-gray-300 mb-2">Engagement Protection:</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-red-400">❤️ {engagement.likes}</div>
            <div className="text-gray-500">Likes</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400">💬 {engagement.comments}</div>
            <div className="text-gray-500">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-green-400">🔄 {engagement.shares}</div>
            <div className="text-gray-500">Shares</div>
          </div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-purple-400 font-medium">
            Total: {totalEngagement} interactions
          </span>
        </div>
      </div>

      {/* Time Analysis */}
      <div className="bg-gray-800 p-3 rounded">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Age:</span>
          <span className="text-white">{ageInHours.toFixed(1)} hours</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-gray-400">Decay Rate:</span>
          <span className="text-orange-400">2% per hour</span>
        </div>
        {totalEngagement > 0 && (
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-gray-400">Protection:</span>
            <span className="text-green-400">-{Math.min(totalEngagement * 0.5, 50)}% decay</span>
          </div>
        )}
      </div>

      {/* Predictions */}
      <div className="mt-3 text-xs text-gray-500">
        {decayScore > 50 ? (
          <span className="text-green-400">
            💡 Good engagement! Content is protected from decay.
          </span>
        ) : decayScore > 20 ? (
          <span className="text-yellow-400">
            ⚠️ Needs more engagement to prevent further token burn.
          </span>
        ) : (
          <span className="text-red-400">
            🔥 Critical! This content will burn remaining tokens soon.
          </span>
        )}
      </div>
    </div>
  );
}