Car Recommendation Tool

*What I Built and Why

A natural language car recommendation tool for the Indian market. You type something like "I want a fuel-efficient SUV under 15 lakhs" and it gives you the top 5 matches from a 15k-vehicle dataset, with reasons why each car fits your ask.

I built it because car shopping in India is overwhelming — there are hundreds of models and most comparison sites make you fill out annoying filter forms. I wanted something that just lets you talk naturally about what you want.

*What I Deliberately Cut

-No user accounts or saved preferences — kept it stateless, session history lives in the browser only
-No car images— would've needed an image API or scraping, not worth the time
-No comparison view— you get ranked cards, but can't put two cars side by side yet
-No caching of AI responses— every query hits Gemini fresh, which is slower but simpler
-No filters/sorting UI— the whole point is natural language, so I skipped traditional filter dropdowns

*Tech Stack

| Frontend | React + TypeScript + Vite | Fast dev loop, type safety, simple setup |
| Backend | Express (Node.js) | Lightweight, quick to wire up REST endpoints |
| AI | Google Gemini 2.5 Flash | Parses natural language into structured filters + generates suitability reasons |
| Data | CSV (15k Indian vehicle records) | No database needed — loaded into memory on startup, fast enough for this scale |
No database. No Docker. No deployment pipeline. Kept it local and simple.

## What I Delegated to AI vs. Did Manually

*AI helped most with-
- Scaffolding the initial project structure (boilerplate, folder layout)
- Writing the scoring engine logic — I described the weighting system and it generated the implementation
- CSS styling and layout — described the look I wanted and iterated
- Error handling patterns and rate limiting setup
- Writing the Gemini prompt engineering (parsing prompt + reasons prompt)

*I did manually-
- Architecture decisions (how to split query parsing / scoring / reason generation)
- Choosing the tech stack
- Designing the data flow (user query → Gemini parse → score locally → Gemini reasons → response)
- Debugging edge cases in the CSV parsing (messy real-world data)
- Deciding what to cut and what to keep

*Where AI Tools Helped Most

The biggest win was iterating on the scoring engine. I could describe what I wanted ("cars matching the exact brand should score higher than partial matches, price proximity should scale linearly") and get working code fast. Also great for the repetitive stuff — setting up Express middleware, CORS, rate limiting, TypeScript types.

*Where They Got in the Way

- Sometimes generated overly complex solutions when I wanted something simple
- Had to fight it a few times on file structure — it wanted to over-engineer with too many abstraction layers
- Gemini prompt tuning was trial-and-error regardless of AI help — you still have to test with real queries and tweak manually

* If I Had Another 4 Hours

- Add response caching (same query = instant result)
- Car images via an external API
- A comparison mode to put 2-3 cars side by side
- Better mobile layout
- Streaming responses so the user sees results appearing progressively
