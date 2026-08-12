import axios from "axios";
import axiosRetry from "axios-retry";

export function createHttpClient(timeout = 15_000) {
  const client = axios.create({ timeout });

  axiosRetry(client, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429,
  });

  return client;
}
