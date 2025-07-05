// app/api/scrape/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch webpage: ${response.status} ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const html = await response.text();

    // Parse the HTML
    const $ = cheerio.load(html);

    // Remove script and style elements
    $(
      "script, style, nav, footer, header, aside, .nav, .footer, .header, .sidebar"
    ).remove();

    // Extract text content from important elements
    const title = $("title").text().trim();
    const metaDescription = $('meta[name="description"]').attr("content") || "";

    // Get main content
    const mainContent =
      $("main, .main, .content, .main-content, article, .article").text() ||
      $("body").text();

    // Get headings
    const headings = $("h1, h2, h3, h4, h5, h6")
      .map((i, el) => $(el).text().trim())
      .get()
      .join(" ");

    // Get paragraph text
    const paragraphs = $("p")
      .map((i, el) => $(el).text().trim())
      .get()
      .join(" ");

    // Combine all text content
    let content = [title, metaDescription, headings, paragraphs, mainContent]
      .filter(Boolean)
      .join(" ");

    // Clean up the content
    content = content
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    // Limit content length to prevent token limits
    const maxLength = 8000; // Adjust based on your needs
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + "...";
    }

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: "Unable to extract meaningful content from the webpage" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content,
      title,
      url,
      wordCount: content.split(" ").length,
    });
  } catch (error) {
    console.error("Error in scrape API route:", error);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timeout - website took too long to respond" },
          { status: 408 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
