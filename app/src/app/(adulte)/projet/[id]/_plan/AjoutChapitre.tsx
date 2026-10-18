"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { ORIENTATION_MAX } from "@/domaine/preparation";
import type { Partie } from "@/domaine/recit";
import { demanderAuPlan } from "./IdeesDeParties";

export type ChapitrePropose = { titre: string; resume: string };
type Proposition = ChapitrePropose & { id: string };
const cle = (t: string) => t.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");

/**
 * Les chapitres proposés pour une partie (F13.5, révisé le 18 octobre 2026) : six en une demande,
 * montrés un à un, modifiables ; rien n'est créé avant « Ajouter ce chapitre ». « D'autres idées »
 * redemande en écartant ceux déjà vus ; l'orientation est propre à la partie. Tenus le temps de
 * la page : refermer l'espace ne les perd pas.
 */
function useChapitresProposes(partie: Partie) {
  const [liste, setListe] = useState<Proposition[]>([]);
  const [rang, setRang] = useState(0);
  const [orientation, setOrientation] = useState("");
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reste, setReste] = useState<string | null>(null);
  const vus = useRef<string[]>([]);

  // Un chapitre ajouté à la main sous le même titre ne se repropose pas
  const dansLaPartie = new Set(partie.chapitres.map((c) => cle(c.titre)));
  const visibles = liste.filter((p) => !dansLaPartie.has(cle(p.titre)) || p.titre.trim() === "");
  const ici = Math.min(rang, Math.max(0, visibles.length - 1));

  const demander = async () => {
    if (attente) return;
    setAttente(true);
    setErreur(null);
    const r = await demanderAuPlan({ sorte: "chapitres", partie: partie.id, orientation, dejaMontres: vus.current });
    setAttente(false);
    if (!r.ok || r.sorte !== "chapitres") return setErreur(r.ok ? MESSAGES_IA.pasDeReponse : r.message);
    vus.current = [...vus.current, ...r.chapitres.map((c) => c.titre)].slice(-40);
    setReste(r.reste);
    setListe(r.chapitres.map((c) => ({ ...c, id: crypto.randomUUID() })));
    setRang(0);
  };

  return {
    visibles,
    rang: ici,
    actuelle: visibles[ici] as Proposition | undefined,
    orientation,
    attente,
    erreur,
    reste,
    demander,
    orienter: setOrientation,
    aller: (n: number) => setRang(Math.max(0, Math.min(n, visibles.length - 1))),
    modifier: (id: string, valeurs: Partial<ChapitrePropose>) => setListe((l) => l.map((p) => (p.id === id ? { ...p, ...valeurs } : p))),
    /** Ajouté : il quitte la série, et le suivant prend sa place */
    retirer: (id: string) => setListe((l) => l.filter((p) => p.id !== id)),
    /** « Annuler » : il revient à sa place dans la série */
    remettre: (p: Proposition, a: number) => {
      setListe((l) => (l.some((x) => x.id === p.id) ? l : [...l.slice(0, a), p, ...l.slice(a)]));
      setRang(a);
    },
  };
}

/**
 * « + Ajouter un chapitre │ ✦ » au bout d'une partie (F13.5) : la carte en pointillé ajoute à la
 * main ; sa bande ✦, au pied, ouvre l'espace de l'IA, qui monte et recouvre la carte (retouche du
 * porteur, 18 octobre 2026). D'abord « Orienter l'IA » et « Proposer des chapitres » ; puis les
 * six propositions, une à la fois (‹ 2 / 6 ›), titre et résumé modifiables, et « Ajouter ce
 * chapitre ». La carte ouverte a une hauteur fixe : les flèches ne bougent pas d'une proposition
 * à l'autre. La croix ou Échap referment l'espace. Aides éteintes, la carte est simple.
 */
