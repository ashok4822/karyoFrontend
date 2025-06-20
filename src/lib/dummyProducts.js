const categories = [
  "Gen Z bags",
  "Laptop bags",
  "Premium bags",
  "Campus bags",
  "School bags",
  "Unisex bags",
];
const brands = ["Safari", "Skybags", "Wildcraft", "Genie"];
const variants = [
  { Colour: ["Red", "Blue", "Black", "Green"] },
  { "Size/Capacity": ["20L", "25L", "30L", "35L"] },
];
const images = [
  "/public/hero-image.jpg.jpg",
  "/public/placeholder.svg",
  "/public/favicon.ico",
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const dummyProducts = Array.from({ length: 30 }, (_, i) => {
  const category = getRandom(categories);
  const brand = getRandom(brands);
  const price = Math.floor(Math.random() * 4000) + 500;
  const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0;
  const isNew = Math.random() > 0.7;
  const featured = Math.random() > 0.8;
  const rating = (Math.random() * 2 + 3).toFixed(1);
  const reviews = Math.floor(Math.random() * 200) + 1;
  const name = `${brand} ${category} #${i + 1}`;
  const imageArr = [getRandom(images), getRandom(images), getRandom(images)];
  const description = `A stylish and durable ${category} by ${brand}. Perfect for daily use, travel, and more.`;
  const stock = Math.floor(Math.random() * 20); // 0-19
  const blocked = Math.random() > 0.95; // 5% chance blocked
  const unavailable = Math.random() > 0.97; // 3% chance unavailable
  const specs = [
    { key: "Material", value: getRandom(["Polyester", "Nylon", "Canvas"]) },
    { key: "Weight", value: getRandom(["500g", "700g", "1kg"]) },
    { key: "Warranty", value: getRandom(["1 year", "2 years", "6 months"]) },
  ];
  const coupons = [
    { code: "SAVE10", discount: 10, description: "Get 10% off!" },
    { code: "FREESHIP", discount: 0, description: "Free Shipping!" },
  ];
  return {
    id: i + 1,
    name,
    category,
    brand,
    price,
    comparePrice: discount ? price + Math.floor(price * (discount / 100)) : null,
    image: imageArr[0],
    images: imageArr,
    rating: Number(rating),
    reviews,
    description,
    discount,
    isNew,
    featured,
    stock,
    blocked,
    unavailable,
    specs,
    coupons,
    variants: [
      {
        Colour: getRandom(["Red", "Blue", "Black", "Green"]),
        "Size/Capacity": getRandom(["20L", "25L", "30L", "35L"]),
      },
    ],
  };
});

export default dummyProducts; 