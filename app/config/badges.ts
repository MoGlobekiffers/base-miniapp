export type Badge = {
  id: number;
  name: string;
  description: string;
  image: string;
  category: "Score" | "Gameplay" | "Special";
  minScore?: number;
};

export const BADGES: Badge[] = [
  // --- 1. Les Paliers de Cerveau (Progression) ---
  {
    id: 1,
    name: "Baby Brain",
    description: "A pink brain with a pacifier (10 pts)",
    image: "/badges/baby_brain.png", // <--- Corrigé (avec le r)
    category: "Score",
    minScore: 10,
  },
  {
    id: 2,
    name: "Student Brain",
    description: "A brain wearing glasses and holding a book (50 pts)",
    image: "/badges/student_brain.png",
    category: "Score",
    minScore: 50,
  },
  {
    id: 3,
    name: "Big Brain",
    description: "A bright blue brain (100 pts)",
    image: "/badges/big_brain.png",
    category: "Score",
    minScore: 100,
  },
  {
    id: 4,
    name: "Galaxy Brain",
    description: "A brain made of stars (500 pts)",
    image: "/badges/galaxy_brain.png",
    category: "Score",
    minScore: 500,
  },
  {
    id: 5,
    name: "Gigachad Brain",
    description: "A golden muscular brain (1000 pts)",
    image: "/badges/gigachad_brain.png",
    category: "Score",
    minScore: 1000,
  },

  // --- 2. Les Survivants (Gameplay) ---
  {
    id: 10,
    name: "First Blood",
    description: "Validated your first completed quest",
    image: "/badges/first_blood.png", // <--- Mis à jour selon ton fichier
    category: "Gameplay",
    minScore: 0, 
  },
  {
    id: 11,
    name: "Phoenix",
    description: "Continued playing after a Bankruptcy",
    image: "/badges/phoenix.png", // <--- Corrigé (oe)
    category: "Gameplay",
    minScore: 0,
  },
  {
    id: 12,
    name: "Gambler",
    description: "Have made 50 spins",
    image: "/badges/gambler.png", // <--- Mis à jour
    category: "Gameplay",
    minScore: 0,
  },
  {
    id: 13,
    name: "Lucky Bastard",
    description: "Came across Bonus Spin 3 times",
    image: "/badges/lucky_bastard.png", // <--- Mis à jour
    category: "Gameplay",
    minScore: 0,
  },

  // --- 3. Les Spéciaux (Events) ---
  {
    id: 20,
    name: "Early Adopter",
    description: "Played during the Beta phase",
    image: "/badges/early_adopter.png",
    category: "Special",
    minScore: 0,
  },
  {
    id: 21,
    name: "Weekend Warrior",
    description: "Played Saturday and Sunday in a row",
    image: "/badges/weekend_warrior.png", // <--- Mis à jour
    category: "Special",
    minScore: 0,
  },
];
