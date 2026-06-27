import { Product } from "../types";

const base =
  "https://raw.githubusercontent.com/deonvault-crypto/norea-website/main/assets/images";

export const categories = [
  "Leggings",
  "Sports Bras",
  "Hoodies",
  "Shorts",
  "Jackets",
  "Gym Sets",
  "Training Wear",
  "Activewear"
] as const;

export const products: Product[] = [
  {
    id: "norea-eclipse-sculpt-set",
    title: "NORÉA Eclipse Sculpt Set",
    category: "Gym Sets",
    priceUsd: 68,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Onyx", "Blush", "Navy", "Cloud"],
    rating: 4.9,
    reviews: [
      {
        id: "r1",
        author: "Tariro M.",
        rating: 5,
        body: "The fit feels premium and secure without feeling tight.",
        createdAt: "2026-05-02"
      }
    ],
    badge: "Best seller",
    imageUrl: `${base}/05-athleisure-elegance-with-confident-style.webp`,
    gallery: [
      `${base}/05-athleisure-elegance-with-confident-style.webp`,
      `${base}/03-confident-style-in-minimalist-fashion-shot.webp`,
      `${base}/17-luxury-activewear-details-and-textures.webp`
    ],
    description:
      "A sculpting activewear set made for strength training, errands and elevated everyday movement.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Returns accepted within 7 days if unworn, unwashed and in original packaging.",
    inventory: 42
  },
  {
    id: "norea-aura-legging",
    title: "NORÉA Aura High-Waist Legging",
    category: "Leggings",
    priceUsd: 44,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Rose", "Onyx", "Navy", "Pastel Blue"],
    rating: 4.8,
    reviews: [],
    badge: "New arrival",
    imageUrl: `${base}/28-confident-activewear-fashion-in-neutral-tones.webp`,
    gallery: [
      `${base}/28-confident-activewear-fashion-in-neutral-tones.webp`,
      `${base}/34-essential-activewear-essentials-in-minimal-style.webp`
    ],
    description:
      "Supportive high-waist leggings with a smooth waistband, soft compression and a clean luxury finish.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Size exchanges are available while stock lasts.",
    inventory: 54
  },
  {
    id: "norea-rose-sports-bra",
    title: "NORÉA Rose Support Sports Bra",
    category: "Sports Bras",
    priceUsd: 32,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Rose", "White", "Navy", "Onyx"],
    rating: 4.7,
    reviews: [],
    badge: "Studio essential",
    imageUrl: `${base}/24-blush-energy-athletic-elegance-in-pink.webp`,
    gallery: [
      `${base}/24-blush-energy-athletic-elegance-in-pink.webp`,
      `${base}/19-pure-form-minimalist-activewear-promo.webp`
    ],
    description:
      "A medium-support sports bra with a smooth neckline, premium stretch and all-day comfort.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Hygiene-sensitive items must be unworn with tags attached.",
    inventory: 38
  },
  {
    id: "norea-drift-hoodie",
    title: "NORÉA Drift Cloud Hoodie",
    category: "Hoodies",
    priceUsd: 58,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Cloud", "Blush", "Navy", "Soft Gray"],
    rating: 4.8,
    reviews: [],
    badge: "Soft layer",
    imageUrl: `${base}/06-modern-athletic-fashion-advert-with-model.webp`,
    gallery: [
      `${base}/06-modern-athletic-fashion-advert-with-model.webp`,
      `${base}/33-relaxed-moment-in-a-pilates-studio.webp`
    ],
    description:
      "A plush athleisure hoodie for travel, warmups and polished off-duty styling.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Returns accepted within 7 days if unworn and in original packaging.",
    inventory: 24
  },
  {
    id: "norea-blush-sprint-short",
    title: "NORÉA Blush Sprint Short",
    category: "Shorts",
    priceUsd: 36,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Blush", "Onyx", "Navy", "Rose"],
    rating: 4.6,
    reviews: [],
    badge: "Warm weather",
    imageUrl: `${base}/13-confident-elegance-in-activewear-styling.webp`,
    gallery: [
      `${base}/13-confident-elegance-in-activewear-styling.webp`,
      `${base}/23-sky-motion-athleisure-collection-promo.webp`
    ],
    description:
      "Lightweight active shorts with a flattering waistband and breathable performance feel.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Size exchanges are available while stock lasts.",
    inventory: 40
  },
  {
    id: "norea-tempo-zip-jacket",
    title: "NORÉA Tempo Zip Jacket",
    category: "Jackets",
    priceUsd: 52,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["White", "Rose", "Navy", "Onyx"],
    rating: 4.9,
    reviews: [],
    badge: "Premium layer",
    imageUrl: `${base}/08-luxury-athleisure-in-motion.webp`,
    gallery: [
      `${base}/08-luxury-athleisure-in-motion.webp`,
      `${base}/30-fitness-fashion-cropped-zip-training-jackets.webp`
    ],
    description:
      "A cropped zip jacket with contour seams, clean logo placement and smooth layering stretch.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Returns accepted within 7 days if unworn and in original packaging.",
    inventory: 31
  }
];
