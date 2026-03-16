import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisOptions = {
  maxRetriesPerRequest: null,
};

declare global {
  var _redis: Redis | undefined;
}

export const redis =
  global._redis || new Redis(redisUrl, redisOptions);

if (process.env.NODE_ENV !== "production") {
  global._redis = redis;
}
