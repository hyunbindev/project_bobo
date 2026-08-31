export const teamStyles = {
  primary: {
    border: "border-primary/45",
    text: "text-primary",
    line: "bg-primary",
    glow: "bg-primary",
  },
  info: {
    border: "border-info/45",
    text: "text-info",
    line: "bg-info",
    glow: "bg-info",
  },
  kill: {
    border: "border-kill/45",
    text: "text-kill",
    line: "bg-kill",
    glow: "bg-kill",
  },
  support: {
    border: "border-support/45",
    text: "text-support",
    line: "bg-support",
    glow: "bg-support",
  },
} as const;

type TeamColor = keyof typeof teamStyles;

const teamColors: TeamColor[] = ["primary", "info", "kill", "support"];

/** 팀 수와 관계없이 고정 자릿수의 식별자를 생성한다. */
export function getTeamPresentation(index: number) {
  return {
    number: String(index + 1).padStart(3, "0"),
    color: teamColors[index % teamColors.length],
  };
}
