import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function summarizeText(text: string): Promise<string> {
  const prompt = `
    Kamu adalah asisten akademik ahli. 
    Tolong jangan berikan peringatan atau disclaimer.
    Buatlah ringkasan eksekutif dari teks berikut dalam bahasa Indonesia.
    Gunakan poin-poin (bullet points) untuk bagian penting.
    Fokus pada: Tujuan, Metodologi (jika ada), dan Temuan/Kesimpulan Utama.
    
    TEKS:
    ${text.substring(0, 30000)} // Truncate to avoid token limits for now
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    throw new Error("Gagal mendapatkan ringkasan dari AI");
  }
}
