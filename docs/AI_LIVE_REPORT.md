# Actual AI provider verification — 2026-10-22

The key is configured in private .env.local (not an ambient agent credential). Ten bounded synthetic requests were sent through the application's real provider function. All returned HTTP200. Translation, grammar, spelling, paraphrasing, rewriting, summarization, short writing, conversational rewriting and email fixtures preserved the asserted facts. Detector verification covers structured score/analysis output only; it does not establish authorship-detection accuracy.

Two initial exact-word checks were too restrictive. “Participation is voluntary” preserves optional attendance; “starts welcoming customers at8AM” preserves the8AM opening. Both were manually reviewed and marked scoped pass, with the original automatic review retained in ai-live-initial-review-results.json. No further requests were made just to obtain a preferred wording.

The run used synthetic text, at most10 sequential requests,20second deadlines and the application's existing2048output-token cap, with no automatic retries. No key, authorization header or user document content is stored in reports. No Atlas writes occurred.

This is live provider-function evidence. The public production AI API correctly remains blocked without shared Atlas quota storage. Its pages now remain noindex until both provider and storage configuration exist. Atlas URI/persistence/quota concurrency and Copyleaks/public callback configuration remain pending. These fixtures do not certify arbitrary AI accuracy, hallucination resistance, translations in all languages or reliable AI-authorship detection.

Source: [OpenAI Chat Completions request reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create). Raw local evidence: ai-live-results.json.
