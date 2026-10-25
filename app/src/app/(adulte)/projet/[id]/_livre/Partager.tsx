"use client";

import Link from "next/link";
import { useState } from "react";
import { appelerUneAide } from "@/composants/PlusDEtoiles";
import { Bulle } from "@/composants/Bulle";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { useAidesIa } from "@/composants/AidesIa";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { ATTESTATIONS, CLAUSE_DE_PUBLICATION, PRESENTATION_MAX } from "@/domaine/bibliotheque";
import { ETAPES_DU_LIVRE, type RaisonDeRefus } from "@/domaine/livre";
import { commeLeLivre, type NomsDuPartage } from "@/domaine/partage";
import { couperUnCanal, mettreAJour, noms as reglerNoms, ouvrirUnCanal, proposer } from "../../actions-partage";

/**
 * « Imprimer et partager », volet « Partager » (F12.1, F12.3, revu par F15 le 25 octobre 2026) :
 * deux façons, sans lien seul. « Privé », les comptes des élèves : un interrupteur, « À mes
 * classes », et sa mise à jour. « Public », la bibliothèque du site : « Proposer à la
 * bibliothèque… » ouvre sur place la présentation, les points à relire et l'attestation, puis
 * l'état dit où en est la relecture. Un seul panneau ouvert à la fois ; seul son bouton de
 * confirmation est plein. Les noms affichés valent pour les deux façons.
 */

export type PublicationAffichee = {
  etat: "aucune" | "attente" | "refusee" | "publiee";
  /** « 12 novembre », la date de l'état */
  le: string | null;
  motif: string | null;
  /** L'adresse du livre dans la bibliothèque, une fois publié */
  adresse: string | null;
  /** Publié : sa mise à jour en attente ou refusée */
  miseAJour: { sorte: "attente" | "refusee"; le: string; motif: string | null } | null;
  /** Publié : le livre n'a pas changé depuis la version publiée */
  aJour: boolean;
  /** La présentation publiée ou proposée en dernier, point de départ de la suivante */
  presentation: string;
};

export type PartageAffiche = {
  deClasse: boolean;
  /** La règle unique le permet (F11.2) */
  possible: boolean;
  raisons: RaisonDeRefus[];
  /** Le compte a une classe en cours : « Privé » est possible (F12-AC24) */
  classes: boolean;
  noms: NomsDuPartage;
  /** Ce que le livre imprime des auteurs, pour les réglages des noms */
  livre: { titreEnImage: boolean; ligne: string; annee: string; auteurs: { enImage: boolean; nombre: number } | null };
  partage: {
    /** Un lien de lecture ouvert avant le 25 octobre 2026 : il se coupe, rien de plus */
    parLien: boolean;
    auxClasses: boolean;
    adresse: string;
    /** « 18 juin, 16 h 45 » */
    etatDu: string;
    aJour: boolean;
    /** Le dernier PDF définitif et la version ont-ils le même texte ? « inconnu » pour un PDF d'avant le partage */
    pdf: { etatDu: string; memeTexte: boolean | "inconnu" } | null;
  } | null;
  publication: PublicationAffichee;
};

type Ouvert = "classes" | "maj" | "couper-classes" | "couper-lien" | "proposer" | null;
type Reponse = { ok: true } | { ok: false; erreur: string; raisons?: RaisonDeRefus[] };

