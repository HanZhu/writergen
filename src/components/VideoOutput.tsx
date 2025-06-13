import React from 'react';

interface VideoOutputProps {
  status: 'idle' | 'submitting' | 'generating' | 'completed' | 'failed';
  videoUrl?: string;
  onGenerate: () => void;
  onCancel: () => void;
  isGenerating: boolean;
}

const VideoOutput: React.FC<VideoOutputProps> = ({
  status,
  videoUrl,
  onGenerate,
  onCancel,
  isGenerating,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Video Generation</h2>
      </div>

      {videoUrl ? (
        <div className="space-y-4 w-full flex flex-col items-center">
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
        <div className="w-full flex flex-col items-center mb-4">
          {status === 'submitting' ? (
            <>
              <div className="flex flex-col items-center mb-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mb-2"></div>
                <p className="text-gray-700 text-center font-medium">
                  Submitting video job... (this may take a few seconds)
                </p>
              </div>
            </>
          ) : status === 'generating' ? (
            <>
              <div className="flex flex-col items-center mb-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mb-2"></div>
                <p className="text-gray-700 text-center font-medium">
                  Generating video... This may take up to 5 minutes.
                </p>
              </div>
            </>
          ) : status === 'failed' ? (
            <p className="text-red-500 text-center font-medium">Failed to generate video. Please try again.</p>
          ) : (
            <p className="text-gray-500 text-center font-medium">Click the button below to create a video from your text.</p>
          )}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isGenerating || status === 'generating'}
        className={`mt-2 w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-150 ${
          isGenerating || status === 'generating'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-accent hover:bg-accent/90'
        }`}
      >
        {isGenerating || status === 'generating' ? 'Generating...' : 'Generate Video'}
      </button>
    </div>
  );
};

export default VideoOutput; 