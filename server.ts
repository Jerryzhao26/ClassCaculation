import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini AI Setup
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint to Parse Uploaded Attendance Sheet Image using Gemini Vision
app.post('/api/parse-attendance-sheet', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    const ai = getGeminiClient();

    // Clean base64 string if data URL header exists
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const promptText = `你是一个培训机构考勤表AI智能识图助手。请分析上传的学生考勤表图片，提取其中的信息：
1. 班级名称（如图片中有"班级名称："或标题中的班级名，若未标注则推断或填"未识别班级"）
2. 上课课次总列数（如1, 2, 3... 对应的总节数）
3. 学生列表及其对应的考勤记录：
   - 提取每位学生的姓名
   - 提取该学生在第1到第N节课的出勤符号，如果是勾（√、✔、v、对钩等）统一记为 "√"，如果是叉（×、x、错等）统一记为 "×"，如果是请假记为 "请假"，如果是空白或未上记为 ""。

请以标准 JSON 格式输出结果。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            className: {
              type: Type.STRING,
              description: '识别到的班级名称',
            },
            totalLessons: {
              type: Type.INTEGER,
              description: '识别到的课次/节次总列数，如 18',
            },
            studentRows: {
              type: Type.ARRAY,
              description: '所有学生的考勤行',
              items: {
                type: Type.OBJECT,
                properties: {
                  studentName: {
                    type: Type.STRING,
                    description: '学生姓名',
                  },
                  attendance: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                    },
                    description: '每节课的符号，只能是 "√", "×", "请假" 或 ""',
                  },
                },
                required: ['studentName', 'attendance'],
              },
            },
          },
          required: ['className', 'totalLessons', 'studentRows'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error parsing attendance sheet image with Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'AI考勤表识别失败，请检查图片清晰度或重试',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Class Revenue Management Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
