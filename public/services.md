# ShipLane Managed Services Catalog

## Compute (Autonomous Containers)
ShipLane provides serverless container runtime environments with zero-to-one fast activation and automated horizontal scaling. Web services run inside isolated Docker containers monitored by our Traefik reverse proxy. Compute automatically sleeps after 15 minutes of inactivity and wakes upon receiving HTTP traffic in sub-second latency. Replicas scale horizontally from 1 to 20 instances based on concurrency and traffic load.
- Control API: `PATCH /api/v1/scaling` and `POST /api/v1/deploy`

## Multi-Database (Postgres, MySQL, Redis, MongoDB)
Provision fully managed, containerized database instances in dedicated Docker bridge networks with a single API request. Engines include PostgreSQL 17 (relational with JSONB/pgvector), MySQL 8.0, Redis 7 (in-memory caching & pub/sub), and MongoDB 7.0 (document store). Connection strings are automatically encrypted and injected into your application runtime environment variables (`DATABASE_URL`, `REDIS_URL`, or `MONGODB_URI`).
- Control API: `POST /api/v1/databases` and `DELETE /api/v1/databases/:id`

## Object Storage (S3-Compatible Buckets)
Because application container local filesystems are ephemeral and reset on each deployment or restart, ShipLane provisions dedicated MinIO-powered S3-compatible storage buckets. Buckets provide persistent, durable storage for user uploads, build assets, and media files, accessible via standard AWS S3 SDKs and presigned URLs.
- Control API: `GET /api/v1/applications/:id` (Storage Buckets integration)

## Scheduled Tasks (Cron Jobs)
Always-on background worker daemons that block compute shutdown are prohibited. Instead, background workloads are executed via scheduled Cron Jobs. ShipLane invokes specified HTTP endpoints or execution hooks according to your cron schedule definitions, supporting standard 5-part cron syntax with automatic failure logging and retries.
- Control API: `POST /api/v1/applications/:id` (Cron Jobs configuration)

## Custom Domains & Automated TLS
Every ShipLane application receives a default HTTPS subdomain (`<subdomain>.ShipLane.app`) upon creation. For production workloads, attach custom apex domains and subdomains with automated DNS verification and zero-touch Let's Encrypt TLS certificate provisioning and renewal handled at the Traefik edge.
- Control API: `POST /api/v1/domains` and `DELETE /api/v1/domains/:id`

## Container Security Scanner
Automated static analysis and vulnerability scanning runs during every deployment and preview build. ShipLane inspects code dependencies, container configurations, and environment secrets for common CVEs, hardcoded credentials, and configuration drifts, providing actionable severity classifications and remediation recommendations.
- Control API: `POST /api/v1/security/scans` and `GET /api/v1/security/scans/:id`

