# Stabilometer

[English](./README.md)

Stabilometer est une application Expo / React Native qui enregistre et compare des estimations des oscillations posturales à partir des mouvements du téléphone, avec et sans orthèse. Elle est destinée à des comparaisons exploratoires, et non au diagnostic ou à la prise de décisions cliniques.

## Fonctionnalités

- Enregistrement avec DeviceMotion, décompte et signaux sonores de début et de fin, accompagnés d’un retour haptique.
- Séries configurables de 1 à 5 essais (3 par défaut), d’une durée de 5 à 120 secondes par paliers de 5 secondes (30 secondes par défaut).
- Hauteur cheville-téléphone configurable (100 cm par défaut), utilisée pour estimer le déplacement lié aux oscillations.
- Pour chaque essai : trajectoire des oscillations, longueur cumulée estimée de la trajectoire, vitesse moyenne, aire de l’ellipse d’oscillation à 95 % et indice de stabilité pour une lecture rapide.
- Séries enregistrées localement, avec indication de la condition et noms modifiables.
- Graphique superposé comparant une série `Without orthosis` (sans orthèse) et une série `With orthosis` (avec orthèse) de même durée. Les trajectoires et les contours des ellipses à 95 % sont affichés respectivement en rouge et en vert.
- Options locales, historique des séries, suppression par sélection multiple et suppression de toutes les séries.
- Onglet **Live** affichant les angles d’inclinaison actuels, un niveau à bulle et les valeurs brutes de lacet, tangage et roulis, pour vérifier le capteur et le sens des axes.
- Onglet **About** affichant la version de l’application et la notice de licence GPL.

## Prérequis

- Node.js 22.13 ou une version ultérieure de la branche 22, 24.3 ou une version ultérieure de la branche 24, ou Node.js 26 ou une version ultérieure, ainsi que npm (Expo SDK 58 ne prend pas en charge les versions impaires de Node.js).
- Expo Go sur un appareil physique compatible pour tester rapidement le capteur, ou une version iOS de développement ou de prévisualisation.
- L’accès aux données de mouvement (DeviceMotion) autorisé pour l’application.

## Installation et lancement

Installez les dépendances verrouillées :

```sh
npm ci
```

Démarrez l’application pour Expo Go :

```sh
npx expo start --go
```

Scannez le code QR avec Expo Go. Pour les mesures de capteur, utilisez un téléphone physique ; les données d’un simulateur peuvent être indisponibles ou inadaptées.

Pour un client de développement, démarrez Metro avec :

```sh
npx expo start --dev-client
```

Créez un client de développement iOS avec EAS :

```sh
npx eas-cli@latest build --profile development --platform ios
```

Le client de développement se connecte à Metro. Après une mise à niveau du SDK Expo, créez et installez une nouvelle version de développement ou de prévisualisation : une version existante contient le code natif de son ancien SDK. Pour une version de prévisualisation interne autonome, utilisez :

```sh
npx eas-cli@latest build --profile preview --platform ios
```

La distribution interne iOS peut nécessiter l’enregistrement de l’appareil auprès du compte Apple Developer. Une version de production ou destinée à l’App Store utilise le profil `production` défini dans `eas.json`.

## Utilisation de l’application

1. Dans l’onglet **Measure**, choisissez `Without orthosis` (sans orthèse) ou `With orthosis` (avec orthèse). Saisissez la **Ankle-to-phone height**, distance en centimètres entre la cheville et le téléphone placé à hauteur du nombril. La valeur par défaut est 100 cm et elle est enregistrée sur l’appareil. Vous pouvez aussi saisir une **Default series label**, étiquette enregistrée sur l’appareil et attribuée à chaque nouvelle série ; vous pourrez modifier l’étiquette d’une série dans l’onglet **Series**.
2. Ouvrez **Options** pour modifier le nombre d’essais par série ou leur durée. Les options ne peuvent pas être modifiées en cours de série.
3. Si cette position est confortable et sûre, tenez-vous debout talons joints, les pieds tournés vers l’extérieur et formant un angle de 60° entre eux, comme sur l’[illustration de la position des pieds](./Orthosis%20Feet%20Position.pdf). Placez le téléphone à la verticale contre l’abdomen, à hauteur du nombril, écran tourné vers l’extérieur. Une ceinture de pantalon munie d’un support bien fixé peut aider à le maintenir en place sans gêner l’orthèse. Appuyez sur la zone de démarrage, attendez la fin du compte à rebours et gardez le téléphone stable pendant l’enregistrement. L’essai se termine automatiquement à la durée sélectionnée ; il peut aussi être arrêté manuellement.
4. Continuez jusqu’à ce que le nombre d’essais configuré soit atteint. La série terminée est enregistrée localement.
5. Dans **Series**, consultez les séries enregistrées et modifiez leurs étiquettes. Pour en supprimer certaines, maintenez une série appuyée : des cases à cocher apparaissent et une barre en haut affiche le nombre sélectionné, une commande **All / None** (tout / aucun) et une corbeille. Touchez les séries pour les sélectionner ou les désélectionner, puis touchez la corbeille et confirmez. La croix ✕ annule la sélection.
6. Dans **Chart**, utilisez **Configure chart** pour choisir une série par condition. Une fois la première série sélectionnée, seules les séries de même durée d’essai sont disponibles pour l’autre condition. Le graphique avertit si leurs hauteurs cheville-téléphone diffèrent. **Clear chart** efface les sélections.

