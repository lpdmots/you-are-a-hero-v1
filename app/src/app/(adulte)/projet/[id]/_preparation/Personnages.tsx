"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { BoutonDouble } from "@/composants/BoutonDouble";
import { Bulle } from "@/composants/Bulle";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { useEnregistrement } from "@/composants/Enregistrement";
import { Icone } from "@/composants/Icone";
import { deposer, reduire } from "@/composants/importer";
import { useMessage } from "@/composants/Messages";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { nomDeFichier } from "@/domaine/illustration";
import { autresNomsEnTexte, DESCRIPTION_COURTE_MAX, DESCRIPTION_MAX, FICHE_MAX, herosDe, lireAutresNoms, NOM_MAX, type Personnage } from "@/domaine/personnages";
import { AUTRES_PERSONNAGES, HEROS_SANS_NOM } from "@/domaine/preparation";
import type { PersonnageConnu } from "@/serveur/ia/aides/images";
import type { ReponseFiche, ReponseReferences, ReponseReperage, SorteDeCarte } from "@/serveur/personnages";

/** Sans fiche visuelle, l'image de référence ne se crée pas (la même phrase que le serveur). */
const SANS_FICHE = "Décrivez d’abord son apparence.";
import {
  ajouterDesPersonnages, laisserLesPropositions, poserLaReference, reglerPersonnage, remettreDesPersonnages, supprimerDesPersonnages, type CarteSaisie, type CarteSupprimee,
} from "../../actions-personnages";
import styles from "./preparation.module.css";

/**
 * Les personnages de l'histoire (F10.2, F02), sous « Nous retenons » de l'étape Personnages : une
 * fiche par personnage important, son portrait à gauche comme une photo collée dans le cahier,
 * son nom dans la voix du récit, la marque « héros ». Un clic ouvre son panneau : nom, autres
 * noms, description, puis « Pour les images » (fiche visuelle et portrait de référence).
 * « Repérer les personnages » propose des cartes d'après le texte retenu, sans rien créer.
 */

