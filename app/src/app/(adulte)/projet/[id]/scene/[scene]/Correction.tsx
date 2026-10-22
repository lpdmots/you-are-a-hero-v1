"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { TexteLu } from "@/composants/copie/Blocs";
import type { AutreTexte } from "@/composants/copie/Copie";
import type { Livre } from "@/composants/copie/contexte";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { DEGRES, marquesDansLaCopie, NOMS_DES_DEGRES, ROLES_DES_DEGRES, type Degre } from "@/domaine/aides-ia";
import {
  cibleDe, changementsDe, compterMots, FACTEURS, longueurReglable, MEME_LONGUEUR, MOTS_DEMANDES, nomDeLongueur, segmentsParParagraphe, type Longueur, type Proposition,
} from "@/domaine/correction";
import type { Texte } from "@/domaine/copie";
import { pluriel } from "@/domaine/texte";
import type { TexteDeScene } from "@/serveur/copie";
import type { ReponseCorrection } from "@/serveur/correction";
import { annulerLaCorrection, garderLaCorrection } from "../../../actions-correction";
import { appelerUneAide } from "@/composants/PlusDEtoiles";

/**
 * L'aide à la correction, dans la page de scène (F13.1) : « Corriger » et son degré dans
 * l'en-tête de la copie ; aux degrés 1 à 3, les changements marqués au stylo dans la copie,
 * chacun gardé ou refusé d'un clic ; aux degrés 4 et 5, le texte et la proposition côte à
 * côte. Rien ne s'applique sans « Garder les changements » ou « Mettre ce texte dans la
 * scène » (F13-AC02) ; ensuite, « Annuler » quelques secondes. L'état de la scène, ses choix et
 * ses remises ne changent pas (F13-AC03, AC04).
 */

type Revue = {
  degre: Degre;
  /** La version et le texte sur lesquels se fonde la proposition, relus par le serveur */
  version: number;
  texte: Texte;
  propositions: Proposition[];
  /** Degrés 1 à 3 : les changements refusés, par leur numéro */
  refuses: number[];
  /** Degrés 4 et 5 : ce que montre un téléphone, qui n'a la place que d'un texte */
  onglet: "scene" | "proposition";
  /** Degrés 4 et 5 : la longueur demandée */
  longueur: Longueur;
  reste: string | null;
};

type Phase = null | { sorte: "demande"; degre: Degre } | { sorte: "change" } | ({ sorte: "revue" } & Revue);

export const AUCUN_CHANGEMENT = (degre: Degre) => `Rien à corriger au degré ${degre}.`;

