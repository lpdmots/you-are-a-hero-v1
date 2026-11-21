# Tuto 9 — Vérifier les chemins : script et découpage

Neuvième tuto de l'« Aide » (F14, « Support »), le deuxième des quatre tutos
du Livre, pour un récit à choix seulement (en récit classique, on passe du
tuto 8 au tuto 10). Environ 73 secondes (72,7 s), sous-titré, 1920 × 1080, voix de
Clément avec les réglages des prises du porteur. Suite du tuto 8 : Mme
Laurent, le projet à choix « Le secret de la forêt bleue », le livre relu.

Ce qui doit ressortir : l'application vérifie seule le départ, les fins et
les choix ; on relie un choix oublié dans la scène ouverte à côté, on garde
par « C'est voulu » une scène où rien ne mène, on peut lire le livre comme un
lecteur, puis on déclare les chemins vérifiés.

## Texte

Texte du porteur, validé le 20 novembre 2026, pris tel quel (typographie
seule), sauf la deuxième phrase du passage 4, reprise avec lui le même jour ;
l'ouverture réécrite par lui le même jour, avec sa prise.

**1** — Maintenant que la relecture est terminée, vérifions que tous les
chemins de votre histoire fonctionnent.

**2** — Pour commencer, rendez-vous dans « Livre », puis dans « Vérifier les
chemins ». L'application analyse automatiquement le départ, les fins et tous
les choix de votre histoire.

**3** — Un choix ne mène nulle part ? Il suffit d'ouvrir la scène concernée et
de le relier à la bonne suite.

**4** — Et si une scène n'est reliée à aucun chemin ? C'est peut-être un
oubli, ou bien vous l'avez voulu ainsi : cliquez alors sur « C'est voulu ».

**5** — Vous pouvez ensuite tester votre histoire en suivant les différents
choix, comme un véritable lecteur. Une fois les vérifications terminées,
cliquez sur « J'ai vérifié les chemins ».

**6** — Et voilà, tous vos chemins sont vérifiés ! Pour découvrir comment
mettre votre livre en page, rendez-vous dans le dixième tuto !

*(À l'écran, après la dernière phrase, sans voix : « Pour mettre en page,
rendez-vous au tuto 10 » et sa pastille, puis le voile, le logo et « Tuto
suivant : mettre en page · iletaituneclasse.com ».)*

### Le passage 4, repris avec le porteur

Sa première version disait « C'est peut-être un oubli… ou une énigme
prévue ! ». Or une énigme posée avec un lien caché compte comme un chemin
(`controles.ts`) : l'application ne la signale jamais « Aucun chemin n'y
mène ». « … ou un passage secret prévu ! », proposé, lui a paru bizarre ;
« … ou une scène particulière ! », sa reprise, ne disait pas grand-chose. Il
retient « C'est peut-être un oubli, ou bien vous l'avez voulu ainsi : cliquez
alors sur « C'est voulu ». », sans exemple ; la virgule remplace les points
de suspension, qui font traîner la voix.

### Les mots contre l'application

Relevés le 20 novembre 2026 dans `Livre.tsx` et `controles.ts`, puis sur les
captures : tous tiennent. « Livre » dans la colonne ; le Livre se rouvre sur
« Relire » (« Livre relu. ») ; l'étape « Vérifier les chemins » ; les quatre
tâches « Départ et fins », « Choix à relier », « Passages à confirmer »,
« Tester la lecture » ; « Le départ et les fins sont en place. » ;
« « Suivre le hibou » ne mène nulle part. », « Ouvrir la scène » (la scène
s'ouvre à côté de l'aperçu, le choix ouvert dans son panneau : « Sans
destination », « Choisir… ») ; « Aucun chemin n'y mène. », « C'est voulu »,
« C'est noté : ce passage reste tel quel. », « Tout est confirmé. » ;
« Continuer » ; « Tester la lecture », « Par où commencer ? », « Commencer au
départ », « Quitter » ; « J'ai vérifié les chemins », « Chemins vérifiés. » ;
« Étape suivante : Mettre en page ».

## Découpage

