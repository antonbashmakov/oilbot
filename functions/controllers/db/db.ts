import {
    functions,
    admin,
} from './imports';

const logger = functions.logger;

admin.initializeApp(functions.config().firebase, 'db');

const onUserCreated = functions.auth.user().onCreate(async (user) => {

});

export default {
    onUserCreated,
};
