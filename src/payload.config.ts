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
const hasCloudinaryEnv =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

const payloadPlugins = hasCloudinaryEnv
  ? [
      payloadCloudinaryPlugin({
        collections: {
          media: true,
        },
        cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
        credentials: {
          apiKey: process.env.CLOUDINARY_API_KEY as string,
          apiSecret: process.env.CLOUDINARY_API_SECRET as string,
        },
        folder: process.env.CLOUDINARY_FOLDER || "agency-travel",
      }),
    ]
  : [];

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

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

  secret: process.env.PAYLOAD_SECRET || "default-secret-change-me",

  db: mongooseAdapter({
    url: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agency-travel",
  }),

  sharp,

  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },

  cors: allowedOrigins,
  csrf: allowedOrigins,
});
