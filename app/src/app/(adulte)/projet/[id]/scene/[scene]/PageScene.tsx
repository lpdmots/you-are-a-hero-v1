"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bulle } from "@/composants/Bulle";
import { TexteLu } from "@/composants/copie/Blocs";
import { Copie, DROITS_ADULTE, type AutreTexte } from "@/composants/copie/Copie";
import type { Jeu, Livre, Services, Voisines } from "@/composants/copie/contexte";
import { deposer, reduire, REFUS_IMPORT } from "@/composants/importer";
import { listerImages } from "../../../actions-images";
import { enumerer, nomDeTexte } from "@/composants/copie/noms";
import { avantDePartir } from "@/composants/copie/sortie";
import type { EtatTexte } from "@/composants/copie/useEnregistrementTexte";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { TamponScene } from "@/composants/TamponScene";
import { useMessage } from "@/composants/Messages";
import { estVide } from "@/domaine/copie";
import { jourEnMots } from "@/domaine/dates";
import { chapitresDe, departDe, referenceScene, scenesDe, type ElevePlan, type Plan } from "@/domaine/recit";
import { de, majuscule } from "@/domaine/texte";
import type { CopieGardee, TexteDeScene } from "@/serveur/copie";
import { reglerScene, supprimer } from "../../../actions-recit";
import {
  ajouterFormuleDepuisLaScene, ajouterObjetDepuisLaScene, chercherDestinations, reglerVoisines, creerSceneDepuisChoix, fixerPourLiaison, garderDeNouveau, libererNumero, mettreDansLaScene, nePlusGarder, numeroDeLaScene,
  relireNumeros, relireTexte,
} from "../../../actions-texte";
import { useCommandesScene } from "../../_plan/commandes";
import { ChoisirDepart } from "../../_plan/Panneaux";
import { QuiSenOccupe } from "../../_plan/QuiSenOccupe";
import { varsCouleur } from "../../_plan/Plan";
import { FicheNumero } from "./FicheNumero";
import { VersionsPrecedentes } from "./VersionsPrecedentes";
import styles from "./scene.module.css";

/** Ce que la page vient de faire d'un texte gardé à part, dit au-dessus de la copie */
type Fait =
  | { sorte: "conflit"; copieId: string | null }
  | { sorte: "retire"; copie: CopieGardee }
  | { sorte: "echange"; phrase: string; ancienId: string | null };

const PAS_ENREGISTRE = "Vos dernières corrections ne sont pas encore enregistrées : réessayez dans un instant.";

/**
 * La page d'une scène, pour l'adulte : son titre, sa consigne (F07.1), ses repères de
 * départ et de fin (F03.2), et son texte, qui s'enregistre seul (F08.2). Un texte gardé à
 * part s'y lit dans son onglet, avec ses deux gestes (F08.1).
 */
