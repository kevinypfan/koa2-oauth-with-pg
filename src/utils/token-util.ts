import * as crypto from "crypto";

export const generateRandomToken = () => {
  return new Promise<string>((resolve, reject) => {
    crypto.randomBytes(256, (err, buf) => {
      if (err) reject(err);
      resolve(
        crypto
          .createHash("sha1")
          .update(buf)
          .digest("hex")
      );
    });
  });
};