export function VoletPartager({ projetId, p, rappels }: { projetId: string; p: PartageAffiche; rappels: string[] }) {
  const dire = useMessage();
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<{ texte: string; raisons?: RaisonDeRefus[] } | null>(null);
  const partage = p.partage;
  const auxClasses = partage?.auxClasses ?? false;

  const ouvrir = (o: Ouvert) => {
    setErreur(null);
    setOuvert(o);
  };
  const faire = async (action: () => Promise<Reponse>, message: string) => {
    setEnCours(true);
    setErreur(null);
    const r = await action();
    setEnCours(false);
    if (!r.ok) return setErreur({ texte: r.erreur, raisons: r.raisons });
    setOuvert(null);
    dire({ texte: message });
  };
  const leRefus = erreur ? (
    <div className="erreur" role="alert">
      <p>{erreur.texte}</p>
      {erreur.raisons?.length ? <Raisons projetId={projetId} raisons={erreur.raisons} /> : null}
    </div>
  ) : null;
  // Une version privée lisible : le livre se reprend tel quel ; sinon il faut que la règle le permette
  const ouvrable = Boolean(partage) || p.possible;

  return (
    <div className="partager">
      <section className="partager__principal" aria-labelledby="partage-t">
        <h2 id="partage-t" className="imprimer__titre">
          Partager
          <Bulle question="Quelles sont les deux façons de partager ?">
            <span>
              En privé, vos élèves lisent le livre avec leur compte, en classe ou chez eux. En public, il entre dans la bibliothèque du site, lisible par tous,
              une fois relu par l’éditeur. Chacune est une copie datée : vos corrections ne la changent pas tant que vous ne la mettez pas à jour.
            </span>
          </Bulle>
        </h2>

        {!partage && !p.possible ? (
          <div className="imprimer__refus">
            <p className="imprimer__etat imprimer__etat--refus">
              <Icone nom="bloque" />
              Partage pas encore possible.
            </p>
            <Raisons projetId={projetId} raisons={p.raisons} />
          </div>
        ) : null}

        {/* Privé : les comptes des élèves (F12.3) */}
        {p.classes || auxClasses ? (
        <section className="partager__carte facon" aria-labelledby="prive-t">
          <h3 id="prive-t" className="facon__titre">
            <span className="facon__signe" aria-hidden="true">
              <Icone nom="eleves" />
            </span>
            Privé
            <small>les comptes de vos élèves</small>
          </h3>
          {p.classes || auxClasses ? (
            <div className="canal facon__canal">
              <span className="canal__texte">
                <b>À mes classes</b>
                <small>Vos élèves le lisent dans « Lire », en classe ou chez eux, avec leur code.</small>
              </span>
              <label className="inter canal__inter">
                <input
                  type="checkbox"
                  role="switch"
                  checked={auxClasses}
                  disabled={!auxClasses && !ouvrable}
                  onChange={(e) => ouvrir(e.target.checked ? "classes" : "couper-classes")}
                  aria-label="À mes classes"
                />
                <span className="inter__piste" aria-hidden="true" />
                <span>{auxClasses ? "Activé" : "Désactivé"}</span>
              </label>
            </div>
          ) : null}

          {ouvert === "classes" ? (
            <Rappel rappels={partage ? [] : rappels} action="Partager à mes classes" enCours={enCours}
              onConfirmer={() => void faire(() => ouvrirUnCanal(projetId, "classes", true), "Vos classes peuvent lire le livre.")} onAnnuler={() => setOuvert(null)} />
          ) : ouvert === "couper-classes" ? (
            <Couper
              question="Ne plus proposer le livre à vos classes ?"
              effet="Vos élèves ne le verront plus dans « Lire ». La bibliothèque ne change pas."
              action="Ne plus le proposer"
              enCours={enCours}
              onConfirmer={() => void faire(() => couperUnCanal(projetId, "classes"), "Vos classes ne voient plus le livre.")}
              onAnnuler={() => setOuvert(null)}
            />
          ) : partage && auxClasses ? (
            <EtatPrive projetId={projetId} p={p} majOuverte={ouvert === "maj"} onMettreAJour={() => ouvrir("maj")} />
          ) : null}
          {ouvert === "maj" ? (
            <Rappel rappels={rappels} action="Mettre à jour" enCours={enCours}
              onConfirmer={() => void faire(() => mettreAJour(projetId, true), "Version privée mise à jour : vos élèves lisent le livre corrigé.")} onAnnuler={() => setOuvert(null)} />
          ) : null}
          {ouvert === "classes" || ouvert === "couper-classes" || ouvert === "maj" ? leRefus : null}
        </section>
        ) : null}

        {/* Public : la bibliothèque du site (F15) */}
        <section className="partager__carte facon" aria-labelledby="public-t">
          <h3 id="public-t" className="facon__titre">
            <span className="facon__signe" aria-hidden="true">
              <Icone nom="livre" />
            </span>
            Public
            <small>la bibliothèque du site</small>
          </h3>
          <Publication
            projetId={projetId}
            p={p}
            rappels={rappels}
            ouvert={ouvert === "proposer"}
            enCours={enCours}
            onOuvrir={() => ouvrir("proposer")}
            onFermer={() => setOuvert(null)}
            onProposer={(presentation, atteste) =>
              void faire(() => proposer(projetId, presentation, atteste), "Livre proposé : il sera relu avant d’entrer dans la bibliothèque.")
            }
          />
          {ouvert === "proposer" ? leRefus : null}
        </section>

        {/* Un lien ouvert avant le 25 octobre 2026 : il ne se crée plus, il se coupe */}
        {partage?.parLien ? (
          <section className="partager__carte facon facon--ancien" aria-labelledby="ancien-t">
            <h3 id="ancien-t" className="facon__titre">
              <span className="facon__signe" aria-hidden="true">
                <Icone nom="lien" />
              </span>
              Ancien lien de lecture
            </h3>
            <p className="facon__note">Ce lien ne se crée plus ; il reste ouvert tant que vous ne le coupez pas.</p>
            <p className="lien-de-lecture__ligne">
              <input className="champ lien-de-lecture__adresse" readOnly value={partage.adresse} aria-label="Ancien lien de lecture" onFocus={(e) => e.currentTarget.select()} />
              <a className="btn btn--petit" href={partage.adresse} target="_blank" rel="noreferrer">
                Ouvrir
              </a>
            </p>
            {ouvert === "couper-lien" ? (
              <Couper
                question="Couper ce lien ?"
                effet="Il affichera « Ce livre n’est plus partagé »."
                action="Couper le lien"
                enCours={enCours}
                onConfirmer={() => void faire(() => couperUnCanal(projetId, "lien"), "Le lien est coupé.")}
                onAnnuler={() => setOuvert(null)}
              />
            ) : (
              <button type="button" className="lien lien-de-lecture__changer" onClick={() => ouvrir("couper-lien")}>
                Couper le lien…
              </button>
            )}
            {ouvert === "couper-lien" ? leRefus : null}
          </section>
        ) : null}

        <Noms projetId={projetId} p={p} />

        {/* Les modèles pour les familles, à faire signer avant de proposer le livre (F14-AC33, F15) */}
        {p.deClasse && ouvert !== "proposer" ? (
          <section className="partager__carte partager__familles" aria-labelledby="familles-t">
            <h3 id="familles-t" className="partager__carte-titre">
              Pour les familles
            </h3>
            <p>Avant de proposer le livre à la bibliothèque, faites signer l’autorisation de diffusion.</p>
            <ul>
              <li>
                <a className="lien" href="/modeles/autorisation-de-diffusion/fichier" download>
                  <Icone nom="telecharger" />
                  Autorisation de diffusion
                </a>
              </li>
              <li>
                <a className="lien" href="/modeles/information-des-familles/fichier" download>
                  <Icone nom="telecharger" />
                  Information des familles
                </a>
              </li>
            </ul>
          </section>
        ) : null}

        <p className="partager__voir">
          <Link className="btn" href={`/previsualiser/${projetId}`}>
            <Icone nom="oeil" />
            Prévisualiser
          </Link>
          {p.deClasse ? (
            <span className="partager__jamais">
              <Icone nom="cadenas" />
              Le partage ne montre jamais le travail de la classe.
            </span>
          ) : null}
        </p>
      </section>
    </div>
  );
}

