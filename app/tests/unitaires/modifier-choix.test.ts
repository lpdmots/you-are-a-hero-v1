import { describe, expect, it } from "vitest";
import { peutConstruire, peutOuvrirUnChoix } from "@/domaine/chemins";
import {
  controlerTexte, horsRetouches, morceauxDe, nettoyerTexte, ouPoser, poserDansLeRecit, renvoisDe, voisinsDe,
  type Bloc, type BlocPose, type Choix, type ChoixAuto, type ChoixPerso, type Droits, type Liaison, type Texte,
} from "@/domaine/copie";
import {
  automatisee, avecDestination, avecDestinationsOrdonnees, avecLibelle, avecPhrase, avecUneDestinationDePlus, choixDeLaLiaison, liaisonDuChoix, ongletsDuChoix, sansRenvoi,
  seuleDestination,
} from "@/domaine/modifier-choix";

/**
 * Modifier un choix depuis « Chemins » (F03.1, F03-AC70 à AC76) : les gestes des réglages d'un choix comme
 * règles du texte, et la place où le plan pose une phrase — sans base ni navigateur. Ce que la base en
 * fait est éprouvé dans tests/base/modifier-un-choix.test.ts.
 */

const u = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const [BARQUE, DIGUE, PONTON, TOURBIERE] = [u(1), u(2), u(3), u(4)];
const para = (id: string, texte: string): Bloc => ({ type: "p", id, children: [{ text: texte }] });
const auto = (id: string, libelle: string, cible: string | null): ChoixAuto => ({ type: "choix", id, auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });
/** La phrase telle qu'elle se lit, chaque numéro remplacé par sa destination. */
const lue = (bloc: Choix): string => morceauxDe(bloc, "rends").map((m) => ("texte" in m ? m.texte : "renvoi" in m ? `[${m.cible ?? "…"}]` : "")).join("");
const longer = auto(u(10), "Longer la vieille digue", DIGUE);
const appeler = auto(u(11), "Appeler à l’aide", PONTON);

describe("Modifier un choix depuis « Chemins » : ouvrir (F03.1)", () => {
  it("F03-AC70 — l'onglet d'un choix s'ouvre pour l'adulte qui construit ; les onglets du choix ouvert sont ceux de ses destinations, celui d'un lien caché le sien", () => {
    const adulte = peutConstruire({ adulte: true, aChoix: true, etroit: false });
    expect(peutOuvrirUnChoix({ construit: adulte, loin: false })).toBe(true);
    // Hugo, élève, qui clique le même onglet, ne fait que choisir la carte
    expect(peutOuvrirUnChoix({ construit: peutConstruire({ adulte: false, aChoix: true, etroit: false }), loin: false })).toBe(false);

    expect(ongletsDuChoix(longer)).toEqual([longer.id]);
    const deux = avecUneDestinationDePlus(longer, PONTON, "rends");
    // Une phrase à deux destinations a deux onglets : tous deux restent désignés
    expect(ongletsDuChoix(deux)).toEqual(renvoisDe(deux).map((r) => r.id));
    expect(ongletsDuChoix(deux)).toHaveLength(2);
    const cache: Liaison = { type: "liaison", id: u(20), cible: TOURBIERE, children: [{ text: "" }] };
    expect(ongletsDuChoix(cache)).toEqual([cache.id]);
  });

  it("F03-AC76 — ni l'élève, ni le téléphone, ni la vue de loin, ni un choix que l'IA propose : aucun choix ne s'ouvre pour être modifié", () => {
    const large = peutConstruire({ adulte: true, aChoix: true, etroit: false });
    expect(peutOuvrirUnChoix({ construit: peutConstruire({ adulte: false, aChoix: true, etroit: false }), loin: false })).toBe(false);
    // Un écran de 390 points : la liste, sans schéma ni geste
    expect(peutOuvrirUnChoix({ construit: peutConstruire({ adulte: true, aChoix: true, etroit: true }), loin: false })).toBe(false);
    // Après « Tout voir », les phrases des onglets ne se lisent plus
    expect(peutOuvrirUnChoix({ construit: large, loin: true })).toBe(false);
    expect(peutOuvrirUnChoix({ construit: large, loin: false, propose: true })).toBe(false);
    expect(peutOuvrirUnChoix({ construit: large, loin: false })).toBe(true);
  });
});

