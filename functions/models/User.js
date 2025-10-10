class User {
    constructor(uid, email, createdAt = new Date()) {
        this.id = uid;
        this.email = email;
        this.roles = ['customer'];
        this.createdAt = createdAt;
    }
}

export default User;