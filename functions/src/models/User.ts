class User {
    id: string;
    email: string;
    roles: string[];
    createdAt: Date;

    constructor(uid: string, email: string, createdAt: Date = new Date()) {
        this.id = uid;
        this.email = email;
        this.roles = ['customer'];
        this.createdAt = createdAt;
    }
}

export default User;
