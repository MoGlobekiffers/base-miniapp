"""
Analyse les dépôts publics d'un utilisateur GitHub pour détecter rapidement des secrets
courants (clés API, mnémotechniques, clés privées, etc.).

Usage:
    python scripts/scan_public_repos.py
"""

from __future__ import annotations

import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

import requests

# --- Paramètres principaux ---
GITHUB_USER = "MoGlobekiffers"

# Expressions régulières pour détecter des secrets fréquents
PATTERNS = {
    "Clé privée": re.compile(r"(?:-----BEGIN PRIVATE KEY-----|0x[a-fA-F0-9]{64})"),
    "Phrase mnémotechnique": re.compile(r"\b([a-z]{3,20}\s){11,23}[a-z]{3,20}\b"),
    "Clé API": re.compile(r"(?:api|key|token|secret)[\"'=:\s]+[A-Za-z0-9_\-]{16,}", re.IGNORECASE),
    "Clé Supabase": re.compile(r"sbp_[A-Za-z0-9]{30,}"),
    "Clé OpenAI": re.compile(r"sk-[A-Za-z0-9]{40,}"),
    "Token Vercel": re.compile(r"vercel\.[A-Za-z0-9\-_]{20,}"),
    "Clé Alchemy": re.compile(r"[A-Za-z0-9]{32,}"),
}

# Extensions ou noms de fichiers à inspecter
EXTENSIONS = {".env", ".ts", ".tsx", ".js", ".jsx", ".json", ".py", ".sh", ".yaml", ".yml", ".md"}
NOMS_DIRECTS = {".env", ".env.local"}


@dataclass
class AlerteSecret:
    """Représente une détection de secret dans un dépôt donné."""

    depot: str
    chemin: Path
    type_secret: str


@dataclass
class DepotGithub:
    nom: str
    url_clone: str


def recuperer_depots(utilisateur: str) -> List[DepotGithub]:
    """Récupère les dépôts publics via l'API GitHub."""

    try:
        reponse = requests.get(f"https://api.github.com/users/{utilisateur}/repos", timeout=15)
        reponse.raise_for_status()
    except requests.RequestException as err:
        raise RuntimeError("Impossible de récupérer la liste des dépôts depuis GitHub.") from err

    depots = []
    for repo in reponse.json():
        if repo.get("clone_url") and repo.get("name"):
            depots.append(DepotGithub(nom=repo["name"], url_clone=repo["clone_url"]))
    return depots


def iter_fichiers_racine(racine: Path) -> Iterable[Path]:
    """Parcourt récursivement les fichiers pertinents à partir d'une racine."""

    for fichier in racine.rglob("*"):
        if fichier.is_file():
            if fichier.name in NOMS_DIRECTS or fichier.suffix.lower() in EXTENSIONS:
                yield fichier


def analyser_fichier(fichier: Path) -> List[str]:
    """Retourne la liste des types de secrets trouvés dans un fichier donné."""

    try:
        contenu = fichier.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return []

    alertes: List[str] = []
    for label, regex in PATTERNS.items():
        if regex.search(contenu):
            alertes.append(label)
    return alertes


def analyser_depot(depot: DepotGithub) -> List[AlerteSecret]:
    """Clone le dépôt en profondeur 1 et renvoie les éventuelles alertes."""

    alertes: List[AlerteSecret] = []
    with tempfile.TemporaryDirectory() as tmpdir:
        dossier_clone = Path(tmpdir)
        subprocess.run([
            "git",
            "clone",
            "--depth",
            "1",
            depot.url_clone,
            str(dossier_clone),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        for fichier in iter_fichiers_racine(dossier_clone):
            for type_secret in analyser_fichier(fichier):
                alertes.append(
                    AlerteSecret(
                        depot=depot.nom,
                        chemin=fichier.relative_to(dossier_clone),
                        type_secret=type_secret,
                    )
                )
    return alertes


def afficher_resultats(alertes: List[AlerteSecret]) -> None:
    """Affiche un récapitulatif clair des détections."""

    if not alertes:
        print("✔ Aucun secret détecté dans les dépôts publics.")
        return

    print("\n⚠ ALERTES DÉTECTÉES :\n")
    for alerte in alertes:
        print(f"[{alerte.type_secret}] dans {alerte.depot} → {alerte.chemin}")


def main() -> None:
    depots = recuperer_depots(GITHUB_USER)
    toutes_alertes: List[AlerteSecret] = []

    for depot in depots:
        print(f"Analyse de {depot.nom}…")
        try:
            alertes = analyser_depot(depot)
        except subprocess.CalledProcessError:
            print(f"  - Échec du clonage, dépôt ignoré.")
            continue
        toutes_alertes.extend(alertes)

    afficher_resultats(toutes_alertes)


if __name__ == "__main__":
    main()
