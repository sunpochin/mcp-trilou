import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

// 檢查 API Key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ 沒有找到 OPENAI_API_KEY，請確認 .env 檔案正確')
  process.exit(1)
}
const app = express()
const port = 8000 // <-- 改這裡
app.use(bodyParser.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

app.post('/mcp/expand-tasks', async (req, res) => {
  const { userInput } = req.body

  const prompt = `
  你是一個任務拆解助理，請把用戶需求拆成多張卡片。
  請輸出 JSON 陣列，每張卡片要包含：
  - title (string)
  - description (string) 
  - status (string): 根據任務的緊急程度和重要性判斷
    * "urgent" - 🔥 緊急且重要，需立即處理
    * "high" - ⚡ 重要但不緊急，優先處理
    * "medium" - 📝 一般重要，正常處理
    * "low" - 💭 可選或不重要，有空再做

  判斷標準：
  - 有截止日期 → urgent/high
  - 影響其他任務 → high/urgent
  - 學習或改善類 → medium/low
  - 可延後執行 → low

  範例：
  [
    { "title": "繳交報告", "description": "明天截止的期末報告，需要立即完成，否則會被當掉，立即開始準備吧。", "status": "urgent" },
    { "title": "練習面試題", "description": "為下周面試準備，研讀各種教材，並且練習各種面試題目。跟同學互相討論，並且互相練習面試。", "status": "high" },
    { "title": "整理筆記", "description": "複習上課內容，並且整理成筆記。跟同學組成小組，互相討論，並且互相練習面試。", "status": "medium" }
  ]

  用戶輸入：${userInput}
  `

  try {
    const llmResponse = await openai.chat.completions.create({
      model: 'gpt‑4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = llmResponse.choices[0].message.content
    console.log('📝 LLM raw output:', raw)

    let cards = []
    try {
      cards = JSON.parse(raw)
    } catch (e) {
      console.error('⚠️ JSON parse error:', e.message)
      return res.status(500).json({ error: 'Invalid JSON from LLM', raw })
    }

    res.json({ cards })
  } catch (err) {
    console.error('❌ Expand error:', err.response?.data || err.message)
    res
      .status(500)
      .json({ error: 'Failed to expand tasks', detail: err.message })
  }
})

app.listen(port, () => {
  console.log(`🚀 MCP server running at http://localhost:${port}`)
})
