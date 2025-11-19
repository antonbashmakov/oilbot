

//import lodash from 'lodash';

import dotenv from 'dotenv';


import {
    functions,
    express,
    admin,
    cors,
    api,
} from './imports.js';

const logger = functions.logger;

admin.initializeApp(functions.config().firebase, 'hooks');

dotenv.config();

const hooksApi = express();

hooksApi.use(cors({
    origin: true // allows all cross origin xhr requests
}));

export default hooksApi;