describe("Modifier un choix depuis « Chemins » : les réglages de la copie, en entier (F03.1)", () => {
  it("F03-AC71 — chaque geste des réglages rend la phrase d'après, sous la même identité : libellé, destination, phrase, flèche ronde, destination de plus, retrait, ordre, lien caché", () => {
    // Le libellé : la phrase automatique le reprend
    const suivre = avecLibelle(longer, "Suivre la digue");
    expect(suivre).toEqual({ ...longer, libelle: "Suivre la digue" });
    expect(lue(suivre)).toBe(`Suivre la digue : rends-toi au [${DIGUE}].`);

    // Une destination de plus : la phrase s'écrit dès lors à la main, son numéro à la fin
    const deux = avecUneDestinationDePlus(longer, PONTON, "rends") as ChoixPerso;
    expect(deux.id).toBe(longer.id);
    expect(deux.auto).toBeUndefined();
    expect(renvoisDe(deux).map((r) => r.cible)).toEqual([DIGUE, PONTON]);
    expect(lue(deux)).toBe(`${lue(longer)} [${PONTON}]`);

    // L'ordre : les numéros de la phrase restent à leur place et prennent les destinations une à une
    const inverse = avecDestinationsOrdonnees(deux, [PONTON, DIGUE]);
    expect(renvoisDe(inverse).map((r) => r.cible)).toEqual([PONTON, DIGUE]);
    expect(renvoisDe(inverse).map((r) => r.id)).toEqual(renvoisDe(deux).map((r) => r.id));
    expect(avecDestinationsOrdonnees(longer, [PONTON])).toBe(longer);

    // « Retirer » une destination : son numéro quitte la phrase, les textes autour se rejoignent
    const [, second] = renvoisDe(deux);
    const une = sansRenvoi(deux, second.id) as ChoixPerso;
    expect(renvoisDe(une).map((r) => r.cible)).toEqual([DIGUE]);
    expect(une.children.filter((x) => "text" in x)).toHaveLength(2);
    // Le texte nettoyé par le serveur est le même : rien à réunir ni à écarter
    expect(nettoyerTexte([une])).toEqual([une]);

    // La flèche ronde : une autre tournure pour la phrase automatique ; pour la phrase modifiée, le retour à l'automatique
    expect((automatisee(longer, ["neutre", "pour"], () => 0) as ChoixAuto).construction).toBe("pour");
    expect(automatisee(longer, ["neutre"])).toBe(longer);
    const revenue = automatisee(une, ["neutre"], () => 0);
    expect(revenue).toEqual({ ...longer, construction: "neutre" });
    // Avec plusieurs destinations, la phrase s'écrit à la main : rien à faire
    expect(automatisee(deux, ["neutre"])).toBe(deux);

    // « Cacher ce choix (énigme) » : un lien caché vers la même scène, qui garde le libellé ; l'inverse, « Proposer comme choix »
    const liaison = liaisonDuChoix(longer)!;
    expect(liaison).toMatchObject({ type: "liaison", cible: DIGUE, libelle: "Longer la vieille digue" });
    expect(liaison.id).not.toBe(longer.id);
    expect(seuleDestination(deux)).toBeNull();
    expect(liaisonDuChoix(deux)).toBeNull();
    expect(liaisonDuChoix(auto(u(12), "Attendre", null))).toBeNull();
    expect(choixDeLaLiaison(liaison, "Déchiffrer les symboles", ["neutre"], () => 0)).toMatchObject({ auto: true, libelle: "Déchiffrer les symboles", cible: DIGUE, construction: "neutre" });
  });

  it("F03-AC72 — la phrase écrite à la main est « modifiée » : le même bloc, son numéro à sa place, le libellé gardé pour nommer le choix", () => {
    const ecrite = avecPhrase(longer, ["Pour suivre la vieille digue jusqu’au bout, rends-toi au ", "."], "rends") as ChoixPerso;
    expect(ecrite.id).toBe(longer.id);
    expect(ecrite.auto).toBeUndefined();
    expect(ecrite.libelle).toBe("Longer la vieille digue");
    expect(lue(ecrite)).toBe(`Pour suivre la vieille digue jusqu’au bout, rends-toi au [${DIGUE}].`);
    // On continue d'écrire : le numéro ne change pas d'identité d'une frappe à l'autre, son onglet reste le même
    const suite = avecPhrase(ecrite, ["Pour suivre la digue, cours au ", " !"], "rends");
    expect(renvoisDe(suite).map((r) => r.id)).toEqual(renvoisDe(ecrite).map((r) => r.id));
    expect(lue(suite)).toBe(`Pour suivre la digue, cours au [${DIGUE}] !`);
    // Le libellé changé : c'est lui que porte l'onglet ; la phrase automatique le reprend, la phrase modifiée non
    expect(lue(avecLibelle(longer, "Suivre la vieille digue jusqu’au bout"))).toBe(`Suivre la vieille digue jusqu’au bout : rends-toi au [${DIGUE}].`);
    expect(lue(avecLibelle(suite, "Suivre la vieille digue jusqu’au bout"))).toBe(lue(suite));
  });

  it("F03-AC73 — « Appeler à l'aide » mène à la tourbière au lieu du ponton : la phrase automatique suit la destination, la phrase modifiée garde ses mots", () => {
    const vers = avecDestination(appeler, appeler.id, TOURBIERE);
    expect(vers).toEqual({ ...appeler, cible: TOURBIERE });
    expect(lue(vers)).toBe(lue(appeler).replace(PONTON, TOURBIERE));
    // Un autre renvoi que le sien ne change rien
    expect(avecDestination(appeler, u(99), TOURBIERE)).toBe(appeler);

    const ecrite = avecPhrase(appeler, ["Si tu cries, file au ", "."], "rends");
    const [renvoi] = renvoisDe(ecrite);
    const change = avecDestination(ecrite, renvoi.id, TOURBIERE);
    expect(lue(change)).toBe(`Si tu cries, file au [${TOURBIERE}].`);
    expect(change.id).toBe(appeler.id);
    // « Décider plus tard » : sans destination
    expect(renvoisDe(avecDestination(ecrite, renvoi.id, null))[0].cible).toBeNull();
  });
});

