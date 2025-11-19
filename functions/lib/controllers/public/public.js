import { functions, express, admin, cors, } from './imports.js';
import dotenv from 'dotenv';
admin.initializeApp(functions.config().firebase, 'public');
dotenv.config();
const publicApi = express();
publicApi.use(cors({ origin: true } // allows all cross origin xhr requests
));
//# sourceMappingURL=public.js.map