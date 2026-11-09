"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { DICTEE, duree, MESSAGES_DICTEE } from "@/domaine/dictee";
import { Icone } from "../Icone";
import { useMessage } from "../Messages";
import { useProjetCourant } from "../ProjetCourant";

/**
 * La dictée de l'adulte (F07.4) : un micro dans les champs qu'il remplit et dans la barre de la
 * copie. Un clic enregistre, avec le temps qui défile ; un second clic arrête, et le texte entendu
 * se pose au curseur, le temps de la transcription. Échap annule sans rien envoyer. Cinq minutes au
 * plus : l'enregistrement s'arrête alors de lui-même et part à la transcription.
 *
 * Le micro n'existe que dans l'espace de l'adulte, qui pose `DicteeDeLAdulte` : l'espace des
 * élèves ne le montre nulle part. Une seule dictée à la fois sur la page.
 */

const Active = createContext(false);

export function DicteeDeLAdulte({ children }: { children: ReactNode }) {
  return <Active value>{children}</Active>;
}

/** Le micro peut-il se montrer ici ? Seulement dans l'espace de l'adulte. */
export const useDicteeActive = () => useContext(Active);

// Une seule dictée à la fois : les autres micros de la page attendent qu'elle finisse
let enCours: symbol | null = null;
const abonnes = new Set<() => void>();
const prendre = (qui: symbol | null) => {
  enCours = qui;
  abonnes.forEach((f) => f());
};
const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

type Etat = "repos" | "prepare" | "enregistre" | "transcrit";

/** Le format que le navigateur sait enregistrer : Opus dans WebM (Chrome, Edge, Firefox), sinon AAC dans MP4 (Safari) */
const formatDuNavigateur = (): string => {
  for (const f of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) if (MediaRecorder.isTypeSupported(f)) return f;
  return "";
};

/**
 * Le moteur d'une dictée. `inserer` pose le texte entendu ; `avantDeCommencer` peut refuser, par
 * une phrase à dire (dans la copie, le curseur n'est pas dans un paragraphe).
 */
