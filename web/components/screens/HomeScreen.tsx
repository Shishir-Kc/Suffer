"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, MapPinned, Settings2, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { demoCompletions, demoPlayers, demoQuestPools } from "@/lib/mockData";
import { getCurrentQuest, getQuestState } from "@/lib/questEngine";
import { RouteShell } from "@/components/RouteShell";
import { Card } from "@/components/ui/Card";
import { QuestCard } from "@/components/quest/QuestCard";
import { ChillZone } from "@/components/quest/ChillZone";

export function HomeScreen() {
  const router = useRouter();
  const player = demoPlayers[0];
  const adminPress = useRef<number | undefined>(undefined);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const individual = useMemo(
    () =>
      getCurrentQuest(
        demoQuestPools,
        "individual",
        demoCompletions,
        player.id,
        now,
      ),
    [now, player.id],
  );
  const group = useMemo(
    () =>
      getCurrentQuest(demoQuestPools, "group", demoCompletions, player.id, now),
    [now, player.id],
  );
  const individualState = individual
    ? getQuestState(individual, demoQuestPools, demoCompletions, player.id, now)
    : "completed";
  const groupState = group
    ? getQuestState(group, demoQuestPools, demoCompletions, player.id, now)
    : "completed";
  const completed = demoCompletions.filter(
    (completion) => completion.playerId === player.id,
  ).length;
  return (
    <RouteShell title="Home" eyebrow="Saturday · Day 1">
      <div className="home-heading">
        <div>
          <span className="eyebrow">Good morning, {player.name}</span>
          <h1>
            Ready to suffer
            <br />
            <em>beautifully?</em>
          </h1>
        </div>
        <button
          className="score-pill"
          onPointerDown={() => {
            adminPress.current = window.setTimeout(() => {
              router.push("/admin");
            }, 900);
          }}
          onPointerUp={() => window.clearTimeout(adminPress.current)}
          onPointerCancel={() => window.clearTimeout(adminPress.current)}
          aria-label="Your quest score"
        >
          <Trophy size={16} /> {completed}/5
        </button>
      </div>
      <div className="home-tools">
        <Link href="/map">
          <MapPinned size={16} /> Trip map
        </Link>
        <Link href="/report">
          <Flag size={16} /> Report
        </Link>
      </div>
      <div className="quest-stack">
        {individual ? (
          <QuestCard
            quest={individual}
            state={individualState}
            label="Your quest"
            now={now}
          />
        ) : (
          <ChillZone nextTrigger={demoQuestPools[2].triggerTime} />
        )}
        {group ? (
          <QuestCard
            quest={group}
            state={groupState}
            label="Group quest"
            now={now}
          />
        ) : (
          <QuestCard
            quest={demoQuestPools[1].candidates[0]}
            state="completed"
            label="Group quest"
          />
        )}
      </div>
      <Card className="final-card">
        <div className="final-card-icon">?</div>
        <div>
          <span className="eyebrow">Final quest</span>
          <h2>Something&apos;s coming</h2>
          <p>Unlocks at 3:30 PM on Day 2. Don&apos;t be late.</p>
        </div>
        <Settings2 size={18} aria-hidden="true" />
      </Card>
      <section className="leaderboard-teaser">
        <div className="section-heading">
          <h2>How the crew is doing</h2>
          <Link href="/leaderboard">See all</Link>
        </div>
        <div className="teaser-list">
          {demoPlayers.slice(0, 4).map((member, index) => (
            <div className="teaser-row" key={member.id}>
              <span className="avatar small-avatar">{member.name[0]}</span>
              <span>
                {member.name}
                {index === 0 && " · you"}
              </span>
              <span>
                {demoCompletions.filter((item) => item.playerId === member.id)
                  .length > 0
                  ? "✓"
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </RouteShell>
  );
}
