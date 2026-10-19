import { UUID } from "crypto";
import connPool from "./db";

export type UserModel = {
    id: UUID;
    username: string;
    created_at: Date;
};
export type CredentialModel = {
    cred_id: string;
    cred_public_key: Uint8Array;
    user_id: UUID;
    webauthn_user_id: string;
    counter: number;
    device_type: string;
    backed_up: boolean;
    transports?: AuthenticatorTransport[];
};
export const getUser = async (username: string) => {
    const resp = await connPool.query("SELECT * FROM users WHERE username=$1", [
        username,
    ]);
    return resp;
};
export const createUser = async (username: string) => {
    const resp = await connPool.query(
        "INSERT INTO users (id, username) VALUES ($1, $2)",
        [crypto.randomUUID(), username]
    );
    return resp;
};
export const getCredentials = async (username: string) => {
    const resp = await connPool.query(
        `SELECT * FROM passkey_credentials p
      JOIN users u ON u.id = p.user_id
      WHERE u.username = $1`,
        [username]
    );
    return resp;
};
export const getCredentialsById = async (username: string, id: string) => {
    const resp = await connPool.query(
        `SELECT * FROM passkey_credentials p
      JOIN users u ON u.id = p.user_id
      WHERE u.username = $1
      AND p.cred_id = $2`,
        [username, id]
    );
    return resp;
};
export const changeStatus = async (
    status: "PENDING" | "COMPLETED",
    username: string
) => {
    const resp = await connPool.query(
        `UPDATE users 
            SET status = $1 
            WHERE username = $2
      `,
        [status, username]
    );
    return resp;
};
export const createPasskey = async (passkey: CredentialModel) => {
    const {
        cred_id,
        cred_public_key,
        user_id,
        webauthn_user_id,
        counter,
        device_type,
        backed_up,
        transports,
    } = passkey;
    const resp = await connPool.query(
        `INSERT INTO passkey_credentials (cred_id, cred_public_key, user_id, webauthn_user_id, counter, device_type, backed_up, transports) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            cred_id,
            cred_public_key,
            user_id,
            webauthn_user_id,
            counter,
            device_type,
            backed_up,
            transports?.join(","),
        ]
    );
    return resp;
};