async function demanderAuxPersonnages<R>(corps: Record<string, unknown>, image = false): Promise<R | { ok: false; message: string }> {
  const panne = { ok: false as const, message: image ? MESSAGES_IA.pasDImage : MESSAGES_IA.pasDeReponse };
  try {
    const r = await fetch("/ia/personnages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    if (!r.ok && r.status !== 401 && r.status !== 500) return panne;
    return (await r.json()) as R;
  } catch {
    return panne;
  }
}

export function CartesDesPersonnages({
  projetId, personnages, herosAbsent, projection, avantDeDemander, adresse,
}: {
  projetId: string;
  /** L'adresse d'un onglet : un personnage qui devient héros y passe */
  adresse?: (onglet: string) => string;
  personnages: Personnage[];
  /** Le héros absent des images (options du projet) : son portrait ne sert pas aux images de scène */
  herosAbsent: boolean;
  projection?: boolean;
  /** Enregistre le texte retenu qui attend : le serveur relit la Préparation */
  avantDeDemander: () => Promise<void>;
}) {
  const { proposer } = useAidesIa();
  const dire = useMessage();
  const router = useRouter();
  const titreId = useId();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [ajout, setAjout] = useState(false);
  const [reperes, setReperes] = useState<(PersonnageConnu & { coche: boolean })[] | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reste, setReste] = useState<string | null>(null);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const cadre = useRef<HTMLDivElement>(null);
  const aOuvrir = useRef<string | null>(null);

  // Une carte ajoutée à la main s'ouvre dès que la liste la montre
  useEffect(() => {
    if (aOuvrir.current && personnages.some((p) => p.id === aOuvrir.current)) {
      setOuvert(aOuvrir.current);
      aOuvrir.current = null;
    }
  }, [personnages]);
  useEffect(() => {
    if (reperes) cadre.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [reperes !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const nbHeros = herosDe(personnages).length;
  const courant = personnages.find((p) => p.id === ouvert) ?? null;

  const reperer = async () => {
    setAttente(true);
    setErreur(null);
    await avantDeDemander();
    const r = await demanderAuxPersonnages<ReponseReperage>({ demande: "reperer", projet: projetId });
    setAttente(false);
    if (!r.ok) return setErreur(r.message);
    setReperes(r.personnages.map((p) => ({ ...p, coche: true })));
    setReste(r.reste);
  };

  const ajouterReperes = async () => {
    if (!reperes) return;
    const choisis = reperes.filter((p) => p.coche && p.nom.trim());
    if (!choisis.length) return;
    setAjoutEnCours(true);
    const fait = await ajouterDesPersonnages(projetId, choisis.map((p) => ({ nom: p.nom, autresNoms: p.autresNoms, heros: p.heros, description: p.description })));
    setAjoutEnCours(false);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setReperes(null);
    dire({
      texte: choisis.length > 1 ? `${choisis.length} personnages ajoutés.` : `« ${choisis[0].nom} » est ajouté.`,
      annuler: () => void supprimerDesPersonnages(projetId, fait.ids),
    });
  };

  const changerRepere = (i: number, valeurs: Partial<PersonnageConnu & { coche: boolean }>) =>
    setReperes((l) => (l ? l.map((p, k) => (k === i ? { ...p, ...valeurs, coche: valeurs.coche ?? true } : p)) : l));

  const cochees = reperes?.filter((p) => p.coche && p.nom.trim()).length ?? 0;

  return (
    <section className={styles.personnages} aria-labelledby={titreId}>
      <h3 id={titreId} className="vh">
        Autres personnages
      </h3>
      {personnages.length ? (
        <>
          <ul className={styles.cartes}>
            {personnages.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={styles.carte}
                  disabled={projection}
                  onClick={() => setOuvert(p.id)}
                  aria-label={projection ? undefined : `Ouvrir la carte de ${p.nom}`}
                >
                  <Portrait id={p.portraitId} />
                  <span className={styles.carte__texte}>
                    <span className={styles.carte__nom}>
                      <b className="recit">{p.nom}</b>
                      {p.heros ? <span className={styles.heros}>héros</span> : null}
                    </span>
                    {p.autresNoms.length ? <span className={styles.carte__autres}>aussi : {autresNomsEnTexte(p)}</span> : null}
                    {p.description ? <span className={styles.carte__desc}>{p.description}</span> : <span className={styles.carte__vide}>Sans description</span>}
                  </span>
                  {projection ? null : <Icone nom="fleche" className={styles.carte__ouvrir} />}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.vide}>Ceux que les héros croisent : un nom, une ligne, un portrait si les images en ont besoin.</p>
      )}

      {ajout ? (
        <AjoutPersonnage
          onFermer={() => setAjout(false)}
          onAjouter={async (nom) => {
            // Les héros ont leur onglet : une carte ajoutée ici est un autre personnage
            const fait = await ajouterDesPersonnages(projetId, [{ nom, heros: false }]);
            if (!fait.ok) return { ok: false, erreur: fait.erreur };
            aOuvrir.current = fait.ids[0];
            setAjout(false);
            return { ok: true };
          }}
        />
      ) : null}

      {!projection ? (
        <>
          {attente ? (
            <p className={styles.noteIa} role="status">
              <Icone nom="ia" />
              L’IA lit ce que vous retenez…
            </p>
          ) : erreur ? (
            <p className={styles.noteIa_erreur} role="alert">
              {erreur}
            </p>
          ) : null}
          {reperes ? (
            <div ref={cadre} className={`ia-propose ${styles.reperes}`} role="group" aria-labelledby="reperes-t">
              <p className="ia-propose__tete" id="reperes-t">
                <Icone nom="ia" />
                Personnages repérés <span>· cochez ceux à ajouter ; un clic sur un texte le retouche</span>
              </p>
              <ul className={styles.reperes__liste}>
                {reperes.map((p, i) => (
                  <li key={i} className={p.coche ? styles.repere_coche : undefined}>
                    <input type="checkbox" checked={p.coche} aria-label={`Ajouter ${p.nom || "ce personnage"}`} onChange={(ev) => changerRepere(i, { coche: ev.target.checked })} />
                    <span className={styles.repere__corps}>
                      <span className={styles.repere__ligne}>
                        <input className={`${styles.enLigne} ${styles.repere__nom}`} value={p.nom} maxLength={NOM_MAX} aria-label="Nom" onChange={(ev) => changerRepere(i, { nom: ev.target.value })} />
                        <label className={styles.repere__heros}>
                          <input type="checkbox" checked={p.heros} onChange={(ev) => changerRepere(i, { heros: ev.target.checked })} />
                          Héros
                        </label>
                      </span>
                      <input
                        className={`${styles.enLigne} ${styles.repere__autres}`}
                        value={p.autresNoms.join(", ")}
                        placeholder="Autres noms"
                        aria-label="Autres noms, séparés par des virgules"
                        onChange={(ev) => changerRepere(i, { autresNoms: ev.target.value.split(",").map((t) => t.trimStart()) })}
                      />
                      <ChampQuiGrandit
                        className={`${styles.enLigne} ${styles.repere__desc}`}
                        rows={1}
                        maxLength={DESCRIPTION_MAX}
                        value={p.description}
                        aria-label="Description"
                        onChange={(ev) => changerRepere(i, { description: ev.target.value })}
                      />
                    </span>
                  </li>
                ))}
              </ul>
              <span className="ia-propose__gestes">
                <button type="button" className="btn btn--petit" disabled={!cochees || ajoutEnCours} aria-busy={ajoutEnCours || undefined} onClick={() => void ajouterReperes()}>
                  <Icone nom="plus" />
                  {cochees > 1 ? `Ajouter ${cochees} personnages` : "Ajouter ce personnage"}
                </button>
                <button type="button" className="btn btn--petit btn--discret" onClick={() => setReperes(null)}>
                  Laisser
                </button>
              </span>
              {reste ? <p className={styles.noteIa}>{reste}</p> : null}
            </div>
          ) : null}
          <p className={styles.gestes}>
            <BoutonDouble
              libelle="Ajouter un personnage"
              nomIa="Repérer les personnages d’après le texte retenu"
              onMain={() => setAjout(true)}
              onIa={() => void reperer()}
              attente={attente}
            />
          </p>
        </>
      ) : null}

      {courant && !projection ? (
        <PanneauPersonnage
          key={courant.id}
          projetId={projetId}
          personnage={courant}
          autresHeros={nbHeros - (courant.heros ? 1 : 0)}
          herosAbsent={herosAbsent}
          proposer={proposer}
          onFermer={() => setOuvert(null)}
          onSupprime={(carte) => {
            setOuvert(null);
            dire({ texte: `La carte de « ${courant.nom} » est supprimée.`, annuler: () => void remettreDesPersonnages(projetId, [carte]) });
          }}
          onHeros={(heros) => {
            // Devenu héros, il a son onglet : on le suit
            if (heros && adresse) router.push(adresse(courant.id), { scroll: false });
          }}
        />
      ) : null}
    </section>
  );
}

/**
 * Les onglets de l'étape Personnages (F10.2, 18 octobre 2026) : un par héros, sa vignette et son
 * nom ; « + Un autre héros » ; « Autres personnages ». Sans carte de héros encore, un seul onglet,
 * « Le héros », et l'écran reste celui d'une étape ordinaire.
 */
export function OngletsDesPersonnages({
  projetId, heros, ouvert, autres, adresse, projection,
}: {
  projetId: string;
  heros: Personnage[];
  /** Le héros ouvert, ou AUTRES_PERSONNAGES ; null : l'onglet « Le héros » sans carte */
  ouvert: string | null;
  autres: number;
  adresse: (onglet: string) => string;
  projection?: boolean;
}) {
  const router = useRouter();
  const dire = useMessage();
  const [ajout, setAjout] = useState(false);
  const [nom, setNom] = useState("");
  const [enCours, setEnCours] = useState(false);
  const ajouter = async () => {
    if (!nom.trim() || enCours) return;
    setEnCours(true);
    const fait = await ajouterDesPersonnages(projetId, [{ nom, heros: true }]);
    setEnCours(false);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setAjout(false);
    setNom("");
    router.push(adresse(fait.ids[0]), { scroll: false });
  };
  const lien = (cle: string, contenu: React.ReactNode, actif: boolean) => (
    <Link key={cle} href={adresse(cle)} scroll={false} className={`${styles.onglet}${actif ? ` ${styles.onglet_ouvert}` : ""}`} aria-current={actif ? "page" : undefined}>
      {contenu}
    </Link>
  );
  return (
    <nav className={styles.onglets} aria-label="Les héros et les autres personnages">
      <div className={styles.onglets__liste}>
        {heros.length
          ? heros.map((h) =>
              lien(
                h.id,
                <>
                  <Vignette id={h.portraitId} />
                  <span>{h.nom}</span>
                </>,
                ouvert === h.id,
              ),
            )
          : (
            <span className={`${styles.onglet} ${styles.onglet_ouvert}`} aria-current={ouvert !== AUTRES_PERSONNAGES ? "page" : undefined}>
              <Vignette id={null} />
              <span>{HEROS_SANS_NOM}</span>
            </span>
          )}
        {!projection && heros.length ? (
          ajout ? (
            <form
              className={styles.onglets__ajout}
              onSubmit={(ev) => {
                ev.preventDefault();
                void ajouter();
              }}
            >
              <input
                className="pchamp"
                autoFocus
                maxLength={NOM_MAX}
                aria-label="Nom du nouveau héros"
                placeholder="Son nom"
                value={nom}
                onChange={(ev) => setNom(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Escape") setAjout(false);
                }}
                onBlur={() => {
                  if (!nom.trim()) setAjout(false);
                }}
              />
              <button type="submit" className="btn btn--petit" disabled={!nom.trim() || enCours} aria-busy={enCours || undefined}>
                Ajouter
              </button>
            </form>
          ) : (
            <button type="button" className={styles.onglets__plus} onClick={() => setAjout(true)}>
              <Icone nom="plus" />
              Un autre héros
            </button>
          )
        ) : null}
        {heros.length > 1 && !projection ? (
          <Bulle question="Pourquoi plusieurs héros ?">{`${heros.length} héros : le lecteur choisit le sien au début du livre, et le texte dit « tu ». Écrivez ce que chacun sait faire dans « Nous retenons ».`}</Bulle>
        ) : null}
        <span className={styles.onglets__filet} aria-hidden="true" />
        {lien(
          AUTRES_PERSONNAGES,
          <>
            Autres personnages
            {autres ? <span className={styles.compte}>{autres}</span> : null}
          </>,
          ouvert === AUTRES_PERSONNAGES,
        )}
      </div>

    </nav>
  );
}

/** La vignette d'un héros dans son onglet : son portrait, ou la silhouette. */
function Vignette({ id }: { id: string | null }) {
  return (
    <span className={`${styles.vignette}${id ? "" : ` ${styles.vignette_vide}`}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- portrait déjà réduit, servi par l'application */}
      {id ? <img src={`/images/${id}?v=1`} alt="" loading="lazy" draggable={false} /> : <Icone nom="personnage" />}
    </span>
  );
}

/**
 * La carte du héros de l'onglet, sous « Nous retenons » : son portrait, son nom, ses autres noms ;
 * un clic ouvre son panneau (nom, autres noms, fiche visuelle, portrait). Sans carte encore,
 * « Donner un nom au héros » la crée.
 */
export function CarteDuHeros({
  projetId, heros, autresHeros, herosAbsent, projection, creer, adresse,
}: {
  projetId: string;
  adresse: (onglet: string) => string;
  heros: Personnage | null;
  autresHeros: number;
  herosAbsent: boolean;
  projection?: boolean;
  creer: () => Promise<string | null>;
}) {
  const { proposer } = useAidesIa();
  const dire = useMessage();
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [creation, setCreation] = useState(false);
  if (!heros) {
    return projection ? null : (
      <p className={styles.carteHeros__nommer}>
        <button
          type="button"
          className="btn btn--petit"
          disabled={creation}
          onClick={async () => {
            setCreation(true);
            const id = await creer();
            setCreation(false);
            if (id) setOuvert(true);
          }}
        >
          <Icone nom="personnage" />
          Donner un nom au héros
        </button>
      </p>
    );
  }
  return (
    <section className={styles.carteHeros} aria-label={`La carte de ${heros.nom}`}>
      {/* Devant la classe aussi, la carte s'ouvre : les élèves décrivent le héros et choisissent son portrait */}
      <button type="button" className={styles.carte} onClick={() => setOuvert(true)} aria-label={`Ouvrir la carte de ${heros.nom}`}>
        <Portrait id={heros.portraitId} />
        <span className={styles.carte__texte}>
          <span className={styles.carte__nom}>
            <b className="recit">{heros.nom}</b>
            <span className={styles.heros}>héros</span>
          </span>
          {heros.autresNoms.length ? <span className={styles.carte__autres}>aussi : {autresNomsEnTexte(heros)}</span> : null}
          {projection ? null : (
            <span className={styles.carte__desc}>{heros.fiche.trim() ? "Fiche visuelle écrite" : "Sans fiche visuelle"} · {heros.portraitId ? "portrait gardé" : "sans portrait"}</span>
          )}
        </span>
        <Icone nom="fleche" className={styles.carte__ouvrir} />
      </button>
      {projection ? null : (
        <button
          type="button"
          className={styles.carteHeros__supprimer}
          aria-label={`Supprimer ${heros.nom} et son onglet`}
          title={`Supprimer ${heros.nom} et son onglet`}
          onClick={async () => {
            const fait = await supprimerDesPersonnages(projetId, [heros.id]);
            if (!fait.ok) return dire({ texte: fait.erreur });
            dire({ texte: `« ${heros.nom} » et son onglet sont supprimés.`, annuler: () => void remettreDesPersonnages(projetId, fait.cartes).then(() => router.push(adresse(heros.id), { scroll: false })) });
            router.push(adresse(""), { scroll: false });
          }}
        >
          <Icone nom="corbeille" />
        </button>
      )}
      {ouvert ? (
        <PanneauPersonnage
          key={heros.id}
          projection={projection}
          projetId={projetId}
          personnage={heros}
          autresHeros={autresHeros}
          herosAbsent={herosAbsent}
          proposer={proposer}
          onFermer={() => setOuvert(false)}
          onSupprime={(carte) => {
            setOuvert(false);
            dire({ texte: `« ${heros.nom} » et son onglet sont supprimés.`, annuler: () => void remettreDesPersonnages(projetId, [carte]) });
            router.push(adresse(""), { scroll: false });
          }}
          onHeros={(estHeros) => {
            // Il n'est plus un héros : il rejoint les autres personnages, et la page le suit
            if (!estHeros) {
              setOuvert(false);
              router.push(adresse(AUTRES_PERSONNAGES), { scroll: false });
            }
          }}
        />
      ) : null}
    </section>
  );
}

/** Le portrait de référence, ou sa place, en pointillé, avec une silhouette sans visage. */
function Portrait({ id, grand }: { id: string | null; grand?: boolean }) {
  return (
    <span className={`${styles.portrait}${grand ? ` ${styles.portrait_grand}` : ""}${id ? "" : ` ${styles.portrait_vide}`}`}>
      {id ? (
        // eslint-disable-next-line @next/next/no-img-element -- images servies par l'application, déjà réduites
        <img src={`/images/${id}${grand ? "" : "?v=1"}`} alt="" loading="lazy" decoding="async" draggable={false} />
      ) : (
        <Icone nom="personnage" />
      )}
    </span>
  );
}

function AjoutPersonnage({ onAjouter, onFermer }: { onAjouter: (nom: string) => Promise<{ ok: boolean; erreur?: string }>; onFermer: () => void }) {
  const [nom, setNom] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  return (
    <form
      className={styles.ajoutLigne}
      onSubmit={async (ev) => {
        ev.preventDefault();
        if (!nom.trim() || enCours) return;
        setEnCours(true);
        const fait = await onAjouter(nom);
        setEnCours(false);
        if (!fait.ok) setErreur(fait.erreur ?? "Cela n’a pas pu être enregistré. Réessayez.");
      }}
    >
      <input
        className="pchamp"
        type="text"
        maxLength={NOM_MAX}
        autoFocus
        aria-label="Nom du personnage"
        placeholder="Son nom : Lou, la chouette…"
        value={nom}
        onChange={(ev) => setNom(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === "Escape") onFermer();
        }}
        onBlur={(ev) => {
          if (!nom.trim() && !(ev.relatedTarget as HTMLElement | null)?.closest("[data-ouvre-ajout]")) onFermer();
        }}
      />
      <button type="submit" className="btn btn--petit" disabled={!nom.trim() || enCours} aria-busy={enCours || undefined}>
        Ajouter
      </button>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </form>
  );
}

/**
 * La carte d'un personnage, dans le panneau des réglages : ce que l'adulte en dit, puis ce qui sert
 * aux images. Chaque champ s'enregistre après une courte pause, comme la Préparation.
 */
function PanneauPersonnage({
  projetId, personnage: p, autresHeros, herosAbsent, proposer, onFermer, onSupprime, onHeros, projection,
}: {
  projetId: string;
  personnage: Personnage;
  autresHeros: number;
  herosAbsent: boolean;
  proposer: boolean;
  onFermer: () => void;
  onSupprime: (carte: CarteSupprimee) => void;
  /** Le personnage devient héros, ou ne l'est plus : la page ouvre l'onglet où il va */
  onHeros?: (heros: boolean) => void;
  /** Devant la classe : on règle son apparence et son portrait, sans rien supprimer */
  projection?: boolean;
}) {
  const e = useEnregistrement();
  const dire = useMessage();
  const [nom, setNom] = useState(p.nom);
  const [autres, setAutres] = useState(autresNomsEnTexte(p));
  const [heros, setHeros] = useState(p.heros);
  const [description, setDescription] = useState(p.description);
  const [fiche, setFiche] = useState(p.fiche);
  const [erreurNom, setErreurNom] = useState<string | null>(null);

  const regler = (valeurs: Partial<CarteSaisie>, cle: string, delai = 700) => e.prevoir(() => reglerPersonnage(p.id, valeurs), delai, cle);

  const supprimer = async () => {
    await e.partir();
    const fait = await supprimerDesPersonnages(projetId, [p.id]);
    if (!fait.ok) return dire({ texte: fait.erreur });
    onSupprime(fait.cartes[0]);
  };

  return (
    <Panneau
      titre={nom.trim() || p.nom}
      sous={heros ? "Héros de l’histoire" : "Personnage de l’histoire"}
      onFermer={() => {
        void e.partir();
        onFermer();
      }}
      pied={
        <PiedFermer
          enregistre={e.enregistre}
          enCours={e.enCours}
          onFermer={() => {
            void e.partir();
            onFermer();
          }}
        />
      }
    >
      <section>
        <h3>
          <label htmlFor="perso-nom">Nom</label>
        </h3>
        <input
          className="pchamp"
          id="perso-nom"
          data-focus=""
          type="text"
          maxLength={NOM_MAX}
          value={nom}
          onChange={(ev) => {
            setNom(ev.target.value);
            if (ev.target.value.trim()) {
              setErreurNom(null);
              regler({ nom: ev.target.value }, "nom");
            } else setErreurNom("Donnez un nom au personnage.");
          }}
          onBlur={() => void e.partir()}
        />
        {erreurNom ? (
          <p className="erreur" role="alert">
            {erreurNom}
          </p>
        ) : null}
      </section>
      <section>
        <h3>
          <label htmlFor="perso-autres">Autres noms</label>
        </h3>
        <input
          className="pchamp"
          id="perso-autres"
          type="text"
          maxLength={330}
          value={autres}
          placeholder="Séparés par des virgules"
          onChange={(ev) => {
            setAutres(ev.target.value);
            regler({ autresNoms: lireAutresNoms(ev.target.value, nom) }, "autres");
          }}
          onBlur={() => void e.partir()}
        />
      </section>
      <section>
        <label className="inter">
          <input
            type="checkbox"
            role="switch"
            checked={heros}
            onChange={(ev) => {
              const v = ev.target.checked;
              setHeros(v);
              void e.partir().then(() => reglerPersonnage(p.id, { heros: v })).then((fait) => {
                if (fait.ok) onHeros?.(v);
              });
            }}
          />
          <span className="inter__piste" aria-hidden="true" />
          <span>Héros</span>
        </label>
        <p>
          {p.heros
            ? heros
              ? autresHeros > 0
                ? "Le lecteur choisit son héros : dites ce que chacun sait faire."
                : "Le personnage que le lecteur suit."
              : "Éteint, il rejoint les autres personnages ; son onglet se ferme, ses questions et ses idées restent avec lui."
            : heros
              ? "Il aura son onglet : questions, idées et « Nous retenons »."
              : "Un héros a son onglet, avec ses questions et ses idées ; le lecteur choisit le sien."}
        </p>
      </section>
      {/* Ce qu'on retient d'un héros s'écrit dans « Nous retenons » de son onglet (18 octobre 2026) */}
      {p.heros ? null : (
        <section>
          <h3>
            <label htmlFor="perso-desc">Description</label>
          </h3>
          <ChampQuiGrandit
            className="pchamp"
            id="perso-desc"
            rows={2}
            maxLength={heros ? DESCRIPTION_MAX : DESCRIPTION_COURTE_MAX}
            value={description}
            placeholder="Qui il est, en une ligne."
            onChange={(ev) => {
              setDescription(ev.target.value);
              regler({ description: ev.target.value }, "description");
            }}
            onBlur={() => void e.partir()}
          />
        </section>
      )}
      <PourLesImages
        sorte="personnage"
        id={p.id}
        projetId={projetId}
        nom={nom.trim() || p.nom}
        fiche={fiche}
        referenceId={p.portraitId}
        proposer={proposer}
        note={heros && herosAbsent ? "Le héros n’est pas dessiné dans les images de scène (Réglages du projet)." : undefined}
        avantDeDemander={() => e.partir()}
        onFiche={(v) => {
          setFiche(v);
          regler({ fiche: v }, "fiche");
        }}
      />
      {projection ? null : (
        <p className={styles.finDuPanneau}>
          <button type="button" className={`lien ${styles.supprimerCarte}`} onClick={() => void supprimer()}>
            <Icone nom="corbeille" />
            {p.heros ? "Supprimer le héros et son onglet" : "Supprimer la carte"}
          </button>
        </p>
      )}
    </Panneau>
  );
}

/**
 * « Pour les images » (F10.2) : la fiche visuelle, retouchable, reprise mot pour mot dans chaque
 * image, « ✦ Préciser pour les images » qui la propose, et le portrait de référence d'un
 * personnage ou l'image de référence d'un objet : une ou deux images selon « Images par
 * création », dont l'adulte garde une, téléchargeable pour un outil externe. Sans IA, la fiche
 * s'écrit à la main et le portrait ne se crée pas.
 */
export function PourLesImages({
  sorte, id, projetId, nom, fiche, referenceId, proposer, note, avantDeDemander, onFiche,
}: {
  sorte: SorteDeCarte;
  id: string;
  projetId: string;
  nom: string;
  fiche: string;
  referenceId: string | null;
  proposer: boolean;
  /** Une ligne sous le titre du portrait : celui d'un héros absent des images ne sert pas aux scènes */
  note?: string;
  avantDeDemander: () => Promise<void>;
  onFiche: (v: string) => void;
}) {
  const dire = useMessage();
  const ficheId = useId();
  const [ficheProposee, setFicheProposee] = useState<string | null>(null);
  const [attenteFiche, setAttenteFiche] = useState(false);
  const [erreurFiche, setErreurFiche] = useState<string | null>(null);
  const [propositions, setPropositions] = useState<string[] | null>(null);
  const [attenteImages, setAttenteImages] = useState(false);
  const [erreurImages, setErreurImages] = useState<string | null>(null);
  const [reste, setReste] = useState<string | null>(null);
  const [garde, setGarde] = useState<string | null>(null);
  const propositionsEnCours = useRef<string[] | null>(null);
  useEffect(() => {
    propositionsEnCours.current = propositions;
  }, [propositions]);

  // Le panneau refermé sans choisir : les images créées ne sont pas conservées (F10.1)
  useEffect(
    () => () => {
      if (propositionsEnCours.current?.length) void laisserLesPropositions(projetId, propositionsEnCours.current);
    },
    [projetId],
  );

  const creerLibelle = sorte === "personnage" ? (referenceId ? "Créer un autre portrait" : "Créer son portrait") : referenceId ? "Créer une autre image" : "Créer son image";

  const preciser = async () => {
    setAttenteFiche(true);
    setErreurFiche(null);
    await avantDeDemander();
    const r = await demanderAuxPersonnages<ReponseFiche>({ demande: "fiche", sorte, id });
    setAttenteFiche(false);
    if (!r.ok) return setErreurFiche(r.message);
    setFicheProposee(r.fiche);
  };

  const creer = async () => {
    if (propositions?.length) void laisserLesPropositions(projetId, propositions);
    setPropositions(null);
    setAttenteImages(true);
    setErreurImages(null);
    await avantDeDemander();
    const r = await demanderAuxPersonnages<ReponseReferences>({ demande: "images", sorte, id }, true);
    setAttenteImages(false);
    if (!r.ok) return setErreurImages(r.message);
    setPropositions(r.propositions);
    setReste(r.reste);
  };

  const garder = async (proposition: string) => {
    if (!propositions) return;
    setGarde(proposition);
    setErreurImages(null);
    const echec = () => {
      setGarde(null);
      setErreurImages("L’image n’a pas pu être gardée. Réessayez.");
    };
    try {
      const reponse = await fetch(`/images/proposition/${projetId}/${proposition}`);
      if (!reponse.ok) return echec();
      const reduite = await reduire(new File([await reponse.blob()], `${proposition}.jpg`, { type: "image/jpeg" }));
      if (!reduite) return echec();
      URL.revokeObjectURL(reduite.apercu);
      const depot = await deposer(projetId, reduite);
      if (!depot.ok) return echec();
      const avant = referenceId;
      const fait = await poserLaReference(sorte, id, depot.id, propositions);
      if (!fait.ok) return echec();
      setPropositions(null);
      setGarde(null);
      dire({
        texte: sorte === "personnage" ? `Portrait de « ${nom} » gardé.` : `Image de « ${nom} » gardée.`,
        annuler: () => void poserLaReference(sorte, id, avant),
      });
    } catch {
      echec();
    }
  };

  return (
    <section className={styles.images} aria-label="Pour les images">
      <div className={styles.images__champ}>
        <div className={styles.images__tete}>
          <label htmlFor={ficheId}>À quoi ressemble {nom} ?</label>
          {proposer ? (
            <button
              type="button"
              className={`btn btn--ia ${styles.images__ia}`}
              onClick={() => void preciser()}
              disabled={attenteFiche}
              aria-busy={attenteFiche || undefined}
              aria-label={fiche.trim() ? "Préciser son apparence avec l’IA" : "Proposer son apparence avec l’IA"}
              title="Demander à l’IA"
            >
              <Icone nom="ia" />
            </button>
          ) : null}
        </div>
        <ChampQuiGrandit
          className="pchamp"
          id={ficheId}
          rows={3}
          maxLength={FICHE_MAX}
          value={fiche}
          placeholder={sorte === "personnage" ? "Âge, silhouette, visage, cheveux, vêtements et leurs couleurs…" : "Forme, taille, matière, couleurs…"}
          onChange={(ev) => onFiche(ev.target.value)}
          onBlur={() => void avantDeDemander()}
        />
        {attenteFiche ? (
          <p className={styles.noteIa} role="status">
            <Icone nom="ia" />
            L’IA décrit son apparence…
          </p>
        ) : erreurFiche ? (
          <p className={styles.noteIa_erreur} role="alert">
            {erreurFiche}
          </p>
        ) : null}
        {ficheProposee !== null ? (
          <div className="ia-propose ia-propose--consigne" role="group" aria-labelledby={`${ficheId}-p`}>
            <p className="ia-propose__tete" id={`${ficheId}-p`}>
              <Icone nom="ia" />
              Apparence proposée · modifiable
            </p>
            <ChampQuiGrandit className="pchamp" rows={3} maxLength={FICHE_MAX} value={ficheProposee} aria-label="Apparence proposée" onChange={(ev) => setFicheProposee(ev.target.value)} />
            <span className="ia-propose__gestes">
              <button
                type="button"
                className="btn btn--petit"
                disabled={!ficheProposee.trim()}
                onClick={() => {
                  const avant = fiche;
                  onFiche(ficheProposee);
                  void avantDeDemander();
                  setFicheProposee(null);
                  dire({ texte: avant.trim() ? "Son apparence est remplacée." : "Son apparence est écrite.", annuler: () => onFiche(avant) });
                }}
              >
                <Icone nom="coche" />
                Utiliser ce texte
              </button>
              <button type="button" className="btn btn--petit btn--discret" onClick={() => setFicheProposee(null)}>
                Laisser
              </button>
            </span>
          </div>
        ) : null}
      </div>

      <div className={styles.reference}>
        <p className={styles.reference__titre}>{sorte === "personnage" ? "Son portrait" : "Son image"}</p>
        {note ? <p className={styles.reference__aide}>{note}</p> : null}
        <div className={styles.reference__gardee}>
          {attenteImages ? (
            <span className={`${styles.dessine__cadre}${sorte === "objet" ? ` ${styles.portrait_carre}` : ""}`} role="status" aria-label={sorte === "personnage" ? "L’IA dessine le portrait" : "L’IA dessine l’image"}>
              <Icone nom="ia" />
            </span>
          ) : (
            <span className={sorte === "objet" ? styles.reference__carre : undefined}>
              <Portrait id={referenceId} grand />
            </span>
          )}
          <span className={styles.reference__gestes}>
            {proposer ? (
              attenteImages ? (
                <span className={styles.reference__aide}>
                  L’IA dessine…
                  <br />
                  Une demi-minute environ.
                </span>
              ) : (
                <>
                  <button type="button" className="btn btn--ia" onClick={() => void creer()} disabled={garde !== null || !fiche.trim()}>
                    <Icone nom="ia" />
                    {propositions ? "En créer d’autres" : creerLibelle}
                  </button>
                  {!fiche.trim() ? <span className={styles.reference__aide}>{SANS_FICHE}</span> : reste ? <span className={styles.reference__aide}>{reste}</span> : null}
                </>
              )
            ) : !referenceId ? (
              <span className={styles.reference__aide}>Les portraits se créent avec les aides IA, à allumer dans « Mon compte ».</span>
            ) : null}
            {referenceId ? (
              <a className="lien" href={`/images/${referenceId}`} download={nomDeFichier(sorte === "personnage" ? "Portrait de" : "Image de", nom)} title="Pour le donner à un autre outil d’images">
                <Icone nom="telecharger" />
                Télécharger
              </a>
            ) : null}
          </span>
        </div>

        {proposer && propositions ? (
          <div className={`ia-propose ${styles.propositions}`} role="group" aria-labelledby={`${ficheId}-i`}>
            <p className="ia-propose__tete" id={`${ficheId}-i`}>
              <Icone nom="ia" />
              {propositions.length > 1 ? "Deux propositions" : "Proposition"} <span>· {propositions.length > 1 ? "gardez celle qui convient" : "gardez-la ou laissez-la"}</span>
            </p>
            <ul className={styles.propositions__liste}>
              {propositions.map((pr, i) => (
                <li key={pr}>
                  <span className={`${styles.portrait} ${styles.portrait_grand}${sorte === "objet" ? ` ${styles.portrait_carre}` : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- image créée, en attente, servie par l'application */}
                    <img src={`/images/proposition/${projetId}/${pr}`} alt={`Proposition ${i + 1}`} draggable={false} />
                  </span>
                  <button type="button" className="btn btn--petit" disabled={garde !== null} aria-busy={garde === pr || undefined} onClick={() => void garder(pr)}>
                    <Icone nom="coche" />
                    {propositions.length > 1 ? "Garder celle-ci" : "Garder"}
                  </button>
                </li>
              ))}
            </ul>
            <span className="ia-propose__gestes">
              <button
                type="button"
                className="btn btn--petit btn--discret"
                disabled={garde !== null}
                onClick={() => {
                  void laisserLesPropositions(projetId, propositions);
                  setPropositions(null);
                }}
              >
                Laisser
              </button>
            </span>
          </div>
        ) : null}
        {erreurImages ? (
          <p className={styles.noteIa_erreur} role="alert">
            {erreurImages}
          </p>
        ) : null}
      </div>
    </section>
  );
}

