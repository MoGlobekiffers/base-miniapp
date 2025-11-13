// app/wheel/quizPools.ts

export type QuizCategory = "base" | "farcaster" | "miniapp";

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
    question: "Who launched the Base blockchain?",
    choices: ["Coinbase", "Binance", "Uniswap", "Ethereum Foundation"],
    correctIndex: 0,
    explain: "Base is an L2 built by Coinbase on top of Ethereum.",
  },
  {
    category: "base",
    question: "Base is mainly considered as…",
    choices: ["Layer 1", "Sidechain", "Layer 2 (L2)", "Layer 0"],
    correctIndex: 2,
    explain: "Base is an L2 that uses Ethereum for security.",
  },
  {
    category: "base",
    question: "On which security layer does Base rely?",
    choices: ["Bitcoin", "Solana", "Ethereum", "Polygon PoS"],
    correctIndex: 2,
  },
  {
    category: "base",
    question: "What is the main goal of Base?",
    choices: [
      "To replace Ethereum",
      "To make onchain accessible to everyone",
      "To create a private blockchain",
      "To focus only on high-frequency trading",
    ],
    correctIndex: 1,
  },
  {
    category: "base",
    question: "Which token is used to pay gas fees on Base?",
    choices: ["BTC", "USDC", "ETH", "BASE"],
    correctIndex: 2,
  },
  {
    category: "base",
    question: "Base belongs to which rollup family?",
    choices: ["Optimistic rollups", "ZK-rollups", "Sidechains", "Validium"],
    correctIndex: 0,
  },
  {
    category: "base",
    question: "What kind of applications are encouraged on Base?",
    choices: [
      "Only advanced DeFi",
      "Gaming, social, DeFi, culture – anything onchain",
      "Only cross-chain bridges",
      "Exclusively centralized exchanges",
    ],
    correctIndex: 1,
  },
  {
    category: "base",
    question: "Base is operated in close collaboration with…",
    choices: ["Meta", "Tesla", "Coinbase", "Stripe"],
    correctIndex: 2,
  },
  {
    category: "base",
    question: "Typical transaction fees on Base are…",
    choices: [
      "Very high, like Ethereum L1",
      "Zero forever (0 gas guaranteed)",
      "Quite low, suitable for daily usage",
      "Payable only in stablecoins",
    ],
    correctIndex: 2,
  },
  {
    category: "base",
    question: "Which use case fits Base the best?",
    choices: [
      "Onchain social mini apps",
      "Bitcoin mining",
      "Storing large files",
      "Running a classic DNS server",
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
    question: "Farcaster is first and foremost…",
    choices: [
      "A centralized exchange",
      "An onchain social protocol",
      "A Layer 1 blockchain",
      "A simple Twitter clone",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "What is a post called on Farcaster?",
    choices: ["Tweet", "Cast", "Snap", "Note"],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "On Farcaster, mini apps are integrated inside…",
    choices: ["Likes", "Private comments", "Frames", "DMs"],
    correctIndex: 2,
  },
  {
    category: "farcaster",
    question: "What does a FID represent on Farcaster?",
    choices: [
      "Your dollar balance",
      "A unique user identifier",
      "A fungible token",
      "A moderator badge",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "What is the main purpose of frames?",
    choices: [
      "Only showing HD images",
      "Allowing onchain interactions directly in the feed",
      "Sending emails",
      "Mining from the browser",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Farcaster is designed to be…",
    choices: [
      "Centralized and controlled by one server",
      "Multi-client, decentralized, and extensible",
      "Mobile-only",
      "Restricted to full bank-level KYC users",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Which hashtag is commonly used to say good morning?",
    choices: ["#hello", "#gn", "#gm", "#bonjour"],
    correctIndex: 2,
  },
  {
    category: "farcaster",
    question: "A “channel” on Farcaster is used to…",
    choices: [
      "Create a token",
      "Group casts by topic or community",
      "Send private transactions",
      "Mine new FIDs",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question: "Mini-app frames can…",
    choices: [
      "Only display plain text",
      "Interact with smart contracts onchain",
      "Change your FID",
      "Modify your wallet without signature",
    ],
    correctIndex: 1,
  },
  {
    category: "farcaster",
    question:
      "Which behavior helps a mini app grow the most on Farcaster?",
    choices: [
      "Ignoring all casts",
      "Posting, liking, and replying around the mini app",
      "Using the mini app only in private",
      "Never using hashtags",
    ],
    correctIndex: 1,
  },
];

/* ===================
 * Mini app quiz
 * =================== */

const miniAppQuestions: QuizQuestion[] = [
  {
    category: "miniapp",
    question: "What is a “mini app” (or frame) on Farcaster?",
    choices: [
      "A standalone mobile app from the App Store",
      "An interactive card that lives inside a cast",
      "A smart contract standard like ERC-20",
      "A browser extension for Farcaster",
    ],
    correctIndex: 1,
  },
  {
    category: "miniapp",
    question:
      "What can a user typically do inside a mini app frame?",
    choices: [
      "Only read static text",
      "Sign onchain actions or call smart contracts",
      "Mine a new blockchain",
      "Change their FID directly",
    ],
    correctIndex: 1,
  },
  {
    category: "miniapp",
    question:
      "Which best describes the UX goal of mini apps on Base / Farcaster?",
    choices: [
      "Hide all onchain interactions from the user",
      "Bring onchain actions directly into the social feed",
      "Force users to switch to a separate dapp tab",
      "Replace wallets completely",
    ],
    correctIndex: 1,
  },
  {
    category: "miniapp",
    question: "What is usually needed to interact with a mini app?",
    choices: [
      "A hardware mining rig",
      "A compatible wallet connected to Base",
      "A dedicated VPN",
      "A paid Farcaster premium account",
    ],
    correctIndex: 1,
  },
  {
    category: "miniapp",
    question:
      "Which example fits best as a mini app use case?",
    choices: [
      "Controlling your home lights over Wi-Fi",
      "Minting an NFT directly from a cast",
      "Editing local files on your desktop",
      "Streaming movies in 4K",
    ],
    correctIndex: 1,
  },
  {
    category: "miniapp",
    question:
      "Why are mini apps powerful for onboarding new users?",
    choices: [
      "They require complex CLI tools",
      "They live where users already spend time: in the social feed",
      "They can only be used by developers",
      "They lock users into one single wallet forever",
    ],
    correctIndex: 1,
  },
  {
    category: "miniapp",
    question:
      "A typical mini app on Base / Farcaster will most often…",
    choices: [
      "Help users interact with onchain content in 1–2 clicks",
      "Replace the whole Farcaster client UI",
      "Run fully offline without internet",
      "Work only if the user has no wallet",
    ],
    correctIndex: 0,
  },
  {
    category: "miniapp",
    question:
      "What should a good mini app description or cast include?",
    choices: [
      "Only the contract address",
      "A clear action, context, and maybe a call to action",
      "Only an inside joke",
      "A random link without explanation",
    ],
    correctIndex: 1,
  },
  {
    category: "miniapp",
    question:
      "Which behavior helps the most to grow a new mini app?",
    choices: [
      "Never talking about it publicly",
      "Sharing casts, screenshots, and feedback after testing it",
      "Using it once and uninstalling everything",
      "Spamming unrelated channels",
    ],
    correctIndex: 1,
  },
  {
    category: "miniapp",
    question:
      "If a mini app is built on Base, what does it usually benefit from?",
    choices: [
      "Low gas fees and Ethereum security",
      "Free unlimited BTC mining",
      "A private fork of Solana",
      "Gas-free transactions forever guaranteed",
    ],
    correctIndex: 0,
  },
];

/* =====================
 * Utility functions
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

export function getRandomMiniAppQuiz(): QuizQuestion {
  return randomOf(miniAppQuestions);
}

