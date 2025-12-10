import * as dotenv from "dotenv";

import {
  functions,
  cors,
  admin,
  express,
  api,
  UserService,
} from "./imports";
import * as bcrypt from "bcrypt";
import {generateToken, who} from "../../services/utils";
import {User} from "../../models";
import {localeMiddleware} from "../../middleware/localeMiddleware";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

admin.initializeApp({}, "public");
dotenv.config();

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const userService = new UserService(db);

const publicApi = express();

publicApi.use(cors(
  {
    origin: [
      "https://posebestoimosti-473916.firebaseapp.com",
      "https://posebestoimosti-473916.web.app",
    ],
    credentials: true, // allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  } // allows all cross origin xhr requests
));

publicApi.use(localeMiddleware);

publicApi.use(express.json());

publicApi.post("/signup", async (req: express.Request, res: express.Response) => {
  try {
    const {email, password} = req.body;

    // Validate required fields
    if (!email || !password) {
      return api.badRequest(res, "Missing required fields: email, password");
    }

    // Validate email format

    if (!emailRegex.test(email)) {
      return api.badRequest(res, "Invalid email format");
    }

    // Validate password length
    if (password.length < 6) {
      return api.badRequest(res, "Password must be at least 6 characters");
    }

    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return api.badRequest(res, "User with this email already exists");
    }

    const hash = await bcrypt.hash(password, 10);
    const user: User = {
      id: "",
      email,
      password: hash,
      roles: [],
      created_at: new Date(),
    };

    const saved = await userService.add(user);

    saved.token = generateToken(saved);

    // Return the created user
    return api.send(res, saved);
  } catch (err: any) {
    functions.logger.error("Signup error:", err);
    return api.error(res, err.message || "Internal server error");
  }
});

publicApi.post("/login", async (req: express.Request, res: express.Response) => {
  try {
    const {email, password} = req.body;

    // Validate required fields
    if (!email || !password) {
      return api.badRequest(res, "Missing required fields: email, password");
    }
    if (!emailRegex.test(email)) {
      return api.badRequest(res, "Invalid email format");
    }
    const user = await userService.findByEmail(email);
    if (!user) {
      return api.unauthorized(res, "Invalid email or password");
    }

    const p = await userService.fetchPassword(user.id);

    const passwordMatch = await bcrypt.compare(password, p);
    if (!passwordMatch) {
      return api.unauthorized(res, "Invalid email or password");
    }

    // Remove password hash from response
    user.password = "p";
    user.token = generateToken(user);

    // Return the authenticated user
    return api.send(res, user);
  } catch (err: any) {
    functions.logger.error("Login error:", err);
    return api.error(res, err.message || "Internal server error");
  }
});

publicApi.get("/users/me", async (req: express.Request, res: express.Response) => {
  try {
    // Get user from request (set by authorize middleware)
    const user = await who(req, new UserService(db));

    if (!user) {
      return api.ok(res);
    }

    return api.send(res, user);
  } catch (err: any) {
    functions.logger.error(err);
    // The authorize function already sends error responses, so we just need to return
    // If error wasn't handled by authorize, handle it here
    if (!res.headersSent) {
      return api.error(res, err.message || "Internal server error");
    }
    return;
  }
});

export default publicApi;