| Passage | À l'écran | Mots-repères |
|---|---|---|
| 1 | Titre « Vérifier les chemins », « Tuto · Livre », deux morceaux entiers de vrais écrans (la fiche « Vérifier les chemins », ses quatre tâches cochées et « Chemins vérifiés. » ; le premier passage de la lecture d'essai et ses deux choix) et le dragon, trois mots-repères « un choix à relier • « C'est voulu » • une lecture d'essai » ; tout se retire vers le haut. | « maintenant », « relecture », « vérifions », « fonctionnent » |
| 2 | « Parties et chapitres » ; cadre et clic sur « Livre » : le Livre se rouvre sur « Relire » ; cadre et clic sur « Vérifier les chemins ». La fiche : les quatre tâches encadrées ; clic sur « Départ et fins » : « Le départ et les fins sont en place. » ; les deux tâches qui ont un point encadrées. | « rendez », « livre », « vérifier », « chemins », « analyse », « automatiquement », « départ », « choix » |
| 3 | « Continuer » : « « Suivre le hibou » ne mène nulle part. » encadré ; « Ouvrir la scène » : la scène de Rayan à côté de l'aperçu, le panneau du choix encadré ; « Choisir… », « grottes » tapé, « L'entrée des grottes » ; « n° 12 L'entrée des grottes » et « rends-toi au 12 » encadrés dans le panneau, puis dans l'aperçu recomposé. | « choix », « nulle », « suffit », « ouvrir », « scène », « relier », « suite » |
| 4 | « Fermer » : la fiche revient sur « Passages à confirmer », « Choix à relier » coché ; « Le passage secret », « Aucun chemin n'y mène. » encadré ; cadre et clic sur « C'est voulu » : le message, puis « Tout est confirmé. ». | « aucun », « bien », « cliquez », « voulu » (2) |
| 5 | « Continuer » : « Tester la lecture » ; la lecture d'essai : « Commencer au départ », « Monter au grenier », « Ouvrir le coffre » ; la caméra recule, « Quitter » : retour au Livre ; cadre et clic sur « J'ai vérifié les chemins » : « Chemins vérifiés. » et la dernière tâche cochée. | « tester », « histoire », « une », « cliquez », « vérifié », « chemins » |
| 6 | Les quatre tâches cochées encadrées ; « Étape suivante : Mettre en page », survolé et encadré ; la caméra recule ; la phrase de choix et sa pastille « 10 », le voile, le logo. | « voilà », « pour », « découvrir », « mettre », « page », « rendez », « dixième » |

## Choix de rédaction

- **Un livre qui n'est pas propre, à l'inverse du tuto 8** : exactement deux
  points. « Suivre le hibou », dans « Les yeux dans le noir » (Rayan), n'a pas
  de destination : on le relie à « L'entrée des grottes ». « Le passage
  secret » (Ilyes, chapitre « Les grottes chantantes ») n'est relié par aucun
  choix ni lien caché : on le garde par « C'est voulu ». Le reste du livre
  est celui du tuto 8 (seize scènes, leurs images, deux fins), coquille
  corrigée ; « Le passage secret » n'a pas d'image.
- **Relier le choix dans la scène ouverte à côté**, pas par « Voir dans les
  chemins » : l'enseignant reste dans le Livre, et la scène s'ouvre sur le
  panneau du choix, déjà ouvert. La recherche « grottes » trouve la scène
  sans faire défiler la liste.
- **« Fermer »**, que la voix ne nomme pas, se clique au début du passage 4 ;
  la fiche revient d'elle-même sur « Passages à confirmer ».
- **La lecture d'essai** : un passage et deux choix suivis, puis « Quitter »,
  le temps d'une pause de 2,4 s dans la voix.
- **L'écran d'aide de « Vérifier les chemins »** (première visite) n'est pas
  montré : c'est lui qui montrera ce tuto.
- **Ce qui n'y est pas :** « Marquer comme fin » ; les numéros fixés ; le
  détail des énigmes et des liens cachés ; « À savoir » ; « Revoir » et
  « Revenir sur cette déclaration » ; « Voir dans les chemins » ; le détail
  de la lecture d'essai (« Depuis une scène », « Parcours », « Ouvrir la
  scène » : sujet possible d'un tuto hors série) ; toute aide de l'IA
  (éteinte : `reglages_ia = { proposer: false }`).

## Les écrans

Vrais écrans, sur la base locale, compte d'essai supprimé à la fin :

    cd V1/app && npx playwright test --config playwright.local.config.ts tuto-verifier-chemins

(contre le serveur local 4840). Le script
(`app/tests/captures/tuto-verifier-chemins.spec.ts`) écrit dans `captures/`
trente-sept écrans en 1440 × 810 au double de la densité, et `boites.json` /
`boites.js` (`ARBRE=1` écrit aussi l'arbre d'accessibilité de quelques
écrans, pour régler le script). Les images viennent de
`../tuto-relire-livre/images/`. « Scènes voisines » est éteint sur le compte.

**La page descend d'elle-même** : en ouvrant la scène à côté (576 points),
puis à chaque recomposition, l'aperçu se place sur le passage ouvert (8 659,
puis 10 163 points). La fiche reste collée en haut de l'écran : les captures
17 à 25 la montrent sans la ligne des étapes. Après la lecture d'essai, le
Livre revient en haut de la page.

