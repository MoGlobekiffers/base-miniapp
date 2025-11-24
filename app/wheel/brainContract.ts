import { ethers } from "ethers";
import BrainScoreSigned from "../../brain-contract/artifacts/contracts/BrainScoreSigned.sol/BrainScoreSigned.json";

export const BRAIN_CONTRACT_ADDRESS =
  "0xC36DA18b35d700d96B7A4d0eE577506d6C2022e8";

export function getBrainContract(providerOrSigner: any) {
  return new ethers.Contract(
    BRAIN_CONTRACT_ADDRESS,
    BrainScoreSigned.abi,
    providerOrSigner
  );
}