export function useCorrection({
  sceneId, version, selection, livre, consigne, mots, avantDePartir, enAttente, relire, onRemplace,
}: {
  sceneId: string;
  /** Les mots du récit et de la sélection, lus quand la liste des degrés s'ouvre */
  mots: () => { tout: number; selection: number };
  /** La consigne de la scène, montrée au-dessus du côte à côte au degré 5 */
  consigne: string;
  /** La version que la page montre, à jour à chaque enregistrement */
  version: () => number;
  /** Les paragraphes que touche la sélection de l'adulte : « Corriger la sélection » */
  selection: string[] | null;
  livre: Livre;
  /** Ce que l'adulte vient de taper s'enregistre d'abord : la demande part sur ce texte */
  avantDePartir: () => Promise<boolean>;
  /** Une frappe pas encore enregistrée : le texte a changé depuis la demande */
  enAttente: () => boolean;
  /** Le texte a changé ailleurs : la page relit la scène avant de redemander */
  relire: () => Promise<void>;
  onRemplace: (suite: TexteDeScene) => void;
}) {
  const aides = useAidesIa();
  const dire = useMessage();
  const [degre, setDegre] = useState<Degre>(aides.degre);
  // Aux degrés 4 et 5 : la même longueur par défaut, pour cette demande seulement (F13.1)
  const [longueur, setLongueur] = useState<Longueur>(MEME_LONGUEUR);
  const [phase, setPhase] = useState<Phase>(null);
  const [occupe, setOccupe] = useState(false);

  const corriger = async (pour: Degre = degre, sur: string[] | null = selection) => {
    if (phase?.sorte === "demande") return;
    setPhase({ sorte: "demande", degre: pour });
    if (!(await avantDePartir())) {
      setPhase(null);
      return dire({ texte: "Vos dernières corrections ne sont pas encore enregistrées : réessayez dans un instant." });
    }
    const depuis = version();
    let r: ReponseCorrection;
    try {
      const reponse = await appelerUneAide("/ia/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene: sceneId, version: depuis, degre: pour, selection: sur, longueur: longueurReglable(pour) ? longueur : undefined }),
      });
      r = reponse.status === 401 ? { ok: false, message: "Connectez-vous de nouveau." } : ((await reponse.json()) as ReponseCorrection);
    } catch {
      r = { ok: false, message: "L’aide n’a pas répondu. Le texte n’a pas changé." };
    }
    if (!r.ok) {
      if (r.change) return setPhase({ sorte: "change" });
      setPhase(null);
      return dire({ texte: r.message });
    }
    // L'adulte a écrit pendant la demande : la proposition ne vaut plus pour ce texte
    if (version() !== depuis || enAttente()) return setPhase({ sorte: "change" });
    const n = changementsDe(r.propositions);
    if (n === 0) {
      setPhase(null);
      return dire({ texte: `${AUCUN_CHANGEMENT(pour)}${r.reste ? ` ${r.reste}` : ""}` });
    }
    setPhase({ sorte: "revue", degre: pour, version: r.version, texte: r.texte, propositions: r.propositions, refuses: [], onglet: "proposition", reste: r.reste, longueur: longueurReglable(pour) ? longueur : MEME_LONGUEUR });
  };

  const redemander = async () => {
    setPhase(null);
    await relire();
    void corriger();
  };

  const garder = async (revue: Revue) => {
    setOccupe(true);
    const fait = await garderLaCorrection(sceneId, revue.version, revue.propositions, revue.refuses);
    setOccupe(false);
    if (!fait.ok) {
      if (fait.change) return setPhase({ sorte: "change" });
      return dire({ texte: fait.message });
    }
    setPhase(null);
    onRemplace(fait.scene);
    const gardes = marquesDansLaCopie(revue.degre) ? changementsDe(revue.propositions) - revue.refuses.length : null;
    const apres = fait.scene.version;
    dire({
      texte: gardes === null ? "La proposition est maintenant le texte de la scène." : `${gardes} changement${pluriel(gardes)} gardé${pluriel(gardes)}.`,
      annuler: () => void annuler(revue.texte, apres),
    });
  };

  const annuler = async (texte: Texte, apres: number) => {
    if (!(await avantDePartir())) return dire({ texte: "Le texte a changé entre-temps : rien n’a été annulé." });
    const fait = await annulerLaCorrection(sceneId, apres, texte);
    if (!fait.ok) return dire({ texte: fait.message });
    onRemplace(fait.scene);
    dire({ texte: "La scène a retrouvé son texte d’avant la correction." });
  };

  const revue = phase?.sorte === "revue" ? phase : null;
  const regler = (suite: Partial<Revue>) => setPhase((p) => (p?.sorte === "revue" ? { ...p, ...suite } : p));

  // Le bouton et le degré, dans l'en-tête de la copie ; rien quand les aides sont éteintes (F13)
  const barre = aides.proposer ? (
    <span className="corriger">
      <button
        type="button"
        className="outil outil--texte outil--ia"
        title="Demander à l’IA une correction"
        disabled={phase?.sorte === "demande"}
        aria-busy={phase?.sorte === "demande"}
        // Le bouton ne prend pas le curseur à la copie : la sélection reste
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={() => void corriger()}
      >
        <Icone nom="ia" />
        {/* Seul le libellé du moment s'affiche : la pastille, calée à droite, grandit vers la gauche et le degré ne bouge pas */}
        <span className="outil__deux">
          <span aria-hidden={!!selection || phase?.sorte === "demande"} className={selection || phase?.sorte === "demande" ? "est-cache" : undefined}>Corriger</span>
          <span aria-hidden={!selection || phase?.sorte === "demande"} className={selection && phase?.sorte !== "demande" ? undefined : "est-cache"}>Corriger la sélection</span>
          <span aria-hidden={phase?.sorte !== "demande"} className={phase?.sorte === "demande" ? undefined : "est-cache"}>Correction…</span>
        </span>
      </button>
      <Menu
        fixe
        libelle={`Degré de correction : ${degre}, ${NOMS_DES_DEGRES[degre]}${longueurReglable(degre) && nomDeLongueur(longueur) ? `, longueur ${nomDeLongueur(longueur)}` : ""}`}
        // Le nom du degré se lit dans la liste et en tête de la proposition : l'en-tête de la copie n'a la place que du numéro
        bouton={
          <span title={`Degré ${degre} · ${NOMS_DES_DEGRES[degre]}`}>
            Degré {degre}
            {longueurReglable(degre) && nomDeLongueur(longueur) ? ` · ${nomDeLongueur(longueur)}` : ""}
            <Icone nom="chevron-bas" />
          </span>
        }
      >
        {(fermer) => (
          <div role="group" aria-label="Degré de correction">
            {DEGRES.map((d) => (
              <button
                key={d}
                type="button"
                className="corriger__degre"
                role="menuitemradio"
                aria-checked={d === degre}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  setDegre(d);
                  // Aux degrés 4 et 5, la liste reste ouverte : la longueur se règle dessous
                  if (!longueurReglable(d)) fermer();
                }}
              >
                <b>
                  Degré {d} · {NOMS_DES_DEGRES[d]}
                  {d === aides.degre ? <small> · par défaut</small> : null}
                </b>
                <span>{ROLES_DES_DEGRES[d]}</span>
                {d === degre ? <Icone nom="coche" /> : null}
              </button>
            ))}
            {longueurReglable(degre) ? (
              <ReglageLongueur longueur={longueur} actuels={selection ? mots().selection : mots().tout} sur={selection ? "la sélection" : "le texte"} onChoisir={setLongueur} fermer={fermer} />
            ) : null}
          </div>
        )}
      </Menu>
    </span>
  ) : null;

  const note =
    phase?.sorte === "change" ? (
      <div className="note note--attend" role="status">
        <Icone nom="horloge" />
        <p>Le texte a changé depuis la demande. Redemander ?</p>
        <span className="note__cmd">
          <button type="button" className="btn btn--petit btn--ia" onClick={() => void redemander()}>
            <Icone nom="ia" />
            Redemander
          </button>
          <button type="button" className="lien" onClick={() => setPhase(null)}>
            Laisser
          </button>
        </span>
      </div>
    ) : null;

  let autre: AutreTexte | null = null;
  if (revue) {
    const enLigne = <EnTete degre={revue.degre} longueur={revue.longueur} />;
    if (marquesDansLaCopie(revue.degre)) {
      const total = changementsDe(revue.propositions);
      const refuses = revue.refuses.length;
      autre = {
        barre: enLigne,
        corps: (
          <Marques
            revue={revue}
            livre={livre}
            onBasculer={(n) => regler({ refuses: revue.refuses.includes(n) ? revue.refuses.filter((x) => x !== n) : [...revue.refuses, n] })}
          />
        ),
        pied: (
          <>
            <p className="corr-compte" role="status">
              {total - refuses} changement{pluriel(total - refuses)} sur {total}.
              <span> Cliquez un changement pour le refuser ou le rétablir.</span>
              {revue.reste ? <span className="corr-reste"> {revue.reste}</span> : null}
            </p>
            <span className="corr-cmd">
              <button type="button" className="btn" disabled={occupe} onClick={() => setPhase(null)}>
                Laisser
              </button>
              <button type="button" className="btn btn--primaire" disabled={occupe || refuses === total} onClick={() => void garder(revue)}>
                <Icone nom="coche" />
                Garder les changements
              </button>
            </span>
          </>
        ),
      };
    } else {
      autre = {
        barre: enLigne,
        corps: (
          <CoteACote
            revue={revue}
            livre={livre}
            consigne={consigne}
            onOnglet={(onglet) => regler({ onglet })}
            onModifier={(id, apres) => regler({ propositions: revue.propositions.map((p) => (p.id === id ? { ...p, apres } : p)) })}
          />
        ),
        pied: (
          <>
            <p className="corr-compte">
              {compterMots(revue.propositions.map((p) => p.avant).join(" "))} → {compterMots(revue.propositions.map((p) => p.apres).join(" "))} mots.
              <span> La proposition se modifie sur place.</span>
              {revue.reste ? <span className="corr-reste"> {revue.reste}</span> : null}
            </p>
            <span className="corr-cmd">
              <button type="button" className="btn" disabled={occupe} onClick={() => setPhase(null)}>
                Laisser
              </button>
              <button
                type="button"
                className="btn btn--primaire"
                disabled={occupe || revue.propositions.some((p) => !p.apres.trim())}
                onClick={() => void garder(revue)}
              >
                <Icone nom="coche" />
                Mettre ce texte dans la scène
              </button>
            </span>
          </>
        ),
      };
    }
  }

  return { barre, note, autre, large: !!revue && !marquesDansLaCopie(revue.degre), enCours: phase !== null };
}

