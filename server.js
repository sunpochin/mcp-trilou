import express from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config()

// 檢查 API Key
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ 沒有找到 OPENAI_API_KEY，請確認 .env 檔案正確")
  process.exit(1)
} else {
  console.log("✅ API KEY prefix:", process.env.OPENAI_API_KEY.slice(0, 10))
}

const app = express()
const port = 8000 // <-- 改這裡
app.use(bodyParser.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

app.post("/mcp/expand-tasks", async (req, res) => {
  const { userInput } = req.body

  const prompt = `
  你是一個任務拆解助理，請把用戶需求拆成多張卡片。
  請輸出 JSON 陣列，每張卡片要包含：
  - title (string)
  - description (string)
  - status (todo)

  範例：
  [
    { "title": "準備履歷", "description": "更新工作經歷", "status": "todo" },
    { "title": "練習面試題", "description": "演算法題 10 題", "status": "todo" }
  ]

  用戶輸入：${userInput}
  `

  try {
    const llmResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    })

    const raw = llmResponse.choices[0].message.content
    console.log("📝 LLM raw output:", raw)

    let cards = []
    try {
      cards = JSON.parse(raw)
    } catch (e) {
      console.error("⚠️ JSON parse error:", e.message)
      return res.status(500).json({ error: "Invalid JSON from LLM", raw })
    }

    res.json({ cards })
  } catch (err) {
    console.error("❌ Expand error:", err.response?.data || err.message)
    res.status(500).json({ error: "Failed to expand tasks", detail: err.message })
  }
})

app.listen(port, () => {
  console.log(`🚀 MCP server running at http://localhost:${port}`)
})
