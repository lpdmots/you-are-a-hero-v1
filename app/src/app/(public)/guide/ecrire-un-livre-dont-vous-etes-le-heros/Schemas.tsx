import type { ReactNode } from "react";
import styles from "./guide.module.css";

/**
 * Les formes d'un livre-jeu (partie 6 du guide) : l'arbre qui ne se referme jamais, barré, puis les
 * branches qui se rejoignent, le carrefour et le détour facultatif. Des scènes en petites cartes,
 * l'entrée et la sortie en canard, la scène du détour en étoile.
 */

const Fleche = ({ id }: { id: string }) => (
  <defs>
    <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
    </marker>
  </defs>
);
const Scene = ({ x, y, bout }: { x: number; y: number; bout?: boolean }) => (
  <rect className={bout ? styles.scBout : styles.scScene} x={x - 9} y={y - 6} width={18} height={12} rx={3} />
);
const Trait = ({ de, a, id, aller }: { de: [number, number]; a: [number, number]; id: string; aller?: boolean }) => (
  <line className={styles.scTrait} x1={de[0]} y1={de[1]} x2={a[0]} y2={a[1]} markerEnd={`url(#${id})`} markerStart={aller ? `url(#${id})` : undefined} />
);

function Arbre() {
  const niveaux = [[100], [56, 144], [32, 80, 120, 168], [20, 44, 68, 92, 108, 132, 156, 180]];
  const ys = [22, 62, 102, 142];
  const traits: ReactNode[] = [];
  niveaux.slice(0, -1).forEach((rang, n) =>
    rang.forEach((x, i) =>
      [niveaux[n + 1][2 * i], niveaux[n + 1][2 * i + 1]].forEach((x2) => traits.push(<line key={`${n}-${i}-${x2}`} className={styles.scGris} x1={x} y1={ys[n]} x2={x2} y2={ys[n + 1]} />)),
    ),
  );
  return (
    <>
      {traits}
      {niveaux.flatMap((rang, n) => rang.map((x) => <circle key={`${n}-${x}`} className={styles.scPoint} cx={x} cy={ys[n]} r={n === 3 ? 3.5 : 5} />))}
      <text className={styles.scTexte} x={100} y={168} textAnchor="middle">
        … 1 024
      </text>
    </>
  );
}

function Branches() {
  const id = "sc-branches";
  return (
    <>
      <Fleche id={id} />
      <Trait de={[100, 26]} a={[100, 44]} id={id} />
      <Trait de={[100, 56]} a={[48, 80]} id={id} />
      <Trait de={[100, 56]} a={[100, 80]} id={id} />
      <Trait de={[100, 56]} a={[152, 80]} id={id} />
      <Trait de={[48, 92]} a={[48, 112]} id={id} />
      <Trait de={[152, 92]} a={[152, 112]} id={id} />
      <Trait de={[48, 124]} a={[92, 146]} id={id} />
      <Trait de={[152, 124]} a={[108, 146]} id={id} />
      {/* Une défaite tôt : une fin au bout du chemin du milieu */}
      <line className={styles.scTrait} x1={100} y1={92} x2={100} y2={104} />
      <line className={styles.scFin} x1={92} y1={106} x2={108} y2={106} />
      <Scene x={100} y={20} bout />
      <Scene x={100} y={50} />
      <Scene x={48} y={86} />
      <Scene x={100} y={86} />
      <Scene x={152} y={86} />
      <Scene x={48} y={118} />
      <Scene x={152} y={118} />
      <Scene x={100} y={152} bout />
    </>
  );
}

function Carrefour() {
  const id = "sc-carrefour";
  const points: [number, number][] = [[36, 34], [164, 34], [36, 130], [164, 130]];
  return (
    <>
      <Fleche id={id} />
      {points.map(([x, y]) => {
        // Aller et retour : le lecteur revient au carrefour
        const d = Math.hypot(x - 100, y - 82);
        const [ux, uy] = [(x - 100) / d, (y - 82) / d];
        return <Trait key={`${x}-${y}`} de={[100 + ux * 17, 82 + uy * 17]} a={[x - ux * 12, y - uy * 9]} id={id} aller />;
      })}
      <circle className={styles.scCentre} cx={100} cy={82} r={15} />
      {points.map(([x, y]) => (
        <Scene key={`s${x}-${y}`} x={x} y={y} />
      ))}
      <Trait de={[100, 98]} a={[100, 150]} id={id} />
      <Scene x={100} y={158} bout />
    </>
  );
}

function Detour() {
  const id = "sc-detour";
  // Une étoile : la scène du détour, où l'on trouve un secret ou un objet
  const etoile = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? 4.2 : 10;
    const a = (Math.PI / 5) * k - Math.PI / 2;
    return `${(150 + r * Math.cos(a)).toFixed(1)},${(84 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <>
      <Fleche id={id} />
      <Trait de={[70, 26]} a={[70, 46]} id={id} />
      <Trait de={[70, 58]} a={[70, 104]} id={id} />
      <Trait de={[70, 116]} a={[70, 146]} id={id} />
      <Trait de={[79, 55]} a={[140, 78]} id={id} />
      <Trait de={[140, 91]} a={[79, 113]} id={id} />
      <polygon className={styles.scCentre} points={etoile} />
      <Scene x={70} y={20} bout />
      <Scene x={70} y={52} />
      <Scene x={70} y={110} />
      <Scene x={70} y={152} bout />
    </>
  );
}

const FORMES = [
  { nom: "L’arbre", dessin: <Arbre />, ecarte: true },
  { nom: "Les branches qui se rejoignent", dessin: <Branches /> },
  { nom: "Le carrefour", dessin: <Carrefour /> },
  { nom: "Le détour facultatif", dessin: <Detour /> },
];

export function Schemas() {
  return (
    <figure className={styles.schemas}>
      {FORMES.map((f) => (
        <div key={f.nom} className={f.ecarte ? `${styles.schema} ${styles.schemaEcarte}` : styles.schema}>
          <svg viewBox="0 0 200 172" role="img" aria-label={f.ecarte ? `${f.nom}, à éviter` : f.nom}>
            {f.dessin}
          </svg>
          <span>{f.nom}</span>
        </div>
      ))}
    </figure>
  );
}
