// Players API에서 사용할 수 있는 플랫폼 샤드만 허용한다.
export const PUBG_PLATFORMS = ["steam", "kakao", "psn", "xbox"] as const;

// 플랫폼 목록과 타입이 서로 어긋나지 않도록 배열에서 유니언 타입을 만든다.
export type PubgPlatform = (typeof PUBG_PLATFORMS)[number];

// PUBG API는 JSON:API 형식으로 관계 리소스의 type과 id를 내려준다.
export type PubgResourceIdentifier = {
  type: string;
  id: string;
};

// 외부 API의 원본 응답 타입이다. 화면에서는 이 타입을 직접 사용하지 않는다.
export type PubgPlayerResource = {
  type: "player";
  id: string;
  attributes: {
    name: string;
    shardId: string;
    clanId?: string;
  };
  relationships: {
    matches: {
      data: PubgResourceIdentifier[];
    };
  };
};

export type PubgPlayersResponse = {
  data: PubgPlayerResource[];
  links?: {
    self?: string;
  };
  meta?: Record<string, unknown>;
};

// 애플리케이션 내부에서 사용할 최소한의 플레이어 데이터다.
export type PubgPlayer = {
  accountId: string;
  name: string;
  platform: PubgPlatform;
  clanId: string | null;
  matchIds: string[];
};
