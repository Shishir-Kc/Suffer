"use client";

import { useState } from "react";
import { demoQuests } from "@/lib/mockData";
import { QuestComplete } from "@/components/quest/QuestComplete";
import { LBQActive } from "@/components/quest/LBQActive";
import { VBQActive } from "@/components/quest/VBQActive";
import { TBQActive } from "@/components/quest/TBQActive";
import { RouteShell } from "@/components/RouteShell";
import { Toast } from "@/components/ui/Toast";

export function QuestScreen({ id }: { id: string }) {
  const [complete, setComplete] = useState(false);
  const [failed, setFailed] = useState(false);
  const quest = demoQuests.find((item) => item.id === id) ?? demoQuests[1];
  return (
    <RouteShell
      title={quest.title}
      eyebrow="Active quest"
      back={true}
      nav={false}
    >
      {complete ? (
        <QuestComplete />
      ) : quest.type === "LBQ" ? (
        <LBQActive quest={quest} onComplete={() => setComplete(true)} />
      ) : quest.type === "VBQ" ? (
        <VBQActive quest={quest} onComplete={() => setComplete(true)} />
      ) : (
        <TBQActive
          quest={quest}
          onComplete={() => setComplete(true)}
          onFail={() => setFailed(true)}
        />
      )}
      {failed && (
        <Toast message="Timer missed. +2 min added to your final quest." />
      )}
    </RouteShell>
  );
}
