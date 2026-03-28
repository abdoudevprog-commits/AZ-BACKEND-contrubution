import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { payloadCloudinaryPlugin } from "@jhb.software/payload-cloudinary-plugin";
import sharp from "sharp";

// Collections
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Offers } from "./collections/Offers";
import { Destinations } from "./collections/Destinations";
import { Hotels } from "./collections/Hotels";
import { Testimonials } from "./collections/Testimonials";
import { FAQs } from "./collections/FAQs";
import { Features } from "./collections/Features";
import { BookingSteps } from "./collections/BookingSteps";
import { Reservations } from "./collections/Reservations";
import { GalleryPage } from "./globals/GalleryPage";
import { HomePage } from "./globals/HomePage";
import { BookingProcessContent } from "./globals/BookingProcessContent";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const inferredRailwayURL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : undefined;
const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL || inferredRailwayURL || "http://localhost:3001";
const frontendOrigins = (process.env.FRONTEND_ORIGINS || "https://az-voyage.vercel.app")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsHeaders = (
  process.env.CORS_HEADERS ||
  "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma"
)
  .split(",")
  .map((header) => header.trim())
  .filter(Boolean);
const requiredCloudinaryEnv = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

const missingCloudinaryVars = Object.entries(requiredCloudinaryEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingCloudinaryVars.length > 0) {
  throw new Error(
    `Missing required Cloudinary environment variables: ${missingCloudinaryVars.join(", ")}. Uploads cannot fall back to local storage.`,
  );
}

const payloadPlugins = [
  payloadCloudinaryPlugin({
    collections: {
      media: true,
    },
    clientUploads: true,
    cloudName: requiredCloudinaryEnv.CLOUDINARY_CLOUD_NAME as string,
    credentials: {
      apiKey: requiredCloudinaryEnv.CLOUDINARY_API_KEY as string,
      apiSecret: requiredCloudinaryEnv.CLOUDINARY_API_SECRET as string,
    },
    folder: process.env.CLOUDINARY_FOLDER || "agency-travel",
  }),
];

const allowedOrigins = Array.from(
  new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    serverURL,
    inferredRailwayURL,
    ...frontendOrigins,
  ].filter((origin): origin is string => Boolean(origin))),
);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    Users,
    Media,
    Offers,
    Destinations,
    Hotels,
    Testimonials,
    FAQs,
    Features,
    BookingSteps,
    Reservations,
  ],

  globals: [GalleryPage, HomePage, BookingProcessContent],

  editor: lexicalEditor(),

  plugins: payloadPlugins,

  serverURL,

  secret: process.env.PAYLOAD_SECRET || "default-secret-change-me",

  db: mongooseAdapter({
    url: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agency-travel",
  }),

  sharp,

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  cors: {
    origins: allowedOrigins,
    headers: corsHeaders,
  },
  csrf: allowedOrigins,
});