export function PageScene({
  projet, plan, sceneId, eleves, texte: recu, livre, jeu, voisines, voisinesAffichees, ouvrir, venuDuSuivi, venuDesChemins,
}: {
  projet: { id: string; deClasse: boolean; aChoix: boolean }; plan: Plan; sceneId: string; eleves: ElevePlan[];
  texte: TexteDeScene;
  /** Le livre autour de la scène : numéros, scènes, façon d'annoncer un numéro */
  livre: Livre;
  jeu: Jeu;
  voisines: Voisines;
  voisinesAffichees: boolean;
  /** Le texte gardé à part à montrer en arrivant, depuis la ligne de rappel du Suivi */
  ouvrir?: string;
  venuDuSuivi?: boolean;
  /** Ouverte depuis la vue « Chemins » du chapitre : on y revient (F03.1) */
  venuDesChemins?: boolean;
}) {
  const routeur = useRouter();
  const dire = useMessage();
  const scene = scenesDe(plan).find((s) => s.id === sceneId)!;
  const chapitre = chapitresDe(plan).find((c) => c.id === scene.chapitreId)!;
  const depart = departDe(plan);
  const [titre, setTitre] = useState(scene.titre ?? "");
  const [consigne, setConsigne] = useState(scene.consigne);
  const [etat, setEtat] = useState<"" | "attente" | "enregistre" | "erreur">("");
  const [choixDepart, setChoixDepart] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ce qui attend d'être enregistré : le titre et la consigne partent ensemble, aucun ne chasse l'autre
  const enAttente = useRef<{ titre?: string; consigne?: string }>({});
  const retour = venuDuSuivi ? `/projet/${projet.id}/suivi` : `/projet/${projet.id}/chapitre/${chapitre.id}${venuDesChemins ? "?vue=chemins" : ""}`;
  const commandes = useCommandesScene({ projetId: projet.id, plan, eleves, onChoisirDepart: () => setChoixDepart(true), apresSuppression: () => routeur.push(retour) });

  // Le texte : la page le reçoit à l'ouverture, puis ne le remplace que par un geste (échange, conflit)
  const [copie, setCopie] = useState({ texte: recu.texte, version: recu.version, generation: 0 });
  const [copies, setCopies] = useState(recu.copies);
  const [onglet, setOnglet] = useState<string>(ouvrir && recu.copies.some((c) => c.id === ouvrir) ? ouvrir : "scene");
  const [vide, setVide] = useState(() => estVide(recu.texte));
  const [fait, setFait] = useState<Fait | null>(null);
  const [geste, setGeste] = useState(false);
  const [versions, setVersions] = useState(false);
  const [numero, setNumero] = useState(false);
  // Le panneau de droite : les réglages de la copie s'y ouvrent, à la place de la consigne
  const [panneau, setPanneau] = useState<HTMLElement | null>(null);
  const [reglages, setReglages] = useState(false);
  const montree = copies.find((c) => c.id === onglet) ?? null;
  const nom = (c: CopieGardee) => nomDeTexte(c, eleves, projet.deClasse);

  const envoyer = async () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    const valeurs = enAttente.current;
    enAttente.current = {};
    if (Object.keys(valeurs).length === 0) return;
    const reponse = await reglerScene(scene.id, valeurs);
    // Une frappe arrivée entre-temps garde « Enregistrement… » jusqu'à son propre envoi
    if (Object.keys(enAttente.current).length === 0) setEtat(reponse.ok ? "enregistre" : "erreur");
  };
  const enregistrer = (valeurs: { titre?: string; consigne?: string }) => {
    setEtat("attente");
    enAttente.current = { ...enAttente.current, ...valeurs };
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void envoyer(), 700);
  };
  // Quitter la page n'abandonne pas ce qui attendait
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
      if (Object.keys(enAttente.current).length) void reglerScene(scene.id, enAttente.current);
    },
    [scene.id],
  );

  // Ce que la copie demande au serveur : chercher une destination, créer une scène depuis un choix
  const services: Services = {
    chercher: (demande) => chercherDestinations(projet.id, demande),
    creerScene: (chapitreId, titreScene) => creerSceneDepuisChoix(chapitreId, titreScene),
    supprimerScene: async (id) => {
      const reponse = await supprimer("scene", id);
      return reponse.ok ? { ok: true } : { ok: false, erreur: reponse.erreur };
    },
    relireNumeros: async () => (await relireNumeros(projet.id)).numeros,
    numeroDe: (id) => numeroDeLaScene(id),
    fixerNumero: (id, n) => fixerPourLiaison(id, n),
    libererNumero: (id) => libererNumero(id),
    ajouterObjet: (nom, description) => ajouterObjetDepuisLaScene(projet.id, nom, description),
    ajouterFormule: (formule) => ajouterFormuleDepuisLaScene(projet.id, formule),
    // Une image posée dans une scène garde son fond transparent (F10-AC31)
    importerImage: async (fichier) => {
      const reduite = await reduire(fichier, true);
      if (!reduite) return { ok: false, erreur: REFUS_IMPORT };
      const depot = await deposer(projet.id, reduite);
      URL.revokeObjectURL(reduite.apercu);
      return depot;
    },
    imagesDuProjet: () => listerImages(projet.id),
    reglerVoisines: (affiche) => reglerVoisines(affiche),
  };

  const remplacer = (suite: TexteDeScene) => {
    setCopie((avant) => ({ texte: suite.texte, version: suite.version, generation: avant.generation + 1 }));
    setCopies(suite.copies);
    setVide(estVide(suite.texte));
  };

  // Le texte de l'adulte a été refusé : ses corrections sont gardées à part, la scène montre
  // de nouveau le texte à jour, où il peut écrire aussitôt (F08-AC21, AC29)
  const apresEtat = (suite: EtatTexte) => {
    if (suite.etat !== "garde" && suite.etat !== "refuse") return;
    void relireTexte(scene.id).then((lu) => {
      if (!lu.ok) return routeur.push(retour);
      const miennes = lu.scene.copies.filter((c) => c.sorte === "refus" && !c.eleveId);
      remplacer(lu.scene);
      setOnglet("scene");
      setFait(suite.etat === "garde" ? { sorte: "conflit", copieId: miennes[miennes.length - 1]?.id ?? null } : null);
    });
  };

  const retirer = async (c: CopieGardee) => {
    setGeste(true);
    const reponse = await nePlusGarder(c.id, scene.id);
    setGeste(false);
    if (!reponse.ok) return dire({ texte: reponse.erreur });
    setCopies((avant) => avant.filter((x) => x.id !== c.id));
    setOnglet("scene");
    setFait({ sorte: "retire", copie: c });
  };
  const annulerRetrait = async (c: CopieGardee) => {
    setGeste(true);
    const reponse = await garderDeNouveau(c.id, scene.id);
    setGeste(false);
    if (!reponse.ok) return dire({ texte: reponse.erreur });
    setCopies(reponse.scene.copies);
    setOnglet(c.id);
    setFait(null);
  };
  const mettre = async (c: CopieGardee) => {
    setGeste(true);
    // Ce que l'adulte vient de taper dans la scène s'enregistre d'abord : c'est ce texte qui sera gardé à part
    if (!(await avantDePartir())) {
      setGeste(false);
      return dire({ texte: PAS_ENREGISTRE });
    }
    const reponse = await mettreDansLaScene(c.id, scene.id);
    setGeste(false);
    if (!reponse.ok) return dire({ texte: reponse.erreur });
    const n = nom(c);
    remplacer(reponse.scene);
    setOnglet("scene");
    setFait({
      sorte: "echange",
      ancienId: reponse.ancien,
      phrase:
        c.sorte === "ancien"
          ? `L’ancien texte est de nouveau le texte de la scène.${reponse.ancien ? " Celui qu’il remplace est gardé à part." : ""}`
          : `${majuscule(n.enPhrase)} ${n.enPhrase === "vos corrections" ? "sont" : "est"} maintenant le texte de la scène.${
              reponse.ancien ? ` L’ancien est gardé à part${n.arrete ? `, et ${n.arrete} peut de nouveau écrire` : ""}.` : n.arrete ? ` ${n.arrete} peut de nouveau écrire.` : ""
            }`,
    });
  };

  const ref = referenceScene(scene.reference);
  // Ce qui est gardé à part, dit au-dessus de la copie, d'où qu'on vienne (F08-AC06)
  const aDire = copies.filter((c) => !(fait?.sorte === "conflit" && fait.copieId === c.id));
  const arretes = aDire.flatMap((c) => nom(c).arrete ?? []);
  const voir = (c: CopieGardee, libelle: string) =>
    onglet === c.id ? null : (
      <button type="button" className="lien" onClick={() => setOnglet(c.id)}>
        {libelle}
      </button>
    );

  const onglets =
    copies.length > 0 ? (
      <div className="copie__onglets" role="tablist" aria-label="Textes de la scène">
        <button type="button" role="tab" aria-selected={onglet === "scene"} onClick={() => setOnglet("scene")}>
          Texte de la scène
        </button>
        {copies.map((c) => {
          const n = nom(c);
          return (
            <button key={c.id} type="button" role="tab" className="ga-onglet" aria-selected={onglet === c.id} aria-label={`${n.titre}, ${n.sous}`} onClick={() => setOnglet(c.id)}>
              <Icone nom="apart" />
              <span className="ga-onglet__t">
                <b>{n.titre}</b>
                <small>{n.sous}</small>
              </span>
            </button>
          );
        })}
      </div>
    ) : (
      <span className="copie__titre">Texte de la scène</span>
    );

  const autre: AutreTexte | null = montree
    ? {
        barre: (
          <span className="copie__lecture">
            <Icone nom="oeil" />
            En lecture · {nom(montree).mention}
          </span>
        ),
        corps: <TexteLu texte={montree.texte} libelle={`${nom(montree).titre}, ${nom(montree).sous}`} livre={livre} />,
        pied: (
          <>
            <p className="ga-pied">
              Que faire de ce texte ?
              <Bulle question="Que font ces deux commandes ?">
                <span>« Ne plus garder ce texte » l’efface : le texte de la scène ne change pas.</span>
                <span>« Mettre ce texte dans la scène » échange les deux : le texte de la scène est gardé à part à son tour.</span>
                <span>Vous pouvez aussi copier un passage ici et le coller dans la scène.</span>
              </Bulle>
            </p>
            <div className="ga-cmd">
              <button type="button" className="btn btn--danger" disabled={geste} onClick={() => void retirer(montree)}>
                Ne plus garder ce texte
              </button>
              <button type="button" className="btn" disabled={geste} onClick={() => void mettre(montree)}>
                Mettre ce texte dans la scène
              </button>
            </div>
          </>
        ),
      }
    : null;

  return (
    <div className="sur-chapitre" style={varsCouleur(chapitre.couleur)}>
      <nav className="fil" aria-label="Fil d’Ariane">
        <Link href={retour}>
          <Icone nom="fleche-g" />
          {venuDuSuivi ? "Retour au Suivi" : `Retour à ${chapitre.titre}`}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{ref}</span>
      </nav>

      <header className={styles.tete}>
        <span className="fiche__ref">{ref}</span>
        <h1>
          <label className="vh" htmlFor="scene-titre">
            Titre de la scène
          </label>
          <input
            id="scene-titre"
            className={styles.titre}
            type="text"
            value={titre}
            maxLength={120}
            placeholder="Titre de la scène"
            onChange={(e) => {
              setTitre(e.target.value);
              enregistrer({ titre: e.target.value });
            }}
            onBlur={() => void envoyer()}
          />
        </h1>
        <TamponScene vide={vide} />
        <Menu libelle={`Autres commandes de la scène ${ref}`} discret>
          {(fermer) => (
            <>
              {projet.aChoix ? (
                <>
                  <button type="button" onClick={() => { fermer(); if (depart?.id === scene.id) commandes.retirerDepart(); else commandes.designer(scene); }}>
                    {depart?.id === scene.id ? "Retirer le départ du livre" : "Départ du livre"}
                  </button>
                  <button type="button" onClick={() => { fermer(); commandes.basculerFin(scene); }}>
                    {scene.fin ? "Retirer le repère de fin" : "Fin de l’histoire"}
                  </button>
                  {/* Le départ porte toujours le n° 1 : il ne se fixe pas (F11-AC97) */}
                  {depart?.id === scene.id ? null : scene.numeroFixe ? (
                    <button
                      type="button"
                      onClick={() => {
                        fermer();
                        void libererNumero(scene.id).then((fait) =>
                          dire({ texte: fait.ok ? `${ref} n’a plus de numéro fixé : le passage prend place à la suite des autres.` : fait.erreur }),
                        );
                      }}
                    >
                      Libérer le numéro
                    </button>
                  ) : (
                    <button type="button" onClick={() => { fermer(); setNumero(true); }}>
                      Fixer son numéro…
                    </button>
                  )}
                  <hr />
                </>
              ) : null}
              <button type="button" onClick={() => { fermer(); setVersions(true); }}>
                Versions précédentes
              </button>
              <button type="button" onClick={() => { fermer(); commandes.basculerHorsLivre(scene); }}>
                {scene.horsLivre ? "Réintégrer dans le livre" : "Exclure du livre"}
              </button>
              <button type="button" onClick={() => { fermer(); commandes.supprimerScene(scene); }}>
                Supprimer
              </button>
            </>
          )}
        </Menu>
      </header>
      <div className={styles.reperes}>
        {projet.deClasse ? <QuiSenOccupe scene={scene} chapitre={chapitre} eleves={eleves} /> : null}
        {depart?.id === scene.id ? (
          <span className="repere repere--depart">
            <Icone nom="drapeau" />
            Départ du livre
          </span>
        ) : null}
        {scene.fin ? (
          <span className="repere repere--fin">
            <Icone nom="fin" />
            Fin de l’histoire
          </span>
        ) : null}
        {scene.horsLivre ? <span className="repere">hors du livre</span> : null}
        {projet.aChoix && scene.numeroFixe ? (
          <span className="repere">
            <Icone nom="cadenas" />
            n° {scene.numeroFixe} fixé
          </span>
        ) : null}
        <span className={styles.etat} role="status">
          {etat === "attente" ? "Enregistrement…" : etat === "enregistre" ? "Enregistré" : etat === "erreur" ? "Cela n’a pas pu être enregistré." : ""}
        </span>
      </div>

      <div className={styles.colonnes}>
        <section className={styles.texte} aria-label="Texte de la scène">
          {fait?.sorte === "conflit" ? (
            <div className="note note--attend" role="status">
              <Icone nom="apart" />
              <p>
                {projet.deClasse
                  ? "Quelqu’un a modifié cette scène pendant que vous la corrigiez. Vos corrections sont gardées à part ; la scène montre le texte à jour. "
                  : "Vous avez modifié cette scène dans une autre fenêtre. Ce que vous veniez d’écrire ici est gardé à part ; la scène montre le texte à jour. "}
                {copies
                  .filter((c) => c.id === fait.copieId)
                  .map((c) => (
                    <span key={c.id}>{voir(c, projet.deClasse ? "Voir vos corrections" : "Voir ce texte")}</span>
                  ))}
              </p>
            </div>
          ) : null}
          {fait?.sorte === "retire" ? (
            <div className="note note--ok" role="status">
              <Icone nom="coche" />
              <p>
                {majuscule(nom(fait.copie).enPhrase)} {nom(fait.copie).enPhrase === "vos corrections" ? "ne sont plus gardées" : "n’est plus gardé"}
                {nom(fait.copie).arrete ? ` : ${nom(fait.copie).arrete} peut de nouveau écrire dans cette scène.` : "."}
              </p>
              <span className="note__cmd">
                <button type="button" className="btn btn--petit" disabled={geste} onClick={() => void annulerRetrait(fait.copie)}>
                  Annuler
                </button>
                <small className="ga-tant">tant que vous restez sur cette page</small>
              </span>
            </div>
          ) : null}
          {fait?.sorte === "echange" ? (
            <div className="note note--ok" role="status">
              <Icone nom="coche" />
              <p>
                {fait.phrase}{" "}
                {copies
                  .filter((c) => c.id === fait.ancienId)
                  .map((c) => (
                    <span key={c.id}>{voir(c, "Voir l’ancien texte")}</span>
                  ))}
              </p>
            </div>
          ) : null}
          {aDire.length === 1 ? (
            <div className="note note--attend">
              <Icone nom="apart" />
              <p>
                {aDire[0].sorte === "ancien"
                  ? "L’ancien texte de la scène est gardé à part. "
                  : nom(aDire[0]).arrete
                    ? `Un texte ${de(nom(aDire[0]).arrete!)} est gardé à part : tant qu’il attend, ${nom(aDire[0]).arrete} ne peut pas écrire dans cette scène. `
                    : aDire[0].eleveId
                      ? "Le texte d’un élève est gardé à part. "
                      : projet.deClasse
                        ? `Vos corrections du ${jourEnMots(aDire[0].gardeLe)} sont gardées à part. `
                        : `Votre texte du ${jourEnMots(aDire[0].gardeLe)} est gardé à part. `}
                {voir(aDire[0], !aDire[0].eleveId && aDire[0].sorte === "refus" && projet.deClasse ? "Voir vos corrections" : "Voir ce texte")}
              </p>
            </div>
          ) : aDire.length > 1 ? (
            <div className="note note--attend">
              <Icone nom="apart" />
              <p>
                {aDire.length} textes sont gardés à part
                {arretes.length ? ` : tant qu’ils attendent, ${enumerer(arretes)} ne ${arretes.length > 1 ? "peuvent" : "peut"} pas écrire dans cette scène. ` : ". "}
                {aDire.map((c) => (
                  <span key={c.id}>{voir(c, nom(c).titre)} </span>
                ))}
              </p>
            </div>
          ) : null}
          <Copie
            key={copie.generation}
            texte={copie.texte}
            version={copie.version}
            cible={{ scene: scene.id }}
            livre={livre}
            droits={DROITS_ADULTE}
            lieu={{ projetId: projet.id, sceneId: scene.id, chapitreId: chapitre.id }}
            services={services}
            protection={projet.deClasse}
            jeu={jeu}
            voisines={voisines}
            voisinesAffichees={voisinesAffichees}
            lienDeScene={(id) => `/projet/${projet.id}/scene/${id}`}
            panneau={panneau}
            onPanneau={setReglages}
            marques
            libelle={`Texte de la scène ${ref}`}
            tete={onglets}
            autre={autre}
            onEtat={apresEtat}
            onVide={setVide}
            apresRetour={() => dire({ texte: "Vos corrections sont enregistrées." })}
            dessus={({ etat: e, reessayer }) =>
              e.etat === "echec" ? (
                <div className="note note--bloque" role="alert">
                  <Icone nom="alerte" />
                  <p>Vos dernières corrections ne sont pas encore enregistrées. Nouvel essai dans 10 s : gardez cette page ouverte.</p>
                  <span className="note__cmd">
                    <button type="button" className="btn btn--petit" onClick={reessayer}>
                      Réessayer maintenant
                    </button>
                  </span>
                </div>
              ) : null
            }
            pied={({ etat: e }) =>
              e.etat === "enregistre" ? (
                <p className="sauv" role="status">
                  <Icone nom="coche" />
                  Enregistré
                </p>
              ) : (
                <p className={`sauv ${e.etat === "echec" ? "sauv--echec" : "sauv--attente"}`} role="status">
                  Pas encore enregistré
                </p>
              )
            }
          />
        </section>
        <aside className="cote-copie">
          <div className="cote-copie__colle">
            {numero ? (
              <FicheNumero
                sceneId={scene.id}
                nom={ref}
                onFermer={() => setNumero(false)}
                onFixe={(n) => {
                  setNumero(false);
                  dire({ texte: `${ref} garde le n° ${n}.` });
                }}
              />
            ) : null}
            <div ref={setPanneau} />
            <section className="carnet-fiche" aria-labelledby="scene-consigne-t" hidden={reglages || numero}>
              <header>
                <h2 id="scene-consigne-t">
                  <label htmlFor="scene-consigne">Consigne</label> <span className="facultatif">facultative</span>
                </h2>
              </header>
              <div className="carnet-fiche__corps">
                <textarea
                  id="scene-consigne"
                  className="pchamp"
                  rows={7}
                  maxLength={4000}
                  value={consigne}
                  placeholder="Ce que la scène doit raconter."
                  onChange={(e) => {
                    setConsigne(e.target.value);
                    enregistrer({ consigne: e.target.value });
                  }}
                  onBlur={() => void envoyer()}
                />
                <p className={styles.aide}>
                  {projet.deClasse
                    ? "Les élèves du chapitre la lisent en ouvrant la scène. Sans consigne écrite, ils suivent celle que vous leur avez donnée."
                    : "Un rappel de ce que la scène doit raconter."}
                </p>
              </div>
            </section>
          </div>
        </aside>
      </div>

      {versions ? (
        <VersionsPrecedentes
          sceneId={scene.id}
          eleves={eleves}
          deClasse={projet.deClasse}
          livre={livre}
          onFermer={() => setVersions(false)}
          onRemis={(suite) => {
            remplacer(suite);
            setOnglet("scene");
            setFait(null);
            setVersions(false);
            dire({ texte: "Ce texte est maintenant le texte de la scène. Celui qu’il remplace est dans les versions précédentes." });
          }}
        />
      ) : null}
      {choixDepart ? (
        <ChoisirDepart
          plan={plan}
          onChoisir={(id) => {
            const autreScene = scenesDe(plan).find((x) => x.id === id);
            setChoixDepart(false);
            if (autreScene) commandes.designer(autreScene);
          }}
          onFermer={() => setChoixDepart(false)}
        />
      ) : null}
      {commandes.dialogue}
    </div>
  );
}
