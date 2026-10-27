"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { Bulle } from "@/composants/Bulle";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { demanderAuxImages } from "@/composants/imagesCreees";
import { deposer, reduire, REFUS_IMPORT } from "@/composants/importer";
import { useMessage } from "@/composants/Messages";
import {
  NOMS_DES_TEXTES, SORTES_DE_TEXTE, TEXTE_DE_COUVERTURE_MAX, couverturePeuDefinie, faceAvantDe, pppDeLaCouverture, texteDeLaCase, textesDemandes,
  type CasesDeCouverture, type SorteDeTexte, type UsageDeLaCouverture,
} from "@/domaine/couverture";
import { DESCRIPTION_IMAGE_MAX, IDEE_MAX } from "@/domaine/illustration";
import type { CouvertureDuProjet } from "@/serveur/images-creees";
import { lireLaCouverture, noterLaCouverture, noterLesCases, poserUneCouverture, promptDeCouverture, suivreLaDemande } from "../../actions-images-creees";

/**
 * « La couverture » (F11.4, « Couverture faite sur le site », 26 octobre 2026), dans la colonne de
 * droite de « Imprimer et partager », pour les deux volets : la face avant du livre, qui sert à la
 * bibliothèque et à l'imprimeur. Elle se crée par l'IA, le modèle écrivant lui-même les textes
 * cochés (décision du porteur), ou s'importe ; une couverture entière importée est coupée à sa
 * face avant dans le navigateur (F11-AC116). « Copier le prompt » marche sans IA.
 */
