import { functions, cors, admin, express, } from './imports.js';
import dotenv from 'dotenv';
admin.initializeApp(functions.config().firebase, 'private');
dotenv.config();
const privateApi = express();
privateApi.use(cors({ origin: true } // allows all cross origin xhr requests
));
export default privateApi;
//# sourceMappingURL=private.js.map