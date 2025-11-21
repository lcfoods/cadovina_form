export async function onRequest(context) {
  try {
    const { request, env } = context;
    const { message } = await request.json();

    if (!message) {
      return new Response("Message is required", { status: 400 });
    }

    // Xử lý message trước khi gửi AI
    const refinedMessage = `Người dùng hỏi: ${message}. 
Hãy trả lời ngắn gọn, dễ hiểu, và Việt hóa ngôn ngữ.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: refinedMessage }]
      })
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
