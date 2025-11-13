// app/wheel/quizPools.ts

export type QuizCategory = "base" | "farcaster";

export type QuizQuestion = {
  category: QuizCategory;
  question: string;
  choices: string[];
  correctIndex: number;
  explain?: string;
};

/* ==========
 * Base quiz
 * ========== */

const baseQuestions: QuizQuestion[] = [
  {
    category: "base",
    question: "Qui a lancé la blockchain Base ?",
    choices: ["Coinbase", "Binance", "Uniswap", "Ethereum Foundation"],
    correctIndex: 0,
    explain: "Base est une L2 construite par Coinbase sur Ethereum.",
  },
  {
    category: "base",
    question: "Base est une solution de type…",
    choices: ["Layer 1", "Sidechain", "Layer 2 (L2)", "Layer 0"],
    correctIndex: 2,
    explain: "Base est une L2 qui s’appuie sur Ethereum pour la sécurité.",
  },
  {
    category: "base",
    question: "Sur quelle couche de sécurité s’appuie Base ?",
    choices: ["Bitcoin", "Solana", "Ethereum", "Polygon PoS"],
    correctIndex: 2,
  },
  {
    category: "base",
    question: "Quel est l’objectif principal de Base ?",
    choices: [
      "Remplacer Ethereum",
      "Rendre l’onchain accessible au plus grand nombre",
      "Créer une blockchain privée",
      "Se concentrer uniquement sur le trading haute fréquence",
    ],
    correctIndex: 1,
  },
  {
    category: "base",
    question: "Quelle devise paye les frais sur Base ?",
    choices: ["BTC", "USDC", "ETH", "BASE"],
    correctIndex: 2,
  },
  {
    category: "base",
    question: "Base fait partie de quelle “famille” de rollups ?",
    choices: ["Optimistic rollups", "ZK rollups", "Sidechains", "Validium"],
    correctIndex: 0,
  },
  {
    category: "base",
    question: "Quel type d’applications est encouragé sur Base ?",
    choices: [
      "Uniquement la DeFi avancée",
      "Gaming, social, DeFi, culture, tout ce qui est onchain",
      "Uniquement les ponts inter-chaines",
      "Exclusivement les exchanges centralisés",
    ],
    correctIndex: 1,
  },
  {
    category: "base",
    question: "Base est opéré en collaboration étroite avec…",
    choices: ["Meta", "Tesla", "Coinbase", "Stripe"],
    correctIndex: 2,
  },
  {
    category: "base",
    question: "Les frais typiques sur Base sont…",
    choices: [
      "Très élevés, comme Ethereum en L1",
      "Inexistants (0 pour toujours)",
      "Plutôt faibles, adaptés aux usages quotidiens",
      "Payables uniquement en stablecoins",
    ],
    correctIndex: 2,
  },
  {
    category: "base",
    question: "Lequel de ces cas d’usage colle le mieux à Base ?",
    choices: [
      "Mini apps sociales onchain",
      "Mining de Bitcoin",
      "Stockage de fichiers volumineux",
      "Serveur DNS classique",
    ],
    correctIndex: 0,
  },
];

/* ===============
 * Farcaster quiz
 * =============== */

const farcasterQuestions: QuizQuestion[] = [
  {
    category: "farcaster",
    question: "Farcaster est avant tout…",
    choices: [
      "Un exchange centralisé",
      "Un protocole social onchain",
      "Une blockchain L1",
      "Un simple clone de Twitter",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Comment s’appelle un post sur Farcaster ?",
    choices: ["Tweet", "Cast", "Snap", "Note"],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Sur Farcaster, les mini apps sont intégrées dans…",
    choices: ["Les likes", "Les commentaires privés", "Les frames", "Les DM"],
    correctIndex: 2,
  },
  {
    category: "farcaster",
    question: "Le FID sur Farcaster représente…",
    choices: [
      "Le solde en dollars",
      "L’identifiant unique d’un utilisateur",
      "Un token fongible",
      "Un badge de modérateur",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Quel est l’intérêt principal des frames ?",
    choices: [
      "Afficher des images en HD uniquement",
      "Permettre des interactions onchain directement dans le feed",
      "Envoyer des emails",
      "Faire du mining depuis le navigateur",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Farcaster est pensé pour être…",
    choices: [
      "Centralisé, contrôlé par un seul serveur",
      "Multi-clients, décentralisé et extensible",
      "Exclusivement mobile",
      "Réservé aux KYC niveau banque",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Quel hashtag est souvent utilisé pour dire bonjour ?",
    choices: ["#hello", "#gn", "#gm", "#bonjour"],
    correctIndex: 2,
  },
  {
    category: "farcaster",
    question: "Un “channel” sur Farcaster sert à…",
    choices: [
      "Créer un token",
      "Regrouper des casts par thème ou communauté",
      "Envoyer des transactions privées",
      "Miner de nouveaux FID",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Les frames de mini apps peuvent…",
    choices: [
      "Uniquement afficher du texte",
      "Interagir avec des smart contracts onchain",
      "Changer ton FID",
      "Modifier ton wallet sans signature",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Quel comportement aide le plus une mini app à se faire connaître ?",
    choices: [
      "Ignorer tous les casts",
      "Poster, liker et répondre autour de la mini app",
      "N’utiliser la mini app qu’en privé",
      "Ne jamais utiliser de hashtag",
    ],
    correctIndex: 1,
  },
];

/* =====================
 * Fonctions utilitaires
 * ===================== */

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomBaseQuiz(): QuizQuestion {
  return randomOf(baseQuestions);
}

export function getRandomFarcasterQuiz(): QuizQuestion {
  return randomOf(farcasterQuestions);
}

