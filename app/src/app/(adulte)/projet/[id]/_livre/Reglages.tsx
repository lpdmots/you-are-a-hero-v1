"use client";

import { ouvrirOffreDuPass } from "@/composants/OffreDuPass";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bulle } from "@/composants/Bulle";
import { adresseImage } from "@/composants/copie/Blocs";
import { EditeurLeger } from "@/composants/EditeurLeger";
import { useEnregistrement } from "@/composants/Enregistrement";
import { Icone } from "@/composants/Icone";
import { deposer, reduire, REFUS_IMPORT } from "@/composants/importer";
import { MARGE_MINIMALE, MARGES_DE_DEPART, zoneDeTexte, type Marges, type ReglagesDuLivre } from "@/domaine/mise-en-page";
import { colonnesDesNoms, nomsTries, texteSimple, type FormePage, type PagesDuLivre } from "@/domaine/pages";
import { pluriel } from "@/domaine/texte";
import { listerImages } from "../../actions-images";
import { reglerJeu } from "../../actions-preparation";
import { PetiteDoublePage, type SourceApercu } from "./Apercu";
import { annulerAgencement, garderOrdre, melangerAvecPrecedente, reglerMiseEnPage, reglerPagesDuLivre } from "../../actions-livre";
import type { EtatDeLOrdre, Reordonne } from "@/serveur/livre/ordre";

/**
 * Le volet « Réglages » de « Mettre en page » (F11.6) : « Texte et pages », puis « Pages de début
 * et de fin ». Tout s'enregistre seul. Une page de présentation se modifie dans le panneau à
 * droite, comme les réglages d'un bloc dans la scène (étape 6, 15 octobre 2026).
 */

type CleDePage = "titre" | "auteurs" | "commentLire" | "feuille" | "fin";
const NOM_DE_PAGE: Record<CleDePage, string> = {
  titre: "Page de titre",
  auteurs: "Page des auteurs",
  commentLire: "Comment lire ce livre",
  feuille: "Feuille d’aventure",
  fin: "Page de fin",
};
/** Le nom que la composition donne à chaque page de présentation (`data-page`) */
const PAGE_COMPOSEE: Record<CleDePage, string> = { titre: "titre", auteurs: "auteurs", commentLire: "comment-lire", feuille: "feuille", fin: "fin" };
/** Les pages qui portent un texte à écrire : elles s'ouvrent en grand */
const PAGES_A_ECRIRE: CleDePage[] = ["commentLire", "fin"];
const EXEMPLE = "Plus il avançait, plus la brume s’épaississait autour de lui. La lanterne clignotait toujours.";