export function useDictee({ inserer, avantDeCommencer }: { inserer: (texte: string) => void; avantDeCommencer?: () => string | null }) {
  const dire = useMessage();
  const { projet } = useProjetCourant();
  const [moi] = useState(() => Symbol("dictee"));
  const [etat, setEtat] = useState<Etat>("repos");
  const [secondes, setSecondes] = useState(0);
  const occupe = useSyncExternalStore(sAbonner, () => enCours !== null && enCours !== moi, () => false);
  const enregistreur = useRef<MediaRecorder | null>(null);
  const flux = useRef<MediaStream | null>(null);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);
  const annulee = useRef(false);
  // Les fonctions de la page changent à chaque rendu : on garde la dernière
  const insererTenu = useRef(inserer);
  useEffect(() => {
    insererTenu.current = inserer;
  });

  const liberer = useCallback(() => {
    if (minuterie.current) clearInterval(minuterie.current);
    minuterie.current = null;
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
    enregistreur.current = null;
    if (enCours === moi) prendre(null);
  }, [moi]);

  const envoyer = useCallback(
    async (audio: Blob) => {
      setEtat("transcrit");
      try {
        const corps = new FormData();
        corps.append("audio", audio, "dictee");
        if (projet?.id) corps.append("projet", projet.id);
        const r = await fetch("/dictee", { method: "POST", body: corps });
        const json = (await r.json().catch(() => null)) as { ok: boolean; texte?: string; message?: string } | null;
        if (json?.ok && json.texte) insererTenu.current(json.texte);
        else dire({ texte: json?.message ?? MESSAGES_DICTEE.echec });
      } catch {
        dire({ texte: MESSAGES_DICTEE.echec });
      } finally {
        setEtat("repos");
        if (enCours === moi) prendre(null);
      }
    },
    [dire, moi, projet?.id],
  );

  const arreter = useCallback(() => {
    const e = enregistreur.current;
    if (e && e.state !== "inactive") e.stop();
  }, []);

  const annuler = useCallback(() => {
    annulee.current = true;
    arreter();
  }, [arreter]);

  const commencer = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      dire({ texte: MESSAGES_DICTEE.sansMicro });
      return;
    }
    const refus = avantDeCommencer?.();
    if (refus) {
      dire({ texte: refus });
      return;
    }
    if (enCours) return;
    prendre(moi);
    setEtat("prepare");
    annulee.current = false;
    // La dictée est-elle possible (installée, mois non épuisé) ? On le sait pendant que le navigateur ouvre le micro
    const possible = fetch("/dictee", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ ok: boolean; message?: string }>)
      .catch(() => ({ ok: false, message: MESSAGES_DICTEE.echec }));
    let micro: MediaStream;
    try {
      micro = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      setEtat("repos");
      prendre(null);
      dire({ texte: e instanceof DOMException && e.name === "NotFoundError" ? MESSAGES_DICTEE.sansMicro : MESSAGES_DICTEE.micro });
      return;
    }
    flux.current = micro;
    const verdict = await possible;
    if (!verdict.ok) {
      liberer();
      setEtat("repos");
      dire({ texte: verdict.message ?? MESSAGES_DICTEE.echec });
      return;
    }
    const format = formatDuNavigateur();
    const e = new MediaRecorder(micro, { ...(format ? { mimeType: format } : {}), audioBitsPerSecond: DICTEE.debit });
    const morceaux: Blob[] = [];
    e.ondataavailable = (ev) => {
      if (ev.data.size) morceaux.push(ev.data);
    };
    e.onstop = () => {
      const type = e.mimeType || format || "audio/webm";
      liberer();
      if (annulee.current) {
        setEtat("repos");
        return;
      }
      prendre(moi);
      void envoyer(new Blob(morceaux, { type }));
    };
    enregistreur.current = e;
    e.start(1000);
    const debut = Date.now();
    setSecondes(0);
    setEtat("enregistre");
    minuterie.current = setInterval(() => {
      const s = (Date.now() - debut) / 1000;
      setSecondes(s);
      if (s >= DICTEE.secondesMax) arreter();
    }, 250);
  }, [arreter, avantDeCommencer, dire, envoyer, liberer, moi]);

  // Échap annule l'enregistrement, avant toute autre fermeture de la page
  useEffect(() => {
    if (etat !== "enregistre") return;
    const touche = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      ev.stopPropagation();
      annuler();
    };
    window.addEventListener("keydown", touche, true);
    return () => window.removeEventListener("keydown", touche, true);
  }, [etat, annuler]);

  // Le champ disparaît pendant l'enregistrement : rien ne part
  useEffect(
    () => () => {
      annulee.current = true;
      const e = enregistreur.current;
      if (e && e.state !== "inactive") e.stop();
      else liberer();
    },
    [liberer],
  );

  const basculer = useCallback(() => {
    if (etat === "repos") void commencer();
    else if (etat === "enregistre") arreter();
  }, [arreter, commencer, etat]);

  return { etat, secondes, occupe, basculer };
}

/**
 * Le bouton du micro. `variante` « champ » : un petit rond dans le coin bas du champ ; « outil » :
 * dans la barre de la copie, avec son mot. Il ne prend pas le curseur au champ : le texte se pose
 * là où il était.
 */
export function BoutonDictee({
  dictee, variante = "champ",
}: {
  dictee: ReturnType<typeof useDictee>;
  variante?: "champ" | "outil";
}) {
  const { etat, secondes, occupe, basculer } = dictee;
  const enregistre = etat === "enregistre";
  const attend = etat === "prepare" || etat === "transcrit";
  const titre = enregistre ? "Arrêter la dictée (Échap pour annuler)" : etat === "transcrit" ? "Transcription en cours" : "Dicter";
  return (
    <button
      type="button"
      className={`${variante === "outil" ? "outil outil--texte dictee-outil" : "dictee"}${enregistre ? " est-enregistre" : ""}${attend ? " est-attente" : ""}`}
      // Le nom ne change pas : « enfoncé » dit l'enregistrement en cours, le titre comment l'arrêter
      aria-label="Dicter"
      title={titre}
      aria-pressed={enregistre}
      aria-busy={attend || undefined}
      disabled={occupe || attend}
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={basculer}
      data-dictee
    >
      <Icone nom={enregistre ? "arreter" : "micro"} />
      {enregistre ? <span className="dictee__temps">{duree(secondes)}</span> : variante === "outil" ? (etat === "transcrit" ? "Transcription…" : "Dicter") : null}
    </button>
  );
}
