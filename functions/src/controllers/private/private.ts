import {
  functions,
  cors,
  admin,
  express,
  api,
  ChatService,
} from "./imports";

import * as dotenv from "dotenv";
import * as cookieParser from "cookie-parser";

admin.initializeApp(functions.config().firebase, "private");
dotenv.config();

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const chatService = new ChatService(db);

const privateApi = express();

privateApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

privateApi.use(cookieParser());

privateApi.get("/customers/:customerId/chats/latest/messages", async (req: express.Request, res: express.Response) => {
  try {
    const { customerId } = req.params;
    const { oldestMessage} = req.query;

    const messages = await chatService.fetchMessages({ id: customerId }, 10, oldestMessage as string | undefined);

    return api.send(res, messages);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});


export default privateApi;
