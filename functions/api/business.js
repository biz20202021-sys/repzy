// website/functions/api/business.js
//
// Cloudflare Pages Function — endpoint : GET /api/business?id=<shortLinkOuIdCarteTrello>
//
// Exemple : la carte https://trello.com/c/N5cFcZMK/2-001 a pour shortLink "N5cFcZMK",
// donc l'URL sur la carte NFC peut être : https://tonsite.pages.dev/?id=N5cFcZMK
//
// Lit une carte Trello (titre + description + pièce jointe logo) et la
// transforme en JSON exploitable par index.html.
//
// Format attendu dans la description de la carte (une info par ligne,
// "N/A" pour un champ absent) :
//   Ville: Saint-Julien
//   Place ID: ChIJxxxxxxxxxxxxxx
//   Website: N/A
//   Facebook: N/A
//   Instagram: https://instagram.com/chezmarco
//   TripAdvisor: https://www.tripadvisor.com/...
//   Note: 4.6
//   Avis: 128
//
// Le nom de l'établissement vient du TITRE de la carte, pas de la description.
// Le logo doit être ajouté comme PIÈCE JOINTE (image) sur la carte.
//
// Variables d'environnement requises (à définir dans Cloudflare Pages →
// Settings → Environment Variables, PAS dans un fichier .env) :
//   TRELLO_API_KEY
//   TRELLO_TOKEN

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cardId = url.searchParams.get('id');

  if (!cardId) {
    return jsonResponse({ error: 'Paramètre "id" manquant (ex: /api/business?id=N5cFcZMK)' }, 400);
  }

  const { TRELLO_API_KEY, TRELLO_TOKEN } = env;
  if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    return jsonResponse({ error: 'Variables TRELLO_API_KEY / TRELLO_TOKEN non configurées sur Cloudflare Pages' }, 500);
  }
  const auth = `key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

  // 1. Récupérer la carte (nom + description)
  let card;
  try {
    const res = await fetch(`https://api.trello.com/1/cards/${encodeURIComponent(cardId)}?${auth}&fields=name,desc,idAttachmentCover`);
    if (res.status === 404) return jsonResponse({ error: 'Carte Trello introuvable pour cet id' }, 404);
    if (!res.ok) return jsonResponse({ error: `Erreur Trello (${res.status})` }, 502);
    card = await res.json();
  } catch (e) {
    return jsonResponse({ error: "Impossible de contacter l'API Trello" }, 502);
  }

  // 2. Récupérer les pièces jointes pour trouver le logo
  let logo = '';
  try {
    const res = await fetch(`https://api.trello.com/1/cards/${encodeURIComponent(cardId)}/attachments?${auth}&fields=url,isUpload,mimeType`);
    if (res.ok) {
      const attachments = await res.json();
      const images = attachments.filter(a => a.isUpload && (a.mimeType || '').startsWith('image/'));
      // Priorité à la pièce jointe définie comme "cover" de la carte, sinon la première image
      const cover = images.find(a => a.id === card.idAttachmentCover);
      logo = (cover || images[0] || {}).url || '';
    }
  } catch (e) {
    // pas bloquant : la page affichera les initiales si pas de logo
  }

  const champs = parseCardDescription(card.desc || '');
  const placeId = clean(champs['place id']);

  const data = {
    nom: card.name || '',
    ville: clean(champs['ville']),
    logo,
    website: clean(champs['website']),
    facebook: clean(champs['facebook']),
    instagram: clean(champs['instagram']),
    tripadvisor: clean(champs['tripadvisor']),
    note: champs['note'] ? parseFloat(champs['note']) : null,
    avis: champs['avis'] ? parseInt(champs['avis'], 10) : null,
    placeId,
    // Liens générés automatiquement à partir du Place ID (pas besoin de les taper à la main)
    google: placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : '',
    maps: placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : '',
  };

  return jsonResponse(data, 200);
}

/**
 * Parse une description Trello au format "Champ: valeur" (une ligne par champ).
 */
function parseCardDescription(desc) {
  const champs = {};
  desc.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^:]+):\s*(.+?)\s*$/);
    if (m) champs[m[1].trim().toLowerCase()] = m[2].trim();
  });
  return champs;
}

/** "N/A" (quelle que soit la casse) ou vide → chaîne vide, sinon la valeur telle quelle. */
function clean(v) {
  if (!v) return '';
  return /^n\/?a$/i.test(v.trim()) ? '' : v.trim();
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
