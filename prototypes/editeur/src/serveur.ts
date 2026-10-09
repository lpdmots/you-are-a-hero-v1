// Faux serveur en mémoire. Il tient les scènes, les numéros imprimés, la
// formule du livre, les liaisons cachées et les copies de récupération.
// Tout enregistrement passe par validerEnregistrement.

import {
  type Bloc,
  type Contexte,
  type Doc,
  type Lien,
  type Livre,
  type Role,
  action,
  choixAuto,
  choixPerso,
  idsDe,
  liensDe,
  note,
  nouvelId,
  recit,
  renvoi,
  renvoisDe,
  sansNotes,
} from './modele';
import { validerEnregistrement } from './validation';

export type Liaison = { id: string; cible: string; numeroFixe: number; libelle?: string };
export type Scene = {
  id: string;
  titre: string;
  chapitre: string;
  doc: Doc;
  version: number;
  liaisons: Liaison[];
};
export type Copie = { id: string; sceneId: string; doc: Doc; role: Role; versionConnue: number };

/** Ce qu'un élève reçoit d'une liaison cachée : le numéro, rien d'autre. */
export type LiaisonVue = { id: string; numero: number; cible?: string };
export type Vue = { sceneId: string; doc: Doc; version: number; liaisons: LiaisonVue[] };

export type Resultat =
  | { etat: 'enregistre'; version: number; idsRemplaces: Record<string, string> }
  | { etat: 'refuse'; refus: string[] }
  | { etat: 'conflit'; copieId: string };

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export class Serveur {
  scenes = new Map<string, Scene>();
  numeros = new Map<string, number>();
  formule = 'rends-toi au';
  copies: Copie[] = [];
  private ecouteurs = new Set<() => void>();
  private etat = 0;

  constructor(scenes: Scene[] = [], numeros: Record<string, number> = {}) {
    for (const s of scenes) this.scenes.set(s.id, s);
    for (const [id, n] of Object.entries(numeros)) this.numeros.set(id, n);
  }

  abonner = (f: () => void) => {
    this.ecouteurs.add(f);
    return () => this.ecouteurs.delete(f);
  };
  instantane = () => this.etat;
  private signaler() {
    this.etat += 1;
    for (const f of this.ecouteurs) f();
  }

  livre(): Livre {
    return { formule: this.formule, numeroDe: (id) => this.numeros.get(id) };
  }
  chapitreDe = (id: string) => this.scenes.get(id)?.chapitre;
  sceneExiste = (id: string) => this.scenes.has(id);
  contexte(sceneId: string, role: Role): Contexte {
    return { role, chapitreScene: this.chapitreDe(sceneId) ?? '', chapitreDe: this.chapitreDe };
  }

  /** Ce que le navigateur reçoit. Pour un élève : ni note, ni cible de liaison cachée. */
  vuePour(sceneId: string, role: Role): Vue {
    const s = this.scenes.get(sceneId);
    if (!s) throw new Error(`scène inconnue : ${sceneId}`);
    const adulte = role === 'adulte';
    return {
      sceneId,
      doc: clone(adulte ? s.doc : sansNotes(s.doc)),
      version: s.version,
      liaisons: s.liaisons.map((l) =>
        adulte ? { id: l.id, numero: l.numeroFixe, cible: l.cible } : { id: l.id, numero: l.numeroFixe }
      ),
    };
  }

  enregistrer(p: { sceneId: string; doc: Doc; versionConnue: number; role: Role }): Resultat {
    const s = this.scenes.get(p.sceneId);
    if (!s) return { etat: 'refuse', refus: ['scène inconnue'] };
    if (p.versionConnue !== s.version) {
      // F08.1 : le texte courant n'est pas remplacé ; la saisie est conservée à part.
      const copie: Copie = { id: nouvelId('copie'), sceneId: s.id, doc: clone(p.doc), role: p.role, versionConnue: p.versionConnue };
      this.copies.push(copie);
      this.signaler();
      return { etat: 'conflit', copieId: copie.id };
    }
    const verdict = validerEnregistrement({
      ancien: s.doc,
      nouveau: p.doc,
      ctx: this.contexte(s.id, p.role),
      sceneExiste: this.sceneExiste,
    });
    if (!verdict.ok) return { etat: 'refuse', refus: verdict.refus };

    let doc = clone(p.doc);
    if (p.role !== 'adulte') doc = reposerNotes(s.doc, doc);

    // Une identité de bloc ou de renvoi ne vit que dans une scène. Si elle
    // existe déjà ailleurs (annulation d'un couper après collage), l'entrant
    // devient un autre choix.
    const ailleurs = new Set<string>();
    for (const autre of this.scenes.values()) if (autre.id !== s.id) for (const id of idsDe(autre.doc)) ailleurs.add(id);
    const idsRemplaces: Record<string, string> = {};
    const neuf = (id: string, prefixe: string) => {
      if (!ailleurs.has(id)) return id;
      idsRemplaces[id] = nouvelId(prefixe);
      return idsRemplaces[id];
    };
    for (const bloc of doc) {
      bloc.id = neuf(bloc.id, bloc.type[0]);
      for (const r of renvoisDe(bloc)) r.id = neuf(r.id, 'r');
    }

    s.doc = doc;
    s.version += 1;
    this.signaler();
    return { etat: 'enregistre', version: s.version, idsRemplaces };
  }

  creerScene(titre: string, chapitre: string): Scene {
    const refs = [...this.scenes.keys()].map((id) => Number(id.slice(1))).filter((n) => !Number.isNaN(n));
    const id = `S${String(Math.max(0, ...refs) + 1).padStart(3, '0')}`;
    const scene: Scene = { id, titre, chapitre, doc: [recit('')], version: 1, liaisons: [] };
    this.scenes.set(id, scene);
    this.numeros.set(id, Math.max(0, ...this.numeros.values()) + 1);
    this.signaler();
    return scene;
  }

  /** Simule l'enregistrement d'une autre session sur la même scène. */
  autreSession(sceneId: string, transformer: (doc: Doc) => Doc) {
    const s = this.scenes.get(sceneId)!;
    return this.enregistrer({ sceneId, doc: transformer(clone(s.doc)), versionConnue: s.version, role: 'adulte' });
  }

  ajouterLiaison(sceneId: string, cible: string, libelle?: string): Liaison {
    const liaison: Liaison = { id: nouvelId('liaison'), cible, numeroFixe: this.numeros.get(cible) ?? 0, libelle };
    this.scenes.get(sceneId)!.liaisons.push(liaison);
    this.signaler();
    return liaison;
  }
  retirerLiaison(sceneId: string, liaisonId: string) {
    const s = this.scenes.get(sceneId)!;
    s.liaisons = s.liaisons.filter((l) => l.id !== liaisonId);
    this.signaler();
  }

  definirNumero(sceneId: string, numero: number) {
    this.numeros.set(sceneId, numero);
    this.signaler();
  }
  definirFormule(formule: string) {
    this.formule = formule;
    this.signaler();
  }

  /** Graphe déduit des seuls textes courants : une copie de récupération n'y figure jamais. */
  liens(): Lien[] {
    return [...this.scenes.values()].flatMap((s) => liensDe(s.id, s.doc));
  }
}

