export async function POST(request) {
  try {
    const { text, style } = await request.json();
    
    if (!text || !style) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Gemini API configuration
    const GEMINI_API_KEY = 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ';
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    // Create appropriate prompt based on style
    let prompt = "";
    if (style === "professional") {
      prompt = `Please rewrite the following text in a professional, formal tone suitable for business communication:\n\n${text}`;
    } else if (style === "friendly") {
      prompt = `Please rewrite the following text in a warm, friendly tone that's approachable but still appropriate:\n\n${text}`;
    } else if (style === "casual") {
      prompt = `Please rewrite the following text in a casual, conversational tone as if speaking to a friend:\n\n${text}`;
    } else {
      return Response.json({ error: "Invalid style specified" }, { status: 400 });
    }
    
    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800, // Increased token limit to handle longer texts
        }
      }),
    });
    
    const responseData = await response.json();
    
    // Extract converted text from Gemini response
    if (responseData.candidates && 
        responseData.candidates[0] && 
        responseData.candidates[0].content && 
        responseData.candidates[0].content.parts && 
        responseData.candidates[0].content.parts[0]) {
      
      const convertedText = responseData.candidates[0].content.parts[0].text;
      return Response.json({ convertedText });
    } else {
      console.error("Unexpected Gemini API response structure:", responseData);
      return Response.json({ error: "Failed to parse API response" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in convert-text-style API:", error);
    return Response.json({ error: "Failed to convert text style" }, { status: 500 });
  }
}
