import "server-only";

const DEVELOPMENT_BASE_URL = "http://localhost:3000";

type DiscordCampaign = {
  campaign: string;
  content: string;
};

/** Discord 메시지에서 사용하는 서비스 내부 링크를 생성한다. */
export function createDiscordAppUrl(pathname: string, tracking?: DiscordCampaign) {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? DEVELOPMENT_BASE_URL
      : process.env.APP_BASE_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  try {
    const url = new URL(pathname, baseUrl);
    if (tracking) {
      url.searchParams.set("utm_source", "discord");
      url.searchParams.set("utm_medium", "bot");
      url.searchParams.set("utm_campaign", tracking.campaign);
      url.searchParams.set("utm_content", tracking.content);
    }
    return url.toString();
  } catch {
    return null;
  }
}
