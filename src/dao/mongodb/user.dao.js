class UserDAO {

    asyn findByEmail(email) {
     
        return await userModel.findOne({ email });
    }

    async createUser(userData) {
        
}
}
export default UserDAO;