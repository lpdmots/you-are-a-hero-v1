# La visite en vidéo — découpage

1920 × 1080, 30 images par seconde (60 pour le rendu final si le mouvement
des écrans le demande). Composition HyperFrames 0.6.14 (HTML, CSS, GSAP),
lancée depuis l'installation de `hyperframes-shorts`.

## L'idée : la vidéo est elle-même un livre-jeu

Chaque temps est un **passage numéroté** du livre, de 1 à 5 dans l’ordre des étapes (décidé par le porteur le 23 octobre 2026), comme les
passages de l'accueil. On passe de l'un à l'autre par une **phrase de choix**
de la forme du livre (« … rendez-vous au 3 ») : le curseur touche le numéro,
qui grandit jusqu'à devenir l'en-tête du passage suivant. Une seule fois, le
geste de l'élève remplace le choix : « Remettre à Mme Laurent » lance le
temps de l'enseignant.

## Univers visuel

Celui de l'accueil et du système « Cahiers d'aventure » (`docs/design.md`),
adapté à l'écran vidéo : tailles agrandies, traits plus épais, mouvement
continu.

- **Fond** : la table chaude de l'accueil `#f2ede3`, grain de papier, lumière
  de fenêtre en haut à gauche ; le papier des pages `#fcf9f1`, la feuille de
  l'outil `#ffffff`.
- **Couleurs à un seul rôle** : canard `#0b6a73` (choix, curseur, boutons) ;
  graphite `#1e2226` (texte) ; tampons d'état avec leurs couleurs (ambre « À
  valider », brique « À reprendre », vert « Validé », violet « Prête ») ; filet
  rose de la marge `#efa9a9`.
- **Trois voix typographiques** : Vollkorn pour le récit et les titres de
  passage ; Playwrite FR Trad, la cursive des écoles, pour la main (notes,
  cahier, nom du logo) ; Atkinson Hyperlegible Next pour l'outil.
- **Écrans** : les éléments clés refaits en HTML avec les jetons de
  l'application (copie de l'élève, tampons, étapes de la préparation, Suivi),
  pour qu'ils s'animent net à toute taille ; les vraies captures de l'outil
  pour le reste, inclinées et en profondeur, jamais posées à plat.
- **Personnages** : le dragon s'assoit à côté du livre au début, dort sur son
  livre à la fin ; la souris grignote le coin de la dernière page.
- **Son** : la voix, une musique douce (cordes pincées, célesta, piano léger)
  qui s'efface sous la voix, quelques bruitages discrets (page tournée, tampon,
  crayon, clic).

## Rythme

`ouverture lente — PRÉPARER (vif, cases qui se cochent) — ÉCRIRE (posé, la
main) — VALIDER (percussif, tampons) — LE LIVRE (montée, sommet sur le livre
imprimé) — fin lente`.

Les durées ci-dessous sont estimées ; elles se recalent sur la voix une fois
générée (chaque temps commence sur son premier mot).

## Passage 1 — Ouverture (≈ 0 – 8 s)

*« Et si, cette année, votre classe écrivait son propre livre ? Un vrai
livre-jeu, où c'est le lecteur qui choisit son chemin. »*

Le grand livre ouvert de l'accueil, vu d'un peu haut, la caméra qui
s'approche lentement. Page de gauche : l'illustration de la classe au travail.
Page de droite : le « 1 » du passage se pose, puis « Votre classe écrit son
livre-jeu. » s'écrit ligne à ligne. Le dragon se glisse à côté du livre et
s'assoit. Sur « choisit son chemin », deux phrases de choix glissent sous le
titre ; le curseur touche le « 2 ».

## Passage 2 — On prépare ensemble (≈ 8 – 25 s)

*« Tout commence au tableau. Étape par étape, la classe imagine le monde, les
héros, ce qui est en jeu, et les grands lieux de l'aventure. Les élèves
proposent, vous retenez. Et si l'inspiration manque, l'IA vous souffle des
idées. »*