export function VoletReglages({
  projet, titre, reglages: recus, pages: recues, des, feuille, prenoms, aDesEnigmes, regles, parties, ordre, apercu, onVoirApercu,
}: {
  projet: { id: string; aChoix: boolean; deClasse: boolean };
  titre: string;
  reglages: ReglagesDuLivre;
  pages: PagesDuLivre;
  /** Le dé du livre, réglé dans la préparation : « Dés » en bas de page n'est proposé qu'avec lui */
  des: 0 | 1 | 2;
  /** Les sections de la feuille d'aventure, pour le lecteur en ligne ; rien sans feuille */
  feuille: string[] | null;
  /** Les prénoms des élèves de la classe, pour la page des auteurs */
  prenoms: string[];
  aDesEnigmes: boolean;
  /** Les règles du jeu de la Préparation, qui suivent « Comment lire ce livre » (F04.2) */
  regles: string;
  /** Les parties du livre à choix, pour « Ordre des passages » ; rien en récit classique */
  parties: PartieDuLivre[] | null;
  /** Ce que l'adulte a décidé de l'ordre, et le doute (F11.6) */
  ordre: EtatDeLOrdre | null;
  /** L'aperçu composé, pour la petite double page qui suit les réglages */
  apercu: SourceApercu;
  onVoirApercu: () => void;
}) {
  const [r, setR] = useState(recus);
  const [pages, setPages] = useState(recues);
  const [ouverte, setOuverte] = useState<CleDePage | null>(null);
  const enreg = useEnregistrement();

  const regler = (suite: ReglagesDuLivre) => {
    setR(suite);
    enreg.prevoir(() => reglerMiseEnPage(projet.id, suite), 500, "reglages");
  };
  // Les pages telles qu'enregistrées : une image refusée par la limite gratuite s'en retire (F14-AC14)
  const enregistrees = useRef(recues);
  const reglerPages = (suite: PagesDuLivre) => {
    setPages(suite);
    enreg.prevoir(async () => {
      const fait = await reglerPagesDuLivre(projet.id, suite);
      if (fait.ok) enregistrees.current = suite;
      else if (fait.limite) {
        setPages(enregistrees.current);
        ouvrirOffreDuPass(projet.id, fait.limite);
      }
      return fait;
    }, 700, "pages");
  };

  const listePages: CleDePage[] = ["titre", ...(pages.auteurs.place === "debut" ? (["auteurs"] as const) : []), ...(projet.aChoix ? (["commentLire"] as const) : []), ...(feuille ? (["feuille"] as const) : []), ...(pages.auteurs.place === "fin" ? (["auteurs"] as const) : []), "fin"];

  // Le panneau d'une page ; « Comment lire ce livre » et la page de fin s'écrivent dans une
  // grande fenêtre, le panneau étroit ne se prêtant pas à un texte (demandé par le porteur le 25 octobre 2026)
  const panneau = (cle: CleDePage, large = false) => (
    <PanneauDePage
      key={cle}
      cle={cle}
      projet={projet}
      titre={titre}
      pages={pages}
      zone={zoneDeTexte(r)}
      feuille={feuille}
      prenoms={prenoms}
      aDesEnigmes={aDesEnigmes}
      regles={regles}
      large={large}
      desImprimes={r.basDePage === "des"}
      onChange={reglerPages}
      onFermer={() => setOuverte(null)}
      doublePage={
        <PetiteDoublePage
          source={apercu}
          folio={apercu.charge?.apercu.presentation[PAGE_COMPOSEE[cle]] ?? null}
          legende={`${NOM_DE_PAGE[cle]}, page ${apercu.charge?.apercu.presentation[PAGE_COMPOSEE[cle]] ?? ""}`}
        />
      }
    />
  );

  return (
    <div className="reglages">
      <div className="reglages__sections">
        <section className="reglages__section" aria-labelledby="texte-pages-t">
          <h2 id="texte-pages-t">Texte et pages</h2>
          <div className="reglages__colonnes">
            <div className="reglages__colonne">
              <Groupe titre="Police">
                <div className="cartes-reglage" role="radiogroup" aria-label="Police">
                  {(["vollkorn", "andika"] as const).map((p) => (
                    <CarteChoix key={p} nom="police" choisie={r.police === p} onChoisir={() => regler({ ...r, police: p })} etiquette={p === "vollkorn" ? "Vollkorn" : "Andika"} note={p === "vollkorn" ? "par défaut" : "premiers lecteurs"}>
                      <span className={`carte-reglage__exemple carte-reglage__exemple--${p}`}>{EXEMPLE}</span>
                    </CarteChoix>
                  ))}
                </div>
              </Groupe>
              <Groupe titre="Taille du texte">
                <div className="bascule" role="group" aria-label="Taille du texte">
                  {(["petite", "moyenne", "grande"] as const).map((t) => (
                    <button key={t} type="button" aria-pressed={r.taille === t} onClick={() => regler({ ...r, taille: t })}>
                      {t === "petite" ? "Petite" : t === "moyenne" ? "Moyenne" : "Grande"}
                    </button>
                  ))}
                </div>
              </Groupe>
              <Groupe titre="Alignement du récit">
                <div className="cartes-reglage" role="radiogroup" aria-label="Alignement du récit">
                  <CarteChoix nom="alignement" choisie={r.alignement === "justifie"} onChoisir={() => regler({ ...r, alignement: "justifie" })} etiquette="Justifié, avec césure" note="par défaut">
                    <span className="carte-reglage__exemple carte-reglage__exemple--justifie">{EXEMPLE}</span>
                  </CarteChoix>
                  <CarteChoix nom="alignement" choisie={r.alignement === "gauche"} onChoisir={() => regler({ ...r, alignement: "gauche" })} etiquette="Aligné à gauche, sans césure">
                    <span className="carte-reglage__exemple">{EXEMPLE}</span>
                  </CarteChoix>
                </div>
              </Groupe>
            </div>
            <div className="reglages__colonne">
              <Groupe
                titre="Bas des pages du récit"
                bulle={
                  projet.aChoix
                    ? "Un numéro de page se confondrait avec un numéro de passage : par défaut, rien. Les dés remplacent le lancer : ouvrir le livre au hasard donne une face."
                    : "Le numéro de page est imprimé côté extérieur, sur les pages du récit seulement."
                }
              >
                <div className="cx-seg" role="radiogroup" aria-label="Bas des pages du récit">
                  {([["rien", "Rien"], ["numero", "Numéro de page"], ...(projet.aChoix && des ? [["des", des === 2 ? "Deux dés" : "Un dé"]] : [])] as [ReglagesDuLivre["basDePage"], string][]).map(([v, nom]) => (
                    <label key={v}>
                      <input type="radio" name="bas-de-page" checked={r.basDePage === v} onChange={() => regler({ ...r, basDePage: v })} />
                      <span>{nom}</span>
                    </label>
                  ))}
                </div>
              </Groupe>
              <Groupe titre="Titres et nouvelles pages">
                <div className="reglages__inters">
                  <Inter oui={r.titresDePartie} onChange={(v) => regler({ ...r, titresDePartie: v })}>
                    Imprimer les titres de partie
                  </Inter>
                  <Inter oui={r.partieNouvellePage} onChange={(v) => regler({ ...r, partieNouvellePage: v })}>
                    Chaque partie commence sur une nouvelle page
                  </Inter>
                  {projet.aChoix ? null : (
                    <>
                      <Inter oui={r.titresDeChapitre} onChange={(v) => regler({ ...r, titresDeChapitre: v })}>
                        Imprimer les titres de chapitre
                      </Inter>
                      <Inter oui={r.chapitreNouvellePage} onChange={(v) => regler({ ...r, chapitreNouvellePage: v })}>
                        Chaque chapitre commence sur une nouvelle page
                      </Inter>
                    </>
                  )}
                </div>
              </Groupe>
              <ReglageDesMarges marges={r.marges} onChange={(marges) => regler({ ...r, marges })} />
            </div>
          </div>
        </section>

        {parties ? <OrdreDesPassages projetId={projet.id} parties={parties} ordre={ordre} /> : null}

        <section className="reglages__section" aria-labelledby="pages-t">
          <h2 id="pages-t">Pages de début et de fin</h2>
          <ul className="pages-du-livre">
            {listePages.map((cle) => (
              <LigneDePage
                key={cle}
                cle={cle}
                pages={pages}
                feuille={feuille}
                ouverte={ouverte === cle}
                onOuvrir={() => setOuverte(ouverte === cle ? null : cle)}
                onPresente={(oui) => {
                  reglerPages(presenter(pages, cle, oui));
                  // Une page mise dans le livre s'ouvre aussitôt dans le panneau
                  if (oui) setOuverte(cle);
                }}
              />
            ))}
          </ul>
        </section>
      </div>

      {/* La colonne de droite est réservée : le panneau d'une page y remplace le livre en petit, rien ne se déplace */}
      <aside className="reglages__cote" aria-label="Le livre en petit">
        {ouverte && !PAGES_A_ECRIRE.includes(ouverte) ? (
          panneau(ouverte)
        ) : (
          <section className="cx reglages__livre">
            <PetiteDoublePage
              source={apercu}
              folio={apercu.charge ? apercu.charge.apercu.premierePageDuRecit || 1 : null}
              legende={apercu.charge ? `Début du récit · ${apercu.charge.apercu.pages} pages en tout` : ""}
            />
            <button type="button" className="btn btn--petit" onClick={onVoirApercu}>
              <Icone nom="livre" />
              Voir l’aperçu
            </button>
          </section>
        )}
        <p className="reglages__etat" role="status">
          {enreg.erreur ?? (enreg.enCours ? "Enregistrement…" : enreg.enregistre ? "Enregistré" : "")}
        </p>
      </aside>
      {ouverte && PAGES_A_ECRIRE.includes(ouverte) ? <GrandeFenetre onFermer={() => setOuverte(null)}>{panneau(ouverte, true)}</GrandeFenetre> : null}
    </div>
  );
}

