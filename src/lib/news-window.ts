export type NewsWindow = {
  startsAt: Date;
  endsAt: Date;
  timezone: "Asia/Kolkata";
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function utcFromIstWallTime(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
) {
  return new Date(Date.UTC(year, monthIndex, day, hour, minute) - IST_OFFSET_MS);
}

export function getMorningNewsWindow(now = new Date()): NewsWindow {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const year = istNow.getUTCFullYear();
  const monthIndex = istNow.getUTCMonth();
  const day = istNow.getUTCDate();

  return {
    startsAt: utcFromIstWallTime(year, monthIndex, day - 1, 15, 30),
    endsAt: utcFromIstWallTime(year, monthIndex, day, 9, 0),
    timezone: "Asia/Kolkata",
  };
}

export function isPublishedInWindow(
  publishedAt: string | undefined,
  window: NewsWindow,
) {
  if (!publishedAt) {
    return false;
  }

  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return false;
  }

  return (
    publishedTime >= window.startsAt.getTime() &&
    publishedTime <= window.endsAt.getTime()
  );
}