function EnTete({ degre, longueur }: { degre: Degre; longueur: Longueur }) {
  const l = longueurReglable(degre) ? nomDeLongueur(longueur) : null;
  return (
    <span className="copie__lecture corr-tete">
      <Icone nom="ia" />
      Correction proposée · Degré {degre} · {NOMS_DES_DEGRES[degre]}
      {l ? ` · ${l}` : ""}
    </span>
  );
}

/**
 * La longueur de la proposition, aux degrés 4 et 5 : « Même longueur », « ×1,5 », « ×2 », ou
 * un nombre de mots approximatif. Chaque facteur dit ce qu'il donne en mots.
 */
function ReglageLongueur({
  longueur, actuels, sur, onChoisir, fermer,
}: { longueur: Longueur; actuels: number; /** « le texte » ou « la sélection » */ sur: string; onChoisir: (l: Longueur) => void; fermer: () => void }) {
  const [saisie, setSaisie] = useState("mots" in longueur ? String(longueur.mots) : "");
  return (
    <div className="corriger__longueur" role="group" aria-label="Longueur de la proposition">
      <div className="corriger__facteurs">
        <b>Longueur</b>
        {FACTEURS.map((f) => {
          const choisi = !("mots" in longueur) && longueur.facteur === f;
          const cible = cibleDe({ facteur: f }, actuels);
          return (
            <button
              key={f}
              type="button"
              aria-pressed={choisi}
              title={cible ? `Environ ${cible} mots` : `${actuels} mots, comme ${sur}`}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => {
                setSaisie("");
                onChoisir({ facteur: f });
                fermer();
              }}
            >
              {f === 1 ? "Même longueur" : nomDeLongueur({ facteur: f })}
            </button>
          );
        })}
      </div>
      <label className="corriger__mots">
        ou environ
        <input
          type="number"
          inputMode="numeric"
          min={MOTS_DEMANDES.min}
          max={MOTS_DEMANDES.max}
          step={10}
          value={saisie}
          placeholder="ex. 100"
          aria-label="Nombre de mots approximatif"
          onChange={(ev) => {
            setSaisie(ev.target.value);
            const n = Number(ev.target.value);
            onChoisir(ev.target.value.trim() && Number.isFinite(n) && n > 0 ? { mots: Math.min(MOTS_DEMANDES.max, Math.max(MOTS_DEMANDES.min, Math.round(n))) } : MEME_LONGUEUR);
          }}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              fermer();
            }
          }}
        />
        mots <span className="corriger__compte">· {sur === "la sélection" ? "sélection actuelle" : "texte actuel"} : {actuels}</span>
      </label>
    </div>
  );
}

