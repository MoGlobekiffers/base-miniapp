import { ethers } from "ethers";

// Adresse du contrat
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_BRAIN_CONTRACT ||
  "0xC36DA18b35d70d96B7A4d0eE577506d6C2022e8";

// ABI minimale (uniquement ce qu'on utilise)
const ABI = [
  "function submitScore(address user, uint256 score, bytes signature) public",
  "function scores(address) view returns (uint256)",
];

// Récupérer l'objet Contract via signer
function getContract() {
  if (typeof window === "undefined") return null;

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  return provider
    .getSigner()
    .then((signer) => new ethers.Contract(CONTRACT_ADDRESS, ABI, signer));
}

// ✨ Lire le score on-chain
export async function getOnchainScore(address: string): Promise<number> {
  const contract = await getContract();
  if (!contract) return 0;
  const score = await contract.scores(address);
  return Number(score);
}

// ✨ Soumettre un score signé
export async function submitSignedScore(
  score: number,
  address: string
): Promise<string> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();

  // Message que tu signes (anti-triche)
  const message = `DailyWheel Score Update: ${score}`;
  const signature = await signer.signMessage(message);

  const contract = await getContract();
  const tx = await contract.submitScore(address, score, signature);

  return tx.hash;
}