export type PartieDuLivre = { id: string; titre: string; avecPrecedente: boolean; numeros: [number, number] | null };

/**
 * « Ordre des passages » (F11.5, F11.6) : le mélange par partie, et les parties que l'adulte
 * réunit pour que leurs passages se mélangent ensemble (F11-AC17) ; puis « Moins de blanc » :
 * « Réordonner les passages » ou « Garder cet ordre », et le doute quand le livre a changé.
 */
function OrdreDesPassages({ projetId, parties, ordre }: { projetId: string; parties: PartieDuLivre[]; ordre: EtatDeLOrdre | null }) {
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const groupes: { partie: PartieDuLivre; rang: number }[][] = [];
  parties.forEach((partie, i) => {
    if (partie.avecPrecedente && groupes.length) groupes[groupes.length - 1].push({ partie, rang: i + 1 });
    else groupes.push([{ partie, rang: i + 1 }]);
  });
  const reunir = async (partie: PartieDuLivre, oui: boolean) => {
    setEnCours(partie.id);
    setErreur(null);
    const r = await melangerAvecPrecedente(projetId, partie.id, oui);
    setEnCours(null);
    if (!r.ok) setErreur(r.erreur);
  };
  const numeros = (n: [number, number] | null) => (!n ? "hors du livre" : n[0] === n[1] ? `n° ${n[0]}` : `n° ${n[0]} à ${n[1]}`);
  const interrupteur = (partie: PartieDuLivre, rang: number) => (
    <label className="inter melange__inter">
      <input type="checkbox" role="switch" checked={partie.avecPrecedente} disabled={enCours !== null} onChange={(e) => void reunir(partie, e.target.checked)} />
      <span className="inter__piste" aria-hidden="true" />
      <span>
        Mélanger les parties {rang - 1} et {rang}
      </span>
    </label>
  );
  return (
    <section className="reglages__section" aria-labelledby="ordre-t">
      <h2 id="ordre-t" className="reglages__titre-section">
        Ordre des passages
        <Bulle question="Pourquoi mélanger des parties ensemble ?">
          <span>Quand des parties sont très courtes, leurs passages se cachent mieux mélangés ensemble. Les numéros changent, les renvois suivent.</span>
        </Bulle>
      </h2>
      <p className="reglages__phrase">Les passages sont mélangés dans chaque partie : la suite d’un choix n’est pas à côté de lui.</p>
      <div className="melange">
        {groupes.map((groupe, gi) => {
          const bornes = groupe.flatMap((x) => x.partie.numeros ?? []);
          return (
            <div key={groupe[0].partie.id} className="melange__bloc">
              {gi > 0 ? interrupteur(groupe[0].partie, groupe[0].rang) : null}
              <div className={`melange__groupe${groupe.length > 1 ? " est-reuni" : ""}`}>
                {groupe.map(({ partie, rang }, j) => (
                  <div key={partie.id} className="melange__partie-bloc">
                    {j > 0 ? interrupteur(partie, rang) : null}
                    <p className="melange__partie">
                      <b>Partie {rang}</b> · {partie.titre} · <span className="melange__numeros">{numeros(partie.numeros)}</span>
                    </p>
                  </div>
                ))}
                {groupe.length > 1 && bornes.length ? (
                  <p className="melange__ensemble">
                    n° {Math.min(...bornes)} à {Math.max(...bornes)}, mélangés ensemble
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      <MoinsDeBlanc projetId={projetId} ordre={ordre} />
    </section>
  );
}

/**
 * « Moins de blanc » (F11.5, F11.6) : l'agencement proposé, jamais imposé. Fait, il s'annule ;
 * relancé après des déplacements faits à la main, il les abandonne après un avertissement
 * (F11-AC81). Le doute se dit ici, avec ses deux réponses (F11-AC86).
 */
function MoinsDeBlanc({ projetId, ordre }: { projetId: string; ordre: EtatDeLOrdre | null }) {
  const routeur = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [avertir, setAvertir] = useState(false);
  const [fait, setFait] = useState<{ annuler: Record<string, number>; decision: string | null; gain: number } | null>(null);
  const [rien, setRien] = useState<string | null>(null);
  const reordonner = async () => {
    setEnCours(true);
    setErreur(null);
    setRien(null);
    setAvertir(false);
    // Une route du livre, comme l'aperçu : l'ordre proposé y est composé une fois, avec Chromium
    let r: Reordonne;
    try {
      r = (await (await fetch(`/livre/${projetId}/reordonner`, { method: "POST" })).json()) as Reordonne;
    } catch {
      r = { ok: false, erreur: "L’ordre n’a pas pu être changé. Réessayez dans un instant." };
    }
    setEnCours(false);
    if (!r.ok) return r.rien ? setRien(r.erreur) : setErreur(r.erreur);
    setFait({ annuler: r.annuler, decision: r.decision, gain: Math.max(0, r.avant - r.apres) });
    routeur.refresh();
  };
  const demander = () => (ordre?.retouche ? setAvertir(true) : void reordonner());
  const garder = async () => {
    setEnCours(true);
    setErreur(null);
    const r = await garderOrdre(projetId);
    setEnCours(false);
    if (!r.ok) setErreur(r.erreur);
  };
  const annuler = async () => {
    if (!fait) return;
    setEnCours(true);
    const r = await annulerAgencement(projetId, fait.annuler, fait.decision);
    setEnCours(false);
    if (!r.ok) return setErreur(r.erreur);
    setFait(null);
  };
  const decision = ordre?.decision ?? null;
  return (
    <div className={`blanc${ordre?.doute ? " blanc--doute" : ""}`} id="moins-de-blanc">
      <h3 className="reglages__titre">
        {ordre?.doute ? <Icone nom="alerte" /> : null}
        {ordre?.doute ? "Le livre a changé." : "Moins de blanc"}
      </h3>
      <p className="reglages__phrase">
        {ordre?.doute
          ? "Des passages ont changé de page depuis que l’ordre a été décidé. Gardez-le, ou réordonnez à nouveau."
          : "Les passages de chaque partie sont rangés pour laisser moins de blanc au bas des pages."}
      </p>
      {rien ? (
        <p className="blanc__rien" role="status">
          {rien}
        </p>
      ) : fait && !ordre?.doute ? (
        <p className="blanc__fait" role="status">
          <Icone nom="coche" />
          Passages réordonnés{fait.gain ? ` : environ ${fait.gain} mm de blanc en moins` : ""}.
        </p>
      ) : decision === "garde" && !ordre?.doute ? (
        <p className="blanc__fait" role="status">
          <Icone nom="coche" />
          Ordre gardé.
        </p>
      ) : null}
      {avertir ? (
        <div className="blanc__avertir" role="group" aria-label="Réordonner à nouveau ?">
          <p>Vos déplacements de passages seront abandonnés ; les réglages et les images sont gardés.</p>
          <p className="blanc__cmd">
            <button type="button" className="btn btn--primaire" disabled={enCours} onClick={() => void reordonner()}>
              Réordonner quand même
            </button>
            <button type="button" className="lien" onClick={() => setAvertir(false)}>
              Annuler
            </button>
          </p>
        </div>
      ) : (
        <>
          <p className="blanc__encadre">Les numéros changent, les renvois suivent.</p>
          <p className="blanc__cmd">
            <button type="button" className={`btn${decision === null || ordre?.doute ? " btn--primaire" : ""}`} disabled={enCours} aria-busy={enCours || undefined} onClick={demander}>
              {enCours ? "Calcul…" : decision === "reordonne" ? "Réordonner à nouveau" : "Réordonner les passages"}
            </button>
            {decision === null || ordre?.doute ? (
              <button type="button" className="btn" disabled={enCours} onClick={() => void garder()}>
                Garder cet ordre
              </button>
            ) : null}
            {fait && !ordre?.doute ? (
              <button type="button" className="lien" disabled={enCours} onClick={() => void annuler()}>
                Annuler
              </button>
            ) : null}
          </p>
        </>
      )}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

const presenter = (p: PagesDuLivre, cle: CleDePage, oui: boolean): PagesDuLivre =>
  cle === "auteurs" ? { ...p, auteurs: { ...p.auteurs, presente: oui } } : cle === "commentLire" ? { ...p, commentLire: { ...p.commentLire, presente: oui } } : cle === "fin" ? { ...p, fin: { ...p.fin, presente: oui } } : p;

function Groupe({ titre, bulle, children }: { titre: string; bulle?: string; children: ReactNode }) {
  return (
    <div className="reglages__groupe">
      <h3 className="reglages__titre">
        {titre}
        {bulle ? (
          <Bulle question={`${titre} : à quoi sert ce réglage ?`}>
            <span>{bulle}</span>
          </Bulle>
        ) : null}
      </h3>
      {children}
    </div>
  );
}

function CarteChoix({ nom, choisie, onChoisir, etiquette, note, children }: { nom: string; choisie: boolean; onChoisir: () => void; etiquette: string; note?: string; children: ReactNode }) {
  return (
    <label className={`carte-reglage${choisie ? " est-choisie" : ""}`}>
      <input type="radio" name={nom} checked={choisie} onChange={onChoisir} className="vh" />
      <span className="carte-reglage__nom">
        {etiquette}
        {note ? <small>{note}</small> : null}
      </span>
      {children}
    </label>
  );
}

function Inter({ oui, onChange, children }: { oui: boolean; onChange: (oui: boolean) => void; children: ReactNode }) {
  return (
    <label className="inter">
      <input type="checkbox" role="switch" checked={oui} onChange={(e) => onChange(e.target.checked)} />
      <span className="inter__piste" aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

const COTES: { cle: keyof Marges; nom: string }[] = [
  { cle: "haut", nom: "Haut" },
  { cle: "bas", nom: "Bas" },
  { cle: "exterieur", nom: "Extérieur" },
  { cle: "interieur", nom: "Intérieur, côté reliure" },
];
const enMm = (n: number) => String(n).replace(".", ",");
const COURT: Record<keyof Marges, string> = { haut: "Haut", bas: "Bas", exterieur: "Extérieur", interieur: "Intérieur" };

/** Les marges, repliées sur une ligne : on y touche rarement (étape 6, 15 octobre 2026). */
function ReglageDesMarges({ marges, onChange }: { marges: Marges; onChange: (m: Marges) => void }) {
  const [ouvertes, setOuvertes] = useState(false);
  const [saisies, setSaisies] = useState<Record<keyof Marges, string>>(() => Object.fromEntries(COTES.map((c) => [c.cle, enMm(marges[c.cle])])) as Record<keyof Marges, string>);
  const [refus, setRefus] = useState<Partial<Record<keyof Marges, string>>>({});
  const [cote, setCote] = useState<keyof Marges | null>(null);
  const valider = (cle: keyof Marges) => {
    const n = Number.parseFloat(saisies[cle].replace(",", "."));
    if (!Number.isFinite(n) || n < MARGE_MINIMALE || n > 40) {
      setRefus((r) => ({ ...r, [cle]: n < MARGE_MINIMALE ? `${saisies[cle] || "0"} mm refusé : ${MARGE_MINIMALE} mm au moins.` : `${saisies[cle]} mm refusé : 40 mm au plus.` }));
      setSaisies((s) => ({ ...s, [cle]: enMm(marges[cle]) }));
      return;
    }
    setRefus((r) => ({ ...r, [cle]: undefined }));
    if (n !== marges[cle]) onChange({ ...marges, [cle]: Math.round(n * 10) / 10 });
  };
  const deDepart = COTES.every((c) => marges[c.cle] === MARGES_DE_DEPART[c.cle]);
  return (
    <div className="reglages__groupe">
      <h3 className="reglages__titre">
        Marges
        <Bulle question="Pourquoi changer les marges ?">
          <span>Pour votre imprimeur, ou votre goût. La marge intérieure, du côté de la reliure, alterne entre pages de gauche et de droite. Sous 10 mm, un texte risquerait d’être rogné.</span>
        </Bulle>
      </h3>
      <p className="marges__ligne">
        <span className="marges__valeurs">{COTES.map((c) => `${COURT[c.cle]} ${enMm(marges[c.cle])}`).join(" · ")} mm</span>
        <button type="button" className="lien" aria-expanded={ouvertes} onClick={() => setOuvertes(!ouvertes)}>
          {ouvertes ? "Replier" : "Modifier"}
        </button>
      </p>
      {ouvertes ? (
        <div className="marges__depli">
        <div className="marges__champs">
          {COTES.map((c) => (
            <label key={c.cle} className="champ">
              <span>{c.nom}</span>
              <span className="marges__champ">
                <input
                  className="pchamp"
                  inputMode="decimal"
                  value={saisies[c.cle]}
                  aria-describedby={refus[c.cle] ? `marge-${c.cle}` : undefined}
                  onChange={(e) => setSaisies((s) => ({ ...s, [c.cle]: e.target.value.replace(/[^\d,.]/g, "") }))}
                  onFocus={() => setCote(c.cle)}
                  onBlur={() => {
                    setCote(null);
                    valider(c.cle);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && valider(c.cle)}
                />
                <span aria-hidden="true">mm</span>
              </span>
              {refus[c.cle] ? (
                <span className="erreur" id={`marge-${c.cle}`} role="alert">
                  {refus[c.cle]}
                </span>
              ) : null}
            </label>
          ))}
          <p className="marges__depart">
            <button
              type="button"
              className="lien"
              disabled={deDepart}
              onClick={() => {
                setSaisies(Object.fromEntries(COTES.map((c) => [c.cle, enMm(MARGES_DE_DEPART[c.cle])])) as Record<keyof Marges, string>);
                setRefus({});
                onChange({ ...MARGES_DE_DEPART });
              }}
            >
              Valeurs de départ
            </button>
          </p>
        </div>
        <SchemaDesMarges marges={marges} cote={cote} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Le schéma de double page à côté des quatre champs : les marges à l'échelle, la reliure au
 * milieu ; celle qu'on modifie est soulignée de canard (étape 6, 15 octobre 2026).
 */
function SchemaDesMarges({ marges, cote }: { marges: Marges; cote: keyof Marges | null }) {
  const L = 148;
  const H = 210;
  const { haut, bas, exterieur, interieur } = marges;
  const zone = (x: number) => ({ x, y: haut, width: L - exterieur - interieur, height: H - haut - bas });
  const gauche = zone(exterieur);
  const droite = zone(L + interieur);
  const lignes = (z: { x: number; y: number; width: number; height: number }) =>
    Array.from({ length: Math.floor(z.height / 12) }, (_, i) => <rect key={i} x={z.x} y={z.y + 4 + i * 12} width={i % 4 === 3 ? z.width * 0.6 : z.width} height={3} rx={1.5} className="schema-marges__ligne" />);
  const vise = (c: keyof Marges) => (cote === c ? " est-visee" : "");
  return (
    <svg className="schema-marges" viewBox={`-6 -6 ${2 * L + 12} ${H + 12}`} aria-hidden="true">
      <rect x={0} y={0} width={L} height={H} className="schema-marges__page" />
      <rect x={L} y={0} width={L} height={H} className="schema-marges__page" />
      <rect x={0} y={0} width={2 * L} height={haut} className={`schema-marges__marge${vise("haut")}`} />
      <rect x={0} y={H - bas} width={2 * L} height={bas} className={`schema-marges__marge${vise("bas")}`} />
      <rect x={0} y={0} width={exterieur} height={H} className={`schema-marges__marge${vise("exterieur")}`} />
      <rect x={2 * L - exterieur} y={0} width={exterieur} height={H} className={`schema-marges__marge${vise("exterieur")}`} />
      <rect x={L - interieur} y={0} width={2 * interieur} height={H} className={`schema-marges__marge${vise("interieur")}`} />
      {lignes(gauche)}
      {lignes(droite)}
      <line x1={L} y1={0} x2={L} y2={H} className="schema-marges__reliure" />
    </svg>
  );
}

/** Une page de début ou de fin : son nom, ce qu'elle porte, « Dans le livre » et « Modifier ». */
function LigneDePage({
  cle, pages, feuille, ouverte, onOuvrir, onPresente,
}: {
  cle: CleDePage;
  pages: PagesDuLivre;
  feuille: string[] | null;
  ouverte: boolean;
  onOuvrir: () => void;
  onPresente: (oui: boolean) => void;
}) {
  const page = pages[cle];
  const forme: FormePage = page.forme;
  const presente = cle === "titre" || cle === "feuille" ? true : (page as { presente: boolean }).presente;
  const resume =
    forme === "image"
      ? page.imageId ? "Image pleine page" : "Image pleine page, à choisir"
      : cle === "titre"
        ? "Toujours présente"
        : cle === "auteurs"
          ? `${nomsUtiles(pages.auteurs.noms).length ? `${nomsUtiles(pages.auteurs.noms).length} prénom${pluriel(nomsUtiles(pages.auteurs.noms).length)}` : "Aucun prénom"} · ${pages.auteurs.place === "debut" ? "au début" : "à la fin"}`
          : cle === "feuille"
            ? `${feuille?.length ?? 0} section${pluriel(feuille?.length ?? 0)}, dans le livre et en ligne`
            : cle === "commentLire"
              ? "Proposée par défaut"
              : texteSimple(pages.fin.texte).trim() ? "Un texte court" : "Facultative";
  // Une page des auteurs sans prénom attend : elle s'imprimerait vide
  const attend = presente && cle === "auteurs" && !nomsUtiles(pages.auteurs.noms).length;
  return (
    <li className={`page-du-livre${ouverte ? " est-ouverte" : ""}${presente ? "" : " est-absente"}`}>
      <span className="page-du-livre__vignette" aria-hidden="true">
        {forme === "image" && page.imageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir
          <img src={adresseImage(page.imageId)} alt="" />
        ) : (
          <span className={`page-du-livre__schema page-du-livre__schema--${cle}`}>
            <i />
            <i />
            <i />
          </span>
        )}
      </span>
      <span className="page-du-livre__texte">
        <b>{NOM_DE_PAGE[cle]}</b>
        <small className={attend ? "page-du-livre__attend" : undefined}>
          {attend ? <Icone nom="alerte" /> : null}
          {resume}
        </small>
      </span>
      {cle === "titre" || cle === "feuille" ? (
        <span className="page-du-livre__inter page-du-livre__inter--vide" aria-hidden="true" />
      ) : (
        <label className="inter page-du-livre__inter">
          <input type="checkbox" role="switch" checked={presente} onChange={(e) => onPresente(e.target.checked)} aria-label={`${NOM_DE_PAGE[cle]} dans le livre`} />
          <span className="inter__piste" aria-hidden="true" />
          <span aria-hidden="true">Dans le livre</span>
        </label>
      )}
      <button type="button" className="btn btn--petit" aria-expanded={ouverte} onClick={onOuvrir}>
        Modifier
      </button>
    </li>
  );
}

/** Le panneau d'une page : sa forme, puis son modèle ou son image (F11.4). */
function PanneauDePage({
  cle, projet, titre, pages, zone, feuille, prenoms, aDesEnigmes, regles, large = false, desImprimes, onChange, onFermer, doublePage,
}: {
  cle: CleDePage;
  projet: { id: string; aChoix: boolean; deClasse: boolean };
  titre: string;
  pages: PagesDuLivre;
  zone: { largeur: number; hauteur: number };
  feuille: string[] | null;
  prenoms: string[];
  aDesEnigmes: boolean;
  regles: string;
  /** Dans la grande fenêtre : l'écriture à gauche, la double page à droite */
  large?: boolean;
  desImprimes: boolean;
  onChange: (p: PagesDuLivre) => void;
  onFermer: () => void;
  /** La petite double page autour de cette page, qui suit la saisie */
  doublePage: ReactNode;
}) {
  const page = pages[cle];
  const changer = <K extends CleDePage>(k: K, valeurs: Partial<PagesDuLivre[K]>) => onChange({ ...pages, [k]: { ...pages[k], ...valeurs } });
  const tete = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = tete.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    // Sur un écran étroit, le panneau vient sous la liste : on le fait venir à l'écran
    if (!large && window.matchMedia("(max-width: 980px)").matches) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [large]);
  return (
    <section
      className={`cx cx--page${large ? " cx--large" : ""}`}
      aria-label={NOM_DE_PAGE[cle]}
      tabIndex={-1}
      ref={tete}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        onFermer();
      }}
    >
      <header className="cx__tete">
        <Icone nom="livre" />
        <h3>{NOM_DE_PAGE[cle]}</h3>
        {large ? (
          <button type="button" className="btn btn--petit" onClick={onFermer}>
            Fermer
          </button>
        ) : (
          <button type="button" className="btn btn--discret cx__fermer" onClick={onFermer} aria-label="Fermer le panneau">
            <Icone nom="fermer" />
          </button>
        )}
      </header>
      <div className="cx__corps">
        <div className="cx__double">{doublePage}</div>
        <div className="cx__reste">
          <fieldset className="cx-issues">
            <legend>Forme de la page</legend>
            <div className="cx-seg" role="radiogroup" aria-label="Forme de la page">
              {(["modele", "image"] as const).map((f) => (
                <label key={f}>
                  <input type="radio" name={`forme-${cle}`} checked={page.forme === f} onChange={() => changer(cle, { forme: f } as Partial<PagesDuLivre[typeof cle]>)} />
                  <span>{f === "modele" ? "Modèle" : "Image pleine page"}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {page.forme === "image" ? (
            <>
              <ChoisirImageDePage projetId={projet.id} choisie={page.imageId} onChoisir={(id) => changer(cle, { imageId: id } as Partial<PagesDuLivre[typeof cle]>)} />
              <p className="cx-aide page-dimension">
                Dimension utile : {Math.round(zone.largeur)} × {Math.round(zone.hauteur)} mm
                <Bulle question="Comment dessiner la page à la bonne taille ?">
                  <span>
                    À 300 points par pouce : {Math.round((zone.largeur / 25.4) * 300).toLocaleString("fr-FR")} × {Math.round((zone.hauteur / 25.4) * 300).toLocaleString("fr-FR")} points. Une page
                    dessinée bord à bord est réduite pour tenir dans les marges.
                  </span>
                </Bulle>
              </p>
              {cle === "feuille" && feuille ? (
                <p className="cx-aide">
                  En ligne, le lecteur garde la feuille de la préparation.
                  <Bulle question="L’image et la feuille en ligne doivent-elles s’accorder ?">
                    <span>Oui : dessinez les mêmes sections ({feuille.join(", ")}). L’application ne le vérifie pas.</span>
                  </Bulle>
                </p>
              ) : null}
            </>
          ) : cle === "titre" ? (
            <>
              <div className="champ page-champ--fixe">
                <span className="page-champ__tete">
                  Titre
                  <Bulle question="Où changer le titre ?">
                    <span>C’est le titre du projet : il se change par le menu ⋯ à droite de son nom, en haut de la page.</span>
                  </Bulle>
                </span>
                <b className="page-titre">{titre}</b>
              </div>
              <Champ libelle="Sous-titre" valeur={pages.titre.sousTitre} invite="Facultatif" onChange={(v) => changer("titre", { sousTitre: v })} />
              <Champ libelle={projet.deClasse ? "Ligne de la classe" : "Auteur"} valeur={pages.titre.ligne} onChange={(v) => changer("titre", { ligne: v })} />
              <Champ libelle="Année" valeur={pages.titre.annee} onChange={(v) => changer("titre", { annee: v })} />
              <div className="page-illustration">
                <p className="cx-titre">Illustration, facultative</p>
                <ChoisirImageDePage projetId={projet.id} choisie={pages.titre.illustration} onChoisir={(id) => changer("titre", { illustration: id })} retirable />
              </div>
            </>
          ) : cle === "auteurs" ? (
            <>
              <Champ libelle="Phrase d’introduction" valeur={pages.auteurs.introduction} onChange={(v) => changer("auteurs", { introduction: v })} />
              <label className="champ">
                <span>
                  Prénoms, un par ligne
                  <small className="page-champ__note"> · imprimés par ordre alphabétique, sur {colonnesDesNoms(pages.auteurs.noms.length)} colonne{pluriel(colonnesDesNoms(pages.auteurs.noms.length))}</small>
                </span>
                <textarea className="pchamp" rows={8} value={pages.auteurs.noms.join("\n")} onChange={(e) => changer("auteurs", { noms: e.target.value.split("\n") })} />
              </label>
              {projet.deClasse && prenoms.length && nomsTries(prenoms).join("|") !== nomsTries(pages.auteurs.noms).join("|") ? (
                <p className="cx-aide">
                  <button type="button" className="lien" onClick={() => changer("auteurs", { noms: [...prenoms] })}>
                    Reprendre les prénoms de la classe
                  </button>
                </p>
              ) : null}
              <Champ libelle="Dernière ligne" valeur={pages.auteurs.conclusion} invite="Facultative" onChange={(v) => changer("auteurs", { conclusion: v })} />
              <fieldset className="cx-issues">
                <legend>Place dans le livre</legend>
                <div className="cx-seg" role="radiogroup" aria-label="Place dans le livre">
                  {(["debut", "fin"] as const).map((pl) => (
                    <label key={pl}>
                      <input type="radio" name="place-auteurs" checked={pages.auteurs.place === pl} onChange={() => changer("auteurs", { place: pl })} />
                      <span>{pl === "debut" ? "Au début" : "À la fin"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          ) : cle === "commentLire" ? (
            <>
              <EditeurLeger libelle="Texte de « Comment lire ce livre »" valeur={pages.commentLire.texte} onChange={(t) => changer("commentLire", { texte: t })} />
              <label className="inter">
                <input
                  type="checkbox"
                  role="switch"
                  checked={pages.commentLire.enigmes ?? aDesEnigmes}
                  onChange={(e) => changer("commentLire", { enigmes: e.target.checked })}
                />
                <span className="inter__piste" aria-hidden="true" />
                <span>Expliquer les énigmes</span>
              </label>
              <ReglesDuJeu projetId={projet.id} depart={regles} desImprimes={desImprimes} />
            </>
          ) : cle === "feuille" ? (
            <p className="cx-aide">
              Ses sections ({feuille?.join(", ")}) se règlent dans la{" "}
              <Link className="lien" href={`/projet/${projet.id}/preparation`}>
                Préparation
              </Link>
              .
            </p>
          ) : (
            <EditeurLeger libelle="Texte de la page de fin" valeur={pages.fin.texte} invite="Un texte court" onChange={(t) => changer("fin", { texte: t })} />
          )}
        </div>
      </div>
    </section>
  );
}

/** Les prénoms qui s'impriment : les lignes vides ne comptent pas */
const nomsUtiles = (noms: string[]) => noms.filter((n) => n.trim());

function Champ({ libelle, valeur, invite, onChange }: { libelle: string; valeur: string; invite?: string; onChange: (v: string) => void }) {
  return (
    <label className="champ">
      <span>{libelle}</span>
      <input className="pchamp" value={valeur} placeholder={invite} maxLength={200} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** Choisir une image du projet, ou en importer une (F10) : la même fiche que dans la scène. */
function ChoisirImageDePage({ projetId, choisie, onChoisir, retirable }: { projetId: string; choisie: string | null; onChoisir: (id: string | null) => void; retirable?: boolean }) {
  const [images, setImages] = useState<string[] | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let actif = true;
    void listerImages(projetId).then((lues) => actif && setImages(lues));
    return () => {
      actif = false;
    };
  }, [projetId]);
  const importer = async (choisi: File | undefined) => {
    if (!choisi) return;
    setAttente(true);
    setErreur(null);
    const reduite = await reduire(choisi, true);
    const fait = reduite ? await deposer(projetId, reduite) : ({ ok: false, erreur: REFUS_IMPORT } as const);
    if (reduite) URL.revokeObjectURL(reduite.apercu);
    setAttente(false);
    if (fichier.current) fichier.current.value = "";
    if (!fait.ok) return setErreur(fait.erreur);
    setImages((avant) => [fait.id, ...(avant ?? [])]);
    onChoisir(fait.id);
  };
  return (
    <div className="cx-images">
      <p className="cx__cmd">
        <button type="button" className="btn btn--petit" disabled={attente} aria-busy={attente || undefined} onClick={() => fichier.current?.click()}>
          <Icone nom="importer" />
          {attente ? "Import en cours…" : "Importer une image"}
        </button>
        {retirable && choisie ? (
          <button type="button" className="lien" onClick={() => onChoisir(null)}>
            Retirer l’illustration
          </button>
        ) : null}
        <input ref={fichier} className="vh" type="file" tabIndex={-1} aria-label="Fichier de l’image" accept="image/jpeg,image/png,image/webp" onChange={(e) => void importer(e.target.files?.[0])} />
      </p>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      {images?.length ? (
        <ul className="cx-vignettes" aria-label="Images du projet">
          {images.map((id, i) => (
            <li key={id}>
              <button type="button" aria-pressed={choisie === id} onClick={() => onChoisir(id)} aria-label={`Image ${i + 1} du projet`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir */}
                <img src={adresseImage(id)} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      ) : images ? (
        <p className="cx-aide">Aucune image dans le projet pour l’instant.</p>
      ) : null}
    </div>
  );
}

/**
 * Les règles du jeu, sous « Comment lire ce livre » qu'elles suivent à l'impression : le même
 * texte que dans la Préparation, qui se corrige ici aussi, là où on le voit (décidé par le
 * porteur le 25 octobre 2026). Un paragraphe par ligne.
 */
function ReglesDuJeu({ projetId, depart, desImprimes }: { projetId: string; depart: string; desImprimes: boolean }) {
  const [texte, setTexte] = useState(depart);
  const e = useEnregistrement();
  return (
    <div className="champ page-regles">
      <span className="page-champ__tete">
        <label htmlFor="page-regles">Règles du jeu</label>
        <Bulle question="Où ces règles s’impriment-elles ?">
          <span>
            À la suite de ce texte{desImprimes ? ", avant la phrase des dés" : ""}. Ce sont les mêmes que dans la Préparation : les changer ici les change
            là-bas. Un paragraphe par ligne.
          </span>
        </Bulle>
      </span>
      <textarea
        id="page-regles"
        className="pchamp"
        rows={6}
        maxLength={6000}
        value={texte}
        placeholder="Comment noter, quand lancer le dé… Facultatives."
        onChange={(ev) => {
          setTexte(ev.target.value);
          e.prevoir(() => reglerJeu(projetId, { regles: ev.target.value }));
        }}
        onBlur={() => void e.partir()}
      />
      <small className="page-champ__note" role="status">
        {e.enCours ? "Enregistrement…" : e.erreur ? e.erreur : e.enregistre ? "Enregistré" : ""}
      </small>
    </div>
  );
}

/**
 * La grande fenêtre où s'écrit une page de texte du livre : modale, fermée par « Fermer » ou
 * Échap, jamais par un clic à côté, qui ferait perdre la place pendant qu'on écrit.
 */
function GrandeFenetre({ onFermer, children }: { onFermer: () => void; children: ReactNode }) {
  const fenetre = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = fenetre.current;
    if (el && !el.open) el.showModal();
  }, []);
  return (
    <dialog
      ref={fenetre}
      className="page-a-ecrire"
      onCancel={(ev) => {
        ev.preventDefault();
        onFermer();
      }}
    >
      {children}
    </dialog>
  );
}
