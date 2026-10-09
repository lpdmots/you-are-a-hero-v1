// Point 9 : le contrôle « côté serveur », testé sans passer par l'interface.
import { describe, expect, it } from 'vitest';

import { type Contexte, type Doc, type Role, action, choixAuto, choixPerso, note, recit, renvoi } from '../src/modele';
import { validerEnregistrement } from '../src/validation';

const chapitres: Record<string, string> = { S015: 'La lisière', S016: 'La lisière', S018: 'La lisière', S040: 'Le marais' };
const ctx = (role: Role, chapitreScene = 'La lisière'): Contexte => ({ role, chapitreScene, chapitreDe: (id) => chapitres[id] });
const valider = (ancien: Doc, nouveau: Doc, role: Role, chapitre?: string) =>
  validerEnregistrement({ ancien, nouveau, ctx: ctx(role, chapitre), sceneExiste: (id) => id in chapitres });
const copie = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const protege = recit("À l'orée du bois, Lou s'arrêta.", { protege: true });
const libre = recit('Lou fit un pas, puis un autre.');
const interne = choixAuto('Traverser le pont', 'S018');
const mixte = choixPerso('La porte', ['Ouvre au ', renvoi('S016'), ' ou va au ', renvoi('S040'), '.']);
const jeu = action('Ajoute le couteau à ton inventaire.');
const base: Doc = [protege, libre, interne, jeu, mixte];

describe('ce qui reste permis', () => {
  it("l'élève écrit autour des blocs protégés", () => {
    const nouveau = copie(base);
    nouveau[1].children = [{ text: 'Lou courut.' }];
    nouveau.splice(1, 0, recit('Un paragraphe avant.'));
    nouveau.push(recit('Un paragraphe après.'));
    expect(valider(base, nouveau, 'propositions')).toEqual({ ok: true });
  });
  it("F06-AC46 : l'élève « organisation » reformule un choix interne", () => {
    const nouveau = copie(base);
    nouveau[2] = { ...copie(interne), mode: 'perso', children: [{ text: 'Si tu oses, traverse au ' }, interne.children[1], { text: '.' }] };
    expect(valider(base, nouveau, 'organisation')).toEqual({ ok: true });
  });
  it("l'élève « organisation » ajoute un choix interne et une action de jeu", () => {
    expect(valider(base, [...copie(base), choixAuto('Rebrousser chemin', 'S016'), action('Retire un point.')], 'organisation')).toEqual({ ok: true });
  });
  it("F06-AC51 : l'adulte corrige un paragraphe protégé", () => {
    const nouveau = copie(base);
    nouveau[0].children = [{ text: "À l'orée du bois, Lou s'arrêta net." }];
    expect(valider(base, nouveau, 'adulte')).toEqual({ ok: true });
  });
});