/** La version privée : à jour, ou changée depuis, avec sa mise à jour (F12-AC09, F11-AC72). */
function EtatPrive({ projetId, p, majOuverte, onMettreAJour }: { projetId: string; p: PartageAffiche; majOuverte: boolean; onMettreAJour: () => void }) {
  const partage = p.partage!;
  return (
    <div className="facon__etat">
      {partage.aJour ? (
        <p className="facon__ligne facon__ligne--fait">
          <Icone nom="coche" />
          <span>À jour depuis le {partage.etatDu}.</span>
        </p>
      ) : (
        <p className="facon__ligne facon__ligne--change">
          <Icone nom="alerte" />
          <span>
            <b>Le livre a changé</b> depuis la version du {partage.etatDu}.
          </span>
        </p>
      )}
      {!partage.aJour && !majOuverte ? (
        p.possible ? (
          <p className="imprimer__cmd">
            <button type="button" className="btn" onClick={onMettreAJour}>
              <Icone nom="refaire" />
              Mettre à jour…
            </button>
          </p>
        ) : (
          <div className="imprimer__refus">
            <p className="partager__impossible">Mise à jour impossible pour l’instant : vos élèves gardent la version du {partage.etatDu}.</p>
            <Raisons projetId={projetId} raisons={p.raisons} />
          </div>
        )
      ) : null}
      {partage.pdf ? (
        <p className="partager__pdf">
          {partage.pdf.memeTexte === "inconnu"
            ? `Comparaison impossible avec le PDF définitif du ${partage.pdf.etatDu}.`
            : partage.pdf.memeTexte
              ? `Même texte que le PDF définitif du ${partage.pdf.etatDu}.`
              : `Texte différent du PDF définitif du ${partage.pdf.etatDu}.`}
        </p>
      ) : null}
    </div>
  );
}

