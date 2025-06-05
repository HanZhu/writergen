import React, { useState, useEffect } from 'react';
import { submitVideoGeneration, checkVideoStatus } from '../services/api';

interface VideoOutputProps {
  text: string;
  isGenerating: boolean;
  onGenerateStart: () => void;
  onGenerateEnd: () => void;
}

const VideoOutput: React.FC<VideoOutputProps> = ({
  text,
  isGenerating,
  onGenerateStart,
  onGenerateEnd,
}) => {
  const [requestId, setRequestId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchVideoStatus = async () => {
      if (!requestId) return;

      try {
        const response = await checkVideoStatus(requestId);

        if (response.status === 'completed') {
          setVideoUrl(response.videoUrl || '');
          setStatus('completed');
          onGenerateEnd();
          clearInterval(intervalId);
        } else if (response.status === 'failed') {
          setStatus('failed');
          onGenerateEnd();
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Video status check error:', error);
        setStatus('failed');
        onGenerateEnd();
        clearInterval(intervalId);
      }
    };

    if (requestId) {
      intervalId = setInterval(fetchVideoStatus, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [requestId, onGenerateEnd]);

  const handleGenerateVideo = async () => {
    if (!text.trim()) return;

    onGenerateStart();
    setStatus('generating');
    try {
      const response = await submitVideoGeneration(text);
      setRequestId(response.requestId);
    } catch (error) {
      console.error('Video generation error:', error);
      setStatus('failed');
      onGenerateEnd();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Video Generation</h2>
      </div>

      {videoUrl ? (
        <div className="space-y-4">
          <video
            src={videoUrl}
            controls
            className="w-full h-64 object-cover rounded-lg"
          />
          <a
            href={videoUrl}
            download="generated-video.mp4"
            className="block text-center text-accent hover:text-accent/90"
          >
            Download Video
          </a>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-center">
            {status === 'generating'
              ? 'Generating video... This may take a few minutes'
              : status === 'failed'
              ? 'Failed to generate video. Please try again.'
              : 'Click generate to create a video from your text'}
          </p>
        </div>
      )}

      <button
        onClick={handleGenerateVideo}
        disabled={!text.trim() || isGenerating}
        className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${
          !text.trim() || isGenerating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-accent hover:bg-accent/90'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate Video'}
      </button>
    </div>
  );
};

export default VideoOutput; 