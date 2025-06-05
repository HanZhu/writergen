# WriterGen App Settings & Configuration (V3.0)

This document details all current settings, models, and configuration used in the WriterGen app so that anyone can replicate the setup as of Version 3.0.

---

## 0. **Version**
- **Current Version:** V3.0
- **Last Updated:** [fill in date]

---

## 1. **Frontend Stack**
- **Framework:** React (TypeScript)
- **Styling:** Tailwind CSS + custom CSS
- **HTTP Client:** Axios

## 2. **API Provider**
- **Platform:** SiliconFlow (https://cloud.siliconflow.cn/)
- **API Base URL:** `https://api.siliconflow.cn/v1`
- **API Key:** (example) `sk-bvzmpseywrtsakqtnxaqfpilmrydalevpgrdcicsexfojmti`

---

## 3. **Features & Model Settings**

### A. **Text Translation**
- **Endpoint:** `/chat/completions`
- **Model:** `deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B`
- **Prompt:**
  - System: `You are a professional translator and literary author. Translate the following text to <TargetLanguage> in a natural, professional, and literary style. Respond ONLY with a single valid minified JSON object: {"translation": "..."}. Do not include any extra text, commentary, or formatting. If you cannot comply, respond with {"translation": "ERROR"}.`
  - User: `<user input>`
- **Parameters:**
  - `temperature`: `0.5`
  - `max_tokens`: `800`
- **Supported Target Languages:**
  - English, French, Spanish, German, Russian, Chinese
- **Frontend Robustness:**
  - Always pivots through English for non-English targets (two-step translation).
  - Attempts to parse model output as JSON.
  - If parsing fails, displays plain text output as translation with a warning.
  - Handles and escapes line breaks in translation values.
  - Shows clear error messages for empty or unusable output.
  - Works for all languages, including non-Latin scripts and multiline/poetic input.

### B. **Image Generation**
- **Endpoint:** `/images/generations`
- **Model:** `Kwai-Kolors/Kolors`
- **Parameters:**
  - `prompt`: `<user input>`
  - `image_size`: `1024x1024`
  - `batch_size`: `1`
  - `num_inference_steps`: `20`
  - `guidance_scale`: `7.5`

### C. **Emotional Clues Extraction**
- **Endpoint:** `/chat/completions`
- **Model:** `deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B`
- **Prompt:**
  - System: `You are an expert literary emotion analyst. Read the following text and extract both the core/main emotions and any underlying or hidden emotions expressed (not moods, not phrases, not situations). Respond ONLY with a single valid minified JSON array of 3-7 single-word emotions (surface or underlying, in the input language, or English if not available). Do not include any extra text, commentary, or formatting. If you cannot comply, respond with ["ERROR"].`
  - User: `<user input>`
- **Parameters:**
  - `temperature`: `0.5`
  - `max_tokens`: `200`
- **Frontend Robustness:**
  - User must click "Analyze" to trigger analysis.
  - Attempts to extract the first valid JSON array from the model output.
  - If parsing fails, falls back to splitting by commas/newlines and shows a warning if fallback is used.
  - Handles and displays errors gracefully.

### D. **Video Generation**
- **Status:** _Coming Soon_
- **UI:** Floating button in the bottom left, no backend/API call yet.

---

## 4. **UI/UX**
- **Single-page minimalist layout**
- **Card-based canvas with freeform drag-and-drop**
- **Default Card Order:**
  1. Your Original World
  2. Your World, Illustrated
  3. Your Story, Reimagined
  4. Emotional Clues
- **Card Details:**
  - Each card is draggable via a visible handle at the top.
  - Cards are absolutely positioned in a grid (3 per row by default).
  - Cards cannot be dragged above the top border.
  - Distinct pastel color for each card type.
  - Responsive and visually harmonious.
- **Header:**
  - Title: `WriterGen`
  - Subtitle: `Visualize and expand the world you wrote.`
- **Footer:**
  - Floating pill-shaped button: `🎬 Video of your story coming soon`
- **Loading states** and robust error handling for all API calls

---

## 5. **How to Replicate**
1. **Clone the repo** and install dependencies:
   ```bash
   npm install
   ```
2. **Set your SiliconFlow API key** in the code or as an environment variable.
3. **Start the app:**
   ```bash
   npm start
   ```
4. **Use the UI** to input text, analyze emotions, select translation language, and generate images.

---

## 6. **References**
- [SiliconFlow Model List](https://cloud.siliconflow.cn/models)
- [Chat Completions API](https://docs.siliconflow.cn/en/api-reference/chat/chat_completions)
- [Image Generation API](https://docs.siliconflow.cn/cn/api-reference/images/images-generations)

---

_This document is up to date as of V3.0 and reflects all current code and settings in the WriterGen project._ 