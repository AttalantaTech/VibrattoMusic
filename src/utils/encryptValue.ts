import CryptoJS from "crypto-js";

const secretKey = import.meta.env["VITE_VIBRATTO_ID_SECRET_KEY"] as string;

export function encryptValue(value: string): string {
	const encrypted = CryptoJS.AES.encrypt(value, secretKey);
	return encrypted.toString();
}

export function decryptValue(cipherText: string): string {
	const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
	return bytes.toString(CryptoJS.enc.Utf8);
}