export function BlocCouverture({ projetId, titre, initiale }: { projetId: string; titre: string; initiale: CouvertureDuProjet }) {
  const dire = useMessage();
  const routeur = useRouter();
  const { proposer: ia } = useAidesIa();
  const id = useId();
  const [c, setC] = useState(initiale);
  const [cases, setCases] = useState<CasesDeCouverture>(initiale.cases);
  const [idee, setIdee] = useState(initiale.idee);
  const [description, setDescription] = useState(initiale.description);
  // Un seul champ, comme pour l'image d'une scène : l'idée, puis la description proposée qui la remplace
  const [decrit, setDecrit] = useState(initiale.description.trim() !== "");
  const [usage, setUsage] = useState<UsageDeLaCouverture>("imprimer");
  const [attente, setAttente] = useState<"" | "description" | "prompt" | "envoi" | "import">("");
  const [suivie, setSuivie] = useState<string | null>(initiale.demande?.id ?? null);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const notes = useRef({ idee: initiale.idee, description: initiale.description });
  const casesGardees = useRef(JSON.stringify(initiale.cases));
  const fichier = useRef<HTMLInputElement>(null);

  const relire = async () => {
    const lue = await lireLaCouverture(projetId);
    if (lue) setC(lue);
    return lue;
  };

  const remettre = async (imageId: string | null) => {
    const r = await poserUneCouverture(projetId, imageId);
    if (!r.ok) return setErreur(r.erreur);
    await relire();
    routeur.refresh();
  };

  // La couverture en route : suivie jusqu'à son arrivée, posée d'office, avec « Annuler »
  useEffect(() => {
    if (!suivie) return;
    const avant = c.image?.id ?? null;
    const minuterie = setInterval(() => {
      void suivreLaDemande(suivie).then(async (d) => {
        if (!d || d.etat === "en_route") return;
        setSuivie(null);
        if (d.etat === "echec") return setErreur(d.message ?? "La couverture n’a pas pu être créée. Rien n’a changé.");
        await relire();
        routeur.refresh();
        if (d.message) return dire({ texte: d.message });
        dire({ texte: "Couverture posée.", annuler: () => void remettre(avant) });
      });
    }, 2500);
    return () => clearInterval(minuterie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suivie]);

  const enregistrer = async () => {
    const note: { idee?: string; description?: string } = {};
    if (idee.trim() !== notes.current.idee.trim()) note.idee = idee;
    if (description.trim() !== notes.current.description.trim()) note.description = description;
    const lesCases = JSON.stringify(cases);
    await Promise.all([
      Object.keys(note).length
        ? noterLaCouverture(projetId, note).then((fait) => {
            if (fait.ok) notes.current = { idee: note.idee ?? notes.current.idee, description: note.description ?? notes.current.description };
          })
        : null,
      lesCases !== casesGardees.current
        ? noterLesCases(projetId, cases).then((fait) => {
            if (fait.ok) casesGardees.current = lesCases;
          })
        : null,
    ]);
  };

  const proposerDescription = async () => {
    setErreur(null);
    setAttente("description");
    await enregistrer();
    const r = await demanderAuxImages<{ ok: true; description: string } | { ok: false; message: string }>({ demande: "couverture", projet: projetId });
    setAttente("");
    if (!r.ok) return setErreur(r.message);
    const avant = description;
    const avantDecrit = decrit;
    setDescription(r.description);
    setDecrit(true);
    await noterLaCouverture(projetId, { description: r.description });
    notes.current.description = r.description;
    void relire();
    dire({
      texte: avantDecrit ? "Description remplacée." : "Description proposée : l’idée de départ reste gardée.",
      annuler: () => {
        setDescription(avant);
        setDecrit(avantDecrit);
        notes.current.description = avant;
        void noterLaCouverture(projetId, { description: avant });
      },
    });
  };

  const copier = async () => {
    setErreur(null);
    setAttente("prompt");
    await enregistrer();
    const r = await promptDeCouverture(projetId);
    setAttente("");
    if (!r.ok) return setErreur(r.erreur);
    try {
      await navigator.clipboard.writeText(r.prompt);
      setCopie(true);
      setTimeout(() => setCopie(false), 1800);
      dire({ texte: "Prompt copié : collez-le dans votre outil d’images." });
    } catch {
      setErreur("Le prompt n’a pas pu être copié. Réessayez.");
    }
  };

  const creer = async (pour: UsageDeLaCouverture = usage) => {
    setErreur(null);
    setUsage(pour);
    setAttente("envoi");
    await enregistrer();
    const r = await demanderAuxImages<{ ok: true; demande: string } | { ok: false; message: string }>({ demande: "creer-couverture", projet: projetId, usage: pour }, true);
    setAttente("");
    if (!r.ok) return setErreur(r.message);
    setSuivie(r.demande);
  };

  const importer = async (choisi: File) => {
    setErreur(null);
    setAttente("import");
    const avant = c.image?.id ?? null;
    try {
      const reduite = await reduire(choisi, false, faceAvantDe);
      if (!reduite) return setErreur(REFUS_IMPORT);
      URL.revokeObjectURL(reduite.apercu);
      const depot = await deposer(projetId, reduite);
      if (!depot.ok) return setErreur(depot.erreur);
      const pose = await poserUneCouverture(projetId, depot.id);
      if (!pose.ok) return setErreur(pose.erreur);
      await relire();
      routeur.refresh();
      dire({ texte: "Couverture importée.", annuler: () => void remettre(avant) });
    } finally {
      setAttente("");
      if (fichier.current) fichier.current.value = "";
    }
  };

  const retirer = async () => {
    const avant = c.image?.id ?? null;
    await remettre(null);
    dire({ texte: "Couverture retirée : la bibliothèque montrera la page de titre.", annuler: () => void remettre(avant) });
  };

  const changerCase = (sorte: SorteDeTexte, maj: Partial<CasesDeCouverture[SorteDeTexte]>) => setCases((x) => ({ ...x, [sorte]: { ...x[sorte], ...maj } }));
  const decrite = idee.trim() !== "" || (decrit && description.trim() !== "");
  const enRoute = suivie !== null || attente === "envoi";
  const occupe = attente !== "" || enRoute;
  const demandes = textesDemandes(cases, c.proposes);
  // Le sous-titre ne se propose que si la page de titre en a un, ou s'il a déjà été écrit ici
  const sortes = SORTES_DE_TEXTE.filter((s) => s !== "sousTitre" || c.proposes.sousTitre || cases.sousTitre.coche || cases.sousTitre.texte);
  const image = c.image;
  const floue = image ? couverturePeuDefinie(image.largeur) : false;

  return (
    <aside className="couverture" aria-labelledby="couverture-t">
      <h2 id="couverture-t" className="couverture__titre">
        <Icone nom="image" />
        La couverture
        <Bulle question="À quoi sert la couverture ?">
          <span>
            C’est la face avant du livre : la bibliothèque la montre, et vous l’envoyez à l’imprimeur à côté du PDF définitif, qui ne la contient pas. L’imprimeur compose lui-même le dos et la quatrième de couverture.
          </span>
        </Bulle>
      </h2>

      <div className="couverture__objet">
        {enRoute ? (
          <span className="couverture__livre couverture__livre--attente" role="status" aria-label="L’IA dessine la couverture">
            <Icone nom="ia" />
          </span>
        ) : image ? (
          <a className="couverture__livre" href={`/images/${image.id}`} target="_blank" rel="noreferrer" title="Voir en grand">
            {/* Une image du projet, servie par l'application : pas d'optimisation de Next */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/${image.id}?v=1`} alt="La couverture du livre" />
          </a>
        ) : (
          <span className="couverture__livre couverture__livre--vide" aria-hidden="true">
            <span>{titre}</span>
          </span>
        )}
        <div className="couverture__etat">
          {enRoute ? (
            <p className="cx-aide" role="status">
              L’IA dessine… {usage === "imprimer" ? "Une à deux minutes." : "Une demi-minute environ."}
              <br />
              Vous pouvez continuer : elle se posera d’elle-même.
            </p>
          ) : image ? (
            <>
              <a className="btn btn--petit" href={`/images/${image.id}`} download={`Couverture - ${titre}.jpg`}>
                <Icone nom="telecharger" />
                Télécharger
              </a>
              {floue ? (
                <p className="couverture__floue">
                  <Icone nom="alerte" />
                  <span>
                    Trop floue pour l’imprimeur.
                    <Bulle question="Pourquoi trop floue ?">
                      <span>Imprimée en A5, elle n’aurait que {pppDeLaCouverture(image.largeur)} points par pouce : il en faut au moins 200 pour qu’elle reste nette sur papier.</span>
                    </Bulle>
                  </span>
                </p>
              ) : (
                <p className="couverture__nette">
                  <Icone nom="coche" />
                  Assez fine pour l’imprimeur.
                </p>
              )}
              {floue && ia && decrite ? (
                <button type="button" className="lien couverture__recreer" disabled={occupe} onClick={() => void creer("imprimer")}>
                  La recréer pour imprimer
                </button>
              ) : null}
              <span className="couverture__gestes">
                <button type="button" className="lien cx-discret" disabled={occupe} onClick={() => fichier.current?.click()}>
                  Importer une autre
                </button>
                <button type="button" className="lien cx-discret" disabled={occupe} onClick={() => void retirer()}>
                  Retirer
                </button>
              </span>
            </>
          ) : (
            <>
              <p className="cx-aide">Sans couverture, la bibliothèque montre la page de titre.</p>
              <button type="button" className="lien couverture__importer" disabled={occupe} aria-busy={attente === "import" || undefined} onClick={() => fichier.current?.click()}>
                <Icone nom="importer" />
                {attente === "import" ? "Import…" : "Importer la mienne"}
              </button>
            </>
          )}
          <input ref={fichier} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files?.[0] && void importer(e.target.files[0])} />
        </div>
      </div>

      <div className="ci__champ couverture__champ">
        <p className="ci__libelle">
          <label htmlFor={`${id}-ce`}>Ce que montre la couverture</label>
          {ia ? (
            <button
              type="button"
              className="btn btn--ia ci__ia"
              disabled={occupe}
              aria-busy={attente === "description" || undefined}
              onClick={() => void proposerDescription()}
              aria-label={decrit ? "Proposer une autre description avec l’IA" : "Proposer la description avec l’IA"}
              title={decrit ? "Proposer une autre description" : "Proposer la description"}
            >
              <Icone nom="ia" />
            </button>
          ) : null}
        </p>
        <span className="ci__zone">
          <ChampQuiGrandit
            id={`${id}-ce`}
            className={`pchamp${decrit ? " ci__decrit" : ""}`}
            rows={decrit ? 4 : 2}
            maxLength={decrit ? DESCRIPTION_IMAGE_MAX : IDEE_MAX}
            value={attente === "description" ? "" : decrit ? description : idee}
            readOnly={attente === "description"}
            placeholder={attente === "description" ? "" : "Un lieu, un moment, un objet"}
            onChange={(e) => (decrit ? setDescription(e.target.value) : setIdee(e.target.value))}
            onBlur={() => void enregistrer().then(() => relire())}
          />
          {attente === "description" ? (
            <span className="ci__points" role="status" aria-label="L’IA décrit la couverture">
              <i />
              <i />
              <i />
            </span>
          ) : null}
          <button
            type="button"
            className="ci__copier"
            disabled={occupe || !decrite}
            onClick={() => void copier()}
            aria-label="Copier le prompt, pour un autre outil d’images"
            title={decrite ? "Copier le prompt" : "Décrivez d’abord ce que montre la couverture"}
          >
            <Icone nom={copie ? "coche" : "copier"} />
          </button>
        </span>
        {decrit && idee.trim() ? (
          <button
            type="button"
            className="lien cx-discret ci__revenir"
            onClick={() => {
              setDecrit(false);
              setDescription("");
              void noterLaCouverture(projetId, { description: "" }).then(() => (notes.current.description = ""));
            }}
          >
            Revenir à l’idée de départ
          </button>
        ) : null}
        {demandes.length ? <span className="cx-aide">Dites où placer le texte : en haut, sur le ciel…</span> : null}
        {c.portraits.length ? <span className="cx-aide">Avec les portraits de {enMots(c.portraits)}.</span> : null}
      </div>

      <fieldset className="couverture__textes">
        <legend className="ci__libelle">Écrire sur la couverture</legend>
        {sortes.map((sorte) => {
          const texte = texteDeLaCase(cases, c.proposes, sorte);
          const modifie = cases[sorte].texte !== null && cases[sorte].texte !== c.proposes[sorte] && sorte !== "autre";
          return (
            <div key={sorte} className={`couverture__texte${cases[sorte].coche ? " couverture__texte--coche" : ""}`}>
              <label className="couverture__case">
                <input
                  className="case"
                  type="checkbox"
                  checked={cases[sorte].coche}
                  onChange={(e) => changerCase(sorte, { coche: e.target.checked })}
                  onBlur={() => void enregistrer()}
                />
                <span>{NOMS_DES_TEXTES[sorte]}</span>
                {!cases[sorte].coche && texte ? <span className="couverture__apercu">{texte}</span> : null}
              </label>
              {cases[sorte].coche ? (
                <span className="couverture__saisie">
                  <input
                    className="pchamp"
                    value={texte}
                    maxLength={TEXTE_DE_COUVERTURE_MAX}
                    aria-label={`${NOMS_DES_TEXTES[sorte]}, tel qu’il sera écrit`}
                    placeholder={sorte === "autre" ? "« Un livre dont vous êtes le héros »" : undefined}
                    onChange={(e) => changerCase(sorte, { texte: e.target.value })}
                    onBlur={() => void enregistrer()}
                  />
                  {modifie ? (
                    <button
                      type="button"
                      className="cx-rond"
                      aria-label="Reprendre le texte de la page de titre"
                      title="Reprendre le texte de la page de titre"
                      onClick={() => {
                        changerCase(sorte, { texte: null });
                        setTimeout(() => void enregistrer(), 0);
                      }}
                    >
                      <Icone nom="refaire" />
                    </button>
                  ) : null}
                </span>
              ) : null}
            </div>
          );
        })}
      </fieldset>

      {ia ? (
        <div className="couverture__creer">
          <div className="bascule couverture__usage" role="group" aria-label="La couverture, pour quel usage ?">
            {(["imprimer", "site"] as const).map((u) => (
              <button key={u} type="button" aria-pressed={usage === u} disabled={occupe} onClick={() => setUsage(u)}>
                {u === "imprimer" ? "Pour imprimer" : "Pour le site"}
              </button>
            ))}
          </div>
          <span className="cx-aide">{usage === "imprimer" ? "Assez fine pour l’imprimeur." : "Trop floue pour l’imprimer, environ dix fois moins d’étoiles."}</span>
          <button type="button" className="btn btn--ia" disabled={occupe || !decrite} onClick={() => void creer()}>
            <Icone nom="ia" />
            {enRoute ? "Création en cours…" : image ? "Créer une autre couverture" : "Créer la couverture"}
          </button>
          {!decrite ? <span className="cx-aide">Décrivez d’abord ce que montre la couverture, ou faites-la proposer (✦).</span> : null}
        </div>
      ) : null}

      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}

      <p className="couverture__imprimeur cx-aide">
        Chez l’imprimeur, préparez aussi le <b>texte du dos du livre</b>, la quatrième de couverture.
      </p>
    </aside>
  );
}

/** « Maël », « Maël et la lanterne », « Maël, Lou et la lanterne ». */
const enMots = (noms: readonly string[]): string =>
  noms.length < 2 ? (noms[0] ?? "") : `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
