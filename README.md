# CarMatch AI

An enterprise-grade, AI-driven vehicle recommendation engine that leverages natural language processing to intelligently match users with their ideal cars based on their specific needs and budget constraints.

## Overview

CarMatch AI is designed for the Indian market, allowing users to type natural language queries like "I want a fuel-efficient SUV under 15 lakhs" and receive the top 5 matches from a 15k-vehicle dataset. Each recommendation includes dynamically generated AI reasons explaining why the car fits the user's specific request.

## Production-Ready Features

As part of the upgrade to an enterprise-grade system, the following features are implemented:
- **Enhanced Security & Performance:** Integration of `helmet` for HTTP header security, and `compression` for payload optimization.
- **AI Response Caching:** Implemented `node-cache` to store and instantly serve previous AI queries, significantly reducing latency and API costs.
- **Containerization:** A complete Docker setup (`Dockerfile` & `.dockerignore`) for seamless deployment across any environment.
- **Robust Testing:** Unit tests built with `vitest` to ensure the reliability of the core `scoringEngine`.

## Architecture & Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Express (Node.js) | Lightweight, fast REST API |
| **AI Engine** | Google Gemini 2.5 Flash | Parses natural language into structured filters + generates suitability reasons |
| **Data Layer** | CSV (In-memory) | Fast, in-memory loading of 15k Indian vehicle records |
| **Infrastructure** | Docker | Containerized deployment |
| **Testing** | Vitest | Fast unit testing |

## What I Deliberately Cut (V1)
- User accounts or saved preferences (stateless, session history lives in the browser only).
- Car images (requires external API integration).
- Comparison view (side-by-side car comparison).
- Complex filters/sorting UI (the focus is purely on natural language processing).

## Future Roadmap (If I Had Another 4 Hours)
- Fetch car images via an external API.
- Introduce a comparison mode for side-by-side evaluations.
- Streaming responses for progressive loading of results.
- Enhanced mobile-responsive layouts for the frontend.
