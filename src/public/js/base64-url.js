export function decode(str) {
  return Uint8Array.from(
    window.atob(str.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "")),
    (c) => c.charCodeAt(0)
  );
}

export function encode(buf) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buf]);
    const reader = new FileReader();

    reader.addEventListener("load", (e) => {
      const base64 = e.target.result.substring(e.target.result.indexOf(",") + 1);
      const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      resolve(base64url);
    });

    reader.addEventListener("error", reject);

    reader.readAsDataURL(blob);
  });
}
