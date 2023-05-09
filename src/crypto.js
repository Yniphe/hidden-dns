import crypto from "node:crypto";

const SK = crypto
  .createHash("sha512")
  .update(process.env?.SECRET_KEY ?? "")
  .digest("hex")
  .substring(0, 32);

const SIV = crypto
  .createHash("sha512")
  .update(process.env?.SIV ?? "")
  .digest("hex")
  .substring(0, 16);

function padData(data) {
  // Дополняет данные до размера, кратного 16, с помощью PKCS7.
  const padLen = 16 - (data.length % 16);
  const padding = Buffer.alloc(padLen, padLen);
  return Buffer.concat([data, padding]);
}

function unpadData(data) {
  // Удаляет дополнение PKCS7 из данных.
  const padLen = data[data.length - 1];
  return data.slice(0, data.length - padLen);
}

export function encrypt(data) {
  // Шифрует данные, используя алгоритм AES.
  // Используем режим CBC и случайный вектор инициализации
  const cipher = crypto.createCipheriv("aes-256-cbc", SK, SIV);
  // Дополняем данные до размера, кратного 16
  const paddedData = padData(data);
  // Шифруем данные и добавляем вектор инициализации к зашифрованным данным
  const encryptedData = Buffer.concat([
    cipher.update(paddedData),
    cipher.final(),
  ]);
  return encryptedData;
}

export function decrypt(data) {
  // Расшифровывает данные, зашифрованные с помощью алгоритма AES.
  // Извлекаем вектор инициализации из входных данных
  const cipher = crypto.createDecipheriv("aes-256-cbc", SK, SIV);
  // Расшифровываем данные и удаляем дополнение PKCS7
  const decryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
  return decryptedData;
}
