export type QuestBankType = "LBQ" | "VBQ" | "TBQ";

export type QuestBankEntry = {
  title: string;
  description: string;
  timerSeconds?: number;
};

export const individualQuestBank: Record<QuestBankType, QuestBankEntry[]> = {
  LBQ: [
    { title: "Touch the first viewpoint", description: "Get to the marked viewpoint and take in the view before anyone else catches up." },
    { title: "Find the old stone water tap", description: "Locate a traditional dhunge dhara (stone tap) somewhere along the trail." },
    { title: "Reach the highest point before noon", description: "Get to today's highest marked point on the trail before 12 PM." },
    { title: "Stand under the prayer flags", description: "Find a set of prayer flags in the village and stand beneath them." },
    { title: "Find a tea shop and sit for 5 minutes", description: "Locate any local tea shop and just sit there for five minutes. No rushing." },
  ],
  VBQ: [
    { title: "Learn one local word", description: "Ask a local how to say \"thank you\" in their language. Tell your friends what you learned." },
    { title: "Try something new", description: "Eat or drink something you've genuinely never had before. Group votes if it counts." },
    { title: "Compliment a stranger in Nepali", description: "Give a genuine compliment to someone you don't know, in Nepali." },
    { title: "Sing one line", description: "Sing one line of any Nepali song out loud in front of the group." },
  ],
  TBQ: [
    { title: "Quick 10", description: "Do 10 push-ups at the current viewpoint within 2 minutes.", timerSeconds: 120 },
    { title: "Find your way back", description: "Get back to the group's meeting point within 15 minutes, no GPS.", timerSeconds: 900 },
    { title: "Speed brew", description: "Boil water for tea in under 10 minutes.", timerSeconds: 600 },
    { title: "Pack it up", description: "Pack your bag completely in under 5 minutes.", timerSeconds: 300 },
  ],
};

export const groupQuestBank: Record<QuestBankType, QuestBankEntry[]> = {
  LBQ: [
    { title: "Find the Namje trailhead", description: "As a group, locate and reach the trailhead together." },
    { title: "Regroup within 10", description: "Everyone reaches the checkpoint within 10 minutes of the first person." },
  ],
  VBQ: [
    { title: "Cook something together", description: "Make a simple dal-bhat as a team. Vote on whether it's actually edible." },
    { title: "Dance for it", description: "Perform a short group dance for a local family or shopkeeper — get their approval." },
  ],
  TBQ: [
    { title: "Camp setup race", description: "Set up the tent/camp as a team in under 20 minutes.", timerSeconds: 1200 },
  ],
};

export const finalQuestBank: QuestBankEntry[] = [
  { title: "Hidden waterfall pose", description: "Find a hidden waterfall marker and take a group photo posing there." },
  { title: "Trade for a coin", description: "Trade something (not money) with a local vendor for a Nepali coin." },
  { title: "Full greeting ritual", description: "Learn and perform a complete local greeting, properly, for a stranger." },
  { title: "Cook for strangers", description: "Cook and serve a small dish to two people you don't know." },
  { title: "Shout it from the top", description: "Reach the highest point in Namje and shout your own name." },
  { title: "Learn a farm task", description: "Get a local farmer to teach you one real farming task, hands-on." },
  { title: "Three flags, three colors", description: "Find three different colors of prayer flags and photograph each one." },
  { title: "Use the word", description: "Learn the local word for \"mountain\" and use it in a real sentence with a local." },
  { title: "Lend a hand", description: "Help a local carry something for at least 5 minutes." },
  { title: "The oldest story", description: "Find the village's oldest resident and ask them their favorite memory." },
  { title: "Draw it from memory", description: "After walking through the village once, draw a rough map of it from memory." },
  { title: "Leaf collector", description: "Collect one leaf from three different kinds of trees and try to identify them." },
];
