"use client";

import { unstable_rethrow, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ClipboardEvent, type KeyboardEvent } from "react";
import { Etapes } from "@/composants/Etapes";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import {
  construireLot, lireLignes, lirePersonne, nomPourEleves, pointsARegler, trier,
  type Eleve, type LigneLot, type Personne, type PointARegler, type ProfilConnu,
} from "@/domaine/eleves";
import { majuscule, pluriel } from "@/domaine/texte";
import { inscrireEleves } from "../../actions";
import styles from "./inscrire.module.css";

const prenomDe = (l: LigneLot): string => (l.type === "connu" ? l.eleve.prenom : l.prenom);
const nomDe = (l: LigneLot): string => (l.type === "connu" ? (l.eleve.nom ?? "") : l.nom);

/** Une ligne de la feuille de saisie : deux cases, prénom et nom (décision du 9 octobre 2026). */
type Rang = { cle: number; prenom: string; nom: string };
const LIGNES_AU_DEPART = 5;
const ecrit = (r: Rang): boolean => !!(r.prenom.trim() || r.nom.trim());
let numero = 0;
const ligne = (prenom = "", nom = ""): Rang => ({ cle: (numero += 1), prenom, nom });

export function Inscrire({ classeId, inscrits, connus }: { classeId: string; inscrits: Eleve[]; connus: ProfilConnu[] }) {
  const routeur = useRouter();
  const avecConnus = connus.length > 0;
  const [etape, setEtape] = useState(avecConnus ? 1 : 2);
  const [coches, setCoches] = useState<Set<string>>(new Set());
  const [rangs, setRangs] = useState<Rang[]>(() => Array.from({ length: LIGNES_AU_DEPART }, () => ligne()));
  const [oubli, setOubli] = useState<number | null>(null);
  const [lignes, setLignes] = useState<LigneLot[]>([]);
  const [edition, setEdition] = useState<{ rang: number; prenom: string; nom: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, lancer] = useTransition();
  const titre = useRef<HTMLHeadingElement>(null);
  const aRegler = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titre.current?.focus();
  }, [etape]);

  const noms = avecConnus ? ["Élèves déjà connus", "Nouveaux élèves", "Vérifier"] : ["Vos élèves", "Vérifier"];
  const rang = avecConnus ? etape : etape - 1;
  const nb = rangs.filter((r) => r.prenom.trim()).length;

  // La feuille finit toujours par une ligne vide : écrire dans la dernière en ajoute une
  const ranger = (suivants: Rang[]): Rang[] => {
    const garde = [...suivants];
    while (garde.length && !ecrit(garde[garde.length - 1])) garde.pop();
    garde.push(ligne());
    while (garde.length < LIGNES_AU_DEPART) garde.push(ligne());
    return garde;
  };
  const ecrire = (i: number, morceau: Partial<Rang>) => {
    setOubli(null);
    setRangs((r) => ranger(r.map((x, k) => (k === i ? { ...x, ...morceau } : x))));
  };
  // Une liste collée remplit les lignes à partir de celle où l'on colle
  const coller = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const colle = e.clipboardData.getData("text");
    if (!/[\n\t]/.test(colle)) return;
    e.preventDefault();
    const personnes: Personne[] = lireLignes(colle);
    if (!personnes.length) return;
    setOubli(null);
    setRangs((r) =>
      ranger([
        ...r.slice(0, i),
        ...(ecrit(r[i]) ? [r[i]] : []),
        ...personnes.map((p) => ligne(p.prenom, p.nom ?? "")),
        ...r.slice(i + 1),
      ]),
    );
  };
  const ligneSuivante = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    document.getElementById(`eleve-prenom-${i + 1}`)?.focus();
  };

  const suite = () => {
    if (etape === 2) {
      const sansPrenom = rangs.findIndex((r) => !r.prenom.trim() && r.nom.trim());
      if (sansPrenom >= 0) {
        setOubli(sansPrenom);
        document.getElementById(`eleve-prenom-${sansPrenom}`)?.focus();
        return;
      }
      const nouveaux = rangs.map((r) => lirePersonne(r.prenom, r.nom)).filter((x): x is Personne => x !== null);
      setLignes(construireLot(connus, coches, nouveaux));
      setEdition(null);
      setErreur(null);
    }
    setEtape(etape + 1);
  };
  const retour = () => setEtape(etape - 1);
  const basculer = (id: string, coche: boolean) =>
    setCoches((avant) => {
      const apres = new Set(avant);
      if (coche) apres.add(id);
      else apres.delete(id);
      return apres;
    });
  const remplacer = (i: number, ligne: LigneLot) => setLignes((l) => l.map((x, k) => (k === i ? ligne : x)));

  const inscrire = () => {
    setErreur(null);
    lancer(async () => {
      let r: Awaited<ReturnType<typeof inscrireEleves>>;
      try {
        r = await inscrireEleves(
          classeId,
          lignes.filter((l) => l.type === "connu").map((l) => (l.type === "connu" ? l.eleve.id : "")),
          lignes.filter((l) => l.type === "neuf").map((l) => ({ prenom: prenomDe(l), nom: nomDe(l) || null })),
          lignes.flatMap((l) => (l.type === "connu" && l.nomDonne ? [{ id: l.eleve.id, nom: l.eleve.nom ?? "" }] : [])),
        );
      } catch (incident) {
        // L'envoi n'est pas arrivé : la liste préparée reste à l'écran, au lieu de l'écran d'incident
        unstable_rethrow(incident);
        setErreur("L’envoi n’a pas abouti. Votre liste est gardée : vérifiez la connexion à internet, puis réessayez.");
        return;
      }
      if (!r.ok) {
        setErreur(r.erreur);
        return;
      }
      routeur.push(`/classes/${classeId}?message=inscrits&nombre=${r.nombre}`);
    });
  };

  let corps;
  if (etape === 1) {
    const groupes = [...new Set(connus.map((e) => e.de))];
    corps = (
      <>
        <h2 id="lot-t" tabIndex={-1} ref={titre}>
          Qui retrouvez-vous cette année ?
        </h2>
        <p className={styles.aide}>Un élève coché garde son code et ses anciens textes.</p>
        {groupes.map((groupe) => {
          const membres = trier(connus.filter((e) => e.de === groupe));
          const tous = membres.every((e) => coches.has(e.id));
          return (
            <section key={groupe} className={styles.connus}>
              <header>
                <h3>{groupe}</h3>
                <button type="button" className="lien" onClick={() => membres.forEach((e) => basculer(e.id, !tous))}>
                  {tous ? "Tout décocher" : "Tout cocher"}
                </button>
              </header>
              <ul>
                {membres.map((e) => (
                  <li key={e.id}>
                    <label className={styles.connu}>
                      <input type="checkbox" className="case" checked={coches.has(e.id)} onChange={(ev) => basculer(e.id, ev.target.checked)} />
                      <Gommette prenom={e.prenom} couleur={e.couleur} taille="s" />
                      <span>
                        <b>{e.prenom}</b> {e.nom}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <footer className={styles.pied}>
          <p>
            <b>{coches.size}</b> élève{pluriel(coches.size)} coché{pluriel(coches.size)}
          </p>
          <button type="button" className="btn btn--primaire btn--grand" onClick={suite}>
            Continuer
            <Icone nom="fleche" />
          </button>
        </footer>
      </>
    );
  } else if (etape === 2) {
    corps = (
      <>
        <h2 id="lot-t" tabIndex={-1} ref={titre}>
          {avecConnus ? "Les nouveaux élèves" : "Vos élèves"}
        </h2>
        <p className={styles.aide}>Un élève par ligne. Vous pouvez aussi coller une liste.</p>
        <div className={styles.saisie} role="group" aria-labelledby="lot-t">
          <p className={styles.saisieTete} aria-hidden="true">
            <span />
            <span>Prénom</span>
            <span>
              Nom <span className="facultatif">facultatif</span>
            </span>
          </p>
          <ol>
            {rangs.map((r, i) => (
              <li key={r.cle}>
                <span className={styles.saisieRang} aria-hidden="true">
                  {i + 1}
                </span>
                <input
                  className="pchamp"
                  id={`eleve-prenom-${i}`}
                  type="text"
                  value={r.prenom}
                  aria-label={`Prénom, ligne ${i + 1}`}
                  aria-invalid={oubli === i ? true : undefined}
                  maxLength={40}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => ecrire(i, { prenom: e.target.value })}
                  onPaste={(e) => coller(i, e)}
                  onKeyDown={(e) => ligneSuivante(i, e)}
                />
                <input
                  className="pchamp"
                  type="text"
                  value={r.nom}
                  aria-label={`Nom, ligne ${i + 1}`}
                  maxLength={60}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => ecrire(i, { nom: e.target.value })}
                  onPaste={(e) => coller(i, e)}
                  onKeyDown={(e) => ligneSuivante(i, e)}
                />
                {ecrit(r) ? (
                  <button type="button" className={styles.recapCmd} aria-label={`Effacer la ligne ${i + 1}`} onClick={() => { setOubli(null); setRangs((x) => ranger(x.filter((_, k) => k !== i))); }}>
                    <Icone nom="fermer" />
                  </button>
                ) : (
                  <span className={styles.recapCmd} aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>
        {oubli !== null ? (
          <p className={`erreur ${styles.erreur}`} role="alert">
            <Icone nom="alerte" />
            <span>Ligne {oubli + 1} : écrivez le prénom.</span>
          </p>
        ) : null}
        <footer className={styles.pied}>
          <p>
            <b>{nb}</b> <span>{avecConnus ? (nb > 1 ? "nouveaux élèves" : "nouvel élève") : `élève${pluriel(nb)}`}</span>
          </p>
          {avecConnus ? (
            <button type="button" className="btn btn--grand" onClick={retour}>
              Retour
            </button>
          ) : null}
          <button type="button" className="btn btn--primaire btn--grand" disabled={!nb && !coches.size} onClick={suite}>
            Continuer
            <Icone nom="fleche" />
          </button>
        </footer>
      </>
    );
  } else {
    const points = pointsARegler(inscrits, lignes);
    const nc = lignes.filter((l) => l.type === "connu").length;
    const nn = lignes.length - nc;
    const n = lignes.length;
    const ordre = lignes.map((l, i) => [l, i] as const).sort((a, b) => prenomDe(a[0]).localeCompare(prenomDe(b[0]), "fr"));

    const unPoint = (p: PointARegler) => {
      if (p.sorte === "meme" && p.ligne.meme) {
        const meme = p.ligne.meme;
        return (
          <li key={p.ligne.cle} className={styles.point}>
            <p>
              <b>
                {p.ligne.prenom} {p.ligne.nom}
              </b>{" "}
              était déjà dans {meme.de}. Est-ce le même élève ?
            </p>
            <div className={styles.rang}>
              <button type="button" className="btn" onClick={() => remplacer(p.rang, { type: "connu", eleve: meme })}>
                Oui, le même : il garde son code
              </button>
              <button type="button" className="btn" onClick={() => remplacer(p.rang, { ...p.ligne, meme: null })}>
                Non, un autre élève
              </button>
            </div>
          </li>
        );
      }
      if (p.sorte !== "double") return null;
      const ligne = p.ligne;
      const prenom = prenomDe(ligne);
      const neuf = ligne.type === "neuf";
      const autre: Eleve = { id: "autre", prenom: p.autre.prenom, nom: p.autre.nom, couleur: 0 };
      const lu = nomPourEleves(autre, [autre, { id: "neuf", prenom, nom: null, couleur: 0 }]);
      const donner = (nom: string) =>
        remplacer(p.rang, ligne.type === "neuf" ? { ...ligne, nom } : { ...ligne, eleve: { ...ligne.eleve, nom }, nomDonne: true });
      return (
        <li key={ligne.type === "neuf" ? ligne.cle : ligne.eleve.id} className={styles.point}>
          <p>
            <b>Deux {prenom} dans la classe.</b> Écrivez le nom {neuf ? "du nouveau" : "de l’un des deux"}, ou son initiale : les
            élèves liront « {lu} » et « {prenom} D. ».
          </p>
          <label className={styles.pointChamp}>
            {neuf ? `Nom du nouveau ${prenom}` : `Nom de ${prenom}, déjà connu`}
            <input
              className="pchamp"
              type="text"
              placeholder="Durand, ou D."
              maxLength={60}
              onBlur={(e) => { const v = e.target.value.trim(); if (v) donner(v); }}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            />
          </label>
        </li>
      );
    };

    corps = (
      <>
        <h2 id="lot-t" tabIndex={-1} ref={titre}>
          Vérifiez la liste
        </h2>
        {points.length ? (
          <section className={styles.regler} aria-labelledby="regler-t">
            <h3 id="regler-t" tabIndex={-1} ref={aRegler}>
              <Icone nom="alerte" />
              À régler avant d’inscrire
            </h3>
            <ul>{points.map(unPoint)}</ul>
          </section>
        ) : null}
        <ul className={styles.recap}>
          {ordre.map(([l, i]) =>
            edition?.rang === i && l.type === "neuf" ? (
              <li key={l.cle} className={styles.recapEdition}>
                <input className="pchamp" type="text" value={edition.prenom} aria-label="Prénom" maxLength={40} onChange={(e) => setEdition({ ...edition, prenom: e.target.value })} autoFocus />
                <input className="pchamp" type="text" value={edition.nom} aria-label="Nom, facultatif" placeholder="Nom, facultatif" maxLength={60} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} />
                <button
                  type="button"
                  className="btn btn--petit"
                  onClick={() => {
                    const prenom = edition.prenom.trim().replace(/\s+/g, " ");
                    if (prenom) remplacer(i, { ...l, prenom: majuscule(prenom), nom: edition.nom.trim().replace(/\s+/g, " "), meme: null });
                    setEdition(null);
                  }}
                >
                  Valider
                </button>
              </li>
            ) : (
              <li key={l.type === "connu" ? l.eleve.id : l.cle}>
                <Gommette prenom={prenomDe(l)} couleur={l.type === "connu" ? l.eleve.couleur : (inscrits.length + i) % 10} taille="s" />
                <span className={styles.recapNom}>
                  <b>{prenomDe(l)}</b>
                  {nomDe(l) ? ` ${nomDe(l)}` : ""}
                </span>
                <span className={styles.recapQuoi}>{l.type === "connu" ? "garde son code" : "nouveau"}</span>
                {l.type === "neuf" ? (
                  <button type="button" className={styles.recapCmd} aria-label={`Corriger ${l.prenom}`} onClick={() => setEdition({ rang: i, prenom: l.prenom, nom: l.nom })}>
                    <Icone nom="crayon" />
                  </button>
                ) : (
                  <span className={styles.recapCmd} aria-hidden="true" />
                )}
                <button type="button" className={styles.recapCmd} aria-label={`Retirer ${prenomDe(l)} de la liste`} onClick={() => { setEdition(null); setLignes((x) => x.filter((_, k) => k !== i)); }}>
                  <Icone nom="fermer" />
                </button>
              </li>
            ),
          )}
        </ul>
        {erreur ? (
          <p className={`erreur ${styles.erreur}`} role="alert">
            <Icone nom="alerte" />
            <span>{erreur}</span>
          </p>
        ) : null}
        <footer className={styles.pied}>
          <p>
            <b>
              {n} élève{pluriel(n)}
            </b>
            {points.length ? (
              <>
                {" · "}
                <button type="button" className="lien" onClick={() => { aRegler.current?.scrollIntoView({ block: "center" }); aRegler.current?.focus(); }}>
                  {points.length} point{pluriel(points.length)} à régler
                </button>{" "}
                avant d’inscrire
              </>
            ) : nc && nn ? (
              ` : ${nc} garde${nc > 1 ? "nt" : ""} leur code, ${nn} nouveau${pluriel(nn, "x")}`
            ) : null}
          </p>
          <button type="button" className="btn btn--grand" onClick={retour}>
            Retour
          </button>
          <button type="button" className="btn btn--primaire btn--grand" disabled={!!points.length || !n || enCours} aria-busy={enCours || undefined} onClick={inscrire}>
            Inscrire {n} élève{pluriel(n)}
          </button>
        </footer>
      </>
    );
  }

  return (
    <>
      <Etapes noms={noms} enCours={rang} />
      <section className="etape" aria-labelledby="lot-t">
        {corps}
      </section>
    </>
  );
}
