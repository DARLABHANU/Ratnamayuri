const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ratnamayuri';

const seedProducts = [
  // 1. LUXURY JEWELLERY (Category: jewellery)
  {
    name: "Royal Temple Gold Choker Set",
    slug: "royal-temple-gold-choker-set",
    price: 145000,
    compare_price: 165000,
    description: "An exquisite heritage Temple Gold Choker necklace, handcrafted in 22-karat hallmarked gold. Embellished with fine ruby cabochons and natural pearls, depicting traditional motifs of Goddess Lakshmi.",
    short_description: "Exquisite 22k Temple Gold Choker set with rubies and pearls.",
    sku: "RMJ-001",
    stock_quantity: 5,
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"],
    tags: ["temple", "gold", "choker", "jewellery"],
    is_featured: true,
    category_slug: "jewellery"
  },
  {
    name: "Kundan Polki Pearl Jhumkas",
    slug: "kundan-polki-pearl-jhumkas",
    price: 34000,
    compare_price: 40000,
    description: "Ornate Indian traditional Jhumka earrings set with premium Kundan stones, uncut Polki diamonds, and finished with delicate rows of natural basra pearls.",
    short_description: "Stunning Kundan & Polki Jhumka earrings with natural pearls.",
    sku: "RMJ-002",
    stock_quantity: 12,
    images: ["https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=600&q=80"],
    tags: ["jhumkas", "kundan", "polki", "earrings"],
    is_featured: false,
    category_slug: "jewellery"
  },
  {
    name: "Nakshi Antique Gold Kada",
    slug: "nakshi-antique-gold-kada",
    price: 85000,
    compare_price: 95000,
    description: "A solid 22k antique-finished Nakshi gold bangle, featuring detailed hand-carved mythological figurines and floral borders. A true collector's heirloom piece.",
    short_description: "Solid 22k gold antique kada with intricate Nakshi carvings.",
    sku: "RMJ-003",
    stock_quantity: 8,
    images: ["https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=600&q=80"],
    tags: ["kada", "bangle", "antique", "gold"],
    is_featured: true,
    category_slug: "jewellery"
  },
  {
    name: "Traditional Nakshi Kasu Mala",
    slug: "traditional-nakshi-kasu-mala",
    price: 120000,
    compare_price: 135000,
    description: "A classic South Indian Kasulaperu or Kasu Mala, featuring coins depicting Goddess Lakshmi, strung together with delicate gold floral links and accented with kemp rubies.",
    short_description: "Classic 22k gold Kasu Mala coin necklace with kemp rubies.",
    sku: "RMJ-004",
    stock_quantity: 6,
    images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"],
    tags: ["kasu-mala", "necklace", "gold", "traditional"],
    is_featured: false,
    category_slug: "jewellery"
  },
  {
    name: "Diamond Emerald Floral Ring",
    slug: "diamond-emerald-floral-ring",
    price: 95000,
    compare_price: 110000,
    description: "A contemporary luxury ring featuring a brilliant-cut center teardrop Zambian emerald, surrounded by hand-set VVS-grade natural diamonds in 18k white gold floral petals.",
    short_description: "Elegant Zambian emerald & diamond floral cluster ring in 18k gold.",
    sku: "RMJ-005",
    stock_quantity: 4,
    images: ["https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80"],
    tags: ["ring", "diamond", "emerald", "luxury"],
    is_featured: true,
    category_slug: "jewellery"
  },
  {
    name: "Meenakari Peacock Chandbalis",
    slug: "meenakari-peacock-chandbalis",
    price: 42500,
    compare_price: 48000,
    description: "Charming crescent-shaped Chandbali earrings, decorated with vibrant hand-painted Meenakari enamel, kundan gemstones, and tiny hanging seed pearls.",
    short_description: "Vibrant Meenakari peacock chandbalis with pearls.",
    sku: "RMJ-006",
    stock_quantity: 15,
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"],
    tags: ["chandbalis", "meenakari", "earrings", "traditional"],
    is_featured: false,
    category_slug: "jewellery"
  },
  {
    name: "Guttapusalu Pearl Haar Necklace",
    slug: "guttapusalu-pearl-haar-necklace",
    price: 165000,
    compare_price: 185000,
    description: "A royal Guttapusalu necklace, densely fringed with bunches of tiny natural seed pearls and punctuated with oval rubies and emeralds, set in a gold frame.",
    short_description: "Royal 22k gold Guttapusalu necklace with rich pearl clusters.",
    sku: "RMJ-007",
    stock_quantity: 3,
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"],
    tags: ["guttapusalu", "necklace", "pearls", "jewellery"],
    is_featured: true,
    category_slug: "jewellery"
  },

  // 2. SILK SAREES (Category: sarees)
  {
    name: "Royal Emerald Kanjivaram Silk Saree",
    slug: "royal-emerald-kanjivaram-silk-saree",
    price: 18500,
    compare_price: 22000,
    description: "Woven in pure mulberry silk, this emerald green Kanjivaram features a solid korvai border in crimson red with traditional Kamalam (lotus) gold zari motifs.",
    short_description: "Pure Kanjivaram silk saree in emerald green with red zari border.",
    sku: "RMS-001",
    stock_quantity: 20,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"],
    tags: ["kanjivaram", "silk", "saree", "green"],
    is_featured: true,
    category_slug: "sarees"
  },
  {
    name: "Crimson Banarasi Silk Saree",
    slug: "crimson-banarasi-silk-saree",
    price: 24000,
    compare_price: 28000,
    description: "A stunning handloom Katan silk Banarasi saree in a deep bridal crimson. Adorned with intricate shikargah hunting scene designs and dense golden zari work.",
    short_description: "Traditional crimson Katan silk Banarasi handloom saree.",
    sku: "RMS-002",
    stock_quantity: 15,
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"],
    tags: ["banarasi", "silk", "saree", "crimson"],
    is_featured: true,
    category_slug: "sarees"
  },
  {
    name: "Midnight Blue Patola Silk Saree",
    slug: "midnight-blue-patola-silk-saree",
    price: 32500,
    compare_price: 38000,
    description: "A rare double ikat Patan Patola silk saree, hand-woven with geometric patterns and parrot motifs in shades of midnight blue, terracotta, and ochre gold.",
    short_description: "Stunning handloom double ikat Patan Patola silk saree.",
    sku: "RMS-003",
    stock_quantity: 5,
    images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80"],
    tags: ["patola", "silk", "saree", "blue"],
    is_featured: false,
    category_slug: "sarees"
  },
  {
    name: "Golden Mustard Organza Silk Saree",
    slug: "golden-mustard-organza-silk-saree",
    price: 12999,
    compare_price: 15000,
    description: "Lightweight and elegant mustard yellow organza silk saree, featuring delicate hand-embroidered gold zardosi borders and tiny buttis scattered across the body.",
    short_description: "Graceful mustard yellow organza silk saree with zardosi work.",
    sku: "RMS-004",
    stock_quantity: 25,
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"],
    tags: ["organza", "silk", "saree", "yellow"],
    is_featured: false,
    category_slug: "sarees"
  },
  {
    name: "Pastel Pink Mysore Silk Saree",
    slug: "pastel-pink-mysore-silk-saree",
    price: 14500,
    compare_price: 16500,
    description: "A lightweight pure Mysore crepe silk saree in soft pastel rose pink, featuring a minimalist solid gold zari border and rich gold zari lines in the pallu.",
    short_description: "Crepe Mysore silk saree in baby pink with pure gold zari.",
    sku: "RMS-005",
    stock_quantity: 18,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"],
    tags: ["mysore-silk", "saree", "pink", "crepe"],
    is_featured: true,
    category_slug: "sarees"
  },
  {
    name: "Classic Off-White Tussar Silk Saree",
    slug: "classic-off-white-tussar-silk-saree",
    price: 9500,
    compare_price: 11000,
    description: "An organic off-white wild Tussar silk saree, showcasing hand-painted Madhubani folklore patterns along the borders and pallu. Eco-friendly and rustic.",
    short_description: "Hand-painted Madhubani organic Tussar silk saree.",
    sku: "RMS-006",
    stock_quantity: 30,
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"],
    tags: ["tussar", "silk", "saree", "madhubani"],
    is_featured: false,
    category_slug: "sarees"
  },
  {
    name: "Deep Violet Paithani Silk Saree",
    slug: "deep-violet-paithani-silk-saree",
    price: 27500,
    compare_price: 32000,
    description: "A magnificent Maharashtrian Paithani silk saree, woven in brilliant royal violet. Features the traditional square border and a rich golden pallu woven with signature peacock motifs.",
    short_description: "Royal violet handloom Paithani silk saree with golden peacock border.",
    sku: "RMS-007",
    stock_quantity: 8,
    images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80"],
    tags: ["paithani", "silk", "saree", "violet"],
    is_featured: true,
    category_slug: "sarees"
  },

  // 3. BRIDAL COLLECTION (Category: bridal)
  {
    name: "Heritage Royal Bridal Lehenga Saree",
    slug: "heritage-royal-bridal-lehenga-saree",
    price: 48000,
    compare_price: 55000,
    description: "A beautiful fusion lehenga-style saree in deep vermillion and crimson velvet. Fully hand-embroidered with intricate golden pita work and metallic zari florals.",
    short_description: "Vermillion & crimson bridal lehenga saree with zardozi.",
    sku: "RMB-001",
    stock_quantity: 4,
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"],
    tags: ["bridal", "lehenga", "saree", "wedding"],
    is_featured: true,
    category_slug: "bridal"
  },
  {
    name: "Nuptial Red Kanjivaram Bridal Saree",
    slug: "nuptial-red-kanjivaram-bridal-saree",
    price: 35000,
    compare_price: 40000,
    description: "A heavy-weight Kanjivaram wedding saree in traditional vermillion red, featuring solid pure silver zari work dipped in 22k gold, illustrating wedding mandap stories.",
    short_description: "Pure gold-dipped zari heavy Kanjivaram wedding saree.",
    sku: "RMB-002",
    stock_quantity: 6,
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"],
    tags: ["bridal", "kanjivaram", "wedding", "saree"],
    is_featured: true,
    category_slug: "bridal"
  },
  {
    name: "Grand Kundan Bridal Choker Set",
    slug: "grand-kundan-bridal-choker-set",
    price: 250000,
    compare_price: 285000,
    description: "A breathtaking multi-layered Jadau Kundan bridal choker set, featuring clusters of real uncut polki diamonds, blood-red rubies, and premium Zambian emerald drops.",
    short_description: "Exquisite Jadau Kundan multi-tiered bridal choker necklace set.",
    sku: "RMB-003",
    stock_quantity: 2,
    images: ["https://images.unsplash.com/photo-1607823489283-1dd240bab3be?auto=format&fit=crop&w=600&q=80"],
    tags: ["bridal", "kundan", "choker", "set"],
    is_featured: true,
    category_slug: "bridal"
  },
  {
    name: "Traditional Temple Bridal Matha Patti",
    slug: "traditional-temple-bridal-matha-patti",
    price: 28000,
    compare_price: 32000,
    description: "A traditional three-tiered temple style head ornament (Matha Patti) in 22k gold plating, encrusted with kemp rubies and dangling fresh water pearls.",
    short_description: "Regal 22k gold Temple style bridal head ornament.",
    sku: "RMB-004",
    stock_quantity: 10,
    images: ["https://images.unsplash.com/photo-1607823489283-1dd240bab3be?auto=format&fit=crop&w=600&q=80"],
    tags: ["matha-patti", "bridal", "temple", "jewellery"],
    is_featured: false,
    category_slug: "bridal"
  },
  {
    name: "Complete Bridal Solah Shringar Set",
    slug: "complete-bridal-solah-shringar-set",
    price: 375000,
    compare_price: 420000,
    description: "A complete curated box of bridal adornments: including a grand choker, long haar necklace, mathapatti, bajuband (armlet), nath (nose ring), and hathphool (hand chains).",
    short_description: "Exquisite full-box set of 22k gold bridal wedding ornaments.",
    sku: "RMB-005",
    stock_quantity: 1,
    images: ["https://images.unsplash.com/photo-1607823489283-1dd240bab3be?auto=format&fit=crop&w=600&q=80"],
    tags: ["solah-shringar", "bridal", "full-set", "luxury"],
    is_featured: true,
    category_slug: "bridal"
  },
  {
    name: "Royal Golden Bridal Zardozi Shawl",
    slug: "royal-golden-bridal-zardozi-shawl",
    price: 19500,
    compare_price: 23000,
    description: "A majestic tissue silk bridal veil/shawl in antique gold, dense with handloom zardozi vines, salma, and sitara embroideries along the margins.",
    short_description: "Stunning gold tissue silk zardozi embroidered bridal shawl.",
    sku: "RMB-006",
    stock_quantity: 12,
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"],
    tags: ["shawl", "bridal", "zardozi", "gold"],
    is_featured: false,
    category_slug: "bridal"
  },
  {
    name: "Embellished Crimson Velvet Bridal Dupatta",
    slug: "embellished-crimson-velvet-bridal-dupatta",
    price: 8500,
    compare_price: 10000,
    description: "A rich vermillion red velvet dupatta, bordered with thick handloom zari zardosi work and beaded fringes. Adds a royal touch to the bridal trousseau.",
    short_description: "Luxurious red velvet bridal dupatta with zardosi border.",
    sku: "RMB-007",
    stock_quantity: 15,
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"],
    tags: ["dupatta", "bridal", "velvet", "red"],
    is_featured: false,
    category_slug: "bridal"
  }
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB!');

  // 1. Resolve merchant id
  const merchant = await User.findOne({ email: 'darlabhanumurthy@gmail.com' });
  const merchantId = merchant ? merchant.id : 3;
  console.log(`Resolved Merchant ID for darlabhanumurthy@gmail.com: ${merchantId}`);

  // 2. Resolve category mappings
  const categories = await Category.find({});
  const catMap = {};
  categories.forEach(cat => {
    catMap[cat.slug] = cat.id;
  });
  console.log('Resolved category mappings from DB:', catMap);

  // 3. Insert products
  let count = 0;
  for (const prod of seedProducts) {
    const existing = await Product.findOne({ slug: prod.slug });
    if (!existing) {
      const categoryId = catMap[prod.category_slug] || null;
      
      const newProd = new Product({
        merchant_id: merchantId,
        category_id: categoryId,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        short_description: prod.short_description,
        price: prod.price,
        compare_price: prod.compare_price,
        sku: prod.sku,
        stock_quantity: prod.stock_quantity,
        images: prod.images,
        tags: prod.tags,
        is_featured: prod.is_featured,
        is_active: true
      });

      await newProd.save();
      console.log(`Successfully seeded product: ${prod.name} (SKU: ${prod.sku})`);
      count++;
    } else {
      console.log(`Product already exists: ${prod.name}`);
    }
  }

  console.log(`Seeding completed. Successfully inserted ${count} new demo products!`);
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seed().catch(err => {
  console.error('Error while seeding demo products:', err);
  process.exit(1);
});
