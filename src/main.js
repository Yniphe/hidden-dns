import dgram from "node:dgram";
import { decrypt, encrypt } from "./crypto.js";

if (process.env.ST === "DNS") {
  const DECODER_IP = process.env.DECODER_IP;
  const DECODER_PORT = parseInt(process.env.DECODER_PORT);

  const dnsSocket = dgram.createSocket("udp4");

  dnsSocket.on("error", (err) => {
    console.log(err);
  });

  dnsSocket.on("message", (message, endpoint) => {
    try {
      const secureMessage = encrypt(message);
      const decoder = dgram.createSocket("udp4");

      decoder.on("message", (message) => {
        const unsecuredMessage = decrypt(message);

        dnsSocket.send(
          unsecuredMessage,
          0,
          unsecuredMessage.length,
          endpoint.port,
          endpoint.address
        );
      });

      decoder.send(secureMessage, DECODER_PORT, DECODER_IP);
    } catch (error) {
      console.log(error);
    }
  });

  dnsSocket.on("listening", () => {
    console.log("DNS Socket has Listening");
  });

  dnsSocket.bind(53, "0.0.0.0");
} else if (process.env.ST === "DECODER") {
  const DNS_PORT = 53;
  const DNS_SERVER = process.env.DNS_SERVER ?? "8.8.4.4"; // DNS-сервер Google

  const decoderSocket = dgram.createSocket("udp4");

  decoderSocket.on("error", () => {});
  decoderSocket.on("message", (message, endpoint) => {
    const client = dgram.createSocket("udp4");
    const msg = decrypt(message);
    client.send(msg, 0, msg.length, DNS_PORT, DNS_SERVER);
    client.on("message", (response) => {
      decoderSocket.send(encrypt(response), endpoint.port, endpoint.address);
    });
  });

  decoderSocket.bind(53842, "0.0.0.0");
  decoderSocket.on("listening", () => {
    console.log("Decoder Socket has Listening");
  });
} else {
  throw new Error("Ошибка запуска, тип сервера не определен");
}