L'écran projeté de l'illustration s'agrandit jusqu'à remplir le cadre et
devient la Préparation. La rangée des étapes : Univers, Personnages, Enjeu,
Grandes étapes se cochent une à une, au mot près. Sur « les héros », la carte
de Lou et son portrait ; sur « les grands lieux », les trois parties tombent
en cascade dans « Nous retenons… » (La rive, Le Grand Lac, La Tour des Brumes :
l'histoire d'exemple reprise le 26 octobre 2026). « Les élèves proposent » : des idées
arrivent en petites cartes ; « vous retenez » : l'une reçoit la coche verte et
rejoint la liste. « L'IA vous souffle des idées » : la pastille ✦ pâle palpite,
trois idées s'ouvrent en éventail. Choix : « Pour voir la classe écrire,
rendez-vous au 3. »

## Passage 3 — Chacun écrit ses scènes (≈ 25 – 39 s)

*« Ensuite, chaque élève reçoit ses scènes, et les écrit, d'abord sur son
cahier, puis sur les ordinateurs de la classe. Chaque scène se termine par des
choix. Suivre la lumière dans la brume ? Ou rester immobile. »*

Un cahier à grands carreaux (Seyès) : la cursive écrit le début de la scène,
trait après trait. La caméra glisse vers l'ordinateur : le même texte dans la
copie de l'élève, filet rose de la marge, Vollkorn. La scène est « Île — la lumière dans la
brume », du chapitre « La clairière aux pierres ». Les deux phrases de choix
se posent (20 et 21). Sur « suivre la lumière », la première s'allume et un
chemin en pointillé rouge part vers sa scène ; sur « rester immobile », la
seconde, vers « la lumière bleutée » (le feu follet). L'élève clique « Remettre à Mme Laurent ».

## Passage 4 — Vous relisez et validez (≈ 39 – 56 s)

*« L'élève vous remet sa scène. Vous la relisez, vous laissez une remarque
s'il faut la reprendre, puis vous la validez. Et d'un coup d'œil, vous voyez
où en est toute la classe. »*

La scène arrive chez l'enseignant avec le tampon « À valider » (sablier
ambre). Un trait de lecture parcourt les lignes. La remarque s'écrit en
cursive dans la marge, « Et Lou, que ressent-il ? », et le tampon « À
reprendre » (brique) frappe. Une ligne s'ajoute au texte, surlignée ;
« Validé » (vert) frappe à son tour, le papier tressaille. Sur « toute la
classe », la caméra recule : la scène devient une carte du Suivi parmi une
vingtaine, aux prénoms d'élèves fictifs, dont les tampons changent en vague.
Choix : « Pour faire le livre, rendez-vous au 5. »

## Passage 5 — Le livre se fait (≈ 56 – 76 s)

*« Vient le plus beau moment. L'application numérote les passages, vérifie
que chaque chemin mène quelque part, et met le livre en page. Il ne reste
qu'à l'imprimer… ou à le lire en ligne, à la maison. »*

Les cartes des scènes s'envolent et s'empilent ; leurs numéros défilent puis
s'arrêtent, 1, 2, 3… Sur « chaque chemin », la vue « Chemins » se trace,
flèche après flèche, une coche verte au bout de chacune. Sur « met le livre en
page », les pages se rangent en doubles pages, l'une tourne. Les pages feuilletées
portent les vrais passages du livre d'exemple (22 à 27, avec les images du
feu follet et de la clairière), numéros et renvois
compris, coulés par `outils/pages-du-livre.mjs` ; le téléphone, le passage 18
puis le début du 24 et son image. « L'imprimer » :
la photo des deux livres imprimés, un reflet de lumière la traverse. « En
ligne, à la maison » : un téléphone glisse à droite, la lecture défile.

## Fin (≈ 76 – 86 s)

*« Il était une fois une classe… qui a écrit son livre. »*

« Il était une fois » s'écrit en cursive ; « fois » se barre d'un trait de
crayon et « classe » s'écrit à sa place. Le dragon-livre du logo se pose à
gauche du nom. Dessous : « Votre classe écrit son livre-jeu. »,
« Gratuit · Rien à installer », iletaituneclasse.com. En bas, le dragon dort
sur son livre, la souris grignote un coin. Fondu au papier.

## Livrables

- `rendus/visite-fr.mp4` (H.264, 1080p) et `visite-fr.vtt` (sous-titres),
  copiés ensuite dans `app/public/accueil/` et branchés dans
  `VIDEO_DE_LA_VISITE` et `SOUS_TITRES_DE_LA_VISITE`.
- La première image sert d'affiche (`poster`).
