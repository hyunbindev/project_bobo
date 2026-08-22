import { getPlayerByName } from "@/lib/pubg/players";
import { getMatchById } from "@/lib/pubg/matches";
export default async function testPage() {
    const res = await getMatchById("5dca5929-ba08-4a3d-9dfc-5cc343e84689", "kakao");
    return(
        <div>{JSON.stringify(res)}</div>
    )
}
