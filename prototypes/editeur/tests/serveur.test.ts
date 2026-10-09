// Points 10, 11 et 13 côté données : sauvegarde concurrente, contenu réservé
// à l'adulte, même texte partout et graphe déduit.
import { describe, expect, it } from 'vitest';

import { type Choix, type Doc, choixAuto, choixPerso, recit, renvoi, texteBloc } from '../src/modele';
import { jeuDeDepart, reposerNotes } from '../src/serveur';

const copie = <T>(v: T): T => JSON.parse(JSON.stringify(v));

describe('point 10 — sauvegarde concurrente (F08.1)', () => {
  it('F08-AC01 et AC02 : la version ancienne ne remplace rien ; les deux textes sont conservés', () => {
    const s = jeuDeDepart();
    const alice = s.vuePour('S016', 'organisation');
    const bilal = s.vuePour('S016', 'organisation');
    const texteAlice: Doc = [...alice.doc, recit("Texte d'Alice."), choixAuto('Monter', 'S018')];
    expect(s.enregistrer({ sceneId: 'S016', doc: texteAlice, versionConnue: alice.version, role: 'organisation' }).etat).toBe('enregistre');
    const liensAvant = copie(s.liens());

    const texteBilal: Doc = [...bilal.doc, recit('Texte de Bilal.'), choixAuto('Redescendre', 'S014')];
    const r = s.enregistrer({ sceneId: 'S016', doc: texteBilal, versionConnue: bilal.version, role: 'organisation' });
    expect(r.etat).toBe('conflit');

    // Texte courant : celui d'Alice, intact.
    expect(JSON.stringify(s.scenes.get('S016')!.doc)).toContain("Texte d'Alice.");
    expect(JSON.stringify(s.scenes.get('S016')!.doc)).not.toContain('Texte de Bilal.');
    // Copie de récupération : la saisie de Bilal, renvoi compris.
    expect(s.copies).toHaveLength(1);
    expect(JSON.stringify(s.copies[0].doc)).toContain('Texte de Bilal.');
    expect((s.copies[0].doc.at(-1) as Choix).children[1]).toMatchObject({ type: 'renvoi', cible: 'S014' });
    // Graphe : aucun lien venu de la copie, aucun lien d'Alice perdu.
    expect(s.liens()).toEqual(liensAvant);
    expect(s.liens().some((l) => l.de === 'S016' && l.vers === 'S014')).toBe(false);
    expect(s.liens().some((l) => l.de === 'S016' && l.vers === 'S018')).toBe(true);
  });

  it('un enregistrement refusé ne touche ni au texte ni au graphe', () => {
    const s = jeuDeDepart();
    const vue = s.vuePour('S015', 'propositions');
    const avant = copie(s.scenes.get('S015')!.doc);
    const liens = copie(s.liens());
    const r = s.enregistrer({ sceneId: 'S015', doc: vue.doc.filter((b) => b.type !== 'choix'), versionConnue: vue.version, role: 'propositions' });
    expect(r.etat).toBe('refuse');
    expect(s.scenes.get('S015')!.doc).toEqual(avant);
    expect(s.liens()).toEqual(liens);
    expect(s.scenes.get('S015')!.version).toBe(1);
  });

  it('identité déjà présente dans une autre scène : le serveur en fait un autre choix', () => {
    const s = jeuDeDepart();
    const choix = s.scenes.get('S015')!.doc[2] as Choix;
    const vue = s.vuePour('S016', 'adulte');
    const r = s.enregistrer({ sceneId: 'S016', doc: [...vue.doc, copie(choix)], versionConnue: vue.version, role: 'adulte' });
    expect(r.etat).toBe('enregistre');
    if (r.etat === 'enregistre') expect(Object.keys(r.idsRemplaces)).toHaveLength(2);
    const ids = s.liens().map((l) => l.renvoiId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('point 11 — contenu réservé à l’adulte', () => {
  it("F05-AC37 : l'élève reçoit le numéro à obtenir, ni la cible ni la note", () => {
    const s = jeuDeDepart();
    const recu = JSON.stringify(s.vuePour('S015', 'propositions'));
    expect(recu).not.toContain('Solution de l');
    expect(recu).not.toContain('"note"');
    expect(s.vuePour('S015', 'propositions').liaisons).toEqual([{ id: 'liaison-1', numero: 38 }]);
    expect(JSON.stringify(s.vuePour('S015', 'propositions').liaisons)).not.toContain('S062');
    // L'adulte, lui, reçoit tout.
    expect(JSON.stringify(s.vuePour('S015', 'adulte'))).toContain('Solution de l');
    expect(s.vuePour('S015', 'adulte').liaisons[0].cible).toBe('S062');
  });

  it("la note de l'enseignant survit à l'enregistrement d'un élève, à sa place", () => {
    const s = jeuDeDepart();
    const vue = s.vuePour('S015', 'organisation');
    const doc = [...vue.doc, recit('Suite écrite par Bilal.')];
    expect(s.enregistrer({ sceneId: 'S015', doc, versionConnue: vue.version, role: 'organisation' }).etat).toBe('enregistre');
    const types = s.scenes.get('S015')!.doc.map((b) => b.type);
    expect(types).toEqual(['p', 'p', 'choix', 'p', 'action', 'choix', 'note', 'p']);
  });

  it('note replacée même si le bloc qui la précédait a disparu', () => {
    const a = recit('A');
    const b = recit('B');
    const n = { type: 'note' as const, id: 'n1', children: [{ text: 'Rappel.' }] };
    expect(reposerNotes([a, b, n], [a]).map((x) => x.id)).toEqual([a.id, 'n1']);
    expect(reposerNotes([n, a], [a]).map((x) => x.id)).toEqual(['n1', a.id]);
  });
});

describe('point 13 — même contenu partout', () => {
  it('F05-AC09 : la phrase à deux renvois donne le même texte quel que soit le lecteur', () => {
    const phrase = choixPerso('La porte', ["Si tu as la clé d'argent, ouvre la porte au ", renvoi('B'), ' ; sinon, déchiffre les symboles au ', renvoi('C'), '.']);
    const livre = { formule: 'rends-toi au', numeroDe: (id: string) => ({ B: 33, C: 36 })[id] };
    expect(texteBloc(phrase, livre)).toBe("Si tu as la clé d'argent, ouvre la porte au 33 ; sinon, déchiffre les symboles au 36.");
  });
  it('F05-AC10 : la phrase automatique suit la formule du livre sans que le document change', () => {
    const phrase = choixAuto('Suivre le chant', 'S009');
    const avant = JSON.stringify(phrase);
    const numeroDe = () => 9;
    expect(texteBloc(phrase, { formule: 'rends-toi au', numeroDe })).toBe('Suivre le chant : rends-toi au 9.');
    expect(texteBloc(phrase, { formule: 'va au', numeroDe })).toBe('Suivre le chant : va au 9.');
    expect(JSON.stringify(phrase)).toBe(avant);
  });
  it('F05-AC11 : la construction retenue est enregistrée, donc stable', () => {
    const phrase = choixAuto('Suivre le chant', 'S009', 2);
    expect(texteBloc(phrase, { formule: 'rends-toi au', numeroDe: () => 9 })).toBe('Si tu veux suivre le chant, rends-toi au 9.');
  });
  it('F05-AC17 : renvoi vide pour une destination à décider', () => {
    expect(texteBloc(choixAuto('Faire demi-tour', null), { formule: 'rends-toi au', numeroDe: () => undefined })).toBe('Faire demi-tour : rends-toi au ?.');
  });
  it('le graphe se déduit des renvois, sans seconde saisie', () => {
    const s = jeuDeDepart();
    expect(s.liens().map((l) => `${l.de}>${l.vers}`)).toEqual(['S015>S018', 'S015>S016', 'S015>S040']);
  });
});
