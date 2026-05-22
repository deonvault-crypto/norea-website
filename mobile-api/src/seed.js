const imageBase =
  "https://raw.githubusercontent.com/deonvault-crypto/norea-website/main/assets/images";

export const orderStatuses = [
  "Pending",
  "Paid",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

export const paymentMethods = [
  "PAYNOW",
  "ECOCASH",
  "ONEMONEY",
  "ZIPIT",
  "VISA",
  "MASTERCARD",
  "BANK_TRANSFER"
];

export const seedProducts = [
  {
    id: "norea-eclipse-sculpt-set",
    title: "NORÉA Eclipse Sculpt Set",
    category: "Gym Sets",
    priceUsd: 68,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Onyx", "Blush", "Navy", "Cloud"],
    rating: 4.9,
    badge: "Best seller",
    imageUrl: `${imageBase}/05-athleisure-elegance-with-confident-style.webp`,
    gallery: [
      `${imageBase}/05-athleisure-elegance-with-confident-style.webp`,
      `${imageBase}/03-confident-style-in-minimalist-fashion-shot.webp`,
      `${imageBase}/17-luxury-activewear-details-and-textures.webp`
    ],
    description:
      "A sculpting activewear set made for strength training, errands and elevated everyday movement.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Returns accepted within 7 days if unworn, unwashed and in original packaging.",
    inventory: 42,
    active: true,
    createdAt: "2026-05-22T00:00:00.000Z"
  },
  {
    id: "norea-aura-legging",
    title: "NORÉA Aura High-Waist Legging",
    category: "Leggings",
    priceUsd: 44,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Rose", "Onyx", "Navy", "Pastel Blue"],
    rating: 4.8,
    badge: "New arrival",
    imageUrl: `${imageBase}/28-confident-activewear-fashion-in-neutral-tones.webp`,
    gallery: [
      `${imageBase}/28-confident-activewear-fashion-in-neutral-tones.webp`,
      `${imageBase}/34-essential-activewear-essentials-in-minimal-style.webp`
    ],
    description:
      "Supportive high-waist leggings with a smooth waistband, soft compression and a clean luxury finish.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Size exchanges are available while stock lasts.",
    inventory: 54,
    active: true,
    createdAt: "2026-05-22T00:00:00.000Z"
  },
  {
    id: "norea-rose-sports-bra",
    title: "NORÉA Rose Support Sports Bra",
    category: "Sports Bras",
    priceUsd: 32,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Rose", "White", "Navy", "Onyx"],
    rating: 4.7,
    badge: "Studio essential",
    imageUrl: `${imageBase}/24-blush-energy-athletic-elegance-in-pink.webp`,
    gallery: [
      `${imageBase}/24-blush-energy-athletic-elegance-in-pink.webp`,
      `${imageBase}/19-pure-form-minimalist-activewear-promo.webp`
    ],
    description:
      "A medium-support sports bra with a smooth neckline, premium stretch and all-day comfort.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Hygiene-sensitive items must be unworn with tags attached.",
    inventory: 38,
    active: true,
    createdAt: "2026-05-22T00:00:00.000Z"
  },
  {
    id: "norea-drift-hoodie",
    title: "NORÉA Drift Cloud Hoodie",
    category: "Hoodies",
    priceUsd: 58,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Cloud", "Blush", "Navy", "Soft Gray"],
    rating: 4.8,
    badge: "Soft layer",
    imageUrl: `${imageBase}/06-modern-athletic-fashion-advert-with-model.webp`,
    gallery: [
      `${imageBase}/06-modern-athletic-fashion-advert-with-model.webp`,
      `${imageBase}/33-relaxed-moment-in-a-pilates-studio.webp`
    ],
    description:
      "A plush athleisure hoodie for travel, warmups and polished off-duty styling.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Returns accepted within 7 days if unworn and in original packaging.",
    inventory: 24,
    active: true,
    createdAt: "2026-05-22T00:00:00.000Z"
  },
  {
    id: "norea-blush-sprint-short",
    title: "NORÉA Blush Sprint Short",
    category: "Shorts",
    priceUsd: 36,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["Blush", "Onyx", "Navy", "Rose"],
    rating: 4.6,
    badge: "Warm weather",
    imageUrl: `${imageBase}/13-confident-elegance-in-activewear-styling.webp`,
    gallery: [
      `${imageBase}/13-confident-elegance-in-activewear-styling.webp`,
      `${imageBase}/23-sky-motion-athleisure-collection-promo.webp`
    ],
    description:
      "Lightweight active shorts with a flattering waistband and breathable performance feel.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Size exchanges are available while stock lasts.",
    inventory: 40,
    active: true,
    createdAt: "2026-05-22T00:00:00.000Z"
  },
  {
    id: "norea-tempo-zip-jacket",
    title: "NORÉA Tempo Zip Jacket",
    category: "Jackets",
    priceUsd: 52,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colours: ["White", "Rose", "Navy", "Onyx"],
    rating: 4.9,
    badge: "Premium layer",
    imageUrl: `${imageBase}/08-luxury-athleisure-in-motion.webp`,
    gallery: [
      `${imageBase}/08-luxury-athleisure-in-motion.webp`,
      `${imageBase}/30-fitness-fashion-cropped-zip-training-jackets.webp`
    ],
    description:
      "A cropped zip jacket with contour seams, clean logo placement and smooth layering stretch.",
    deliveryInfo: "Nation-wide delivery in Zimbabwe within 6-10 days.",
    returnsInfo: "Returns accepted within 7 days if unworn and in original packaging.",
    inventory: 31,
    active: true,
    createdAt: "2026-05-22T00:00:00.000Z"
  }
];
