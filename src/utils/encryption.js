const crypto = require('crypto');

function encryptMessage(message, publicKeyPem) {
  const bufferMessage = Buffer.from(message, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, 
      oaepHash: 'sha256'
    },
    bufferMessage
  );
  return encrypted.toString('base64');
}
module.exports = encryptMessage