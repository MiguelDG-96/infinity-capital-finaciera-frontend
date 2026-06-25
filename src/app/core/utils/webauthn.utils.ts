export class WebAuthnUtils {
  
  // Decodes a base64url string to an ArrayBuffer
  static base64URLStringToBuffer(base64URLString: string): ArrayBuffer {
    const base64 = base64URLString.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64.padEnd(base64.length + padLength, '=');
    const binary = atob(padded);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  // Encodes an ArrayBuffer to a base64url string
  static bufferToBase64URLString(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // Prepares the JSON from backend (which has base64url encoded fields) into a PublicKeyCredentialCreationOptions object
  static parseCreationOptions(jsonStr: string): PublicKeyCredentialCreationOptions {
    const options = JSON.parse(jsonStr);
    
    // Convert challenge and user.id to ArrayBuffer
    options.publicKey.challenge = this.base64URLStringToBuffer(options.publicKey.challenge);
    options.publicKey.user.id = this.base64URLStringToBuffer(options.publicKey.user.id);
    
    // Exclude credentials mapping if present
    if (options.publicKey.excludeCredentials) {
      options.publicKey.excludeCredentials = options.publicKey.excludeCredentials.map((c: any) => ({
        ...c,
        id: this.base64URLStringToBuffer(c.id)
      }));
    }

    return options.publicKey as PublicKeyCredentialCreationOptions;
  }

  // Parses the Registration Response to JSON string for backend
  static serializeRegistrationResponse(cred: PublicKeyCredential): string {
    const response = cred.response as AuthenticatorAttestationResponse;
    const result = {
      id: cred.id,
      rawId: this.bufferToBase64URLString(cred.rawId),
      type: cred.type,
      response: {
        attestationObject: this.bufferToBase64URLString(response.attestationObject),
        clientDataJSON: this.bufferToBase64URLString(response.clientDataJSON)
      }
    };
    return JSON.stringify(result);
  }

  // Prepares the JSON from backend into a PublicKeyCredentialRequestOptions object
  static parseRequestOptions(jsonStr: string): PublicKeyCredentialRequestOptions {
    const options = JSON.parse(jsonStr);
    
    options.publicKey.challenge = this.base64URLStringToBuffer(options.publicKey.challenge);
    
    if (options.publicKey.allowCredentials) {
      options.publicKey.allowCredentials = options.publicKey.allowCredentials.map((c: any) => ({
        ...c,
        id: this.base64URLStringToBuffer(c.id)
      }));
    }

    return options.publicKey as PublicKeyCredentialRequestOptions;
  }

  // Parses the Assertion Response to JSON string for backend
  static serializeAssertionResponse(cred: PublicKeyCredential): string {
    const response = cred.response as AuthenticatorAssertionResponse;
    const result = {
      id: cred.id,
      rawId: this.bufferToBase64URLString(cred.rawId),
      type: cred.type,
      response: {
        authenticatorData: this.bufferToBase64URLString(response.authenticatorData),
        clientDataJSON: this.bufferToBase64URLString(response.clientDataJSON),
        signature: this.bufferToBase64URLString(response.signature),
        userHandle: response.userHandle ? this.bufferToBase64URLString(response.userHandle) : null
      }
    };
    return JSON.stringify(result);
  }
}