/**
 * La bibliothèque (F15, « Côté enseignant ») : l'état de la relecture en une ligne, la couleur de
 * son rôle (ambre : cela attend ; vert : c'est fait ; brique : à refaire), puis le geste qui suit.
 * Aucun délai n'est promis.
 */
function Publication({ projetId, p, rappels, ouvert, enCours, onOuvrir, onFermer, onProposer }: {
  projetId: string; p: PartageAffiche; rappels: string[]; ouvert: boolean; enCours: boolean;
  onOuvrir: () => void; onFermer: () => void; onProposer: (presentation: string, atteste: boolean) => void;
}) {
  const pub = p.publication;
  const formulaire = (action: string) =>
    ouvert ? (
      <Proposer projetId={projetId} deClasse={p.deClasse} rappels={rappels} initiale={pub.presentation} action={action} enCours={enCours} onProposer={onProposer} onAnnuler={onFermer} />
    ) : null;
  const ouvrirLe = (libelle: string, discret = false) =>
    ouvert ? null : p.possible ? (
      discret ? (
        <button type="button" className="lien facon__suite" onClick={onOuvrir}>
          {libelle}
        </button>
      ) : (
        <p className="imprimer__cmd">
          <button type="button" className="btn" onClick={onOuvrir}>
            <Icone nom="livre" />
            {libelle}
          </button>
        </p>
      )
    ) : null;

  if (pub.etat === "aucune")
    return (
      <>
        <p className="facon__note">Tout le monde peut le lire, une fois relu par l’éditeur.</p>
        {ouvrirLe("Proposer à la bibliothèque…")}
        {formulaire("Proposer le livre")}
      </>
    );
  if (pub.etat === "attente")
    return (
      <p className="facon__ligne facon__ligne--attente">
        <Icone nom="sablier" />
        <span>
          <b>En attente de relecture</b> depuis le {pub.le}. Vous recevrez un courriel.
        </span>
      </p>
    );
  if (pub.etat === "refusee")
    return (
      <>
        <Refus le={pub.le!} motif={pub.motif!} titre="Refusé" />
        {ouvrirLe("Proposer de nouveau…")}
        {formulaire("Proposer de nouveau")}
      </>
    );
  const maj = pub.miseAJour;
  return (
    <>
      <p className="facon__ligne facon__ligne--fait">
        <Icone nom="coche" />
        <span>
          <b>Publié</b>, version du {pub.le}.
        </span>
      </p>
      <AdresseDuLivre adresse={pub.adresse!} />
      {maj?.sorte === "attente" ? (
        <p className="facon__ligne facon__ligne--attente">
          <Icone nom="sablier" />
          <span>
            <b>Mise à jour en attente de relecture</b> depuis le {maj.le}. La bibliothèque montre la version publiée.
          </span>
        </p>
      ) : maj?.sorte === "refusee" ? (
        <Refus le={maj.le} motif={maj.motif!} titre="Mise à jour refusée" suite="La bibliothèque montre toujours la version publiée." />
      ) : !pub.aJour ? (
        <p className="facon__ligne facon__ligne--change">
          <Icone nom="alerte" />
          <span>
            <b>Le livre a changé</b> depuis la version publiée.
          </span>
        </p>
      ) : null}
      {maj?.sorte !== "attente" ? (pub.aJour && !maj ? ouvrirLe("Proposer une mise à jour…", true) : ouvrirLe("Proposer la mise à jour…")) : null}
      {formulaire("Proposer la mise à jour")}
    </>
  );
}