describe('refus pour le profil « écriture et propositions »', () => {
  const refuse = (nouveau: Doc, motif: RegExp) => {
    const v = valider(base, nouveau, 'propositions');
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.refus.join(' | ')).toMatch(motif);
  };
  it('F06-AC45 : phrase de choix reformulée, destination inchangée', () => {
    const nouveau = copie(base);
    (nouveau[2] as typeof interne).libelle = "Nager jusqu'à l'autre rive";
    refuse(nouveau, /bloc protégé modifié \(choix/);
  });
  it('F05-AC29 : phrase de choix supprimée', () => refuse(copie(base).filter((b) => b.type !== 'choix'), /bloc protégé supprimé \(choix/));
  it('destination changée', () => {
    const nouveau = copie(base);
    (nouveau[2].children[1] as { cible: string }).cible = 'S016';
    refuse(nouveau, /bloc protégé modifié/);
  });
  it('F06-AC50 : paragraphe protégé modifié ou supprimé', () => {
    const modifie = copie(base);
    modifie[0].children = [{ text: 'Autre texte.' }];
    refuse(modifie, /bloc protégé modifié \(p/);
    refuse(copie(base).slice(1), /bloc protégé supprimé \(p/);
  });
  it('protection retirée par un élève', () => {
    const nouveau = copie(base);
    delete (nouveau[0] as { protege?: boolean }).protege;
    refuse(nouveau, /bloc protégé modifié/);
  });
  it('F05-AC32 : phrase de choix ajoutée par collage', () => refuse([...copie(base), choixAuto('Fuir', 'S016')], /ajout sans le droit requis \(choix/));
  it('F04-AC30 : action de jeu ajoutée, modifiée ou supprimée', () => {
    refuse([...copie(base), action('Retire un point.')], /ajout sans le droit requis \(action/);
    const modifie = copie(base);
    modifie[3].children = [{ text: 'Ajoute deux couteaux.' }];
    refuse(modifie, /bloc protégé modifié \(action/);
    refuse(copie(base).filter((b) => b.type !== 'action'), /bloc protégé supprimé \(action/);
  });
  it('paragraphe de récit transformé en action de jeu ou protégé', () => {
    const enAction = copie(base);
    (enAction[1] as { type: string }).type = 'action';
    refuse(enAction, /bloc transformé sans le droit requis/);
    const enProtege = copie(base);
    (enProtege[1] as { protege?: boolean }).protege = true;
    refuse(enProtege, /bloc transformé sans le droit requis/);
  });
  it('paragraphe protégé ajouté', () => refuse([...copie(base), recit('Nouveau.', { protege: true })], /ajout sans le droit requis \(p/));
  it('blocs protégés intervertis', () => {
    const nouveau = copie(base);
    [nouveau[2], nouveau[3]] = [nouveau[3], nouveau[2]];
    refuse(nouveau, /ordre des blocs protégés modifié/);
  });
  it("note de l'enseignant envoyée par un élève", () => refuse([...copie(base), note('Solution.')], /note de l'enseignant/));
});

describe('refus pour le profil « écriture et organisation »', () => {
  it('F06-AC52 : phrase mêlant renvoi interne et raccord', () => {
    const nouveau = copie(base);
    nouveau[4].children[0] = { text: 'Pousse la porte au ' };
    const v = valider(base, nouveau, 'organisation');
    expect(v.ok).toBe(false);
  });
  it("F06-AC13 : raccord créé vers un autre chapitre, ou choix interne détourné", () => {
    expect(valider(base, [...copie(base), choixAuto('Gagner le marais', 'S040')], 'organisation').ok).toBe(false);
    const detourne = copie(base);
    (detourne[2].children[1] as { cible: string }).cible = 'S040';
    expect(valider(base, detourne, 'organisation').ok).toBe(false);
  });
  it('F05-AC32 : choix de « La lisière » collé dans une scène du marais', () => {
    const marais: Doc = [recit("L'eau noire clapotait.")];
    const v = valider(marais, [...copie(marais), copie(interne)], 'organisation', 'Le marais');
    expect(v.ok).toBe(false);
  });
  it('F06-AC50 : paragraphe protégé intouchable aussi pour ce profil', () => {
    expect(valider(base, copie(base).slice(1), 'organisation').ok).toBe(false);
  });
  it("action de jeu protégée par l'enseignant", () => {
    const ancien: Doc = [action('Ajoute la corde.', { protege: true })];
    const nouveau = copie(ancien);
    nouveau[0].children = [{ text: 'Ajoute deux cordes.' }];
    expect(valider(ancien, nouveau, 'organisation').ok).toBe(false);
  });
});

describe('règles de structure, adulte compris (points 1 et 14)', () => {
  const refuse = (nouveau: Doc, motif: RegExp) => {
    const v = valider(base, nouveau, 'adulte');
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.refus.join(' | ')).toMatch(motif);
  };
  it('renvoi dans un paragraphe de récit', () => {
    const nouveau = copie(base);
    (nouveau[1].children as unknown[]).push(renvoi('S018'), { text: '' });
    refuse(nouveau, /hors d'une phrase de choix \(p/);
  });
  it('renvoi dans une action de jeu', () => {
    const nouveau = copie(base);
    (nouveau[3].children as unknown[]).push(renvoi('S018'), { text: '' });
    refuse(nouveau, /hors d'une phrase de choix \(action/);
  });
  it('phrase de choix sans renvoi', () => {
    const nouveau = copie(base);
    nouveau[2].children = [{ text: 'Traverser le pont.' }];
    refuse(nouveau, /sans renvoi/);
  });
  it('renvoi vers une scène inconnue', () => refuse([...copie(base), choixAuto('Partir', 'S999')], /scène inconnue/));
  it('identité en double', () => refuse([...copie(base), copie(interne)], /identité en double/));
  it('texte saisi dans une phrase automatique', () => {
    const nouveau = copie(base);
    nouveau[2].children[0] = { text: 'Texte glissé' };
    refuse(nouveau, /phrase automatique/);
  });
});