export function AjoutChapitre({
  partie, enCours, onAjouter, onAjouterPropose,
}: {
  partie: Partie;
  enCours: boolean;
  onAjouter: () => void;
  /** Crée le chapitre à la fin de la partie ; `remettre` le rend à la série si l'adulte annule */
  onAjouterPropose: (c: ChapitrePropose, remettre: () => void) => Promise<boolean>;
}) {
  const { proposer } = useAidesIa();
  const [ouvert, setOuvert] = useState(false);
  const [orienter, setOrienter] = useState(false);
  const [ajout, setAjout] = useState(false);
  const p = useChapitresProposes(partie);
  const id = useId();
  const place = useRef<HTMLLIElement>(null);
  const bande = useRef<HTMLButtonElement>(null);
  // Le champ d'orientation se montre avant la première série, ou quand on veut réorienter
  const avecChamp = orienter || p.visibles.length === 0;

  // Ouvert : le curseur dans le champ d'orientation s'il est là, la carte entière sous les yeux
  useEffect(() => {
    if (!ouvert) return;
    const champ = document.getElementById(id) as HTMLTextAreaElement | null;
    champ?.focus({ preventScroll: true });
    place.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [ouvert, orienter, id]);

  const fermer = () => {
    setOuvert(false);
    setOrienter(false);
    requestAnimationFrame(() => bande.current?.focus());
  };
  // Échap referme l'espace quand on y travaille, même si le bouton cliqué s'est éteint pendant la demande
  const fermerTenu = useRef(fermer);
  useEffect(() => {
    fermerTenu.current = fermer;
  });
  useEffect(() => {
    if (!ouvert) return;
    const touche = (e: KeyboardEvent) => {
      const ici = document.activeElement;
      if (e.key !== "Escape" || (ici && ici !== document.body && !place.current?.contains(ici))) return;
      fermerTenu.current();
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [ouvert]);
  const proposerDesChapitres = async () => {
    await p.demander();
    setOrienter(false);
  };
  const ajouterCeChapitre = async () => {
    const c = p.actuelle;
    if (!c || ajout || !c.titre.trim()) return;
    const a = p.rang;
    setAjout(true);
    const fait = await onAjouterPropose({ titre: c.titre, resume: c.resume }, () => p.remettre(c, a));
    setAjout(false);
    if (fait) p.retirer(c.id);
  };

  const c = p.actuelle;
  return (
    <li ref={place} className={`cahier-ajout-place${proposer ? " cahier-ajout-place--ia" : ""}${ouvert ? " est-ouvert" : ""}`}>
      <button type="button" className="cahier-ajout" disabled={enCours} aria-busy={enCours || undefined} onClick={onAjouter} inert={ouvert || undefined}>
        <Icone nom="plus" />
        <span>Ajouter un chapitre</span>
      </button>
      {proposer ? (
        <div
          className="ajout-ia"
          role={ouvert ? "group" : undefined}
          aria-label={ouvert ? `Chapitres proposés pour « ${partie.titre} »` : undefined}
          aria-busy={p.attente || undefined}
        >
          {ouvert ? (
            <div className="ajout-ia__contenu">
              <div className="ajout-ia__corps">
                <p className="ajout-ia__tete">
                  {avecChamp ? (
                    <label htmlFor={id}>
                      Orienter l’IA <span className="ix__facultatif">facultatif</span>
                    </label>
                  ) : (
                    <span className="ajout-ia__titre">
                      <Icone nom="ia" />
                      Chapitre proposé
                    </span>
                  )}
                  <button type="button" className="ajout-ia__fermer" onClick={fermer} aria-label="Fermer l’aide de l’IA" title="Fermer">
                    <Icone nom="fermer" />
                  </button>
                </p>
                {avecChamp ? (
                  <ChampQuiGrandit
                    id={id}
                    className="pchamp ajout-ia__champ"
                    rows={3}
                    maxLength={ORIENTATION_MAX}
                    value={p.orientation}
                    placeholder="Pour cette partie, par exemple : une rencontre au bord de l’eau"
                    onChange={(e) => p.orienter(e.target.value)}
                  />
                ) : c ? (
                  // Une fiche par proposition : en changeant, le résumé repart de son début
                  <div className="ajout-ia__proposition" key={c.id}>
                    {/* Un titre long passe à la ligne plutôt que d'être coupé ; Entrée ne l'allonge pas */}
                    <ChampQuiGrandit
                      className="ix-libelle ajout-ia__nom"
                      rows={1}
                      maxLength={120}
                      value={c.titre}
                      aria-label="Titre du chapitre proposé"
                      onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                      onChange={(e) => p.modifier(c.id, { titre: e.target.value.replace(/\n/g, " ") })}
                    />
                    {/* La carte garde sa hauteur, les flèches leur place : un long résumé défile dans son champ */}
                    <textarea
                      className="ix-intention ajout-ia__resume"
                      maxLength={4000}
                      value={c.resume}
                      aria-label="Résumé du chapitre proposé"
                      onChange={(e) => p.modifier(c.id, { resume: e.target.value })}
                    />
                  </div>
                ) : null}
                {p.erreur ? (
                  <p className="ajout-ia__note ajout-ia__note--erreur" role="alert">
                    {p.erreur}
                  </p>
                ) : p.reste && !p.attente ? (
                  <p className="ajout-ia__note">{p.reste}</p>
                ) : null}
                {!avecChamp && c ? (
                  <>
                    <p className="ajout-ia__defile">
                      <button type="button" className="ajout-ia__fleche ajout-ia__fleche--avant" onClick={() => p.aller(p.rang - 1)} disabled={p.rang === 0} aria-label="Proposition précédente">
                        <Icone nom="fleche" />
                      </button>
                      <span aria-live="polite">
                        {p.rang + 1} / {p.visibles.length}
                      </span>
                      <button
                        type="button"
                        className="ajout-ia__fleche"
                        onClick={() => p.aller(p.rang + 1)}
                        disabled={p.rang >= p.visibles.length - 1}
                        aria-label="Proposition suivante"
                      >
                        <Icone nom="fleche" />
                      </button>
                    </p>
                    <p className="ajout-ia__liens">
                      <button type="button" className="lien cx-discret" onClick={() => void p.demander()} disabled={p.attente}>
                        <Icone nom="ia" />
                        D’autres idées
                      </button>
                      <button type="button" className="lien cx-discret" onClick={() => setOrienter(true)}>
                        Orienter l’IA
                      </button>
                    </p>
                  </>
                ) : null}
              </div>
              {avecChamp ? (
                <button type="button" className="ajout-ia__bouton" onClick={() => void proposerDesChapitres()} disabled={p.attente} aria-busy={p.attente || undefined}>
                  <Icone nom="ia" />
                  <span>{p.attente ? "L’IA cherche…" : "Proposer des chapitres"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="ajout-ia__bouton ajout-ia__bouton--ajouter"
                  onClick={() => void ajouterCeChapitre()}
                  disabled={ajout || p.attente || !c?.titre.trim()}
                  aria-busy={ajout || p.attente || undefined}
                >
                  <Icone nom={p.attente ? "ia" : "plus"} />
                  <span>{p.attente ? "L’IA cherche…" : "Ajouter ce chapitre"}</span>
                </button>
              )}
            </div>
          ) : (
            <button
              ref={bande}
              type="button"
              className="ajout-ia__bouton"
              onClick={() => setOuvert(true)}
              aria-label={`Demander des chapitres à l’IA pour « ${partie.titre} »`}
              title="Demander à l’IA"
            >
              <Icone nom="ia" />
            </button>
          )}
        </div>
      ) : null}
    </li>
  );
}
