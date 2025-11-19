import { functions, admin, } from './imports.js';
const logger = functions.logger;
admin.initializeApp(functions.config().firebase, 'hooks');
export default {};
//# sourceMappingURL=hooks.js.map