import { Router } from "express";
import { getAll, getByEmail, updateUser } from "../controllers/user.controller.js";
const router = Router();

router.get ("/",  getAll);
router.get ("/:email", getByEmail);


router.put ("/:email", updateUser);



export default router;