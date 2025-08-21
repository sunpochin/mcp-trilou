import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

// 檢查 API Key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ 沒有找到 OPENAI_API_KEY，請確認 .env 檔案正確')
  process.exit(1)
} else {
  console.log('✅ API KEY prefix:', process.env.OPENAI_API_KEY.slice(0, 10))
}

const app = express()
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
    { "title": "繳交報告", "description": "明天截止的期末報告", "status": "urgent" },
    { "title": "練習面試題", "description": "為下周面試準備", "status": "high" },
    { "title": "整理筆記", "description": "複習上課內容", "status": "medium" }
  ]

  輸出格式必須是：
  { "cards": [ { "title": "...", "description": "...", "status": "..." } ] }

  請輸出 JSON 格式，不要輸出其他文字。

  用戶輸入：${userInput}
  `

  try {
    const llmResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
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

const port = process.env.PORT || 3000

// 測試用 API
app.get('/', (req, res) => {
  res.send('✅ MCP server is running!')
})

console.log('🟢 NODE_ENV:', process.env.NODE_ENV)
console.log('🟢 PORT ENV:', process.env.PORT)

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MCP server running at http://0.0.0.0:${port}`)
})
