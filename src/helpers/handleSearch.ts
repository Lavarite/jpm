// ./helpers/handleSearch.ts / .js
export const handleSearch = async (
    query: string,
    abortRef: React.MutableRefObject<AbortController | null>,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
    setSummary: (summary: string) => void,
    setResults: (results: string) => void,
    setParsedResults: (results: any[]) => void,
    model: any,
    API_BASE_URL: string,
) => {
    if (!query.trim()) return;

    // cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setSummary("");

    try {
        /* ─────────────────────────────────────────────────────────
           1️⃣  🔍  hit the FastAPI /search endpoint
        ───────────────────────────────────────────────────────── */
        const res = await fetch(
            `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&k=10`,
            { signal: controller.signal },
        );
        if (!res.ok) throw new Error(res.statusText);

        const data = await res.json();
        if (!data?.total || data.total === 0) {
            setSummary("No documents found.");
            return;
        }

        // show raw hits in a side-panel if you want
        const docsJSON = JSON.stringify(data, null, 2);
        setResults(docsJSON);

        /* ─────────────────────────────────────────────────────────
           2️⃣  📝  build the regulated-banking prompt
        ───────────────────────────────────────────────────────── */
        const prompt = `
System
You are summarising JP Morgan client–advisor data in a regulated environment.

User-provided JSON
${docsJSON}

Instructions
1. For every element in the elasticsearch.hits array:
   · If "conversation_id" exists ⇒ summarise the conversation  
   · If "product_id" exists ⇒ summarise the product
2. Use the postgres.lookup data to map IDs to names when available.
3. Do NOT introduce information that is not present in the input.
4. Return strictly a JSON array where each element has the keys:
   {
     "type":       "conversation" | "product",
     "id":         string,
     "date":       string|null,
     "advisor":    { "id": string|null, "name": string|null },
     "client":     { "id": string|null, "name": string|null },
     "product":    { "id": string|null, "name": string|null, "type": string|null },
     "summary":    string,
     "topics":     string[] (limit to 3-4 most relevant topics),
     "actions":    string[]
   }
Output nothing except this JSON.
`;

        const { stream } = await model.generateContentStream(prompt);
        let raw = "";
        for await (const chunk of stream) {
            raw += typeof chunk.text === "function" ? chunk.text() : chunk;
            setSummary(raw);
        }
        
        // Parse the final JSON response
        try {
            const cleaned = raw.replace(/```json|```/g, "").trim();
            if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
                const parsed = JSON.parse(cleaned);
                return parsed; // Return parsed results
            }
        } catch (parseErr) {
            console.error('Failed to parse JSON response:', parseErr);
        }
    } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(err.message || "Something went wrong, check console for details.");
    } finally {
        setLoading(false);
    }
};