import {
  functions,
  admin,
} from './imports';

const logger = functions.logger;

admin.initializeApp(functions.config().firebase, 'hooks');

export default {};