describe("Modifier un choix depuis « Chemins » : la place d'une phrase posée par le plan (F03.1, F08.1)", () => {
  const debut = para(u(30), "La barque s’enlise.");
  const plonger = auto(u(13), "Plonger", TOURBIERE);
  const cache: Liaison = { type: "liaison", id: u(21), cible: BARQUE, children: [{ text: "" }] };
  const texte: Texte = [debut, longer, appeler, plonger, cache];
  const pose = (bloc: Choix, place: Partial<BlocPose> = {}): BlocPose => ({ bloc, apres: null, avant: null, ...place });

  it("F03-AC74 — supprimé puis rendu par « Annuler », le choix revient à sa place : après le bloc qui le précédait, sinon avant celui qui le suivait, sinon à la fin du récit", () => {
    // Sa place, relevée à la suppression : ses voisins dans le récit, liens cachés à part
    expect(voisinsDe(texte, appeler.id)).toEqual({ apres: longer.id, avant: plonger.id });
    expect(voisinsDe(texte, plonger.id)).toEqual({ apres: appeler.id, avant: null });
    expect(voisinsDe(texte, u(99))).toEqual({ apres: null, avant: null });

    const sans = [debut, longer, plonger];
    const rendu = pose(appeler, voisinsDe(texte, appeler.id));
    expect(ouPoser(sans, rendu)).toEqual({ index: 2, remplace: false });
    expect(poserDansLeRecit(sans, [rendu]).map((b) => b.id)).toEqual([debut.id, longer.id, appeler.id, plonger.id]);
    // Le bloc qui le précédait n'est plus là : avant celui qui le suivait
    expect(poserDansLeRecit([debut, plonger], [rendu]).map((b) => b.id)).toEqual([debut.id, appeler.id, plonger.id]);
    // Aucun de ses voisins : à la fin du récit, sous ce qui est écrit, au-dessus de la ligne vide où l'on écrit
    const ligne = para(u(31), "");
    expect(poserDansLeRecit([debut, ligne], [rendu]).map((b) => b.id)).toEqual([debut.id, appeler.id, ligne.id]);
    // Le premier choix d'une scène revient en premier
    expect(poserDansLeRecit([appeler, plonger], [pose(longer, { apres: null, avant: appeler.id })]).map((b) => b.id)).toEqual([longer.id, appeler.id, plonger.id]);
  });

  it("F03-AC75 — la phrase modifiée depuis « Chemins » prend la place de celle de la copie, quoi qu'on y ait fait ; le contrôle des droits d'un élève n'y voit pas un bloc qu'il aurait modifié", () => {
    const deLaurent = avecDestination(avecLibelle(longer, "Suivre la vieille digue jusqu’au bout"), longer.id, TOURBIERE);
    // Dans la copie d'Alice, restée à l'ancienne phrase : elle est remplacée à sa place, le reste intact
    const copie = [debut, para(u(32), "Alice écrit."), longer, appeler];
    expect(ouPoser(copie, pose(deLaurent))).toEqual({ index: 2, remplace: true });
    const suite = poserDansLeRecit(copie, [pose(deLaurent)]);
    expect(suite.map((b) => b.id)).toEqual(copie.map((b) => b.id));
    expect(suite[2]).toBe(deLaurent);
    expect(suite[1]).toBe(copie[1]);

    // Alice, « écriture et propositions » : un choix est pour elle un bloc préparé. La scène enregistrée porte la
    // phrase de Mme Laurent ; sa page, partie de la version 1, l'envoie encore telle qu'elle l'avait
    const droits: Droits = { role: "eleve", profil: "propositions", scenesDuChapitre: new Set([DIGUE, PONTON, TOURBIERE]) };
    const enregistre: Texte = [debut, deLaurent, appeler];
    const envoye: Texte = [para(debut.id, "La barque s’enlise, et Alice écrit."), longer, appeler];
    expect(controlerTexte(enregistre, envoye, droits)).toBe("Un bloc préparé a été modifié ou déplacé.");
    const retouches = [{ version: 2, ajoute: [], retire: [], pose: [longer.id] }];
    const hors = horsRetouches(enregistre, envoye, retouches, 1);
    expect(controlerTexte(hors.avant, hors.apres, droits)).toBeNull();
    // Une page à jour, qui change elle-même un choix préparé, reste refusée
    const aJour = horsRetouches(enregistre, envoye, retouches, 2);
    expect(controlerTexte(aJour.avant, aJour.apres, droits)).toBe("Un bloc préparé a été modifié ou déplacé.");
    // Le choix que le plan a rendu par « Annuler », et que la page n'a plus : ce n'est pas un bloc qu'elle aurait supprimé
    const sans = horsRetouches(enregistre, [debut, appeler], retouches, 1);
    expect(controlerTexte(sans.avant, sans.apres, droits)).toBeNull();
    // Ajouté par le plan puis modifié par lui, avant qu'elle n'enregistre : hors du contrôle des deux côtés
    const neuf = auto(u(14), "Grimper", TOURBIERE);
    const puis = [{ version: 2, ajoute: [neuf.id], retire: [] }, { version: 3, ajoute: [], retire: [], pose: [neuf.id] }];
    const tard = horsRetouches([debut, longer, appeler, avecLibelle(neuf, "Grimper au saule")], [debut, longer, appeler], puis, 1);
    expect(controlerTexte(tard.avant, tard.apres, droits)).toBeNull();
  });
});
