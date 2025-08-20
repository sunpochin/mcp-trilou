import express from "express"
import OpenAI from "openai"

const router = express.Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

router.post("/", async (req, res) => {
  const { userInput } = req.body

  const prompt = `
  你是一個任務拆解助理，請把用戶需求拆成多張卡片。
  請輸出 JSON 陣列，每張卡片有：
  - title (string)
  - description (string)
  - status (todo)

  用戶輸入：${userInput}
  `

  try {
    const llmResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const rawText = llmResponse.choices[0].message.content
    const cards = JSON.parse(rawText)

    res.json({ cards })
  } catch (err) {
    console.error("Expand error:", err)
    res.status(500).json({ error: "Failed to expand tasks" })
  }
})

export default router
