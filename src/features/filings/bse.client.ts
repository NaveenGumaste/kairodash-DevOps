import "server-only";

import { createHttpClient } from "@/lib/http";

export type BSEAnnouncement = {
  HEADLINE: string;
  ATTACHMENTNAME?: string;
  NEWS_DT: string;
  SCRIP_CD: string;
  CATEGORYNAME?: string;
  pdfUrl?: string;
};

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const date = `${value.getDate()}`.padStart(2, "0");
  return `${year}${month}${date}`;
}

export async function fetchBseAnnouncements(bseCode: string, daysBack = 7) {
  const client = createHttpClient(10_000);
  const to = new Date();
  const from = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const response = await client.get<{
    Table?: BSEAnnouncement[];
  }>("https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w", {
    params: {
      strCat: "-1",
      strPrevDate: formatDate(from),
      strScrip: bseCode,
      strSearch: "P",
      strToDate: formatDate(to),
      strType: "C",
    },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Accept: "application/json,text/plain,*/*",
      Origin: "https://www.bseindia.com",
      Referer: "https://www.bseindia.com/",
    },
  });

  return (response.data.Table ?? []).map((item) => ({
    ...item,
    pdfUrl: item.ATTACHMENTNAME
      ? `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${item.ATTACHMENTNAME}`
      : undefined,
  }));
}
