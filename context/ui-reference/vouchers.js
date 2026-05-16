/* VouchStack ledger seed data — 12 realistic vouchers
   Structured to match the schema in §9 of the source-of-truth doc.
   Numbers are demo-realistic; signatures are illustrative (not actually verified). */

window.VOUCHSTACK_DATA = (() => {
  // Helpers
  const iso = (d) => new Date(d).toISOString();
  const fakeSig = () => {
    let s = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (let i = 0; i < 88; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s + "==";
  };
  const fakeHash = () => {
    let s = "";
    const chars = "0123456789abcdef";
    for (let i = 0; i < 64; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };
  const fakeSha = () => fakeHash().slice(0, 40);

  // Publisher registry
  const publishers = [
    { pubkey: "MCowBQYDK2VwAyEAhX9k2QmZ1tR4nP8sJ7uW3vY6oL5bF2aH9cN4kM8eT3D", label: "Lex Alpha Legal", verified_github_user: "lex-alpha", voucher_count: 4 },
    { pubkey: "MCowBQYDK2VwAyEAm2X8Y3qZ7nP1vR6wK4tU8jL5sN9bH3aF7cM2eY1oQ5D", label: "MedFlow Health", verified_github_user: "medflow", voucher_count: 3 },
    { pubkey: "MCowBQYDK2VwAyEAk5R7nQ2zP9wM3vY6jL4tU8sN1bH5aF7cE2kY9oM3pX1D", label: "Helio Support", verified_github_user: "helio-support", voucher_count: 2 },
    { pubkey: "MCowBQYDK2VwAyEAp3X9Y5qR8nM1vJ7wK6tU2sL4bH9aF1cN5eY7oQ3D2pZ", label: "Kenny @ VouchStack", verified_github_user: "kennyc", voucher_count: 3 },
  ];

  const baseChecks = {
    "Maintained": 10, "Code-Review": 8, "Branch-Protection": 7,
    "Dangerous-Workflow": 10, "Token-Permissions": 10, "Pinned-Dependencies": 4,
    "Vulnerabilities": 9, "Security-Policy": 10
  };

  const vouchers = [
    // === DEMO RUN (Kenny, today) — the three candidates from §15 demo script ===
    {
      voucher_id: "vch_2026-05-16T15-42-08_a3f9c1",
      issued_at: iso("2026-05-16T15:42:08.421Z"),
      subject: { candidate: "langchain", version: "0.3.7", ecosystem: "pypi", repo_url: "https://github.com/langchain-ai/langchain" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/vouchstack/vouchstack-demo-tickets", task_type: "rag", language: "python", domain_tags: ["customer-support", "tickets"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 10, synthesis_method: "bob_generated_from_corpus", corpus_summary: "50 synthetic customer support tickets", corpus_doc_count: 50 },
      metrics: { retrieval_at_5: 0.80, retrieval_at_10: 0.92, latency_p50_ms: 412, latency_p95_ms: 891, tokens_per_query: 1240, tokens_estimated: false, cost_per_1k_queries_usd: 0.00, memory_peak_mb: 215, runs: 10 },
      security: { openssf_score: 6.8, openssf_checks: baseChecks, semgrep_findings_count: 0, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0", "BSD-3-Clause"] },
      maintenance: { github_stars: 95420, weekly_downloads: 2840000, last_commit_iso: iso("2026-05-13T18:42:11Z"), open_issues: 312, contributors_count_90d: 42 },
      bob_attestation: { session_id: "bob-sess-2026-05-16T15-08-11Z-7c4f", bob_version: "1.0.0", modes_used: ["ai-adoption-architect", "code"], skill_used: "vouchstack-trial" },
      environment: { os: "Linux 5.15.0-WSL2", python_version: "3.11.6", embedding_model: "sentence-transformers/all-MiniLM-L6-v2", embedding_model_revision: "e4ce9877" },
      publisher_pubkey: publishers[3].pubkey,
      champion: true,
    },
    {
      voucher_id: "vch_2026-05-16T15-38-22_b7e2d9",
      issued_at: iso("2026-05-16T15:38:22.108Z"),
      subject: { candidate: "llama-index", version: "0.11.20", ecosystem: "pypi", repo_url: "https://github.com/run-llama/llama_index" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/vouchstack/vouchstack-demo-tickets", task_type: "rag", language: "python", domain_tags: ["customer-support", "tickets"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 10, synthesis_method: "bob_generated_from_corpus", corpus_summary: "50 synthetic customer support tickets", corpus_doc_count: 50 },
      metrics: { retrieval_at_5: 0.70, retrieval_at_10: 0.85, latency_p50_ms: 587, latency_p95_ms: 1240, tokens_per_query: 1680, tokens_estimated: true, cost_per_1k_queries_usd: 0.00, memory_peak_mb: 268, runs: 10 },
      security: { openssf_score: 4.2, openssf_checks: { ...baseChecks, "Maintained": 8, "Code-Review": 5, "Pinned-Dependencies": 2 }, semgrep_findings_count: 1, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 38240, weekly_downloads: 1420000, last_commit_iso: iso("2026-05-14T09:21:05Z"), open_issues: 184, contributors_count_90d: 31 },
      bob_attestation: { session_id: "bob-sess-2026-05-16T15-08-11Z-7c4f", bob_version: "1.0.0", modes_used: ["ai-adoption-architect", "code"], skill_used: "vouchstack-trial" },
      environment: { os: "Linux 5.15.0-WSL2", python_version: "3.11.6", embedding_model: "sentence-transformers/all-MiniLM-L6-v2", embedding_model_revision: "e4ce9877" },
      publisher_pubkey: publishers[3].pubkey,
    },
    {
      voucher_id: "vch_2026-05-16T15-33-47_c4a8f1",
      issued_at: iso("2026-05-16T15:33:47.902Z"),
      subject: { candidate: "haystack", version: "2.8.0", ecosystem: "pypi", repo_url: "https://github.com/deepset-ai/haystack" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/vouchstack/vouchstack-demo-tickets", task_type: "rag", language: "python", domain_tags: ["customer-support", "tickets"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 10, synthesis_method: "bob_generated_from_corpus", corpus_summary: "50 synthetic customer support tickets", corpus_doc_count: 50 },
      metrics: { retrieval_at_5: 0.60, retrieval_at_10: 0.78, latency_p50_ms: 720, latency_p95_ms: 1580, tokens_per_query: 2010, tokens_estimated: true, cost_per_1k_queries_usd: 0.00, memory_peak_mb: 342, runs: 10 },
      security: { openssf_score: 5.4, openssf_checks: { ...baseChecks, "Pinned-Dependencies": 3 }, semgrep_findings_count: 0, license: "Apache-2.0", license_compatible_with: ["MIT", "Apache-2.0", "BSD-3-Clause"] },
      maintenance: { github_stars: 17890, weekly_downloads: 240000, last_commit_iso: iso("2026-05-11T14:08:22Z"), open_issues: 95, contributors_count_90d: 18 },
      bob_attestation: { session_id: "bob-sess-2026-05-16T15-08-11Z-7c4f", bob_version: "1.0.0", modes_used: ["ai-adoption-architect", "code"], skill_used: "vouchstack-trial" },
      environment: { os: "Linux 5.15.0-WSL2", python_version: "3.11.6", embedding_model: "sentence-transformers/all-MiniLM-L6-v2", embedding_model_revision: "e4ce9877" },
      publisher_pubkey: publishers[3].pubkey,
    },

    // === Seeded historical — Legal team ===
    {
      voucher_id: "vch_2026-05-15T11-22-14_d9f3a7",
      issued_at: iso("2026-05-15T11:22:14.882Z"),
      subject: { candidate: "langchain", version: "0.3.5", ecosystem: "pypi", repo_url: "https://github.com/langchain-ai/langchain" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/lex-alpha/contracts-rag", task_type: "rag", language: "python", domain_tags: ["legal", "documents", "contracts"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 20, synthesis_method: "bob_generated_from_corpus", corpus_summary: "412 contract clauses across employment, NDA, vendor agreements", corpus_doc_count: 412 },
      metrics: { retrieval_at_5: 0.75, retrieval_at_10: 0.85, latency_p50_ms: 456, latency_p95_ms: 980, tokens_per_query: 1380, tokens_estimated: false, cost_per_1k_queries_usd: 0.00, memory_peak_mb: 240, runs: 20 },
      security: { openssf_score: 6.8, openssf_checks: baseChecks, semgrep_findings_count: 0, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 95100, weekly_downloads: 2790000, last_commit_iso: iso("2026-05-12T22:14:08Z"), open_issues: 308, contributors_count_90d: 41 },
      bob_attestation: { session_id: "bob-sess-2026-05-15T11-04-22Z-2f8a", bob_version: "1.0.0", modes_used: ["ai-adoption-architect"], skill_used: "vouchstack-trial" },
      environment: { os: "macOS 14.4 arm64", python_version: "3.11.8", embedding_model: "sentence-transformers/all-MiniLM-L6-v2", embedding_model_revision: "e4ce9877" },
      publisher_pubkey: publishers[0].pubkey,
    },
    {
      voucher_id: "vch_2026-05-15T10-48-03_e1c4b2",
      issued_at: iso("2026-05-15T10:48:03.227Z"),
      subject: { candidate: "voyage-3", version: "1.0.0", ecosystem: "pypi", repo_url: "https://github.com/voyage-ai/voyageai-python" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/lex-alpha/contracts-rag", task_type: "embedding", language: "python", domain_tags: ["legal", "documents"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 20, synthesis_method: "bob_generated_from_corpus", corpus_summary: "412 contract clauses", corpus_doc_count: 412 },
      metrics: { retrieval_at_5: 0.85, retrieval_at_10: 0.94, latency_p50_ms: 180, latency_p95_ms: 380, tokens_per_query: 1380, tokens_estimated: false, cost_per_1k_queries_usd: 0.083, memory_peak_mb: 84, runs: 20 },
      security: { openssf_score: 7.2, openssf_checks: { ...baseChecks, "Pinned-Dependencies": 7 }, semgrep_findings_count: 0, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 3420, weekly_downloads: 84000, last_commit_iso: iso("2026-05-10T11:32:14Z"), open_issues: 22, contributors_count_90d: 8 },
      bob_attestation: { session_id: "bob-sess-2026-05-15T10-30-11Z-9a3c", bob_version: "1.0.0", modes_used: ["ai-adoption-architect"], skill_used: "vouchstack-trial" },
      environment: { os: "macOS 14.4 arm64", python_version: "3.11.8", embedding_model: "voyage-3", embedding_model_revision: "v3-2025-09" },
      publisher_pubkey: publishers[0].pubkey,
    },

    // === Seeded historical — Health team (LlamaIndex on transcripts) ===
    {
      voucher_id: "vch_2026-05-14T16-15-44_f8a2d3",
      issued_at: iso("2026-05-14T16:15:44.561Z"),
      subject: { candidate: "llama-index", version: "0.11.20", ecosystem: "pypi", repo_url: "https://github.com/run-llama/llama_index" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/medflow/transcripts-search", task_type: "rag", language: "python", domain_tags: ["healthcare", "transcripts"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 15, synthesis_method: "bob_generated_from_corpus", corpus_summary: "208 anonymized patient consultation transcripts", corpus_doc_count: 208 },
      metrics: { retrieval_at_5: 0.80, retrieval_at_10: 0.88, latency_p50_ms: 612, latency_p95_ms: 1340, tokens_per_query: 1720, tokens_estimated: true, cost_per_1k_queries_usd: 0.00, memory_peak_mb: 278, runs: 15 },
      security: { openssf_score: 4.2, openssf_checks: { ...baseChecks, "Maintained": 8, "Code-Review": 5, "Pinned-Dependencies": 2 }, semgrep_findings_count: 1, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 38140, weekly_downloads: 1410000, last_commit_iso: iso("2026-05-13T15:08:44Z"), open_issues: 182, contributors_count_90d: 31 },
      bob_attestation: { session_id: "bob-sess-2026-05-14T16-02-08Z-4d2b", bob_version: "1.0.0", modes_used: ["ai-adoption-architect"], skill_used: "vouchstack-trial" },
      environment: { os: "Linux 6.5.0", python_version: "3.12.1", embedding_model: "sentence-transformers/all-MiniLM-L6-v2", embedding_model_revision: "e4ce9877" },
      publisher_pubkey: publishers[1].pubkey,
    },
    {
      voucher_id: "vch_2026-05-14T15-58-12_a2b4c5",
      issued_at: iso("2026-05-14T15:58:12.118Z"),
      subject: { candidate: "openai-embed-3", version: "1.0.0", ecosystem: "pypi", repo_url: "https://github.com/openai/openai-python" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/medflow/transcripts-search", task_type: "embedding", language: "python", domain_tags: ["healthcare", "transcripts"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 15, synthesis_method: "bob_generated_from_corpus", corpus_summary: "208 anonymized patient consultation transcripts", corpus_doc_count: 208 },
      metrics: { retrieval_at_5: 0.87, retrieval_at_10: 0.93, latency_p50_ms: 220, latency_p95_ms: 480, tokens_per_query: 1380, tokens_estimated: false, cost_per_1k_queries_usd: 0.018, memory_peak_mb: 92, runs: 15 },
      security: { openssf_score: 7.8, openssf_checks: { ...baseChecks, "Pinned-Dependencies": 8 }, semgrep_findings_count: 0, license: "Apache-2.0", license_compatible_with: ["MIT", "Apache-2.0", "BSD-3-Clause"] },
      maintenance: { github_stars: 22480, weekly_downloads: 11200000, last_commit_iso: iso("2026-05-14T08:42:01Z"), open_issues: 64, contributors_count_90d: 22 },
      bob_attestation: { session_id: "bob-sess-2026-05-14T15-42-08Z-7e1f", bob_version: "1.0.0", modes_used: ["ai-adoption-architect"], skill_used: "vouchstack-trial" },
      environment: { os: "Linux 6.5.0", python_version: "3.12.1", embedding_model: "openai/text-embedding-3-small", embedding_model_revision: "v3" },
      publisher_pubkey: publishers[1].pubkey,
    },
    {
      voucher_id: "vch_2026-05-14T14-22-08_b3d5e2",
      issued_at: iso("2026-05-14T14:22:08.408Z"),
      subject: { candidate: "dspy", version: "2.5.6", ecosystem: "pypi", repo_url: "https://github.com/stanfordnlp/dspy" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/medflow/transcripts-search", task_type: "agent", language: "python", domain_tags: ["healthcare", "summarization"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 12, synthesis_method: "bob_generated_from_corpus", corpus_summary: "208 anonymized patient consultation transcripts", corpus_doc_count: 208 },
      metrics: { retrieval_at_5: 0.72, retrieval_at_10: 0.81, latency_p50_ms: 1840, latency_p95_ms: 4120, tokens_per_query: 4280, tokens_estimated: false, cost_per_1k_queries_usd: 0.21, memory_peak_mb: 420, runs: 12 },
      security: { openssf_score: 5.9, openssf_checks: { ...baseChecks, "Pinned-Dependencies": 5 }, semgrep_findings_count: 0, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 18420, weekly_downloads: 312000, last_commit_iso: iso("2026-05-12T18:14:32Z"), open_issues: 142, contributors_count_90d: 24 },
      bob_attestation: { session_id: "bob-sess-2026-05-14T14-08-22Z-3a8e", bob_version: "1.0.0", modes_used: ["ai-adoption-architect"], skill_used: "vouchstack-trial" },
      environment: { os: "Linux 6.5.0", python_version: "3.12.1", embedding_model: "openai/text-embedding-3-small", embedding_model_revision: "v3" },
      publisher_pubkey: publishers[1].pubkey,
    },

    // === Seeded historical — Helio Support ===
    {
      voucher_id: "vch_2026-05-13T09-44-08_c2e1d8",
      issued_at: iso("2026-05-13T09:44:08.221Z"),
      subject: { candidate: "langchain", version: "0.3.6", ecosystem: "pypi", repo_url: "https://github.com/langchain-ai/langchain" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/helio-support/kb-search", task_type: "rag", language: "python", domain_tags: ["customer-support", "knowledge-base"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 25, synthesis_method: "bob_generated_from_corpus", corpus_summary: "1,840 support articles + 320 macro replies", corpus_doc_count: 2160 },
      metrics: { retrieval_at_5: 0.84, retrieval_at_10: 0.92, latency_p50_ms: 488, latency_p95_ms: 1020, tokens_per_query: 1320, tokens_estimated: false, cost_per_1k_queries_usd: 0.00, memory_peak_mb: 244, runs: 25 },
      security: { openssf_score: 6.8, openssf_checks: baseChecks, semgrep_findings_count: 0, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 95280, weekly_downloads: 2820000, last_commit_iso: iso("2026-05-12T20:08:14Z"), open_issues: 310, contributors_count_90d: 41 },
      bob_attestation: { session_id: "bob-sess-2026-05-13T09-22-44Z-1b8d", bob_version: "1.0.0", modes_used: ["ai-adoption-architect", "code"], skill_used: "vouchstack-trial" },
      environment: { os: "Linux 5.15.0-WSL2", python_version: "3.11.7", embedding_model: "sentence-transformers/all-MiniLM-L6-v2", embedding_model_revision: "e4ce9877" },
      publisher_pubkey: publishers[2].pubkey,
    },
    {
      voucher_id: "vch_2026-05-13T08-58-31_d4a8c3",
      issued_at: iso("2026-05-13T08:58:31.094Z"),
      subject: { candidate: "cohere-embed-v3", version: "5.4.0", ecosystem: "pypi", repo_url: "https://github.com/cohere-ai/cohere-python" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/helio-support/kb-search", task_type: "embedding", language: "python", domain_tags: ["customer-support"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 25, synthesis_method: "bob_generated_from_corpus", corpus_summary: "1,840 support articles", corpus_doc_count: 1840 },
      metrics: { retrieval_at_5: 0.81, retrieval_at_10: 0.89, latency_p50_ms: 240, latency_p95_ms: 510, tokens_per_query: 1320, tokens_estimated: false, cost_per_1k_queries_usd: 0.132, memory_peak_mb: 88, runs: 25 },
      security: { openssf_score: 6.4, openssf_checks: { ...baseChecks, "Pinned-Dependencies": 6 }, semgrep_findings_count: 0, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 1840, weekly_downloads: 92000, last_commit_iso: iso("2026-05-08T14:22:01Z"), open_issues: 18, contributors_count_90d: 6 },
      bob_attestation: { session_id: "bob-sess-2026-05-13T08-44-08Z-4f2a", bob_version: "1.0.0", modes_used: ["ai-adoption-architect"], skill_used: "vouchstack-trial" },
      environment: { os: "Linux 5.15.0-WSL2", python_version: "3.11.7", embedding_model: "cohere/embed-english-v3.0", embedding_model_revision: "v3.0" },
      publisher_pubkey: publishers[2].pubkey,
    },

    // === Misc — Lex Alpha exploring agents ===
    {
      voucher_id: "vch_2026-05-12T13-04-19_e5b9a2",
      issued_at: iso("2026-05-12T13:04:19.342Z"),
      subject: { candidate: "langgraph", version: "0.2.18", ecosystem: "pypi", repo_url: "https://github.com/langchain-ai/langgraph" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/lex-alpha/contract-review-agent", task_type: "agent", language: "python", domain_tags: ["legal", "agent", "review"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 8, synthesis_method: "bob_generated_from_corpus", corpus_summary: "Multi-step contract review pipeline", corpus_doc_count: 84 },
      metrics: { retrieval_at_5: 0.88, retrieval_at_10: 0.95, latency_p50_ms: 2240, latency_p95_ms: 5180, tokens_per_query: 6420, tokens_estimated: false, cost_per_1k_queries_usd: 0.32, memory_peak_mb: 380, runs: 8 },
      security: { openssf_score: 6.5, openssf_checks: baseChecks, semgrep_findings_count: 0, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 8420, weekly_downloads: 480000, last_commit_iso: iso("2026-05-11T19:42:08Z"), open_issues: 88, contributors_count_90d: 19 },
      bob_attestation: { session_id: "bob-sess-2026-05-12T12-48-22Z-8c3a", bob_version: "1.0.0", modes_used: ["ai-adoption-architect"], skill_used: "vouchstack-trial" },
      environment: { os: "macOS 14.4 arm64", python_version: "3.11.8", embedding_model: "voyage-3", embedding_model_revision: "v3-2025-09" },
      publisher_pubkey: publishers[0].pubkey,
    },
    {
      voucher_id: "vch_2026-05-12T11-22-44_f3c2a1",
      issued_at: iso("2026-05-12T11:22:44.118Z"),
      subject: { candidate: "bge-m3", version: "1.5.0", ecosystem: "huggingface", repo_url: "https://github.com/FlagOpen/FlagEmbedding" },
      context: { repo_sha: fakeSha(), repo_remote: "https://github.com/lex-alpha/contracts-rag", task_type: "embedding", language: "python", domain_tags: ["legal", "multilingual"] },
      goldset: { hash: "sha256:" + fakeHash(), size: 20, synthesis_method: "bob_generated_from_corpus", corpus_summary: "412 contract clauses (EN + FR + DE)", corpus_doc_count: 412 },
      metrics: { retrieval_at_5: 0.79, retrieval_at_10: 0.88, latency_p50_ms: 340, latency_p95_ms: 740, tokens_per_query: 1380, tokens_estimated: false, cost_per_1k_queries_usd: 0.00, memory_peak_mb: 1240, runs: 20 },
      security: { openssf_score: 4.8, openssf_checks: { ...baseChecks, "Pinned-Dependencies": 3, "Code-Review": 4 }, semgrep_findings_count: 2, license: "MIT", license_compatible_with: ["MIT", "Apache-2.0"] },
      maintenance: { github_stars: 6240, weekly_downloads: 380000, last_commit_iso: iso("2026-05-08T11:14:08Z"), open_issues: 124, contributors_count_90d: 12 },
      bob_attestation: { session_id: "bob-sess-2026-05-12T11-08-08Z-5b2c", bob_version: "1.0.0", modes_used: ["ai-adoption-architect"], skill_used: "vouchstack-trial" },
      environment: { os: "macOS 14.4 arm64", python_version: "3.11.8", embedding_model: "BAAI/bge-m3", embedding_model_revision: "5617a9f6" },
      publisher_pubkey: publishers[0].pubkey,
    },
  ];

  // Generate sigs for all vouchers
  vouchers.forEach(v => {
    v.version = "vouchstack/v1";
    v.signature = {
      algorithm: "ed25519",
      public_key: v.publisher_pubkey,
      signature: fakeSig(),
      canonical_hash: "sha256:" + fakeHash(),
    };
    // Attach publisher label for convenience
    v.publisher = publishers.find(p => p.pubkey === v.publisher_pubkey);
  });

  return { vouchers, publishers };
})();