Boîtes mesurées sur les captures, l'aperçu étant une image : « n° 12
L'entrée des grottes » dans le panneau (1006, 202, 186 × 22) et « rends-toi
au 12. » dans l'aperçu recomposé (944, 502, 192 × 24).

## La voix

Clément, vitesse 1, réglages des prises du porteur (stabilité 0,5,
similarité 0,75, style 0), générée le 20 novembre 2026. Aucun bruit dans les
pauses. Au passage 2, un arrêt de 0,44 s après « les fins », avant « et tous
les choix » : trois prises tirées (`voix/…/prises/p2-*`) le gardent toutes
(0,32 à 0,44 s), la deuxième ajoutant un trou de 0,7 s ; la voix d'origine
est gardée.

**Prises du porteur** (20 novembre 2026), posées par `outils/transcrire.mjs`,
transcription mot pour mot : l'ouverture (5,3 s, avec son nouveau texte) et
la fin (7,2 s, texte inchangé), dans `voix/fournies/`.

Pauses réglées pour les gestes : 1 s dans le passage 2, 0,8 s dans les
passages 3 et 4, 2,4 s dans le passage 5 (la lecture d'essai) ; 4,2 s après
le passage 3 (relier le choix, l'aperçu qui se recompose), 2,4 s après le
passage 4 (le message). Silence entre passages, d'après le temps des mots :
1,4 s, 1,6 s, 4,8 s, 3,0 s, 2,1 s. Durée : 72,7 s.

## L'animation

Outils du tuto 8 (`tuto.js`, `tuto.css`), sans ajout. Une seule feuille,
celle de Mme Laurent, du passage 2 au passage 6, la lecture d'essai
comprise.

- **La scène ouverte à côté**, puis la fiche qui revient : fondu court
  (0,25 s), puis la caméra recule.
- **« grottes »** se tape dans le champ (marge négative : le champ porte le
  cadre du focus), puis la liste filtrée arrive.
- **« Quitter »**, en haut à droite de la lecture : la caméra recule d'abord.
- **La pastille « 10 »** est élargie à 84 px ; son centre est en (1632, 1033).

## Le son

La musique des tutos (`son/musique-prompt.txt`), générée le 20 novembre 2026,
demandée à 73,7 s (rendue 73,7 s, `son/musique-brute.mp3`), dernier accord
brut vers 67,4 s. Après les prises du porteur, le logo arrive à 68,0 s :
`atempo=0.984`, accord vers 68,5 s (d'abord `atempo=0.977`, pour un logo à
68,5 s). Garder la musique brute : un changement de durée se rattrape en
refaisant le ralenti depuis elle. Bruitages des tutos. Mixage par
`outils/mixer.mjs`.

## Le rendu

`STUDIO_PORT=4854 WORKERS=2 VIDEO=tuto-verifier-chemins AFFICHE=3.0 outils/rendre.sh tuto-verifier-chemins`
(sans GPU), 20 novembre 2026, sur la demande du porteur : `rendus/tuto-verifier-chemins-web.mp4`
(72,7 s, 15,1 Mo, −16,7 LUFS), `tuto-verifier-chemins-fr.vtt` et l'affiche
`tuto-verifier-chemins.webp` à 3,0 s (le titre écrit, les deux morceaux posés, avant les
mots-repères). Aucune image isolée (chaque image comparée à ses voisines, l'écran entier puis
les bandes du haut et du bas) ; quelques images comparées au studio : les mêmes. Le fichier
pleine qualité est à la corbeille.

**Rendu de nouveau le 21 novembre 2026** : le rendu à deux processus (`WORKERS=2`) coupait le bas de
la feuille grossie, vers 26 à 35 s (à 30 s, « Décider plus tard » manquait sous la liste, que le
studio montrait) ; et la caméra laissait voir le bord de la feuille vers 49 à 52 s. `viser` de
`tuto.js` ramène désormais le cadrage sur la feuille (grossissements de 1,25 et 1,3 passés à 1,34) ;
rendu à un seul processus, vérifié par `outils/verifier-rendu.py` : aucune image isolée, plus de
table en bas. Le fichier pleine qualité est à la corbeille.

## Le studio

`preview_start` « video-studio-tuto-verifier-chemins » (`.claude/launch.json`),
sur le port 4854. Le navigateur intégré n'accepte que cinq serveurs par dossier : le
20 novembre 2026, il a fallu arrêter le studio du tuto 6 (port 4850), sur l'accord du porteur.
