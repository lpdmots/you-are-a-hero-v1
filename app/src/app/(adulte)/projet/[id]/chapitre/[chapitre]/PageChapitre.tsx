"use client";

import { closestCenter, DndContext, DragOverlay, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { Dialogue } from "@/composants/Dialogue";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { annonces, CONSIGNES_CLAVIER, Prise, useCapteurs } from "@/composants/Tirer";
import { nomPourEleves } from "@/domaine/eleves";
import { chapitresDe, compteScenes, departDe, ecritParLEnseignant, referenceScene, type ElevePlan, type Plan, type Scene } from "@/domaine/recit";
import { cle, pluriel } from "@/domaine/texte";
import { choisirRepere, creerScene, exclureDuLivre, placerScene, restaurer, supprimer } from "../../../actions-recit";
import { useCommandesScene } from "../../_plan/commandes";
import { AttribuerEleves, ChoisirDepart, ReglagesChapitre } from "../../_plan/Panneaux";
import { QuiSenOccupe } from "../../_plan/QuiSenOccupe";
import { varsCouleur, type ProjetDuPlan } from "../../_plan/Plan";

type Ouvert = "reglages" | "image" | "attribuer" | "exclure" | "depart" | null;

/**
 * La page d'un chapitre (F03.1) : quelles scènes existent, dans quel ordre. Le chapitre
 * est le plan, le Suivi est le travail : ni filtres d'état ni sélection ici.
 */
export function PageChapitre({ projet, plan, chapitreId, eleves }: { projet: ProjetDuPlan; plan: Plan; chapitreId: string; eleves: ElevePlan[] }) {
  const dire = useMessage();
  const routeur = useRouter();
  const capteurs = useCapteurs();
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [attente, setAttente] = useState<string | null>(null);
  const [demande, setDemande] = useState("");
  const [montree, setMontree] = useState<string | null>(null);
  const [local, setLocal] = useState<{ base: Plan; scenes: Scene[] } | null>(null);
  const [tiree, setTiree] = useState<string | null>(null);
  const commandes = useCommandesScene({ projetId: projet.id, plan, onChoisirDepart: () => setOuvert("depart") });

  const chapitre = chapitresDe(plan).find((c) => c.id === chapitreId)!;
  const partie = plan.parties.find((p) => p.id === chapitre.partieId)!;
  const scenes = local?.base === plan ? local.scenes : chapitre.scenes;
  const depart = departDe(plan);
  const attribues = chapitre.attributions.flatMap((a) => {
    const eleve = eleves.find((e) => e.id === a.eleveId);
    return eleve ? [{ eleve, profil: a.profil }] : [];
  });
  const seul = partie.chapitres.length === 1;
  const filtre = cle(demande);
  const montrees = filtre ? scenes.filter((s) => cle(`${referenceScene(s.reference)} ${s.titre ?? ""}`).includes(filtre)) : scenes;

  const ajouter = async () => {
    setAttente("scene");
    const fait = await creerScene(chapitre.id);
    setAttente(null);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setDemande("");
    setMontree(fait.id);
    dire({ texte: `${referenceScene(fait.reference)} est ajoutée à la fin du chapitre. Ouvrez-la pour lui donner un titre.` });
  };

  const supprimerChapitre = async () => {
    const emporteLeDepart = depart?.chapitreId === chapitre.id;
    const fait = await supprimer("chapitre", chapitre.id);
    if (!fait.ok) return dire({ texte: fait.erreur });
    routeur.push(`/projet/${projet.id}/plan`);
    dire({
      texte: emporteLeDepart
        ? `« ${chapitre.titre} » est supprimé. Le livre n’aura plus de départ.`
        : `« ${chapitre.titre} » est supprimé. Vous le retrouvez dans la corbeille du projet.`,
      annuler: () => void restaurer("chapitre", chapitre.id),
    });
  };

  const exclure = async () => {
    setAttente("exclure");
    const fait = await exclureDuLivre("chapitre", chapitre.id, true);
    setAttente(null);
    setOuvert(null);
    dire(fait.ok ? { texte: `« ${chapitre.titre} » est hors du livre.`, annuler: () => void exclureDuLivre("chapitre", chapitre.id, false) } : { texte: fait.erreur });
  };
  const reintegrer = async () => {
    const fait = await exclureDuLivre("chapitre", chapitre.id, false);
    dire({ texte: fait.ok ? `« ${chapitre.titre} » est de nouveau dans le livre.` : fait.erreur });
  };

  const choisirImage = async (choix: ChoixImage): Promise<string | null> => {
    if ("locale" in choix) return "Cette image n’a pas pu être importée.";
    const fait = await choisirRepere("chapitre", chapitre.id, choix);
    return fait.ok ? null : fait.erreur;
  };

  // Glisser-déposer des scènes dans leur chapitre (F03-AC23)
  const finDeplacement = ({ active, over }: DragEndEvent) => {
    setTiree(null);
    const de = chapitre.scenes.findIndex((s) => s.id === active.id);
    const vers = over ? chapitre.scenes.findIndex((s) => s.id === over.id) : -1;
    if (de < 0 || vers < 0 || de === vers) return setLocal(null);
    const suite = arrayMove(chapitre.scenes, de, vers);
    setLocal({ base: plan, scenes: suite });
    const scene = chapitre.scenes[de];
    void placerScene(scene.id, vers).then((fait) => {
      if (!fait.ok) {
        setLocal(null);
        return dire({ texte: fait.erreur });
      }
      const apres = suite[vers + 1];
      dire({
        texte: apres
          ? `${referenceScene(scene.reference)} est placée avant ${referenceScene(apres.reference)}.`
          : `${referenceScene(scene.reference)} est placée à la fin du chapitre.`,
        annuler: () => void placerScene(scene.id, de),
      });
    });
  };

  const sceneTiree = tiree ? scenes.find((s) => s.id === tiree) : undefined;
  const menuScene = (s: Scene) => (
    <Menu libelle={`Autres commandes de la scène ${referenceScene(s.reference)}`} discret>
      {(fermer) => (
        <>
          {projet.aChoix ? (
            <>
              <button type="button" onClick={() => { fermer(); if (depart?.id === s.id) commandes.retirerDepart(); else commandes.designer(s); }}>
                {depart?.id === s.id ? "Retirer le départ du livre" : "Départ du livre"}
              </button>
              <button type="button" onClick={() => { fermer(); commandes.basculerFin(s); }}>
                {s.fin ? "Retirer le repère de fin" : "Fin de l’histoire"}
              </button>
              <hr />
            </>
          ) : null}
          <button type="button" onClick={() => { fermer(); commandes.basculerHorsLivre(s); }}>
            {s.horsLivre ? "Réintégrer dans le livre" : "Exclure du livre"}
          </button>
          <button type="button" onClick={() => { fermer(); commandes.supprimerScene(s); }}>
            Supprimer
          </button>
        </>
      )}
    </Menu>
  );

  return (
    <div className="sur-chapitre" style={varsCouleur(chapitre.couleur)}>
      <nav className="fil" aria-label="Fil d’Ariane">
        <Link href={`/projet/${projet.id}/plan`}>
          <Icone nom="fleche-g" />
          Parties et chapitres
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{chapitre.titre}</span>
      </nav>

      <header className="chap-bandeau">
        <div className="chap-bandeau__image">
          <ImageRepere repere={chapitre} graine={chapitre.id} prioritaire />
        </div>
        <div>
          <h1>{chapitre.titre}</h1>
          <p className="chap-meta">
            {partie.titre} · {compteScenes(chapitre.scenes.length).toLocaleLowerCase("fr")}
            {chapitre.horsLivre ? " · hors du livre" : ""}
          </p>
          {attribues.length ? (
            <ul className="chap-eleves" aria-label="Élèves du chapitre">
              {attribues.map(({ eleve }) => (
                <li key={eleve.id}>
                  <Gommette prenom={eleve.prenom} couleur={eleve.couleur} taille="s" />
                  {nomPourEleves(eleve, eleves)}
                </li>
              ))}
            </ul>
          ) : projet.deClasse ? (
            <p className="chap-meta">{ecritParLEnseignant(chapitre) ? "Vous écrivez ce chapitre vous-même." : "Aucun élève n’écrit encore dans ce chapitre."}</p>
          ) : null}
        </div>
        <div className="chap-actions">
          <Menu libelle={`Autres commandes du chapitre ${chapitre.titre}`}>
            {(fermer) => (
              <>
                <button type="button" onClick={() => { fermer(); setOuvert("reglages"); }}>
                  Réglages
                </button>
                <button type="button" onClick={() => { fermer(); if (chapitre.horsLivre) void reintegrer(); else setOuvert("exclure"); }}>
                  {chapitre.horsLivre ? "Réintégrer dans le livre" : "Exclure du livre"}
                </button>
                <hr />
                <button type="button" disabled={seul} onClick={() => { fermer(); void supprimerChapitre(); }}>
                  Supprimer
                </button>
                {seul ? <p className="menu__note">C’est le seul chapitre de sa partie : supprimez la partie.</p> : null}
              </>
            )}
          </Menu>
          {chapitre.scenes.length ? (
            <button type="button" className="btn btn--primaire" disabled={attente === "scene"} aria-busy={attente === "scene" || undefined} onClick={() => void ajouter()}>
              <Icone nom="plus" />
              Ajouter une scène
            </button>
          ) : null}
          {projet.deClasse ? (
            <button type="button" className="btn" onClick={() => setOuvert("attribuer")}>
              <Icone nom="eleves" />
              Attribuer des élèves
            </button>
          ) : null}
        </div>
      </header>

      {chapitre.scenes.length === 0 ? (
        <div className="vide-chap">
          <p>Ce chapitre n’a pas encore de scène. Ajoutez une première scène.</p>
          <button type="button" className="btn btn--primaire" disabled={attente === "scene"} aria-busy={attente === "scene" || undefined} onClick={() => void ajouter()}>
            <Icone nom="plus" />
            Ajouter une scène
          </button>
        </div>
      ) : (
        <>
          <div className="chap-outils">
            <p>
              {projet.aChoix
                ? "L’ordre des cartes range le chapitre : ce sont les choix qui relient les scènes."
                : "Les scènes se lisent dans cet ordre."}
            </p>
            {chapitre.scenes.length > 3 ? (
              <label className="recherche" style={{ marginLeft: "auto" }}>
                <span className="vh">Rechercher une scène dans ce chapitre</span>
                <Icone nom="loupe" />
                <input type="search" placeholder="Rechercher dans ce chapitre" value={demande} onChange={(e) => setDemande(e.target.value)} />
              </label>
            ) : null}
          </div>
          {montrees.length === 0 ? (
            <p className="aucun" aria-live="polite">
              Aucun titre de scène ne contient « {demande.trim()} » dans ce chapitre.{" "}
              <button type="button" className="lien" onClick={() => setDemande("")}>
                Effacer la recherche
              </button>
            </p>
          ) : (
            <DndContext
              id="chapitre"
              sensors={capteurs}
              collisionDetection={closestCenter}
              accessibility={{
                announcements: annonces((id) => {
                  const s = scenes.find((x) => x.id === id);
                  return s ? referenceScene(s.reference) : "la scène";
                }),
                screenReaderInstructions: CONSIGNES_CLAVIER,
              }}
              onDragStart={({ active }) => setTiree(String(active.id))}
              onDragEnd={finDeplacement}
              onDragCancel={() => setTiree(null)}
            >
              <SortableContext items={montrees.map((s) => s.id)} strategy={rectSortingStrategy} disabled={!!filtre}>
                <ul className="fiches">
                  {montrees.map((s) => (
                    <FicheTiree key={s.id} id={s.id} fixe={!!filtre || scenes.length < 2} nom={referenceScene(s.reference)}>
                      {(prise) => (
                        <FicheScene
                          scene={s}
                          depart={depart?.id === s.id}
                          montree={montree === s.id}
                          lien={`/projet/${projet.id}/scene/${s.id}`}
                          prise={prise}
                          menu={menuScene(s)}
                          qui={projet.deClasse ? <QuiSenOccupe scene={s} chapitre={chapitre} eleves={eleves} /> : null}
                        />
                      )}
                    </FicheTiree>
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay>
                {sceneTiree ? (
                  <div className="tiree">
                    <FicheScene scene={sceneTiree} depart={depart?.id === sceneTiree.id} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      {ouvert === "reglages" ? (
        <ReglagesChapitre chapitre={chapitre} neuf={false} lisibleParLesEleves={projet.deClasse} onImage={() => setOuvert("image")} onFermer={() => setOuvert(null)} />
      ) : null}
      {ouvert === "image" ? (
        <ChoisirImage projetId={projet.id} actuel={chapitre} pour={`de « ${chapitre.titre} »`} onChoisir={choisirImage} onFermer={() => setOuvert("reglages")} />
      ) : null}
      {ouvert === "attribuer" ? <AttribuerEleves chapitre={chapitre} plan={plan} eleves={eleves} classe={projet.classe} onFermer={() => setOuvert(null)} /> : null}
      {ouvert === "depart" ? (
        <ChoisirDepart
          plan={plan}
          onChoisir={(id) => {
            const scene = chapitresDe(plan).flatMap((c) => c.scenes).find((x) => x.id === id);
            setOuvert(null);
            if (scene) commandes.designer(scene);
          }}
          onFermer={() => setOuvert(null)}
        />
      ) : null}
      {ouvert === "exclure" ? (
        <Dialogue
          titre={`Exclure « ${chapitre.titre} » du livre ?`}
          onFermer={() => setOuvert(null)}
          boutons={
            <button type="button" className="btn btn--primaire" disabled={attente === "exclure"} aria-busy={attente === "exclure" || undefined} onClick={() => void exclure()}>
              Exclure du livre
            </button>
          }
        >
          <ul className="dialogue__faits">
            <li>
              Ses {chapitre.scenes.length} scène{pluriel(chapitre.scenes.length)} {chapitre.scenes.length > 1 ? "seront" : "sera"} hors du livre. Elles restent dans le projet.
            </li>
            {projet.deClasse ? <li>Les élèves continuent d’y écrire.</li> : null}
            <li>Vous le remettez dans le livre depuis ce même menu.</li>
          </ul>
        </Dialogue>
      ) : null}
      {commandes.dialogue}
    </div>
  );
}

function FicheTiree({ id, fixe, nom, children }: { id: string; fixe: boolean; nom: string; children: (prise: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: fixe });
  return (
    <li ref={setNodeRef} className={isDragging ? "est-tiree" : undefined} style={{ transform: CSS.Translate.toString(transform), transition }} {...(fixe ? {} : listeners)}>
      {children(fixe ? null : <Prise nom={nom} ref={setActivatorNodeRef} {...attributes} />)}
    </li>
  );
}

/** La fiche d'une scène dans son chapitre : référence, repères, titre, « Ouvrir ». */
export function FicheScene({
  scene, depart, montree, lien, prise, menu, qui,
}: {
  scene: Scene; depart: boolean; montree?: boolean; lien?: string; prise?: ReactNode; menu?: ReactNode;
  /** « Qui s'en occupe », en projet de classe */
  qui?: ReactNode;
}) {
  const ref = referenceScene(scene.reference);
  return (
    <article className={`fiche${lien ? " fiche--ouvrable" : ""}${prise ? " se-tire" : ""}${montree ? " est-montree" : ""}`}>
      {lien ? <Link className="fiche__cible" href={lien} aria-label={`Ouvrir ${ref}${scene.titre ? ` — ${scene.titre}` : ""}`} draggable={false} /> : null}
      <div className="fiche__tete">
        {prise}
        <span className="fiche__ref">{ref}</span>
        <span className="tampon" data-e="vide">
          <Icone nom="vide" />
          Texte vide
        </span>
        {menu}
      </div>
      <p className={`fiche__titre${scene.titre ? "" : " fiche__titre--vide"}`}>{scene.titre ?? "sans titre"}</p>
      <p className="fiche__meta">
        {depart ? (
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
        {scene.consigne ? null : <span className="sans-consigne">sans consigne</span>}
      </p>
      {lien ? (
        <div className="fiche__pied">
          {qui ?? <span />}
          <span className="fiche__ouvrir" aria-hidden="true">
            Ouvrir
            <Icone nom="fleche" />
          </span>
        </div>
      ) : null}
    </article>
  );
}
