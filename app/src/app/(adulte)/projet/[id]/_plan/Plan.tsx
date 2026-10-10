"use client";

import {
  closestCenter, DndContext, DragOverlay, pointerWithin, useDroppable, type CollisionDetection, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { Dialogue } from "@/composants/Dialogue";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { annonces, CONSIGNES_CLAVIER, Prise, useCapteurs } from "@/composants/Tirer";
import {
  aCompleter, chercherScenes, compteScenes, couleurDeChapitre, departDe, ecritParLEnseignant, libelleManque, referenceScene, sansEleve, scenesDe,
  type Chapitre, type ElevePlan, type Manque, type Partie, type Plan as PlanDuRecit, type Supprime,
} from "@/domaine/recit";
import { pluriel } from "@/domaine/texte";
import {
  choisirRepere, creerChapitre, creerPartie, designerDepart, exclureDuLivre, placerChapitre, placerPartie, restaurer, supprimer,
} from "../../actions-recit";
import { AidePlan } from "./AidePlan";
import { AttribuerEleves, ChoisirDepart, Corbeille, ReglagesChapitre, ReglagesPartie } from "./Panneaux";
import { libelleQui } from "./QuiSenOccupe";

export type ProjetDuPlan = {
  id: string; titre: string; deClasse: boolean; aChoix: boolean; classe: { id: string; nom: string } | null;
};

type Ouvert =
  | { sorte: "chapitre"; id: string; neuf: boolean }
  | { sorte: "partie"; id: string; neuf: boolean }
  | { sorte: "image"; pour: "chapitre" | "partie"; id: string; neuf: boolean }
  | { sorte: "attribuer"; id: string }
  | { sorte: "exclure"; id: string }
  | { sorte: "corbeille" }
  | { sorte: "depart" }
  | null;

export const varsCouleur = (rang: number): CSSProperties => {
  const c = couleurDeChapitre(rang);
  return { "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties;
};

const cleDe = (id: string | number): string => String(id).slice(2);
const sorteDe = (id: string | number): string => String(id)[0];

/** Un chapitre se pose sur une carte, ou dans la partie qui les contient ; une partie, sur une partie. */
const collision: CollisionDetection = (args) => {
  const partie = sorteDe(args.active.id) === "p";
  const parmi = (sortes: string[]) => args.droppableContainers.filter((c) => sortes.includes(sorteDe(c.id)));
  if (partie) return closestCenter({ ...args, droppableContainers: parmi(["p"]) });
  const cartes = pointerWithin({ ...args, droppableContainers: parmi(["c"]) });
  if (cartes.length) return cartes;
  const zones = pointerWithin({ ...args, droppableContainers: parmi(["z"]) });
  if (zones.length) return zones;
  return closestCenter({ ...args, droppableContainers: parmi(["c"]) });
};

/** « Parties et chapitres » : le plan de l'histoire (F03.1). Le chapitre est le plan, le Suivi est le travail. */
export function Plan({
  projet, plan, eleves, aideMasquee, aideVue,
}: {
  projet: ProjetDuPlan; plan: PlanDuRecit; eleves: ElevePlan[]; aideMasquee: boolean; aideVue: boolean;
}) {
  const dire = useMessage();
  const capteurs = useCapteurs();
  const [aide, setAide] = useState(!aideMasquee && !aideVue);
  const [vue, setVue] = useState(aideVue);
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [demande, setDemande] = useState("");
  const [montree, setMontree] = useState<string | null>(null);
  const [attente, setAttente] = useState<string | null>(null);
  // L'ordre montré pendant et juste après un déplacement, jusqu'à ce que le plan enregistré revienne
  const [local, setLocal] = useState<{ base: PlanDuRecit; parties: Partie[] } | null>(null);
  const [tire, setTire] = useState<string | null>(null);
  const seulRefuse = useRef<string | null>(null);

  const parties = local?.base === plan ? local.parties : plan.parties;
  const chapitres = parties.flatMap((p) => p.chapitres);
  const eleveDe = new Map(eleves.map((e) => [e.id, e]));
  const depart = departDe(plan);
  const manques = aCompleter(plan, { deClasse: projet.deClasse, aChoix: projet.aChoix, eleves });
  const nbScenes = scenesDe(plan).length;

  if (aide) {
    return (
      <AidePlan
        deClasse={projet.deClasse}
        aChoix={projet.aChoix}
        dejaVue={vue}
        masquee={aideMasquee}
        onCommencer={() => {
          setVue(true);
          setAide(false);
        }}
      />
    );
  }

  const nomDe = (id: string | number): string => {
    const cle = cleDe(id);
    if (sorteDe(id) === "p" || sorteDe(id) === "z") return `la partie ${parties.find((p) => p.id === cle)?.titre ?? ""}`;
    return `le chapitre ${chapitres.find((c) => c.id === cle)?.titre ?? ""}`;
  };

  const lancer = async (cle: string, suite: () => Promise<void>) => {
    setAttente(cle);
    try {
      await suite();
    } finally {
      setAttente(null);
    }
  };

  // ——— Ajouter ———
  const ajouterPartie = () =>
    lancer("partie", async () => {
      const fait = await creerPartie(projet.id);
      if (!fait.ok) return dire({ texte: fait.erreur });
      setOuvert({ sorte: "partie", id: fait.partieId, neuf: true });
    });
  const ajouterChapitre = (partieId: string) =>
    lancer(`chapitre-${partieId}`, async () => {
      const fait = await creerChapitre(partieId);
      if (!fait.ok) return dire({ texte: fait.erreur });
      setOuvert({ sorte: "chapitre", id: fait.id, neuf: true });
    });

  // ——— Supprimer, restaurer (F03-AC22, F03-AC27) ———
  const supprimerElement = async (sorte: "partie" | "chapitre", id: string, titre: string) => {
    const dedans = sorte === "partie" ? (parties.find((p) => p.id === id)?.chapitres ?? []) : chapitres.filter((c) => c.id === id);
    const emporteLeDepart = !!depart && dedans.some((c) => c.id === depart.chapitreId);
    const fait = await supprimer(sorte, id);
    if (!fait.ok) return dire({ texte: fait.erreur });
    const accord = sorte === "partie" ? "supprimée" : "supprimé";
    dire({
      texte: emporteLeDepart
        ? `« ${titre} » est ${accord}. Le livre n’aura plus de départ.`
        : `« ${titre} » est ${accord}. Vous le retrouvez dans la corbeille du projet.`,
      annuler: () => void restaurer(sorte, id),
      autre: emporteLeDepart ? { libelle: "Choisir un autre départ", faire: () => setOuvert({ sorte: "depart" }) } : undefined,
    });
  };
  const restaurerElement = (element: Supprime) =>
    lancer(element.id, async () => {
      const fait = await restaurer(element.sorte, element.id);
      if (!fait.ok) return dire({ texte: fait.erreur });
      const accord = element.sorte === "chapitre" ? "restauré" : "restaurée";
      const avec = fait.eleves ? `, avec ses ${fait.eleves} élève${pluriel(fait.eleves)}` : "";
      dire({ texte: `« ${element.nom} » est ${accord}${fait.eleves === 1 ? ", avec son élève" : avec}.` });
    });

  // ——— Exclure du livre (F11.2) ———
  const reintegrer = async (c: Chapitre) => {
    const fait = await exclureDuLivre("chapitre", c.id, false);
    dire({ texte: fait.ok ? `« ${c.titre} » est de nouveau dans le livre.` : fait.erreur });
  };
  const exclure = (c: Chapitre) =>
    lancer("exclure", async () => {
      const fait = await exclureDuLivre("chapitre", c.id, true);
      setOuvert(null);
      if (!fait.ok) return dire({ texte: fait.erreur });
      dire({ texte: `« ${c.titre} » est hors du livre.`, annuler: () => void exclureDuLivre("chapitre", c.id, false) });
    });

  // ——— Départ du livre (F03-AC40) ———
  const choisirDepart = async (sceneId: string) => {
    const fait = await designerDepart(projet.id, sceneId);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setOuvert(null);
    const scene = scenesDe(plan).find((s) => s.id === sceneId);
    const nom = scene ? `${referenceScene(scene.reference)}${scene.titre ? ` « ${scene.titre} »` : ""}` : "Cette scène";
    dire({ texte: `${nom} est le départ du livre.`, annuler: () => void designerDepart(projet.id, fait.ancien?.id ?? null) });
  };

  // ——— Image de repérage (F10.1) ———
  const choisirImage = async (pour: "chapitre" | "partie", id: string, choix: ChoixImage): Promise<string | null> => {
    if ("locale" in choix) return "Cette image n’a pas pu être importée.";
    const fait = await choisirRepere(pour, id, choix);
    return fait.ok ? null : fait.erreur;
  };

  // ——— « À compléter » : un manque cliqué montre sa première carte, sans rien filtrer (F03-AC24) ———
  const montrer = (m: Manque) => {
    if (m.sorte === "sans-depart") return setOuvert({ sorte: "depart" });
    if (m.sorte === "eleves-sans-chapitre") return;
    setMontree(null);
    requestAnimationFrame(() => {
      setMontree(m.chapitreId);
      document.getElementById(`chapitre-${m.chapitreId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  // ——— Glisser-déposer (F03-AC34 à AC38) ———
  const partieDe = (liste: Partie[], chapitreId: string) => liste.find((p) => p.chapitres.some((c) => c.id === chapitreId));

  const surDeplacement = ({ active, over }: DragOverEvent) => {
    if (!over || sorteDe(active.id) !== "c") return;
    const id = cleDe(active.id);
    const source = partieDe(parties, id);
    const cible = sorteDe(over.id) === "c" ? partieDe(parties, cleDe(over.id)) : parties.find((p) => p.id === cleDe(over.id));
    if (!source || !cible || source.id === cible.id) return;
    // Le seul chapitre d'une partie n'en sort pas (F03-AC36)
    if (source.chapitres.length === 1) {
      seulRefuse.current = source.titre;
      return;
    }
    const chapitre = source.chapitres.find((c) => c.id === id)!;
    const rang = sorteDe(over.id) === "c" ? cible.chapitres.findIndex((c) => c.id === cleDe(over.id)) : cible.chapitres.length;
    setLocal({
      base: plan,
      parties: parties.map((p) =>
        p.id === source.id
          ? { ...p, chapitres: p.chapitres.filter((c) => c.id !== id) }
          : p.id === cible.id
            ? { ...p, chapitres: [...p.chapitres.slice(0, rang), { ...chapitre, partieId: cible.id }, ...p.chapitres.slice(rang)] }
            : p,
      ),
    });
  };

  const finDeplacement = ({ active, over }: DragEndEvent) => {
    setTire(null);
    const refuse = seulRefuse.current;
    seulRefuse.current = null;
    const id = cleDe(active.id);

    if (sorteDe(active.id) === "p") {
      const de = plan.parties.findIndex((p) => p.id === id);
      const vers = over ? plan.parties.findIndex((p) => p.id === cleDe(over.id)) : -1;
      if (de < 0 || vers < 0 || de === vers) return setLocal(null);
      const suite = arrayMove(plan.parties, de, vers);
      setLocal({ base: plan, parties: suite });
      const titre = plan.parties[de].titre;
      void placerPartie(id, vers).then((fait) => {
        if (!fait.ok) {
          setLocal(null);
          return dire({ texte: fait.erreur });
        }
        const apres = suite[vers + 1];
        dire({
          texte: apres ? `« ${titre} » est placée avant « ${apres.titre} ».` : `« ${titre} » est placée à la fin.`,
          annuler: () => void placerPartie(id, de),
        });
      });
      return;
    }

    // Un chapitre : sa partie est celle où il se trouve à l'écran ; son rang, celui de la carte survolée
    let suite = parties;
    const ici = partieDe(suite, id);
    if (over && sorteDe(over.id) === "c" && ici?.chapitres.some((c) => c.id === cleDe(over.id))) {
      const de = ici.chapitres.findIndex((c) => c.id === id);
      const vers = ici.chapitres.findIndex((c) => c.id === cleDe(over.id));
      if (de !== vers) suite = suite.map((p) => (p.id === ici.id ? { ...p, chapitres: arrayMove(p.chapitres, de, vers) } : p));
    }
    const avant = partieDe(plan.parties, id);
    const maintenant = partieDe(suite, id);
    if (!avant || !maintenant) return setLocal(null);
    const rangAvant = avant.chapitres.findIndex((c) => c.id === id);
    const rang = maintenant.chapitres.findIndex((c) => c.id === id);
    if (avant.id === maintenant.id && rang === rangAvant) {
      setLocal(null);
      if (refuse) dire({ texte: `C’est le seul chapitre de « ${refuse} » : il y reste. Une partie garde toujours un chapitre.` });
      return;
    }
    setLocal({ base: plan, parties: suite });
    const titre = maintenant.chapitres[rang].titre;
    void placerChapitre(id, maintenant.id, rang).then((fait) => {
      if (!fait.ok) {
        setLocal(null);
        return dire({ texte: fait.erreur });
      }
      const apres = maintenant.chapitres[rang + 1];
      dire({
        texte:
          avant.id !== maintenant.id
            ? `« ${titre} » est maintenant dans « ${maintenant.titre} ».`
            : apres
              ? `« ${titre} » est placé avant « ${apres.titre} ».`
              : `« ${titre} » est placé à la fin de « ${maintenant.titre} ».`,
        annuler: () => void placerChapitre(id, avant.id, rangAvant),
      });
    });
  };

  const trouvees = demande.trim() ? chercherScenes(plan, demande) : null;
  const nbTrouvees = trouvees?.reduce((n, g) => n + g.scenes.length, 0) ?? 0;
  const chapitreOuvert = ouvert && "id" in ouvert ? chapitres.find((c) => c.id === ouvert.id) : undefined;
  const partieOuverte = ouvert && "id" in ouvert ? parties.find((p) => p.id === ouvert.id) : undefined;
  const chapitreTire = tire && sorteDe(tire) === "c" ? chapitres.find((c) => c.id === cleDe(tire)) : undefined;
  const partieTiree = tire && sorteDe(tire) === "p" ? parties.find((p) => p.id === cleDe(tire)) : undefined;

  return (
    <>
      <section className="reste" aria-label="Le plan de l’histoire">
        <div className="reste__texte">
          <p className="reste__titre">
            {parties.length} partie{pluriel(parties.length)} · {chapitres.length} chapitre{pluriel(chapitres.length)} · {nbScenes} scène{pluriel(nbScenes)}
          </p>
          {manques.length ? (
            <p className="reste__manques">
              <b>À compléter :</b>
              {manques.map((m, i) => (
                <span key={m.sorte}>
                  {i ? (
                    <span className="reste__sep" aria-hidden="true">
                      {" · "}
                    </span>
                  ) : null}
                  {m.sorte === "eleves-sans-chapitre" ? (
                    libelleManque(m)
                  ) : (
                    <button type="button" className="lien" onClick={() => montrer(m)}>
                      {libelleManque(m)}
                    </button>
                  )}
                </span>
              ))}
            </p>
          ) : null}
        </div>
        <div className="reste__actions">
          {nbScenes ? (
            <label className="recherche">
              <span className="vh">Rechercher une scène dans tout le livre</span>
              <Icone nom="loupe" />
              <input type="search" placeholder="Rechercher une scène" value={demande} onChange={(e) => setDemande(e.target.value)} />
            </label>
          ) : null}
          <button
            type="button"
            className="aide-bouton"
            title="Que fait-on ici ?"
            onClick={() => {
              // Rouverte par « Aide », elle se referme par « Fermer l'aide »
              setVue(true);
              setAide(true);
            }}
          >
            <Icone nom="aide" />
            Aide
          </button>
          <button type="button" className="btn btn--primaire" disabled={attente === "partie"} aria-busy={attente === "partie" || undefined} onClick={ajouterPartie}>
            <Icone nom="plus" />
            Ajouter une partie
          </button>
        </div>
      </section>

      {trouvees ? (
        nbTrouvees === 0 ? (
          <p className="aucun" aria-live="polite">
            Aucune scène trouvée pour « {demande.trim()} » dans le livre.{" "}
            <button type="button" className="lien" onClick={() => setDemande("")}>
              Effacer la recherche
            </button>
          </p>
        ) : (
          <section className="trouves" aria-live="polite" aria-label="Scènes trouvées">
            <p className="trouves__compte">
              <span>
                <b>
                  {nbTrouvees} scène{pluriel(nbTrouvees)}
                </b>{" "}
                pour « {demande.trim()} »
              </span>
              <button type="button" className="lien" onClick={() => setDemande("")}>
                Effacer la recherche
              </button>
            </p>
            {trouvees.map(({ chapitre, scenes }) => (
              <div key={chapitre.id} className="trouves__chap" style={varsCouleur(chapitre.couleur)}>
                <h3>
                  <Link href={`/projet/${projet.id}/chapitre/${chapitre.id}`}>{chapitre.titre}</Link>
                  <span>{parties.find((p) => p.id === chapitre.partieId)?.titre}</span>
                </h3>
                <ul>
                  {scenes.map((s) => (
                    <li key={s.id} className="trouve">
                      <span className="fiche__ref">{referenceScene(s.reference)}</span>
                      <span className="trouve__titre">{s.titre ?? <span className="sans-consigne">sans titre</span>}</span>
                      <span className="tampon" data-e="vide">
                        <Icone nom="vide" />
                        Texte vide
                      </span>
                      {projet.deClasse ? <span className="fiche__qui">{libelleQui(s, chapitre, eleves)}</span> : null}
                      <span className="trouve__ouvrir" aria-hidden="true">
                        Ouvrir
                        <Icone nom="fleche" />
                      </span>
                      <Link
                        className="trouve__cible"
                        href={`/projet/${projet.id}/scene/${s.id}`}
                        aria-label={`Ouvrir ${referenceScene(s.reference)}${s.titre ? ` — ${s.titre}` : ""}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )
      ) : parties.length === 0 ? (
        <div className="vide-chap">
          <p>
            Le plan est encore vide. Une partie regroupe des chapitres : ajoutez la première, son premier chapitre se crée avec elle.
          </p>
          <button type="button" className="btn" disabled={attente === "partie"} onClick={ajouterPartie}>
            <Icone nom="plus" />
            Ajouter une partie
          </button>
        </div>
      ) : (
        <DndContext
          id="plan"
          sensors={capteurs}
          collisionDetection={collision}
          accessibility={{ announcements: annonces(nomDe), screenReaderInstructions: CONSIGNES_CLAVIER }}
          onDragStart={({ active }) => {
            seulRefuse.current = null;
            setTire(String(active.id));
            setLocal({ base: plan, parties });
          }}
          onDragOver={surDeplacement}
          onDragEnd={finDeplacement}
          onDragCancel={() => {
            setTire(null);
            setLocal(null);
          }}
        >
          <SortableContext items={parties.map((p) => `p:${p.id}`)} strategy={verticalListSortingStrategy}>
            <div className="parties">
              {parties.map((p, i) => (
                <SectionPartie
                  key={p.id}
                  partie={p}
                  rang={i}
                  deClasse={projet.deClasse}
                  unique={parties.length === 1}
                  ajoutEnCours={attente === `chapitre-${p.id}`}
                  onAjouter={() => ajouterChapitre(p.id)}
                  onReglages={() => setOuvert({ sorte: "partie", id: p.id, neuf: false })}
                  onSupprimer={() => void supprimerElement("partie", p.id, p.titre)}
                >
                  {p.chapitres.map((c) => (
                    <CarteChapitre
                      key={c.id}
                      projetId={projet.id}
                      chapitre={c}
                      deClasse={projet.deClasse}
                      eleves={c.attributions.flatMap((a) => (eleveDe.has(a.eleveId) ? [eleveDe.get(a.eleveId)!] : []))}
                      seul={p.chapitres.length === 1}
                      montree={montree === c.id}
                      onReglages={() => setOuvert({ sorte: "chapitre", id: c.id, neuf: false })}
                      onAttribuer={() => setOuvert({ sorte: "attribuer", id: c.id })}
                      onExclure={() => (c.horsLivre ? void reintegrer(c) : setOuvert({ sorte: "exclure", id: c.id }))}
                      onSupprimer={() => void supprimerElement("chapitre", c.id, c.titre)}
                    />
                  ))}
                </SectionPartie>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {chapitreTire ? (
              <div className="tiree">
                <Cahier chapitre={chapitreTire} deClasse={projet.deClasse} eleves={[]} />
              </div>
            ) : partieTiree ? (
              <div className="tiree" style={{ background: "var(--feuille)", padding: "10px 16px" }}>
                <b>{partieTiree.titre}</b>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <p className="corbeille-lien">
        <button type="button" className="lien" onClick={() => setOuvert({ sorte: "corbeille" })}>
          <Icone nom="corbeille" />
          Corbeille du projet{plan.corbeille.length ? ` · ${plan.corbeille.length} élément${pluriel(plan.corbeille.length)}` : ""}
        </button>
      </p>

      {ouvert?.sorte === "chapitre" && chapitreOuvert ? (
        <ReglagesChapitre
          key={chapitreOuvert.id}
          chapitre={chapitreOuvert}
          neuf={ouvert.neuf}
          lisibleParLesEleves={projet.deClasse}
          onImage={() => setOuvert({ sorte: "image", pour: "chapitre", id: chapitreOuvert.id, neuf: false })}
          onFermer={() => setOuvert(null)}
        />
      ) : null}
      {ouvert?.sorte === "partie" && partieOuverte ? (
        <ReglagesPartie
          key={partieOuverte.id}
          partie={partieOuverte}
          neuf={ouvert.neuf}
          onImage={() => setOuvert({ sorte: "image", pour: "partie", id: partieOuverte.id, neuf: false })}
          onFermer={() => setOuvert(null)}
        />
      ) : null}
      {ouvert?.sorte === "image" && (ouvert.pour === "chapitre" ? chapitreOuvert : partieOuverte) ? (
        <ChoisirImage
          projetId={projet.id}
          actuel={(ouvert.pour === "chapitre" ? chapitreOuvert : partieOuverte)!}
          pour={`de « ${(ouvert.pour === "chapitre" ? chapitreOuvert : partieOuverte)!.titre} »`}
          onChoisir={(choix) => choisirImage(ouvert.pour, ouvert.id, choix)}
          onFermer={() => setOuvert({ sorte: ouvert.pour, id: ouvert.id, neuf: false })}
        />
      ) : null}
      {ouvert?.sorte === "attribuer" && chapitreOuvert ? (
        <AttribuerEleves key={chapitreOuvert.id} chapitre={chapitreOuvert} plan={plan} eleves={eleves} classe={projet.classe} onFermer={() => setOuvert(null)} />
      ) : null}
      {ouvert?.sorte === "corbeille" ? (
        <Corbeille corbeille={plan.corbeille} attente={attente} onRestaurer={restaurerElement} onFermer={() => setOuvert(null)} />
      ) : null}
      {ouvert?.sorte === "depart" ? <ChoisirDepart plan={plan} onChoisir={(id) => void choisirDepart(id)} onFermer={() => setOuvert(null)} /> : null}
      {ouvert?.sorte === "exclure" && chapitreOuvert ? (
        <Dialogue
          titre={`Exclure « ${chapitreOuvert.titre} » du livre ?`}
          onFermer={() => setOuvert(null)}
          boutons={
            <button type="button" className="btn btn--primaire" disabled={attente === "exclure"} aria-busy={attente === "exclure" || undefined} onClick={() => void exclure(chapitreOuvert)}>
              Exclure du livre
            </button>
          }
        >
          <ul className="dialogue__faits">
            <li>
              {chapitreOuvert.scenes.length > 1
                ? `Ses ${chapitreOuvert.scenes.length} scènes seront hors du livre.`
                : chapitreOuvert.scenes.length === 1
                  ? "Sa scène sera hors du livre."
                  : "Ses scènes seront hors du livre."}{" "}
              Elles restent dans le projet.
            </li>
            {projet.deClasse ? <li>Les élèves continuent d’y écrire.</li> : null}
            <li>Vous le remettez dans le livre depuis ce même menu.</li>
          </ul>
        </Dialogue>
      ) : null}
    </>
  );
}

function SectionPartie({
  partie, rang, deClasse, unique, ajoutEnCours, onAjouter, onReglages, onSupprimer, children,
}: {
  partie: Partie; rang: number; deClasse: boolean; unique: boolean; ajoutEnCours: boolean;
  onAjouter: () => void; onReglages: () => void; onSupprimer: () => void; children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: `p:${partie.id}` });
  const { setNodeRef: poserZone, isOver: accueille } = useDroppable({ id: `z:${partie.id}` });
  const nbScenes = partie.chapitres.reduce((n, c) => n + c.scenes.length, 0);
  const nbEleves = new Set(partie.chapitres.flatMap((c) => c.attributions.map((a) => a.eleveId))).size;
  const meta = [`Partie ${rang + 1}`, `${partie.chapitres.length} chapitre${pluriel(partie.chapitres.length)}`, `${nbScenes} scène${pluriel(nbScenes)}`];
  if (deClasse) meta.push(`${nbEleves} élève${pluriel(nbEleves)}`);
  return (
    <section
      ref={setNodeRef}
      className={`partie${isDragging ? " est-tiree" : ""}${accueille ? " accueille" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-labelledby={`partie-${partie.id}`}
    >
      <header className={`partie__tete${unique ? "" : " se-tire"}`} {...(unique ? {} : listeners)}>
        {unique ? <span /> : <Prise nom={`la partie ${partie.titre}`} ref={setActivatorNodeRef} {...attributes} />}
        <div className="partie__vignette">
          <ImageRepere repere={partie} graine={partie.id} />
        </div>
        <div className="partie__titres">
          <h2 id={`partie-${partie.id}`}>{partie.titre}</h2>
          <p>{meta.join(" · ")}</p>
        </div>
        <Menu libelle={`Autres commandes de la partie ${partie.titre}`} discret>
          {(fermer) => (
            <>
              <button type="button" onClick={() => { fermer(); onReglages(); }}>
                Réglages
              </button>
              <button type="button" onClick={() => { fermer(); onSupprimer(); }}>
                Supprimer
              </button>
            </>
          )}
        </Menu>
      </header>
      <SortableContext items={partie.chapitres.map((c) => `c:${c.id}`)} strategy={rectSortingStrategy}>
        <ul className="cahiers" ref={poserZone}>
          {children}
          <li>
            <button type="button" className="cahier-ajout" disabled={ajoutEnCours} aria-busy={ajoutEnCours || undefined} onClick={onAjouter} style={{ width: "100%" }}>
              <Icone nom="plus" />
              <span>Ajouter un chapitre</span>
            </button>
          </li>
        </ul>
      </SortableContext>
    </section>
  );
}

function CarteChapitre({
  projetId, chapitre, deClasse, eleves, seul, montree, onReglages, onAttribuer, onExclure, onSupprimer,
}: {
  projetId: string; chapitre: Chapitre; deClasse: boolean; eleves: ElevePlan[]; seul: boolean; montree: boolean;
  onReglages: () => void; onAttribuer: () => void; onExclure: () => void; onSupprimer: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: `c:${chapitre.id}` });
  return (
    <li ref={setNodeRef} id={`chapitre-${chapitre.id}`} className={isDragging ? "est-tiree" : undefined} style={{ transform: CSS.Translate.toString(transform), transition }} {...listeners}>
      <Cahier
        chapitre={chapitre}
        deClasse={deClasse}
        eleves={eleves}
        montree={montree}
        lien={`/projet/${projetId}/chapitre/${chapitre.id}`}
        prise={<Prise nom={`le chapitre ${chapitre.titre}`} ref={setActivatorNodeRef} {...attributes} />}
        menu={
          <Menu libelle={`Autres commandes du chapitre ${chapitre.titre}`}>
            {(fermer) => (
              <>
                <button type="button" onClick={() => { fermer(); onReglages(); }}>
                  Réglages
                </button>
                {deClasse ? (
                  <button type="button" onClick={() => { fermer(); onAttribuer(); }}>
                    Attribuer des élèves
                  </button>
                ) : null}
                <button type="button" onClick={() => { fermer(); onExclure(); }}>
                  {chapitre.horsLivre ? "Réintégrer dans le livre" : "Exclure du livre"}
                </button>
                <hr />
                <button type="button" disabled={seul} onClick={() => { fermer(); onSupprimer(); }}>
                  Supprimer
                </button>
                {seul ? <p className="menu__note">C’est le seul chapitre de sa partie : supprimez la partie.</p> : null}
              </>
            )}
          </Menu>
        }
      />
    </li>
  );
}

/** La carte-cahier d'un chapitre : toute la carte ouvre le chapitre (F03-AC21). */
export function Cahier({
  chapitre, deClasse, eleves, montree, lien, prise, menu,
}: {
  chapitre: Chapitre; deClasse: boolean; eleves: ElevePlan[]; montree?: boolean; lien?: string; prise?: React.ReactNode; menu?: React.ReactNode;
}) {
  // Un chapitre que l'enseignant écrit seul n'attend pas d'élève (F03.1)
  const manques = [chapitre.scenes.length === 0 ? "Aucune scène" : null, deClasse && sansEleve(chapitre) ? "aucun élève" : null].filter(Boolean);
  return (
    <article className={`cahier${lien ? " cahier--ouvrable se-tire" : ""}${montree ? " est-montree" : ""}`} style={varsCouleur(chapitre.couleur)}>
      {lien ? <Link className="cahier__cible" href={lien} aria-label={`Ouvrir ${chapitre.titre}`} draggable={false} /> : null}
      {menu}
      <div className="cahier__couv">
        <div className="cahier__vignette">
          <ImageRepere repere={chapitre} graine={chapitre.id} />
        </div>
        <div className="etiquette">
          <h3>{chapitre.titre}</h3>
        </div>
        <div className="cahier__couv-bas" />
      </div>
      <div className="cahier__pied">
        {chapitre.scenes.length ? <p className="cahier__ligne cahier__ligne--compte">{compteScenes(chapitre.scenes.length)}</p> : null}
        {deClasse && ecritParLEnseignant(chapitre) && !eleves.length ? <p className="cahier__ligne">Vous l’écrivez vous-même</p> : null}
        {eleves.length ? (
          <p className="cahier__ligne">
            <span className="gommettes">
              {eleves.slice(0, 6).map((e) => (
                <Gommette key={e.id} prenom={e.prenom} couleur={e.couleur} taille="s" />
              ))}
            </span>
            {eleves.length} élève{pluriel(eleves.length)}
          </p>
        ) : null}
        {manques.length ? (
          <p className="manque">
            <Icone nom="vide" />
            {manques.join(" · ")}
          </p>
        ) : null}
        {chapitre.horsLivre ? (
          <p className="cahier__ligne">
            <span className="repere">hors du livre</span>
          </p>
        ) : null}
        <p className="cahier__actions">
          {prise}
          <span className="cahier__ouvrir" aria-hidden="true">
            Ouvrir
            <Icone nom="fleche" />
          </span>
        </p>
      </div>
    </article>
  );
}