function Refus({ le, motif, titre, suite }: { le: string; motif: string; titre: string; suite?: string }) {
  return (
    <div className="facon__refus" role="group" aria-label={titre}>
      <p className="facon__refus-tete">
        <Icone nom="bloque" />
        <span>
          <b>{titre}</b> le {le}.{suite ? ` ${suite}` : ""}
        </span>
      </p>
      <p className="facon__motif">
        <b>Motif :</b> {motif}
      </p>
      <p className="facon__motif-suite">Corrigez le livre, puis proposez-le de nouveau.</p>
    </div>
  );
}

/** L'adresse du livre dans la bibliothèque : le lien direct à donner aux familles (F15-AC04). */
function AdresseDuLivre({ adresse }: { adresse: string }) {
  const dire = useMessage();
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(adresse);
      dire({ texte: "Lien copié." });
    } catch {
      dire({ texte: "Le lien n’a pas pu être copié : sélectionnez-le à la main." });
    }
  };
  return (
    <p className="lien-de-lecture__ligne">
      <input className="champ lien-de-lecture__adresse" readOnly value={adresse} aria-label="Adresse du livre dans la bibliothèque" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="btn btn--petit" onClick={() => void copier()}>
        <Icone nom="copier" />
        Copier le lien
      </button>
      <a className="btn btn--petit" href={adresse} target="_blank" rel="noreferrer">
        Ouvrir
      </a>
    </p>
  );
}

/**
 * Proposer à la bibliothèque, sur place (F15-AC01, AC17) : la présentation, deux ou trois
 * phrases, avec « ✦ Proposer » ; les points à relire ; l'attestation selon le mode, seule case à
 * cocher ; la clause des conditions d'utilisation. Sans la coche, rien ne part.
 */