/** Un changement dit à voix haute : ses mots, ou, pour la ponctuation et les espaces, chaque espace en « ␣ ». */
const enClair = (t: string): string => (/[\p{L}\p{N}]/u.test(t) ? t.trim() : t.replace(/[ \u00a0\u202f]/g, "␣"));

/** Degrés 1 à 3 : la copie, en lecture, avec les changements au stylo. */
function Marques({ revue, livre, onBasculer }: { revue: Revue; livre: Livre; onBasculer: (n: number) => void }) {
  const segments = segmentsParParagraphe(revue.propositions);
  return (
    <TexteLu
      texte={revue.texte}
      libelle="Correction proposée, dans le texte de la scène"
      livre={livre}
      className="corr-texte"
      paragraphe={(bloc) => {
        const s = segments.get(bloc.id);
        if (!s) return null;
        return (
          <p className="corr-p">
            {s.map((seg, k) => {
              if (seg.sorte === "pareil") return <span key={k}>{seg.avant}</span>;
              const refuse = revue.refuses.includes(seg.n);
              const avant = enClair(seg.retire);
              const apres = enClair(seg.ajoute);
              const nom = !avant ? `ajouter « ${apres} »` : !apres ? `retirer « ${avant} »` : `« ${avant} » devient « ${apres} »`;
              return (
                <button
                  key={k}
                  type="button"
                  className={`corr${refuse ? " corr--refuse" : ""}`}
                  aria-pressed={!refuse}
                  aria-label={`Changement ${seg.n + 1} : ${nom}. ${refuse ? "Refusé" : "Gardé"}.`}
                  title={refuse ? "Refusé. Cliquer pour le rétablir." : "Cliquer pour refuser ce changement."}
                  onClick={() => onBasculer(seg.n)}
                >
                  {refuse ? (
                    seg.retire ? <span className="corr__laisse">{seg.retire}</span> : <span className="corr__vide" aria-hidden="true">‸</span>
                  ) : (
                    <>
                      {seg.retire ? <del>{seg.retire}</del> : null}
                      {seg.ajoute ? <ins>{seg.ajoute}</ins> : null}
                    </>
                  )}
                </button>
              );
            })}
          </p>
        );
      }}
    />
  );
}

