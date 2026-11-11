"use client";

import { ouvrirOffreDuPass } from "@/composants/OffreDuPass";
import { closestCenter, DndContext, DragOverlay, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bulle } from "@/composants/Bulle";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { AideDesChemins, Chemins } from "@/composants/Chemins";
import type { Construire } from "@/composants/chemins/Construire";
import { Dialogue } from "@/composants/Dialogue";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { TamponScene } from "@/composants/TamponScene";
import { SuiviDesImages } from "@/composants/ImagesALAjout";
import { ImageRepere } from "@/composants/ImageRepere";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { annonces, CONSIGNES_CLAVIER, Prise, useCapteurs } from "@/composants/Tirer";
import { cheminsDuPlan } from "@/domaine/chemins";
import { raisonDuReperage } from "@/domaine/illustration";
import { nomPourEleves } from "@/domaine/eleves";
import { chapitresDe, compteScenes, departDe, ecritParLEnseignant, nomScene, referenceScene, type ElevePlan, type Plan, type Scene } from "@/domaine/recit";
import { cle, pluriel } from "@/domaine/texte";
import {
  ajouterBlocDepuisLeSchema, ajouterSceneDepuisLeSchema, annulerAjoutDuSchema, annulerBlocDuSchema, cacherChoixDuSchema, lireChoixDuSchema, modifierChoixDuSchema, proposerLiaisonDuSchema,
  reglerLeBloc, relierChoixDuSchema, relierDepuisLeSchema, remettreChoixDuSchema, remettreLiaisonDuSchema, retirerLiaisonDuSchema, supprimerChoixDuSchema,
} from "../../../actions-chemins";
import { chercherDestinations, creerSceneDepuisChoix, fixerPourLiaison, libererNumero, numeroDeLaScene, relireNumeros } from "../../../actions-texte";
import { numerosDuPlan } from "@/domaine/numeros";
import { scenesDe } from "@/domaine/recit";
import type { ServicesDuChoix } from "@/composants/chemins/Choix";
import { useAidesIa } from "@/composants/AidesIa";
import { ceQuiSAjoute, type ReglagesBloc } from "@/domaine/bloc-de-scenes";
import { choisirRepere, creerScene, exclureDuLivre, placerScene, reglerScene, restaurer, supprimer } from "../../../actions-recit";
import { useCommandesScene } from "../../_plan/commandes";
import { useConfirmerSuppression } from "../../_plan/suppression";
import { AttribuerEleves, ChoisirDepart, ReglagesChapitre } from "../../_plan/Panneaux";
import { QuiSenOccupe } from "../../_plan/QuiSenOccupe";
import { varsCouleur, type ProjetDuPlan } from "../../_plan/Plan";

type Ouvert = "reglages" | "image" | "attribuer" | "exclure" | "depart" | null;

/**
 * La page d'un chapitre (F03.1) : quelles scènes existent, dans quel ordre. Le chapitre
 * est le plan, le Suivi est le travail : ni filtres d'état ni sélection ici.
 */
