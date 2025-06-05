export interface TranslationResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface ImageResponse {
  images: Array<{
    url: string;
  }>;
}

export interface VideoSubmitResponse {
  requestId: string;
}

export interface VideoStatusResponse {
  status: 'pending' | 'completed' | 'failed';
  videoUrl?: string;
} 