export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export function jsonError(error: unknown, status = 500) {
  return json({ error: toErrorMessage(error) }, { status });
}
