import type { Flashcard } from './flashcards';

// System design: building blocks, trade-offs and classic interview designs
export const systemDesignCards: Flashcard[] = [
  // --- Fundamentals ---
  {
    title: 'Interview Framework',
    category: 'Fundamentals',
    question: 'How should you structure a 45-minute system design interview?',
    pattern: 'Requirements → estimates → API → high-level design → deep dives',
    approach:
      'Spend ~5 min clarifying functional and non-functional requirements (scale, latency, consistency, availability). Do quick back-of-envelope math (QPS, storage, bandwidth). Define the core API and data model. Sketch the high-level boxes end to end. Then deep-dive into the hardest one or two parts (bottlenecks, failure modes) and call out trade-offs explicitly.',
  },
  {
    title: 'Back-of-Envelope Estimation',
    category: 'Fundamentals',
    question: 'How do you estimate QPS and storage for a system with 100M daily active users?',
    pattern: 'Users × actions ÷ 86,400 seconds, then multiply out bytes',
    approach:
      'A day has ~10^5 seconds. 100M DAU × 10 requests/day = 10^9 requests/day ≈ 10K QPS average; assume peak is 2–5× that. For storage: writes/day × bytes per record × retention (e.g. 10^8 posts/day × 1 KB = 100 GB/day ≈ 36 TB/year). Round aggressively; the order of magnitude is what drives the design.',
  },
  {
    title: 'Latency Numbers',
    category: 'Fundamentals',
    question: 'Roughly how long do memory reads, SSD reads, and network round trips take?',
    pattern: 'Memory ns, SSD µs, network within a DC ~0.5 ms, cross-continent ~100 ms',
    approach:
      'L1 cache ~1 ns; main memory ~100 ns; SSD random read ~100 µs; round trip within a data center ~0.5 ms; disk seek ~10 ms; packet US↔Europe ~150 ms. Takeaways: keep hot data in memory, avoid chatty cross-region calls, and batch network requests.',
  },
  {
    title: 'CAP Theorem',
    category: 'Fundamentals',
    question: 'What does the CAP theorem say, and how do you apply it?',
    pattern: 'During a network partition, choose consistency or availability',
    approach:
      'Partitions will happen in a distributed system, so the real choice is CP (reject or block requests to stay consistent, e.g. banking balances, inventory) vs AP (keep serving possibly stale data, e.g. social feeds, likes). PACELC extends it: even without partitions, you trade latency against consistency.',
  },
  {
    title: 'Consistency Models',
    category: 'Fundamentals',
    question: 'Compare strong, eventual, and read-your-writes consistency.',
    pattern: 'How soon a write becomes visible to readers',
    approach:
      'Strong: every read sees the latest write (needs coordination, higher latency). Eventual: replicas converge over time; reads may be stale. Read-your-writes: a user always sees their own updates, often done by routing that user’s reads to the leader for a short window. Pick the weakest model the product can tolerate.',
  },
  {
    title: 'Vertical vs Horizontal Scaling',
    category: 'Fundamentals',
    question: 'When do you scale up vs scale out?',
    pattern: 'Bigger machine vs more machines',
    approach:
      'Vertical scaling is simple (no code changes) but has a hardware ceiling and a single point of failure. Horizontal scaling adds capacity and redundancy but requires stateless services, load balancing, and data partitioning. Start vertical for databases where possible; make application servers stateless so they scale out freely.',
  },

  // --- Building Blocks ---
  {
    title: 'Load Balancers',
    category: 'Building Blocks',
    question: 'What does a load balancer do, and what are L4 vs L7 load balancers?',
    pattern: 'Spread traffic across healthy servers',
    approach:
      'L4 balances on TCP/UDP connection info: fast, protocol-agnostic. L7 understands HTTP, so it can route by path or header, terminate TLS, and do sticky sessions. Algorithms: round robin, least connections, consistent hashing. Health checks remove dead nodes. Run LBs in pairs (active-passive or DNS-level) so the LB isn’t a single point of failure.',
  },
  {
    title: 'Caching Strategies',
    category: 'Building Blocks',
    question: 'Compare cache-aside, write-through, and write-back caching.',
    pattern: 'Who writes the cache, and when',
    approach:
      'Cache-aside (lazy loading): app reads cache, on miss reads DB and fills cache; most common, but the first read is slow and data can go stale. Write-through: write to cache and DB together; reads are fresh but writes are slower. Write-back: write to cache, flush to DB later; fast writes but risk of data loss. Use TTLs plus explicit invalidation on writes.',
  },
  {
    title: 'Cache Eviction & Stampedes',
    category: 'Building Blocks',
    question: 'How do caches evict entries, and what is a cache stampede?',
    pattern: 'LRU/LFU eviction; stampede = many misses hitting the DB at once',
    approach:
      'LRU evicts the least recently used key (good default); LFU keeps frequently used keys. A stampede happens when a hot key expires and thousands of requests miss together. Fixes: a lock or single-flight so one request refills the key, jittered TTLs so keys don’t expire together, and serving stale data while refreshing in the background.',
  },
  {
    title: 'CDN',
    category: 'Building Blocks',
    question: 'What is a CDN and what should go on one?',
    pattern: 'Edge servers that cache content close to users',
    approach:
      'A CDN serves static assets (images, video, JS/CSS) from points of presence near the user, cutting latency and origin load. Pull CDNs fetch from origin on first miss; push CDNs are uploaded ahead of time. Use content-hashed filenames for cache busting. Some dynamic or personalized responses can also be cached at the edge with short TTLs.',
  },
  {
    title: 'Message Queues',
    category: 'Building Blocks',
    question: 'Why put a message queue between services?',
    pattern: 'Decouple producers from consumers and absorb bursts',
    approach:
      'Producers enqueue work and return immediately; consumers process at their own pace, so traffic spikes don’t overwhelm downstream services. Queues enable retries, dead-letter queues for poison messages, and independent scaling of workers. Trade-offs: added latency, eventual consistency, and you must design for at-least-once delivery (idempotent consumers).',
  },
  {
    title: 'Kafka vs Traditional Queue',
    category: 'Building Blocks',
    question: 'How is a log like Kafka different from a queue like SQS or RabbitMQ?',
    pattern: 'Durable replayable log vs messages deleted on ack',
    approach:
      'Kafka appends events to partitioned, retained logs; consumer groups track their own offsets, so many consumers can read the same stream and replay history. Ordering is guaranteed within a partition. A classic queue hands each message to one consumer and deletes it on acknowledgment. Use Kafka for event streaming and fan-out; a queue for task distribution.',
  },
  {
    title: 'Rate Limiting',
    category: 'Building Blocks',
    question: 'How would you implement a rate limiter?',
    pattern: 'Token bucket (or sliding window) keyed by user/IP',
    approach:
      'Token bucket: each key has a bucket refilled at a fixed rate; each request takes a token or gets HTTP 429. It allows short bursts. Sliding window counters are smoother than fixed windows, which allow double bursts at boundaries. In a distributed setup, keep counters in Redis with atomic increments (or a Lua script) and enforce at the API gateway.',
  },
  {
    title: 'API Gateway',
    category: 'Building Blocks',
    question: 'What does an API gateway do in a microservice architecture?',
    pattern: 'A single front door for cross-cutting concerns',
    approach:
      'It routes requests to backend services and centralizes authentication, rate limiting, TLS termination, request logging, and sometimes response aggregation. This keeps those concerns out of every service. Risks: it can become a bottleneck or single point of failure, so run it horizontally scaled and keep business logic out of it.',
  },

  // --- Data ---
  {
    title: 'SQL vs NoSQL',
    category: 'Data',
    question: 'How do you choose between a relational database and a NoSQL store?',
    pattern: 'Relations and transactions vs scale and flexible access patterns',
    approach:
      'Choose SQL for structured data with relationships, joins, and ACID transactions (payments, orders). Choose NoSQL when you need massive horizontal write scale, a simple known access pattern (key-value, wide-column like Cassandra), or flexible schemas (documents). Many systems use both. Default to Postgres unless you have a concrete reason not to.',
  },
  {
    title: 'Database Indexes',
    category: 'Data',
    question: 'How do indexes speed up queries, and what do they cost?',
    pattern: 'B-tree lookup instead of a full table scan',
    approach:
      'A B-tree index makes lookups and range scans O(log n). Composite indexes follow the leftmost-prefix rule, so column order matters. Costs: extra storage and slower writes, since every insert and update must also update each index. Index columns used in WHERE, JOIN, and ORDER BY; check query plans with EXPLAIN.',
  },
  {
    title: 'Replication',
    category: 'Data',
    question: 'Explain leader-follower replication and its trade-offs.',
    pattern: 'One node takes writes, replicas serve reads',
    approach:
      'The leader handles writes and streams changes to followers, which scale reads and provide failover. Synchronous replication is durable but slow; asynchronous is fast but followers lag, causing stale reads, and a failover can lose recent writes. Multi-leader and leaderless (quorum, e.g. Dynamo/Cassandra with R + W > N) trade conflict resolution complexity for availability.',
  },
  {
    title: 'Sharding',
    category: 'Data',
    question: 'How do you shard a database, and what goes wrong?',
    pattern: 'Split rows across nodes by a shard key',
    approach:
      'Range sharding keeps ranges together (good for scans) but creates hot spots; hash sharding spreads load evenly but breaks range queries. Pick a high-cardinality key that matches the main access pattern (e.g. user_id). Problems: cross-shard joins and transactions, celebrity/hot keys, and resharding, which consistent hashing or many virtual shards make easier.',
  },
  {
    title: 'Consistent Hashing',
    category: 'Data',
    question: 'What is consistent hashing and why is it useful?',
    pattern: 'Keys and nodes on a hash ring; only ~1/n keys move on resize',
    approach:
      'With `hash(key) % n`, adding a node remaps almost every key. Consistent hashing places nodes on a ring and assigns each key to the next node clockwise, so adding or removing a node only moves its neighbors’ keys. Virtual nodes (many points per server) smooth out load imbalance. Used in distributed caches, Dynamo, and Cassandra.',
  },
  {
    title: 'ACID Transactions & Isolation',
    category: 'Data',
    question: 'What do ACID and transaction isolation levels mean?',
    pattern: 'Atomic, Consistent, Isolated, Durable; isolation trades anomalies for speed',
    approach:
      'Atomic: all or nothing. Consistent: constraints hold. Isolated: concurrent transactions don’t interfere. Durable: committed data survives crashes. Isolation levels from weak to strong: read committed (no dirty reads), repeatable read/snapshot (stable reads), serializable (as if one at a time). Watch for lost updates; fix with SELECT … FOR UPDATE or optimistic version checks.',
  },
  {
    title: 'Blob / Object Storage',
    category: 'Data',
    question: 'Where should you store images, videos, and other large files?',
    pattern: 'Object storage (S3) with metadata in the database',
    approach:
      'Store the bytes in object storage and only the URL and metadata in the DB. Let clients upload directly with pre-signed URLs so file traffic bypasses your app servers, and serve downloads through a CDN. Large uploads use multipart/resumable upload; post-processing (thumbnails, transcoding) runs asynchronously from an upload event.',
  },

  // --- Reliability ---
  {
    title: 'Idempotency',
    category: 'Reliability',
    question: 'Why do APIs need idempotency, and how do you implement it?',
    pattern: 'Retrying the same request must not apply it twice',
    approach:
      'Networks fail after the server acted but before the client heard back, so clients retry. The client sends an idempotency key with the request; the server stores key → result and returns the saved result on repeats. Essential for payments and any at-least-once message consumer. PUT and DELETE should be idempotent by design; POST needs the key.',
  },
  {
    title: 'Delivery Guarantees',
    category: 'Reliability',
    question: 'Compare at-most-once, at-least-once, and exactly-once delivery.',
    pattern: 'Exactly-once is at-least-once plus idempotent processing',
    approach:
      'At-most-once: fire and forget; messages can be lost. At-least-once: retry until acknowledged; messages can be duplicated. True exactly-once delivery is impractical across systems, so you get exactly-once effects by combining at-least-once delivery with deduplication or idempotent writes (or transactional outbox patterns).',
  },
  {
    title: 'Circuit Breakers & Retries',
    category: 'Reliability',
    question: 'How do you keep one failing dependency from taking down the whole system?',
    pattern: 'Timeouts, retries with backoff and jitter, circuit breakers',
    approach:
      'Always set timeouts. Retry only transient errors, with exponential backoff and jitter to avoid synchronized retry storms. A circuit breaker trips after repeated failures and fails fast for a cooldown period, then lets a few test requests through (half-open). Add bulkheads (separate pools) and graceful degradation, like serving cached or default data.',
  },
  {
    title: 'Distributed Transactions',
    category: 'Reliability',
    question: 'How do you keep data consistent across multiple services?',
    pattern: 'Sagas with compensating actions (avoid two-phase commit)',
    approach:
      'Two-phase commit gives atomicity but blocks if the coordinator fails and couples services tightly. A saga breaks the operation into local transactions, each publishing an event; if a step fails, earlier steps are undone by compensating actions (refund, release inventory). Use the transactional outbox pattern so a DB write and its event publish can’t diverge.',
  },
  {
    title: 'High Availability',
    category: 'Reliability',
    question: 'What does "four nines" mean, and how do you design for it?',
    pattern: '99.99% ≈ 52 minutes of downtime per year; remove single points of failure',
    approach:
      '99.9% ≈ 8.8 hours/year, 99.99% ≈ 52 min/year. Achieve it with redundancy at every layer (multiple instances, AZs, replicated data), automated health checks and failover, and safe deploys (canaries, rollbacks). Serial dependencies multiply: two 99.9% services in a chain give ~99.8%.',
  },

  // --- Communication ---
  {
    title: 'REST vs gRPC vs GraphQL',
    category: 'Communication',
    question: 'When would you choose REST, gRPC, or GraphQL?',
    pattern: 'Public simplicity vs internal performance vs flexible client queries',
    approach:
      'REST: resource-oriented HTTP + JSON, cacheable, the default for public APIs. gRPC: Protobuf over HTTP/2, fast with strong typing and streaming, good for service-to-service calls. GraphQL: clients request exactly the fields they need from one endpoint, which avoids over- and under-fetching for varied UIs, at the cost of harder caching and query cost control.',
  },
  {
    title: 'Real-Time Updates',
    category: 'Communication',
    question: 'Compare polling, long polling, SSE, and WebSockets.',
    pattern: 'From client-pulls to persistent two-way connections',
    approach:
      'Short polling is simple but wasteful. Long polling holds a request open until there’s data. Server-Sent Events stream one-way server → client over HTTP with auto-reconnect (good for feeds, notifications). WebSockets are full-duplex (chat, games, collaboration) but need stateful connection servers and a pub/sub layer to route messages to the right server.',
  },

  // --- Classic Designs ---
  {
    title: 'Design a URL Shortener',
    category: 'Classic Designs',
    question: 'Design a service like bit.ly that turns long URLs into short links.',
    pattern: 'Unique ID → base62 code, read-heavy KV lookup behind a cache',
    approach:
      'Generate unique IDs (a counter with pre-allocated ranges per server, or Snowflake-style IDs) and base62-encode them; 7 chars gives ~3.5 trillion codes. Store code → long URL in a key-value store. Reads dominate (~100:1), so cache hot codes and return a 301/302 redirect (302 if you need click analytics). Log clicks asynchronously through a queue.',
  },
  {
    title: 'Design a News Feed',
    category: 'Classic Designs',
    question: 'Design the home timeline for a social network like Twitter.',
    pattern: 'Fan-out on write, with fan-out on read for celebrities',
    approach:
      'Fan-out on write: when a user posts, push the post ID into each follower’s precomputed feed in a cache (fast reads, expensive for users with millions of followers). Fan-out on read: build the feed at request time by merging followees’ posts (cheap writes, slow reads). Hybrid: push for normal users, pull celebrity posts at read time and merge. Paginate with cursors.',
  },
  {
    title: 'Design a Chat System',
    category: 'Classic Designs',
    question: 'Design a messaging app like WhatsApp or Slack.',
    pattern: 'WebSocket gateways + pub/sub routing + per-conversation message store',
    approach:
      'Clients hold WebSocket connections to gateway servers; a presence/session service maps user → gateway. Sending: persist the message (partitioned by conversation_id, ordered by a per-conversation sequence), then route to recipients’ gateways via pub/sub. Offline users get push notifications and sync missed messages from their last seen sequence on reconnect.',
  },
  {
    title: 'Design a Notification System',
    category: 'Classic Designs',
    question: 'Design a system that sends push, email, and SMS notifications at scale.',
    pattern: 'Event → queue per channel → workers calling third-party providers',
    approach:
      'Services publish notification events; a notification service checks user preferences and rate limits, renders templates, and enqueues to per-channel queues (push/APNs/FCM, email, SMS). Workers send with retries and backoff, dedupe with idempotency keys, and move failures to a dead-letter queue. Track delivery status for analytics.',
  },
  {
    title: 'Design Search Autocomplete',
    category: 'Classic Designs',
    question: 'Design typeahead suggestions for a search box.',
    pattern: 'Trie with precomputed top-k per prefix, served from memory',
    approach:
      'Store a trie where each node caches the top-k most popular completions for that prefix, so lookups are O(prefix length). Build it offline from aggregated query logs and refresh periodically rather than updating on every search. Shard by prefix, cache aggressively (including on the client and CDN), and debounce requests in the browser.',
  },
  {
    title: 'Design a Distributed Key-Value Store',
    category: 'Classic Designs',
    question: 'Design a highly available key-value store like DynamoDB or Cassandra.',
    pattern: 'Consistent hashing + replication + tunable quorums',
    approach:
      'Partition keys with consistent hashing (virtual nodes) and replicate each key to N nodes. Tunable consistency with quorums: R + W > N gives strong reads. Handle conflicts with vector clocks or last-write-wins, temporary failures with hinted handoff, and divergence with read repair and Merkle-tree anti-entropy. Gossip protocols track membership and failures.',
  },
  {
    title: 'Design a Web Crawler',
    category: 'Classic Designs',
    question: 'Design a crawler that downloads billions of web pages.',
    pattern: 'URL frontier queue + distributed fetchers + dedup',
    approach:
      'Seed URLs go into a prioritized frontier, partitioned by host so each host gets one polite queue (respect robots.txt and crawl delays). Fetcher workers download pages, store content in blob storage, extract links, and push new ones back. Dedupe URLs with a Bloom filter or seen-set and content with checksums; watch for spider traps with depth limits.',
  },
];
