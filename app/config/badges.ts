export type Badge = {
  id: number;
  name: string;
  description: string;
  image: string;
  category: "Score" | "Gameplay" | "Special";
  minScore?: number;
};

export const BADGES: Badge[] = [
  // --- 1. Score Tiers ---
  {
    id: 1,
    name: "Baby Brain",
    description: "A pink brain with a pacifier (25 pts).",
    image: "/badges/baby_brain.png",
    category: "Score",
    minScore: 25, 
  },
  {
    id: 2,
    name: "Student Brain",
    description: "A brain wearing glasses and holding a book (50 pts).",
    image: "/badges/student_brain.png",
    category: "Score",
    minScore: 50,
  },
  {
    id: 3,
    name: "Big Brain",
    description: "A bright blue, glowing brain (100 pts).",
    image: "/badges/big_brain.png",
    category: "Score",
    minScore: 100,
  },
  {
    id: 4,
    name: "Galaxy Brain",
    description: "A brain made of cosmic stars (500 pts).",
    image: "/badges/galaxy_brain.png",
    category: "Score",
    minScore: 500,
  },
  {
    id: 5,
    name: "Gigachad Brain",
    description: "A golden, muscular brain (1000 pts).",
    image: "/badges/gigachad_brain.png",
    category: "Score",
    minScore: 1000,
  },

  // --- 2. Gameplay Tiers ---
  {
    id: 10,
    name: "First Blood",
    description: "Validate your very first quest. (Sword)",
    image: "/badges/first_blood.png",
    category: "Gameplay",
    minScore: 0, 
  },
  {
    id: 11,
    name: "Phoenix",
    description: "Continue playing after a 'Bankruptcy'. (Phoenix)",
    image: "/badges/phoenix.png",
    category: "Gameplay",
    minScore: 0,
  },
  {
    id: 12,
    name: "Gambler",
    description: "Complete 50 spins of the wheel. (Dice)",
    image: "/badges/gambler.png",
    category: "Gameplay",
    minScore: 0,
  },
  {
    id: 13,
    name: "Lucky Bastard",
    description: "Land on 'Bonus Spin' 10 times. (Clover)",
    image: "/badges/lucky_bastard.png",
    category: "Gameplay",
    minScore: 0,
  },

  // --- 3. Special Tiers ---
  {
    id: 20,
    name: "Early Adopter",
    description: "Played during the Beta phase (ending 12/31/2025).",
    image: "/badges/early_adopter.png",
    category: "Special",
    minScore: 0,
  },
  {
    id: 21,
    name: "Weekend Warrior",
    description: "Play on Saturday and Sunday consecutively for 8 weeks.",
    image: "/badges/weekend_warrior.png",
    category: "Special",
    minScore: 0,
  },
];