L’indication `Unit: … cm` du graphique correspond à l’espacement du quadrillage. `Front` / `Back` désignent l’avant et l’arrière sur l’axe vertical ; `Left` / `Right` désignent la gauche et la droite sur l’axe horizontal.

Utilisez l’onglet **Live** pour vérifier le capteur avant l’enregistrement : inclinez-vous vers l’avant, l’arrière, la gauche et la droite et vérifiez que la bulle et les angles évoluent dans le sens attendu.

## Fonctionnement des estimations

DeviceMotion fournit la direction de la gravité dans le repère du téléphone. Lorsque le téléphone est placé à la verticale contre l’abdomen, écran tourné vers l’extérieur, l’application assimile son inclinaison à celle du corps et la convertit en déplacements horizontaux estimés à l’aide d’une approximation par pendule inversé :

```text
x = H * (-gx / |g|)    gauche / droite, positif vers la droite de la personne
y = H * ( gz / |g|)    avant / arrière, positif vers l’avant
```

Ici, `g` représente la gravité dans le repère du téléphone (`accelerationIncludingGravity - acceleration`) et `H` la hauteur cheville-téléphone saisie, de 100 cm par défaut. Le lacet, le tangage et le roulis ne sont volontairement pas utilisés : lorsque le téléphone est vertical, le tangage est proche de 90°, où ces angles d’Euler sont mal conditionnés, ce qui aplatit un axe et amplifie l’autre. Chaque trajectoire affichée est centrée sur sa propre moyenne. L’aire d’oscillation à 95 % est calculée à partir de l’ellipse de covariance de la trajectoire estimée. Les trajectoires enregistrées pour le graphique sont sous-échantillonnées à environ un point toutes les 200 ms.

Ces mesures sont des **estimations**, et non des mesures directes issues d’une plateforme de force. La hauteur saisie, le placement du téléphone, la posture et l’orientation de l’appareil influencent les résultats. Gardez la même hauteur, le même placement et les mêmes conditions de test pour comparer les séries. L’indice de stabilité est une aide à la comparaison arbitraire et n’est pas validé cliniquement. L’application n’est pas un dispositif médical.

## Données locales

Les options de mesure et les séries enregistrées sont stockées sur l’appareil avec `expo-sqlite/kv-store`. Aucun compte ni aucune synchronisation distante ne sont configurés. Les séries enregistrées comprennent la hauteur cheville-téléphone, des mesures récapitulatives et des trajectoires compactes pour le graphique ; les séries antérieures utilisaient 100 cm. Les échantillons de mouvement bruts sont utilisés pendant la mesure, mais ne sont pas conservés dans l’historique des séries. La suppression d’une série ou de l’historique efface les enregistrements locaux correspondants.

Chaque série enregistrée indique la version du modèle d’oscillation utilisée. Les séries enregistrées avec l’ancien modèle fondé sur le lacet, le tangage et le roulis comportent des valeurs inexactes : elles sont signalées dans l’onglet **Series** et ne peuvent pas être ajoutées au graphique. Supprimez-les et enregistrez de nouvelles séries.

## Vérifications de développement

```sh
npx tsc --noEmit
npx expo lint
npx expo install --check
npx expo-doctor
node --test tests/pivot-height.test.cjs
```

Les dépendances compatibles avec le SDK Expo sont listées dans `package.json` et verrouillées par `package-lock.json`. La sortie web est explicitement conservée sous forme d’application monopage avec des routes synchrones, comme par défaut avec le SDK 57.

La version affichée dans **About** provient de `expo.version` dans `app.json` (actuellement `1.0.0`). Modifiez-la pour les nouvelles versions ; `package.json` contient une version distincte pour le paquet npm.
