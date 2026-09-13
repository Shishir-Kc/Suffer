export const tripDetails = {
  destination: "[DESTINATION]",
  dates: "[TRIP DATES]",
  finalQuestTime: "5:00 PM",
};

export const quests = [
  {
    code: "LBQ",
    label: "Location-Based Quest",
    eyebrow: "The map knows",
    description: "Get yourself to the spot. GPS verifies the arrival. Your feet do the rest.",
    accent: "lime",
  },
  {
    code: "VBQ",
    label: "Voting-Based Quest",
    eyebrow: "The group knows",
    description: "No algorithm can verify this one, so the group votes. Majority rules. Bribes and sabotage do not.",
    accent: "orange",
  },
  {
    code: "TBQ",
    label: "Timing-Based Quest",
    eyebrow: "The clock knows",
    description: "A countdown starts. Beat it, or accept a very punctual consequence.",
    accent: "blue",
  },
];

export const rules = [
  "No bribing. No sabotaging. Ever.",
  "Majority vote is final in VBQs.",
  "Miss a TBQ deadline and the penalty clock starts.",
  "Trigger points are locked. No speedrunning.",
  "Individual and Group tracks unlock independently.",
  "Last to finish the Final Quest pays up.",
  "Penalties stack. Choose wisely.",
];

export const reportReasons = ["Bribery", "Sabotage", "Dirty voting", "Vibe crimes"];