/** Replace les notes de l'enseignant, que l'élève n'a jamais reçues, après le même bloc. */
export function reposerNotes(ancien: Doc, nouveau: Doc): Doc {
  const resultat: Bloc[] = [...nouveau];
  ancien.forEach((bloc, i) => {
    if (bloc.type !== 'note') return;
    // Dernier bloc précédent encore présent ; à défaut, début de la scène.
    let index = -1;
    for (let j = i - 1; j >= 0 && index === -1; j -= 1) index = resultat.findIndex((b) => b.id === ancien[j].id);
    resultat.splice(index + 1, 0, bloc);
  });
  return resultat;
}

export const CHAPITRES = ['La lisière', 'Le marais'] as const;

export function jeuDeDepart(): Serveur {
  const s015: Doc = [
    recit("À l'orée du bois, Lou s'arrêta.", { protege: true }),
    recit('Lou fit un pas, puis un autre.'),
    choixAuto('Continuer vers la lumière', 'S018'),
    recit('Le chant reprit, plus proche.'),
    action('Ajoute le couteau à ton inventaire.'),
    choixPerso('La porte', [
      "Si tu as la clé d'argent, ouvre la porte au ",
      renvoi('S016', 'Ouvrir la porte'),
      ' ; sinon, traverse le marais au ',
      renvoi('S040', 'Traverser le marais'),
      '.',
    ]),
    note("Solution de l'énigme : compter les pierres du muret."),
  ];
  const s016: Doc = [recit('Le sentier montait entre les fougères.'), recit('Lou hésita.')];
  const scene = (id: string, titre: string, chapitre: string, doc: Doc, liaisons: Liaison[] = []): Scene => ({
    id,
    titre,
    chapitre,
    doc,
    version: 1,
    liaisons,
  });
  return new Serveur(
    [
      scene('S014', 'Carrefour', 'La lisière', [recit('Trois chemins partaient du carrefour.')]),
      scene('S015', 'Orée du bois', 'La lisière', s015, [{ id: 'liaison-1', cible: 'S062', numeroFixe: 38 }]),
      scene('S016', 'Sentier des fougères', 'La lisière', s016),
      scene('S018', 'Clairière', 'La lisière', [recit('La clairière baignait dans une lumière dorée.')]),
      scene('S040', 'Berge du marais', 'Le marais', [recit("L'eau noire clapotait contre la berge.")]),
      scene('S062', 'Salle des brumes', 'Le marais', [recit('La brume couvrait le sol de la salle.')]),
    ],
    { S014: 17, S015: 20, S016: 22, S018: 21, S040: 33, S062: 38 }
  );
}
