

//import lodash from 'lodash';

import dotenv from 'dotenv';


import {
    functions,
    express,
    admin,
    cors,
    GmailPushService,
    UserService,
    HistoryService,
    MessageWorker,
    MessageService,
    api,
    lodash,
} from './imports.js';

const logger = functions.logger;

admin.initializeApp(functions.config().firebase, 'hooks');

dotenv.config();

const hooksApi = express();

hooksApi.use(cors({
    origin: true // allows all cross origin xhr requests
}));
hooksApi.post('/payment', async (req, res) => {

    try {

    } catch (err) {
        logger.error(err);
        api.error(res, err.message);
    }


});

export default hooksApi;