function Proposer({ projetId, deClasse, rappels, initiale, action, enCours, onProposer, onAnnuler }: {
  projetId: string; deClasse: boolean; rappels: string[]; initiale: string; action: string; enCours: boolean;
  onProposer: (presentation: string, atteste: boolean) => void; onAnnuler: () => void;
}) {
  const aides = useAidesIa();
  const dire = useMessage();
  const [texte, setTexte] = useState(initiale);
  const [atteste, setAtteste] = useState(false);
  const [demande, setDemande] = useState(false);
  const longueur = texte.trim().length;

  const proposerIa = async () => {
    setDemande(true);
    try {
      const reponse = await appelerUneAide("/ia/presentation", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projet: projetId, actuelle: texte }),
      });
      const r = (await reponse.json()) as { ok: true; presentation: string; reste: string | null } | { ok: false; message: string };
      if (!r.ok) return dire({ texte: r.message });
      const avant = texte;
      setTexte(r.presentation);
      dire({ texte: r.reste ?? "Présentation proposée : retouchez-la si besoin.", annuler: () => setTexte(avant) });
    } catch {
      dire({ texte: MESSAGES_IA.pasDeReponse });
    } finally {
      setDemande(false);
    }
  };

  return (
    <div className="proposer" role="group" aria-labelledby="proposer-t">
      <p id="proposer-t" className="imprimer__rappel-titre">
        Proposer à la bibliothèque
      </p>
      <div className="proposer__champ">
        <span className="proposer__etiquette">
          <label htmlFor="presentation-livre">Présentation</label>
          {aides.proposer ? (
            <button type="button" className="btn btn--petit btn--ia" disabled={demande} aria-busy={demande || undefined} onClick={() => void proposerIa()}>
              <Icone nom="ia" />
              {demande ? "Un instant…" : longueur ? "Autre version" : "Écrire"}
            </button>
          ) : null}
        </span>
        <ChampQuiGrandit
          id="presentation-livre"
          className="champ"
          rows={3}
          value={texte}
          maxLength={PRESENTATION_MAX}
          placeholder="Deux ou trois phrases qui donnent envie de l’ouvrir, sans dévoiler la fin."
          onChange={(e) => setTexte(e.target.value)}
        />
        <small className="proposer__compte" aria-live="polite">
          {longueur} / {PRESENTATION_MAX}
        </small>
      </div>

      {rappels.length ? (
        <ul className="proposer__a-savoir" aria-label="À savoir">
          {rappels.map((x) => (
            <li key={x}>
              <Icone nom="alerte" />
              {x}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="proposer__attester">
        <label className="partager__relu proposer__atteste">
          <input type="checkbox" checked={atteste} onChange={(e) => setAtteste(e.target.checked)} />
          <span>
            {deClasse ? ATTESTATIONS.classe : ATTESTATIONS.auteur}
            <Bulle question="Que vérifier avant de proposer ?">
              <span>
                Aucun nom ni prénom réel dans le récit, sauf si vous l’avez voulu ; aucune photo où une personne est reconnaissable ; aucune image dont vous
                n’avez pas les droits. L’application ne détecte ni les noms ni les visages.
              </span>
            </Bulle>
          </span>
        </label>
        {deClasse ? (
          <a className="lien proposer__modele" href="/modeles/autorisation-de-diffusion/fichier" download>
            <Icone nom="telecharger" />
            Autorisation de diffusion à faire signer
          </a>
        ) : null}
      </div>
      <small className="proposer__clause">
        {CLAUSE_DE_PUBLICATION}{" "}
        <a className="lien" href="/conditions" target="_blank" rel="noreferrer">
          Conditions d’utilisation
        </a>
      </small>

      <p className="imprimer__cmd">
        <button type="button" className="btn btn--primaire" disabled={!atteste || !longueur || enCours} aria-busy={enCours || undefined} onClick={() => onProposer(texte, atteste)}>
          <Icone nom="livre" />
          {enCours ? "Un instant…" : action}
        </button>
        <button type="button" className="lien" disabled={enCours} onClick={onAnnuler}>
          Annuler
        </button>
      </p>
    </div>
  );
}

function Raisons({ projetId, raisons }: { projetId: string; raisons: RaisonDeRefus[] }) {
  return (
    <ul className="imprimer__raisons">
      {raisons.map((r) => (
        <li key={`${r.etape}-${r.texte}`}>
          <Link className="lien" href={`/projet/${projetId}/livre?etape=${r.etape}`} scroll={false}>
            {ETAPES_DU_LIVRE.find((x) => x.id === r.etape)!.nom}
          </Link>{" "}
          · {r.texte}
        </li>
      ))}
    </ul>
  );
}

/** Le rappel avant le partage privé et sa mise à jour (F12-AC17), à cocher sur place. */
function Rappel({ rappels, action, enCours, onConfirmer, onAnnuler }: {
  rappels: string[]; action: string; enCours: boolean; onConfirmer: () => void; onAnnuler: () => void;
}) {
  const [relu, setRelu] = useState(false);
  return (
    <div className="imprimer__rappel partager__rappel" role="group" aria-labelledby="rappel-partage-t">
      <p id="rappel-partage-t" className="imprimer__rappel-titre">
        À relire avant de partager
      </p>
      {rappels.length ? (
        <>
          <p className="partager__a-savoir">À savoir :</p>
          <ul>
            {rappels.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      ) : null}
      <ul>
        <li>Aucun nom ni prénom réel dans le récit, sauf si vous l’avez voulu.</li>
        <li>Aucune photo où une personne est reconnaissable.</li>
        <li>Aucune image dont vous n’avez pas les droits.</li>
      </ul>
      <label className="partager__relu">
        <input type="checkbox" checked={relu} onChange={(e) => setRelu(e.target.checked)} />
        J’ai relu le livre sur ces points.
      </label>
      <p className="imprimer__cmd">
        <button type="button" className="btn btn--primaire" disabled={!relu || enCours} aria-busy={enCours || undefined} onClick={onConfirmer}>
          <Icone nom="partager" />
          {enCours ? "Un instant…" : action}
        </button>
        <button type="button" className="lien" disabled={enCours} onClick={onAnnuler}>
          Annuler
        </button>
      </p>
      <small className="partager__detecte">L’application ne détecte ni les noms ni les visages.</small>
    </div>
  );
}

/** Couper, confirmé sur place : ce qui change est dit avant (F12-AC10). */
function Couper({ question, effet, action, enCours, onConfirmer, onAnnuler }: {
  question: string; effet: string; action: string; enCours: boolean; onConfirmer: () => void; onAnnuler: () => void;
}) {
  return (
    <div className="partager__couper" role="group" aria-label={question}>
      <p>
        <b>{question}</b> {effet}
      </p>
      <p className="imprimer__cmd">
        <button type="button" className="btn btn--danger" disabled={enCours} aria-busy={enCours || undefined} onClick={onConfirmer}>
          {action}
        </button>
        <button type="button" className="lien" disabled={enCours} onClick={onAnnuler}>
          Annuler
        </button>
      </p>
    </div>
  );
}

/**
 * Ce que le livre montre des auteurs, en privé comme en public (F12.1, révisé le 16 octobre 2026 ;
 * F15, « Ce que voit le public ») : la ligne de la page de titre, retirée ou remplacée ; la page
 * des auteurs, affichée ou non. Un réglage par façon reste différé.
 */
function Noms({ projetId, p }: { projetId: string; p: PartageAffiche }) {
  const [ouverts, setOuverts] = useState(false);
  const [noms, setNoms] = useState(p.noms);
  const [texte, setTexte] = useState(p.noms.texte ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const nomDeLaLigne = p.deClasse ? "Ligne de classe" : "Nom de l’auteur";
  const garder = async (n: NomsDuPartage) => {
    setNoms(n);
    setErreur(null);
    const r = await reglerNoms(projetId, n);
    if (!r.ok) setErreur(r.erreur);
  };
  const livre = [p.livre.ligne, p.livre.annee].filter(Boolean).join(", ");
  return (
    <section className="partager__carte partager__noms" aria-labelledby="noms-t">
      <h3 id="noms-t" className="partager__carte-titre">
        Noms affichés
      </h3>
      {!ouverts ? (
        <p className="partager__noms-ligne">
          {commeLeLivre(noms) ? "Comme dans le livre, en privé et en public." : "Modifiés pour le partage, privé et public ; le livre imprimé ne change pas."}{" "}
          <button type="button" className="lien" onClick={() => setOuverts(true)}>
            Modifier
          </button>
        </p>
      ) : (
        <div className="partager__noms-reglages">
          <p className="partager__noms-ligne">
            En privé et en public ; le livre imprimé ne change pas.{" "}
            <button type="button" className="lien" onClick={() => setOuverts(false)}>
              Replier
            </button>
          </p>
          <div className="nom-partage">
            <span className="canal__texte">
              <b>{nomDeLaLigne}</b>
              <small>{p.livre.titreEnImage ? "La page de titre est une image : elle s’affiche telle quelle." : "Sous le titre, sur la première page."}</small>
            </span>
            {!p.livre.titreEnImage ? (
              <>
                <label className="inter canal__inter">
                  <input type="checkbox" role="switch" checked={noms.ligne} onChange={(e) => void garder({ ...noms, ligne: e.target.checked })} aria-label={nomDeLaLigne} />
                  <span className="inter__piste" aria-hidden="true" />
                  <span>{noms.ligne ? "Affichée" : "Retirée"}</span>
                </label>
                {noms.ligne ? (
                  <label className="nom-partage__texte">
                    <span>Texte affiché</span>
                    <input
                      className="champ"
                      value={texte}
                      placeholder={p.livre.ligne || "Comme dans le livre"}
                      maxLength={120}
                      onChange={(e) => setTexte(e.target.value)}
                      onBlur={() => void garder({ ...noms, texte: texte.trim() || null })}
                    />
                    <small>{texte.trim() ? `Le livre imprime : « ${livre} ».` : "Vide : celle du livre."}</small>
                  </label>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="nom-partage">
            <span className="canal__texte">
              <b>Page des auteurs</b>
              <small>
                {p.livre.auteurs
                  ? p.livre.auteurs.enImage
                    ? "Une image : affichée ou retirée en entier."
                    : `${p.livre.auteurs.nombre} prénom${p.livre.auteurs.nombre > 1 ? "s" : ""}, comme dans le livre.`
                  : "Le livre n’a pas de page des auteurs."}
              </small>
            </span>
            {p.livre.auteurs ? (
              <label className="inter canal__inter">
                <input type="checkbox" role="switch" checked={noms.auteurs} onChange={(e) => void garder({ ...noms, auteurs: e.target.checked })} aria-label="Page des auteurs" />
                <span className="inter__piste" aria-hidden="true" />
                <span>{noms.auteurs ? "Affichée" : "Retirée"}</span>
              </label>
            ) : null}
          </div>
          {p.partage || p.publication.etat === "publiee" ? (
            <small className="partager__prochaine">Un changement vaut pour la prochaine mise à jour, privée ou publique.</small>
          ) : null}
        </div>
      )}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </section>
  );
}
