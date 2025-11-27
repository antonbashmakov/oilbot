class User {
    id: string;
    email: string;
    roles: string[];
    created_at: Date;

    constructor(uid: string, email: string, created_at: Date = new Date()) {
        this.id = uid;
        this.email = email;
        this.roles = ['customer'];
        this.created_at = created_at;
    }
}

export default User;
