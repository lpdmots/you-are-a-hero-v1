"use client";

import dynamic from "next/dynamic";

/**
 * La lecture ne se dessine que dans le navigateur : elle reprend, au retour d'une scène, ce que
 * la page avait gardé (`sessionStorage`), que le serveur ne connaît pas.
 */
export const LectureClient = dynamic(() => import("./Lecture"), {
  ssr: false,
  loading: () => <p className="lecture__attente">Ouverture de la lecture…</p>,
});
