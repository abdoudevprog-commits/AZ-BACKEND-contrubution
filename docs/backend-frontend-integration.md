# Backend API Guide pour le Frontend

## 1) URL de base

Le frontend doit appeler le CMS via la variable d'environnement suivante:

- VITE_CMS_URL=https://agency-baack-production.up.railway.app

Exemples d'URL finales:

- https://agency-baack-production.up.railway.app/api/offers
- https://agency-baack-production.up.railway.app/api/media

## 2) Collections disponibles (REST)

Toutes les collections ci-dessous sont exposées en REST:

- GET /api/offers
- GET /api/destinations
- GET /api/hotels
- GET /api/testimonials
- GET /api/faqs
- GET /api/features
- GET /api/booking-steps
- GET /api/media
- GET /api/reservations
- POST /api/reservations

Routes par ID:

- GET /api/offers/:id
- GET /api/destinations/:id
- GET /api/hotels/:id
- GET /api/media/:id
- etc.

## 3) Globals disponibles (REST)

Le projet expose aussi des contenus de page globaux:

- GET /api/globals/home-page
- GET /api/globals/gallery-page
- GET /api/globals/booking-process-content

## 4) Paramètres de requête utiles

Payload supporte des paramètres standards:

- depth: expansion des relations (ex: médias, hôtels)
- limit, page: pagination
- sort: tri
- where: filtres

Exemples:

- /api/offers?depth=2&limit=12
- /api/offers?where[showOnHomepage][equals]=true
- /api/destinations?sort=createdAt

## 5) Structure des réponses

### 5.1 Réponses de liste

Format Payload standard:

- docs: tableau d'objets
- totalDocs
- limit
- totalPages
- page
- hasPrevPage
- hasNextPage
- prevPage
- nextPage

### 5.2 Relations

Selon depth, un champ relation peut être:

- un ID (string)
- ou un objet complet

Exemple sur offers:

- hotels: tableau de IDs ou d'objets Hotel
- mainImage / flagMedia: ID ou objet Media

## 6) Contrat principal des données

### 6.1 Offer (offres)

Champs clés pour le frontend:

- id, title, slug, destination, country, region
- shortDescription, description (richText)
- mainImage, mainImageUrl
- detailGallery (main, side01, side02, side03)
- dates, startDate, endDate, duration, durationDays, durationNights
- price, priceAmount, currency
- status, showOnHomepage
- priceCard (labels du widget de réservation)
- inclusions, exclusions
- program
- hotels (relations)

### 6.2 Hotel

Champs clés:

- id, name, description, stars, rating
- dates, price, priceAmount, currency
- childPriceBrackets
- mainImage, mainImageUrl, images
- amenities
- transferIncluded, breakfastIncluded
- offers (relations)

### 6.3 Destination

Champs clés:

- id, name, country, slug, category
- image, imageUrl
- cardDescription, cardTags, href

### 6.4 Media

Champs clés:

- id, alt, url, thumbnailURL, filename, mimeType
- filesize, width, height
- sizes.thumbnail / sizes.card / sizes.hero

Note Cloudinary:

- Les nouveaux uploads sont envoyés sur Cloudinary.
- Le backend ajoute un champ cloudinaryPublicId (utile pour debug et transformations Cloudinary).
- Si tu veux ce champ dans les types TS frontend, régénérer les types Payload.

### 6.5 Reservation (formulaire front)

Création publique autorisée:

- POST /api/reservations

Champs requis:

- fullName (string)
- phone (string)
- selectedHotel (string)
- adults (number >= 1)

Champs optionnels:

- offerTitle, offerId
- children
- totalEstimated
- currency (defaut DZD)
- childDetails (JSON sérialisé en string)

Exemple body:

{
  "fullName": "Nom Prenom",
  "phone": "+213XXXXXXXXX",
  "offerTitle": "Istanbul Premium",
  "offerId": "abc123",
  "selectedHotel": "Hotel X",
  "adults": 2,
  "children": 1,
  "totalEstimated": "180000",
  "currency": "DZD",
  "childDetails": "[{\"age\":7,\"price\":60000}]"
}

## 7) Auth côté frontend public

Le site public n'a pas besoin de login pour lire les collections ci-dessus.

Auth utile pour dashboard admin/integrations privées:

- POST /api/users/login
- POST /api/users/forgot-password

## 8) Gestion d'erreurs (frontend)

Recommandation simple:

- Si status 2xx: utiliser data
- Si status 4xx/5xx: fallback UI + log technique
- Timeout réseau: afficher message indisponibilité CMS

Exemple de fallback utile:

- garder un tableau local de secours pour sections critiques (offres, destinations)

## 9) Conseils d'intégration frontend

- Toujours demander depth=1 ou depth=2 quand tu as besoin des relations media/hotels.
- Prévoir fallback imageUrl si image (relation media) est vide.
- Normaliser les champs prix en string affichable côté UI.
- Sur pages listing, utiliser limit + pagination pour de meilleures perfs.

## 10) Fichier source de référence

Pour les types backend actuels:

- src/payload-types.ts

Pour la config API/collections:

- src/payload.config.ts
- src/collections
- src/globals
