export class UserDTO {
    constructor(user) {
        this.id = user._id || user.id;
        this.first_name = user.first_name;
        this.last_name = user.last_name;
        this.email = user.email;
        this.role = user.role;
    }

    static fromUser(user) {
        if (!user) return null;
        return new UserDTO(user);
    }

    static fromUsers(users = []) {
        return users.map((u) => new UserDTO(u));
    }
}

