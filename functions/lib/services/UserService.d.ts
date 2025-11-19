import { AbstractService } from './AbstractService.js';
declare class UserService extends AbstractService {
    constructor(firebase: any);
    createUser(user: any): any;
    findByEmail(email: string): any;
    findWhereWatchWillExpiredInDays(days: number): void;
    getCollectionName(): string;
    getExcludedFields(): string[];
    clearUser(user: any): void;
}
export default UserService;
//# sourceMappingURL=UserService.d.ts.map