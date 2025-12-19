import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const getEmbeddings = async (text: string): Promise<number[]> => {
    // Normalize whitespace to avoid artifacts
    const cleanText = text.replace(/\n/g, " ");

    const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // Cost effective
        input: cleanText,
    });

    return response.data[0].embedding;
};

// Define structure for sources
export interface Source {
    documentId: string;
    documentName: string;
    page: number;
    text: string;
}

export const generateRAGResponse = async (query: string, sources: Source[]) => {
    const context = sources
        .map((s) => `[Document: ${s.documentName}, Page: ${s.page}]\n${s.text}`)
        .join("\n\n---\n\n");

    const systemPrompt = `
You are a helpful assistant for a proprietary document system.
Your goal is to answer the user's question based ONLY on the provided Context.

RULES:
1. Use the provided Context to answer.
2. If the answer is not in the Context, say "I couldn't find information about this in the documents."
3. Do NOT invent information.
4. Always cite your sources when possible.
5. Format the output as JSON with "answer" and "sources" keys.
   - "sources" should be an array of objects: { documentName: string, page: number, quote: string }.
   - Pick the most relevant quote for the source.
`;

    const userPrompt = `
Question: ${query}

Context:
${context}
`;

    const completion = await openai.chat.completions.create({
        model: process.env.CHAT_MODEL || "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" }, // Enforce JSON
        temperature: 0, // Deterministic for RAG
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No response from OpenAI");

    return JSON.parse(content);
};
