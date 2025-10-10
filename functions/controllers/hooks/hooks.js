

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
hooksApi.post('/callback', async (req, res) => {

    res.sendStatus(200); // acknowledge message to avoid resend 


    const email = 'anton.bashmakov@lavia.se'; //GmailPushService.getEmailAddress(req.body);
    logger.info(`Update for email : ${email}`);

    // console.log('=============== 1', admin)
    const userService = new UserService(admin);
    const user = await userService.findByEmail(email);
    // console.log('=============== 2')

    if (!user) {
        logger.warn(`User with email ${email} is not found`);
        return;
    }
    logger.info('Following user found', { user });

    const { token, id, label } = user;

    if (!label) {
        logger.warn(`User with email ${email} is not subscribed`);
        return;
    }

    let messages = [];

    try {
        const gmailPushService = new GmailPushService(token);
        const historyService = new HistoryService(admin);

        const latestMessageFromHistory = await historyService.findLatestMessagesHistoryForUser(user);
        logger.info('Latest Message from History ', latestMessageFromHistory);

        if (latestMessageFromHistory) {
            messages = await gmailPushService.authorize().fetchAddedEmails(label.id, latestMessageFromHistory.historyId);
        } else {
            logger.info('No history, fetch all messages from label');
            messages = await gmailPushService.authorize().fetchLatestEmails(label.id);
        }

        logger.info('Messages to save ', messages?.length);

        if (!messages || !messages.length) {
            logger.info('No messages to fetch, return');
            return;
        }

        logger.info('Lets fetch messages from API');

        const promises = messages.map(message => gmailPushService.fetchMessage(message).catch((e) => {
            logger.warn(`Message ${message.id} was not fetched properly`, e );
            return;
        }));

        const results = await Promise.allSettled(promises);

        const objectsToSave = results.map((result) => {
            if (!result) {
                logger.warn('Rejection for email fetching see the logs before');
                return;
            }
            const { value } = result;

            if (!value) {
                logger.warn('Result with no value', result);
                return;
            }            

            const messageWorker = new MessageWorker();
            const message = messageWorker.fetchMetadata(value);

            if(!message) {
                logger.warn('Message was not parsed properly');
                return;

            }
            message.owner = { id };
            message.tags = [];
            return message;
        }).filter(Boolean);

        if (!objectsToSave.length) {
            logger.error('Messages from ids list was not fetched ');
            return;
        }

        const messagesMap = lodash.keyBy(messages, ({ id }) => id);

        objectsToSave.filter(({ id }) => {
            const ret = !!messagesMap[id];
            if (!ret) {
                logger.warn(`Message with id ${id} was fetched from server but not in the message map!`)
            }

            return ret;
        }).forEach(({ id, historyId }) => {
            messagesMap[id].historyId = historyId
        });

        const messageService = new MessageService(admin);

        await messageService.setAll(objectsToSave);
        logger.info('Saved messages to the DB', { numberOfMessagesSaved: objectsToSave.length });
        historyService.saveHistoryForUser(messages, user);
    } catch (err) {
        logger.error(err);
        api.error(res, err.message);
    }


});

export default hooksApi;