import { Product } from "@/api/models";

export const messages = [
  {
    type: "ai",
    text: "Hello! To recommend the exact OEM-certified motor oil for your vehicle, which car do you have?",
    time: "10:42 AM",
  },
  {
    type: "user",
    text: "Shkoda aktavia",
    time: "10:43 AM",
  },
  {
    type: "ai",
    text: "Got it! Detected vehicle: Škoda Octavia (1.4 TSI / 2.0 TDI compatibility). Here are the top 3 manufacturer-approved engine oils perfectly formulated for your engine specifications and longevity:",
    time: "10:43 AM",
    match: "OEM Match: Škoda Octavia (1.4 TSI / 2.0 TDI)",
  },
];

export const products: Product[] = [
  {
    id: "product_001",
    name: "Castrol EDGE",
    article: "CASTROL-EDGE-5W30-5L",
    price: 42.99,
    unit: "5L",
    features: {
      sae: "5W-30",
      api: ["SN"],
      acea: ["C3"],
      oem_approvals: ["VW 504 00", "VW 507 00"],
    },
  },
  {
    id: "product_002",
    name: "Mobil 1 ESP",
    article: "MOBIL1-ESP-5W30-5L",
    price: 39.5,
    unit: "5L",
    features: {
      sae: "5W-30",
      api: ["SN"],
      acea: ["C3"],
      oem_approvals: ["VW 504 00", "VW 507 00"],
    },
  },
  {
    id: "product_003",
    name: "Motul 8100",
    article: "MOTUL-8100-5W30-5L",
    price: 46.0,
    unit: "5L",
    features: {
      sae: "5W-30",
      api: ["SP-RC"],
      acea: ["C2", "C3"],
      oem_approvals: ["Euro 5/6 Compatible"],
    },
  },
];