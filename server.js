import express from "express"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import OpenAI from "openai"

dotenv.config()

const app = express()
const port = 8000
app.use(bodyParser.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })

    const raw = llmResponse.choices[0].message.content
    const cards = JSON.parse(raw)

    res.json({ cards })
  } catch (err) {
    console.error("Expand error:", err)
    res.status(500).json({ error: "Failed to expand tasks" })
  }
})

app.listen(port, () => {
  console.log(`✅ MCP server running at http://localhost:${port}`)
})
