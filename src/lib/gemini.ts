import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function summarizeText(content: string | { buffer: Buffer; mimeType: string }): Promise<string> {
  const systemPrompt = `
    Kamu adalah asisten akademik ahli. 
    Tolong jangan berikan peringatan atau disclaimer.
    Buatlah ringkasan eksekutif dari dokumen/teks berikut dalam bahasa Indonesia.
    Gunakan poin-poin (bullet points) untuk bagian penting.
    Fokus pada: Tujuan, Metodologi (jika ada), dan Temuan/Kesimpulan Utama.
  `;

  const parts: Part[] = [{ text: systemPrompt }];

  if (typeof content === "string") {
    parts.push({ text: `\n\nTEKS:\n${content.substring(0, 30000)}` });
  } else {
    parts.push({
      inlineData: {
        data: content.buffer.toString("base64"),
        mimeType: content.mimeType,
      },
    });
    parts.push({
      text: "\n\nTolong ringkas dokumen lampiran ini.",
    });
  }

  try {
    const result = await model.generateContent(parts);

    const response = await result.response;
    return response.text();
  } catch (err: any) {
    console.error("Gemini Error:", err);
    
    // Check for 429 Too Many Requests or Quota Exceeded error
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.toLowerCase().includes("quota")) {
      throw new Error("Batas limit request AI tercapai (Quota Exceeded). Silakan tunggu sekitar 1 menit lalu coba lagi.");
    }
    
    throw new Error("Gagal mendapatkan ringkasan dari AI");
  }
}

