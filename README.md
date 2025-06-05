# WriterGen - Your Writing to the World

WriterGen is a single-page web application that transforms written content into multiple creative formats, helping writers visualize their work in different dimensions.

## Features

- **Text Input**: Enter or paste your writing (up to 5000 words)
- **Language Translation**: Translate your text into major literary languages with back-translation
- **Image Generation**: Create visual representations of your writing
- **Video Generation**: Transform your text into video content

## Technologies Used

- React with TypeScript
- Tailwind CSS for styling
- SiliconCloud APIs for AI services:
  - DeepSeek-R1 for translation
  - Kolors for image generation
  - Hunyuan Video HD for video generation

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## API Keys

The application uses SiliconCloud's API services. Make sure to set up your API key in the environment variables:

```env
REACT_APP_SILICONCLOUD_API_KEY=your_api_key_here
```

## Project Structure

```
src/
  ├── components/
  │   ├── TextInput.tsx
  │   ├── TranslationOutput.tsx
  │   ├── ImageOutput.tsx
  │   └── VideoOutput.tsx
  ├── services/
  ├── types/
  ├── utils/
  ├── App.tsx
  └── index.tsx
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 