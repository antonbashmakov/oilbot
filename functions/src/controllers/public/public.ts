import * as dotenv from "dotenv";

import {
  functions,
  cors,
  admin,
  express,
  api,
  UserService,
} from "./imports";
import User from "../../models/User";
import * as bcrypt from "bcrypt";
import {v4 as uuidv4} from "uuid";

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
  {origin: true} // allows all cross origin xhr requests
));

publicApi.use(express.json());

publicApi.post("/signup", async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return api.badRequest(res, "Missing required fields: email, password");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    const userId = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    const user = new User(userId, email, hash);
    await userService.createUser(user);

    user.password = 'p'; // remove hash from public

    // Return the created user
    return api.send(res, user);
  } catch (err: any) {
    functions.logger.error("Signup error:", err);
    return api.error(res, err.message || "Internal server error");
  }
});

export default publicApi;
