// frontend/src/hooks/useRAGStream.js
import { useState, useCallback } from 'react';

// Updated stream hook
// Notes:
// - Uses the backend endpoint at http://localhost:8000/rag/stream
// - Sends JSON with key `question` (matches backend)
// - Parses plain newline-separated chunked text and buffers partial chunks
export const useRAGStream = () => {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startStreamQuery = useCallback(async (query) => {
    if (!query) return;
    setIsLoading(true);
    setResponse(""); // clear previous

    try {
      // Backend expects { query } at /api/rag/stream and responds with SSE (text/event-stream)
      const res = await fetch('http://localhost:8000/api/rag/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server returned ${res.status}: ${txt}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Parse simple SSE: look for lines starting with "data: "
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Normalize newlines to \n to handle \r\n from sse_starlette
        let normalizedBuffer = buffer.replace(/\r\n/g, '\n');
        const events = normalizedBuffer.split('\n\n');

        if (events.length > 1) {
          // We have at least one full event
          buffer = events.pop(); // The last item is the remainder (incomplete event or empty string)

          for (const ev of events) {
            const lines = ev.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                let data = line.substring(5).trim(); // trim removes leading space

                if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    setResponse((prev) => prev + parsed);
                  } catch (e) {
                    console.warn("Failed to parse SSE data:", data);
                    // Try using it raw if it looks like text
                    setResponse((prev) => prev + data);
                  }
                }
              }
            }
          }
        } else {
          // No double newline yet, keep buffering.
          // We update buffer to normalizedBuffer to avoid accumulating \r\n
          buffer = normalizedBuffer;
        }
      }
    } catch (error) {
      console.error('Stream Error:', error);
      setResponse('Error: Could not connect to AegisVee Engine. ' + (error.message || ''));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { response, isLoading, startStreamQuery };
};