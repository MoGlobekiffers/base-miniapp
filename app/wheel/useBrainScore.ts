"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getBrainContract } from "./brainContract";

export function useBrainScore() {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function loadScore() {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getBrainContract(provider);

      const address = await signer.getAddress();
      const s = await contract.scores(address);

      setScore(Number(s));
    } catch (e) {
      console.error(e);
    }
  }

  async function updateScore(delta: number) {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getBrainContract(signer);

      const tx = await contract.updateScore(delta);
      await tx.wait();

      await loadScore();
    } catch (e) {
      console.error(e);
    }
  }

  return { score, loadScore, updateScore, loading };
}

