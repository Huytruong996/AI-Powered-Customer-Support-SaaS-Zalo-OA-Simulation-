import { User } from "./user"

export interface Auth {
    data: {
        user : User
    },
    success: string,
    message: string
}