export function PageChapitre({
  projet, plan, chapitreId, eleves, vue = "scenes", designee, venuDuLivre, reglagesBloc, blocAuDepart,
}: {
  projet: ProjetDuPlan; plan: Plan; chapitreId: string; eleves: ElevePlan[];
  /** Deux vues du même chapitre, en récit à choix : ses cartes, ou ses chemins (F03-AC18) */
  vue?: "scenes" | "chemins";
  /** La scène où mène le choix qu'on vient de suivre depuis un autre chapitre (F03-AC25) */
  designee?: string;
  /** Arrivé par « Voir dans les chemins », depuis un point du Livre : on y revient (F09.2) */
  venuDuLivre?: boolean;
  /** Les deux réglages du bloc de scènes, gardés avec le compte (F13.7) */
  reglagesBloc: ReglagesBloc;
  /** Arrivé d'un chapitre vide par « ✦ Construire avec l'IA » : le panneau du bloc s'ouvre d'office */
  blocAuDepart?: boolean;
}) {
  const aides = useAidesIa();
  const dire = useMessage();
  const routeur = useRouter();
  const capteurs = useCapteurs();
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [attente, setAttente] = useState<string | null>(null);
  const [demande, setDemande] = useState("");
  const [montree, setMontree] = useState<string | null>(null);
  // Une scène ajoutée vient sous les yeux dès que sa carte existe (révision de novembre 2026)
  const aAmener = useRef<string | null>(null);
  useEffect(() => {
    if (!aAmener.current) return;
    const carte = document.querySelector(".fiche.est-montree");
    if (!carte) return;
    carte.scrollIntoView({ behavior: "smooth", block: "center" });
    aAmener.current = null;
  });
  const [local, setLocal] = useState<{ base: Plan; scenes: Scene[] } | null>(null);
  const [tiree, setTiree] = useState<string | null>(null);
  const commandes = useCommandesScene({ projetId: projet.id, plan, eleves, onChoisirDepart: () => setOuvert("depart") });
  // Les chemins ne se recalculent pas à chaque geste : le schéma se redessinerait
  const chemins = useMemo(() => (vue === "chemins" ? cheminsDuPlan(plan, chapitreId, projet.id, eleves) : null), [vue, plan, chapitreId, projet.id, eleves]);

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

  // « Chemins » s'ouvre en premier dans un chapitre à choix : son adresse est celle du chapitre (F03.1, « Chemins en atelier »)
  const adresse = (v: "scenes" | "chemins") => `/projet/${projet.id}/chapitre/${chapitre.id}${v === "scenes" && projet.aChoix ? "?vue=scenes" : ""}`;

  const ajouter = async () => {
    setAttente("scene");
    const fait = await creerScene(chapitre.id);
    setAttente(null);
    // La limite gratuite atteinte : le dialogue du pass dit ce qui se passe et la suite (F14-AC13)
    if (!fait.ok && fait.limite) return ouvrirOffreDuPass(projet.id, fait.limite);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setDemande("");
    setMontree(fait.id);
    aAmener.current = fait.id;
    // La première scène d'un chapitre à choix arrive dans « Chemins », qui s'ouvre en premier : on y clique sa carte
    if (vue === "chemins") return dire({ texte: `${referenceScene(fait.reference)} est ajoutée. Cliquez-la pour lui donner un titre.` });
    dire({ texte: `${referenceScene(fait.reference)} est ajoutée à la fin du chapitre. Ouvrez-la pour lui donner un titre.` });
  };

  // ——— Modifier un choix depuis « Chemins » (F03-AC70 à AC75) : le livre autour du chapitre, tel que la copie le lit ———
  const livre = useMemo<ServicesDuChoix["livre"] | null>(
    () =>
      vue === "chemins" && projet.aChoix
        ? {
            aChoix: true,
            numeros: Object.fromEntries(numerosDuPlan(plan).de),
            scenes: plan.parties.flatMap((p) =>
              p.chapitres.flatMap((c) =>
                c.scenes.map((s) => ({ id: s.id, reference: s.reference, titre: s.titre, chapitreId: c.id, chapitre: c.titre, partie: p.titre, vide: s.texteVide, consigne: s.consigne })),
              ),
            ),
            ailleurs: {},
            chapitres: plan.parties.flatMap((p) => p.chapitres.map((c) => ({ id: c.id, titre: c.titre, partie: p.titre }))),
            fixes: Object.fromEntries(scenesDe(plan).flatMap((s) => (s.numeroFixe ? [[s.id, s.numeroFixe]] : []))),
            depart: plan.departSceneId,
          }
        : null,
    [vue, projet.aChoix, plan],
  );
  const nomDe = (sceneId: string | null): string => {
    const s = scenesDe(plan).find((x) => x.id === sceneId);
    return s ? nomScene(s) : "La scène";
  };
  const defaire = (annulation: Promise<{ ok: true } | { ok: false; erreur: string }>) => void annulation.then((defait) => defait.ok || dire({ texte: defait.erreur }));
  const choixDuSchema: ServicesDuChoix | undefined = livre
    ? {
        projetId: projet.id,
        chapitreId: chapitre.id,
        livre,
        // Ce que les réglages d'un choix demandent au serveur, comme dans la copie
        services: {
          chercher: (demande) => chercherDestinations(projet.id, demande),
          creerScene: async (chapitreIci, titreScene, consigneScene) => {
            const fait = await creerSceneDepuisChoix(chapitreIci, titreScene, consigneScene);
            // La limite gratuite atteinte : la fiche dit que rien n'est créé, le dialogue dit la suite (F14-AC13)
            if (!fait.ok && fait.limite) ouvrirOffreDuPass(projet.id, fait.limite);
            return fait;
          },
          supprimerScene: async (id) => {
            const reponse = await supprimer("scene", id);
            return reponse.ok ? { ok: true } : { ok: false, erreur: reponse.erreur };
          },
          relireNumeros: async () => (await relireNumeros(projet.id)).numeros,
          numeroDe: (id) => numeroDeLaScene(id),
          fixerNumero: (id, n) => fixerPourLiaison(id, n),
          libererNumero: (id) => libererNumero(id),
        },
        lire: (sceneId, lienId) => lireChoixDuSchema(sceneId, lienId),
        modifier: (sceneId, bloc) => modifierChoixDuSchema(sceneId, bloc),
        // Chaque geste qui fait partir le choix se dit en une phrase, avec « Annuler », qui le rend à sa place (F03-AC74)
        supprimer: async (sceneId, bloc) => {
          const fait = await supprimerChoixDuSchema(sceneId, bloc.id, true);
          if (!fait.ok) {
            dire({ texte: fait.erreur });
            return fait;
          }
          dire({ texte: `Le choix « ${bloc.libelle || "sans libellé"} » est supprimé.`, annuler: () => defaire(remettreChoixDuSchema(sceneId, fait.bloc, fait.place)) });
          return { ok: true };
        },
        cacher: async (sceneId, bloc, cible) => {
          const fait = await cacherChoixDuSchema(sceneId, bloc.id, cible);
          if (!fait.ok) {
            dire({ texte: fait.erreur });
            return fait;
          }
          dire({
            texte: `Le choix est caché : c’est maintenant un lien caché, hors du récit. ${nomDe(cible)} garde le n° ${fait.numero ?? "…"}.`,
            annuler: () => defaire(remettreChoixDuSchema(sceneId, fait.bloc, fait.place, fait.liaison)),
          });
          return { ok: true };
        },
        proposer: async (sceneId, liaison, libelle) => {
          const fait = await proposerLiaisonDuSchema(sceneId, liaison.id, libelle);
          if (!fait.ok) {
            dire({ texte: fait.erreur });
            return fait;
          }
          dire({ texte: "Le lien caché est devenu une phrase de choix, à la fin du texte.", annuler: () => defaire(remettreLiaisonDuSchema(sceneId, fait.liaison, fait.choix)) });
          return { ok: true };
        },
        retirerLiaison: async (sceneId, liaison) => {
          const fait = await retirerLiaisonDuSchema(sceneId, liaison.id);
          if (!fait.ok) {
            dire({ texte: fait.erreur });
            return fait;
          }
          // La scène garde son numéro : une énigme peut rester dans un texte (F11-AC98)
          const fixe = liaison.cible ? livre.fixes[liaison.cible] : undefined;
          dire({
            texte: fixe ? `Lien caché retiré. ${nomDe(liaison.cible)} garde le n° ${fixe} fixé.` : "Lien caché retiré.",
            annuler: () => defaire(remettreLiaisonDuSchema(sceneId, fait.liaison)),
          });
          return { ok: true };
        },
      }
    : undefined;

  // ——— Construire dans « Chemins » (F03.1) : chaque geste est enregistré aussitôt, et se dit en une phrase ———
  const construire: Construire | undefined = !projet.aChoix
    ? undefined
    : {
        deClasse: projet.deClasse,
        ajouterScene: async (de, libelle, titre) => {
          const fait = await ajouterSceneDepuisLeSchema(chapitre.id, de, libelle, titre);
          if (!fait.ok && fait.limite) ouvrirOffreDuPass(projet.id, fait.limite);
          if (!fait.ok) return fait;
          dire({ texte: `${nomScene(fait.scene)} est ajoutée.`, annuler: () => void annulerAjoutDuSchema([fait.choix], [fait.scene.id]).then((defait) => defait.ok || dire({ texte: defait.erreur })) });
          return { ok: true };
        },
        relier: async (de, vers, libelle) => {
          const fait = await relierDepuisLeSchema(chapitre.id, de, vers, libelle);
          if (!fait.ok) return fait;
          const cible = chapitre.scenes.find((s) => s.id === vers);
          dire({
            texte: `Le choix « ${libelle.trim()} » mène à ${cible ? nomScene(cible) : "la scène"}.`,
            annuler: () => void annulerAjoutDuSchema([fait.choix], []).then((defait) => defait.ok || dire({ texte: defait.erreur })),
          });
          return { ok: true };
        },
        reglerScene: (sceneId, valeurs) => reglerScene(sceneId, valeurs),
        // L'onglet d'un choix « Sans destination », tiré jusqu'à une scène : sans bulle, sa phrase existe (F03-AC67)
        relierChoix: async (lien, vers) => {
          const fait = await relierChoixDuSchema(lien.de, lien.id, vers);
          if (!fait.ok) {
            dire({ texte: fait.erreur });
            return fait;
          }
          const cible = chapitre.scenes.find((s) => s.id === vers);
          dire({
            texte: `Le choix « ${lien.libelle || "sans libellé"} » mène à ${cible ? nomScene(cible) : "la scène"}.`,
            annuler: () => void relierChoixDuSchema(lien.de, lien.id, null).then((defait) => defait.ok || dire({ texte: defait.erreur })),
          });
          return { ok: true };
        },
        supprimerChoix: async (lien) => {
          // La ligne du panneau est le choix entier : ses destinations partent avec sa phrase
          const fait = await supprimerChoixDuSchema(lien.de, lien.id, true);
          if (!fait.ok) {
            dire({ texte: fait.erreur });
            return fait;
          }
          dire({
            texte: `Le choix « ${lien.libelle || "sans libellé"} » est supprimé.`,
            // « Annuler » rend le choix à sa place dans le texte, entre ses voisins (F03-AC74)
            annuler: () => void remettreChoixDuSchema(lien.de, fait.bloc, fait.place).then((defait) => defait.ok || dire({ texte: defait.erreur })),
          });
          return { ok: true };
        },
        supprimerScene: (sceneId) => {
          const scene = chapitre.scenes.find((s) => s.id === sceneId);
          if (scene) commandes.supprimerScene(scene, true);
        },
        choix: choixDuSchema,
        // Le bloc de scènes (F13.7) : un seul ajout, dit en une phrase avec « Annuler »
        bloc: {
          chapitreId: chapitre.id,
          nombreDeScenes: chapitre.scenes.length,
          reglages: reglagesBloc,
          auDepart: blocAuDepart,
          quitter: () => routeur.replace(adresse("chemins"), { scroll: false }),
          regler: (r) => reglerLeBloc(r),
          ajouter: async (p, prendre) => {
            const fait = await ajouterBlocDepuisLeSchema(chapitre.id, p, prendre);
            if (!fait.ok && fait.limite) ouvrirOffreDuPass(projet.id, fait.limite);
            if (!fait.ok) return fait;
            const consigne = fait.consignePrise && p.origine ? { scene: p.origine, texte: fait.consignePrise } : undefined;
            const ajoute = ceQuiSAjoute({ scenes: fait.scenes, choix: fait.choix });
            dire({
              texte: `${ajoute.charAt(0).toLocaleUpperCase("fr")}${ajoute.slice(1)} ajouté${fait.scenes.length + fait.choix.length > 1 ? "s" : ""}${consigne ? ", et la consigne de la scène d’origine" : ""}.`,
              annuler: () => void annulerBlocDuSchema(fait.choix, fait.scenes.map((x) => x.id), consigne).then((defait) => defait.ok || dire({ texte: defait.erreur })),
            });
            // Le début d'un chapitre vide : la page quitte son adresse d'arrivée, le bloc ne se rouvre pas d'office
            if (blocAuDepart) routeur.replace(adresse("chemins"), { scroll: false });
            return { ok: true, scenes: fait.scenes.map((x) => x.id) };
          },
        },
      };

  const suppression = useConfirmerSuppression({ plan, eleves });
  const supprimerChapitre = () => suppression.demander("chapitre", chapitre.id, `« ${chapitre.titre} »`, () => void retirerChapitre());
  const retirerChapitre = async () => {
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
    dire(fait.ok ? { texte: `« ${chapitre.titre} » est hors du livre.`, annuler: () => void exclureDuLivre("chapitre", chapitre.id, false, true) } : { texte: fait.erreur });
  };
  const reintegrer = async () => {
    const fait = await exclureDuLivre("chapitre", chapitre.id, false);
    dire({ texte: fait.ok ? `« ${chapitre.titre} » est de nouveau dans le livre${fait.aLaSuite ? " ; ses passages prennent la suite de leur partie" : ""}.` : fait.erreur });
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
      <SuiviDesImages projetId={projet.id} />
      {/* Un seul retour, de la même forme que celui de la scène (F06.5, 8 novembre 2026) */}
      <nav className="fil" aria-label="Fil d’Ariane">
        <Link href={venuDuLivre ? `/projet/${projet.id}/livre` : `/projet/${projet.id}/plan`}>
          <Icone nom="fleche-g" />
          {venuDuLivre ? "Retour au Livre" : "Retour à Parties et chapitres"}
        </Link>
      </nav>

      {/* Un en-tête réduit à une seule bande (F03.1, « Chemins en atelier », 11 novembre 2026) : le chapitre, ses
          élèves, et la bascule « Scènes / Chemins » avec son « i », là où étaient « Ajouter une scène » et
          « Attribuer des élèves ». Le schéma se voit sans faire défiler, les onglets ne bougent pas d'une vue à l'autre. */}
      <header className={`chap-bandeau${chapitre.scenes.length ? " chap-bandeau--compact" : ""}`}>
        <div className="chap-bandeau__image">
          <ImageRepere repere={chapitre} graine={chapitre.id} prioritaire />
        </div>
        <div className="chap-bandeau__texte">
          <h1>{chapitre.titre}</h1>
          <p className="chap-meta">
            {partie.titre} · {compteScenes(chapitre.scenes.length).toLocaleLowerCase("fr")}
            {/* Où en est le chapitre, avec les mots de sa carte et du Suivi (révision de novembre 2026) */}
            {etatsDuChapitre(chapitre.scenes).map((t) => ` · ${t}`)}
            {chapitre.horsLivre ? " · hors du livre" : ""}
          </p>
          {attribues.length ? (
            // Les prénoms ouvrent « Attribuer des élèves », qui reste aussi dans le menu « … »
            <button type="button" className="chap-eleves chap-eleves--bouton" title="Attribuer des élèves" onClick={() => setOuvert("attribuer")}>
              <span className="vh">Élèves du chapitre : </span>
              {attribues.map(({ eleve }) => (
                <span key={eleve.id} className="chap-eleves__un">
                  <Gommette prenom={eleve.prenom} couleur={eleve.couleur} taille="s" />
                  {nomPourEleves(eleve, eleves)}
                </span>
              ))}
              <span className="vh">. Attribuer des élèves</span>
              <Icone nom="crayon" />
            </button>
          ) : projet.deClasse ? (
            <p className="chap-meta">
              {ecritParLEnseignant(chapitre) ? "Vous écrivez ce chapitre vous-même." : "Aucun élève n’écrit encore dans ce chapitre."}{" "}
              <button type="button" className="lien" onClick={() => setOuvert("attribuer")}>
                Attribuer des élèves
              </button>
            </p>
          ) : null}
        </div>
        <div className="chap-actions">
          {projet.aChoix && chapitre.scenes.length ? (
            <>
              <div className="bascule" role="group" aria-label="Vue du chapitre">
                <button type="button" aria-pressed={vue === "chemins"} onClick={() => routeur.replace(adresse("chemins"), { scroll: false })}>
                  <Icone nom="chemins" />
                  Chemins
                </button>
                <button type="button" aria-pressed={vue === "scenes"} onClick={() => routeur.replace(adresse("scenes"), { scroll: false })}>
                  <Icone nom="feuille" />
                  Scènes
                </button>
              </div>
              {vue === "chemins" ? (
                <AideDesChemins construit />
              ) : (
                <Bulle question="Que change l’ordre des cartes ?">
                  L’ordre des cartes ne sert qu’à ranger le chapitre. Dans le livre, ce sont les choix écrits dans les scènes qui mènent d’une scène
                  à l’autre.
                </Bulle>
              )}
            </>
          ) : null}
          <Menu libelle={`Autres commandes du chapitre ${chapitre.titre}`}>
            {(fermer) => (
              <>
                <button type="button" onClick={() => { fermer(); setOuvert("reglages"); }}>
                  Réglages
                </button>
                {projet.deClasse ? (
                  <button type="button" onClick={() => { fermer(); setOuvert("attribuer"); }}>
                    Attribuer des élèves
                  </button>
                ) : null}
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
        </div>
      </header>

      {chapitre.scenes.length === 0 && vue === "chemins" && blocAuDepart && chemins && construire ? (
        // Un chapitre vide, le bloc demandé : le schéma attend sa proposition (F13.7)
        <Chemins key={chapitre.id} {...chemins} construire={construire} />
      ) : chapitre.scenes.length === 0 ? (
        <div className="vide-chap">
          <p>Ce chapitre n’a pas encore de scène. Ajoutez une première scène.</p>
          <span className="vide-chap__gestes">
            <button type="button" className="btn btn--primaire" disabled={attente === "scene"} aria-busy={attente === "scene" || undefined} onClick={() => void ajouter()}>
              <Icone nom="plus" />
              Ajouter une scène
            </button>
            {/* Plusieurs scènes d'un coup, en récit à choix : par l'IA seule (F13.7) */}
            {projet.aChoix && aides.proposer ? (
              <button type="button" className="btn btn--ia" onClick={() => routeur.replace(`/projet/${projet.id}/chapitre/${chapitre.id}?bloc=debut`, { scroll: false })}>
                <Icone nom="ia" />
                Construire avec l’IA
              </button>
            ) : null}
          </span>
        </div>
      ) : (
        <>
          {/* Sous la bande, dans « Scènes » seulement : ce que dit l'ordre en récit classique, et la recherche */}
          {vue === "scenes" && (!projet.aChoix || chapitre.scenes.length > 3) ? (
            <div className="chap-outils">
              {projet.aChoix ? null : <p>Les scènes se lisent dans cet ordre.</p>}
              {chapitre.scenes.length > 3 ? (
                <label className="recherche" style={{ marginLeft: "auto" }}>
                  <span className="vh">Rechercher une scène dans ce chapitre</span>
                  <Icone nom="loupe" />
                  <input type="search" placeholder="Rechercher dans ce chapitre" value={demande} onChange={(e) => setDemande(e.target.value)} />
                </label>
              ) : null}
            </div>
          ) : null}
          {chemins ? (
            <Chemins key={chapitre.id} {...chemins} designee={designee} construire={construire} />
          ) : montrees.length === 0 ? (
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
                  {/* « Ajouter une scène », en dernière carte de la grille (F03.1, « Chemins en atelier ») ; pas parmi les résultats d'une recherche */}
                  {filtre ? null : (
                    <li>
                      <button type="button" className="fiche-ajout" disabled={attente === "scene"} aria-busy={attente === "scene" || undefined} onClick={() => void ajouter()}>
                        <Icone nom="plus" />
                        Nouvelle scène
                      </button>
                    </li>
                  )}
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
        <ChoisirImage
          projetId={projet.id}
          actuel={chapitre}
          pour={`de « ${chapitre.titre} »`}
          creer={{ sorte: "chapitre", id: chapitre.id, raison: raisonDuReperage(chapitre) }}
          onChoisir={choisirImage}
          onFermer={() => setOuvert("reglages")}
        />
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
      {suppression.dialogue}
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
        <TamponScene etat={scene.etat} vide={scene.texteVide} />
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

/** « 2 validées · 1 prête · 1 à valider · 1 à reprendre » : seulement ce qui existe. */
function etatsDuChapitre(scenes: Scene[]): string[] {
  const compte = (etat: string) => scenes.filter((s) => s.etat === etat).length;
  const [validees, pretes, aValider, aReprendre] = [compte("valide"), compte("prete"), compte("valider"), compte("reprendre")];
  return [
    validees ? `${validees} validée${pluriel(validees)}` : null,
    pretes ? `${pretes} prête${pluriel(pretes)}` : null,
    aValider ? `${aValider} à valider` : null,
    aReprendre ? `${aReprendre} à reprendre` : null,
  ].filter((t): t is string => t !== null);
}
