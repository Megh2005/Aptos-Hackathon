// app/api/gemini/route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { prompt, companyData } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the response as JSON
    let questions;
    try {
      // Clean the response text (remove any markdown formatting)
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response:", text);

      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          questions = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          return NextResponse.json(
            { error: "Failed to parse AI response as JSON" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "AI response is not in valid JSON format" },
          { status: 500 }
        );
      }
    }

    // Validate the questions format
    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: "AI response is not an array of questions" },
        { status: 500 }
      );
    }

    // Validate each question has required fields
    const isValidQuestion = (q: any) => {
      return (
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === "number" &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < 4 &&
        typeof q.explanation === "string"
      );
    };

    const validQuestions = questions.filter(isValidQuestion);

    if (validQuestions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: validQuestions,
      message: `Successfully generated ${validQuestions.length} questions`,
    });
  } catch (error) {
    console.error("Error in Gemini API route:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