/** Degrés 4 et 5 : le texte de la scène et la proposition, côte à côte ; un onglet chacun sur téléphone. */
function CoteACote({
  revue, livre, consigne, onOnglet, onModifier,
}: { revue: Revue; livre: Livre; consigne: string; onOnglet: (o: Revue["onglet"]) => void; onModifier: (id: string, apres: string) => void }) {
  const parId = new Map(revue.propositions.map((p) => [p.id, p]));
  return (
    <div className="corr-cote" data-onglet={revue.onglet}>
      {/* Au degré 5, la proposition se juge d'après la consigne : elle reste sous les yeux, la colonne de droite étant repliée */}
      {revue.degre === 5 && consigne.trim() ? (
        <p className="corr-consigne">
          <b>Consigne</b> {consigne.trim()}
        </p>
      ) : null}
      <div className="corr-cote__onglets" role="tablist" aria-label="Textes à comparer">
        <button type="button" role="tab" aria-selected={revue.onglet === "scene"} onClick={() => onOnglet("scene")}>
          Texte actuel
        </button>
        <button type="button" role="tab" aria-selected={revue.onglet === "proposition"} onClick={() => onOnglet("proposition")}>
          <Icone nom="ia" />
          Proposition
        </button>
      </div>
      <section className="corr-cote__col" data-col="scene" aria-labelledby="corr-scene-t">
        <h3 id="corr-scene-t">Texte actuel</h3>
        <TexteLu texte={revue.texte} libelle="Texte de la scène, tel qu’il est" livre={livre} />
      </section>
      <section className="corr-cote__col corr-cote__col--prop" data-col="proposition" aria-labelledby="corr-prop-t">
        <h3 id="corr-prop-t">
          <Icone nom="ia" />
          Proposition
        </h3>
        <TexteLu
          texte={revue.texte}
          libelle="Proposition, modifiable"
          livre={livre}
          paragraphe={(bloc) => {
            const p = parId.get(bloc.id);
            return p ? <Champ valeur={p.apres} change={p.apres !== p.avant} onChange={(v) => onModifier(p.id, v)} /> : null;
          }}
        />
      </section>
    </div>
  );
}

/** Un paragraphe de la proposition, modifiable, qui grandit avec son texte. */
export function Champ({ valeur, change, onChange }: { valeur: string; change: boolean; onChange: (v: string) => void }): ReactNode {
  const ref = useRef<HTMLTextAreaElement>(null);
  // La hauteur suit le texte, et la largeur : un champ mesuré caché, ou avant que l'écran tourne, se remesure
  useLayoutEffect(() => {
    const t = ref.current;
    if (!t) return;
    const mesurer = () => {
      t.style.height = "auto";
      t.style.height = `${t.scrollHeight}px`;
    };
    mesurer();
    const observe = new ResizeObserver(mesurer);
    observe.observe(t);
    return () => observe.disconnect();
  }, [valeur]);
  return (
    <textarea
      ref={ref}
      className={`corr-champ${change ? " corr-champ--change" : ""}`}
      aria-label="Paragraphe proposé"
      rows={1}
      value={valeur}
      spellCheck
      lang="fr"
      onChange={(ev) => onChange(ev.target.value.replace(/\n/g, " "))}
    />
  );
}
