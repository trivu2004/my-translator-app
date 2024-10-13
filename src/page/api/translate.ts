import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { text, language } = req.body;

    // Gọi API dịch thuật ở đây (VD: sử dụng FPT.ai hoặc một dịch vụ khác)
    // Dưới đây là một ví dụ giả lập:

    const translatedText = await fetch('https://api.fpt.ai/hmi/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': 'uAeDQiblMbd71jhCBngsTrdIX9DQPcCm', // Sử dụng api key của bạn
      },
      body: JSON.stringify({
        text,
        target_language: language // Ngôn ngữ đích
      }),
    });

    const result = await translatedText.json();
    
    // Trả về kết quả dịch
    res.status(200).json({ text: result.translated_text || 'Error translating' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
