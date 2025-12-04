
class User {
  id: string;
  password: string;
  email: string;
  roles: string[];
  created_at: Date;

  constructor(uid: string, email: string, pass: string, created_at: Date = new Date()) {
    this.id = uid;
    this.email = email;
    this.roles = [];
    this.created_at = created_at;
    this.password = pass;
  }
}

export default User;
