// app/brain.ts
export type BrainHistoryItem = {
  ts: number;           // timestamp
  quest: string;        // nom de la quête
  base: number;         // points de base
  applied: number;      // points effectivement ajoutés (avec éventuel x2)
  note?: string;        // optionnel (ex: "Double points active")
};

function safeLS() {
  // évite les erreurs côté SSR
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function kBrain(addr: string) {
  return `dw:brain:${addr.toLowerCase()}`;
}
function kHist(addr: string) {
  return `dw:brain:hist:${addr.toLowerCase()}`;
}
function kDoubleNext(addr: string) {
  return `dw:brain:x2:${addr.toLowerCase()}`;
}

export function getBrain(address?: string | null): number {
  const ls = safeLS();
  if (!ls || !address) return 0;
  const raw = ls.getItem(kBrain(address));
  return Number(raw || "0");
}

export function getHistory(address?: string | null): BrainHistoryItem[] {
  const ls = safeLS();
  if (!ls || !address) return [];
  try {
    const raw = ls.getItem(kHist(address));
    return raw ? (JSON.parse(raw) as BrainHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function setBrain(address: string, value: number) {
  const ls = safeLS();
  if (!ls) return;
  ls.setItem(kBrain(address), String(value));
}

function pushHistory(address: string, item: BrainHistoryItem) {
  const ls = safeLS();
  if (!ls) return;
  const list = getHistory(address);
  list.unshift(item);
  ls.setItem(kHist(address), JSON.stringify(list.slice(0, 200))); // garde les 200 derniers
}

export function setDoubleNext(address: string) {
  const ls = safeLS();
  if (!ls) return;
  ls.setItem(kDoubleNext(address), "1");
}

export function consumeDoubleNext(address: string): boolean {
  const ls = safeLS();
  if (!ls) return false;
  const has = ls.getItem(kDoubleNext(address)) === "1";
  if (has) ls.removeItem(kDoubleNext(address));
  return has;
}

export function hasDoubleNext(address?: string | null): boolean {
  const ls = safeLS();
  if (!ls || !address) return false;
  return ls.getItem(kDoubleNext(address)) === "1";
}

/**
 * Ajoute des points.
 * - Applique x2 automatiquement si le flag "Double points" est actif pour le wallet.
 * - Enregistre l'historique.
 * Retourne le nouveau total et les points appliqués.
 */
export function addBrain(
  address: string,
  quest: string,
  basePoints: number
): { total: number; applied: number; doubled: boolean } {
  const doubling = consumeDoubleNext(address); // consomme si présent
  const applied = doubling ? basePoints * 2 : basePoints;

  const current = getBrain(address);
  const next = current + applied;
  setBrain(address, next);

  pushHistory(address, {
    ts: Date.now(),
    quest,
    base: basePoints,
    applied,
    note: doubling ? "Double points active" : undefined,
  });

  return { total: next, applied, doubled: doubling };
}

/**
 * Petit hook pratique pour afficher la balance dans l’UI et la rafraîchir.
 */
import { useEffect, useState } from "react";
export function useBrain(address?: string | null) {
  const [brain, setBrain] = useState<number>(() => getBrain(address));
  useEffect(() => {
    setBrain(getBrain(address));
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (!address) return;
      if (e.key === kBrain(address)) setBrain(getBrain(address));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [address]);
  return {
    brain,
    refresh: () => setBrain(getBrain(address)),
    hasDouble: hasDoubleNext(address),
  };
}

/** Outils DEV */
export function resetBrain(address?: string | null) {
  const ls = safeLS();
  if (!ls || !address) return;
  ls.removeItem(kBrain(address));
  ls.removeItem(kHist(address));
  ls.removeItem(kDoubleNext(address));
}

